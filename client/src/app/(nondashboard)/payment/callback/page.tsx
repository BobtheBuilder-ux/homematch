"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useVerifyPaymentQuery } from "@/state/api";

type VerificationStatus = "loading" | "success" | "failed";

const PaymentCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("loading");
  
  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");
  
  // Use the reference from URL params
  const paymentReference = reference || trxref;
  
  const { data: verificationResult, isLoading, error } = useVerifyPaymentQuery(
    paymentReference!,
    { skip: !paymentReference }
  );

  useEffect(() => {
    if (!paymentReference) {
      setVerificationStatus("failed");
      return;
    }

    if (!isLoading) {
      if (verificationResult?.success) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("failed");
      }
    }
  }, [verificationResult, isLoading, paymentReference]);

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
              : "Payment Failed"
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {verificationStatus === "success" ? (
            <>
              <p className="text-gray-600">
                Your payment has been successfully processed. You will receive a confirmation email shortly with your tenancy agreement.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleGoToDashboard}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                There was an issue processing your payment. Please try again or contact support.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleRetryPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleGoToDashboard}
                  variant="outline"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;