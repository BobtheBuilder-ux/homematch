"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Star, 
  Calendar, 
  User, 
  Briefcase, 
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface JobApplication {
  id: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  resumeUrl: string;
  status: string;
  submittedAt: string;
  averageRating: number;
  job: {
    id: number;
    title: string;
    department?: string;
    location: string;
    jobType: string;
  };
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  shortlistedApplications: number;
  hiredApplications: number;
}

const JobApplicationsPage = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    hiredApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState("all");

  const applicationStatuses = [
    { value: "all", label: "All Applications", count: 0 },
    { value: "Submitted", label: "Submitted", count: 0, color: "bg-blue-100 text-blue-800" },
    { value: "UnderReview", label: "Under Review", count: 0, color: "bg-yellow-100 text-yellow-800" },
    { value: "Shortlisted", label: "Shortlisted", count: 0, color: "bg-purple-100 text-purple-800" },
    { value: "Interviewed", label: "Interviewed", count: 0, color: "bg-indigo-100 text-indigo-800" },
    { value: "Rejected", label: "Rejected", count: 0, color: "bg-red-100 text-red-800" },
    { value: "Hired", label: "Hired", count: 0, color: "bg-green-100 text-green-800" },
  ];

  useEffect(() => {
    fetchApplications();
    fetchJobs();
    fetchStats();
  }, []);

  const filterAndSortApplications = useCallback(() => {
    let filtered = [...applications];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status (tab or dropdown)
    const currentStatusFilter = activeTab !== "all" ? activeTab : statusFilter;
    if (currentStatusFilter !== "all") {
      filtered = filtered.filter(app => app.status === currentStatusFilter);
    }

    // Filter by job
    if (jobFilter !== "all") {
      filtered = filtered.filter(app => app.job.id.toString() === jobFilter);
    }

    // Sort applications
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "applicantName":
          aValue = a.applicantName.toLowerCase();
          bValue = b.applicantName.toLowerCase();
          break;
        case "jobTitle":
          aValue = a.job.title.toLowerCase();
          bValue = b.job.title.toLowerCase();
          break;
        case "rating":
          aValue = a.averageRating;
          bValue = b.averageRating;
          break;
        case "submittedAt":
        default:
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, jobFilter, sortBy, sortOrder, activeTab]);

  useEffect(() => {
    filterAndSortApplications();
  }, [filterAndSortApplications]);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/jobs/applications");
      const data = await response.json();

      if (data.success) {
        setApplications(data.data);
      } else {
        toast.error("Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to fetch applications");
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();

      if (data.success) {
        setJobs(data.data);
      } else {
        toast.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    }
  };

  const fetchStats = async () => {
    try {
      const [jobStatsResponse, appStatsResponse] = await Promise.all([
        fetch("/api/jobs/stats"),
        fetch("/api/jobs/applications/stats")
      ]);

      const jobStatsData = await jobStatsResponse.json();
      const appStatsData = await appStatsResponse.json();

      if (jobStatsData.success && appStatsData.success) {
        setStats({
          ...jobStatsData.data,
          ...appStatsData.data
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };



  const updateApplicationStatus = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/applications/${applicationId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          reviewedBy: "admin-user-id", // Replace with actual admin ID
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Application status updated successfully");
        fetchApplications();
        fetchStats();
      } else {
        toast.error("Failed to update application status");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    }
  };

  const exportApplications = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (jobFilter !== "all") queryParams.append("jobId", jobFilter);
      if (searchTerm) queryParams.append("search", searchTerm);

      const response = await fetch(`/api/jobs/applications/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Applications exported successfully");
      } else {
        toast.error("Failed to export applications");
      }
    } catch (error) {
      console.error("Error exporting applications:", error);
      toast.error("Failed to export applications");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = applicationStatuses.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const normalizedRating = (rating / 10) * 5; // Convert 10-point scale to 5-star scale
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(normalizedRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusCounts = () => {
    const counts = applicationStatuses.map(status => ({
      ...status,
      count: status.value === "all" ? applications.length : applications.filter(app => app.status === status.value).length
    }));
    return counts;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Job Applications</h1>
          <p className="text-muted-foreground">Manage and review job applications</p>
        </div>
        <Button onClick={exportApplications}>
          <Download className="w-4 h-4 mr-2" />
          Export Applications
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">All time applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shortlistedApplications}</div>
            <p className="text-xs text-muted-foreground">Ready for interview</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hiredApplications}</div>
            <p className="text-xs text-muted-foreground">Successfully hired</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants, jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {applicationStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job</label>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as "asc" | "desc");
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedAt-desc">Newest First</SelectItem>
                  <SelectItem value="submittedAt-asc">Oldest First</SelectItem>
                  <SelectItem value="applicantName-asc">Name A-Z</SelectItem>
                  <SelectItem value="applicantName-desc">Name Z-A</SelectItem>
                  <SelectItem value="rating-desc">Highest Rated</SelectItem>
                  <SelectItem value="rating-asc">Lowest Rated</SelectItem>
                  <SelectItem value="jobTitle-asc">Job Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          {getStatusCounts().map((status) => (
            <TabsTrigger key={status.value} value={status.value} className="relative">
              {status.label}
              {status.count > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {status.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications ({filteredApplications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No applications found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Job Position</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.applicantName}</div>
                            <div className="text-sm text-muted-foreground">{application.applicantEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.job.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {application.job.department} • {application.job.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(application.submittedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={application.status}
                            onValueChange={(value) => updateApplicationStatus(application.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {applicationStatuses.slice(1).map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getRatingStars(application.averageRating)}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({application.averageRating.toFixed(1)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/job-applications/${application.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" />
                                Resume
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobApplicationsPage;