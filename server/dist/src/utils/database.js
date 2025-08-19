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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Prisma Client configuration with connection pooling
const globalForPrisma = globalThis;
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
// Connection pool configuration
const DATABASE_CONNECTION_LIMIT = parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10');
const DATABASE_POOL_TIMEOUT = parseInt(process.env.DATABASE_POOL_TIMEOUT || '20000');
// Enhanced Prisma client with connection pooling
class DatabaseService {
    constructor() {
        this.connectionCount = 0;
        this.maxConnections = DATABASE_CONNECTION_LIMIT;
        this.client = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
        // Connection event handlers
        if (process.env.NODE_ENV === 'development') {
            // Query logging is handled by Prisma log configuration
            console.log('Database service initialized with query logging enabled');
        }
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    getClient() {
        return this.client;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.$connect();
                console.log('Database connected successfully');
            }
            catch (error) {
                console.error('Failed to connect to database:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.$disconnect();
                console.log('Database disconnected successfully');
            }
            catch (error) {
                console.error('Failed to disconnect from database:', error);
                throw error;
            }
        });
    }
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.$queryRaw `SELECT 1`;
                return true;
            }
            catch (error) {
                console.error('Database health check failed:', error);
                return false;
            }
        });
    }
    getConnectionInfo() {
        return {
            count: this.connectionCount,
            max: this.maxConnections,
        };
    }
    // Transaction wrapper with retry logic
    executeTransaction(fn_1) {
        return __awaiter(this, arguments, void 0, function* (fn, maxRetries = 3) {
            let lastError;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return yield this.client.$transaction(fn, {
                        timeout: DATABASE_POOL_TIMEOUT,
                        maxWait: 5000,
                    });
                }
                catch (error) {
                    lastError = error;
                    console.error(`Transaction attempt ${attempt} failed:`, error);
                    if (attempt < maxRetries) {
                        // Exponential backoff
                        const delay = Math.pow(2, attempt) * 1000;
                        yield new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            throw lastError;
        });
    }
}
exports.DatabaseService = DatabaseService;
// Export singleton instance
exports.databaseService = DatabaseService.getInstance();
// Export the client for backward compatibility
exports.default = exports.prisma;
