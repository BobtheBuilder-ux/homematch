"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyRentedNotificationTemplate = exports.applicationApprovedTemplate = exports.applicationSubmittedTemplate = exports.inspectionApprovedTemplate = exports.inspectionRequestTemplate = exports.tenantWelcomeTemplate = exports.welcomeToEmailListTemplate = exports.surveyConfirmationTemplate = void 0;
exports.surveyConfirmationTemplate = {
    tenant: {
        subject: "Thank you for completing our Tenant Survey!",
        body: (fullName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <style>
          @media only screen and (max-width: 600px) {
            .email-container { padding: 10px !important; }
            .email-content { padding: 20px !important; }
            .email-button { padding: 10px 20px !important; font-size: 14px !important; }
            .email-text { font-size: 14px !important; }
            .email-heading { font-size: 20px !important; }
          }
        </style>
        <div class="email-content" style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 class="email-heading" style="color: #2563eb; margin-bottom: 20px;">Thank You for Your Feedback!</h2>
          
          <p class="email-text" style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for taking the time to complete our tenant survey. Your feedback is invaluable in helping us create a better rental experience for everyone.
          </p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">What's Next?</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li>We'll analyze your responses to improve our platform</li>
              <li>You'll be among the first to know when we launch</li>
              <li>We may reach out for additional feedback opportunities</li>
            </ul>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're committed to revolutionizing the rental market and your input helps us get there faster.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong style="color: #2563eb;">The HomeMatch Team</strong>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9ca3af; font-size: 12px;">
            You're receiving this email because you completed our tenant survey.
            <br>
            If you no longer wish to receive updates, you can unsubscribe at any time.
          </p>
        </div>
      </div>
    `
    },
    landlord: {
        subject: "Thank you for completing our Landlord Survey!",
        body: (fullName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #059669; margin-bottom: 20px;">Thank You for Your Valuable Input!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for completing our landlord survey. Your insights into property management challenges and needs are crucial for building a platform that truly serves landlords.
          </p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="color: #047857; margin: 0 0 10px 0;">What's Next?</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li>We'll use your feedback to prioritize features that matter most to landlords</li>
              <li>You'll receive early access notifications when we launch</li>
              <li>We may invite you to beta test new features</li>
            </ul>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Our goal is to simplify property management and maximize your rental income. Your feedback brings us one step closer to that vision.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong style="color: #059669;">The HomeMatch Team</strong>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9ca3af; font-size: 12px;">
            You're receiving this email because you completed our landlord survey.
            <br>
            If you no longer wish to receive updates, you can unsubscribe at any time.
          </p>
        </div>
      </div>
    `
    }
};
exports.welcomeToEmailListTemplate = {
    subject: "Welcome to HomeMatch Updates!",
    body: (fullName, subscriptionType) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #7c3aed; margin-bottom: 20px;">Welcome to Our Community!</h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${fullName},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          You've been added to our email list as a ${subscriptionType.replace('_', ' ')} participant. We're excited to keep you updated on our progress!
        </p>
        
        <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <h3 style="color: #6b21a8; margin: 0 0 10px 0;">What to Expect:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li>Platform launch announcements</li>
            <li>Early access opportunities</li>
            <li>Feature updates and improvements</li>
            <li>Exclusive beta testing invitations</li>
          </ul>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We promise to only send you relevant updates and never spam your inbox.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Thank you for being part of our journey,<br>
            <strong style="color: #7c3aed;">The HomeMatch Team</strong>
          </p>
        </div>
      </div>
    </div>
  `
};
exports.tenantWelcomeTemplate = {
    subject: "Welcome to HomeMatch - Your Journey Starts Here! 🏠",
    body: (tenantName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #10b981; margin-bottom: 20px;">🎉 Welcome to HomeMatch!</h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${tenantName},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Welcome to HomeMatch! We're thrilled to have you join our community of tenants who are looking for their perfect home. Your account has been successfully created and you're now ready to start your rental journey with us.
        </p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #047857; margin: 0 0 15px 0;">🚀 What You Can Do Now:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Browse thousands of verified rental properties</li>
            <li style="margin-bottom: 8px;">Save your favorite properties for easy access</li>
            <li style="margin-bottom: 8px;">Schedule property inspections with ease</li>
            <li style="margin-bottom: 8px;">Submit rental applications directly through our platform</li>
            <li style="margin-bottom: 8px;">Connect directly with verified landlords</li>
          </ul>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0;">💡 Getting Started Tips:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Complete your profile to increase your chances of approval</li>
            <li style="margin-bottom: 8px;">Set up search alerts for properties that match your criteria</li>
            <li style="margin-bottom: 8px;">Read our tenant guide for helpful rental tips</li>
            <li style="margin-bottom: 8px;">Contact our support team if you need any assistance</li>
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">🔒 Your Security Matters:</h3>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            All properties on our platform are verified, and we use secure payment processing to protect your financial information. Your safety and security are our top priorities.
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Ready to find your dream home? Log in to your account and start exploring the amazing properties available in your area!
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="#" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Browsing Properties</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Welcome to the HomeMatch family!<br>
            <strong style="color: #10b981;">The HomeMatch Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
          You're receiving this email because you just created a tenant account with HomeMatch.
          <br>
          If you have any questions, feel free to contact our support team.
        </p>
      </div>
    </div>
  `
};
exports.inspectionRequestTemplate = {
    subject: "Inspection Request Received - Under Review",
    body: (tenantName, propertyAddress, scheduledDate, preferredTime) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #f59e0b; margin-bottom: 20px;">🏠 Inspection Request Received</h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${tenantName},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thank you for your inspection request. We have received your request and it is currently <strong>pending review</strong>.
        </p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 15px 0;">📋 Request Details:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; list-style: none;">
            <li style="margin-bottom: 8px;"><strong>Property:</strong> ${propertyAddress}</li>
            <li style="margin-bottom: 8px;"><strong>Scheduled Date:</strong> ${scheduledDate}</li>
            <li style="margin-bottom: 8px;"><strong>Preferred Time:</strong> ${preferredTime}</li>
            <li style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Review</span></li>
          </ul>
        </div>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0;">⏰ What Happens Next?</h3>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            Your request will be reviewed within the <strong>next hour</strong>. Once approved, you'll receive another email with:
          </p>
          <ul style="color: #374151; margin: 10px 0 0 0; padding-left: 20px;">
            <li>Confirmation of your inspection appointment</li>
            <li>Assigned agent's name and contact information</li>
            <li>Any additional instructions for the inspection</li>
          </ul>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you have any questions or need to make changes to your request, please contact our support team.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong style="color: #f59e0b;">The HomeMatch Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated notification for your inspection request.
        </p>
      </div>
    </div>
  `
};
exports.inspectionApprovedTemplate = {
    subject: "Inspection Request Approved - Agent Assigned",
    body: (tenantName, propertyAddress, scheduledDate, preferredTime, agentName, agentPhone) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #10b981; margin-bottom: 20px;">✅ Inspection Request Approved!</h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${tenantName},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Great news! Your inspection request has been <strong>approved</strong> and we've assigned an agent to assist you.
        </p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #047857; margin: 0 0 15px 0;">🏠 Inspection Details:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; list-style: none;">
            <li style="margin-bottom: 8px;"><strong>Property:</strong> ${propertyAddress}</li>
            <li style="margin-bottom: 8px;"><strong>Date:</strong> ${scheduledDate}</li>
            <li style="margin-bottom: 8px;"><strong>Time:</strong> ${preferredTime}</li>
            <li style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Approved</span></li>
          </ul>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0;">👤 Your Assigned Agent:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; margin: 0 0 8px 0; font-size: 18px;"><strong>${agentName}</strong></p>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">📞 Phone: <strong style="color: #3b82f6;">${agentPhone}</strong></p>
          </div>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">📝 Important Notes:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li>Please arrive on time for your scheduled inspection</li>
            <li>Bring a valid ID and any necessary documentation</li>
            <li>Feel free to contact your assigned agent if you have any questions</li>
            <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
          </ul>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We're excited to help you find your perfect home! If you have any questions, don't hesitate to reach out to your assigned agent or our support team.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong style="color: #10b981;">The HomeMatch Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated notification for your approved inspection request.
        </p>
      </div>
    </div>
  `
};
// Tenant Application Email Templates
exports.applicationSubmittedTemplate = {
    subject: "Application Received - Under Review",
    body: (tenantName, propertyAddress, applicationDate, annualRent, securityDeposit, applicationFee) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #3b82f6; margin-bottom: 20px;">📋 Application Received Successfully!</h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${tenantName},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thank you for submitting your rental application! We have received your application and it is currently <strong>being processed</strong>.
        </p>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0;">🏠 Application Details:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; list-style: none;">
            <li style="margin-bottom: 8px;"><strong>Property:</strong> ${propertyAddress}</li>
            <li style="margin-bottom: 8px;"><strong>Application Date:</strong> ${applicationDate}</li>
            <li style="margin-bottom: 8px;"><strong>Annual Rent:</strong> ₦${annualRent.toLocaleString()}</li>
            <li style="margin-bottom: 8px;"><strong>Security Deposit:</strong> ₦${securityDeposit.toLocaleString()}</li>
            <li style="margin-bottom: 8px;"><strong>Application Fee:</strong> ₦${applicationFee.toLocaleString()}</li>
            <li style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Under Review</span></li>
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">⏰ What Happens Next?</h3>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            Your application will be reviewed by the landlord. You will receive an email notification once a decision has been made. This process typically takes <strong>24-48 hours</strong>.
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We appreciate your patience during the review process. If you have any questions, please don't hesitate to contact our support team.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong style="color: #3b82f6;">The HomeMatch Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated notification for your rental application submission.
        </p>
      </div>
    </div>
  `
};
exports.applicationApprovedTemplate = {
    subject: "🎉 Your Rental Application Has Been Approved!",
    body: (tenantName, propertyAddress, propertyId, annualRent, securityDeposit, applicationFee) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #10b981; margin-bottom: 20px;">🎉 Congratulations! Your Application Has Been Approved!</h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${tenantName},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We're thrilled to inform you that your rental application for <strong>${propertyAddress}</strong> has been <strong>approved</strong>!
        </p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #047857; margin: 0 0 15px 0;">🏠 Property Details:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; list-style: none;">
            <li style="margin-bottom: 8px;"><strong>Property:</strong> ${propertyAddress}</li>
            <li style="margin-bottom: 8px;"><strong>Annual Rent:</strong> ₦${annualRent.toLocaleString()}</li>
            <li style="margin-bottom: 8px;"><strong>Security Deposit:</strong> ₦${securityDeposit.toLocaleString()}</li>
            <li style="margin-bottom: 8px;"><strong>Application Fee:</strong> ₦${applicationFee.toLocaleString()}</li>
            <li style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Approved</span></li>
          </ul>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0;">💳 Next Steps - Payment Required:</h3>
          <p style="color: #374151; margin: 0 0 10px 0; font-size: 16px; line-height: 1.6;">
            To secure your rental, please proceed with the payment:
          </p>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li>Log in to your tenant dashboard</li>
            <li>Navigate to the property details</li>
            <li>Click on "Pay Now" to complete your payment</li>
            <li>Your lease will be activated upon successful payment</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.CLIENT_URL}/tenants/properties/${propertyId}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Property & Pay Now</a>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Important:</h3>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            Please complete your payment within <strong>48 hours</strong> to secure this property. Failure to do so may result in the approval being revoked.
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We're excited to welcome you as our new tenant! If you have any questions about the payment process, please contact our support team.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Congratulations once again!<br>
            <strong style="color: #10b981;">The HomeMatch Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated notification for your approved rental application.
        </p>
      </div>
    </div>
  `
};
exports.propertyRentedNotificationTemplate = {
    subject: "🏠 Your Property Has Been Rented!",
    body: (landlordName, propertyAddress, tenantName, tenantPhone, annualRent) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #059669; margin-bottom: 20px;">🎉 Congratulations! Your Property Has Been Rented!</h2>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${landlordName},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Great news! Your property at <strong>${propertyAddress}</strong> has been successfully rented. The tenant has completed their payment and the lease is now active.
        </p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="color: #047857; margin: 0 0 15px 0;">🏠 Property Details:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; list-style: none;">
            <li style="margin-bottom: 8px;"><strong>Property:</strong> ${propertyAddress}</li>
            <li style="margin-bottom: 8px;"><strong>Annual Rent:</strong> $${annualRent.toLocaleString()}</li>
            <li style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Rented</span></li>
          </ul>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0;">👤 Your New Tenant:</h3>
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; margin: 0 0 8px 0; font-size: 18px;"><strong>${tenantName}</strong></p>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">📞 Phone: <strong style="color: #3b82f6;">${tenantPhone}</strong></p>
          </div>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">📋 What's Next?</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li>The lease agreement is now active</li>
            <li>You can contact your tenant using the provided phone number</li>
            <li>Monitor your property and rental income through your landlord dashboard</li>
            <li>Set up any necessary maintenance schedules or property management tasks</li>
          </ul>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thank you for using HomeMatch to rent your property. We're here to support you throughout the tenancy period.
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.CLIENT_URL}/landlords/dashboard" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Your Dashboard</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Congratulations on your successful rental!<br>
            <strong style="color: #059669;">The HomeMatch Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated notification for your rented property.
        </p>
      </div>
    </div>
  `
};
