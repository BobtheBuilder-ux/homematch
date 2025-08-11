"use client";

import ApplicationCard from "@/components/ApplicationCard";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetApplicationsQuery, useGetAuthUserQuery, useInitializePaymentMutation } from "@/state/api";
import { CircleCheckBig, Clock, Download, XCircle, CreditCard } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const Applications = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const {
    data: applications,
    isLoading,
    isError,
  } = useGetApplicationsQuery({
    userId: authUser?.cognitoInfo?.userId,
    userType: "tenant",
  });
  const [initializePayment] = useInitializePaymentMutation();

  const hasInitialPayment = (application: any) => {
    if (!application.lease?.payments) return false;
    return application.lease.payments.some((payment: any) => 
      payment.paymentStatus === "Paid" && payment.amountPaid > 0
    );
  };

  const handlePayNow = async (application: any) => {
    try {
      const totalAmount = application.property.pricePerYear + application.property.securityDeposit;
      const result = await initializePayment({
        propertyId: application.propertyId,
        tenantId: authUser?.cognitoInfo?.userId,
        amount: totalAmount,
        email: authUser?.userInfo.email || application.tenant.email,
        paymentType: "initial_payment"
      }).unwrap();
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Failed to initialize payment. Please try again.");
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !applications) return <div>Error fetching applications</div>;

  return (
    <div className="dashboard-container">
      <Header
        title="Applications"
        subtitle="Track and manage your property rental applications"
      />
      <div className="w-full">
        {applications?.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            userType="renter"
          >
            <div className="flex justify-between gap-5 w-full pb-4 px-4">
              {application.status === "Approved" ? (
                hasInitialPayment(application) ? (
                  <div className="bg-green-100 p-4 text-green-700 grow flex items-center">
                    <CircleCheckBig className="w-5 h-5 mr-2" />
                    The property is being rented by you until{" "}
                    {new Date(application.lease?.endDate).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="bg-blue-100 p-4 text-blue-700 grow flex items-center">
                    <CircleCheckBig className="w-5 h-5 mr-2" />
                    Your application has been approved! Complete payment to secure the property.
                  </div>
                )
              ) : application.status === "Pending" ? (
                <div className="bg-yellow-100 p-4 text-yellow-700 grow flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Your application is pending approval
                </div>
              ) : (
                <div className="bg-red-100 p-4 text-red-700 grow flex items-center">
                  <XCircle className="w-5 h-5 mr-2" />
                  Your application has been denied
                </div>
              )}

              {application.status === "Approved" && !hasInitialPayment(application) ? (
                <button
                  onClick={() => handlePayNow(application)}
                  className="bg-primary-600 text-white py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </button>
              ) : (
                <button
                  className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Agreement
                </button>
              )}
            </div>
          </ApplicationCard>
        ))}
      </div>
    </div>
  );
};

export default Applications;
