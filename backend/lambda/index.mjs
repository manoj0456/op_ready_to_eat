import * as auth from './lib/routes/auth.mjs'
import * as restaurants from './lib/routes/restaurants.mjs'
import * as menu from './lib/routes/menu.mjs'
import * as customers from './lib/routes/customers.mjs'
import * as orders from './lib/routes/orders.mjs'
import * as admin from './lib/routes/admin.mjs'
import { errorResponse, json } from './lib/response.mjs'

const ROUTES = [
  ['POST', ['auth', 'signup'], auth.signup],
  ['POST', ['auth', 'login'], auth.login],
  ['POST', ['auth', 'logout'], auth.logout],
  ['GET', ['auth', 'me'], auth.me],

  ['GET', ['restaurants'], restaurants.list],
  ['POST', ['restaurants'], restaurants.create],
  ['GET', ['restaurants', ':id'], restaurants.getById],
  ['PATCH', ['restaurants', ':id'], restaurants.update],
  ['GET', ['restaurants', ':id', 'settings'], restaurants.getSettings],
  ['PATCH', ['restaurants', ':id', 'settings'], restaurants.updateSettings],
  ['GET', ['restaurants', ':id', 'analytics'], restaurants.getAnalytics],

  ['GET', ['restaurants', ':restaurantId', 'menu'], menu.getMenu],
  ['POST', ['restaurants', ':restaurantId', 'menu', 'categories'], menu.createCategory],
  ['POST', ['restaurants', ':restaurantId', 'menu', 'items'], menu.createItem],
  ['PATCH', ['restaurants', ':restaurantId', 'menu', 'items', ':itemId'], menu.updateItemHandler],
  ['DELETE', ['restaurants', ':restaurantId', 'menu', 'items', ':itemId'], menu.deleteItemHandler],

  ['GET', ['customers', 'profile'], customers.getProfile],
  ['PATCH', ['customers', 'profile'], customers.updateProfile],
  ['GET', ['customers', 'favorites'], customers.getFavorites],
  ['POST', ['customers', 'favorites'], customers.addFavorite],
  ['DELETE', ['customers', 'favorites', ':restaurantId'], customers.removeFavorite],

  ['POST', ['orders'], orders.create],
  ['GET', ['orders'], orders.listMyOrders],
  ['GET', ['orders', ':id'], orders.getById],
  ['PATCH', ['orders', ':id'], orders.updateStatus],
  ['GET', ['restaurants', ':restaurantId', 'orders'], orders.listByRestaurant],

  ['GET', ['admin', 'users'], admin.listUsers],
  ['PATCH', ['admin', 'users', ':id'], admin.updateUser],
  ['DELETE', ['admin', 'users', ':id'], admin.deleteUser],
  ['GET', ['admin', 'restaurants'], admin.listRestaurants],
  ['PATCH', ['admin', 'restaurants', ':id'], admin.updateRestaurant],
  ['GET', ['admin', 'reports'], admin.getReports],
  ['GET', ['admin', 'settings'], admin.getSettings],
  ['PATCH', ['admin', 'settings'], admin.updateSettings],
]

function matchRoute(method, path) {
  const segments = path.split('/').filter(Boolean)
  for (const [routeMethod, template, handler] of ROUTES) {
    if (routeMethod !== method) continue
    if (template.length !== segments.length) continue

    const params = {}
    let matched = true
    for (let i = 0; i < template.length; i++) {
      const part = template[i]
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(segments[i])
      } else if (part !== segments[i]) {
        matched = false
        break
      }
    }
    if (matched) return { handler, params }
  }
  return null
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod
  const path = event.rawPath || event.path || '/'
  const origin = event.headers?.origin || event.headers?.Origin || ''

  if (method === 'OPTIONS') {
    return json(204, {}, origin)
  }

  const match = matchRoute(method, path)
  if (!match) return json(404, { message: 'Not found' }, origin)

  try {
    const orderedParams = Object.values(match.params)
    return await match.handler(event, origin, ...orderedParams)
  } catch (err) {
    return errorResponse(err, origin)
  }
}
