const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");
const { sanitizeString } = require("../utils/validators");

/**
 * Submit job application with duplicate prevention and validation
 */
exports.submitApplication = onCall(async (request) => {
  const authUser = requireAuth(request);
  const jobId = sanitizeString(request.data.jobId, 128);
  const coverMessage = sanitizeString(request.data.coverMessage, 3000);

  if (!jobId) {
    throw new HttpsError("invalid-argument", "jobId is required.");
  }

  return await db.runTransaction(async (transaction) => {
    // 1. Verify job is OPEN and APPROVED
    const jobRef = db.collection("jobs").doc(jobId);
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new HttpsError("not-found", "Job not found.");
    }

    const job = jobDoc.data();
    if (job.status !== "OPEN" || job.moderation !== "APPROVED") {
      throw new HttpsError("failed-precondition", "Job is not accepting applications.");
    }

    if (job.clientId === authUser.uid) {
      throw new HttpsError("failed-precondition", "You cannot apply to your own job.");
    }

    // 2. Verify freelancer profile is APPROVED
    const profileRef = db.collection("freelancerProfiles").doc(authUser.uid);
    const profileDoc = await transaction.get(profileRef);
    if (!profileDoc.exists || profileDoc.data().moderation !== "APPROVED") {
      throw new HttpsError("permission-denied", "An approved freelancer profile is required to apply.");
    }

    // 3. Prevent duplicate applications
    const dupQuery = await db.collection("applications")
      .where("jobId", "==", jobId)
      .where("freelancerId", "==", authUser.uid)
      .limit(1)
      .get();

    if (!dupQuery.empty) {
      throw new HttpsError("already-exists", "You have already applied to this job.");
    }

    // 4. Create application
    const appRef = db.collection("applications").doc();
    const newApp = {
      id: appRef.id,
      jobId,
      freelancerId: authUser.uid,
      freelancerProfileId: authUser.uid,
      coverMessage: coverMessage || "",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transaction.set(appRef, newApp);
    return { success: true, application: newApp };
  });
});
