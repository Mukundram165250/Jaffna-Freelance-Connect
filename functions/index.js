/**
 * Jaffna Freelance Connect — Cloud Functions for Firebase
 * Base entry point exporting core modules for Auth, Jobs, and Profiles.
 */

// 1. Core Domain Modules
const authModule = require("./src/auth");
const jobsModule = require("./src/jobs");
const profilesModule = require("./src/profiles");
const applicationsModule = require("./src/applications/application-functions");
const adminModule = require("./src/admin/admin-functions");

// 2. Export Core Modules for future development & testing
exports.auth = authModule;
exports.jobs = jobsModule;
exports.profiles = profilesModule;
exports.applications = applicationsModule;
exports.admin = adminModule;

// 3. Export Top-Level Cloud Functions for direct deployment
// Auth Functions
exports.setAdminClaim = authModule.setAdminClaim;
exports.getAuthStatus = authModule.getAuthStatus;

// Jobs Functions
exports.createJob = jobsModule.createJob;
exports.closeJob = jobsModule.closeJob;

// Profiles Functions
exports.getMyProfile = profilesModule.getMyProfile;
exports.updateFreelancerProfile = profilesModule.updateFreelancerProfile;

// Applications Functions
exports.submitApplication = applicationsModule.submitApplication;

// Admin Functions
exports.moderateJob = adminModule.moderateJob;
exports.moderateProfile = adminModule.moderateProfile;
exports.getAdminStats = adminModule.getAdminStats;
