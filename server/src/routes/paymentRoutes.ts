import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  initializePayment,
  verifyPayment,
  getPaymentHistory,
  createPayment
} from "../controllers/paymentControllers";

const router = express.Router();

// Initialize payment with Paystack
router.post("/initialize", authMiddleware(["tenant"]), initializePayment);

// Verify payment callback from Paystack
router.get("/verify/:reference", verifyPayment);

// Get payment history for a lease
router.get("/history/:leaseId", authMiddleware(["tenant", "landlord", "admin"]), getPaymentHistory);

// Create a new payment record
router.post("/create", authMiddleware(["tenant", "admin"]), createPayment);

export default router;