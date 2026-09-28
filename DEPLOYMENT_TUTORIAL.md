# Deployment: REGGAEPHORIA TANGSEL

## 1. Create Neon PostgreSQL database

Create a Neon project and copy both connection URLs:

- `DATABASE_URL`: pooled connection URL for runtime queries.
- `DIRECT_URL`: direct (non-pooler) URL for Prisma migrations.

Use TLS (`sslmode=require`). Do not copy placeholder URLs from a sample file into production.

## 2. Configure environment variables

Set these locally in `.env` and in Vercel Project → Settings → Environment Variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL` (for example, the deployed HTTPS domain)
- `ADMIN_WHATSAPP` (international digits, e.g. `6288210516736`)
- `SESSION_SECRET` (at least 32 random characters)
- `SEED_ADMIN_PASSWORD` (only needed when seeding; use a strong unique value)

Keep `.env` out of Git. `.env.example` contains intentionally fake connection placeholders.

## 3. Initialize database and admin

Apply the committed initial migration to the configured database and create the first admin:

```sh
npx prisma generate
npm run prisma:deploy
npm run seed
```

For later development schema changes, create and commit a migration with `npx prisma migrate dev --name <name>` against a development database.

Seed account username is `admin`. The default seed password is `admin12345` only when `SEED_ADMIN_PASSWORD` is unset. Set a strong `SEED_ADMIN_PASSWORD` before seeding a production database, and do not leave the default credential enabled.

Commit the generated `prisma/migrations` directory. Subsequent production releases run `npm run prisma:deploy` (`prisma migrate deploy`) before the new build receives traffic. Do not use `db push` as the production migration workflow.

## 4. Deploy to Vercel

Import the Git repository into Vercel. Framework preset should be Next.js; use the default install and build commands (`npm install`, `npm run build`). Configure the environment variables above for Preview and Production. Run committed migrations as a release step before serving the deployment, then deploy the built Next.js application.

The project uses Node.js runtime Prisma Client and works with Neon PostgreSQL. The `postinstall` hook generates Prisma Client during dependency installation.

## 5. Verify

- `/` lists upcoming events.
- `/event/<slug>` accepts customer orders.
- `/payment/<invoice>` provides transfer instructions and WhatsApp payment confirmation.
- `/approval/<token>` requires the product approval password and issues tickets.
- `/ticket/<ticket-code>` displays a database-backed QR ticket.
- `/find-ticket` retrieves paid tickets by purchaser WhatsApp number.
- `/admin/login` is the staff sign-in; `/admin` pages require ADMIN role.
- `/gate` requires a signed-in ADMIN or GATE_STAFF and checks tickets against PostgreSQL.

## Operations and security

- Passwords are stored as bcrypt hashes; never store plaintext passwords in the database.
- Staff sessions are signed, HttpOnly, SameSite cookies with an eight-hour expiry.
- Keep `SESSION_SECRET` stable between instances and rotate it to revoke all sessions.
- Restrict production database credentials, configure backups in Neon, and monitor Vercel/Neon logs.
- Payment confirmation is a manual WhatsApp workflow; the application does not claim to verify bank transfers automatically.
