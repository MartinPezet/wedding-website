@ci-cd
Feature: CI/CD
  GitHub Actions deploys, nightly restorable backups, and PR checks.

  @req:deployment-via-github-actions
  Rule: Deployment via GitHub Actions
    Push to main applies Terraform, migrates Turso, then serves the new version.

    @manual
    Scenario: Full deploy from push
      Given a commit with a schema migration pushed to main
      When the deploy workflow completes
      Then the migration is applied to Turso and the new app version goes live without manual steps

    @manual
    Scenario: Migration failure halts deploy
      Given a migration that fails against Turso
      When the deploy workflow runs
      Then the workflow fails visibly and the new version is not promoted

  @req:nightly-automated-backups
  Rule: Nightly automated backups
    Scheduled workflow stores dated dumps in S3 plus workflow artifacts.

    @manual
    Scenario: Nightly backup lands in S3
      Given the scheduled backup workflow
      When it runs
      Then a dated JSON dump appears in the backup bucket and as a workflow artifact

    @manual
    Scenario: Backup failure is visible
      Given a failing backup fetch or upload
      When the workflow runs
      Then the run is marked failed and GitHub failure notifications fire

  @req:backups-are-restorable
  Rule: Backups are restorable
    A documented restore path rebuilds the database from any dump.

    @manual
    Scenario: Restore drill
      Given a nightly dump and a scratch database
      When the restore script runs
      Then the scratch database contents match the dump

  @req:pr-checks
  Rule: PR checks
    Lint, typecheck, and terraform plan block merging on failure.

    @manual
    Scenario: Broken PR blocked
      Given a PR failing lint, typecheck, or terraform plan
      When checks run
      Then the checks report failure on the PR

  @req:documented-secrets-and-turso-setup
  Rule: Documented secrets and Turso setup
    Every secret documented; one-time Turso provisioning script.

    @manual
    Scenario: Fresh setup
      Given a new environment provisioned following the docs
      When setup completes
      Then the Turso database, all secrets, and a working deploy result without undocumented steps
