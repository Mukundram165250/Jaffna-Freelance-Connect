const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, auth } = require("../config/firebase");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { sanitizeString, isValidEmail } = require("../utils/validators");

/**
 * Assign custom admin claims (Callable, Admin Only)
 */
exports.setAdminClaim = onCall(async (request) => {
  await requireAdmin(request);
  const targetUid = sanitizeString(request.data.uid, 128);

  if (!targetUid) {
    throw new HttpsError("invalid-argument", "Target UID is required.");
  }

  await auth.setCustomUserClaims(targetUid, { admin: true });
  await db.collection("admins").doc(targetUid).set({
    createdAt: new Date().toISOString()
  }, { merge: true });

  return { success: true, message: `Admin privileges granted to ${targetUid}.` };
});

/**
 * Handle new user registration and Firestore document provisioning
 */
exports.onUserCreated = async (userRecord) => {
  const { uid, email, displayName } = userRecord;

  // Set default user profile document if not already written by client
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      uid,
      email: email || "",
      displayName: displayName || "Jaffna Community Member",
      role: "FREELANCER",
      accountStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
};
