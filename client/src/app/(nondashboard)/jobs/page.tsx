"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Building, DollarSign, Calendar, Users, Filter } from "lucide-react";
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

const JobsPage = () => {
  const router = useRouter();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("postedDate");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        sortBy,
        sortOrder: "desc",
        ...(searchTerm && { search: searchTerm }),
        ...(locationFilter !== "all" && { location: locationFilter }),
        ...(jobTypeFilter !== "all" && { jobType: jobTypeFilter }),
        ...(experienceFilter !== "all" && { experienceLevel: experienceFilter }),
        ...(departmentFilter !== "all" && { department: departmentFilter }),
      });

      const response = await fetch(`/api/jobs/active?${params}`);
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
  }, [currentPage, searchTerm, locationFilter, jobTypeFilter, experienceFilter, departmentFilter, sortBy]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not disclosed";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return "Salary not disclosed";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("all");
    setJobTypeFilter("all");
    setExperienceFilter("all");
    setDepartmentFilter("all");
    setCurrentPage(1);
  };

  const getUniqueValues = (key: keyof Job) => {
    const values = jobs.map(job => job[key]).filter(Boolean);
    return [...new Set(values)] as string[];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Find Your Dream Job</h1>
            <p className="text-xl text-gray-600 mt-2">Discover amazing opportunities that match your skills</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search jobs by title, company, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            
            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {getUniqueValues('location').map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(jobTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Experience Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {Object.entries(experienceLevels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {getUniqueValues('department').map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <Button variant="ghost" onClick={clearFilters}>
                  Clear All Filters
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postedDate">Newest First</SelectItem>
                    <SelectItem value="title">Job Title</SelectItem>
                    <SelectItem value="salaryMax">Highest Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? "Loading..." : `${jobs.length} jobs found`}
          </p>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      {job.department && (
                        <p className="text-sm text-gray-600 mt-1">{job.department}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {jobTypes[job.jobType as keyof typeof jobTypes]}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {truncateText(job.description, 120)}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Building className="w-4 h-4 mr-2" />
                      <span>{experienceLevels[job.experienceLevel as keyof typeof experienceLevels]}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(job.postedDate)}</span>
                      {job._count.applications > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <Users className="w-3 h-3 mr-1" />
                          <span>{job._count.applications} applicants</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    View Details & Apply
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
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
    </div>
  );
};

export default JobsPage;