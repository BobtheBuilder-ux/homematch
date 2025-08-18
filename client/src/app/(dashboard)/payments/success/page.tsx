"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useVerifyPaymentQuery } from "@/state/api";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams?.get("reference");
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "failed">("loading");

  const {
    data: verificationResult,
    error,
    isLoading,
  } = useVerifyPaymentQuery(reference || "", {
    skip: !reference,
  });

  useEffect(() => {
    if (!reference) {
      setVerificationStatus("failed");
      toast.error("No payment reference found");
      return;
    }

    if (verificationResult) {
      if (verificationResult.success) {
        setVerificationStatus("success");
        toast.success("Payment verified successfully!");
      } else {
        setVerificationStatus("failed");
        toast.error("Payment verification failed");
      }
    }

    if (error) {
      setVerificationStatus("failed");
      toast.error("Failed to verify payment");
    }
  }, [reference, verificationResult, error]);

  const handleGoToDashboard = () => {
    router.push("/tenants/residences");
  };

  const handleRetryPayment = () => {
    router.back();
  };

  if (isLoading || verificationStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle>Verifying Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 p-4 rounded-full w-16 h-16 flex items-center justify-center ${
            verificationStatus === "success" 
              ? "bg-green-100" 
              : "bg-red-100"
          }`}>
            {verificationStatus === "success" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <CardTitle>
            {verificationStatus === "success" 
              ? "Payment Successful!" 
              : "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {verificationStatus === "success"
              ? "Your payment has been processed successfully. You will receive a confirmation email shortly."
              : "We couldn't process your payment. Please try again or contact support if the issue persists."}
          </p>
          
          {reference && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Reference:</p>
              <p className="font-mono text-sm">{reference}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            {verificationStatus === "success" ? (
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button onClick={handleRetryPayment} className="w-full">
                  Try Again
                </Button>
                <Button 
                  onClick={handleGoToDashboard} 
                  variant="outline" 
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;