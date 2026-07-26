import { getItem, putItem, deleteItem, updateItem, query, TABLES } from '../db.mjs'
import { json } from '../response.mjs'
import { requireAuth } from '../auth.mjs'
import { toUser, toFavorite } from '../mappers.mjs'

export async function getProfile(event, origin) {
  const user = await requireAuth(event)
  return json(200, toUser(user), origin)
}

export async function updateProfile(event, origin) {
  const user = await requireAuth(event)
  const body = JSON.parse(event.body || '{}')
  const { name, phone, avatarUrl } = body
  const updated = await updateItem(
    TABLES.USERS,
    { PK: `USER#${user.sub}`, SK: 'PROFILE' },
    { name, phone, avatarUrl },
  )
  return json(200, toUser(updated), origin)
}

export async function getFavorites(event, origin) {
  const user = await requireAuth(event)
  const results = await query(TABLES.FAVORITES, {
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `CUSTOMER#${user.sub}` },
  })
  return json(200, results.map(toFavorite), origin)
}

export async function addFavorite(event, origin) {
  const user = await requireAuth(event)
  const body = JSON.parse(event.body || '{}')
  if (!body.restaurantId) throw new Error('restaurantId is required')

  const item = {
    PK: `CUSTOMER#${user.sub}`,
    SK: `FAVORITE#${body.restaurantId}`,
    createdAt: new Date().toISOString(),
  }
  await putItem(TABLES.FAVORITES, item)
  return json(201, toFavorite(item), origin)
}

export async function removeFavorite(event, origin, restaurantId) {
  const user = await requireAuth(event)
  await deleteItem(TABLES.FAVORITES, { PK: `CUSTOMER#${user.sub}`, SK: `FAVORITE#${restaurantId}` })
  return json(200, {}, origin)
}
