/**
 * Server-side validation helpers for Cloud Functions
 */

function sanitizeString(str, maxLength) {
  if (typeof str !== "string") return "";
  const trimmed = str.trim();
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

function isNonNegativeNumber(num) {
  return typeof num === "number" && !isNaN(num) && num >= 0;
}

module.exports = {
  sanitizeString,
  isValidEmail,
  isNonNegativeNumber
};
