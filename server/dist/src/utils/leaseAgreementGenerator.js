"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.generateLeaseAgreement = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PDFDocument = require("pdfkit");
const generateLeaseAgreement = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        try {
            // Read the lease agreement template
            const templatePath = path.join(__dirname, '../../../client/src/templates/lease-agreement-template.txt');
            let template = fs.readFileSync(templatePath, 'utf8');
            // Get current date components
            const now = new Date();
            const startDate = new Date(data.leaseStartDate);
            const endDate = new Date(data.leaseEndDate);
            // Replace template variables with actual data
            const replacements = {
                "{{agreement_day}}": now.getDate().toString(),
                "{{agreement_month}}": now.toLocaleString('default', { month: 'long' }),
                "{{agreement_year}}": now.getFullYear().toString(),
                "{{rc_number}}": "RC123456", // Replace with actual RC number
                "{{homematch_address}}": "123 Homematch Street, Lagos, Nigeria",
                "{{homematch_phone}}": "+234-800-HOMEMATCH",
                "{{homematch_email}}": "info@homematch.com",
                "{{tenant_name}}": data.tenantName,
                "{{tenant_address}}": data.propertyAddress, // Using property address as tenant address
                "{{tenant_phone}}": data.tenantPhone,
                "{{tenant_email}}": data.tenantEmail,
                "{{property_address}}": data.propertyAddress,
                "{{property_description}}": data.propertyName,
                "{{start_day}}": startDate.getDate().toString(),
                "{{start_month}}": startDate.toLocaleString('default', { month: 'long' }),
                "{{start_year}}": startDate.getFullYear().toString(),
                "{{end_day}}": endDate.getDate().toString(),
                "{{end_month}}": endDate.toLocaleString('default', { month: 'long' }),
                "{{end_year}}": endDate.getFullYear().toString(),
                "{{annual_rent}}": data.rentAmount.toLocaleString(),
                "{{caution_fee}}": data.securityDeposit.toLocaleString(),
                "{{late_fee}}": "5,000", // Default late fee amount
                "{{utilities_notes}}": "All utilities are tenant's responsibility unless otherwise specified.",
                "{{special_conditions}}": "Standard terms and conditions apply.",
                "{{homematch_representative_name}}": "HomeMatch Representative",
                "{{homematch_representative_position}}": "Property Manager",
                "{{agreement_date}}": now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            };
            // Replace all template variables
            Object.entries(replacements).forEach(([key, value]) => {
                template = template.replace(new RegExp(key, 'g'), value);
            });
            // Create PDF document
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });
            const chunks = [];
            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });
            // Add content to PDF
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('RESIDENTIAL LEASE AGREEMENT', { align: 'center' })
                .moveDown(2);
            // Split template into paragraphs and add to PDF
            const paragraphs = template.split('\n\n');
            paragraphs.forEach((paragraph) => {
                if (paragraph.trim()) {
                    // Check if it's a heading (starts with numbers or contains "ARTICLE")
                    if (paragraph.match(/^\d+\.|ARTICLE|LANDLORD|TENANT|PROPERTY|RENT|SECURITY DEPOSIT/)) {
                        doc.fontSize(12)
                            .font('Helvetica-Bold')
                            .text(paragraph.trim(), { align: 'left' })
                            .moveDown(0.5);
                    }
                    else {
                        doc.fontSize(10)
                            .font('Helvetica')
                            .text(paragraph.trim(), { align: 'justify' })
                            .moveDown(0.5);
                    }
                }
            });
            // Add signature section
            doc.moveDown(2)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('SIGNATURES:', { align: 'left' })
                .moveDown(1);
            doc.fontSize(10)
                .font('Helvetica')
                .text('LANDLORD:', { continued: false })
                .moveDown(0.5)
                .text(`Name: ${data.landlordName}`)
                .text(`Email: ${data.landlordEmail}`)
                .text(`Phone: ${data.landlordPhone}`)
                .text('Signature: _________________________    Date: _____________')
                .moveDown(1);
            doc.text('TENANT:', { continued: false })
                .moveDown(0.5)
                .text(`Name: ${data.tenantName}`)
                .text(`Email: ${data.tenantEmail}`)
                .text(`Phone: ${data.tenantPhone}`)
                .text('Signature: _________________________    Date: _____________')
                .moveDown(1);
            // Add footer
            doc.fontSize(8)
                .font('Helvetica')
                .text(`Generated on ${new Date().toLocaleDateString()} via Homematch Platform`, {
                align: 'center'
            });
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
});
exports.generateLeaseAgreement = generateLeaseAgreement;
