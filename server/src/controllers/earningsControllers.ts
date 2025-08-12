import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get landlord earnings statistics
export const getLandlordEarnings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;

    // Get all properties managed by the landlord
    const properties = await prisma.property.findMany({
      where: { landlordCognitoId: cognitoId },
      include: {
        leases: {
          include: {
            payments: {
              where: { paymentStatus: "Paid" }
            }
          }
        }
      }
    });

    // Calculate statistics
    let totalEarnings = 0;
    let totalPropertiesRented = 0;
    let activeLeases = 0;
    const monthlyEarnings: { [key: string]: number } = {};

    properties.forEach(property => {
      if (property.leases.length > 0) {
        totalPropertiesRented++;
        
        property.leases.forEach(lease => {
          const currentDate = new Date();
          if (lease.endDate > currentDate) {
            activeLeases++;
          }

          lease.payments.forEach(payment => {
            totalEarnings += payment.amountPaid;
            
            // Group by month for monthly earnings
            const monthKey = payment.paymentDate.toISOString().substring(0, 7); // YYYY-MM
            monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + payment.amountPaid;
          });
        });
      }
    });

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        landlordCognitoId: cognitoId,
        status: { in: ["Pending", "Processing"] }
      }
    });

    const totalPendingWithdrawals = pendingWithdrawals.reduce(
      (sum: number, withdrawal: any) => sum + withdrawal.amount, 0
    );

    // Calculate available balance (total earnings minus pending withdrawals)
    const availableBalance = totalEarnings - totalPendingWithdrawals;

    res.json({
      totalEarnings,
      availableBalance,
      totalPropertiesRented,
      activeLeases,
      totalProperties: properties.length,
      monthlyEarnings,
      pendingWithdrawals: totalPendingWithdrawals
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: `Error retrieving landlord earnings: ${error.message}` 
    });
  }
};

// Create withdrawal request
export const createWithdrawalRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { amount, bankName, accountNumber, accountName } = req.body;

    // Validate required fields
    if (!amount || !bankName || !accountNumber || !accountName) {
      res.status(400).json({ 
        message: "Amount, bank name, account number, and account name are required" 
      });
      return;
    }

    // Check if landlord exists
    const landlord = await prisma.landlord.findUnique({
      where: { cognitoId }
    });

    if (!landlord) {
      res.status(404).json({ message: "Landlord not found" });
      return;
    }

    // Get current earnings and pending withdrawals
    const earnings = await getLandlordEarningsData(cognitoId);
    
    if (amount > earnings.availableBalance) {
      res.status(400).json({ 
        message: "Insufficient balance for withdrawal" 
      });
      return;
    }

    // Generate unique reference
    const reference = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        amount,
        landlordCognitoId: cognitoId,
        bankName,
        accountNumber,
        accountName,
        reference,
        status: "Pending"
      }
    });

    res.status(201).json({
      message: "Withdrawal request created successfully",
      withdrawal
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: `Error creating withdrawal request: ${error.message}` 
    });
  }
};

// Get landlord withdrawal history
export const getLandlordWithdrawals = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const withdrawals = await prisma.withdrawal.findMany({
      where: { landlordCognitoId: cognitoId },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit)
    });

    const totalWithdrawals = await prisma.withdrawal.count({
      where: { landlordCognitoId: cognitoId }
    });

    res.json({
      withdrawals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalWithdrawals,
        pages: Math.ceil(totalWithdrawals / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: `Error retrieving withdrawal history: ${error.message}` 
    });
  }
};

// Helper function to get earnings data
const getLandlordEarningsData = async (cognitoId: string) => {
  const properties = await prisma.property.findMany({
    where: { landlordCognitoId: cognitoId },
    include: {
      leases: {
        include: {
          payments: {
            where: { paymentStatus: "Paid" }
          }
        }
      }
    }
  });

  let totalEarnings = 0;
  properties.forEach(property => {
    property.leases.forEach(lease => {
      lease.payments.forEach(payment => {
        totalEarnings += payment.amountPaid;
      });
    });
  });

  const pendingWithdrawals = await prisma.withdrawal.findMany({
    where: {
      landlordCognitoId: cognitoId,
      status: { in: ["Pending", "Processing"] }
    }
  });

  const totalPendingWithdrawals = pendingWithdrawals.reduce(
    (sum: number, withdrawal: any) => sum + withdrawal.amount, 0
  );

  return {
    totalEarnings,
    availableBalance: totalEarnings - totalPendingWithdrawals
  };
};