"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetApplicationQuery, useUpdateApplicationStatusMutation } from "@/state/api";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const ApplicationDetail = () => {
  const { id } = useParams();
  const applicationId = Number(id);
  
  const { data: application, isLoading, isError } = useGetApplicationQuery(applicationId);
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  if (isLoading) return <Loading />;
  if (isError || !application) return <div>Error loading application</div>;

  const handleStatusChange = async (status: string) => {
    await updateApplicationStatus({ id: applicationId, status, userType: 'admin' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="dashboard-container">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/applications"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Header
          title="Application Details"
          subtitle="Review application information and update status"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Property Name</h3>
              <p>{application.property.name}</p>
            </div>
            <div>
              <h3 className="font-medium">Address</h3>
              <p>{application.property.location.address}</p>
            </div>
            <div>
              <h3 className="font-medium">Yearly Rent</h3>
              <p>₦{application.property.pricePerYear.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-medium">Caution Fee</h3>
              <p>₦{(application.property.pricePerYear * 0.15).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Name</h3>
              <p>{application.tenant.name}</p>
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p>{application.tenant.email}</p>
            </div>
            <div>
              <h3 className="font-medium">Phone</h3>
              <p>{application.tenant.phoneNumber}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>
              Current status: <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Application Date</h3>
                <p>{new Date(application.applicationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-medium">Application Fee</h3>
                <p>₦{(application.property.pricePerYear * 0.1).toLocaleString()}</p>
              </div>
              {application.lease && (
                <>
                  <div>
                    <h3 className="font-medium">Lease Start Date</h3>
                    <p>{new Date(application.lease.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Lease End Date</h3>
                    <p>{new Date(application.lease.endDate).toLocaleDateString()}</p>
                  </div>
                </>
              )}
              <div className="flex gap-4 pt-4">
                {application.status === "Pending" && (
                  <>
                    <Button
                      onClick={() => handleStatusChange("Approved")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve Application
                    </Button>
                    <Button
                      onClick={() => handleStatusChange("Denied")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Deny Application
                    </Button>
                  </>
                )}
                {application.status === "Approved" && (
                  <Button className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Lease Agreement
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              Documents submitted with the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">ID Document</h3>
                {application.idDocumentUrl ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => window.open(application.idDocumentUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                      View ID Document
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No ID document uploaded</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Income Proof</h3>
                {application.incomeProofUrl ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => window.open(application.incomeProofUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                      View Income Proof
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No income proof uploaded</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Employment Status</h3>
                <p>{application.employmentStatus}</p>
              </div>
              <div>
                <h3 className="font-medium">Monthly Income</h3>
                <p>₦{application.monthlyIncome?.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-medium">Current Address Duration</h3>
                <p>{application.durationAtCurrentAddress}</p>
              </div>
              <div>
                <h3 className="font-medium">Move-in Date</h3>
                <p>{application.preferredMoveInDate ? new Date(application.preferredMoveInDate).toLocaleDateString() : 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationDetail;