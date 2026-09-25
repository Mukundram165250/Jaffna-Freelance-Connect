const express = require("express");
const prisma = require("../config/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const APPLICATION_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"];

const applicationSelect = {
  id: true,
  jobId: true,
  freelancerId: true,
  freelancerProfileId: true,
  coverMessage: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  job: {
    select: {
      id: true,
      title: true,
      status: true,
      moderation: true,
      clientId: true,
      client: { select: { id: true, displayName: true } }
    }
  },
  freelancer: {
    select: { id: true, displayName: true, location: true }
  },
  freelancerProfile: {
    select: {
      id: true,
      headline: true,
      skills: true,
      experienceLevel: true,
      hourlyRate: true,
      availability: true,
      moderation: true
    }
  }
};

function serializeApplication(application) {
  return {
    ...application,
    freelancerProfile: application.freelancerProfile
      ? {
          ...application.freelancerProfile,
          hourlyRate: application.freelancerProfile.hourlyRate?.toString() ?? null
        }
      : null
  };
}

function validateCoverMessage(value) {
  if (value === undefined || value === null) return { value: null };
  const message = String(value).trim();
  if (message.length > 3000) {
    return { error: "Cover message must be 3000 characters or fewer." };
  }
  return { value: message || null };
}

router.post("/", requireAuth, requireRole("FREELANCER"), async (req, res, next) => {
  try {
    const jobId = String(req.body?.jobId || "").trim();
    if (!jobId) {
      return res.status(400).json({ success: false, error: { message: "jobId is required." } });
    }

    const cover = validateCoverMessage(req.body?.coverMessage);
    if (cover.error) {
      return res.status(400).json({ success: false, error: { message: cover.error } });
    }

    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({
        where: { id: jobId, status: "OPEN", moderation: "APPROVED" },
        select: { id: true, clientId: true }
      });

      if (!job) {
        return { errorStatus: 404, errorMessage: "Open approved job not found." };
      }

      if (job.clientId === req.user.id) {
        return { errorStatus: 400, errorMessage: "You cannot apply to your own job." };
      }

      const profile = await tx.freelancerProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true, moderation: true }
      });

      if (!profile) {
        return { errorStatus: 400, errorMessage: "Create a freelancer profile before applying." };
      }

      if (profile.moderation !== "APPROVED") {
        return { errorStatus: 403, errorMessage: "Your freelancer profile must be approved before applying." };
      }

      const existing = await tx.application.findUnique({
        where: { jobId_freelancerId: { jobId, freelancerId: req.user.id } },
        select: { id: true, status: true }
      });

      if (existing) {
        return { errorStatus: 409, errorMessage: "You have already applied to this job." };
      }

      const application = await tx.application.create({
        data: {
          jobId,
          freelancerId: req.user.id,
          freelancerProfileId: profile.id,
          coverMessage: cover.value,
          status: "PENDING"
        },
        select: applicationSelect
      });

      return { application };
    });

    if (result.errorStatus) {
      return res.status(result.errorStatus).json({
        success: false,
        error: { message: result.errorMessage }
      });
    }

    return res.status(201).json({
      success: true,
      data: { application: serializeApplication(result.application) }
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: { message: "You have already applied to this job." }
      });
    }
    next(error);
  }
});

router.get("/mine", requireAuth, requireRole("FREELANCER"), async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: { freelancerId: req.user.id },
      select: applicationSelect,
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      data: { applications: applications.map(serializeApplication) }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/withdraw", requireAuth, requireRole("FREELANCER"), async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, freelancerId: req.user.id },
      select: { id: true, status: true }
    });

    if (!application) {
      return res.status(404).json({ success: false, error: { message: "Application not found." } });
    }

    if (application.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: { message: "Only pending applications can be withdrawn." }
      });
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: "WITHDRAWN" },
      select: applicationSelect
    });

    return res.json({
      success: true,
      data: { application: serializeApplication(updated) }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/job/:jobId", requireAuth, requireRole("CLIENT", "ADMIN"), async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      select: { id: true, clientId: true }
    });

    if (!job) {
      return res.status(404).json({ success: false, error: { message: "Job not found." } });
    }

    if (job.clientId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: { message: "You cannot view applications for this job." }
      });
    }

    const applications = await prisma.application.findMany({
      where: { jobId: req.params.jobId },
      select: applicationSelect,
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      data: { applications: applications.map(serializeApplication) }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", requireAuth, requireRole("CLIENT", "ADMIN"), async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();
    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: "Status must be ACCEPTED or REJECTED." }
      });
    }

    const existing = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        job: { select: { id: true, clientId: true, status: true, moderation: true } }
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: "Application not found." } });
    }

    if (existing.job.clientId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: { message: "You cannot manage this application." }
      });
    }

    if (existing.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: { message: "Only pending applications can be accepted or rejected." }
      });
    }

    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: { status },
      select: applicationSelect
    });

    return res.json({
      success: true,
      data: { application: serializeApplication(updated) }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
