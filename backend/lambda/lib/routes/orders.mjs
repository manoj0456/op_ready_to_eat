import { randomUUID } from 'node:crypto'
import { getItem, putItem, updateItem, query, TABLES } from '../db.mjs'
import { ApiError, json } from '../response.mjs'
import { requireAuth, requireRole } from '../auth.mjs'
import { toOrder } from '../mappers.mjs'

const TAX_RATE = 0.08

function paginate(items, page = 1, pageSize = 20) {
  const p = Number(page) || 1
  const ps = Number(pageSize) || 20
  const start = (p - 1) * ps
  return { items: items.slice(start, start + ps), total: items.length, page: p, pageSize: ps }
}

async function loadOrder(orderId) {
  const results = await query(TABLES.ORDERS, {
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `ORDER#${orderId}` },
  })
  const metadata = results.find((r) => r.SK === 'METADATA')
  const items = results.filter((r) => r.SK.startsWith('ITEM#'))
  return metadata ? { metadata, items } : null
}

async function findMenuItemBySK(restaurantId, menuItemId) {
  const results = await query(TABLES.MENUS, {
    IndexName: 'ItemIndex',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': `ITEM#${menuItemId}` },
  })
  return results.find((r) => r.PK === `RESTAURANT#${restaurantId}`) || null
}

export async function create(event, origin) {
  const user = await requireAuth(event)
  requireRole(user, ['CUSTOMER'])
  const body = JSON.parse(event.body || '{}')
  const { restaurantId, items, deliveryAddress, expectedArrivalTime, guestCount, specialInstructions } = body

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'restaurantId and items are required')
  }
  if (!expectedArrivalTime) throw new ApiError(400, 'expectedArrivalTime is required')

  const restaurant = await getItem(TABLES.RESTAURANTS, { PK: `RESTAURANT#${restaurantId}`, SK: 'PROFILE' })
  if (!restaurant) throw new ApiError(404, 'Restaurant not found')

  const resolvedItems = []
  for (const line of items) {
    const menuItem = await findMenuItemBySK(restaurantId, line.menuItemId)
    if (!menuItem) throw new ApiError(400, `Menu item ${line.menuItemId} not found`)
    resolvedItems.push({
      id: randomUUID(),
      menuItemId: line.menuItemId,
      name: menuItem.name,
      price: menuItem.price,
      quantity: line.quantity || 1,
      notes: line.notes,
    })
  }

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const deliveryFee = restaurant.deliveryFee || 0
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100

  const orderId = randomUUID()
  const now = new Date().toISOString()
  const metadata = {
    PK: `ORDER#${orderId}`,
    SK: 'METADATA',
    GSI1PK: `CUSTOMER#${user.sub}`,
    GSI1SK: now,
    GSI2PK: `RESTAURANT#${restaurantId}`,
    GSI2SK: now,
    GSI3PK: 'PENDING',
    GSI3SK: now,
    customerId: user.sub,
    restaurantId,
    restaurantName: restaurant.name,
    status: 'PENDING',
    subtotal,
    deliveryFee,
    tax,
    total,
    deliveryAddress: deliveryAddress || {},
    expectedArrivalTime,
    guestCount: guestCount || 1,
    specialInstructions,
    createdAt: now,
    updatedAt: now,
  }
  await putItem(TABLES.ORDERS, metadata)
  for (const item of resolvedItems) {
    await putItem(TABLES.ORDERS, { PK: `ORDER#${orderId}`, SK: `ITEM#${item.id}`, ...item })
  }

  return json(201, toOrder(metadata, resolvedItems.map((i) => ({ SK: `ITEM#${i.id}`, ...i }))), origin)
}

async function assertCanView(user, metadata) {
  if (user.role === 'ADMIN') return
  if (user.role === 'CUSTOMER' && metadata.customerId === user.sub) return
  if (user.role === 'RESTAURANT' && metadata.restaurantId === user.sub) return
  throw new ApiError(403, 'Not authorized for this order')
}

export async function getById(event, origin, orderId) {
  const user = await requireAuth(event)
  const found = await loadOrder(orderId)
  if (!found) throw new ApiError(404, 'Order not found')
  await assertCanView(user, found.metadata)
  return json(200, toOrder(found.metadata, found.items), origin)
}

export async function listMyOrders(event, origin) {
  const user = await requireAuth(event)
  requireRole(user, ['CUSTOMER'])
  const params = event.queryStringParameters || {}

  const results = await query(TABLES.ORDERS, {
    IndexName: 'CustomerIndex',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': `CUSTOMER#${user.sub}` },
    ScanIndexForward: false,
  })
  let orders = results
  if (params.status) orders = orders.filter((o) => o.status === params.status)
  const mapped = orders.map((o) => toOrder(o, []))
  return json(200, paginate(mapped, params.page, params.pageSize), origin)
}

export async function listByRestaurant(event, origin, restaurantId) {
  const user = await requireAuth(event)
  if (user.role !== 'ADMIN' && !(user.role === 'RESTAURANT' && user.sub === restaurantId)) {
    throw new ApiError(403, 'Not authorized for this restaurant')
  }
  const params = event.queryStringParameters || {}

  const results = await query(TABLES.ORDERS, {
    IndexName: 'RestaurantIndex',
    KeyConditionExpression: 'GSI2PK = :pk',
    ExpressionAttributeValues: { ':pk': `RESTAURANT#${restaurantId}` },
    ScanIndexForward: false,
  })
  let orders = results
  if (params.status) orders = orders.filter((o) => o.status === params.status)
  const mapped = orders.map((o) => toOrder(o, []))
  return json(200, paginate(mapped, params.page, params.pageSize), origin)
}

const VALID_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]

export async function updateStatus(event, origin, orderId) {
  const user = await requireAuth(event)
  const found = await loadOrder(orderId)
  if (!found) throw new ApiError(404, 'Order not found')

  const body = JSON.parse(event.body || '{}')
  const { status } = body
  if (!VALID_STATUSES.includes(status)) throw new ApiError(400, 'Invalid status')

  if (user.role === 'CUSTOMER') {
    if (found.metadata.customerId !== user.sub) throw new ApiError(403, 'Not authorized')
    if (status !== 'CANCELLED' || found.metadata.status !== 'PENDING') {
      throw new ApiError(403, 'Customers may only cancel a pending order')
    }
  } else if (user.role === 'RESTAURANT') {
    if (found.metadata.restaurantId !== user.sub) throw new ApiError(403, 'Not authorized')
  } else if (user.role !== 'ADMIN') {
    throw new ApiError(403, 'Not authorized')
  }

  const now = new Date().toISOString()
  const updated = await updateItem(
    TABLES.ORDERS,
    { PK: `ORDER#${orderId}`, SK: 'METADATA' },
    { status, GSI3PK: status, GSI3SK: now, updatedAt: now },
  )
  return json(200, toOrder(updated, found.items), origin)
}
