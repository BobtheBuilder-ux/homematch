# AWS SES (Simple Email Service) Setup Guide

This guide will help you configure AWS SES for email delivery in your real estate application.

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **Domain Verification**: For production, you'll need a verified domain
3. **AWS CLI** (optional but recommended): For easier configuration

## Step 1: AWS SES Configuration

### 1.1 Create AWS SES Service

1. **Login to AWS Console**: Go to [AWS Console](https://console.aws.amazon.com/)
2. **Navigate to SES**: Search for "SES" or "Simple Email Service"
3. **Select Region**: Choose your preferred region (e.g., `us-east-1`)

### 1.2 Verify Email Address (For Testing)

1. **Go to Verified Identities**: In SES dashboard, click "Verified identities"
2. **Create Identity**: Click "Create identity"
3. **Select Email Address**: Choose "Email address" option
4. **Enter Email**: Enter the email you want to send from (e.g., `noreply@yourdomain.com`)
5. **Verify**: Check your email and click the verification link

### 1.3 Verify Domain (For Production)

1. **Create Identity**: Click "Create identity"
2. **Select Domain**: Choose "Domain" option
3. **Enter Domain**: Enter your domain (e.g., `yourdomain.com`)
4. **DNS Configuration**: Add the provided DNS records to your domain
5. **Wait for Verification**: This can take up to 72 hours

### 1.4 Request Production Access

**Note**: By default, SES is in "sandbox mode" which only allows sending to verified email addresses.

1. **Go to Account Dashboard**: In SES, click "Account dashboard"
2. **Request Production Access**: Click "Request production access"
3. **Fill Form**: Complete the form with your use case details
4. **Submit**: AWS will review and approve (usually within 24-48 hours)

## Step 2: Create IAM User for SES

### 2.1 Create IAM User

1. **Go to IAM**: Navigate to IAM service in AWS Console
2. **Create User**: Click "Users" → "Create user"
3. **User Name**: Enter a name like `ses-email-user`
4. **Access Type**: Select "Programmatic access"

### 2.2 Attach SES Policy

1. **Attach Policy**: Choose "Attach existing policies directly"
2. **Search Policy**: Search for `AmazonSESFullAccess`
3. **Select Policy**: Check the box for `AmazonSESFullAccess`
4. **Create User**: Complete the user creation

### 2.3 Save Credentials

**Important**: Save the Access Key ID and Secret Access Key - you won't see them again!

## Step 3: Update Environment Variables

Update your `/server/.env` file with the following variables:

```env
# AWS SES Configuration
AWS_REGION=us-east-1                    # Your SES region
SES_FROM_EMAIL=noreply@yourdomain.com   # Your verified email/domain
AWS_ACCESS_KEY_ID=AKIA...               # Your IAM user access key
AWS_SECRET_ACCESS_KEY=your_secret_key    # Your IAM user secret key
```

### Environment Variable Details:

- **AWS_REGION**: The AWS region where you set up SES (e.g., `us-east-1`, `us-west-2`)
- **SES_FROM_EMAIL**: The verified email address or domain you want to send from
- **AWS_ACCESS_KEY_ID**: The access key from your IAM user
- **AWS_SECRET_ACCESS_KEY**: The secret key from your IAM user

## Step 4: Test Email Functionality

### 4.1 Restart Your Server

```bash
cd server
npm run dev
```

### 4.2 Test Email Sending

The application will automatically use AWS SES for:
- Application confirmations
- Lease agreements
- Payment notifications
- Status updates

### 4.3 Monitor Email Delivery

1. **SES Dashboard**: Check the SES dashboard for sending statistics
2. **CloudWatch**: Monitor email metrics in CloudWatch
3. **Bounce/Complaint Handling**: Set up SNS notifications for bounces and complaints

## Step 5: Production Considerations

### 5.1 Domain Authentication

- **DKIM**: Enable DKIM signing for better deliverability
- **SPF Record**: Add SPF record to your DNS
- **DMARC**: Consider implementing DMARC policy

### 5.2 Monitoring and Alerts

```bash
# Example CloudWatch alarm for bounce rate
aws cloudwatch put-metric-alarm \
  --alarm-name "SES-High-Bounce-Rate" \
  --alarm-description "Alert when bounce rate is high" \
  --metric-name "Bounce" \
  --namespace "AWS/SES" \
  --statistic "Average" \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator "GreaterThanThreshold"
```

### 5.3 Rate Limits

- **Sending Rate**: Monitor your sending rate limits
- **Daily Quota**: Keep track of daily sending quota
- **Gradual Increase**: AWS gradually increases limits based on usage

## Step 6: Troubleshooting

### Common Issues:

1. **"Email address not verified"**
   - Solution: Verify the sender email address in SES console

2. **"Access Denied"**
   - Solution: Check IAM permissions for the user

3. **"Region not supported"**
   - Solution: Ensure you're using a region that supports SES

4. **"Sandbox restrictions"**
   - Solution: Request production access or verify recipient emails

### Debug Email Issues:

```javascript
// Add this to your emailService.ts for debugging
console.log('SES Configuration:', {
  region: process.env.AWS_REGION,
  fromEmail: process.env.SES_FROM_EMAIL,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});
```

## Step 7: Security Best Practices

1. **Rotate Keys**: Regularly rotate your AWS access keys
2. **Least Privilege**: Use minimal required permissions
3. **Environment Variables**: Never commit credentials to version control
4. **VPC Endpoints**: Consider using VPC endpoints for enhanced security
5. **Encryption**: Enable encryption in transit and at rest

## Cost Optimization

- **Free Tier**: 62,000 emails per month free when sent from EC2
- **Pricing**: $0.10 per 1,000 emails after free tier
- **Data Transfer**: Additional charges for data transfer

## Support Resources

- **AWS SES Documentation**: [https://docs.aws.amazon.com/ses/](https://docs.aws.amazon.com/ses/)
- **AWS Support**: Use AWS Support for technical issues
- **Community Forums**: AWS Developer Forums for community help

---

**Note**: Replace placeholder values (like `yourdomain.com`, access keys) with your actual values. Keep your AWS credentials secure and never share them publicly.