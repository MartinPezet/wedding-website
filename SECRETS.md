# Secrets & environment variables

Every secret, what it's for, where it lives, and how to rotate it.
Provisioning order for a fresh environment: [infra/README.md](infra/README.md)
bootstrap → `node scripts/setup-turso.mjs` → fill `infra/terraform.tfvars` →
`terraform apply` → set the GitHub Actions secrets below.

## GitHub Actions secrets

Set at <https://github.com/OWNER/REPO/settings/secrets/actions> (or `gh secret set NAME`).

CI runs `terraform plan`/`apply` itself, so every Terraform variable is also
fed from here as `TF_VAR_*` (see the `env:` block in deploy.yml / pr.yml).
GitHub Actions is the canonical secret store; a local `infra/terraform.tfvars`
holds the same values only for the one-time bootstrap apply.

| Secret | Purpose | Source |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Terraform apply, Amplify build trigger, backup S3 upload | `terraform output ci_access_key_id` |
| `AWS_SECRET_ACCESS_KEY` | Pair of the above | `terraform output -raw ci_secret_access_key` |
| `AMPLIFY_GITHUB_PAT` | `TF_VAR_github_access_token` — Amplify's repo webhook | GitHub PAT, `repo` + `admin:repo_hook` |
| `TURSO_DATABASE_URL` | Drizzle migrations target in deploy.yml; `TF_VAR_turso_database_url` | `scripts/setup-turso.mjs` output |
| `TURSO_AUTH_TOKEN` | Auth for the above; `TF_VAR_turso_auth_token` | `scripts/setup-turso.mjs` output |
| `NUXT_SITE_PASSWORD` | `TF_VAR_nuxt_site_password` — guest gate | You invent it |
| `NUXT_ADMIN_PASSWORD` | `TF_VAR_nuxt_admin_password` — admin panel | You invent it |
| `NUXT_SESSION_PASSWORD` | `TF_VAR_nuxt_session_password` — session encryption | 32+ random chars |
| `BACKUP_SECRET` | Bearer token backup.yml sends to `GET /api/admin/backup`; `TF_VAR_nuxt_backup_secret` | You invent it (32+ random chars) |
| `SITE_URL` | Base URL backup.yml fetches from | `terraform output amplify_default_domain` |

## Amplify runtime environment variables

Managed by Terraform (`infra/amplify.tf`) from `infra/terraform.tfvars` —
never set them in the Amplify console; apply would fight you.

| Variable | Purpose | tfvars key |
|---|---|---|
| `NUXT_SITE_PASSWORD` | Guest gate password | `nuxt_site_password` |
| `NUXT_ADMIN_PASSWORD` | Admin panel password | `nuxt_admin_password` |
| `NUXT_SESSION_PASSWORD` | nuxt-auth-utils session encryption (32+ chars) | `nuxt_session_password` |
| `NUXT_BACKUP_SECRET` | Accepts the backup bearer token | `nuxt_backup_secret` |
| `NUXT_DB_URL` | Turso libSQL URL | `turso_database_url` |
| `NUXT_DB_AUTH_TOKEN` | Turso auth token | `turso_auth_token` |
| `AMPLIFY_BUILD` | Selects the Nitro `aws-amplify` preset at build | (constant `1`) |

`infra/terraform.tfvars` is gitignored; it also holds `github_repository` and
`github_access_token` (GitHub PAT, `repo` + `admin:repo_hook`, used once by
Amplify to install its webhook).

## Rotation

Rotating any value = update the GitHub secret; the next deploy's
`terraform apply` pushes it into Amplify. Specifics:

- **Turso token**: `turso db tokens create wedding-website` → update
  `TURSO_AUTH_TOKEN` → deploy → optionally `turso db tokens invalidate` the old one.
- **AWS keys**: `terraform -chdir=infra apply -replace=aws_iam_access_key.github_actions`
  (run locally — CI can't rotate the keys it's using), then update both AWS secrets.
- **BACKUP_SECRET / passwords / session secret**: generate a new value, update
  the secret, deploy. Rotating `NUXT_SESSION_PASSWORD` logs everyone out — harmless.
- **GitHub PAT**: regenerate in GitHub settings, update `AMPLIFY_GITHUB_PAT`.
