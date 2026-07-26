import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

export const TABLES = {
  USERS: process.env.TABLE_USERS,
  RESTAURANTS: process.env.TABLE_RESTAURANTS,
  MENUS: process.env.TABLE_MENUS,
  ORDERS: process.env.TABLE_ORDERS,
  REVIEWS: process.env.TABLE_REVIEWS,
  FAVORITES: process.env.TABLE_FAVORITES,
  COUPONS: process.env.TABLE_COUPONS,
  NOTIFICATIONS: process.env.TABLE_NOTIFICATIONS,
}

export async function getItem(TableName, Key) {
  const res = await ddb.send(new GetCommand({ TableName, Key }))
  return res.Item ?? null
}

export async function putItem(TableName, Item) {
  await ddb.send(new PutCommand({ TableName, Item }))
  return Item
}

export async function deleteItem(TableName, Key) {
  await ddb.send(new DeleteCommand({ TableName, Key }))
}

export async function query(TableName, params) {
  const res = await ddb.send(new QueryCommand({ TableName, ...params }))
  return res.Items ?? []
}

export async function scan(TableName, params = {}) {
  const res = await ddb.send(new ScanCommand({ TableName, ...params }))
  return res.Items ?? []
}

export async function updateItem(TableName, Key, updates) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return getItem(TableName, Key)

  const ExpressionAttributeNames = {}
  const ExpressionAttributeValues = {}
  const sets = entries.map(([k, v], i) => {
    const nameKey = `#f${i}`
    const valueKey = `:v${i}`
    ExpressionAttributeNames[nameKey] = k
    ExpressionAttributeValues[valueKey] = v
    return `${nameKey} = ${valueKey}`
  })

  const res = await ddb.send(
    new UpdateCommand({
      TableName,
      Key,
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }),
  )
  return res.Attributes
}
