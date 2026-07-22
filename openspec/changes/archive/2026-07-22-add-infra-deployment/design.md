## Context

App targets AWS Amplify (Nitro `aws-amplify` preset), Turso for data, GitHub as the source of truth. User wants Terraform in-repo and GitHub Actions as the only deployment mechanism. Turso free tier retains backups 24h → external nightly backup required.

## Goals / Non-Goals

**Goals:**
- `git push` to main = deployed site with migrations applied first
- Nightly, restorable, off-Turso backups
- All AWS resources reproducible from `terraform apply`

**Non-Goals:**
- Managing Turso via Terraform (no mature provider — one-time CLI setup script instead)
- Multi-environment (staging) pipelines — single production environment; local dev covers testing
- Custom domain automation (manual Amplify domain attach documented; Terraform-managed if trivial)

## Decisions

- **Amplify hosting via Terraform `aws_amplify_app`** connected to the GitHub repo with auto-build on main. Build spec pins the Nitro `aws-amplify` preset. Alternative considered: SST/CDK — rejected: user asked for Terraform explicitly.
- **Migration ordering**: Amplify auto-builds on push, so `deploy.yml` runs `drizzle-kit migrate` against Turso *before* the build completes serving traffic. Migrations are additive (SQLite/libSQL style); the brief window where old code runs against new schema is acceptable at this scale. `# ponytail: no blue-green; 200 guests, additive migrations only`.
- **Backups in GitHub Actions, not Lambda/EventBridge**: nightly cron workflow curls the bearer-secret backup endpoint, uploads dated JSON to versioned S3 (Terraform-managed) and attaches a workflow artifact as a second copy (90-day retention). Fewer AWS moving parts; backup logic visible in the repo.
- **Backup restore is tested, not assumed**: workflow (or documented script) restores a dump into a scratch local DB as part of verification.
- **Secrets split**: GitHub Actions secrets (AWS deploy credentials, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BACKUP_SECRET`) for CI; Amplify environment variables (Turso creds, session secret, site/admin passwords, backup secret) for runtime. Terraform reads sensitive values from variables, never hard-codes.
- **Terraform state: S3 backend** (same account, separate bucket + native lockfile). Alternative considered: local state — rejected: state on one laptop is how infra gets orphaned.
- **`pr.yml`**: lint, typecheck, `terraform plan` (no apply), Drizzle migration dry-run check. Keeps main deployable.
- **Turso setup script** (`scripts/setup-turso.*`): creates DB, prints URL/token, documents where each secret goes. Run once per environment.

## Risks / Trade-offs

- [Amplify build and migration race] → migrations additive-only rule documented; deploy workflow orders migrate before triggering/approving build where Amplify's webhook timing allows
- [Backup secret leaks] → scoped to read-only dump endpoint; rotate by env var change; S3 bucket private + versioned
- [Nitro aws-amplify preset quirks with Nuxt 4] → verify early with a hello-world deploy before the full app grows (task 1)

## Migration Plan

1. Terraform bootstrap (state bucket) → `terraform apply` → Amplify app exists, hello-world deploy verified
2. Wire secrets, confirm deploy.yml end-to-end
3. Enable backup.yml after the backup endpoint (add-admin-panel) exists; verify restore
Rollback: Amplify redeploys previous build via console; DB restores from latest S3 dump.

## Open Questions

- Custom domain name — user to confirm when purchased
