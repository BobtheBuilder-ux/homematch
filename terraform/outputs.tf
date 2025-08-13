# Outputs for the Terraform configuration

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main_vpc.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app_alb.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.app_alb.zone_id
}

# output "ec2_instance_id" {
#   description = "ID of the EC2 instance"
#   value       = aws_instance.web_server.id
# }

# output "ec2_public_ip" {
#   description = "Public IP of the EC2 instance"
#   value       = aws_instance.web_server.public_ip
# }

# output "ec2_private_ip" {
#   description = "Private IP of the EC2 instance"
#   value       = aws_instance.web_server.private_ip
# }

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres_db.endpoint
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}

output "route53_zone_id" {
  description = "Route53 Hosted Zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route53 Name Servers"
  value       = aws_route53_zone.main.name_servers
}

output "ssl_certificate_arn" {
  description = "SSL Certificate ARN"
  value       = aws_acm_certificate.ssl_cert.arn
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "api_domain" {
  description = "API subdomain"
  value       = "api.${var.domain_name}"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app_storage.bucket
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

# output "route53_zone_id" {
#   description = "Route53 hosted zone ID"
#   value       = aws_route53_zone.main.zone_id
# }

# output "load_balancer_dns" {
#   description = "DNS name of the load balancer"
#   value       = aws_lb.app_lb.dns_name
# }

# output "load_balancer_arn" {
#   description = "ARN of the load balancer"
#   value       = aws_lb.app_lb.arn
# }