/**
 * Profiles Module — Cloud Functions for Firebase
 * Handles freelancer profiles, skills, rates, and public directory metadata.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");
const { sanitizeString, isNonNegativeNumber } = require("../utils/validators");

/**
 * Get current user profile details
 */
const getMyProfile = onCall(async (request) => {
  const authUser = requireAuth(request);
  const userDoc = await db.collection("users").doc(authUser.uid).get();
  const profileDoc = await db.collection("freelancerProfiles").doc(authUser.uid).get();

  return {
    user: userDoc.exists ? userDoc.data() : null,
    freelancerProfile: profileDoc.exists ? profileDoc.data() : null
  };
});

/**
 * Upsert freelancer profile (Callable, Freelancer Only)
 */
const updateFreelancerProfile = onCall(async (request) => {
  const authUser = requireAuth(request);
  const headline = sanitizeString(request.data.headline, 160);
  const bio = sanitizeString(request.data.bio, 2000);
  const availability = sanitizeString(request.data.availability, 200);
  const experienceLevel = ["BEGINNER", "INTERMEDIATE", "EXPERT"].includes(request.data.experienceLevel)
    ? request.data.experienceLevel
    : "BEGINNER";
  const hourlyRate = isNonNegativeNumber(Number(request.data.hourlyRate))
    ? Number(request.data.hourlyRate)
    : null;
  const skills = Array.isArray(request.data.skills)
    ? request.data.skills.map(s => sanitizeString(s, 50)).filter(Boolean).slice(0, 30)
    : [];

  const profileRef = db.collection("freelancerProfiles").doc(authUser.uid);
  const existing = await profileRef.get();
  const now = new Date().toISOString();

  const profileData = {
    userId: authUser.uid,
    headline,
    bio,
    skills,
    experienceLevel,
    hourlyRate,
    availability,
    moderation: existing.exists ? existing.data().moderation : "PENDING",
    updatedAt: now
  };

  if (!existing.exists) {
    profileData.createdAt = now;
  }

  await profileRef.set(profileData, { merge: true });
  return { success: true, profile: profileData };
});

module.exports = {
  getMyProfile,
  updateFreelancerProfile
};
