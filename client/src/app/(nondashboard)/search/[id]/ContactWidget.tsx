"use client";

import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery, useGetPropertyQuery, useInitializePaymentMutation } from "@/state/api";
import { Phone, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import InspectionModal from "./InspectionModal";
import ApplicationModal from "./ApplicationModal";
import CheckoutSummary from "@/components/CheckoutSummary";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContactWidgetProps {
  onOpenModal: () => void;
  propertyId: number;
}

type ViewState = 'contact' | 'checkout' | 'application' | 'success';

const ContactWidget = ({ onOpenModal, propertyId }: ContactWidgetProps) => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: property } = useGetPropertyQuery(propertyId);
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('contact');
  const [initializePayment, { isLoading: isPaymentLoading }] = useInitializePaymentMutation();

  const handleButtonClick = () => {
    if (authUser) {
      setIsApplicationModalOpen(true);
    } else {
      router.push("/signin");
    }
  };

  const handleApplicationSubmitted = () => {
    setIsApplicationModalOpen(false);
    setCurrentView('success');
  };

  const handleProceedToPayment = async (totalAmount: number) => {
    if (!authUser?.userInfo?.email || !authUser?.cognitoInfo?.userId) return;

    try {
      const result = await initializePayment({
        amount: totalAmount,
        email: authUser.userInfo.email,
        paymentType: "initial_payment",
        propertyId: propertyId,
        tenantId: authUser.cognitoInfo.userId,
      }).unwrap();

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Payment initialization failed:", error);
    }
  };

  const handleBackToContact = () => {
    setCurrentView('contact');
  };

  if (currentView === 'success') {
    return (
      <div className={`bg-white border border-primary-200 rounded-2xl p-7 h-fit ${isMobile ? 'w-full' : 'min-w-[300px]'}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Application Submitted Successfully!
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Your application has been submitted and is now under review. You will be notified once the admin approves your application, and then you can proceed with the payment.
            </p>
          </div>
          <Button
            onClick={handleBackToContact}
            className="w-full bg-primary-700 text-white hover:bg-primary-600"
          >
            Back to Property
          </Button>
        </div>
      </div>
    );
  }

  if (currentView === 'checkout' && property) {
    return (
      <div className={`bg-white border border-primary-200 rounded-2xl p-7 h-fit ${isMobile ? 'w-full' : 'min-w-[300px]'}`}>
        <div className="mb-4">
          <Button
            onClick={handleBackToContact}
            variant="outline"
            size="sm"
            className="mb-4"
          >
            ← Back
          </Button>
        </div>
        <CheckoutSummary
          property={property}
          onProceedToPayment={handleProceedToPayment}
          isLoading={isPaymentLoading}
        />
      </div>
    );
  }

  return (
    <div className={`bg-white border border-primary-200 rounded-2xl p-7 h-fit ${isMobile ? 'w-full' : 'min-w-[300px]'}`}>
      {/* Contact Property */}
      <div className="flex items-center gap-5 mb-4 border border-primary-200 p-4 rounded-xl">
        <div className="flex items-center p-4 bg-primary-900 rounded-full">
          <Phone className="text-primary-50" size={15} />
        </div>
        <div>
          <p>Contact This Property</p>
          <div className="text-lg font-bold text-primary-800">
            {property?.landlord?.phoneNumber || "Contact via application"}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Button
          className="w-full bg-primary-700 text-white hover:bg-primary-600"
          onClick={handleButtonClick}
        >
          {authUser ? "Submit Application" : "Sign In to Apply"}
        </Button>
        
        {authUser && (
          <Button
            onClick={() => setIsInspectionModalOpen(true)}
            className="w-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center space-x-2"
          >
            <Eye className="h-5 w-5" />
            <span>Schedule Inspection</span>
          </Button>
        )}
      </div>

      <hr className="my-4" />
      <div className="text-sm">
        <div className="text-primary-600 mb-1">Language: English.</div>
        <div className="text-primary-600">
            Open by appointment on Monday - Saturday
          </div>
      </div>
      
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        propertyId={propertyId}
        propertyName={property?.name || "Property"}
      />
      
      <ApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        propertyId={propertyId}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </div>
  );
};

export default ContactWidget;
