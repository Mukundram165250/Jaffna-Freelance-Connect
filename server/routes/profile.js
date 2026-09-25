const express = require("express");
const prisma = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const publicUserSelect = {
  id: true,
  displayName: true,
  role: true,
  phone: true,
  location: true,
  createdAt: true,
  updatedAt: true
};

const freelancerProfileSelect = {
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
  updatedAt: true
};

const publicFreelancerSelect = {
  id: true,
  displayName: true,
  location: true,
  freelancerProfile: {
    select: {
      id: true,
      headline: true,
      bio: true,
      skills: true,
      experienceLevel: true,
      hourlyRate: true,
      availability: true,
      createdAt: true,
      updatedAt: true
    }
  }
};

function cleanOptionalString(value, field, maxLength) {
  if (value === undefined) return { value: undefined };
  if (value === null || String(value).trim() === "") return { value: null };
  const cleaned = String(value).trim();
  if (cleaned.length > maxLength) return { error: `${field} must be ${maxLength} characters or fewer.` };
  return { value: cleaned };
}

function validateUserUpdates(body) {
  const updates = {};
  if (body.displayName !== undefined) {
    const displayName = String(body.displayName).trim();
    if (displayName.length < 2 || displayName.length > 100) return { error: "Display name must be between 2 and 100 characters." };
    updates.displayName = displayName;
  }
  for (const field of ["phone", "location"]) {
    const result = cleanOptionalString(body[field], field, field === "phone" ? 30 : 150);
    if (result.error) return result;
    if (result.value !== undefined) updates[field] = result.value;
  }
  return { updates };
}

function validateFreelancerUpdates(body) {
  const updates = {};
  for (const [field, maxLength] of [["headline",160],["bio",2000],["availability",200]]) {
    const result = cleanOptionalString(body[field], field, maxLength);
    if (result.error) return result;
    if (result.value !== undefined) updates[field] = result.value;
  }
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills) || body.skills.length > 30) return { error: "Skills must be an array containing at most 30 items." };
    const skills = body.skills.map(skill => String(skill).trim()).filter(Boolean);
    if (skills.some(skill => skill.length > 100)) return { error: "Each skill must be 100 characters or fewer." };
    updates.skills = [...new Set(skills)];
  }
  if (body.experienceLevel !== undefined) {
    const experienceLevel = String(body.experienceLevel).toUpperCase();
    if (!["BEGINNER","INTERMEDIATE","EXPERT"].includes(experienceLevel)) return { error: "Invalid experience level." };
    updates.experienceLevel = experienceLevel;
  }
  if (body.hourlyRate !== undefined) {
    if (body.hourlyRate === null || String(body.hourlyRate).trim() === "") updates.hourlyRate = null;
    else {
      const rate = String(body.hourlyRate).trim();
      if (!/^\d{1,10}(\.\d{1,2})?$/.test(rate)) return { error: "Hourly rate must be a non-negative amount with up to 2 decimal places." };
      updates.hourlyRate = rate;
    }
  }
  return { updates };
}

function serializeProfile(user) {
  return {
    ...user,
    freelancerProfile: user.freelancerProfile ? {
      ...user.freelancerProfile,
      hourlyRate: user.freelancerProfile.hourlyRate?.toString() ?? null
    } : null
  };
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { ...publicUserSelect, email: true, freelancerProfile: { select: freelancerProfileSelect } }
    });
    if (!user) return res.status(404).json({ success:false, error:{message:"Profile not found."} });
    return res.json({ success:true, data:{profile:serializeProfile(user)} });
  } catch (error) { next(error); }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ success:false, error:{message:"A JSON object is required."} });
    }
    const userValidation = validateUserUpdates(req.body);
    if (userValidation.error) return res.status(400).json({success:false,error:{message:userValidation.error}});
    const freelancerValidation = req.user.role === "FREELANCER" ? validateFreelancerUpdates(req.body) : {updates:{}};
    if (freelancerValidation.error) return res.status(400).json({success:false,error:{message:freelancerValidation.error}});
    const profile = await prisma.$transaction(async tx => {
      if (Object.keys(userValidation.updates).length) await tx.user.update({where:{id:req.user.id},data:userValidation.updates});
      if (req.user.role === "FREELANCER" && Object.keys(freelancerValidation.updates).length) {
        await tx.freelancerProfile.upsert({where:{userId:req.user.id},create:{userId:req.user.id,...freelancerValidation.updates},update:freelancerValidation.updates});
      }
      return tx.user.findUnique({where:{id:req.user.id},select:{...publicUserSelect,email:true,freelancerProfile:{select:freelancerProfileSelect}}});
    });
    return res.json({success:true,data:{profile:serializeProfile(profile)}});
  } catch (error) { next(error); }
});

router.get("/freelancers", async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page,10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit,10) || 20, 1), 50);
    const search = String(req.query.search || "").trim();
    const where = {
      role: "FREELANCER",
      freelancerProfile: { moderation: "APPROVED" },
      ...(search ? {
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { freelancerProfile: { is: { headline: { contains: search, mode: "insensitive" }, moderation: "APPROVED" } } },
          { freelancerProfile: { is: { bio: { contains: search, mode: "insensitive" }, moderation: "APPROVED" } } }
        ]
      } : {})
    };
    const [profiles,total] = await prisma.$transaction([
      prisma.user.findMany({
        where, select: publicFreelancerSelect,
        orderBy:{createdAt:"desc"}, skip:(page-1)*limit, take:limit
      }),
      prisma.user.count({where})
    ]);
    return res.json({
      success:true,
      data:{
        profiles:profiles.map(profile => ({
          ...profile,
          freelancerProfile:{
            ...profile.freelancerProfile,
            hourlyRate:profile.freelancerProfile.hourlyRate?.toString() ?? null
          }
        })),
        pagination:{page,limit,total,pages:Math.ceil(total/limit)}
      }
    });
  } catch (error) { next(error); }
});

router.get("/freelancers/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where:{id:req.params.id,role:"FREELANCER",freelancerProfile:{moderation:"APPROVED"}},
      select:publicFreelancerSelect
    });
    if (!user) return res.status(404).json({success:false,error:{message:"Freelancer profile not found."}});
    return res.json({success:true,data:{profile:serializeProfile(user)}});
  } catch (error) { next(error); }
});

module.exports = router;
