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
exports.RedisService = void 0;
const redis_1 = require("redis");
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                connectTimeout: 60000,
            },
        });
        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
            this.isConnected = false;
        });
        this.client.on('connect', () => {
            console.log('Redis Client Connected');
            this.isConnected = true;
        });
        this.client.on('disconnect', () => {
            console.log('Redis Client Disconnected');
            this.isConnected = false;
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    yield this.client.connect();
                }
            }
            catch (error) {
                console.error('Failed to connect to Redis:', error);
                // Don't throw error - allow app to continue without Redis
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isConnected) {
                    yield this.client.disconnect();
                }
            }
            catch (error) {
                console.error('Failed to disconnect from Redis:', error);
            }
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    return null;
                }
                return yield this.client.get(key);
            }
            catch (error) {
                console.error('Redis GET error:', error);
                return null;
            }
        });
    }
    set(key, value, ttlSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    return false;
                }
                if (ttlSeconds) {
                    yield this.client.setEx(key, ttlSeconds, value);
                }
                else {
                    yield this.client.set(key, value);
                }
                return true;
            }
            catch (error) {
                console.error('Redis SET error:', error);
                return false;
            }
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    return false;
                }
                yield this.client.del(key);
                return true;
            }
            catch (error) {
                console.error('Redis DEL error:', error);
                return false;
            }
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    return false;
                }
                const result = yield this.client.exists(key);
                return result === 1;
            }
            catch (error) {
                console.error('Redis EXISTS error:', error);
                return false;
            }
        });
    }
    setJSON(key, value, ttlSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jsonString = JSON.stringify(value);
                return yield this.set(key, jsonString, ttlSeconds);
            }
            catch (error) {
                console.error('Redis setJSON error:', error);
                return false;
            }
        });
    }
    getJSON(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jsonString = yield this.get(key);
                if (!jsonString) {
                    return null;
                }
                return JSON.parse(jsonString);
            }
            catch (error) {
                console.error('Redis getJSON error:', error);
                return null;
            }
        });
    }
    invalidatePattern(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    return;
                }
                const keys = yield this.client.keys(pattern);
                if (keys.length > 0) {
                    yield this.client.del(keys);
                }
            }
            catch (error) {
                console.error('Redis invalidatePattern error:', error);
            }
        });
    }
}
exports.RedisService = RedisService;
// Cache keys for different data types
RedisService.keys = {
    properties: (filters) => `properties:${filters || 'all'}`,
    property: (id) => `property:${id}`,
    userSession: (userId) => `session:${userId}`,
    applications: (userId) => `applications:${userId}`,
    landlordProperties: (landlordId) => `landlord:${landlordId}:properties`,
    analytics: (type) => `analytics:${type}`,
};
// Create singleton instance
const redisService = new RedisService();
exports.default = redisService;
