# Deploying Module Maker

This app is a standard Next.js 16 app backed by Postgres, so it runs on any
host that supports Node.js 20.9+ and lets you point it at a Postgres
database. This guide covers the fastest path (Vercel + a hosted Postgres)
and a generic path for any other Node host.

## 1. Get a production Postgres database

Any Postgres provider works — the app connects with a plain connection
string via `pg`/`@prisma/adapter-pg`, nothing provider-specific. Pick one:

- [Neon](https://neon.tech) — generous free tier, pairs well with Vercel
- [Supabase](https://supabase.com)
- Your host's own Postgres add-on (Railway, Render, etc.)

Copy the connection string it gives you — you'll need it as `DATABASE_URL`.
Hosted providers usually require `?sslmode=require` on the end; use the
exact string they give you.

## 2. Generate production secrets

Do **not** reuse the placeholder values from local `.env`. Generate real
ones:

```bash
openssl rand -base64 32   # -> AUTH_SECRET
openssl rand -hex 32      # -> API_KEY_ENCRYPTION_SECRET
```

Keep the `API_KEY_ENCRYPTION_SECRET` you set on day one — it's what
decrypts every user's stored AI provider key. Rotating it later makes
existing stored keys unreadable.

## 3. Deploy the app

### Option A — Vercel (recommended, easiest for Next.js)

```bash
npm i -g vercel
vercel login
vercel link            # run from the project root
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add API_KEY_ENCRYPTION_SECRET production
vercel env add PLATFORM_FEE_BPS production        # e.g. 1500
vercel env add NEXT_PUBLIC_APP_URL production      # set after first deploy, see below
vercel deploy --prod
```

`vercel env add` prompts for the value interactively (or pipe it in) — it
never needs to be typed into a file. After the first deploy, Vercel gives
you a URL (e.g. `https://module-maker.vercel.app`); set
`NEXT_PUBLIC_APP_URL` to that (or your custom domain once attached) and
redeploy so Stripe checkout redirects resolve correctly:

```bash
vercel env add NEXT_PUBLIC_APP_URL production   # paste the real URL
vercel deploy --prod
```

You can do the same steps from the Vercel dashboard (New Project → import
the repo → it auto-detects Next.js → add the same env vars under
Settings → Environment Variables) if you'd rather not use the CLI.

### Option B — any other Node host (Railway, Render, Fly.io, a VPS, etc.)

The app just needs:

```bash
npm install     # also runs `prisma generate` via postinstall
npm run build
npm run start   # serves on $PORT, defaults to 3000
```

Set the same env vars (`DATABASE_URL`, `AUTH_SECRET`,
`API_KEY_ENCRYPTION_SECRET`, `PLATFORM_FEE_BPS`, `NEXT_PUBLIC_APP_URL`,
and the Stripe vars if using payments) through whatever mechanism that
host uses (dashboard, `.env` file it injects, `fly secrets set`, etc.).

If you're self-hosting via Docker, add `output: "standalone"` to
`next.config.ts` first — it produces a minimal, self-contained build
(this isn't needed for Vercel).

## 4. Run migrations against the production database

Do this once after the database exists and again after any future schema
change. Run it from your machine (or a CI step), pointed at production:

```bash
DATABASE_URL="<your production connection string>" npx prisma migrate deploy
```

This applies the migrations already committed in `prisma/migrations/` — it
does not touch your schema, just brings the database up to date. Never use
`migrate dev` or `db push --force-reset` against production.

## 5. (Optional) Turn on payments

Skip this and the app still works — free modules, running your own
modules, everything except paid checkout. To enable it:

1. Get live (or test) keys from the
   [Stripe dashboard](https://dashboard.stripe.com/apikeys) and set
   `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Create a webhook endpoint in Stripe pointing at
   `https://<your-domain>/api/webhooks/stripe`, listening for
   `checkout.session.completed`. Copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.
3. If you want the Pro membership subscription, create a recurring Price
   in Stripe and set `STRIPE_PRO_MEMBERSHIP_PRICE_ID` to its id.

## 6. Verify

- Visit the deployed URL, register an account, and confirm `/dashboard`
  loads.
- Create a module from a template in `/builder/new`, publish it, and check
  it shows up in `/marketplace`.
- Add a real API key in `/settings/keys` and run the module — this is the
  first thing that needs a real provider key, so it's the right smoke
  test.

## Env var reference

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | Session/JWT signing secret |
| `API_KEY_ENCRYPTION_SECRET` | Yes | 32-byte hex; encrypts stored AI keys |
| `PLATFORM_FEE_BPS` | Yes | Marketplace cut, basis points (1500 = 15%) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL, used in Stripe redirect/webhook URLs |
| `STRIPE_SECRET_KEY` | Optional | Enables paid checkout |
| `STRIPE_WEBHOOK_SECRET` | Optional | Required if `STRIPE_SECRET_KEY` is set |
| `STRIPE_PRO_MEMBERSHIP_PRICE_ID` | Optional | Enables the Pro membership upgrade |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Currently unused server-side; reserved for a future client-side Stripe Elements flow |
