# ReadyToEat — API Structure

This document describes the REST contract the frontend is built against
(`src/api/*`, `src/constants/api.ts`). The backend is expected to implement
these endpoints; none exist yet in Phase 1.

- Base URL: `VITE_API_BASE_URL` (see `.env.development` / `.env.production`).
- Auth: `Authorization: Bearer <Cognito access token>` on every request
  except `POST /auth/signup` and `POST /auth/login`. Attached automatically
  by the Axios interceptor in `src/api/client.ts`.
- Errors: JSON body `{ message: string, code?: string }`; the client
  normalizes this into `ApiError` (`src/types/index.ts`) and surfaces a 401
  as an automatic logout.

## Auth — `src/api/auth.ts`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/login` | Exchange credentials for a session (also handled client-side via Cognito directly) |
| POST | `/auth/signup` | Create a user record after Cognito sign-up |
| POST | `/auth/logout` | Invalidate server-side session state, if any |
| GET  | `/auth/me` | Return the current authenticated user |

## Restaurants — `src/api/restaurant.ts`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/restaurants` | Paginated list, filters: `page`, `pageSize`, `search`, `cuisine` |
| GET | `/restaurants/:id` | Restaurant profile |
| POST | `/restaurants` | Create a restaurant (role: `RESTAURANT`) |
| PATCH | `/restaurants/:id` | Update restaurant profile |
| GET | `/restaurants/:id/settings` | Operational settings |
| PATCH | `/restaurants/:id/settings` | Update settings |
| GET | `/restaurants/:id/analytics` | Aggregate metrics, filters: `from`, `to` |

## Menu — `src/api/menu.ts`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/restaurants/:restaurantId/menu` | `{ categories: MenuCategory[], items: MenuItem[] }` |
| POST | `/restaurants/:restaurantId/menu/categories` | Create category |
| POST | `/restaurants/:restaurantId/menu/items` | Create item |
| PATCH | `/restaurants/:restaurantId/menu/items/:itemId` | Update item |
| DELETE | `/restaurants/:restaurantId/menu/items/:itemId` | Remove item |

## Customers — `src/api/customer.ts`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/customers/profile` | Current customer profile |
| PATCH | `/customers/profile` | Update profile |
| GET | `/customers/favorites` | List favorite restaurants |
| POST | `/customers/favorites` | Add a favorite, body `{ restaurantId }` |
| DELETE | `/customers/favorites/:restaurantId` | Remove a favorite |

## Orders — `src/api/order.ts`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/orders` | Create an order from cart items |
| GET | `/orders/:id` | Order detail |
| GET | `/orders` | Current customer's orders, filters: `page`, `pageSize`, `status` |
| GET | `/restaurants/:restaurantId/orders` | A restaurant's incoming orders |
| PATCH | `/orders/:id` | Update status, body `{ status }` |

## Admin — `src/api/admin.ts`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/users` | Paginated users, filters: `page`, `pageSize`, `search` |
| PATCH | `/admin/users/:id` | Update a user |
| DELETE | `/admin/users/:id` | Remove a user |
| GET | `/admin/restaurants` | Paginated restaurants |
| PATCH | `/admin/restaurants/:id` | Approve/update a restaurant |
| GET | `/admin/reports` | Platform-wide metrics, filters: `from`, `to` |
| GET | `/admin/settings` | Platform settings |
| PATCH | `/admin/settings` | Update platform settings |

## Pagination

List endpoints return:

```ts
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

## Adding a new endpoint

1. Add the path to `API_ENDPOINTS` in `src/constants/api.ts`.
2. Add a typed function to the relevant module in `src/api/`.
3. Wrap it in a TanStack Query hook under `src/hooks/` if it's consumed by more than one page.
