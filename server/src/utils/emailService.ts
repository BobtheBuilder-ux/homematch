import nodemailer from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // This should be an App Password, not your regular Gmail password
    },
  });
};

export const sendEmail = async ({ to, subject, body, attachments }: EmailParams): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    // Convert attachments to nodemailer format
    const nodemailerAttachments: Attachment[] = attachments?.map(attachment => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })) || [];

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: body,
      attachments: nodemailerAttachments,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Test email configuration
export const testEmailConfiguration = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Gmail SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('Gmail SMTP configuration error:', error);
    return false;
  }
};