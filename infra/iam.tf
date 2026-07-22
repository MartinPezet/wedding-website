# Single CI identity for both workflows: backup uploads and
# terraform apply / amplify start-job from deploy.yml.
resource "aws_iam_user" "github_actions" {
  name = "wedding-website-github-actions"
}

resource "aws_iam_user_policy" "backup_upload" {
  name = "backup-upload"
  user = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.backups.arn}/*"
      },
    ]
  })
}

# ponytail: deploy.yml runs terraform apply, which touches Amplify, S3, and
# IAM itself — admin on a single-purpose personal account; scope down if the
# account ever becomes shared.
resource "aws_iam_user_policy_attachment" "deploy_admin" {
  user       = aws_iam_user.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}

output "ci_access_key_id" {
  value = aws_iam_access_key.github_actions.id
}

output "ci_secret_access_key" {
  value     = aws_iam_access_key.github_actions.secret
  sensitive = true
}
