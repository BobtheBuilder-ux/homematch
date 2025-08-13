# Terraform Infrastructure Management

This directory contains Terraform configuration files to manage your existing AWS infrastructure for the real estate application.

## Prerequisites

- [x] Terraform installed (`terraform -version`)
- [x] AWS CLI configured (`aws configure`)
- [x] Existing AWS resources running in `us-east-1` region

## Directory Structure

```
terraform/
├── .gitignore          # Terraform-specific gitignore
├── provider.tf         # AWS provider configuration
├── main.tf            # Main resource definitions
├── variables.tf       # Input variables
├── outputs.tf         # Output values
└── README.md          # This file
```

## Getting Started

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Identify Your Existing Resources

Before importing, you need to identify the IDs of your existing AWS resources. Use the AWS CLI or Console to find:

#### VPC Resources
```bash
# List VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,Tags[?Key==`Name`].Value|[0]]' --output table

# List Subnets
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,VpcId,CidrBlock,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' --output table

# List Internet Gateways
aws ec2 describe-internet-gateways --query 'InternetGateways[*].[InternetGatewayId,Attachments[0].VpcId]' --output table

# List Security Groups
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName,VpcId]' --output table
```

#### EC2 Instances
```bash
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name,PublicIpAddress,PrivateIpAddress,Tags[?Key==`Name`].Value|[0]]' --output table
```

#### RDS Instances
```bash
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceClass,Engine,DBInstanceStatus,Endpoint.Address]' --output table

# List DB Subnet Groups
aws rds describe-db-subnet-groups --query 'DBSubnetGroups[*].[DBSubnetGroupName,VpcId]' --output table
```

#### S3 Buckets
```bash
aws s3 ls
```

#### Cognito User Pools
```bash
aws cognito-idp list-user-pools --max-results 20 --query 'UserPools[*].[Id,Name]' --output table

# Get User Pool Clients
aws cognito-idp list-user-pool-clients --user-pool-id YOUR_USER_POOL_ID --query 'UserPoolClients[*].[ClientId,ClientName]' --output table
```

#### SES Domain Identities
```bash
aws ses list-identities --query 'Identities' --output table
```

#### Route53 Hosted Zones
```bash
aws route53 list-hosted-zones --query 'HostedZones[*].[Id,Name]' --output table
```

#### Load Balancers
```bash
aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerArn,LoadBalancerName,DNSName,Type]' --output table

# List Target Groups
aws elbv2 describe-target-groups --query 'TargetGroups[*].[TargetGroupArn,TargetGroupName,VpcId]' --output table
```

### 3. Import Resources Step by Step

**Important**: Import resources one by one and run `terraform plan` after each import to verify.

#### Example Import Commands

Replace the placeholder IDs with your actual resource IDs:

```bash
# VPC
terraform import aws_vpc.main_vpc vpc-xxxxxxxxx

# Internet Gateway
terraform import aws_internet_gateway.main_igw igw-xxxxxxxxx

# Subnets
terraform import aws_subnet.public_subnet_1 subnet-xxxxxxxxx
terraform import aws_subnet.public_subnet_2 subnet-xxxxxxxxx
terraform import aws_subnet.private_subnet_1 subnet-xxxxxxxxx
terraform import aws_subnet.private_subnet_2 subnet-xxxxxxxxx

# Security Groups
terraform import aws_security_group.web_sg sg-xxxxxxxxx
terraform import aws_security_group.db_sg sg-xxxxxxxxx

# EC2 Instance
terraform import aws_instance.web_server i-xxxxxxxxx

# RDS
terraform import aws_db_instance.postgres_db your-db-instance-identifier
terraform import aws_db_subnet_group.db_subnet_group your-db-subnet-group-name

# S3
terraform import aws_s3_bucket.app_storage your-bucket-name
terraform import aws_s3_bucket_policy.app_storage_policy your-bucket-name

# Cognito
terraform import aws_cognito_user_pool.user_pool us-east-1_xxxxxxxxx
terraform import aws_cognito_user_pool_client.user_pool_client us-east-1_xxxxxxxxx/client-id

# SES
terraform import aws_ses_domain_identity.domain your-domain.com
terraform import aws_ses_domain_dkim.domain_dkim your-domain.com

# Route53
terraform import aws_route53_zone.main Z1234567890ABC

# Load Balancer
terraform import aws_lb.app_lb arn:aws:elasticloadbalancing:us-east-1:account:loadbalancer/app/name/id
terraform import aws_lb_target_group.app_tg arn:aws:elasticloadbalancing:us-east-1:account:targetgroup/name/id
```

### 4. Update Resource Configurations

After importing each resource, you need to update the configuration in `main.tf` to match the actual resource settings.

#### Get Current Resource State
```bash
# View imported resource details
terraform state show aws_instance.web_server
terraform state show aws_vpc.main_vpc
# etc.
```

#### Update main.tf
Copy the relevant attributes from the state output into your `main.tf` file. For example:

```hcl
resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "main-vpc"
  }
}
```

### 5. Verify Configuration

After updating configurations:

```bash
# Check for any configuration drift
terraform plan
```

The plan should show "No changes" if everything is configured correctly.

### 6. Test a Small Change

Once everything is imported and configured, test with a small, non-destructive change:

```bash
# Add a tag to a resource
terraform plan
terraform apply
```

## Important Notes

1. **Backup First**: Take snapshots of critical resources before starting
2. **Import One by One**: Don't try to import everything at once
3. **Verify Each Step**: Run `terraform plan` after each import
4. **Start Small**: Begin with less critical resources
5. **State File**: Keep your `.tfstate` file secure and backed up

## Next Steps

1. **Remote State**: Configure S3 backend for state storage
2. **Modules**: Organize code into reusable modules
3. **CI/CD**: Set up automated Terraform workflows
4. **Monitoring**: Add CloudWatch and alerting resources

## Troubleshooting

### Common Issues

1. **Resource Not Found**: Double-check resource IDs
2. **Permission Denied**: Ensure AWS credentials have sufficient permissions
3. **Configuration Mismatch**: Use `terraform state show` to see actual values
4. **Import Conflicts**: Some resources may have dependencies that need to be imported first

### Useful Commands

```bash
# List all resources in state
terraform state list

# Remove a resource from state (without destroying)
terraform state rm aws_instance.example

# Move a resource in state
terraform state mv aws_instance.old aws_instance.new

# Refresh state from actual infrastructure
terraform refresh
```

## Support

If you encounter issues during the import process, refer to:
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Import Documentation](https://www.terraform.io/docs/import/index.html)