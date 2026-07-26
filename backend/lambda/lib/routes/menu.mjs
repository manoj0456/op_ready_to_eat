import { randomUUID } from 'node:crypto'
import { putItem, deleteItem, query, TABLES } from '../db.mjs'
import { ApiError, json, noContent } from '../response.mjs'
import { requireAuth } from '../auth.mjs'
import { toMenuCategory, toMenuItem } from '../mappers.mjs'

async function assertOwner(user, restaurantId) {
  if (user.role === 'ADMIN') return
  if (user.role === 'RESTAURANT' && user.sub === restaurantId) return
  throw new ApiError(403, 'Not authorized for this restaurant')
}

async function findItemBySK(restaurantId, itemId) {
  const results = await query(TABLES.MENUS, {
    IndexName: 'ItemIndex',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': `ITEM#${itemId}` },
  })
  return results.find((r) => r.PK === `RESTAURANT#${restaurantId}`) || null
}

export async function getMenu(event, origin, restaurantId) {
  const results = await query(TABLES.MENUS, {
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `RESTAURANT#${restaurantId}` },
  })
  const categories = results.filter((r) => r.SK.startsWith('CATEGORY#')).map(toMenuCategory)
  const items = results.filter((r) => r.SK.startsWith('ITEM#')).map(toMenuItem)
  return json(200, { categories, items }, origin)
}

export async function createCategory(event, origin, restaurantId) {
  const user = await requireAuth(event)
  await assertOwner(user, restaurantId)
  const body = JSON.parse(event.body || '{}')
  if (!body.name) throw new ApiError(400, 'name is required')

  const categoryId = randomUUID()
  const item = {
    PK: `RESTAURANT#${restaurantId}`,
    SK: `CATEGORY#${categoryId}`,
    name: body.name,
    displayOrder: body.displayOrder || 0,
  }
  await putItem(TABLES.MENUS, item)
  return json(201, toMenuCategory(item), origin)
}

export async function createItem(event, origin, restaurantId) {
  const user = await requireAuth(event)
  await assertOwner(user, restaurantId)
  const body = JSON.parse(event.body || '{}')
  if (!body.name || !body.categoryId || body.price === undefined) {
    throw new ApiError(400, 'name, categoryId and price are required')
  }

  const itemId = randomUUID()
  const item = {
    PK: `RESTAURANT#${restaurantId}`,
    SK: `ITEM#${body.categoryId}#${itemId}`,
    GSI1PK: `ITEM#${itemId}`,
    GSI1SK: `RESTAURANT#${restaurantId}`,
    name: body.name,
    description: body.description || '',
    price: body.price,
    imageUrl: body.imageUrl,
    isAvailable: body.isAvailable !== false,
    isVegetarian: Boolean(body.isVegetarian),
    tags: body.tags || [],
  }
  await putItem(TABLES.MENUS, item)
  return json(201, toMenuItem(item), origin)
}

export async function updateItemHandler(event, origin, restaurantId, itemId) {
  const user = await requireAuth(event)
  await assertOwner(user, restaurantId)
  const existing = await findItemBySK(restaurantId, itemId)
  if (!existing) throw new ApiError(404, 'Menu item not found')

  const body = JSON.parse(event.body || '{}')
  const merged = { ...existing, ...body }
  delete merged.id
  delete merged.restaurantId
  delete merged.categoryId
  await putItem(TABLES.MENUS, merged)
  return json(200, toMenuItem(merged), origin)
}

export async function deleteItemHandler(event, origin, restaurantId, itemId) {
  const user = await requireAuth(event)
  await assertOwner(user, restaurantId)
  const existing = await findItemBySK(restaurantId, itemId)
  if (!existing) throw new ApiError(404, 'Menu item not found')
  await deleteItem(TABLES.MENUS, { PK: existing.PK, SK: existing.SK })
  return noContent(origin)
}
