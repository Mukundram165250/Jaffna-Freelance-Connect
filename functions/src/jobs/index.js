/**
 * Jobs Module — Cloud Functions for Firebase
 * Handles job validation, posting, updating, and closure.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");
const { sanitizeString, isNonNegativeNumber } = require("../utils/validators");

/**
 * Close a job (Callable, Owner Only)
 */
const closeJob = onCall(async (request) => {
  const authUser = requireAuth(request);
  const jobId = sanitizeString(request.data.jobId, 128);

  if (!jobId) {
    throw new HttpsError("invalid-argument", "jobId is required.");
  }

  const jobRef = db.collection("jobs").doc(jobId);
  const jobDoc = await jobRef.get();

  if (!jobDoc.exists) {
    throw new HttpsError("not-found", "Job not found.");
  }

  const jobData = jobDoc.data();
  if (jobData.clientId !== authUser.uid) {
    throw new HttpsError("permission-denied", "Only the job owner can close this job.");
  }

  await jobRef.update({
    status: "CLOSED",
    updatedAt: new Date().toISOString()
  });

  return { success: true, message: "Job closed successfully." };
});

/**
 * Validate and create a new job posting (Callable, Client Only)
 */
const createJob = onCall(async (request) => {
  const authUser = requireAuth(request);
  const title = sanitizeString(request.data.title, 160);
  const description = sanitizeString(request.data.description, 5000);
  const category = sanitizeString(request.data.category, 100) || "Other";
  const location = sanitizeString(request.data.location, 150) || "Jaffna";
  const contact = sanitizeString(request.data.contact, 200) || "";
  const skills = Array.isArray(request.data.skills)
    ? request.data.skills.map(s => sanitizeString(s, 50)).filter(Boolean).slice(0, 20)
    : [];

  const budgetMin = isNonNegativeNumber(Number(request.data.budgetMin)) ? Number(request.data.budgetMin) : null;
  const budgetMax = isNonNegativeNumber(Number(request.data.budgetMax)) ? Number(request.data.budgetMax) : null;

  if (!title || title.length < 5) {
    throw new HttpsError("invalid-argument", "Job title must be at least 5 characters.");
  }
  if (!description || description.length < 20) {
    throw new HttpsError("invalid-argument", "Job description must be at least 20 characters.");
  }

  const jobRef = db.collection("jobs").doc();
  const now = new Date().toISOString();

  const newJob = {
    id: jobRef.id,
    clientId: authUser.uid,
    title,
    description,
    category,
    skills,
    budgetMin,
    budgetMax,
    location,
    contact,
    status: "OPEN",
    moderation: "PENDING",
    createdAt: now,
    updatedAt: now
  };

  await jobRef.set(newJob);
  return { success: true, job: newJob };
});

module.exports = {
  closeJob,
  createJob
};
