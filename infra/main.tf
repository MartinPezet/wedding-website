terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # State bucket is the one resource not managed here (chicken-and-egg);
  # creation is a documented one-time step in README.md.
  backend "s3" {
    bucket       = "cm-wedding-website-tfstate"
    key          = "terraform.tfstate"
    region       = "eu-west-2"
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}
