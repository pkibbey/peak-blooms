# Peak Blooms Deployment & Environments Plan

## Overview

Peak Blooms uses a **dev → main** branching strategy with separate databases and blob storage per environment. The `dev` branch deploys to Vercel preview environments, while the `main` branch deploys to production. All deployments are handled automatically by Vercel upon git push.

## Environment Strategy

### Development/Preview Environment
- **Branch:** `dev`
- **Vercel Deployment:** Preview environment (auto-generated per branch)
- **Database:** Separate PostgreSQL database (dev database)
- **Blob Storage:** Separate Vercel Blob storage (dev project/token)
- **Data Lifecycle:** Throwaway data—can be reset and re-seeded at any time
- **Purpose:** Feature development, testing, experimentation
- **Accessibility:** Internal team only
- **Uptime SLA:** None (expected to break frequently)

### Production Environment
- **Branch:** `main`
- **Vercel Deployment:** Production environment (`peak-blooms.vercel.app`)
- **Database:** Separate PostgreSQL database (prod database)
- **Blob Storage:** Separate Vercel Blob storage (prod project/token)
- **Data Lifecycle:** **Source of truth**—data preserved across deployments
- **Purpose:** Customer-facing, stable releases
- **Accessibility:** Public
- **Uptime SLA:** Best effort (acceptable downtime: few minutes during deployments)

## Database Strategy

### Separate Database Instances

Two independent PostgreSQL databases are required:
- **Development:** `peak_blooms_dev` (or named in connection string)
- **Production:** `peak_blooms_prod` (or named in connection string)

Each is accessed via:
- `DATABASE_URL`: Direct connection string
- `PRISMA_DATABASE_URL`: Prisma Accelerate pooled connection (with JWT token)

### Environment Variables

**Development (.env.development.local or Vercel preview settings):**
```
DATABASE_URL=postgresql://user:password@host:5432/peak_blooms_dev
PRISMA_DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=...
BLOB_READ_WRITE_TOKEN=vercel_blob_dev_token_...
NEXTAUTH_SECRET=dev_secret_...
NEXTAUTH_URL=https://peak-blooms-dev.vercel.app
```

**Production (Vercel dashboard environment variables):**
```
DATABASE_URL=postgresql://user:password@prod-host:5432/peak_blooms_prod
PRISMA_DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=...
BLOB_READ_WRITE_TOKEN=vercel_blob_prod_token_...
NEXTAUTH_SECRET=prod_secret_...
NEXTAUTH_URL=https://peak-blooms.vercel.app
```

### Migration & Seeding

**Migrations** run automatically as part of Vercel's build process via `postinstall` hook in `package.json`:
```json
"postinstall": "prisma generate"
```

Database migrations should be applied **manually** (not as part of CI/CD) to allow for careful review:

```bash
# For development
npm run db:push  # Applies pending migrations to dev database

# For production (run locally first, then deploy)
npm run db:push  # Applies pending migrations to prod database
```

**Seeding** is a **manual process**:

```bash
# Seed development database with mock data
npm run db:seed

# For production, create a separate seed script when needed
npm run db:seed:prod
```

The seed script is located in `prisma/seed.ts` and is configured in `prisma/schema.prisma` with:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Note:** The current seed data is mock data for development purposes only. It includes collections, products, variants, and inspirations with Vercel Blob image URLs.

### Data Sync Strategy (Future)

Once production has real customer data, a script can be created to safely pull production data to development:
```bash
npm run db:sync:prod-to-dev
```

**This should NEVER be run in reverse.** The production database is always the source of truth.

## Blob Storage Strategy

### Separate Storage Per Environment

Two independent Vercel Blob storage instances are required:
- **Development:** Separate Vercel Blob token/project
- **Production:** Separate Vercel Blob token/project

This ensures:
- Images uploaded/edited in dev stay in dev
- Production images are never overwritten by dev changes
- Complete environment isolation

### Configuration

Each environment uses its own `BLOB_READ_WRITE_TOKEN` environment variable pointing to the correct Blob storage.

Admin image upload functionality (`src/app/api/admin/upload`) uses this token and is automatically scoped to the correct environment.

## Deployment Flow

### Development/Preview (dev branch)

1. **Developer** makes changes on a feature branch off `dev`
2. **Developer** opens a PR against `dev`
3. **GitHub Actions** runs:
   - Linting and formatting checks
   - Unit tests
   - Build validation
4. **Manual approval** from team (optional, can be auto-merge if trusted)
5. **Merge** to `dev` branch
6. **Vercel** automatically detects the push
7. **Vercel** runs `npm run build` and deploys to preview environment
8. **Preview environment** is live at `peak-blooms-{hash}.vercel.app`
9. **Database & Blob storage** remain unchanged (use existing dev instances)
10. **Manual seeding** (if needed): Run `npm run db:seed` locally or via script post-deployment

### Production (main branch)

1. **Developer** opens a PR from `dev` → `main`
2. **GitHub Actions** runs:
   - Linting and formatting checks
   - Unit tests
   - E2E tests (Playwright)
   - Build validation
3. **Code review** required (team approval)
4. **Merge** to `main` branch
5. **Vercel** automatically detects the push
6. **Vercel** runs `npm run build` and deploys to production
7. **Production** is live at `peak-blooms.vercel.app`
8. **Database & Blob storage** remain unchanged (use existing prod instances)
9. **Manual migration** (if needed): Run `npm run db:push` locally, then re-deploy if schema changes
10. **No seeding:** Production data is preserved; no seed runs unless explicitly triggered

## CI/CD Workflows (GitHub Actions)

### Workflow 1: Dev PR Validation
**File:** `.github/workflows/dev-pr.yml`

Runs on: `pull_request` against `dev` branch

Steps:
1. Install dependencies
2. Lint code (`npm run lint`)
3. Format check (`npm run format`)
4. Run unit tests
5. Build validation (`npm run build`)

Fails PR if any step fails—blocking merge to `dev`.

### Workflow 2: Prod PR Validation
**File:** `.github/workflows/prod-pr.yml`

Runs on: `pull_request` against `main` branch

Steps:
1. Install dependencies
2. Lint code (`npm run lint`)
3. Format check (`npm run format`)
4. Run unit tests
5. Run E2E tests (Playwright) against preview environment
6. Build validation (`npm run build`)

Fails PR if any step fails—blocking merge to `main`.

### Workflow 3: Prod Deployment Notification (Future)
**File:** `.github/workflows/prod-deployment-alert.yml`

Runs on: `deployment` event to production

Steps:
1. Send email notification to dev team on deployment
2. (Future: Include deployment details, rollback instructions)

## Scripts Reference

### Development
```bash
npm run dev                  # Start local dev server with Turbopack
npm run build              # Build for production (validate locally)
npm run db:push            # Apply pending migrations to dev database
npm run db:seed            # Seed dev database with mock data
npm run lint               # Check code style
npm run format             # Auto-format code
```

### Future Scripts (To Create)
```bash
npm run db:seed:prod       # Seed prod database (manual, with confirmation)
npm run db:sync:prod-to-dev # Pull prod data to dev (when needed)
npm run e2e:dev            # Run Playwright E2E tests locally
```

## Rollback Procedure

In case of a production issue:

1. **Alert:** Dev team is notified via email (manual setup with Vercel alerts or GitHub Actions)
2. **Triage:** Developer assesses the issue:
   - **Code issue:** Revert the commit that introduced the bug
   - **Migration issue:** Rollback the migration and commit a corrective migration
   - **Data issue:** Manual database remediation via Prisma Studio or direct SQL
3. **Fix & Deploy:** Push fix to `main`, Vercel auto-deploys
4. **Verify:** Test on production to ensure issue is resolved

**No blue-green deployments or zero-downtime strategy currently planned.** Downtime during deployments (few minutes) is acceptable.

## Secrets & Environment Variables

### Current Management
Secrets are managed via **Vercel dashboard** for both preview and production environments:
- `DATABASE_URL` and `PRISMA_DATABASE_URL` for database connections
- `BLOB_READ_WRITE_TOKEN` for Blob storage access
- `NEXTAUTH_SECRET` for session encryption
- `NEXTAUTH_URL` for callback URL

### Local Development
Create `.env.local` with dev-only credentials:
```bash
DATABASE_URL=...
PRISMA_DATABASE_URL=...
BLOB_READ_WRITE_TOKEN=...
NEXTAUTH_SECRET=dev_secret
NEXTAUTH_URL=http://localhost:3000
```

### Future Considerations
- **Secret Rotation:** Currently not planned, but should be reviewed every 6–12 months
- **Audit Logging:** Consider adding audit logs for production database changes

## Testing Strategy

### Unit Tests
- Location: Tests co-located with source files (`.test.ts` / `.test.tsx`)
- Runs: On every PR to `dev` and `main`
- Framework: TBD (Jest, Vitest, etc.)
- Minimum coverage: TBD

### E2E Tests (Playwright)
- Location: `tests/` or `e2e/` directory
- Runs: On every PR to `main` (blocks merge if failed)
- Scope: Critical user journeys (browse, add to cart, checkout, etc.)
- Environment: Runs against preview deployment after build

### When to Add Tests
- New features should include corresponding tests
- Bug fixes should add a test that would have caught the bug
- Critical paths (auth, checkout) require E2E coverage

## Data Backups

**Current state:** No automated backups are configured.

### Recommended Future Actions
- Enable PostgreSQL automated backups (via cloud provider)
- Test restore procedures quarterly
- Consider backup retention policy (30 days, 90 days, etc.)

## Monitoring & Alerts

**Current state:** No monitoring configured.

### Future Considerations
- Add production error tracking (Sentry, etc.)
- Configure deployment success/failure notifications
- Set up database performance monitoring
- Add health check endpoint for uptime monitoring

## Environment-Specific Behavior

Some code may need to behave differently per environment. Use `process.env.VERCEL_ENV`:

```typescript
if (process.env.VERCEL_ENV === 'production') {
  // Production-only logic
} else if (process.env.VERCEL_ENV === 'preview') {
  // Preview/dev logic
}
```

Or check `process.env.NODE_ENV`:
- `development` (local)
- `production` (built for Vercel)

## Troubleshooting

### Database connection issues
- Verify `DATABASE_URL` and `PRISMA_DATABASE_URL` are set in Vercel dashboard
- Check connection pooling limits (Prisma Accelerate)
- Review Prisma logs: `DEBUG="*" npm run dev`

### Blob storage issues
- Verify `BLOB_READ_WRITE_TOKEN` is set and valid
- Check file size limits (5 MB)
- Verify allowed file types (JPEG, PNG, WebP)

### Migration failures
- Review migration SQL in `prisma/migrations/`
- Check for schema conflicts
- Run `npm run db:push` locally first to test

### Build failures
- Check Vercel build logs in dashboard
- Verify `npm run build` succeeds locally
- Ensure all dependencies are listed in `package.json`

## Related Documentation
- [Prisma Migrations](https://www.prisma.io/docs/orm/prisma-migrate)
- [Vercel Deployment](https://vercel.com/docs/deployments)
- [NextAuth v5](https://authjs.dev/)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
