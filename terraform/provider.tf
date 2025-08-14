# Terraform provider configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# AWS Provider configuration
provider "aws" {
  region = "us-east-1"

  # Use default AWS credentials from AWS CLI or environment variables
  # Make sure you have run 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
}

# Optional: Configure default tags for all resources
provider "aws" {
  alias  = "default"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "HomeMatch"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}