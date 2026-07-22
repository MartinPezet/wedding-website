# infra-terraform

## Purpose

The AWS infrastructure (Amplify hosting, backup storage, IAM, Terraform state) that the wedding site runs on, defined as code under `infra/`.

## Requirements

### Requirement: AWS infrastructure defined as Terraform in the repo
All AWS resources (Amplify app, backup S3 bucket, IAM) SHALL be defined in Terraform under `infra/`, reproducible with `terraform apply`, with no console-created resources required for normal operation.

#### Scenario: Infrastructure reproducible
- **WHEN** `terraform apply` runs against an empty AWS account with required variables set
- **THEN** the Amplify app, backup bucket, and IAM resources are created and the site can deploy

### Requirement: Amplify hosts the Nuxt app
The Amplify app SHALL build and serve the Nuxt 4 site using the Nitro `aws-amplify` preset, connected to the GitHub repository's main branch.

#### Scenario: Push serves site
- **WHEN** a commit lands on main and the pipeline completes
- **THEN** the live Amplify URL serves the updated site with server routes functional

### Requirement: Versioned private backup bucket
The backup S3 bucket SHALL be private with versioning enabled so past backups are retained and recoverable.

#### Scenario: Backup retention
- **WHEN** nightly backups upload over time
- **THEN** previous backup objects remain retrievable via versioning

### Requirement: Remote Terraform state
Terraform state SHALL be stored in a remote S3 backend with locking, not on a developer machine.

#### Scenario: State shared
- **WHEN** terraform runs from CI or a second machine
- **THEN** it reads the same remote state and cannot corrupt it concurrently
