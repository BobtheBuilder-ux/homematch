"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  useGetApplicationsQuery,
  useUpdateApplicationStatusMutation,
} from "@/state/api";
import { File, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminApplications = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { data: applications, isLoading, isError } = useGetApplicationsQuery({
    userType: "admin",
  });
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  if (isLoading) return <Loading />;
  if (isError || !applications) return <div>Error loading applications</div>;

  const filteredApplications = applications.filter((application) => {
    if (activeTab === "all") return true;
    return application.status.toLowerCase() === activeTab;
  });

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
      <Header
        title="Application Management"
        subtitle="Review and manage all rental applications"
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full my-5"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>{application.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {application.property.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.property.location.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{application.tenant.name}</div>
                      <div className="text-sm text-gray-500">
                        {application.tenant.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {application.property.landlord.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.property.landlord.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(application.status)}
                      >
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(application.applicationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 w-9"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminApplications;