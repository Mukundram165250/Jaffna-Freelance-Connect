/**
 * Jaffna Freelance Connect — Cloud Functions Entry Point
 */

const { setAdminClaim, onUserCreated } = require("./src/auth/auth-functions");
const { closeJob } = require("./src/jobs/job-functions");
const { getMyProfile } = require("./src/profiles/profile-functions");
const { submitApplication } = require("./src/applications/application-functions");
const { moderateJob, moderateProfile, getAdminStats } = require("./src/admin/admin-functions");

exports.setAdminClaim = setAdminClaim;
exports.closeJob = closeJob;
exports.getMyProfile = getMyProfile;
exports.submitApplication = submitApplication;
exports.moderateJob = moderateJob;
exports.moderateProfile = moderateProfile;
exports.getAdminStats = getAdminStats;
