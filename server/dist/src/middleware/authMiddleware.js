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
exports.authMiddleware = void 0;
const auth_1 = require("../auth");
const authMiddleware = (allowedRoles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
            // Validate session using BetterAuth
            const headers = new Headers();
            Object.entries(req.headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    headers.set(key, value);
                }
                else if (Array.isArray(value)) {
                    headers.set(key, value.join(', '));
                }
            });
            const session = yield auth_1.auth.api.getSession({
                headers
            });
            if (!session || !session.user) {
                console.log('Invalid or expired session');
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            const userRole = session.user.role || "tenant";
            console.log('User role:', userRole);
            console.log('Allowed roles:', allowedRoles);
            req.user = {
                id: session.user.id,
                role: userRole,
            };
            const hasAccess = allowedRoles.includes(userRole.toLowerCase());
            console.log('Has access:', hasAccess);
            if (!hasAccess) {
                console.log('Access denied for role:', userRole);
                res.status(403).json({ message: "Access Denied" });
                return;
            }
            console.log('Auth middleware passed, calling next()');
            next();
        }
        catch (err) {
            console.error("Failed to validate session:", err);
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
    });
};
exports.authMiddleware = authMiddleware;
