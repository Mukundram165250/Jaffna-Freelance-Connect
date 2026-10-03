const { HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebase");

/**
 * Verify that the caller is authenticated
 */
function requireAuth(context) {
  if (!context.auth || !context.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required to perform this action.");
  }
  return context.auth;
}

/**
 * Verify that the caller has admin permissions
 */
async function requireAdmin(context) {
  const authUser = requireAuth(context);

  // Check custom claims first
  if (authUser.token && authUser.token.admin === true) {
    return authUser;
  }

  // Check Firestore admin collection
  const adminDoc = await db.collection("admins").doc(authUser.uid).get();
  if (adminDoc.exists) {
    return authUser;
  }

  // Fallback for bootstrap owner
  if (authUser.token && authUser.token.email === "mukundram165250@gmail.com") {
    return authUser;
  }

  throw new HttpsError("permission-denied", "Administrator privilege required.");
}

module.exports = {
  requireAuth,
  requireAdmin
};
