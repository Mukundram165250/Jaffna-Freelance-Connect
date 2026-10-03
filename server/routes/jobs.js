const express = require("express");
const prisma = require("../config/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const MAX_PAGE_SIZE = 50;
const JOB_STATUSES = ["OPEN", "CLOSED", "CANCELLED"];

function cleanString(value, field, maxLength, required = false) {
  if (value === undefined || value === null) {
    if (required) return { error: field + " is required." };
    return { value: undefined };
  }

  const cleaned = String(value).trim();
  if (!cleaned && required) return { error: field + " is required." };
  if (cleaned.length > maxLength) {
    return { error: field + " must be " + maxLength + " characters or fewer." };
  }
  return { value: cleaned || null };
}

function cleanSkills(value) {
  if (value === undefined) return { value: undefined };
  if (!Array.isArray(value) || value.length > 30) {
    return { error: "Skills must be an array containing at most 30 items." };
  }

  const skills = [...new Set(value.map((skill) => String(skill).trim()).filter(Boolean))];
  if (skills.some((skill) => skill.length > 100)) {
    return { error: "Each skill must be 100 characters or fewer." };
  }

  return { value: skills };
}

function cleanMoney(value, field) {
  if (value === undefined) return { value: undefined };
  if (value === null || String(value).trim() === "") return { value: null };

  const amount = String(value).trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(amount)) {
    return { error: field + " must be a non-negative amount with up to 2 decimal places." };
  }
  return { value: amount };
}

function validateJob(body, partial = false) {
  const data = {};
  const fields = [
    ["title", 160, true],
    ["description", 5000, true],
    ["category", 100, false],
    ["location", 150, false],
    ["contact", 200, false]
  ];

  for (const [field, maxLength, required] of fields) {
    if (partial && body[field] === undefined) continue;
    const result = cleanString(body[field], field, maxLength, required && !partial);
    if (result.error) return result;
    data[field] = result.value;
  }

  const skills = cleanSkills(body.skills);
  if (skills.error) return skills;
  if (skills.value !== undefined) data.skills = skills.value;
  else if (!partial) data.skills = [];

  const budgetMin = cleanMoney(body.budgetMin, "budgetMin");
  if (budgetMin.error) return budgetMin;
  if (budgetMin.value !== undefined) data.budgetMin = budgetMin.value;

  const budgetMax = cleanMoney(body.budgetMax, "budgetMax");
  if (budgetMax.error) return budgetMax;
  if (budgetMax.value !== undefined) data.budgetMax = budgetMax.value;

  const min = data.budgetMin !== undefined && data.budgetMin !== null ? Number(data.budgetMin) : null;
  const max = data.budgetMax !== undefined && data.budgetMax !== null ? Number(data.budgetMax) : null;
  if (min !== null && max !== null && min > max) {
    return { error: "budgetMin cannot be greater than budgetMax." };
  }

  return { data };
}

function serializeJob(job) {
  return {
    ...job,
    budgetMin: job.budgetMin?.toString() ?? null,
    budgetMax: job.budgetMax?.toString() ?? null
  };
}

const publicJobSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  skills: true,
  budgetMin: true,
  budgetMax: true,
  location: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, displayName: true, location: true } }
};

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE);
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const location = String(req.query.location || "").trim();

    const where = {
      moderation: "APPROVED",
      ...(req.query.status && JOB_STATUSES.includes(String(req.query.status).toUpperCase())
        ? { status: String(req.query.status).toUpperCase() }
        : { status: "OPEN" }),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { skills: { has: search } }
            ]
          }
        : {})
    };

    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        select: publicJobSelect,
        orderBy: { createdAt: "desc" },
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

router.get("/:id", async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, moderation: "APPROVED" },
      select: publicJobSelect
    });

    if (!job) {
      return res.status(404).json({ success: false, error: { message: "Job not found." } });
    }

    return res.json({ success: true, data: { job: serializeJob(job) } });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("CLIENT", "ADMIN"), async (req, res, next) => {
  try {
    const validation = validateJob(req.body || {});
    if (validation.error) {
      return res.status(400).json({ success: false, error: { message: validation.error } });
    }

    const job = await prisma.job.create({
      data: {
        ...validation.data,
        clientId: req.user.id,
        moderation: "PENDING",
        status: "OPEN"
      },
      select: publicJobSelect
    });

    return res.status(201).json({ success: true, data: { job: serializeJob(job) } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.job.findUnique({
      where: { id: req.params.id },
      select: { id: true, clientId: true, moderation: true, status: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: "Job not found." } });
    }

    const isOwner = existing.clientId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: "You cannot edit this job." } });
    }

    const validation = validateJob(req.body || {}, true);
    if (validation.error) {
      return res.status(400).json({ success: false, error: { message: validation.error } });
    }

    const data = { ...validation.data };
    if (isOwner && existing.moderation === "APPROVED" && Object.keys(data).length > 0) {
      data.moderation = "PENDING";
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status).toUpperCase();
      if (!JOB_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: { message: "Invalid job status." } });
      }
      data.status = status;
    }

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data,
      select: publicJobSelect
    });

    return res.json({ success: true, data: { job: serializeJob(job) } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.job.findUnique({
      where: { id: req.params.id },
      select: { clientId: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: "Job not found." } });
    }

    if (existing.clientId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: { message: "You cannot delete this job." } });
    }

    await prisma.job.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { message: "Job deleted." } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
