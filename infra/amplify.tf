resource "aws_amplify_app" "site" {
  name         = "wedding-website"
  repository   = var.github_repository
  access_token = var.github_access_token
  platform     = "WEB_COMPUTE" # SSR compute for the Nitro server

  build_spec = <<-YAML
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .amplify-hosting
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  YAML

  environment_variables = {
    # selects the nitro aws-amplify preset in nuxt.config.ts
    AMPLIFY_BUILD          = "1"
    NUXT_SITE_PASSWORD    = var.nuxt_site_password
    NUXT_ADMIN_PASSWORD   = var.nuxt_admin_password
    NUXT_SESSION_PASSWORD = var.nuxt_session_password
    NUXT_BACKUP_SECRET    = var.nuxt_backup_secret
    NUXT_DB_URL           = var.turso_database_url
    NUXT_DB_AUTH_TOKEN    = var.turso_auth_token
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.site.id
  branch_name = "main"
  stage       = "PRODUCTION"

  # deploy.yml triggers builds explicitly (aws amplify start-job) AFTER
  # migrations succeed — auto-build would race the migration step.
  enable_auto_build = false
}

output "amplify_app_id" {
  value = aws_amplify_app.site.id
}

output "amplify_default_domain" {
  value = "https://main.${aws_amplify_app.site.default_domain}"
}
