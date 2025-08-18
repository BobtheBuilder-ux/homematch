"use client";

import React, { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { signUp, resetPassword, type SignUpOutput } from "aws-amplify/auth";
import {
  Authenticator,
  Heading,
  Radio,
  RadioGroupField,
  TextField,
  useAuthenticator,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

// https://docs.amplify.aws/gen1/javascript/tools/libraries/configure-categories/
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId:
        process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
    },
  },
});

const components = {
  Header() {
    return (
      <View className="mt-4 mb-7">
        <Heading level={3} className="!text-2xl !font-bold">
          Home
          <span className="text-secondary-500 font-light hover:!text-primary-300">
            Match
          </span>
        </Heading>
        <p className="text-muted-foreground mt-2">
          <span className="font-bold">Welcome!</span> Please sign in to continue
        </p>
      </View>
    );
  },
  SignIn: {
    Footer() {
      const { toSignUp } = useAuthenticator();
      const [email, setEmail] = useState("");
      const [showResetForm, setShowResetForm] = useState(false);
      
      const handleResetPassword = async () => {
        if (!email) {
          toast.error("Please enter your email address first");
          return;
        }
        
        try {
          await resetPassword({ username: email });
          toast.success("Password reset instructions sent to your email");
          setShowResetForm(false);
        } catch (error: any) {
          toast.error(error.message || "Failed to send reset instructions");
        }
      };
      
      if (showResetForm) {
        return (
          <View className="text-center mt-4">
            <p className="text-muted-foreground mb-2">Enter your email to reset password:</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleResetPassword}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                Send Reset Link
              </button>
              <button
                onClick={() => setShowResetForm(false)}
                className="text-muted-foreground hover:underline bg-transparent border-none p-2"
              >
                Cancel
              </button>
            </div>
          </View>
        );
      }
      
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={toSignUp}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Sign up here
            </button>
          </p>
          <p className="text-muted-foreground mt-2">
            <button
              onClick={() => setShowResetForm(true)}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Forgot your password?
            </button>
          </p>
        </View>
      );
    },
  },
  SignUp: {
    FormFields() {
      const { validationErrors } = useAuthenticator();
      const [role, setRole] = useState("tenant");
      const [invitationCode, setInvitationCode] = useState("");


      return (
        <>
          <Authenticator.SignUp.FormFields />
          <RadioGroupField
            legend="Role"
            name="custom:role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            errorMessage={validationErrors?.["custom:role"]}
            hasError={!!validationErrors?.["custom:role"]}
            isRequired
          >
            <Radio value="tenant">Tenant</Radio>
            <Radio value="landlord">Landlord</Radio>
            <Radio value="agent">Agent</Radio>
            <Radio value="admin">Admin</Radio>
          </RadioGroupField>
          {role === "agent" && (
            <TextField
              placeholder="Enter your invitation code"
              label="Invitation Code"
              isRequired
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              errorMessage={validationErrors?.["custom:invitationCode"]}
              hasError={!!validationErrors?.["custom:invitationCode"]}
            />
          )}

        </>
      );
    },

    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={toSignIn}
              className="text-primary hover:underline bg-transparent border-none p-0"
            >
              Sign in
            </button>
          </p>
        </View>
      );
    },
  },
};

const formFields = {
  signIn: {
    username: {
      placeholder: "Enter your email",
      label: "Email",
      isRequired: true,
    },
    password: {
      placeholder: "Enter your password",
      label: "Password",
      isRequired: true,
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: "Choose a username",
      label: "Username",
      isRequired: true,
    },
    email: {
      order: 2,
      placeholder: "Enter your email address",
      label: "Email",
      isRequired: true,
    },
    password: {
      order: 3,
      placeholder: "Create a password",
      label: "Password",
      isRequired: true,
    },
    confirm_password: {
      order: 4,
      placeholder: "Confirm your password",
      label: "Confirm Password",
      isRequired: true,
    },
  },
};

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname.startsWith("/landlord") || pathname.startsWith("/tenants");

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (user && isAuthPage) {
      router.push("/");
    }
  }, [user, isAuthPage, router]);

  // Allow access to public pages without authentication
  if (!isAuthPage && !isDashboardPage) {
    return <>{children}</>;
  }

  const handleSignUp = async (formData: any) => {
    // For all roles (tenant, landlord, admin, agent), use the regular Cognito signUp flow
    // Profile creation will be handled after successful authentication
    return signUp(formData);
  };

  return (
    <div className="h-full">
      <Authenticator
        initialState={pathname.includes("signup") ? "signUp" : "signIn"}
        components={components}
        formFields={formFields}
        services={{
          handleSignUp,
        }}
      >
        {() => <>{children}</>}
      </Authenticator>
    </div>
  );
};

export default Auth;
