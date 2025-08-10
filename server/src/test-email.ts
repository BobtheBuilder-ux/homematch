import { sendEmail } from './utils/emailService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('Testing AWS SES email configuration...');
  console.log('Configuration:');
  console.log('- AWS Region:', process.env.AWS_REGION);
  console.log('- From Email:', process.env.SES_FROM_EMAIL);
  console.log('- Has Access Key:', !!process.env.AWS_ACCESS_KEY_ID);
  console.log('- Has Secret Key:', !!process.env.AWS_SECRET_ACCESS_KEY);
  console.log('');

  try {
    // Test email - replace with your verified email address
    const testEmailAddress = process.env.SES_FROM_EMAIL || 'test@example.com';
    
    await sendEmail({
      to: testEmailAddress,
      subject: 'AWS SES Test Email - HomeMatch Application',
      body: `
        <html>
          <body>
            <h2>🎉 AWS SES Integration Successful!</h2>
            <p>This is a test email from your HomeMatch real estate application.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>AWS Region: ${process.env.AWS_REGION}</li>
              <li>From Email: ${process.env.SES_FROM_EMAIL}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
            </ul>
            <p>Your AWS SES integration is working correctly!</p>
            <hr>
            <p><small>This email was sent from the HomeMatch application test script.</small></p>
          </body>
        </html>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Email sent to: ${testEmailAddress}`);
    console.log('\n🔍 Check your email inbox to confirm delivery.');
    console.log('\n📝 Note: If you\'re in SES sandbox mode, you can only send to verified email addresses.');
    
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error(error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Verify your AWS credentials are correct');
    console.log('2. Ensure your email address is verified in AWS SES');
    console.log('3. Check if you need to request production access');
    console.log('4. Verify your AWS region is correct');
  }
}

// Run the test
testEmail().then(() => {
  console.log('\n✨ Email test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Email test failed:', error);
  process.exit(1);
});