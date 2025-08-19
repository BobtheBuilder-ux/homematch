"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminControllers_1 = require("../controllers/adminControllers");
const router = express_1.default.Router();
// Public admin routes that don't require authentication
router.post("/admins", adminControllers_1.createAdmin);
exports.default = router;
