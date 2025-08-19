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
const express_1 = require("express");
const emailSubscriptionService_1 = require("../utils/emailSubscriptionService");
const router = (0, express_1.Router)();
// Get all email subscriptions (admin only)
router.get('/subscriptions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriptions = yield (0, emailSubscriptionService_1.getEmailSubscriptions)(req.query.type);
        res.json({
            success: true,
            count: subscriptions.length,
            data: subscriptions
        });
    }
    catch (error) {
        console.error('Error fetching email subscriptions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' });
    }
}));
// Unsubscribe from email list
router.post('/unsubscribe', (req, res) => {
    const handleUnsubscribe = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, error: 'Email is required' });
            }
            yield (0, emailSubscriptionService_1.unsubscribeFromEmailList)(email);
            res.json({
                success: true,
                message: 'Successfully unsubscribed from email list'
            });
        }
        catch (error) {
            console.error('Error unsubscribing:', error);
            res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
        }
    });
    handleUnsubscribe();
});
exports.default = router;
