import { getItem, putItem, deleteItem, updateItem, scan, TABLES } from '../db.mjs'
import { json } from '../response.mjs'
import { requireAuth, requireRole } from '../auth.mjs'
import { toUser, toRestaurant } from '../mappers.mjs'

function paginate(items, page = 1, pageSize = 20) {
  const p = Number(page) || 1
  const ps = Number(pageSize) || 20
  const start = (p - 1) * ps
  return { items: items.slice(start, start + ps), total: items.length, page: p, pageSize: ps }
}

async function requireAdmin(event) {
  const user = await requireAuth(event)
  requireRole(user, ['ADMIN'])
  return user
}

export async function listUsers(event, origin) {
  await requireAdmin(event)
  const params = event.queryStringParameters || {}
  const all = await scan(TABLES.USERS, {
    FilterExpression: 'SK = :sk',
    ExpressionAttributeValues: { ':sk': 'PROFILE' },
  })
  let filtered = all
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q),
    )
  }
  return json(200, paginate(filtered.map(toUser), params.page, params.pageSize), origin)
}

export async function updateUser(event, origin, userId) {
  await requireAdmin(event)
  const body = JSON.parse(event.body || '{}')
  const { name, phone, avatarUrl, role } = body
  const updated = await updateItem(TABLES.USERS, { PK: `USER#${userId}`, SK: 'PROFILE' }, { name, phone, avatarUrl, role })
  return json(200, toUser(updated), origin)
}

export async function deleteUser(event, origin, userId) {
  await requireAdmin(event)
  await deleteItem(TABLES.USERS, { PK: `USER#${userId}`, SK: 'PROFILE' })
  return json(200, {}, origin)
}

export async function listRestaurants(event, origin) {
  await requireAdmin(event)
  const params = event.queryStringParameters || {}
  const all = await scan(TABLES.RESTAURANTS, {
    FilterExpression: 'SK = :sk',
    ExpressionAttributeValues: { ':sk': 'PROFILE' },
  })
  return json(200, paginate(all.map(toRestaurant), params.page, params.pageSize), origin)
}

export async function updateRestaurant(event, origin, restaurantId) {
  await requireAdmin(event)
  const body = JSON.parse(event.body || '{}')
  const { id: _id, ownerId: _ownerId, createdAt: _createdAt, ...allowed } = body
  const updated = await updateItem(TABLES.RESTAURANTS, { PK: `RESTAURANT#${restaurantId}`, SK: 'PROFILE' }, allowed)
  return json(200, toRestaurant(updated), origin)
}

export async function getReports(event, origin) {
  await requireAdmin(event)
  const params = event.queryStringParameters || {}
  const orderItems = await scan(TABLES.ORDERS, {
    FilterExpression: 'SK = :sk',
    ExpressionAttributeValues: { ':sk': 'METADATA' },
  })
  let orders = orderItems
  if (params.from) orders = orders.filter((o) => o.createdAt >= params.from)
  if (params.to) orders = orders.filter((o) => o.createdAt <= params.to)

  const restaurants = await scan(TABLES.RESTAURANTS, {
    FilterExpression: 'SK = :sk',
    ExpressionAttributeValues: { ':sk': 'PROFILE' },
  })
  const users = await scan(TABLES.USERS, {
    FilterExpression: 'SK = :sk',
    ExpressionAttributeValues: { ':sk': 'PROFILE' },
  })

  const revenue = orders.filter((o) => o.status === 'DELIVERED').reduce((sum, o) => sum + (o.total || 0), 0)

  return json(
    200,
    {
      totalOrders: orders.length,
      totalRevenue: revenue,
      totalRestaurants: restaurants.length,
      totalCustomers: users.filter((u) => u.role === 'CUSTOMER').length,
    },
    origin,
  )
}

const SETTINGS_KEY = { PK: 'PLATFORM', SK: 'SETTINGS' }

export async function getSettings(event, origin) {
  await requireAdmin(event)
  const item = await getItem(TABLES.USERS, SETTINGS_KEY)
  return json(200, item ? { ...item, PK: undefined, SK: undefined } : {}, origin)
}

export async function updateSettings(event, origin) {
  await requireAdmin(event)
  const body = JSON.parse(event.body || '{}')
  const existing = (await getItem(TABLES.USERS, SETTINGS_KEY)) || SETTINGS_KEY
  const merged = { ...existing, ...body, ...SETTINGS_KEY }
  await putItem(TABLES.USERS, merged)
  return json(200, { ...merged, PK: undefined, SK: undefined }, origin)
}
