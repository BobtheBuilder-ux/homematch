import { Router } from "express";
import {
  getLandlordEarnings,
  createWithdrawalRequest,
  getLandlordWithdrawals
} from "../controllers/earningsControllers";

const router = Router();

// GET /api/earnings/landlord/:cognitoId - Get landlord earnings statistics
router.get("/landlord/:cognitoId", getLandlordEarnings);

// POST /api/earnings/landlord/:cognitoId/withdraw - Create withdrawal request
router.post("/landlord/:cognitoId/withdraw", createWithdrawalRequest);

// GET /api/earnings/landlord/:cognitoId/withdrawals - Get withdrawal history
router.get("/landlord/:cognitoId/withdrawals", getLandlordWithdrawals);

export default router;