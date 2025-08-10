"use client";

import { useState } from "react";
import { useGetLandlordRegistrationsQuery, useGetLandlordRegistrationStatsQuery } from "@/state/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Users, CheckCircle, XCircle, Clock } from "lucide-react";

const LandlordRegistrationsPage = () => {
  const [codeFilter, setCodeFilter] = useState("");
  const [usedFilter, setUsedFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: registrations = [], isLoading: registrationsLoading } = useGetLandlordRegistrationsQuery({
    codeFilter: searchTerm,
    usedFilter,
  });

  const { data: stats, isLoading: statsLoading } = useGetLandlordRegistrationStatsQuery();

  const handleSearch = () => {
    setCodeFilter(searchTerm);
  };

  const handleFilterChange = (value: string) => {
    setUsedFilter(value === "all" ? undefined : value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCodeFilter("");
    setUsedFilter(undefined);
  };

  if (registrationsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Landlord Registrations</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used Codes</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.usedCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Codes</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.availableCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCodes > 0 ? Math.round((stats.usedCodes / stats.totalCodes) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by code (e.g., HomeMatch-landlord/1)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} className="px-4">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={usedFilter || "all"} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Codes</SelectItem>
                  <SelectItem value="true">Used</SelectItem>
                  <SelectItem value="false">Available</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Code</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Used Date</th>
                  <th className="text-left p-4 font-medium">Landlord</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      No registration codes found
                    </td>
                  </tr>
                ) : (
                  registrations.map((registration: any) => (
                    <tr key={registration.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {registration.code}
                        </code>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={registration.isUsed ? "default" : "secondary"}
                          className={registration.isUsed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                        >
                          {registration.isUsed ? "Used" : "Available"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {registration.usedAt
                          ? new Date(registration.usedAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-4">
                        {registration.landlord ? (
                          <div>
                            <div className="font-medium">{registration.landlord.name}</div>
                            <div className="text-sm text-gray-500">{registration.landlord.cognitoId}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {registration.landlord ? (
                          <div className="text-sm">
                            <div>{registration.landlord.email}</div>
                            <div className="text-gray-500">{registration.landlord.phoneNumber}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      {stats?.recentRegistrations && stats.recentRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRegistrations.map((registration: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{registration.landlord?.name}</div>
                      <div className="text-sm text-gray-500">{registration.landlord?.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      <code className="bg-white px-2 py-1 rounded">{registration.code}</code>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(registration.usedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LandlordRegistrationsPage;