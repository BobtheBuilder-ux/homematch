"use client";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Users, Building, FileText, BarChart3, Briefcase, UserCheck } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const AdminDashboard = () => {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownloadSurvey = async (surveyType: 'tenant' | 'landlord') => {
    setIsDownloading(surveyType);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
      const response = await fetch(`${backendUrl}/surveys/download/${surveyType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming token is stored in localStorage
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download survey data');
      }

      // Create blob and download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${surveyType}-survey-data.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error downloading ${surveyType} survey:`, error);
      alert(`Failed to download ${surveyType} survey data. Please try again.`);
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Admin Dashboard"
        subtitle="Manage your platform and access key features"
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/users">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Management</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage tenants, landlords, and agents
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/properties">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View and manage all properties
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/applications">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Review rental applications
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View platform analytics
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Job Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/jobs">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Management</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Create and manage job postings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/job-applications">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Applications</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Review and manage job applications
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Survey Downloads Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Survey Data Downloads</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Tenant Survey Data</h3>
              <p className="text-sm text-gray-600 mb-3">
                Download all tenant survey responses from the coming soon page
              </p>
              <Button 
                onClick={() => handleDownloadSurvey('tenant')}
                disabled={isDownloading === 'tenant'}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading === 'tenant' ? 'Downloading...' : 'Download Tenant Survey'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Landlord Survey Data</h3>
              <p className="text-sm text-gray-600 mb-3">
                Download all landlord survey responses from the coming soon page
              </p>
              <Button 
                onClick={() => handleDownloadSurvey('landlord')}
                disabled={isDownloading === 'landlord'}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading === 'landlord' ? 'Downloading...' : 'Download Landlord Survey'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/settings">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Configure platform settings, maintenance mode, and general preferences
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/tasks">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create and manage tasks for agents and track their progress
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;