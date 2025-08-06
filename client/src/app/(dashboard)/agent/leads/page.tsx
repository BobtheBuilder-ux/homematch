"use client";

import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

const Leads = () => {
  return (
    <div className="dashboard-container">
      <Header
        title="Lead Management"
        subtitle="Track and manage your property leads"
      />

      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Leads Available
          </h3>
          <p className="text-gray-500 text-center">
            Lead management functionality will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leads;