import { PrismaClient } from '../../node_modules/.prisma/client';
import { sendEmail } from './emailService';
import { surveyConfirmationTemplate, welcomeToEmailListTemplate, inspectionRequestTemplate, inspectionApprovedTemplate } from './emailTemplates';

const prisma = new PrismaClient();

export interface EmailSubscriptionData {
  email: string;
  fullName: string;
  subscriptionType: 'tenant_survey' | 'landlord_survey' | 'newsletter';
}

export const addToEmailList = async (data: EmailSubscriptionData): Promise<void> => {
  try {
    // Check if email already exists
    const existingSubscription = await prisma.emailSubscription.findUnique({
      where: { email: data.email }
    });

    if (existingSubscription) {
      // Update existing subscription if it was previously unsubscribed
      if (!existingSubscription.isActive) {
        await prisma.emailSubscription.update({
          where: { email: data.email },
          data: {
            isActive: true,
            subscriptionType: data.subscriptionType,
            fullName: data.fullName,
            subscribedAt: new Date(),
            unsubscribedAt: null
          }
        });
        console.log(`Reactivated email subscription for: ${data.email}`);
      } else {
        console.log(`Email already subscribed: ${data.email}`);
      }
    } else {
      // Create new subscription
      await prisma.emailSubscription.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          subscriptionType: data.subscriptionType,
          isActive: true
        }
      });
      console.log(`Added new email subscription: ${data.email}`);
    }
  } catch (error) {
    console.error('Error adding to email list:', error);
    throw error;
  }
};

export const sendSurveyConfirmationEmail = async (
  email: string,
  fullName: string,
  surveyType: 'tenant' | 'landlord'
): Promise<void> => {
  try {
    const template = surveyConfirmationTemplate[surveyType];
    
    await sendEmail({
      to: email,
      subject: template.subject,
      body: template.body(fullName)
    });
    
    console.log(`Survey confirmation email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending survey confirmation email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (
  email: string,
  fullName: string,
  subscriptionType: string
): Promise<void> => {
  try {
    await sendEmail({
      to: email,
      subject: welcomeToEmailListTemplate.subject,
      body: welcomeToEmailListTemplate.body(fullName, subscriptionType)
    });
    
    console.log(`Welcome email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const unsubscribeFromEmailList = async (email: string): Promise<void> => {
  try {
    await prisma.emailSubscription.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    });
    
    console.log(`Unsubscribed email: ${email}`);
  } catch (error) {
    console.error('Error unsubscribing from email list:', error);
    throw error;
  }
};

export const getEmailSubscriptions = async (subscriptionType?: string) => {
  try {
    const whereClause = subscriptionType 
      ? { subscriptionType, isActive: true }
      : { isActive: true };
    
    return await prisma.emailSubscription.findMany({
      where: whereClause,
      orderBy: { subscribedAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching email subscriptions:', error);
    throw error;
  }
};

export const sendInspectionRequestEmail = async (
  tenantEmail: string,
  tenantName: string,
  propertyAddress: string,
  scheduledDate: string,
  preferredTime: string
): Promise<void> => {
  try {
    await sendEmail({
      to: tenantEmail,
      subject: inspectionRequestTemplate.subject,
      body: inspectionRequestTemplate.body(tenantName, propertyAddress, scheduledDate, preferredTime)
    });
    
    console.log(`Inspection request email sent to: ${tenantEmail}`);
  } catch (error) {
    console.error('Error sending inspection request email:', error);
    throw error;
  }
};

export const sendInspectionApprovedEmail = async (
  tenantEmail: string,
  tenantName: string,
  propertyAddress: string,
  scheduledDate: string,
  preferredTime: string,
  agentName: string,
  agentPhone: string
): Promise<void> => {
  try {
    await sendEmail({
      to: tenantEmail,
      subject: inspectionApprovedTemplate.subject,
      body: inspectionApprovedTemplate.body(tenantName, propertyAddress, scheduledDate, preferredTime, agentName, agentPhone)
    });
    
    console.log(`Inspection approved email sent to: ${tenantEmail}`);
  } catch (error) {
    console.error('Error sending inspection approved email:', error);
    throw error;
  }
};