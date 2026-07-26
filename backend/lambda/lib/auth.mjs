import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { getItem, TABLES } from './db.mjs'
import { ApiError } from './response.mjs'

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
})

export function getBearerToken(event) {
  const header = event.headers?.authorization || event.headers?.Authorization
  if (!header || !header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length)
}

export async function requireAuth(event) {
  const token = getBearerToken(event)
  if (!token) throw new ApiError(401, 'Missing bearer token')

  let claims
  try {
    claims = await verifier.verify(token)
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  const user = await getItem(TABLES.USERS, { PK: `USER#${claims.sub}`, SK: 'PROFILE' })
  if (!user) throw new ApiError(401, 'User record not found')

  return { sub: claims.sub, ...user }
}

export function requireRole(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, `Requires role: ${allowedRoles.join(' or ')}`)
  }
}
