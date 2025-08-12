"use client";

import { useState } from "react";
import { X, Calendar, FileText, Banknote } from "lucide-react";
import { useCreateInspectionRequestMutation, useGetTenantInspectionLimitQuery, useProcessInspectionDepositMutation, useGetAuthUserQuery, useInitializePaymentMutation } from "@/state/api";

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyName: string;
}

const InspectionModal = ({ isOpen, onClose, propertyId, propertyName }: InspectionModalProps) => {
  const { data: authUser } = useGetAuthUserQuery();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    requestedDate: "",
    notes: "",
    priceRange: ""
  });
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);

  const { data: inspectionLimit, refetch: refetchLimit } = useGetTenantInspectionLimitQuery(
    authUser?.cognitoInfo?.userId || "",
    { skip: !authUser?.cognitoInfo?.userId }
  );
  
  const [createInspectionRequest, { isLoading: isCreating }] = useCreateInspectionRequestMutation();
  const [processDeposit, { isLoading: isProcessingDeposit }] = useProcessInspectionDepositMutation();
  const [initializePayment] = useInitializePaymentMutation();

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    return minDate.toISOString().split('T')[0];
  };

  const handleSubmitInspection = async () => {
    if (!authUser?.cognitoInfo?.userId) return;

    try {
      await createInspectionRequest({
        propertyId,
        tenantCognitoId: authUser.cognitoInfo.userId,
        tenantName: authUser.userInfo?.name || "",
        tenantEmail: authUser.userInfo?.email || "",
        tenantPhone: authUser.userInfo?.phoneNumber || "",
        preferredTime: formData.requestedDate,
        message: formData.notes,
        priceRange: formData.priceRange
      }).unwrap();
      
      refetchLimit();
      onClose();
      setStep(1);
      setFormData({ requestedDate: "", notes: "", priceRange: "" });
    } catch (error) {
      console.error("Failed to create inspection request:", error);
    }
  };

  const handleDepositPayment = async () => {
    if (!authUser?.cognitoInfo?.userId || !authUser?.userInfo?.email) {
      alert("Please log in to make a deposit payment.");
      return;
    }

    try {
      const paymentData = {
        leaseId: undefined, // No lease for deposit payments
        propertyId: propertyId,
        tenantId: authUser.cognitoInfo.userId,
        amount: depositAmount,
        email: authUser.userInfo.email,
        paymentType: "deposit"
      };
      
      const response = await initializePayment(paymentData).unwrap();
      
      if (response.url) {
        // Redirect to payment gateway
        window.location.href = response.url;
      } else {
        alert("Failed to initialize payment. Please try again.");
      }
    } catch (error) {
      console.error("Error initializing deposit payment:", error);
      alert("Failed to initialize deposit payment. Please try again.");
    }
  };

  const canRequestFreeInspection = inspectionLimit && inspectionLimit.freeInspections > inspectionLimit.usedInspections;
  const hasUnlimitedInspections = inspectionLimit?.hasUnlimited;
  const needsDeposit = !canRequestFreeInspection && !hasUnlimitedInspections;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Schedule Inspection for {propertyName}
        </h3>
        <p className="text-gray-600">
          Fill out the form below to request an inspection
        </p>
      </div>

      {/* Inspection Limit Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">Inspection Status</span>
        </div>
        <div className="mt-2 text-sm text-blue-800">
          {hasUnlimitedInspections ? (
            <span className="text-green-600 font-medium">✓ Unlimited inspections available</span>
          ) : (
            <span>
              Free inspections: {inspectionLimit?.freeInspections - inspectionLimit?.usedInspections || 0} remaining
            </span>
          )}
        </div>
      </div>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Preferred Date (minimum 3 days from today)
          </label>
          <input
            type="date"
            name="requestedDate"
            value={formData.requestedDate}
            onChange={handleInputChange}
            min={getMinDate()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline h-4 w-4 mr-1" />
            Additional Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any specific requirements or questions..."
          />
        </div>

        {needsDeposit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Banknote className="inline h-4 w-4 mr-1" />
              Price Range (Required for deposit)
            </label>
            <select
              name="priceRange"
              value={formData.priceRange}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select price range</option>
              <option value="0-500000">₦0 - ₦500,000</option>
              <option value="500000-1000000">₦500,000 - ₦1,000,000</option>
              <option value="1000000-2000000">₦1,000,000 - ₦2,000,000</option>
              <option value="2000000-5000000">₦2,000,000 - ₦5,000,000</option>
              <option value="5000000+">₦5,000,000+</option>
            </select>
          </div>
        )}
      </form>

      {needsDeposit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Banknote className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">Deposit Required</span>
          </div>
          <p className="mt-2 text-sm text-yellow-800">
            You have used all free inspections. A 40% deposit is required for additional inspections.
            After payment, you&apos;ll have unlimited inspections.
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            if (needsDeposit) {
              if (!formData.priceRange) {
                alert("Please select a price range first");
                return;
              }
              const ranges = {
                "0-500000": 200000,
                "500000-1000000": 400000,
                "1000000-2000000": 800000,
                "2000000-5000000": 2000000,
                "5000000+": 2000000
              };
              setDepositAmount(ranges[formData.priceRange as keyof typeof ranges] || 200000);
              setShowDepositForm(true);
            } else {
              handleSubmitInspection();
            }
          }}
          disabled={!formData.requestedDate || isCreating}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? "Submitting..." : needsDeposit ? "Proceed to Payment" : "Submit Request"}
        </button>
      </div>
    </div>
  );

  const renderDepositForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Deposit Payment
        </h3>
        <p className="text-gray-600">
          Complete payment to unlock unlimited inspections
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-900 mb-2">
            ₦{depositAmount.toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">
            40% deposit for {formData.priceRange} price range
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">After Payment Benefits:</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Unlimited property inspections</li>
          <li>• Priority scheduling</li>
          <li>• No additional fees</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setShowDepositForm(false)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleDepositPayment}
          disabled={isProcessingDeposit}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessingDeposit ? "Processing..." : "Pay Deposit"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {showDepositForm ? "Payment" : "Schedule Inspection"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          {showDepositForm ? renderDepositForm() : renderStep1()}
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;