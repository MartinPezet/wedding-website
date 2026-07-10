## Why

The site must run on AWS Amplify with Turso as the production database, with infrastructure captured as Terraform in the repo and all deployment automated through GitHub Actions — including nightly database backups, since Turso's free tier only retains 24 hours.

## What Changes

- Terraform in `infra/`: Amplify app (GitHub-connected, Nitro `aws-amplify` preset), S3 backup bucket with versioning, required IAM
- GitHub Actions workflows:
  - `deploy.yml` — on push to main: terraform plan/apply, Drizzle migrations against Turso, then Amplify build
  - `backup.yml` — nightly cron: fetch the JSON backup endpoint, upload to S3 plus a workflow artifact copy
  - `pr.yml` — on PRs: lint, typecheck, terraform plan
- Turso provisioning: documented one-time setup script (`turso db create`, token generation), secrets into Amplify env vars and GitHub Actions secrets
- Environment/secrets documentation: every env var, where it lives, how to rotate

## Capabilities

### New Capabilities

- `infra-terraform`: AWS infrastructure as code — Amplify hosting, backup storage, IAM
- `ci-cd`: GitHub Actions pipelines — deploy with migrations, nightly backups, PR checks

### Modified Capabilities

_None._

## Impact

- Depends on `scaffold-site-foundation` (app to deploy); backup workflow depends on `add-admin-panel`'s backup endpoint
- New directories: `infra/`, `.github/workflows/`
- GitHub repo secrets: AWS credentials, Turso URL/token, backup secret; Amplify env vars for runtime config
