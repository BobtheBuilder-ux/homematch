# SNS Setup for SES Bounce and Complaint Handling

This Terraform configuration includes SNS topics for handling Amazon SES bounces and complaints as required for production SES access.

## Resources Created

### SNS Topics
- **ses-bounces**: Handles bounce notifications from SES
- **ses-complaints**: Handles complaint notifications from SES

### IAM Permissions
- EC2 instances have permissions to subscribe to and receive messages from SNS topics
- SES service has permission to publish to both topics

## Configuration Steps

After deploying this Terraform configuration:

1. **Deploy the infrastructure**:
   ```bash
   terraform plan
   terraform apply
   ```

2. **Get the SNS Topic ARNs**:
   ```bash
   terraform output sns_bounces_topic_arn
   terraform output sns_complaints_topic_arn
   ```

3. **Configure SES to use SNS topics**:
   - In AWS SES Console, go to Configuration Sets or Identity settings
   - Set up bounce notifications to publish to the bounces topic ARN
   - Set up complaint notifications to publish to the complaints topic ARN

4. **Application Integration**:
   - Your application can subscribe to these SNS topics via HTTP/HTTPS endpoints
   - Process bounce and complaint notifications to maintain email reputation
   - Remove bounced/complained email addresses from your mailing lists

## Topic ARNs

The topic ARNs will be in the format:
- Bounces: `arn:aws:sns:us-east-1:ACCOUNT-ID:homematch-ses-bounces`
- Complaints: `arn:aws:sns:us-east-1:ACCOUNT-ID:homematch-ses-complaints`

## Security

- Topics are configured with policies that only allow SES to publish messages
- EC2 instances have minimal required permissions for SNS operations
- Account ID validation ensures only your AWS account can publish to topics

## Monitoring

Consider setting up CloudWatch alarms for:
- High bounce rates
- Complaint notifications
- Failed message deliveries

This setup supports the requirements mentioned in the AWS SES production access request.