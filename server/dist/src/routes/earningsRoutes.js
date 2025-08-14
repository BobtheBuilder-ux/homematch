"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const earningsControllers_1 = require("../controllers/earningsControllers");
const router = (0, express_1.Router)();
// GET /api/earnings/landlord/:cognitoId - Get landlord earnings statistics
router.get("/landlord/:cognitoId", earningsControllers_1.getLandlordEarnings);
// POST /api/earnings/landlord/:cognitoId/withdraw - Create withdrawal request
router.post("/landlord/:cognitoId/withdraw", earningsControllers_1.createWithdrawalRequest);
// GET /api/earnings/landlord/:cognitoId/withdrawals - Get withdrawal history
router.get("/landlord/:cognitoId/withdrawals", earningsControllers_1.getLandlordWithdrawals);
exports.default = router;
