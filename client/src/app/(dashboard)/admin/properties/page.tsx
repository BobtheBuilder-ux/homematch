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
  useGetAllPropertiesQuery,
  useUpdatePropertyStatusMutation,
  useDeletePropertyMutation,
} from "@/state/api";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const Properties = () => {
  const {
    data: properties,
    isLoading,
    isError,
  } = useGetAllPropertiesQuery();
  const [updatePropertyStatus] = useUpdatePropertyStatusMutation();
  const [deleteProperty] = useDeletePropertyMutation();

  if (isLoading) return <Loading />;
  if (isError || !properties) return <div>Error loading properties</div>;

  const handleStatusToggle = async (propertyId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updatePropertyStatus({ propertyId, status: newStatus });
  };

  const handleDeleteProperty = async (propertyId: number) => {
    if (confirm("Are you sure you want to delete this property?")) {
      await deleteProperty(propertyId);
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Property Management"
        subtitle="Manage all properties on the platform"
      />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Landlord</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property: any) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={property.photoUrls?.[0] || "/placeholder.jpg"}
                      alt={property.name}
                      width={50}
                      height={50}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-medium">{property.name}</div>
                      <div className="text-sm text-gray-500">
                        {property.beds} bed, {property.baths} bath
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{property.landlord?.name}</TableCell>
                <TableCell>
                  {property.location?.city}, {property.location?.state}
                </TableCell>
                <TableCell>${property.pricePerMonth.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={property.status === "active" ? "default" : "secondary"}>
                    {property.status || "active"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(property.postedDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusToggle(property.id, property.status || "active")}
                    >
                      {property.status === "active" ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Properties;