# ReadyToEat — Architecture

## Overview

ReadyToEat is a multi-tenant food ordering SaaS platform with three user roles:
**Customer**, **Restaurant**, and **Admin**. Phase 1 delivers the frontend
application shell: routing, auth scaffolding, API layer, and UI foundations.
The backend (API Gateway + Lambda + DynamoDB) is assumed but not implemented
in this phase — the frontend is built against the contract described in
[`api-structure.md`](./api-structure.md).

## High-level topology

```
┌─────────────┐      ┌──────────────┐      ┌───────────────────┐
│   Browser    │────▶│  CloudFront   │────▶│   S3 (static SPA)  │
└─────────────┘      └──────────────┘      └───────────────────┘
       │
       │ REST calls (Authorization: Bearer <Cognito JWT>)
       ▼
┌─────────────┐      ┌──────────────┐      ┌───────────────────┐
│ API Gateway  │────▶│   Lambda      │────▶│     DynamoDB       │
└─────────────┘      └──────────────┘      └───────────────────┘
       ▲
       │
┌─────────────┐
│   Cognito    │
│ User Pool    │
└─────────────┘
```

## Frontend architecture

- **Build tool**: Vite + React 19 + TypeScript.
- **Routing**: React Router v6, defined centrally in `src/routes/index.tsx`
  using a nested-route tree. Each role has a dedicated layout
  (`CustomerLayout`, `RestaurantLayout`, `AdminLayout`) mounted behind
  `ProtectedRoute` (requires authentication) and `RoleRoute` (requires a
  specific role).
- **State**:
  - Server state is owned by **TanStack Query** (`src/hooks/*`, `src/api/*`).
    Every API module returns typed promises; hooks wrap them in
    `useQuery`/`useMutation` with cache invalidation on mutation.
  - Client/UI state (auth session, cart, snackbar) is owned by React
    **Context** (`src/context/*`), each exposed through a matching hook in
    `src/hooks/*` for a consistent access pattern.
- **Auth**: AWS Cognito via `amazon-cognito-identity-js`
  (`src/services/cognitoService.ts`). `AuthContext` wraps the Cognito SDK,
  persists tokens to `localStorage`, and decodes the ID token to derive the
  current user's role and profile. Axios attaches the access token to every
  request (`src/api/client.ts`); a 401 response triggers automatic logout.
- **Forms**: React Hook Form + Zod resolvers for schema validation
  (`src/utils/validators.ts`), with reusable `FormField`/`FormSelect`/
  `FormDatePicker` components that wire `Controller` to MUI inputs.
- **UI**: Material UI v6 with a centralized theme (`src/styles/theme.ts`).
  Layout primitives (`AppShell`, `Navbar`, `Sidebar`, `Footer`, `PageHeader`)
  are shared across all four layouts to keep chrome consistent.

## Directory layout

```
src/
├── api/          # Typed HTTP calls per domain (auth, restaurant, customer, order, admin, menu)
├── components/
│   ├── common/   # Generic, app-agnostic UI primitives
│   ├── forms/    # React Hook Form + MUI bindings
│   └── layout/   # Navbar, Sidebar, Footer, AppShell, PageHeader
├── constants/    # API endpoints, route paths, role enum
├── context/      # AuthContext, SnackbarContext, CartContext
├── hooks/        # Thin hooks over context + TanStack Query
├── layouts/      # Route-level layout wrappers (one per audience)
├── pages/        # Route screens, grouped by audience
├── routes/       # Router tree + ProtectedRoute + RoleRoute
├── services/     # Cognito SDK wrapper
├── styles/       # MUI theme + global CSS
├── types/        # Shared domain interfaces
└── utils/        # Formatters, validators, app-wide constants
```

## Environments

Three environment files drive `import.meta.env.VITE_*` values:

| File               | Purpose                                    |
| ------------------ | ------------------------------------------- |
| `.env.development`  | Local development, points at dev API/CDN   |
| `.env.production`   | Production build, points at prod API/CDN   |
| `.env.example`      | Documents required keys, committed with no values |

## Deployment

`.github/workflows/deploy.yml` builds the app on every push to `main`,
lints and type-checks it, then syncs the `dist/` output to an S3 bucket and
invalidates the CloudFront distribution serving it. See that file for the
exact steps and required repository secrets/variables.

## Future phases (not in scope for Phase 1)

- Backend API implementation (Lambda handlers, DynamoDB access layer).
- Real-time order status updates (WebSocket/AppSync).
- Payment processing integration.
- Automated test suites (unit/e2e).
