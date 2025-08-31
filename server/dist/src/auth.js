"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const database_1 = require("./utils/database");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(database_1.prisma, {
        provider: "postgresql",
    }),
    secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-here",
    baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3001",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to true in production
    },
    socialProviders: {
    // Add social providers as needed
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "tenant",
            },
            invitationCode: {
                type: "string",
                required: false,
            },
        },
    },
});
