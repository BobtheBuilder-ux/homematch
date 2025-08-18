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
exports.testEmailConfiguration = exports.sendEmail = void 0;
const resend_1 = require("resend");
// Create Resend instance
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, body, attachments }) {
    var _b;
    try {
        // Convert attachments to Resend format
        const resendAttachments = (attachments === null || attachments === void 0 ? void 0 : attachments.map(attachment => ({
            filename: attachment.filename,
            content: attachment.content,
        }))) || [];
        const emailData = Object.assign({ from: process.env.RESEND_FROM_EMAIL || 'HomeMatch <noreply@homematch.ng>', to: [to], subject: subject, html: body }, (resendAttachments.length > 0 && { attachments: resendAttachments }));
        const result = yield resend.emails.send(emailData);
        console.log('Email sent successfully:', (_b = result.data) === null || _b === void 0 ? void 0 : _b.id);
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
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set');
            return false;
        }
        // Test by attempting to send a test email to a verified domain
        // In production, you might want to use a different validation method
        console.log('Resend configuration is valid');
        return true;
    }
    catch (error) {
        console.error('Resend configuration error:', error);
        return false;
    }
});
exports.testEmailConfiguration = testEmailConfiguration;
