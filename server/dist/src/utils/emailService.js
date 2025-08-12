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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const ses = new client_ses_1.SESClient({ region: process.env.AWS_REGION });
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, body, attachments }) {
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
            yield ses.send(new client_ses_1.SendRawEmailCommand(rawParams));
        }
        catch (error) {
            console.error("Error sending email with attachments:", error);
            throw error;
        }
    }
    else {
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
            yield ses.send(new client_ses_1.SendEmailCommand(params));
        }
        catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }
});
exports.sendEmail = sendEmail;
