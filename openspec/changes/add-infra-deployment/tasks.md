## 1. Terraform Foundation

- [ ] 1.1 Bootstrap remote state (S3 backend + locking); `infra/` skeleton with providers and variables
- [ ] 1.2 `aws_amplify_app` + branch resource: GitHub connection, build spec with Nitro aws-amplify preset, env var wiring
- [ ] 1.3 Backup bucket: private, versioned; IAM user/role for CI uploads
- [ ] 1.4 Hello-world deploy: verify Nuxt 4 + aws-amplify preset serves SSR routes on Amplify before building further

## 2. Turso & Secrets

- [ ] 2.1 setup-turso script: create DB, emit URL + auth token
- [ ] 2.2 Wire secrets: GitHub Actions (AWS creds, Turso, backup secret) and Amplify env vars (runtime config)
- [ ] 2.3 SECRETS.md: every variable, purpose, location, rotation

## 3. Workflows

- [ ] 3.1 deploy.yml: terraform apply → drizzle migrate against Turso → Amplify build; migration failure halts
- [ ] 3.2 pr.yml: lint, typecheck, terraform plan, migration dry-run
- [ ] 3.3 backup.yml: nightly cron → curl backup endpoint (bearer secret) → dated S3 upload + artifact

## 4. Verification

- [ ] 4.1 End-to-end deploy: push commit with migration → live site updated, migration applied
- [ ] 4.2 Restore drill: nightly dump → restore script → scratch DB matches
- [ ] 4.3 Force a backup failure (bad secret) → workflow visibly fails
