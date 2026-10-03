const express = require("express");
const prisma = require("../config/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const MODERATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const USER_ROLES = ["CLIENT", "FREELANCER", "ADMIN"];
const MAX_PAGE_SIZE = 50;

function parsePagination(req) {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  return {
    page,
    limit: Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE)
  };
}

function parseModeration(value) {
  if (value === undefined) return "PENDING";
  const status = String(value).toUpperCase();
  return MODERATION_STATUSES.includes(status) ? status : null;
}

function parseRole(value) {
  if (value === undefined) return undefined;
  const role = String(value).toUpperCase();
  return USER_ROLES.includes(role) ? role : null;
}

function parseModerationBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A JSON object is required." };
  }

  const moderation = String(body.moderation || "").toUpperCase();
  if (!MODERATION_STATUSES.includes(moderation)) {
    return { error: "Moderation must be PENDING, APPROVED, or REJECTED." };
  }

  return { moderation };
}

function serializeJob(job) {
  return {
    ...job,
    budgetMin: job.budgetMin?.toString() ?? null,
    budgetMax: job.budgetMax?.toString() ?? null
  };
}

function serializeProfile(profile) {
  return {
    ...profile,
    hourlyRate: profile.hourlyRate?.toString() ?? null
  };
}

const adminUserSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  phone: true,
  location: true,
  createdAt: true,
  updatedAt: true
};

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", async (req, res, next) => {
  try {
    const [
      users,
      clients,
      freelancers,
      admins,
      pendingFreelancers,
      jobs,
      openJobs,
      pendingJobs,
      applications,
      pendingApplications
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { role: "FREELANCER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.freelancerProfile.count({ where: { moderation: "PENDING" } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.job.count({ where: { moderation: "PENDING" } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: "PENDING" } })
    ]);

    return res.json({
      success: true,
      data: {
        counts: {
          users,
          clients,
          freelancers,
          admins,
          pendingFreelancers,
          jobs,
          openJobs,
          pendingJobs,
          applications,
          pendingApplications
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/freelancers", async (req, res, next) => {
  try {
    const moderation = parseModeration(req.query.moderation);
    if (!moderation) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid moderation status." }
      });
    }

    const { page, limit } = parsePagination(req);
    const search = String(req.query.search || "").trim();

    const where = {
      moderation,
      ...(search
        ? {
            OR: [
              { headline: { contains: search, mode: "insensitive" } },
              { bio: { contains: search, mode: "insensitive" } },
              { user: { displayName: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {})
    };

    const [profiles, total] = await prisma.$transaction([
      prisma.freelancerProfile.findMany({
        where,
        select: {
          id: true,
          userId: true,
          headline: true,
          bio: true,
          skills: true,
          experienceLevel: true,
          hourlyRate: true,
          availability: true,
          moderation: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              phone: true,
              location: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.freelancerProfile.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        freelancers: profiles.map((profile) => ({
          ...serializeProfile(profile),
          user: profile.user
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/freelancers/:id/moderation", async (req, res, next) => {
  try {
    const validation = parseModerationBody(req.body);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error }
      });
    }

    const profile = await prisma.freelancerProfile.update({
      where: { id: req.params.id },
      data: { moderation: validation.moderation },
      select: {
        id: true,
        userId: true,
        headline: true,
        bio: true,
        skills: true,
        experienceLevel: true,
        hourlyRate: true,
        availability: true,
        moderation: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { freelancer: serializeProfile(profile) }
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: { message: "Freelancer profile not found." }
      });
    }
    next(error);
  }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const moderation = parseModeration(req.query.moderation);
    if (!moderation) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid moderation status." }
      });
    }

    const { page, limit } = parsePagination(req);
    const search = String(req.query.search || "").trim();

    const where = {
      moderation,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
              { client: { displayName: { contains: search, mode: "insensitive" } } },
              { client: { email: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {})
    };

    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          skills: true,
          budgetMin: true,
          budgetMax: true,
          location: true,
          contact: true,
          status: true,
          moderation: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              email: true,
              displayName: true,
              phone: true,
              location: true
            }
          },
          _count: { select: { applications: true } }
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.job.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        jobs: jobs.map(serializeJob),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/jobs/:id/moderation", async (req, res, next) => {
  try {
    const validation = parseModerationBody(req.body);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error }
      });
    }

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { moderation: validation.moderation },
      select: {
        id: true,
        title: true,
        status: true,
        moderation: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { job }
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: { message: "Job not found." }
      });
    }
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const role = parseRole(req.query.role);
    if (role === null) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid user role." }
      });
    }

    const { page, limit } = parsePagination(req);
    const search = String(req.query.search || "").trim();

    const where = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          ...adminUserSelect,
          _count: {
            select: {
              jobs: true,
              applications: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/applications", async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req);
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid application status." }
      });
    }

    const where = status ? { status } : {};

    const [applications, total] = await prisma.$transaction([
      prisma.application.findMany({
        where,
        select: {
          id: true,
          coverMessage: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              moderation: true
            }
          },
          freelancer: {
            select: {
              id: true,
              email: true,
              displayName: true,
              location: true
            }
          },
          freelancerProfile: {
            select: {
              id: true,
              headline: true,
              skills: true,
              experienceLevel: true,
              hourlyRate: true,
              moderation: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.application.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        applications: applications.map((application) => ({
          ...application,
          freelancerProfile: application.freelancerProfile
            ? serializeProfile(application.freelancerProfile)
            : null
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
