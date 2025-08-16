"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Eye, Users } from "lucide-react";
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

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  location: string;
  department: string;
  closingDate: string;
}

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Using toast from sonner

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    jobType: "FullTime",
    experienceLevel: "Mid",
    salaryMin: "",
    salaryMax: "",
    location: "",
    department: "",
    closingDate: "",
  });

  const jobTypes = [
    { value: "FullTime", label: "Full Time" },
    { value: "PartTime", label: "Part Time" },
    { value: "Contract", label: "Contract" },
    { value: "Internship", label: "Internship" },
    { value: "Remote", label: "Remote" },
  ];

  const experienceLevels = [
    { value: "Entry", label: "Entry Level" },
    { value: "Junior", label: "Junior" },
    { value: "Mid", label: "Mid Level" },
    { value: "Senior", label: "Senior" },
    { value: "Lead", label: "Lead" },
    { value: "Executive", label: "Executive" },
  ];

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== "all" && { jobType: filterType }),
      });

      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterType]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : "/api/jobs";
      const method = editingJob ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          createdBy: "admin-user-id", // Replace with actual admin ID
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Job ${editingJob ? "updated" : "created"} successfully`);
        setIsCreateDialogOpen(false);
        setEditingJob(null);
        resetForm();
        fetchJobs();
      } else {
        toast.error(data.message || "Failed to save job");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error("Failed to save job");
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Job deleted successfully");
        fetchJobs();
      } else {
        toast.error("Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      salaryMin: job.salaryMin?.toString() || "",
      salaryMax: job.salaryMax?.toString() || "",
      location: job.location,
      department: job.department || "",
      closingDate: job.closingDate ? new Date(job.closingDate).toISOString().split('T')[0] : "",
    });
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      requirements: "",
      responsibilities: "",
      jobType: "FullTime",
      experienceLevel: "Mid",
      salaryMin: "",
      salaryMax: "",
      location: "",
      department: "",
      closingDate: "",
    });
  };

  const getStatusBadge = (job: Job) => {
    if (!job.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (job.closingDate && new Date(job.closingDate) < new Date()) {
      return <Badge variant="destructive">Closed</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return "Not specified";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Job Management</h1>
          <p className="text-muted-foreground">Create and manage job postings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingJob(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Job" : "Create New Job"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type *</Label>
                  <Select value={formData.jobType} onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level *</Label>
                  <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingDate">Closing Date</Label>
                  <Input
                    id="closingDate"
                    type="date"
                    value={formData.closingDate}
                    onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements *</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities *</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingJob ? "Update Job" : "Create Job"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {jobTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{jobTypes.find(t => t.value === job.jobType)?.label}</span>
                      <span>•</span>
                      <span>{experienceLevels.find(l => l.value === job.experienceLevel)?.label}</span>
                      {job.department && (
                        <>
                          <span>•</span>
                          <span>{job.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(job)}
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{job._count.applications}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-medium">Salary:</span> {formatSalary(job.salaryMin, job.salaryMax)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/jobs/${job.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(job)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(job.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
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
    </div>
  );
};

export default JobsPage;