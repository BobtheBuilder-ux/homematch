# Paystack Payment Integration Setup

This guide will help you configure the Paystack payment integration for your real estate application.

## Required Environment Variables

### Server Configuration (`/server/.env`)

Add the following variables to your server's `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
CLIENT_URL=http://localhost:3000

# AWS SES Configuration (for lease agreements)
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### Client Configuration (`/client/.env`)

Add the following variable to your client's `.env` file:

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

## Getting Your Paystack Keys

1. **Sign up for Paystack**: Visit [https://paystack.com](https://paystack.com) and create an account
2. **Get your API keys**: 
   - Log into your Paystack dashboard
   - Navigate to Settings > API Keys & Webhooks
   - Copy your **Test Public Key** and **Test Secret Key**
   - For production, use your **Live** keys

## AWS SES Configuration

1. **Set up AWS SES**: Follow the detailed setup guide in `AWS_SES_SETUP.md`
2. **Key Steps**:
   - Create AWS account and navigate to SES
   - Verify your email address or domain
   - Create IAM user with SES permissions
   - Get AWS access keys
   - Request production access (for sending to unverified emails)
3. **Important**: Replace placeholder values with your actual AWS credentials

## Testing the Integration

1. **Start both servers**:
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev
   
   # Terminal 2 - Client
   cd client
   npm run dev
   ```

2. **Test payment flow**:
   - Navigate to a tenant's residence page
   - Click "Make Payment" in the billing history section
   - Use Paystack test card: `4084084084084081`
   - CVV: `408`, Expiry: any future date
   - PIN: `0000`, OTP: `123456`

## Payment Flow Overview

1. **Payment Initialization**: User clicks "Make Payment" → API calls Paystack to create transaction
2. **Payment Processing**: User redirected to Paystack → completes payment
3. **Payment Verification**: Paystack redirects back → API verifies payment
4. **Lease Agreement**: On successful payment → PDF lease agreement generated and emailed
5. **Record Update**: Payment status updated in database

## Security Notes

- Never commit your actual API keys to version control
- Use test keys during development
- Switch to live keys only in production
- Keep your secret key secure and never expose it in client-side code

## Troubleshooting

- **Payment fails**: Check your Paystack keys are correct
- **Email not sent**: Verify Gmail app password and SMTP settings
- **Callback issues**: Ensure `CLIENT_URL` matches your frontend URL
- **CORS errors**: Make sure both servers are running on correct ports