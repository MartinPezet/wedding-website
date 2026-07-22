@infra-terraform
Feature: Infra Terraform
  AWS resources defined in repo Terraform: Amplify hosting, backup bucket, remote state.

  @req:aws-infrastructure-defined-as-terraform-in-the-repo
  Rule: AWS infrastructure defined as Terraform in the repo
    Everything reproducible with terraform apply; no console-created resources.

    @manual
    Scenario: Infrastructure reproducible
      Given an empty AWS account and required variables set
      When terraform apply runs
      Then the Amplify app, backup bucket, and IAM resources are created and the site can deploy

  @req:amplify-hosts-the-nuxt-app
  Rule: Amplify hosts the Nuxt app
    Nitro aws-amplify preset, connected to the repo's main branch.

    @manual
    Scenario: Push serves site
      Given a commit landing on main
      When the pipeline completes
      Then the live Amplify URL serves the updated site with server routes functional

  @req:versioned-private-backup-bucket
  Rule: Versioned private backup bucket
    Past backups retained and recoverable.

    @manual
    Scenario: Backup retention
      Given nightly backups uploading over time
      When previous backup objects are requested
      Then they remain retrievable via versioning

  @req:remote-terraform-state
  Rule: Remote Terraform state
    S3 backend with locking, never on a developer machine.

    @manual
    Scenario: State shared
      Given terraform running from CI or a second machine
      When it reads state
      Then it reads the same remote state and cannot corrupt it concurrently
