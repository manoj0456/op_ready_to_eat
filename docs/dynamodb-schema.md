# ReadyToEat — DynamoDB Schema

Single-table-per-entity design (one table per resource type) using a
`PK`/`SK` composite key so each table can also serve hierarchical/related
queries without extra tables. All tables use on-demand capacity.

Conventions:

- `PK` / `SK` — partition key / sort key.
- `GSI-n` — global secondary index, listed as `PK` / `SK` for that index.
- Timestamps are ISO-8601 strings.

---

## Users

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `USER#<userId>` | |
| `SK` | `PROFILE` | |
| `email` | S | unique, also indexed |
| `name` | S | |
| `role` | S | `CUSTOMER` \| `RESTAURANT` \| `ADMIN` |
| `phone` | S | optional |
| `avatarUrl` | S | optional |
| `createdAt` | S | |

**GSI-1 (`EmailIndex`)**: `PK = email`, `SK = USER#<userId>` — lookup by email for login/uniqueness checks.

---

## Restaurants

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `RESTAURANT#<restaurantId>` | |
| `SK` | `PROFILE` | |
| `ownerId` | S | FK → Users |
| `name`, `description`, `cuisine` (SS), `address` (M) | | |
| `rating`, `reviewCount` | N | denormalized aggregate |
| `priceRange` | N | 1–4 |
| `isOpen` | BOOL | |
| `deliveryFee`, `minOrderAmount`, `estimatedDeliveryMinutes` | N | |
| `createdAt` | S | |

**GSI-1 (`OwnerIndex`)**: `PK = OWNER#<ownerId>`, `SK = RESTAURANT#<restaurantId>` — restaurants owned by a given user.
**GSI-2 (`CuisineIndex`)**: `PK = CUISINE#<cuisine>`, `SK = rating` — browse/filter by cuisine, sorted by rating.

---

## RestaurantSettings

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `RESTAURANT#<restaurantId>` | |
| `SK` | `SETTINGS` | |
| `acceptingOrders` | BOOL | |
| `openingHours` | L(M) | `{ day, openTime, closeTime, closed }` |
| `taxRate` | N | |
| `paymentMethods` | SS | |

Stored under the same partition as the restaurant profile (`RESTAURANT#<id>`) so both can be fetched with one `Query`.

---

## Menus / MenuCategories / MenuItems

**MenuCategories**

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `RESTAURANT#<restaurantId>` | |
| `SK` | `CATEGORY#<categoryId>` | |
| `name` | S | |
| `displayOrder` | N | |

**MenuItems**

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `RESTAURANT#<restaurantId>` | |
| `SK` | `ITEM#<categoryId>#<itemId>` | sort groups items by category |
| `name`, `description` | S | |
| `price` | N | |
| `imageUrl` | S | optional |
| `isAvailable`, `isVegetarian` | BOOL | |
| `tags` | SS | |

**GSI-1 (`ItemIndex`)**: `PK = ITEM#<itemId>`, `SK = RESTAURANT#<restaurantId>` — direct item lookup for order line items.

A restaurant's full menu (categories + items) is fetched with a single `Query` on `PK = RESTAURANT#<restaurantId>`, `SK begins_with CATEGORY#` / `ITEM#`.

---

## Orders

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `ORDER#<orderId>` | |
| `SK` | `METADATA` | |
| `customerId`, `restaurantId`, `restaurantName` | S | |
| `status` | S | `PENDING` \| `CONFIRMED` \| `PREPARING` \| `READY` \| `OUT_FOR_DELIVERY` \| `DELIVERED` \| `CANCELLED` |
| `subtotal`, `deliveryFee`, `tax`, `total` | N | |
| `deliveryAddress` | M | |
| `createdAt`, `updatedAt` | S | |

**GSI-1 (`CustomerIndex`)**: `PK = CUSTOMER#<customerId>`, `SK = createdAt` — a customer's order history, newest first.
**GSI-2 (`RestaurantIndex`)**: `PK = RESTAURANT#<restaurantId>`, `SK = createdAt` — a restaurant's incoming orders.
**GSI-3 (`StatusIndex`)**: `PK = status`, `SK = createdAt` — operational dashboards (e.g. all `PENDING` orders).

---

## OrderItems

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `ORDER#<orderId>` | |
| `SK` | `ITEM#<orderItemId>` | |
| `menuItemId`, `name` | S | |
| `price`, `quantity` | N | |
| `notes` | S | optional |

Stored in the same table/partition as `Orders` so an order and its line items are fetched together.

---

## Reviews

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `RESTAURANT#<restaurantId>` | |
| `SK` | `REVIEW#<reviewId>` | |
| `customerId`, `customerName`, `orderId` | S | |
| `rating` | N | 1–5 |
| `comment` | S | |
| `createdAt` | S | |

**GSI-1 (`CustomerReviewIndex`)**: `PK = CUSTOMER#<customerId>`, `SK = createdAt` — reviews written by a customer.

---

## Favorites

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `CUSTOMER#<customerId>` | |
| `SK` | `FAVORITE#<restaurantId>` | |
| `createdAt` | S | |

**GSI-1 (`RestaurantFavoriteIndex`)**: `PK = RESTAURANT#<restaurantId>`, `SK = CUSTOMER#<customerId>` — favorite count / who favorited a restaurant.

---

## Coupons

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `COUPON#<code>` | |
| `SK` | `METADATA` | |
| `restaurantId` | S | optional — platform-wide if absent |
| `discountType` | S | `PERCENTAGE` \| `FIXED` |
| `discountValue`, `minOrderAmount` | N | |
| `expiresAt` | S | |
| `isActive` | BOOL | |

**GSI-1 (`RestaurantCouponIndex`)**: `PK = RESTAURANT#<restaurantId>`, `SK = expiresAt` — coupons scoped to a restaurant.

---

## Notifications

| Attribute | Type | Notes |
| --- | --- | --- |
| `PK` | `USER#<userId>` | |
| `SK` | `NOTIFICATION#<createdAt>#<notificationId>` | sortable by time |
| `title`, `message` | S | |
| `read` | BOOL | |
| `createdAt` | S | |

Sort key embeds `createdAt` so a user's notification feed is a single `Query` in reverse-chronological order.
