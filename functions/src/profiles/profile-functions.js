const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");

/**
 * Get current user profile details
 */
exports.getMyProfile = onCall(async (request) => {
  const authUser = requireAuth(request);
  const userDoc = await db.collection("users").doc(authUser.uid).get();
  const profileDoc = await db.collection("freelancerProfiles").doc(authUser.uid).get();

  return {
    user: userDoc.exists ? userDoc.data() : null,
    freelancerProfile: profileDoc.exists ? profileDoc.data() : null
  };
});
