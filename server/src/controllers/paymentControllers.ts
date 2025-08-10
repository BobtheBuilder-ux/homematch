import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import fs from "fs";
import path from "path";
import { sendEmail } from "../utils/emailService";

const prisma = new PrismaClient();

// Initialize Paystack payment
export const initializePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leaseId, propertyId, tenantId, amount, email, paymentType } = req.body;

    let lease = null;
    let property = null;

    if (paymentType === "initial_payment" || paymentType === "deposit") {
      // For initial payment and deposit, validate property exists
      property = await prisma.property.findUnique({
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
    } else {
      // For other payment types, validate lease exists
      lease = await prisma.lease.findUnique({
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
    const payment = await prisma.payment.create({
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
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: email,
        amount: amount * 100, // Paystack expects amount in kobo
        reference: `payment_${payment.id}_${Date.now()}`,
        callback_url: `${process.env.CLIENT_URL}/payment/callback`,
        metadata: {
          paymentId: payment.id,
          leaseId: (paymentType === "initial_payment" || paymentType === "deposit") ? null : leaseId,
          propertyId: (paymentType === "initial_payment" || paymentType === "deposit") ? propertyId : null,
          paymentType: paymentType,
          tenantId: (paymentType === "initial_payment" || paymentType === "deposit") ? tenantId : lease?.tenantCognitoId
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      paymentId: payment.id,
      url: paystackResponse.data.data.authorization_url,
      reference: paystackResponse.data.data.reference
    });
  } catch (error: any) {
    console.error("Payment initialization error:", error);
    res.status(500).json({ message: `Error initializing payment: ${error.message}` });
  }
};

// Verify Paystack payment
export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { reference } = req.params;

    // Verify payment with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { data } = paystackResponse.data;

    if (data.status === "success") {
      const paymentId = data.metadata.paymentId;
      const leaseId = data.metadata.leaseId;
      const propertyId = data.metadata.propertyId;
      const paymentType = data.metadata.paymentType;
      const tenantId = data.metadata.tenantId;

      let updatedPayment;

      if (paymentType === "initial_payment") {
        // For initial payment, we need to create a lease first
        const property = await prisma.property.findUnique({
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
         const tenant = await prisma.tenant.findUnique({
           where: { cognitoId: tenantId || data.customer.email } // Fallback to email if tenantId not available
         });

        if (!tenant) {
          res.status(404).json({ success: false, message: "Tenant not found" });
          return;
        }

        // Create lease
         const newLease = await prisma.lease.create({
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
        updatedPayment = await prisma.payment.update({
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
      } else if (paymentType === "deposit") {
        // For deposit payment, update tenant's inspection limit
        const property = await prisma.property.findUnique({
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

        const tenant = await prisma.tenant.findUnique({
          where: { cognitoId: tenantId }
        });

        if (!tenant) {
          res.status(404).json({ success: false, message: "Tenant not found" });
          return;
        }

        // Update tenant's inspection limit to unlimited for one year
        const InspectionLimit = (prisma as any).inspectionLimit;
        await InspectionLimit.upsert({
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
        updatedPayment = await prisma.payment.update({
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
      } else {
        // Update payment record for existing lease payments
        updatedPayment = await prisma.payment.update({
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

      // Generate lease agreement if this is the first payment (rent + deposit)
      if (paymentType === "initial_payment") {
        await generateLeaseAgreement(updatedPayment.lease);
      }

      // Send confirmation email
      if (paymentType === "deposit") {
        // Handle deposit payment email separately
        const tenant = await prisma.tenant.findUnique({
          where: { cognitoId: tenantId }
        });
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          include: { location: true }
        });
        
        if (tenant && property) {
          await sendEmail({
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
      } else if (updatedPayment.lease) {
        await sendEmail({
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
            ${paymentType === "initial_payment" ? "<p>Your lease agreement has been generated and will be sent to you shortly.</p>" : ""}
            <p>Thank you for choosing Homematch!</p>
          `
        });
      }

      res.json({ success: true, payment: updatedPayment });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error: any) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: `Error verifying payment: ${error.message}` });
  }
};

// Generate lease agreement
const generateLeaseAgreement = async (lease: any) => {
  try {
    // Read the lease agreement template
    const templatePath = path.join(__dirname, "../../../client/src/templates/lease-agreement-template.txt");
    let template = fs.readFileSync(templatePath, "utf8");

    // Get current date components
    const now = new Date();
    const endDate = new Date(lease.endDate);

    // Replace template variables
    const replacements = {
      "{{agreement_day}}": now.getDate().toString(),
      "{{agreement_month}}": now.toLocaleString('default', { month: 'long' }),
      "{{agreement_year}}": now.getFullYear().toString(),
      "{{rc_number}}": "RC123456", // Replace with actual RC number
      "{{homematch_address}}": "123 Homematch Street, Lagos, Nigeria",
      "{{homematch_phone}}": "+234-800-HOMEMATCH",
      "{{homematch_email}}": "info@homematch.com",
      "{{tenant_name}}": lease.tenant.name,
      "{{tenant_address}}": lease.tenant.address || "Address on file",
      "{{tenant_phone}}": lease.tenant.phoneNumber,
      "{{tenant_email}}": lease.tenant.email,
      "{{property_address}}": lease.property.location.address,
      "{{property_description}}": lease.property.description || "Residential Property",
      "{{start_day}}": new Date(lease.startDate).getDate().toString(),
      "{{start_month}}": new Date(lease.startDate).toLocaleString('default', { month: 'long' }),
      "{{start_year}}": new Date(lease.startDate).getFullYear().toString(),
      "{{end_day}}": endDate.getDate().toString(),
      "{{end_month}}": endDate.toLocaleString('default', { month: 'long' }),
      "{{end_year}}": endDate.getFullYear().toString(),
      "{{annual_rent}}": lease.rent.toLocaleString(),
      "{{late_fee}}": "5,000", // Default late fee
      "{{security_deposit}}": lease.deposit.toLocaleString(),
      "{{utilities_notes}}": "Tenant is responsible for all utilities unless otherwise specified.",
      "{{special_conditions}}": "No additional special conditions apply.",
      "{{homematch_representative_name}}": "John Doe",
      "{{homematch_representative_position}}": "Property Manager",
      "{{agreement_date}}": now.toLocaleDateString()
    };

    // Replace all template variables
    Object.entries(replacements).forEach(([key, value]) => {
      template = template.replace(new RegExp(key, 'g'), value);
    });

    // Send the lease agreement via email
    await sendEmail({
      to: lease.tenant.email,
      subject: "Your Lease Agreement - Homematch",
      body: `
        <h2>Your Lease Agreement</h2>
        <p>Dear ${lease.tenant.name},</p>
        <p>Please find your lease agreement below. Please review, print, sign, and return a copy to us.</p>
        <hr>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 12px;">${template}</pre>
        <hr>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Homematch Team</p>
      `
    });

    console.log(`Lease agreement generated and sent for lease ID: ${lease.id}`);
  } catch (error) {
    console.error("Error generating lease agreement:", error);
  }
};

// Get payment history
export const getPaymentHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leaseId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { leaseId: Number(leaseId) },
      orderBy: { paymentDate: 'desc' }
    });

    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching payment history: ${error.message}` });
  }
};

// Create payment for rent or deposit
export const createPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leaseId, amount, paymentType } = req.body;

    const lease = await prisma.lease.findUnique({
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

    const payment = await prisma.payment.create({
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
  } catch (error: any) {
    res.status(500).json({ message: `Error creating payment: ${error.message}` });
  }
};