# Resend Email Service Setup Guide

This guide will help you set up Resend as your email service provider for the HomeMatch rental platform.

## Prerequisites

- A Resend account (sign up at [resend.com](https://resend.com))
- A verified domain for sending emails
- Access to your project's environment variables

## Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up for an account
2. Verify your email address
3. Complete the account setup process

## Step 2: Verify Your Domain

1. **Add Your Domain**:
   - In the Resend dashboard, go to "Domains"
   - Click "Add Domain"
   - Enter your domain (e.g., `homematch.ng`)

2. **Configure DNS Records**:
   - Add the provided DNS records to your domain's DNS settings
   - Wait for DNS propagation (usually 5-15 minutes)
   - Verify the domain in the Resend dashboard

## Step 3: Generate API Key

1. **Create API Key**:
   - Go to "API Keys" in the Resend dashboard
   - Click "Create API Key"
   - Give it a descriptive name (e.g., "HomeMatch Production")
   - Select the appropriate permissions (Send emails)
   - Copy the generated API key (starts with `re_`)

⚠️ **Important**: Store this API key securely - you won't be able to see it again!

## Step 4: Configure Environment Variables

Update your `.env` file with the following Resend configuration:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Home Match <support@yourdomain.com>
```

### Environment Variables Explanation:

- `RESEND_API_KEY`: Your Resend API key (starts with `re_`)
- `RESEND_FROM_EMAIL`: The sender email address (must be from your verified domain)

## Step 5: Test Email Configuration

Run the email test script to verify your setup:

```bash
# Navigate to the server directory
cd server

# Test basic email functionality
npx ts-node -r dotenv/config src/test-email.ts

# Test email templates
npx ts-node -r dotenv/config src/test-email-templates.ts
```

## Step 6: Production Considerations

### Domain Reputation
- Use a dedicated subdomain for transactional emails (e.g., `mail.yourdomain.com`)
- Implement proper SPF, DKIM, and DMARC records
- Monitor your sending reputation

### Rate Limits
- Resend has generous rate limits for most use cases
- Monitor your usage in the Resend dashboard
- Consider upgrading your plan if needed

### Security
- Keep your API key secure and never commit it to version control
- Use environment variables for all sensitive configuration
- Rotate API keys periodically

## Troubleshooting

### Common Issues

1. **"Domain not verified" error**:
   - Check that all DNS records are properly configured
   - Wait for DNS propagation (up to 24 hours in some cases)
   - Verify the domain status in Resend dashboard

2. **"Invalid API key" error**:
   - Ensure the API key is correctly copied
   - Check that the API key hasn't been revoked
   - Verify the API key has the correct permissions

3. **"From address not allowed" error**:
   - Ensure the from email address uses your verified domain
   - Check that the domain is fully verified in Resend

### Getting Help

- Check the [Resend Documentation](https://resend.com/docs)
- Contact Resend support through their dashboard
- Review the Resend status page for service issues

## Migration from Gmail SMTP

If you're migrating from Gmail SMTP, the following environment variables are no longer needed:

```env
# Remove these Gmail SMTP variables:
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
```

Replace them with the Resend configuration shown in Step 4.

## Benefits of Using Resend

- **Better Deliverability**: Professional email service with high delivery rates
- **Simpler Setup**: No need for app passwords or complex SMTP configuration
- **Better Analytics**: Track email opens, clicks, and delivery status
- **Scalability**: Handle high email volumes without issues
- **Modern API**: RESTful API with excellent documentation
- **Reliability**: Built for transactional emails with high uptime

## Support

For technical issues related to the HomeMatch email integration:
1. Check the troubleshooting section above
2. Review the test scripts output for specific error messages
3. Verify your Resend dashboard for delivery status
4. Contact the development team with specific error details

---

**Last Updated**: December 2024
**Version**: 1.0