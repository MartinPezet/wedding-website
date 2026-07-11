## 1. Terraform Foundation

- [ ] 1.1 Install infra-terraform.feature + ci-cd.feature into tests/features/ (all scenarios @manual — verified by the drills below); confirm suite still green
- [ ] 1.2 Bootstrap remote state (S3 backend + locking); `infra/` skeleton with providers and variables
- [ ] 1.3 `aws_amplify_app` + branch resource: GitHub connection, build spec with Nitro aws-amplify preset, env var wiring
- [ ] 1.4 Backup bucket: private, versioned; IAM user/role for CI uploads
- [ ] 1.5 Hello-world deploy: verify Nuxt 4 + aws-amplify preset serves SSR routes on Amplify (manual drill for infra-terraform scenarios)
- [ ] 1.6 Quality pass: test, lint, typecheck, terraform validate green

## 2. Turso & Secrets

- [ ] 2.1 Test setup-turso script dry-run/shape (unit test the script's output contract where feasible) — confirm red
- [ ] 2.2 setup-turso script: create DB, emit URL + auth token
- [ ] 2.3 Wire secrets: GitHub Actions (AWS creds, Turso, backup secret) and Amplify env vars (runtime config)
- [ ] 2.4 SECRETS.md: every variable, purpose, location, rotation
- [ ] 2.5 Quality pass: test, lint, typecheck green; fresh-setup docs walkthrough (manual drill)

## 3. Workflows

- [ ] 3.1 Static tests for workflow files (actionlint or schema-level assertions: deploy ordering, PR checks present, backup cron) — confirm red
- [ ] 3.2 deploy.yml: terraform apply → drizzle migrate against Turso → Amplify build; migration failure halts
- [ ] 3.3 pr.yml: lint, typecheck, terraform plan, migration dry-run
- [ ] 3.4 backup.yml: nightly cron → curl backup endpoint (bearer secret) → dated S3 upload + artifact
- [ ] 3.5 Quality pass: test, lint, typecheck green; manual drills for ci-cd @manual scenarios (end-to-end deploy with migration, restore drill against scratch DB, forced backup failure visible)
