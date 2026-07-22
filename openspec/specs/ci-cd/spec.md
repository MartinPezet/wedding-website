# ci-cd

## Purpose

Automated deployment, backup, and PR-check pipelines that ship the wedding site and its data safely without manual steps.

## Requirements

### Requirement: Deployment via GitHub Actions
Pushing to main SHALL trigger a workflow that applies Terraform changes, runs Drizzle migrations against the production Turso database, and results in the Amplify build serving the new version. Database migrations SHALL be applied before the new application version serves traffic.

#### Scenario: Full deploy from push
- **WHEN** a commit with a schema migration is pushed to main
- **THEN** the migration is applied to Turso and the new app version goes live without manual steps

#### Scenario: Migration failure halts deploy
- **WHEN** a migration fails against Turso
- **THEN** the workflow fails visibly and the new version is not promoted

### Requirement: Nightly automated backups
A scheduled workflow SHALL run nightly, fetch the full JSON backup from the app's secured backup endpoint, and store it in the S3 backup bucket (dated) plus a workflow artifact copy.

#### Scenario: Nightly backup lands in S3
- **WHEN** the scheduled backup workflow runs
- **THEN** a dated JSON dump appears in the backup bucket and as a workflow artifact

#### Scenario: Backup failure is visible
- **WHEN** the backup fetch or upload fails
- **THEN** the workflow run is marked failed (notifying via GitHub's failure notifications)

### Requirement: Backups are restorable
A documented restore path SHALL rebuild the database from any stored dump, and restore SHALL be verified against a scratch database as part of this change.

#### Scenario: Restore drill
- **WHEN** the restore script runs against a nightly dump and a scratch database
- **THEN** the scratch database contents match the dump

### Requirement: PR checks
Pull requests SHALL run lint, typecheck, and `terraform plan` (no apply), blocking merge on failure.

#### Scenario: Broken PR blocked
- **WHEN** a PR fails lint, typecheck, or terraform plan
- **THEN** the checks report failure on the PR

### Requirement: Documented secrets and Turso setup
The repo SHALL document every required secret/env var (purpose, location: GitHub secrets vs Amplify env) and provide a one-time Turso provisioning script.

#### Scenario: Fresh setup
- **WHEN** a new environment is provisioned following the docs
- **THEN** the Turso database, all secrets, and a working deploy result without undocumented steps
