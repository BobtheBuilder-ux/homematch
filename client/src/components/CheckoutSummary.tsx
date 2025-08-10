"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calculator } from "lucide-react";

interface CheckoutSummaryProps {
  property: {
    id: number;
    name: string;
    pricePerYear: number;
    location: {
      address: string;
    };
  };
  onProceedToPayment: (totalAmount: number) => void;
  isLoading?: boolean;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  property,
  onProceedToPayment,
  isLoading = false,
}) => {
  // Calculate individual fees
  const yearlyRent = property.pricePerYear;
  const applicationFee = yearlyRent * 0.1; // 10% of yearly rent
  const cautionFee = yearlyRent * 0.2; // 20% of yearly rent
  const totalAmount = yearlyRent + applicationFee + cautionFee;

  const handleProceedToPayment = () => {
    onProceedToPayment(totalAmount);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Payment Summary
        </CardTitle>
        <p className="text-sm text-gray-600">
          Complete payment for {property.name}
        </p>
        <p className="text-xs text-gray-500">
          {property.location.address}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Yearly Rent</span>
            <span className="text-sm font-semibold">
              ₦{yearlyRent.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-600">
              Application Fee (10%)
            </span>
            <span className="text-sm font-semibold text-blue-600">
              ₦{applicationFee.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-600">
              Caution Fee (20%)
            </span>
            <span className="text-sm font-semibold text-green-600">
              ₦{cautionFee.toLocaleString()}
            </span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total Amount</span>
            <span className="text-lg font-bold text-primary-700">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What&apos;s Included:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Full year rental payment</li>
            <li>• Application processing fee</li>
            <li>• Refundable security deposit</li>
            <li>• Lease agreement generation</li>
          </ul>
        </div>

        {/* Proceed to Payment Button */}
        <Button
          onClick={handleProceedToPayment}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment - ₦{totalAmount.toLocaleString()}
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>Secured by Paystack</p>
          <p>Your payment information is encrypted and secure</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutSummary;