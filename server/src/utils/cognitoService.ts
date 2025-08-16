import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const createUserInCognito = async (email: string, temporaryPassword: string, role: string = 'tenant') => {
  const createUserCommand = new AdminCreateUserCommand({
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
    const response = await cognitoClient.send(createUserCommand);
    return response.User;
  } catch (error) {
    console.error("Error creating user in Cognito:", error);
    throw error;
  }
};
