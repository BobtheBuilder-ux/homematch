"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const paymentControllers_1 = require("../controllers/paymentControllers");
const router = express_1.default.Router();
// Initialize payment with Paystack
router.post("/initialize", (0, authMiddleware_1.authMiddleware)(["tenant"]), paymentControllers_1.initializePayment);
// Verify payment callback from Paystack
router.get("/verify/:reference", paymentControllers_1.verifyPayment);
// Get payment history for a lease
router.get("/history/:leaseId", (0, authMiddleware_1.authMiddleware)(["tenant", "landlord", "admin"]), paymentControllers_1.getPaymentHistory);
// Create a new payment record
router.post("/create", (0, authMiddleware_1.authMiddleware)(["tenant", "admin"]), paymentControllers_1.createPayment);
exports.default = router;
