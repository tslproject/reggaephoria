# REGGAEPHORIA TANGSEL

Production-oriented digital ticketing application built with Next.js 15 App Router, TypeScript, Tailwind CSS, Prisma 6, and PostgreSQL (Neon).

## Features

- Public event and ticket catalog backed by PostgreSQL
- Customer checkout with inventory/quota validation and optional promotions
- Manual DANA/BCA transfer instructions and logged `wa.me` payment confirmation
- Password-protected payment approval, unique digital QR tickets, and WhatsApp delivery
- Ticket recovery by customer WhatsApp number
- Authenticated gate QR scanner with atomic check-in and scan history
- Admin event, ticket product, staff, order, and reporting pages
- Hashed admin/product passwords and signed HttpOnly staff sessions

## Local setup

1. Install Node.js 20+ and dependencies with `npm install`.
2. Copy `.env.example` to `.env` and enter real Neon values. The existing `.env` in this workspace contains placeholder credentials and cannot connect to a database.
3. Run `npx prisma generate`.
4. Apply the committed initial migration with `npm run prisma:deploy`.
5. Create the initial admin with `npm run seed` (default `admin` / `admin12345`; override `SEED_ADMIN_PASSWORD` before seeding, then change the password policy/credential before production use).
6. Start with `npm run dev`.

The app runs at `http://localhost:3000`. Admin login is `/admin/login`; the gate scanner is `/gate` and requires an authenticated staff account. The seed creates the first admin only; admins can create gate staff under `/admin/staff`.

## Useful commands

- `npm run lint` — TypeScript validation
- `npm run build` — production build
- `npx prisma validate` — validate Prisma schema
- `npx prisma migrate dev --name <name>` — create/apply development migration
- `npm run prisma:deploy` — apply committed migrations in production
- `npm run seed` — ensure the initial admin exists

## Vercel + Neon

Set `DATABASE_URL` to Neon’s pooled PostgreSQL URL and `DIRECT_URL` to the direct URL. Also configure `NEXT_PUBLIC_APP_URL`, `ADMIN_WHATSAPP`, and a random `SESSION_SECRET` of at least 32 characters. Apply committed Prisma migrations with `npm run prisma:deploy` as a release step before routing traffic; Vercel runs `npm run build` for the Next.js production build. See [DEPLOYMENT_TUTORIAL.md](./DEPLOYMENT_TUTORIAL.md) for detail.

Never commit `.env` or use the default admin password in a production deployment. No ticket/order persistence uses browser localStorage.
