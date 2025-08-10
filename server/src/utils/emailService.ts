import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION });

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

export const sendEmail = async ({ to, subject, body, attachments }: EmailParams): Promise<void> => {
  if (attachments && attachments.length > 0) {
    // Use SendRawEmailCommand for emails with attachments
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let rawMessage = `From: ${process.env.SES_FROM_EMAIL}\r\n`;
    rawMessage += `To: ${to}\r\n`;
    rawMessage += `Subject: ${subject}\r\n`;
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    
    // HTML body part
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
    rawMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    rawMessage += `${body}\r\n\r\n`;
    
    // Attachment parts
    for (const attachment of attachments) {
      rawMessage += `--${boundary}\r\n`;
      rawMessage += `Content-Type: ${attachment.contentType}\r\n`;
      rawMessage += `Content-Transfer-Encoding: base64\r\n`;
      rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
      rawMessage += `${attachment.content.toString('base64')}\r\n\r\n`;
    }
    
    rawMessage += `--${boundary}--\r\n`;
    
    const rawParams = {
      Source: process.env.SES_FROM_EMAIL,
      Destinations: [to],
      RawMessage: {
        Data: Buffer.from(rawMessage)
      }
    };
    
    try {
      await ses.send(new SendRawEmailCommand(rawParams));
    } catch (error) {
      console.error("Error sending email with attachments:", error);
      throw error;
    }
  } else {
    // Use regular SendEmailCommand for emails without attachments
    const params = {
      Source: process.env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: body,
            Charset: "UTF-8",
          },
        },
      },
    };

    try {
      await ses.send(new SendEmailCommand(params));
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
};