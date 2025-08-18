"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emailService_1 = require("./utils/emailService");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
function testEmail() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing Resend email configuration...');
        console.log('Configuration:');
        console.log('- Resend API Key:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
        console.log('- From Email:', process.env.RESEND_FROM_EMAIL);
        console.log('');
        try {
            // First test the configuration
            console.log('🔧 Testing Resend configuration...');
            const isConfigValid = yield (0, emailService_1.testEmailConfiguration)();
            if (!isConfigValid) {
                console.log('❌ Resend configuration is invalid. Please check your API key.');
                return;
            }
            console.log('✅ Resend configuration is valid!');
            console.log('');
            // Test email - replace with your email address
            const testEmailAddress = 'berrybobbiechuks@gmail.com';
            console.log(`📧 Sending test email to: ${testEmailAddress}`);
            yield (0, emailService_1.sendEmail)({
                to: testEmailAddress,
                subject: 'Resend Integration Test - HomeMatch Application',
                body: `
        <html>
          <body>
            <h2>🎉 Resend Integration Successful!</h2>
            <p>This is a test email from your HomeMatch rental application.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>Email Service: Resend</li>
              <li>From Email: ${process.env.RESEND_FROM_EMAIL}</li>
              <li>API Key: ${process.env.RESEND_API_KEY ? 'Configured' : 'Not configured'}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
            </ul>
            <p>Your Resend integration is working correctly!</p>
            <hr>
            <p><small>This email was sent from the HomeMatch application test script.</small></p>
          </body>
        </html>
      `
            });
            console.log('✅ Test email sent successfully!');
            console.log(`📧 Email sent to: ${testEmailAddress}`);
            console.log('\n🔍 Check your email inbox to confirm delivery.');
            console.log('\n📝 Note: Make sure you have set your RESEND_API_KEY in the environment variables.');
        }
        catch (error) {
            console.error('❌ Failed to send test email:');
            console.error(error);
            console.log('\n🔧 Troubleshooting tips:');
            console.log('1. Verify your Resend API key is correct');
            console.log('2. Check that your domain is verified in Resend dashboard');
            console.log('3. Ensure RESEND_FROM_EMAIL is set to a verified sender');
            console.log('4. Check your internet connection');
            console.log('5. Verify your Resend account is active and not suspended');
        }
    });
}
// Run the test
testEmail().then(() => {
    console.log('\n✨ Email test completed.');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Email test failed:', error);
    process.exit(1);
});
