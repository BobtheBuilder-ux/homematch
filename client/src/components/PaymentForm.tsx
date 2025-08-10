"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";
import { useInitializePaymentMutation } from "@/state/api";
import { toast } from "sonner";

interface PaymentFormProps {
  leaseId: number;
  amount: number;
  paymentType: "rent" | "security_deposit" | "application_fee";
  onSuccess?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  leaseId,
  amount,
  paymentType,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [initializePayment] = useInitializePaymentMutation();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await initializePayment({
        leaseId,
        amount,
        email,
        paymentType,
      }).unwrap();

      // Redirect to Paystack payment page
      if (response.url) {
        window.location.href = response.url;
      } else {
        toast.error("Failed to initialize payment");
      }
    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      toast.error(error?.data?.message || "Payment initialization failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentTitle = () => {
    switch (paymentType) {
      case "rent":
        return "Pay Monthly Rent";
      case "security_deposit":
        return "Pay Security Deposit";
      case "application_fee":
        return "Pay Application Fee";
      default:
        return "Make Payment";
    }
  };

  const getPaymentDescription = () => {
    switch (paymentType) {
      case "rent":
        return "Pay your monthly rent securely using Paystack";
      case "security_deposit":
        return "Pay your security deposit to complete your lease agreement";
      case "application_fee":
        return "Pay the application fee to process your rental application";
      default:
        return "Complete your payment securely";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {getPaymentTitle()}
        </CardTitle>
        <p className="text-sm text-gray-600">{getPaymentDescription()}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="text"
              value={`₦${amount.toLocaleString()}`}
              disabled
              className="font-semibold"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₦${amount.toLocaleString()}`
            )}
          </Button>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Secured by Paystack</p>
          <p>Your payment information is encrypted and secure</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;