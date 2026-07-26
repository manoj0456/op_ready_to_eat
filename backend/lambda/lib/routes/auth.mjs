import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { getItem, putItem, TABLES } from '../db.mjs'
import { ApiError, json } from '../response.mjs'
import { requireAuth } from '../auth.mjs'
import { toUser } from '../mappers.mjs'

const cognito = new CognitoIdentityProviderClient({})

async function findCognitoSubByEmail(email) {
  try {
    const res = await cognito.send(
      new AdminGetUserCommand({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: email }),
    )
    return res.UserAttributes.find((a) => a.Name === 'sub')?.Value
  } catch {
    return null
  }
}

export async function signup(event, origin) {
  const body = JSON.parse(event.body || '{}')
  const { name, email, role } = body
  if (!name || !email || !role) throw new ApiError(400, 'name, email and role are required')
  if (!['CUSTOMER', 'RESTAURANT'].includes(role)) throw new ApiError(400, 'Invalid role')

  const sub = await findCognitoSubByEmail(email)
  if (!sub) throw new ApiError(400, 'No matching Cognito account for this email')

  const now = new Date().toISOString()
  const existing = await getItem(TABLES.USERS, { PK: `USER#${sub}`, SK: 'PROFILE' })
  const userItem = existing ?? {
    PK: `USER#${sub}`,
    SK: 'PROFILE',
    GSI1PK: email,
    GSI1SK: `USER#${sub}`,
    email,
    name,
    role,
    createdAt: now,
  }
  if (!existing) await putItem(TABLES.USERS, userItem)

  if (role === 'RESTAURANT') {
    const restaurantKey = { PK: `RESTAURANT#${sub}`, SK: 'PROFILE' }
    const existingRestaurant = await getItem(TABLES.RESTAURANTS, restaurantKey)
    if (!existingRestaurant) {
      await putItem(TABLES.RESTAURANTS, {
        ...restaurantKey,
        ownerId: sub,
        name,
        description: '',
        cuisine: [],
        address: {},
        rating: 0,
        reviewCount: 0,
        priceRange: 1,
        isOpen: false,
        deliveryFee: 0,
        minOrderAmount: 0,
        estimatedDeliveryMinutes: 30,
        createdAt: now,
      })
      await putItem(TABLES.RESTAURANTS, {
        PK: `RESTAURANT#${sub}`,
        SK: 'SETTINGS',
        acceptingOrders: false,
        openingHours: [],
        taxRate: 0,
        paymentMethods: [],
      })
    }
  }

  return json(201, { user: toUser(userItem) }, origin)
}

export async function login(event, origin) {
  const body = JSON.parse(event.body || '{}')
  const { email, password } = body
  if (!email || !password) throw new ApiError(400, 'email and password are required')

  let authResult
  try {
    const res = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    )
    authResult = res.AuthenticationResult
  } catch {
    throw new ApiError(401, 'Invalid email or password')
  }
  if (!authResult) throw new ApiError(401, 'Invalid email or password')

  const sub = await findCognitoSubByEmail(email)
  const user = sub ? await getItem(TABLES.USERS, { PK: `USER#${sub}`, SK: 'PROFILE' }) : null
  if (!user) throw new ApiError(404, 'User record not found')

  return json(200, { user: toUser(user) }, origin)
}

export async function logout(event, origin) {
  await requireAuth(event)
  return json(200, {}, origin)
}

export async function me(event, origin) {
  const user = await requireAuth(event)
  return json(200, toUser(user), origin)
}
