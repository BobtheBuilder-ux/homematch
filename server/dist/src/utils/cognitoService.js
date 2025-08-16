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
exports.createUserInCognito = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
});
const createUserInCognito = (email_1, temporaryPassword_1, ...args_1) => __awaiter(void 0, [email_1, temporaryPassword_1, ...args_1], void 0, function* (email, temporaryPassword, role = 'tenant') {
    const createUserCommand = new client_cognito_identity_provider_1.AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID || '',
        Username: email,
        TemporaryPassword: temporaryPassword,
        UserAttributes: [
            {
                Name: "email",
                Value: email,
            },
            {
                Name: "email_verified",
                Value: "true",
            },
            {
                Name: "custom:role",
                Value: role,
            },
        ],
    });
    try {
        const response = yield cognitoClient.send(createUserCommand);
        return response.User;
    }
    catch (error) {
        console.error("Error creating user in Cognito:", error);
        throw error;
    }
});
exports.createUserInCognito = createUserInCognito;
