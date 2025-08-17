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
exports.testEmailConfiguration = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create Gmail transporter
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // This should be an App Password, not your regular Gmail password
        },
    });
};
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, body, attachments }) {
    try {
        const transporter = createTransporter();
        // Convert attachments to nodemailer format
        const nodemailerAttachments = (attachments === null || attachments === void 0 ? void 0 : attachments.map(attachment => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
        }))) || [];
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: body,
            attachments: nodemailerAttachments,
        };
        const result = yield transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
});
exports.sendEmail = sendEmail;
// Test email configuration
const testEmailConfiguration = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = createTransporter();
        yield transporter.verify();
        console.log('Gmail SMTP configuration is valid');
        return true;
    }
    catch (error) {
        console.error('Gmail SMTP configuration error:', error);
        return false;
    }
});
exports.testEmailConfiguration = testEmailConfiguration;
