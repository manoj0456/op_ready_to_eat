import { getItem, putItem, updateItem, scan, query, TABLES } from '../db.mjs'
import { ApiError, json } from '../response.mjs'
import { requireAuth, requireRole } from '../auth.mjs'
import { toRestaurant, toRestaurantSettings } from '../mappers.mjs'

function paginate(items, page = 1, pageSize = 20) {
  const p = Number(page) || 1
  const ps = Number(pageSize) || 20
  const start = (p - 1) * ps
  return { items: items.slice(start, start + ps), total: items.length, page: p, pageSize: ps }
}

export async function list(event, origin) {
  const params = event.queryStringParameters || {}
  const all = await scan(TABLES.RESTAURANTS, {
    FilterExpression: 'SK = :sk',
    ExpressionAttributeValues: { ':sk': 'PROFILE' },
  })
  let filtered = all
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter((r) => (r.name || '').toLowerCase().includes(q))
  }
  if (params.cuisine) {
    filtered = filtered.filter((r) => (r.cuisine || []).includes(params.cuisine))
  }
  const page = paginate(filtered.map(toRestaurant), params.page, params.pageSize)
  return json(200, page, origin)
}

export async function getById(event, origin, restaurantId) {
  const item = await getItem(TABLES.RESTAURANTS, { PK: `RESTAURANT#${restaurantId}`, SK: 'PROFILE' })
  if (!item) throw new ApiError(404, 'Restaurant not found')
  return json(200, toRestaurant(item), origin)
}

export async function create(event, origin) {
  const user = await requireAuth(event)
  requireRole(user, ['RESTAURANT'])
  const body = JSON.parse(event.body || '{}')
  const key = { PK: `RESTAURANT#${user.sub}`, SK: 'PROFILE' }
  const existing = await getItem(TABLES.RESTAURANTS, key)
  if (existing) throw new ApiError(409, 'Restaurant already exists for this account')

  const now = new Date().toISOString()
  const item = {
    ...key,
    ownerId: user.sub,
    name: body.name || user.name,
    description: body.description || '',
    cuisine: body.cuisine || [],
    address: body.address || {},
    rating: 0,
    reviewCount: 0,
    priceRange: body.priceRange || 1,
    isOpen: Boolean(body.isOpen),
    deliveryFee: body.deliveryFee || 0,
    minOrderAmount: body.minOrderAmount || 0,
    estimatedDeliveryMinutes: body.estimatedDeliveryMinutes || 30,
    createdAt: now,
  }
  await putItem(TABLES.RESTAURANTS, item)
  return json(201, toRestaurant(item), origin)
}

async function assertOwnerOrAdmin(user, restaurantId) {
  if (user.role === 'ADMIN') return
  if (user.role === 'RESTAURANT' && user.sub === restaurantId) return
  throw new ApiError(403, 'Not authorized for this restaurant')
}

export async function update(event, origin, restaurantId) {
  const user = await requireAuth(event)
  await assertOwnerOrAdmin(user, restaurantId)
  const body = JSON.parse(event.body || '{}')
  const { id: _id, ownerId: _ownerId, createdAt: _createdAt, ...allowed } = body
  const updated = await updateItem(
    TABLES.RESTAURANTS,
    { PK: `RESTAURANT#${restaurantId}`, SK: 'PROFILE' },
    allowed,
  )
  return json(200, toRestaurant(updated), origin)
}

export async function getSettings(event, origin, restaurantId) {
  const user = await requireAuth(event)
  await assertOwnerOrAdmin(user, restaurantId)
  const item = await getItem(TABLES.RESTAURANTS, { PK: `RESTAURANT#${restaurantId}`, SK: 'SETTINGS' })
  if (!item) throw new ApiError(404, 'Settings not found')
  return json(200, toRestaurantSettings(item), origin)
}

export async function updateSettings(event, origin, restaurantId) {
  const user = await requireAuth(event)
  await assertOwnerOrAdmin(user, restaurantId)
  const body = JSON.parse(event.body || '{}')
  const updated = await updateItem(
    TABLES.RESTAURANTS,
    { PK: `RESTAURANT#${restaurantId}`, SK: 'SETTINGS' },
    body,
  )
  return json(200, toRestaurantSettings(updated), origin)
}

export async function getAnalytics(event, origin, restaurantId) {
  const user = await requireAuth(event)
  await assertOwnerOrAdmin(user, restaurantId)
  const params = event.queryStringParameters || {}

  const metadataItems = await query(TABLES.ORDERS, {
    IndexName: 'RestaurantIndex',
    KeyConditionExpression: 'GSI2PK = :pk',
    ExpressionAttributeValues: { ':pk': `RESTAURANT#${restaurantId}` },
  })

  let orders = metadataItems
  if (params.from) orders = orders.filter((o) => o.createdAt >= params.from)
  if (params.to) orders = orders.filter((o) => o.createdAt <= params.to)

  const byStatus = {}
  let revenue = 0
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1
    if (o.status === 'DELIVERED') revenue += o.total || 0
  }

  return json(
    200,
    { totalOrders: orders.length, revenue, ordersByStatus: byStatus },
    origin,
  )
}
