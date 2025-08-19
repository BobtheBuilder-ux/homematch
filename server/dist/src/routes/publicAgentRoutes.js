"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminControllers_1 = require("../controllers/adminControllers");
const router = express_1.default.Router();
// Public agent creation route (no authentication required)
router.post("/agents", adminControllers_1.createAgent);
exports.default = router;
