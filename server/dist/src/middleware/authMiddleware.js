"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        var _a;
        console.log('Auth middleware called for:', req.method, req.path);
        console.log('Authorization header:', req.headers.authorization);
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            console.log('No token provided');
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            const userRole = decoded["custom:role"] || "";
            console.log('Decoded user role:', userRole);
            console.log('Allowed roles:', allowedRoles);
            req.user = {
                id: decoded.sub,
                role: userRole,
            };
            const hasAccess = allowedRoles.includes(userRole.toLowerCase());
            console.log('Has access:', hasAccess);
            if (!hasAccess) {
                console.log('Access denied for role:', userRole);
                res.status(403).json({ message: "Access Denied" });
                return;
            }
            // Special handling for admin and agent roles
            if (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "agent") {
                // Allow access for admin and agent roles without creating tenant records
                // Skip tenant record creation for these roles
                req.user.skipTenantCreation = true;
            }
        }
        catch (err) {
            console.error("Failed to decode token:", err);
            res.status(400).json({ message: "Invalid token" });
            return;
        }
        console.log('Auth middleware passed, calling next()');
        next();
    };
};
exports.authMiddleware = authMiddleware;
