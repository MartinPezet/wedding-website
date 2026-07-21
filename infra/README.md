# Infrastructure

All AWS resources for the wedding site: Amplify hosting (SSR via the Nitro
`aws-amplify` preset), the versioned backup bucket, and the CI IAM user.
Everything is reproducible with `terraform apply` — the only exception is the
state bucket itself (chicken-and-egg), created once below.

## One-time bootstrap

Run with your own admin AWS credentials:

```sh
# 1. State bucket (name must match backend config in main.tf)
aws s3api create-bucket \
  --bucket cm-wedding-website-tfstate \
  --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-bucket-versioning \
  --bucket cm-wedding-website-tfstate \
  --versioning-configuration Status=Enabled

# 2. Provision everything
cd infra
terraform init
terraform apply
```

Terraform will prompt for the variables in `variables.tf`; put them in a
`terraform.tfvars` (gitignored) instead of typing them each run. Values and
where they come from are documented in [SECRETS.md](../SECRETS.md).

After apply:

- `terraform output ci_access_key_id` / `terraform output -raw ci_secret_access_key`
  → GitHub Actions secrets `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `terraform output amplify_app_id` → GitHub Actions secret `AMPLIFY_APP_ID`
- `terraform output amplify_default_domain` → the live URL

## Notes

- Amplify auto-build is **off**; `deploy.yml` triggers builds with
  `aws amplify start-job` only after migrations succeed.
- Terraform state locking uses S3's native lockfile (`use_lockfile`), no
  DynamoDB table needed.
- Custom domain: attach manually in the Amplify console when purchased
  (open question in the change proposal).
