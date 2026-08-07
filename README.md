# ReadyToEat

App helps restaurants and customers to prebook order to eat before reaching restaurant that saves time and helps restaurants to get more time to serve.
\

## Phase 1 — Frontend foundation

React 19 + Vite + TypeScript SPA with role-based routing (customer/restaurant/admin), AWS Cognito auth scaffolding, and a typed API layer. See [`docs/architecture.md`](docs/architecture.md), [`docs/dynamodb-schema.md`](docs/dynamodb-schema.md), and [`docs/api-structure.md`](docs/api-structure.md) for details.

## Tech stack

React 19 · Vite · TypeScript · React Router v6 · MUI v6 · TanStack Query v5 · Axios · React Hook Form + Zod · AWS Cognito (`amazon-cognito-identity-js`) · ESLint + Prettier

## Getting started

```bash
npm install --legacy-peer-deps
cp .env.example .env.development   # fill in Cognito/API values
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with autofix |
| `npm run format` | Format `src/` with Prettier |
| `npm run preview` | Preview the production build locally |

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`: install → lint → build → sync `dist/` to S3 → invalidate CloudFront. Requires the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID` repository secrets.
