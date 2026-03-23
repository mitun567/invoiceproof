# InvoiceProof

Fraud-proof invoice verification for businesses.

## Product direction
- SaaS-first UX
- Off-chain operational storage
- On-chain proof anchoring in background
- QR and public verification page for non-technical users
- Swappable storage and chain adapters for future scale

## Monorepo structure
- `apps/web` - Next.js frontend
- `apps/api` - NestJS API
- `apps/worker` - background jobs for hashing, batching, anchoring
- `packages/db` - Prisma schema and database client
- `packages/storage` - swappable file storage adapters
- `packages/proof` - hashing and Merkle-proof logic
- `packages/chain` - chain anchoring adapters
- `packages/core` - shared types and statuses

## Current milestone status
Implemented now:
- Postgres-backed invoice persistence via Prisma schema
- Public verification endpoint
- Local development storage adapter
- Canvas-first premium invoice builder with direct on-page editing
- Draggable invoice fields on a single-page canvas
- Optional logo upload and optional appended PDF attachments
- Color palette controls and four AI-guided premium layout options
- Verification footer, QR block, and verify link rendered on every final PDF page
- Dashboard, invoice detail page, and verification page wired to the API
- Audit log creation on invoice save

## Local development
1. Copy `.env.example` to `.env` if you want to customize services.
2. Start PostgreSQL and Redis locally, or use Neon and Upstash. For local Docker, run `docker compose up -d`.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run db:push`.
6. Run the apps you need:
   - `npm run dev:api`
   - `npm run dev:web`
   - `npm run dev:worker`

### Prisma / DATABASE_URL note
If `.env` is missing, the repo now falls back to the local development connection string `postgresql://invoiceproof:invoiceproof@localhost:5432/invoiceproof` for Prisma commands. That means `npm run db:generate` and `npm run db:push` will still work for the standard Docker Compose setup instead of failing immediately with `Environment variable not found: DATABASE_URL`.

## First milestone goal
Create or upload invoice -> save to database and object storage -> generate record hash -> show public verify page with Pending Proof.

## Next build target
Queue-based proof worker, Merkle batching, minimal AnchorRegistry contract, and on-chain anchor watcher.
