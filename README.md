# Module Maker

A marketplace for AI modules — structured, branching sequences of prompts that
people build, run against their own AI provider keys, and optionally share or
sell. Module Maker isn't an AI itself; it connects modules to OpenAI,
Anthropic, and Google using API keys each user supplies.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **PostgreSQL** via **Prisma 7** (driver adapter: `@prisma/adapter-pg`)
- **Auth.js (next-auth v5)** — email/password credentials, JWT sessions
- **Stripe** — one-off checkout for paid modules (platform takes a
  configurable cut) and a subscription checkout for an optional Pro
  membership
- **@xyflow/react** — the branching graph editor in the module builder
- AES-256-GCM encryption for user-supplied AI provider API keys at rest

## Getting started

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL, AUTH_SECRET, API_KEY_ENCRYPTION_SECRET
npx prisma migrate dev
npm run dev
```

Generate real secrets rather than using the placeholders:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # API_KEY_ENCRYPTION_SECRET
```

Stripe is optional for local development — checkout and the webhook route
will simply error until `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`STRIPE_PRO_MEMBERSHIP_PRICE_ID` are set. Free modules and running your own
modules work without Stripe configured.

## How it fits together

- **Modules** are a branching graph of steps (`types/graph.ts`): `input`
  (collect a variable), `prompt` (call an AI provider and store the result in
  a variable), `condition` (branch on a variable), and `output` (render the
  final result). Templates for common use cases live in
  `lib/templates/seedTemplates.ts`.
- A module has a mutable `draftGraph` that the owner edits in
  `/builder/[id]`, and immutable `ModuleVersion` snapshots created on
  publish. Running and forking always use the published version.
- **Execution** (`lib/engine/executeGraph.ts`) walks the graph server-side,
  interpolating `{{variable}}` templates and calling the right provider
  adapter (`lib/providers/index.ts`) with the *user's own* decrypted API
  key. Steps are persisted as they run (`RunStep`) so a run's history is
  auditable.
- **Marketplace**: publishing sets a module's visibility and price. Free
  modules are acquired instantly (`Acquisition`); paid ones go through
  Stripe Checkout, and the webhook (`/api/webhooks/stripe`) records the sale
  and the platform/seller revenue split (`PLATFORM_FEE_BPS` in `.env`).
- **Monetization**: a percentage cut of every paid sale, plus an optional
  Pro membership subscription (`/settings/billing`).

## Known limitations (by design, for this first pass)

- **Input collection is upfront only.** All `input` steps in a graph are
  collected before a run starts; the engine doesn't pause mid-run to ask a
  question that depends on an earlier AI response. A fully interactive,
  resumable run is a reasonable next iteration.
- **Runs execute synchronously** inside the API route rather than as a
  background job, so a long chain of prompt steps ties up the request for
  its full duration. Fine for a handful of steps; a production deployment
  with long chains would want a queue.
- **Stripe Connect payouts aren't wired up.** Sales correctly record what
  the platform keeps and what the seller earned (`Acquisition.
  sellerEarningsCents`), but there's no seller onboarding flow or automatic
  transfer yet — `SellerAccount` exists in the schema for this.
- Reviews can be written to the database but there's no UI yet for buyers
  to leave one.
