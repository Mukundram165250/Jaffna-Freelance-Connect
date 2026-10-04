const { inMemoryDb } = require("./inMemoryStore");

// Check if a real (non-placeholder) PostgreSQL connection string is supplied
const isRealDbConfigured =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("HOST:5432") &&
  !process.env.DATABASE_URL.includes("USER:PASSWORD");

let prisma;

if (isRealDbConfigured) {
  try {
    const { PrismaClient } = require("@prisma/client");
    prisma = new PrismaClient();
  } catch (err) {
    console.warn("[AI Studio] Database not connected — using in-memory mock store");
    prisma = inMemoryDb;
  }
} else {
  console.info("[AI Studio] Using in-memory mock store for VibeWorkers");
  prisma = inMemoryDb;
}

module.exports = prisma;
