This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment variables

Copy `.env.example` to `.env` and fill in values.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | **Pooled** Postgres URL for the app (`pooled.db.prisma.io` on Prisma Postgres) |
| `DIRECT_URL` | **Direct** URL for Prisma CLI migrations (`db.prisma.io` on Prisma Postgres) |
| `BETTER_AUTH_SECRET` | Secret for signing sessions (long random string) |
| `BETTER_AUTH_URL` | Public base URL of this app (e.g. `http://localhost:3000`) — used for OAuth redirects |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (mobile app uses Better Auth Expo + Google sign-in) |

In Google Cloud Console, set the OAuth **Authorized redirect URI** to:

`${BETTER_AUTH_URL}/api/auth/callback/google`

(Player accounts use the default Prisma `User.role` of `PLAYER` when created via social login.)

### Database connection

The app supports either:

| Variable | Format | Used for |
|----------|--------|----------|
| `DATABASE_URL` | `prisma+postgres://...` (Accelerate) | App runtime when `POSTGRES_URL` is unset |
| `POSTGRES_URL` | `postgres://...@pooled.db.prisma.io...` | App runtime via `@prisma/adapter-pg` (overrides Accelerate) |
| `DIRECT_URL` | `postgres://...@db.prisma.io...` | `prisma migrate` / Studio |

Run `npm run db:test` to verify. For TCP URLs from [Prisma Console](https://console.prisma.io), copy **pooled** + **direct** strings as in `.env.example`.

### npm peer dependencies

This project uses `--legacy-peer-deps` because `next` is a canary release and some peers resolve strictly. An `.npmrc` with `legacy-peer-deps=true` is included; otherwise run:

```bash
npm install --legacy-peer-deps
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
