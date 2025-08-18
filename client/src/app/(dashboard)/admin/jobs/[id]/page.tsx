"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Calendar, MapPin, DollarSign, Building, Download, Search, Star } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  jobType: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  department?: string;
  isActive: boolean;
  postedDate: string;
  closingDate?: string;
  _count: {
    applications: number;
  };
}

interface JobApplication {
  id: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  resumeUrl: string;
  coverLetter?: string;
  experience?: string;
  education?: string;
  skills?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
  averageRating: number;
  ratings: JobApplicationRating[];
}

interface JobApplicationRating {
  id: number;
  criteriaName: string;
  score: number;
  maxScore: number;
  weight: number;
  comments?: string;
  ratedBy: string;
  createdAt: string;
}

interface JobStats {
  totalApplications: number;
  statusBreakdown: Array<{
    status: string;
    _count: { status: number };
  }>;
}

const JobDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  // Using toast from sonner
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const applicationStatuses = [
    { value: "Submitted", label: "Submitted", color: "bg-blue-100 text-blue-800" },
    { value: "UnderReview", label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
    { value: "Shortlisted", label: "Shortlisted", color: "bg-purple-100 text-purple-800" },
    { value: "Interviewed", label: "Interviewed", color: "bg-indigo-100 text-indigo-800" },
    { value: "Rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
    { value: "Hired", label: "Hired", color: "bg-green-100 text-green-800" },
  ];

  const jobTypes = {
    FullTime: "Full Time",
    PartTime: "Part Time",
    Contract: "Contract",
    Internship: "Internship",
    Remote: "Remote",
  };

  const experienceLevels = {
    Entry: "Entry Level",
    Junior: "Junior",
    Mid: "Mid Level",
    Senior: "Senior",
    Lead: "Lead",
    Executive: "Executive",
  };

  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();

      if (data.success) {
        setJob(data.data);
      } else {
        toast.error("Failed to fetch job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const fetchJobStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching job stats:", error);
    }
  }, [jobId]);

  const fetchApplications = useCallback(async () => {
    try {
      setApplicationsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/jobs/${jobId}/applications?${params}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error("Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to fetch applications");
    } finally {
      setApplicationsLoading(false);
    }
  }, [jobId, currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchJobDetails();
    fetchJobStats();
  }, [fetchJobDetails, fetchJobStats]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateApplicationStatus = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
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
        fetchJobStats();
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
      const response = await fetch(`/api/applications/export?jobId=${jobId}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `job_${jobId}_applications.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Applications exported successfully");
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

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return "Not specified";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Job Not Found</h1>
          <p className="text-gray-600 mt-2">The job you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Building className="w-4 h-4" />
              <span>{jobTypes[job.jobType as keyof typeof jobTypes]}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{job._count.applications} applications</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Posted {formatDate(job.postedDate)}</span>
            </div>
          </div>
        </div>
        <Button onClick={exportApplications}>
          <Download className="w-4 h-4 mr-2" />
          Export Applications
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications ({job._count.applications})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Responsibilities</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.responsibilities}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">Experience Level:</span>
                    <p className="text-muted-foreground">{experienceLevels[job.experienceLevel as keyof typeof experienceLevels]}</p>
                  </div>
                  <div>
                    <span className="font-medium">Department:</span>
                    <p className="text-muted-foreground">{job.department || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Salary Range:</span>
                    <p className="text-muted-foreground">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="mt-1">
                      {job.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  {job.closingDate && (
                    <div>
                      <span className="font-medium">Closing Date:</span>
                      <p className="text-muted-foreground">{formatDate(job.closingDate)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {/* Filters */}
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {applicationStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submittedAt">Submission Date</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="applicantName">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Applications List */}
          {applicationsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold">{application.applicantName}</h3>
                          {getStatusBadge(application.status)}
                          <div className="flex items-center space-x-1">
                            {getRatingStars(application.averageRating)}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({application.averageRating.toFixed(1)})
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>📧 {application.applicantEmail}</p>
                          {application.applicantPhone && <p>📞 {application.applicantPhone}</p>}
                          <p>📅 Applied {formatDate(application.submittedAt)}</p>
                          {application.skills && (
                            <p>🛠️ Skills: {application.skills}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Select
                          value={application.status}
                          onValueChange={(value) => updateApplicationStatus(application.id, value)}
                        >
                          <SelectTrigger className="w-40">
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
                        <Button
                          variant="outline"
                          onClick={() => window.open(`/admin/applications/${application.id}`, '_blank')}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalApplications}</div>
                </CardContent>
              </Card>
              {stats.statusBreakdown.map((stat) => {
                const statusConfig = applicationStatuses.find(s => s.value === stat.status);
                return (
                  <Card key={stat.status}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        {statusConfig?.label || stat.status}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat._count.status}</div>
                      <div className="text-xs text-muted-foreground">
                        {((stat._count.status / stats.totalApplications) * 100).toFixed(1)}% of total
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobDetailPage;