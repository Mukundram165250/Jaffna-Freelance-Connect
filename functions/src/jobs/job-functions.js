const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");
const { sanitizeString } = require("../utils/validators");

/**
 * Close a job (Callable, Owner Only)
 */
exports.closeJob = onCall(async (request) => {
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
