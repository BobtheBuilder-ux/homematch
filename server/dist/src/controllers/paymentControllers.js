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
exports.createPayment = exports.getPaymentHistory = exports.verifyPayment = exports.initializePayment = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const emailService_1 = require("../utils/emailService");
const leaseAgreementGenerator_1 = require("../utils/leaseAgreementGenerator");
const emailTemplates_1 = require("../utils/emailTemplates");
const prisma = new client_1.PrismaClient();
// Initialize Paystack payment
const initializePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leaseId, propertyId, tenantId, amount, email, paymentType } = req.body;
        let lease = null;
        let property = null;
        if (paymentType === "initial_payment" || paymentType === "deposit") {
            // For initial payment and deposit, validate property exists
            property = yield prisma.property.findUnique({
                where: { id: propertyId },
                include: {
                    location: true,
                    landlord: true
                }
            });
            if (!property) {
                res.status(404).json({ message: "Property not found" });
                return;
            }
        }
        else {
            // For other payment types, validate lease exists
            lease = yield prisma.lease.findUnique({
                where: { id: leaseId },
                include: {
                    tenant: true,
                    property: {
                        include: {
                            location: true,
                            landlord: true
                        }
                    }
                }
            });
            if (!lease) {
                res.status(404).json({ message: "Lease not found" });
                return;
            }
        }
        // Create payment record
        const payment = yield prisma.payment.create({
            data: {
                amountDue: amount,
                amountPaid: 0,
                dueDate: new Date(),
                paymentDate: new Date(),
                paymentStatus: "Pending",
                leaseId: (paymentType === "initial_payment" || paymentType === "deposit") ? null : leaseId
            }
        });
        // Initialize Paystack payment
        const paystackResponse = yield axios_1.default.post("https://api.paystack.co/transaction/initialize", {
            email: email,
            amount: amount * 100, // Paystack expects amount in kobo
            reference: `payment_${payment.id}_${Date.now()}`,
            callback_url: `${process.env.CLIENT_URL}/payment/callback`,
            metadata: {
                paymentId: payment.id,
                leaseId: (paymentType === "initial_payment" || paymentType === "deposit") ? null : leaseId,
                propertyId: (paymentType === "initial_payment" || paymentType === "deposit") ? propertyId : null,
                paymentType: paymentType,
                tenantId: (paymentType === "initial_payment" || paymentType === "deposit") ? tenantId : lease === null || lease === void 0 ? void 0 : lease.tenantCognitoId
            }
        }, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });
        res.json({
            paymentId: payment.id,
            url: paystackResponse.data.data.authorization_url,
            reference: paystackResponse.data.data.reference
        });
    }
    catch (error) {
        console.error("Payment initialization error:", error);
        res.status(500).json({ message: `Error initializing payment: ${error.message}` });
    }
});
exports.initializePayment = initializePayment;
// Verify Paystack payment
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reference } = req.params;
        // Verify payment with Paystack
        const paystackResponse = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        const { data } = paystackResponse.data;
        if (data.status === "success") {
            const paymentId = parseInt(data.metadata.paymentId, 10);
            const leaseId = data.metadata.leaseId ? parseInt(data.metadata.leaseId, 10) : null;
            const propertyId = data.metadata.propertyId ? parseInt(data.metadata.propertyId, 10) : null;
            const paymentType = data.metadata.paymentType;
            const tenantId = data.metadata.tenantId;
            // Validate that paymentId is a valid number
            if (isNaN(paymentId)) {
                res.status(400).json({ success: false, message: "Invalid payment ID" });
                return;
            }
            // Validate propertyId if it exists and is required for the payment type
            if ((paymentType === "initial_payment" || paymentType === "deposit") && (!propertyId || isNaN(propertyId))) {
                res.status(400).json({ success: false, message: "Invalid or missing property ID for this payment type" });
                return;
            }
            // Validate leaseId if it exists
            if (data.metadata.leaseId && isNaN(leaseId)) {
                res.status(400).json({ success: false, message: "Invalid lease ID" });
                return;
            }
            let updatedPayment;
            if (paymentType === "initial_payment") {
                // For initial payment, we need to create a lease first
                const property = yield prisma.property.findUnique({
                    where: { id: propertyId },
                    include: {
                        location: true,
                        landlord: true
                    }
                });
                if (!property) {
                    res.status(404).json({ success: false, message: "Property not found" });
                    return;
                }
                // Get tenant information from the request or session
                // For now, we'll need to get tenant info from the payment metadata or request
                const tenant = yield prisma.tenant.findUnique({
                    where: { cognitoId: tenantId || data.customer.email } // Fallback to email if tenantId not available
                });
                if (!tenant) {
                    res.status(404).json({ success: false, message: "Tenant not found" });
                    return;
                }
                // Create lease
                const newLease = yield prisma.lease.create({
                    data: {
                        rent: property.pricePerYear,
                        deposit: property.securityDeposit,
                        startDate: new Date(),
                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        tenantCognitoId: tenant.cognitoId,
                        propertyId: property.id
                    },
                    include: {
                        tenant: true,
                        property: {
                            include: {
                                location: true,
                                landlord: true
                            }
                        }
                    }
                });
                // Update payment record with the new lease
                updatedPayment = yield prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        amountPaid: data.amount / 100,
                        paymentStatus: "Paid",
                        paymentDate: new Date(),
                        leaseId: newLease.id
                    },
                    include: {
                        lease: {
                            include: {
                                tenant: true,
                                property: {
                                    include: {
                                        location: true,
                                        landlord: true
                                    }
                                }
                            }
                        }
                    }
                });
                // Connect tenant to property and mark property as closed
                yield prisma.property.update({
                    where: { id: propertyId },
                    data: {
                        status: "Closed",
                        tenants: {
                            connect: { cognitoId: tenant.cognitoId }
                        }
                    }
                });
                // Update the approved application with the lease ID
                yield prisma.application.updateMany({
                    where: {
                        propertyId: propertyId,
                        tenantCognitoId: tenant.cognitoId,
                        status: "Approved"
                    },
                    data: {
                        leaseId: newLease.id
                    }
                });
                // Send notification email to landlord
                if ((_a = newLease.property.landlord) === null || _a === void 0 ? void 0 : _a.email) {
                    yield (0, emailService_1.sendEmail)({
                        to: newLease.property.landlord.email,
                        subject: emailTemplates_1.propertyRentedNotificationTemplate.subject,
                        body: emailTemplates_1.propertyRentedNotificationTemplate.body(newLease.property.landlord.name, newLease.property.location.address, newLease.tenant.name, newLease.tenant.phoneNumber, newLease.property.pricePerYear)
                    });
                }
            }
            else if (paymentType === "deposit") {
                // For deposit payment, update tenant's inspection limit
                const property = yield prisma.property.findUnique({
                    where: { id: propertyId },
                    include: {
                        location: true,
                        landlord: true
                    }
                });
                if (!property) {
                    res.status(404).json({ success: false, message: "Property not found" });
                    return;
                }
                const tenant = yield prisma.tenant.findUnique({
                    where: { cognitoId: tenantId }
                });
                if (!tenant) {
                    res.status(404).json({ success: false, message: "Tenant not found" });
                    return;
                }
                // Update tenant's inspection limit to unlimited for one year
                const InspectionLimit = prisma.inspectionLimit;
                yield InspectionLimit.upsert({
                    where: { tenantCognitoId: tenantId },
                    update: {
                        hasUnlimited: true,
                        unlimitedUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                    },
                    create: {
                        tenantCognitoId: tenantId,
                        freeInspections: 2,
                        usedInspections: 0,
                        hasUnlimited: true,
                        unlimitedUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                    }
                });
                // Update payment record for initial payment
                updatedPayment = yield prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        amountPaid: data.amount / 100,
                        paymentStatus: "Paid",
                        paymentDate: new Date()
                    },
                    include: {
                        lease: {
                            include: {
                                tenant: true,
                                property: {
                                    include: {
                                        location: true,
                                        landlord: true
                                    }
                                }
                            }
                        }
                    }
                });
            }
            else {
                // Update payment record for existing lease payments
                updatedPayment = yield prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        amountPaid: data.amount / 100,
                        paymentStatus: "Paid",
                        paymentDate: new Date()
                    },
                    include: {
                        lease: {
                            include: {
                                tenant: true,
                                property: {
                                    include: {
                                        location: true,
                                        landlord: true
                                    }
                                }
                            }
                        }
                    }
                });
            }
            // Send confirmation email
            if (paymentType === "deposit") {
                // Handle deposit payment email separately
                const tenant = yield prisma.tenant.findUnique({
                    where: { cognitoId: tenantId }
                });
                const property = yield prisma.property.findUnique({
                    where: { id: propertyId },
                    include: { location: true }
                });
                if (tenant && property) {
                    yield (0, emailService_1.sendEmail)({
                        to: tenant.email,
                        subject: "Deposit Payment Confirmation - Homematch",
                        body: `
              <h2>Deposit Payment Successful!</h2>
              <p>Dear ${tenant.name},</p>
              <p>Your deposit payment of ₦${updatedPayment.amountPaid} has been successfully processed.</p>
              <p>Payment Details:</p>
              <ul>
                <li>Amount: ₦${updatedPayment.amountPaid}</li>
                <li>Property: ${property.location.address}</li>
                <li>Payment Date: ${new Date().toLocaleDateString()}</li>
                <li>Reference: ${reference}</li>
              </ul>
              <p>Your inspection limit has been upgraded to unlimited for one year!</p>
              <p>Thank you for choosing Homematch!</p>
            `
                    });
                }
            }
            else if (updatedPayment.lease) {
                if (paymentType === "initial_payment") {
                    // Ensure lease data is available
                    if (!updatedPayment.lease.tenant || !updatedPayment.lease.property) {
                        throw new Error("Incomplete lease data for PDF generation");
                    }
                    // Generate lease agreement PDF
                    const leaseAgreementPDF = yield (0, leaseAgreementGenerator_1.generateLeaseAgreement)({
                        tenantName: updatedPayment.lease.tenant.name,
                        tenantEmail: updatedPayment.lease.tenant.email,
                        tenantPhone: updatedPayment.lease.tenant.phoneNumber,
                        propertyAddress: updatedPayment.lease.property.location.address,
                        propertyName: updatedPayment.lease.property.name,
                        landlordName: updatedPayment.lease.property.landlord.name,
                        landlordEmail: updatedPayment.lease.property.landlord.email,
                        landlordPhone: updatedPayment.lease.property.landlord.phoneNumber,
                        rentAmount: updatedPayment.lease.rent,
                        securityDeposit: updatedPayment.lease.deposit,
                        leaseStartDate: updatedPayment.lease.startDate,
                        leaseEndDate: updatedPayment.lease.endDate,
                        paymentDate: new Date(),
                        paymentReference: reference
                    });
                    // Send congratulatory email with lease agreement
                    yield (0, emailService_1.sendEmail)({
                        to: updatedPayment.lease.tenant.email,
                        subject: "🎉 Congratulations! Your Property Payment is Complete - Homematch",
                        body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">Your property payment has been successfully completed!</p>
                </div>
                
                <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #1f2937; margin-top: 0;">Dear ${updatedPayment.lease.tenant.name},</h2>
                  
                  <p style="color: #4b5563; line-height: 1.6;">We're thrilled to confirm that your payment has been successfully processed! The property is now officially yours, and it has been removed from our search listings.</p>
                  
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin-top: 0;">📋 Payment Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 0; color: #6b7280;">Property:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${updatedPayment.lease.property.name}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 0; color: #6b7280;">Address:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${updatedPayment.lease.property.location.address}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
                        <td style="padding: 8px 0; color: #10b981; font-weight: bold; font-size: 18px;">₦${updatedPayment.amountPaid.toLocaleString()}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 0; color: #6b7280;">Payment Date:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 8px 0; color: #6b7280;">Lease Period:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${updatedPayment.lease.startDate.toLocaleDateString()} - ${updatedPayment.lease.endDate.toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Reference:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${reference}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <h4 style="color: #92400e; margin: 0 0 10px 0;">📄 Tenancy Agreement Attached</h4>
                    <p style="color: #92400e; margin: 0; font-size: 14px;">Your personalized tenancy agreement is attached to this email. Please review, sign, and keep it for your records.</p>
                  </div>
                  
                  <h3 style="color: #1f2937;">🏠 What's Next?</h3>
                  <ul style="color: #4b5563; line-height: 1.6;">
                    <li>Review and sign your tenancy agreement</li>
                    <li>The property has been removed from search listings</li>
                    <li>You can now access your property details in your dashboard</li>
                    <li>Contact your landlord for move-in arrangements</li>
                  </ul>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.CLIENT_URL}/tenants/residences" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Dashboard</a>
                  </div>
                  
                  <p style="color: #4b5563; line-height: 1.6;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                  
                  <p style="color: #4b5563; margin-bottom: 0;">Welcome to your new home!</p>
                  <p style="color: #10b981; font-weight: bold;">The Homematch Team</p>
                </div>
              </div>
            `,
                        attachments: [{
                                filename: `Lease_Agreement_${updatedPayment.lease.property.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                                content: leaseAgreementPDF,
                                contentType: 'application/pdf'
                            }]
                    });
                }
                else {
                    // Regular payment confirmation
                    yield (0, emailService_1.sendEmail)({
                        to: updatedPayment.lease.tenant.email,
                        subject: "Payment Confirmation - Homematch",
                        body: `
              <h2>Payment Successful!</h2>
              <p>Dear ${updatedPayment.lease.tenant.name},</p>
              <p>Your payment of ₦${updatedPayment.amountPaid} has been successfully processed.</p>
              <p>Payment Details:</p>
              <ul>
                <li>Amount: ₦${updatedPayment.amountPaid}</li>
                <li>Property: ${updatedPayment.lease.property.location.address}</li>
                <li>Payment Date: ${new Date().toLocaleDateString()}</li>
                <li>Reference: ${reference}</li>
              </ul>
              <p>Thank you for choosing Homematch!</p>
            `
                    });
                }
            }
            res.json({ success: true, payment: updatedPayment });
        }
        else {
            res.status(400).json({ success: false, message: "Payment verification failed" });
        }
    }
    catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ message: `Error verifying payment: ${error.message}` });
    }
});
exports.verifyPayment = verifyPayment;
// Generate lease agreement
// Get payment history
const getPaymentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leaseId } = req.params;
        const payments = yield prisma.payment.findMany({
            where: { leaseId: Number(leaseId) },
            orderBy: { paymentDate: 'desc' }
        });
        res.json(payments);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching payment history: ${error.message}` });
    }
});
exports.getPaymentHistory = getPaymentHistory;
// Create payment for rent or deposit
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leaseId, amount, paymentType } = req.body;
        const lease = yield prisma.lease.findUnique({
            where: { id: leaseId },
            include: {
                tenant: true,
                property: true
            }
        });
        if (!lease) {
            res.status(404).json({ message: "Lease not found" });
            return;
        }
        const payment = yield prisma.payment.create({
            data: {
                amountDue: amount,
                amountPaid: 0,
                dueDate: new Date(),
                paymentDate: new Date(),
                paymentStatus: "Pending",
                leaseId: leaseId
            }
        });
        res.json(payment);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating payment: ${error.message}` });
    }
});
exports.createPayment = createPayment;
