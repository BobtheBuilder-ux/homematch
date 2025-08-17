import { sendEmail, testEmailConfiguration } from './utils/emailService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('Testing Gmail SMTP email configuration...');
  console.log('Configuration:');
  console.log('- Email Host:', process.env.EMAIL_HOST);
  console.log('- Email Port:', process.env.EMAIL_PORT);
  console.log('- Email User:', process.env.EMAIL_USER);
  console.log('- Has Email Password:', !!process.env.EMAIL_PASS);
  console.log('');

  try {
    // First test the configuration
    console.log('🔧 Testing Gmail SMTP configuration...');
    const isConfigValid = await testEmailConfiguration();
    
    if (!isConfigValid) {
      console.log('❌ Gmail SMTP configuration is invalid. Please check your credentials.');
      return;
    }
    
    console.log('✅ Gmail SMTP configuration is valid!');
    console.log('');
    
    // Test email - replace with your email address
    const testEmailAddress = process.env.EMAIL_USER || 'berrybobbiechuks@gmail.com';
    
    console.log(`📧 Sending test email to: ${testEmailAddress}`);
    
    await sendEmail({
      to: testEmailAddress,
      subject: 'Gmail SMTP Test Email - HomeMatch Application',
      body: `
        <html>
          <body>
            <h2>🎉 Gmail SMTP Integration Successful!</h2>
            <p>This is a test email from your HomeMatch rental application.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>Email Host: ${process.env.EMAIL_HOST}</li>
              <li>Email Port: ${process.env.EMAIL_PORT}</li>
              <li>Email User: ${process.env.EMAIL_USER}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
            </ul>
            <p>Your Gmail SMTP integration is working correctly!</p>
            <hr>
            <p><small>This email was sent from the HomeMatch application test script.</small></p>
          </body>
        </html>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Email sent to: ${testEmailAddress}`);
    console.log('\n🔍 Check your email inbox to confirm delivery.');
    console.log('\n📝 Note: Make sure you have enabled "Less secure app access" or use an App Password for Gmail.');
    
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error(error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Verify your Gmail credentials are correct');
    console.log('2. Enable 2-Factor Authentication and use an App Password');
    console.log('3. Check if "Less secure app access" is enabled (not recommended)');
    console.log('4. Verify your Gmail account allows SMTP access');
    console.log('5. Check your internet connection and firewall settings');
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