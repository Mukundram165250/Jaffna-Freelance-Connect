const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebase");
const { requireAdmin } = require("../middleware/auth");
const { sanitizeString } = require("../utils/validators");

/**
 * Moderate a job (Approve / Reject)
 */
exports.moderateJob = onCall(async (request) => {
  await requireAdmin(request);
  const jobId = sanitizeString(request.data.jobId, 128);
  const moderation = sanitizeString(request.data.moderation, 20).toUpperCase();

  if (!["APPROVED", "REJECTED"].includes(moderation)) {
    throw new HttpsError("invalid-argument", "Moderation must be APPROVED or REJECTED.");
  }

  const jobRef = db.collection("jobs").doc(jobId);
  const job = await jobRef.get();
  if (!job.exists) {
    throw new HttpsError("not-found", "Job not found.");
  }

  await jobRef.update({
    moderation,
    updatedAt: new Date().toISOString()
  });

  return { success: true, message: `Job ${moderation.toLowerCase()}.` };
});

/**
 * Moderate a freelancer profile (Approve / Reject)
 */
exports.moderateProfile = onCall(async (request) => {
  await requireAdmin(request);
  const userId = sanitizeString(request.data.userId, 128);
  const moderation = sanitizeString(request.data.moderation, 20).toUpperCase();

  if (!["APPROVED", "REJECTED"].includes(moderation)) {
    throw new HttpsError("invalid-argument", "Moderation must be APPROVED or REJECTED.");
  }

  const profileRef = db.collection("freelancerProfiles").doc(userId);
  const prof = await profileRef.get();
  if (!prof.exists) {
    throw new HttpsError("not-found", "Freelancer profile not found.");
  }

  await profileRef.update({
    moderation,
    updatedAt: new Date().toISOString()
  });

  return { success: true, message: `Profile ${moderation.toLowerCase()}.` };
});

/**
 * Get aggregated dashboard statistics
 */
exports.getAdminStats = onCall(async (request) => {
  await requireAdmin(request);

  const [
    usersSnap,
    jobsSnap,
    pendingJobsSnap,
    freelancersSnap,
    pendingProfilesSnap,
    applicationsSnap
  ] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("jobs").count().get(),
    db.collection("jobs").where("moderation", "==", "PENDING").count().get(),
    db.collection("users").where("role", "==", "FREELANCER").count().get(),
    db.collection("freelancerProfiles").where("moderation", "==", "PENDING").count().get(),
    db.collection("applications").count().get()
  ]);

  return {
    counts: {
      users: usersSnap.data().count,
      freelancers: freelancersSnap.data().count,
      jobs: jobsSnap.data().count,
      pendingJobs: pendingJobsSnap.data().count,
      pendingFreelancers: pendingProfilesSnap.data().count,
      applications: applicationsSnap.data().count
    }
  };
});

/**
 * Change a user's role (Exclusive to Supreme Admin mukundram165250@gmail.com)
 */
exports.setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  const callerEmail = request.auth.token.email?.toLowerCase();
  const isSupreme = (callerEmail === "mukundram165250@gmail.com" || request.auth.token.supreme === true);
  if (!isSupreme) {
    throw new HttpsError("permission-denied", "Only Supreme Admin can change user roles.");
  }

  const targetUserId = sanitizeString(request.data.userId, 128);
  const targetRole = sanitizeString(request.data.role, 20).toUpperCase();

  if (!["CLIENT", "FREELANCER", "ADMIN"].includes(targetRole)) {
    throw new HttpsError("invalid-argument", "Role must be CLIENT, FREELANCER, or ADMIN.");
  }

  const userRef = db.collection("users").doc(targetUserId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User not found.");
  }

  await userRef.update({
    role: targetRole,
    updatedAt: new Date().toISOString()
  });

  const adminRef = db.collection("admins").doc(targetUserId);
  if (targetRole === "ADMIN") {
    await adminRef.set({
      uid: targetUserId,
      email: userSnap.data().email || "",
      grantedBy: callerEmail,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } else {
    await adminRef.delete().catch(() => {});
  }

  return { success: true, message: `User role successfully updated to ${targetRole}.` };
});

