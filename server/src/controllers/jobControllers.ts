import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Parser } from "json2csv";

const prisma = new PrismaClient();

// Job Management Controllers
export const createJob = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      requirements,
      responsibilities,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      location,
      department,
      closingDate,
      createdBy,
    } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        responsibilities,
        jobType,
        experienceLevel,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        location,
        department,
        closingDate: closingDate ? new Date(closingDate) : null,
        createdBy,
      },
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Failed to create job" });
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, department, jobType, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (department) where.department = department;
    if (jobType) where.jobType = jobType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

export const getActiveJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { closingDate: null },
          { closingDate: { gte: new Date() } },
        ],
      },
      orderBy: { postedDate: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error("Error fetching active jobs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch active jobs" });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id: parseInt(id) },
      include: {
        applications: {
          include: {
            ratings: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.salaryMin) updateData.salaryMin = parseFloat(updateData.salaryMin);
    if (updateData.salaryMax) updateData.salaryMax = parseFloat(updateData.salaryMax);
    if (updateData.closingDate) updateData.closingDate = new Date(updateData.closingDate);

    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ success: true, data: job });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.job.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};

// Job Application Controllers
export const submitJobApplication = async (req: Request, res: Response) => {
  try {
    const { id: jobId } = req.params;
    const {
      applicantName,
      applicantEmail,
      applicantPhone,
      resumeUrl,
      coverLetter,
      experience,
      education,
      skills,
      portfolioUrl,
      linkedinUrl,
    } = req.body;

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) },
    });

    if (!job || !job.isActive) {
      return res.status(400).json({ success: false, message: "Job is not available for applications" });
    }

    // Check if closing date has passed
    if (job.closingDate && new Date() > job.closingDate) {
      return res.status(400).json({ success: false, message: "Application deadline has passed" });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: parseInt(jobId),
        applicantName,
        applicantEmail,
        applicantPhone,
        resumeUrl,
        coverLetter,
        experience,
        education,
        skills,
        portfolioUrl,
        linkedinUrl,
      },
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ success: false, message: "Failed to submit application" });
  }
};

export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const { id: jobId } = req.params;
    const { page = 1, limit = 10, status, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { jobId: parseInt(jobId) };
    if (status) where.status = status;

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          job: {
            select: { title: true, department: true },
          },
          ratings: true,
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // Calculate average rating for each application
    const applicationsWithRatings = applications.map(app => {
      const totalScore = app.ratings.reduce((sum, rating) => sum + (rating.score * rating.weight), 0);
      const totalWeight = app.ratings.reduce((sum, rating) => sum + rating.weight, 0);
      const averageRating = totalWeight > 0 ? totalScore / totalWeight : 0;
      
      return {
        ...app,
        averageRating: Math.round(averageRating * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: applicationsWithRatings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

export const getJobApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const application = await prisma.jobApplication.findUnique({
      where: { id: parseInt(id) },
      include: {
        job: true,
        ratings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Calculate average rating
    const totalScore = application.ratings.reduce((sum, rating) => sum + (rating.score * rating.weight), 0);
    const totalWeight = application.ratings.reduce((sum, rating) => sum + rating.weight, 0);
    const averageRating = totalWeight > 0 ? totalScore / totalWeight : 0;

    res.json({ 
      success: true, 
      data: {
        ...application,
        averageRating: Math.round(averageRating * 100) / 100,
      }
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ success: false, message: "Failed to fetch application" });
  }
};

export const updateJobApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy, notes } = req.body;

    const application = await prisma.jobApplication.update({
      where: { id: parseInt(id) },
      data: {
        status,
        reviewedBy,
        notes,
        reviewedAt: new Date(),
      },
    });

    res.json({ success: true, data: application });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ success: false, message: "Failed to update application status" });
  }
};

export const searchJobApplications = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      jobId, 
      sortBy = 'submittedAt', 
      sortOrder = 'desc',
      minRating,
      maxRating 
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { applicantName: { contains: search as string, mode: 'insensitive' } },
        { applicantEmail: { contains: search as string, mode: 'insensitive' } },
        { skills: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (status) where.status = status;
    if (jobId) where.jobId = parseInt(jobId as string);

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          job: {
            select: { title: true, department: true },
          },
          ratings: true,
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // Calculate average rating and filter by rating if specified
    let applicationsWithRatings = applications.map(app => {
      const totalScore = app.ratings.reduce((sum, rating) => sum + (rating.score * rating.weight), 0);
      const totalWeight = app.ratings.reduce((sum, rating) => sum + rating.weight, 0);
      const averageRating = totalWeight > 0 ? totalScore / totalWeight : 0;
      
      return {
        ...app,
        averageRating: Math.round(averageRating * 100) / 100,
      };
    });

    // Filter by rating range if specified
    if (minRating || maxRating) {
      applicationsWithRatings = applicationsWithRatings.filter(app => {
        if (minRating && app.averageRating < Number(minRating)) return false;
        if (maxRating && app.averageRating > Number(maxRating)) return false;
        return true;
      });
    }

    // Sort by rating if requested
    if (sortBy === 'rating') {
      applicationsWithRatings.sort((a, b) => {
        return sortOrder === 'desc' ? b.averageRating - a.averageRating : a.averageRating - b.averageRating;
      });
    }

    res.json({
      success: true,
      data: applicationsWithRatings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: applicationsWithRatings.length,
        pages: Math.ceil(applicationsWithRatings.length / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error searching applications:", error);
    res.status(500).json({ success: false, message: "Failed to search applications" });
  }
};

export const getJobApplicationsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { status: status as any },
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'desc' },
        include: {
          job: {
            select: { title: true, department: true },
          },
          ratings: true,
        },
      }),
      prisma.jobApplication.count({ where: { status: status as any } }),
    ]);

    // Calculate average rating for each application
    const applicationsWithRatings = applications.map(app => {
      const totalScore = app.ratings.reduce((sum, rating) => sum + (rating.score * rating.weight), 0);
      const totalWeight = app.ratings.reduce((sum, rating) => sum + rating.weight, 0);
      const averageRating = totalWeight > 0 ? totalScore / totalWeight : 0;
      
      return {
        ...app,
        averageRating: Math.round(averageRating * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: applicationsWithRatings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching applications by status:", error);
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

// Rating System Controllers
export const rateJobApplication = async (req: Request, res: Response) => {
  try {
    const { id: jobApplicationId } = req.params;
    const { criteriaName, score, maxScore = 10, weight = 1.0, comments, ratedBy } = req.body;

    // Validate score
    if (score < 1 || score > maxScore) {
      return res.status(400).json({ 
        success: false, 
        message: `Score must be between 1 and ${maxScore}` 
      });
    }

    const rating = await prisma.jobApplicationRating.upsert({
      where: {
        jobApplicationId_criteriaName: {
          jobApplicationId: parseInt(jobApplicationId),
          criteriaName,
        },
      },
      update: {
        score,
        maxScore,
        weight,
        comments,
        ratedBy,
      },
      create: {
        jobApplicationId: parseInt(jobApplicationId),
        criteriaName,
        score,
        maxScore,
        weight,
        comments,
        ratedBy,
      },
    });

    res.json({ success: true, data: rating });
  } catch (error) {
    console.error("Error rating application:", error);
    res.status(500).json({ success: false, message: "Failed to rate application" });
  }
};

export const getJobApplicationRatings = async (req: Request, res: Response) => {
  try {
    const { id: jobApplicationId } = req.params;
    
    const ratings = await prisma.jobApplicationRating.findMany({
      where: { jobApplicationId: parseInt(jobApplicationId) },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate overall rating
    const totalScore = ratings.reduce((sum, rating) => sum + (rating.score * rating.weight), 0);
    const totalWeight = ratings.reduce((sum, rating) => sum + rating.weight, 0);
    const averageRating = totalWeight > 0 ? totalScore / totalWeight : 0;

    res.json({ 
      success: true, 
      data: {
        ratings,
        averageRating: Math.round(averageRating * 100) / 100,
        totalCriteria: ratings.length,
      }
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, message: "Failed to fetch ratings" });
  }
};

// Statistics Controllers
export const getJobStats = async (req: Request, res: Response) => {
  try {
    const { id: jobId } = req.params;
    
    const stats = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { jobId: parseInt(jobId) },
      _count: { status: true },
    });

    const totalApplications = await prisma.jobApplication.count({
      where: { jobId: parseInt(jobId) },
    });

    res.json({ 
      success: true, 
      data: {
        totalApplications,
        statusBreakdown: stats,
      }
    });
  } catch (error) {
    console.error("Error fetching job stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job statistics" });
  }
};

export const getApplicationStats = async (req: Request, res: Response) => {
  try {
    const [totalApplications, statusStats, jobStats] = await Promise.all([
      prisma.jobApplication.count(),
      prisma.jobApplication.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.job.count({ where: { isActive: true } }),
    ]);

    res.json({ 
      success: true, 
      data: {
        totalApplications,
        activeJobs: jobStats,
        statusBreakdown: statusStats,
      }
    });
  } catch (error) {
    console.error("Error fetching application stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch application statistics" });
  }
};

export const exportJobApplications = async (req: Request, res: Response) => {
  try {
    const { jobId, status, format = 'csv' } = req.query;
    
    const where: any = {};
    if (jobId) where.jobId = parseInt(jobId as string);
    if (status) where.status = status;

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        job: {
          select: { title: true, department: true },
        },
        ratings: true,
      },
    });

    // Calculate average ratings
    const applicationsWithRatings = applications.map(app => {
      const totalScore = app.ratings.reduce((sum, rating) => sum + (rating.score * rating.weight), 0);
      const totalWeight = app.ratings.reduce((sum, rating) => sum + rating.weight, 0);
      const averageRating = totalWeight > 0 ? totalScore / totalWeight : 0;
      
      return {
        id: app.id,
        jobTitle: app.job.title,
        department: app.job.department,
        applicantName: app.applicantName,
        applicantEmail: app.applicantEmail,
        applicantPhone: app.applicantPhone,
        status: app.status,
        averageRating: Math.round(averageRating * 100) / 100,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
      };
    });

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(applicationsWithRatings);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=job_applications.csv');
      res.send(csv);
    } else {
      res.json({ success: true, data: applicationsWithRatings });
    }
  } catch (error) {
    console.error("Error exporting applications:", error);
    res.status(500).json({ success: false, message: "Failed to export applications" });
  }
};

export const getGeneralJobStats = async (req: Request, res: Response) => {
  try {
    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({
      where: { isActive: true },
    });
    
    const totalApplications = await prisma.jobApplication.count();
    const pendingApplications = await prisma.jobApplication.count({
      where: { status: 'Submitted' },
    });
    const shortlistedApplications = await prisma.jobApplication.count({
      where: { status: 'Shortlisted' },
    });
    const hiredApplications = await prisma.jobApplication.count({
      where: { status: 'Hired' },
    });

    res.json({ 
      success: true, 
      data: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        hiredApplications,
      }
    });
  } catch (error) {
    console.error("Error fetching general job stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch general job statistics" });
  }
};