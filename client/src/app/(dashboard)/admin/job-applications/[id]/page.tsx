"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Star, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  GraduationCap,
  Award,
  FileText,
  Link as LinkIcon,
  Save,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

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
  reviewedBy?: string;
  notes?: string;
  averageRating: number;
  job: {
    id: number;
    title: string;
    department?: string;
    location: string;
    jobType: string;
    description: string;
    requirements: string;
    salaryRange?: string;
  };
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

interface RatingCriteria {
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

const ApplicationDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [ratings, setRatings] = useState<{[key: string]: {score: number, comments: string}}>({});
  const [activeTab, setActiveTab] = useState("overview");

  const applicationStatuses = [
    { value: "Submitted", label: "Submitted", color: "bg-blue-100 text-blue-800" },
    { value: "UnderReview", label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
    { value: "Shortlisted", label: "Shortlisted", color: "bg-purple-100 text-purple-800" },
    { value: "Interviewed", label: "Interviewed", color: "bg-indigo-100 text-indigo-800" },
    { value: "Rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
    { value: "Hired", label: "Hired", color: "bg-green-100 text-green-800" },
  ];

  const ratingCriteria: RatingCriteria[] = [
    {
      name: "Technical Skills",
      description: "Relevant technical skills and expertise for the role",
      weight: 0.3,
      maxScore: 10
    },
    {
      name: "Experience",
      description: "Years of experience and relevance to the position",
      weight: 0.25,
      maxScore: 10
    },
    {
      name: "Education",
      description: "Educational background and qualifications",
      weight: 0.15,
      maxScore: 10
    },
    {
      name: "Communication",
      description: "Written communication skills based on cover letter and application",
      weight: 0.15,
      maxScore: 10
    },
    {
      name: "Cultural Fit",
      description: "Alignment with company values and culture",
      weight: 0.15,
      maxScore: 10
    }
  ];

  const fetchApplication = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/applications/${applicationId}`);
      const data = await response.json();

      if (data.success) {
        setApplication(data.data);
        setNotes(data.data.notes || "");
        setStatus(data.data.status);
        
        // Initialize ratings from existing data
        const existingRatings: {[key: string]: {score: number, comments: string}} = {};
        data.data.ratings.forEach((rating: JobApplicationRating) => {
          existingRatings[rating.criteriaName] = {
            score: rating.score,
            comments: rating.comments || ""
          };
        });
        setRatings(existingRatings);
      } else {
        toast.error("Failed to fetch application details");
        router.push("/admin/job-applications");
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to fetch application details");
      router.push("/admin/job-applications");
    } finally {
      setLoading(false);
    }
  }, [applicationId, router]);

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId, fetchApplication]);

  const updateApplicationStatus = async () => {
    if (!application) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/jobs/applications/${application.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          notes,
          reviewedBy: "admin-user-id", // Replace with actual admin ID
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Application updated successfully");
        fetchApplication();
      } else {
        toast.error("Failed to update application");
      }
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    } finally {
      setUpdating(false);
    }
  };

  const submitRatings = async () => {
    if (!application) return;
    
    setUpdating(true);
    try {
      const ratingsToSubmit = Object.entries(ratings).map(([criteriaName, rating]) => {
        const criteria = ratingCriteria.find(c => c.name === criteriaName);
        return {
          criteriaName,
          score: rating.score,
          maxScore: criteria?.maxScore || 10,
          weight: criteria?.weight || 0.2,
          comments: rating.comments,
        };
      });

      const response = await fetch(`/api/jobs/applications/${application.id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ratings: ratingsToSubmit,
          ratedBy: "admin-user-id", // Replace with actual admin ID
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Ratings submitted successfully");
        fetchApplication();
      } else {
        toast.error("Failed to submit ratings");
      }
    } catch (error) {
      console.error("Error submitting ratings:", error);
      toast.error("Failed to submit ratings");
    } finally {
      setUpdating(false);
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

  const getRatingStars = (rating: number, maxRating: number = 5) => {
    const stars = [];
    const normalizedRating = (rating / 10) * maxRating; // Convert 10-point scale to 5-star scale
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
    }
    
    const emptyStars = maxRating - Math.ceil(normalizedRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateOverallRating = () => {
    if (Object.keys(ratings).length === 0) return 0;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    Object.entries(ratings).forEach(([criteriaName, rating]) => {
      const criteria = ratingCriteria.find(c => c.name === criteriaName);
      if (criteria && rating.score > 0) {
        totalWeightedScore += (rating.score / criteria.maxScore) * criteria.weight * 100;
        totalWeight += criteria.weight;
      }
    });
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-4">The application you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/admin/job-applications")}>Back to Applications</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push("/admin/job-applications")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{application.applicantName}</h1>
            <p className="text-muted-foreground">Application for {application.job.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(application.status)}
          <div className="flex items-center space-x-1">
            {getRatingStars(application.averageRating)}
            <span className="text-sm text-muted-foreground ml-2">
              ({application.averageRating.toFixed(1)}/10)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="application">Application</TabsTrigger>
              <TabsTrigger value="rating">Rating</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Applicant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Applicant Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="font-medium">{application.applicantName}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${application.applicantEmail}`} className="text-blue-600 hover:underline">
                          {application.applicantEmail}
                        </a>
                      </div>
                    </div>
                    {application.applicantPhone && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${application.applicantPhone}`} className="text-blue-600 hover:underline">
                            {application.applicantPhone}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Applied Date</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(application.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Resume</Label>
                      <Button variant="outline" size="sm" asChild>
                        <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Download Resume
                        </a>
                      </Button>
                    </div>
                    {application.portfolioUrl && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Portfolio</Label>
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Portfolio
                          </a>
                        </Button>
                      </div>
                    )}
                    {application.linkedinUrl && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">LinkedIn</Label>
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            View LinkedIn
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5" />
                    <span>Job Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                      <p className="font-medium">{application.job.title}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p>{application.job.department || "Not specified"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{application.job.location}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Job Type</Label>
                      <p>{application.job.jobType}</p>
                    </div>
                  </div>
                  {application.job.salaryRange && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Salary Range</Label>
                      <p className="font-medium">{application.job.salaryRange}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="application" className="space-y-6">
              {/* Cover Letter */}
              {application.coverLetter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Cover Letter</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{application.coverLetter}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {application.experience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span>Experience</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{application.experience}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {application.education && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5" />
                      <span>Education</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{application.education}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {application.skills && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {application.skills.split(',').map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rating" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rate Application</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Rate this application based on the criteria below. The overall rating will be calculated automatically.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {ratingCriteria.map((criteria) => {
                    const currentRating = ratings[criteria.name] || { score: 0, comments: "" };
                    return (
                      <div key={criteria.name} className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Label className="text-sm font-medium">{criteria.name}</Label>
                            <p className="text-xs text-muted-foreground">{criteria.description}</p>
                            <p className="text-xs text-muted-foreground">Weight: {(criteria.weight * 100).toFixed(0)}%</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              {getRatingStars(currentRating.score, 5)}
                            </div>
                            <p className="text-xs text-muted-foreground">{currentRating.score}/{criteria.maxScore}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Score (1-{criteria.maxScore})</Label>
                            <Input
                              type="number"
                              min="0"
                              max={criteria.maxScore}
                              value={currentRating.score}
                              onChange={(e) => setRatings(prev => ({
                                ...prev,
                                [criteria.name]: {
                                  ...prev[criteria.name],
                                  score: parseInt(e.target.value) || 0
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Comments (Optional)</Label>
                            <Input
                              placeholder="Add comments..."
                              value={currentRating.comments}
                              onChange={(e) => setRatings(prev => ({
                                ...prev,
                                [criteria.name]: {
                                  ...prev[criteria.name],
                                  comments: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </div>
                        <Separator />
                      </div>
                    );
                  })}
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Overall Rating:</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {getRatingStars(calculateOverallRating(), 5)}
                        </div>
                        <span className="font-bold">{calculateOverallRating().toFixed(1)}/100</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={submitRatings} disabled={updating} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {updating ? "Saving Ratings..." : "Save Ratings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Application Submitted</p>
                        <p className="text-sm text-muted-foreground">{formatDate(application.submittedAt)}</p>
                      </div>
                    </div>
                    {application.reviewedAt && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Application Reviewed</p>
                          <p className="text-sm text-muted-foreground">{formatDate(application.reviewedAt)}</p>
                          {application.reviewedBy && (
                            <p className="text-sm text-muted-foreground">by {application.reviewedBy}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {application.ratings.length > 0 && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Application Rated</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(application.ratings[0].createdAt)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Average Rating: {application.averageRating.toFixed(1)}/10
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Update Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applicationStatuses.map((statusOption) => (
                      <SelectItem key={statusOption.value} value={statusOption.value}>
                        {statusOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add notes about this application..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={updateApplicationStatus} disabled={updating} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {updating ? "Updating..." : "Update Application"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overall Rating</span>
                <span className="font-medium">{application.averageRating.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium">{applicationStatuses.find(s => s.value === application.status)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Applied</span>
                <span className="font-medium">
                  {Math.ceil((Date.now() - new Date(application.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </span>
              </div>
              {application.ratings.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ratings</span>
                  <span className="font-medium">{application.ratings.length} criteria</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Ratings */}
          {application.ratings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.ratings.map((rating) => (
                  <div key={rating.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{rating.criteriaName}</span>
                      <span className="text-sm">{rating.score}/{rating.maxScore}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(rating.score, 5)}
                    </div>
                    {rating.comments && (
                      <p className="text-xs text-muted-foreground">{rating.comments}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;