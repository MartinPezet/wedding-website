variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "github_repository" {
  description = "HTTPS URL of the GitHub repo Amplify builds from"
  type        = string
}

variable "github_access_token" {
  description = "GitHub PAT with repo + admin:repo_hook scope, used once by Amplify to install its webhook"
  type        = string
  sensitive   = true
}

variable "backup_bucket_name" {
  type    = string
  default = "cm-wedding-website-backups"
}

# --- Runtime secrets injected as Amplify environment variables ---

variable "nuxt_site_password" {
  type      = string
  sensitive = true
}

variable "nuxt_admin_password" {
  type      = string
  sensitive = true
}

variable "nuxt_session_password" {
  description = "nuxt-auth-utils session encryption key (32+ chars)"
  type        = string
  sensitive   = true
}

variable "nuxt_backup_secret" {
  description = "Bearer token for GET /api/admin/backup"
  type        = string
  sensitive   = true
}

variable "turso_database_url" {
  type      = string
  sensitive = true
}

variable "turso_auth_token" {
  type      = string
  sensitive = true
}
