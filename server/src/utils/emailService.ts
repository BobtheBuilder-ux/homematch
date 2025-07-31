import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION });

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async ({ to, subject, body }: EmailParams): Promise<void> => {
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
};