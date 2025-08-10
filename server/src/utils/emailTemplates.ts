export const surveyConfirmationTemplate = {
  tenant: {
    subject: "Thank you for completing our Tenant Survey!",
    body: (fullName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Thank You for Your Feedback!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${fullName},</p>
          
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
    body: (fullName: string) => `
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

export const welcomeToEmailListTemplate = {
  subject: "Welcome to HomeMatch Updates!",
  body: (fullName: string, subscriptionType: string) => `
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

export const inspectionRequestTemplate = {
  subject: "Inspection Request Received - Under Review",
  body: (tenantName: string, propertyAddress: string, scheduledDate: string, preferredTime: string) => `
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

export const inspectionApprovedTemplate = {
  subject: "Inspection Request Approved - Agent Assigned",
  body: (tenantName: string, propertyAddress: string, scheduledDate: string, preferredTime: string, agentName: string, agentPhone: string) => `
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