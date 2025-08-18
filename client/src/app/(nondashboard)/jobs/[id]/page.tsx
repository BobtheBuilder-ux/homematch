"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Building, DollarSign, Calendar, Users, Upload, FileText, ExternalLink, Briefcase } from "lucide-react";
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

interface ApplicationFormData {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  resumeUrl: string;
  coverLetter: string;
  experience: string;
  education: string;
  skills: string;
  portfolioUrl: string;
  linkedinUrl: string;
}

const JobDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    resumeUrl: "",
    coverLetter: "",
    experience: "",
    education: "",
    skills: "",
    portfolioUrl: "",
    linkedinUrl: "",
  });

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

  useEffect(() => {
    fetchJobDetails();
  }, [jobId, fetchJobDetails]);

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['applicantName', 'applicantEmail', 'resumeUrl'];
    const missing = required.filter(field => !formData[field as keyof ApplicationFormData]);
    
    if (missing.length > 0) {
      toast.error(`Please fill in required fields: ${missing.join(', ')}`);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.applicantEmail)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmitApplication = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          jobId: parseInt(jobId),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Application submitted successfully!");
        setShowApplicationForm(false);
        setFormData({
          applicantName: "",
          applicantEmail: "",
          applicantPhone: "",
          resumeUrl: "",
          coverLetter: "",
          experience: "",
          education: "",
          skills: "",
          portfolioUrl: "",
          linkedinUrl: "",
        });
        // Refresh job details to update application count
        fetchJobDetails();
      } else {
        toast.error(data.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

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
      month: 'long',
      day: 'numeric',
    });
  };

  const isClosingSoon = (closingDate?: string) => {
    if (!closingDate) return false;
    const closing = new Date(closingDate);
    const now = new Date();
    const diffTime = closing.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (closingDate?: string) => {
    if (!closingDate) return false;
    const closing = new Date(closingDate);
    const now = new Date();
    return closing < now;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => router.push('/jobs')}>
            Browse All Jobs
          </Button>
        </div>
      </div>
    );
  }

  const expired = isExpired(job.closingDate);
  const closingSoon = isClosingSoon(job.closingDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  {job.department && (
                    <p className="text-lg text-gray-600 mb-2">{job.department}</p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={job.isActive ? "default" : "secondary"}>
                    {job.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {closingSoon && (
                    <Badge variant="destructive">Closing Soon</Badge>
                  )}
                  {expired && (
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      Expired
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>{jobTypes[job.jobType as keyof typeof jobTypes]}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{experienceLevels[job.experienceLevel as keyof typeof experienceLevels]}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Posted {formatDate(job.postedDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{job._count.applications} applicants</span>
                </div>
                {job.closingDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Closes {formatDate(job.closingDate)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:w-64">
              {job.isActive && !expired ? (
                <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full">
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={formData.applicantName}
                              onChange={(e) => handleInputChange('applicantName', e.target.value)}
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.applicantEmail}
                              onChange={(e) => handleInputChange('applicantEmail', e.target.value)}
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.applicantPhone}
                            onChange={(e) => handleInputChange('applicantPhone', e.target.value)}
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Documents & Links</h3>
                        <div>
                          <Label htmlFor="resume">Resume/CV URL *</Label>
                          <Input
                            id="resume"
                            value={formData.resumeUrl}
                            onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                            placeholder="https://drive.google.com/file/d/..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Upload your resume to Google Drive, Dropbox, or similar and paste the public link
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="portfolio">Portfolio URL</Label>
                          <Input
                            id="portfolio"
                            value={formData.portfolioUrl}
                            onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn Profile</Label>
                          <Input
                            id="linkedin"
                            value={formData.linkedinUrl}
                            onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                            placeholder="https://linkedin.com/in/yourprofile"
                          />
                        </div>
                      </div>

                      {/* Professional Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Professional Information</h3>
                        <div>
                          <Label htmlFor="experience">Work Experience</Label>
                          <Textarea
                            id="experience"
                            value={formData.experience}
                            onChange={(e) => handleInputChange('experience', e.target.value)}
                            placeholder="Briefly describe your relevant work experience..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="education">Education</Label>
                          <Textarea
                            id="education"
                            value={formData.education}
                            onChange={(e) => handleInputChange('education', e.target.value)}
                            placeholder="Your educational background..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="skills">Skills</Label>
                          <Textarea
                            id="skills"
                            value={formData.skills}
                            onChange={(e) => handleInputChange('skills', e.target.value)}
                            placeholder="List your relevant skills (comma-separated)..."
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Cover Letter */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Cover Letter</h3>
                        <div>
                          <Label htmlFor="coverLetter">Why are you interested in this position?</Label>
                          <Textarea
                            id="coverLetter"
                            value={formData.coverLetter}
                            onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                            placeholder="Tell us why you're the perfect fit for this role..."
                            rows={4}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowApplicationForm(false)}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmitApplication}
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Application"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  {expired ? "Application Closed" : "Not Available"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Job Description</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.requirements}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.responsibilities}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium text-gray-900">Job Type:</span>
                  <p className="text-gray-600">{jobTypes[job.jobType as keyof typeof jobTypes]}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Experience Level:</span>
                  <p className="text-gray-600">{experienceLevels[job.experienceLevel as keyof typeof experienceLevels]}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Location:</span>
                  <p className="text-gray-600">{job.location}</p>
                </div>
                {job.department && (
                  <div>
                    <span className="font-medium text-gray-900">Department:</span>
                    <p className="text-gray-600">{job.department}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-900">Salary:</span>
                  <p className="text-gray-600">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Posted:</span>
                  <p className="text-gray-600">{formatDate(job.postedDate)}</p>
                </div>
                {job.closingDate && (
                  <div>
                    <span className="font-medium text-gray-900">Application Deadline:</span>
                    <p className={`${expired ? 'text-red-600' : closingSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                      {formatDate(job.closingDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{job._count.applications}</div>
                  <p className="text-gray-600">Total Applications</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Share This Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Job link copied to clipboard!");
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;