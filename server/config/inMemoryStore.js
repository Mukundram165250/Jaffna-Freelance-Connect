const crypto = require("crypto");

// Seed data
const users = [
  {
    id: "usr-admin-1",
    email: "admin@jaffnafreelance.lk",
    // Hash of 'AdminPassword123!'
    passwordHash: "$2b$10$pkdNVBHZarKgvo0tZzpXfeDlKBSlxI6.jOGw.j8X1GmHupx7ED2lK",
    displayName: "Admin Jaffna",
    role: "ADMIN",
    phone: "+94 77 123 4567",
    location: "Jaffna Town",
    createdAt: new Date("2026-01-01T08:00:00Z"),
    updatedAt: new Date("2026-01-01T08:00:00Z")
  },
  {
    id: "usr-client-1",
    email: "ramesh@jaffnait.lk",
    // Hash of 'Password123!'
    passwordHash: "$2b$10$YhR1LbPv2vwUxBnzJ5UEL.ICVUuS6QYbA9yOvvGNr2jhJzZYgDmvy",
    displayName: "Ramesh Sivalingam",
    role: "CLIENT",
    phone: "+94 77 234 5678",
    location: "Nallur, Jaffna",
    createdAt: new Date("2026-01-10T09:30:00Z"),
    updatedAt: new Date("2026-01-10T09:30:00Z")
  },
  {
    id: "usr-client-2",
    email: "priya@palmyra.lk",
    passwordHash: "$2b$10$YhR1LbPv2vwUxBnzJ5UEL.ICVUuS6QYbA9yOvvGNr2jhJzZYgDmvy",
    displayName: "Priya Tharmalingam",
    role: "CLIENT",
    phone: "+94 77 345 6789",
    location: "Chavakachcheri, Jaffna",
    createdAt: new Date("2026-01-12T10:00:00Z"),
    updatedAt: new Date("2026-01-12T10:00:00Z")
  },
  {
    id: "usr-freelancer-1",
    email: "kavitha@design.lk",
    passwordHash: "$2b$10$YhR1LbPv2vwUxBnzJ5UEL.ICVUuS6QYbA9yOvvGNr2jhJzZYgDmvy",
    displayName: "Kavitha Vigneswaran",
    role: "FREELANCER",
    phone: "+94 77 456 7890",
    location: "Kopay, Jaffna",
    createdAt: new Date("2026-01-15T11:00:00Z"),
    updatedAt: new Date("2026-01-15T11:00:00Z")
  },
  {
    id: "usr-freelancer-2",
    email: "suresh@dev.lk",
    passwordHash: "$2b$10$YhR1LbPv2vwUxBnzJ5UEL.ICVUuS6QYbA9yOvvGNr2jhJzZYgDmvy",
    displayName: "Suresh Kumar",
    role: "FREELANCER",
    phone: "+94 77 567 8901",
    location: "Point Pedro, Jaffna",
    createdAt: new Date("2026-01-18T14:20:00Z"),
    updatedAt: new Date("2026-01-18T14:20:00Z")
  },
  {
    id: "usr-freelancer-3",
    email: "anita@translate.lk",
    passwordHash: "$2b$10$YhR1LbPv2vwUxBnzJ5UEL.ICVUuS6QYbA9yOvvGNr2jhJzZYgDmvy",
    displayName: "Anita Selvarajah",
    role: "FREELANCER",
    phone: "+94 77 678 9012",
    location: "Jaffna Town",
    createdAt: new Date("2026-01-20T16:00:00Z"),
    updatedAt: new Date("2026-01-20T16:00:00Z")
  },
  {
    id: "usr-freelancer-4",
    email: "dinesh@video.lk",
    passwordHash: "$2b$10$YhR1LbPv2vwUxBnzJ5UEL.ICVUuS6QYbA9yOvvGNr2jhJzZYgDmvy",
    displayName: "Dinesh Rasiah",
    role: "FREELANCER",
    phone: "+94 77 789 0123",
    location: "Karainagar, Jaffna",
    createdAt: new Date("2026-02-01T10:00:00Z"),
    updatedAt: new Date("2026-02-01T10:00:00Z")
  }
];

const freelancerProfiles = [
  {
    id: "prof-1",
    userId: "usr-freelancer-1",
    headline: "Senior Brand & UI/UX Designer",
    bio: "Over 6 years of experience helping Jaffna businesses build distinctive visual brands, logos, packaging, and social media creatives.",
    skills: ["Graphic Design", "Logo Design", "Photoshop", "Figma"],
    experienceLevel: "EXPERT",
    hourlyRate: "3500.00",
    availability: "Weekdays and Saturday mornings",
    moderation: "APPROVED",
    createdAt: new Date("2026-01-15T11:05:00Z"),
    updatedAt: new Date("2026-01-15T11:05:00Z")
  },
  {
    id: "prof-2",
    userId: "usr-freelancer-2",
    headline: "Full-Stack Web & Mobile Developer",
    bio: "Specializing in fast, responsive web applications and cross-platform mobile apps for local retailers, schools, and startups in Northern Province.",
    skills: ["Web Development", "React", "Node.js", "Flutter"],
    experienceLevel: "EXPERT",
    hourlyRate: "4500.00",
    availability: "Full-time freelance",
    moderation: "APPROVED",
    createdAt: new Date("2026-01-18T14:25:00Z"),
    updatedAt: new Date("2026-01-18T14:25:00Z")
  },
  {
    id: "prof-3",
    userId: "usr-freelancer-3",
    headline: "Professional Tamil-English-Sinhala Translator",
    bio: "Accurate translation and transcription services for legal documents, commercial materials, educational syllabi, and marketing content.",
    skills: ["Translation", "Typing / Data Entry", "Proofreading"],
    experienceLevel: "INTERMEDIATE",
    hourlyRate: "2000.00",
    availability: "Evenings and weekends",
    moderation: "APPROVED",
    createdAt: new Date("2026-01-20T16:10:00Z"),
    updatedAt: new Date("2026-01-20T16:10:00Z")
  },
  {
    id: "prof-4",
    userId: "usr-freelancer-4",
    headline: "Event & Commercial Videographer",
    bio: "Passionate videographer and editor producing wedding videos, social media reels, and business promos across Jaffna peninsula.",
    skills: ["Video Editing", "Photography", "Premiere Pro"],
    experienceLevel: "BEGINNER",
    hourlyRate: "1800.00",
    availability: "Flexible schedule",
    moderation: "PENDING",
    createdAt: new Date("2026-02-01T10:10:00Z"),
    updatedAt: new Date("2026-02-01T10:10:00Z")
  }
];

const jobs = [
  {
    id: "job-1",
    clientId: "usr-client-2",
    title: "Palmyra Products Brand Identity & Packaging Design",
    description: "Looking for an experienced designer to create a brand logo, color palette, and label designs for our organic palmyra jaggery and syrup packages.",
    category: "Graphic Design",
    skills: ["Graphic Design", "Logo Design"],
    budgetMin: "25000.00",
    budgetMax: "45000.00",
    location: "Chavakachcheri",
    contact: "WhatsApp 0773456789",
    status: "OPEN",
    moderation: "APPROVED",
    createdAt: new Date("2026-01-25T09:00:00Z"),
    updatedAt: new Date("2026-01-25T09:00:00Z")
  },
  {
    id: "job-2",
    clientId: "usr-client-1",
    title: "Bilingual E-Commerce Website for Jaffna Handicrafts",
    description: "We require a clean, responsive e-commerce web platform to sell handmade Jaffna craft items with PayHere integration and order management.",
    category: "Web Development",
    skills: ["Web Development", "React", "Node.js"],
    budgetMin: "60000.00",
    budgetMax: "120000.00",
    location: "Jaffna Town",
    contact: "info@jaffnait.lk",
    status: "OPEN",
    moderation: "APPROVED",
    createdAt: new Date("2026-01-28T14:00:00Z"),
    updatedAt: new Date("2026-01-28T14:00:00Z")
  },
  {
    id: "job-3",
    clientId: "usr-client-2",
    title: "Tamil to English Legal & Export Document Translation",
    description: "Need prompt translation of agricultural export certificates and trade agreements from Tamil into formal English.",
    category: "Translation",
    skills: ["Translation"],
    budgetMin: "15000.00",
    budgetMax: "25000.00",
    location: "Nallur",
    contact: "priya@palmyra.lk",
    status: "OPEN",
    moderation: "APPROVED",
    createdAt: new Date("2026-02-05T11:30:00Z"),
    updatedAt: new Date("2026-02-05T11:30:00Z")
  },
  {
    id: "job-4",
    clientId: "usr-client-1",
    title: "Combined Maths Tutor for G.C.E. Advanced Level",
    description: "Seeking an experienced teacher or university engineering student to conduct weekend tutoring sessions in Tamil medium.",
    category: "Tutoring",
    skills: ["Tutoring"],
    budgetMin: "12000.00",
    budgetMax: "20000.00",
    location: "Kopay",
    contact: "+94 77 234 5678",
    status: "OPEN",
    moderation: "APPROVED",
    createdAt: new Date("2026-02-10T16:00:00Z"),
    updatedAt: new Date("2026-02-10T16:00:00Z")
  },
  {
    id: "job-5",
    clientId: "usr-client-1",
    title: "Hotel Promo Video Shoot & Drone Footage",
    description: "Need short cinematic videos and social media clips showcasing our seaside guest house in Point Pedro.",
    category: "Video Editing",
    skills: ["Photography", "Video Editing"],
    budgetMin: "40000.00",
    budgetMax: "75000.00",
    location: "Point Pedro",
    contact: "ramesh@jaffnait.lk",
    status: "OPEN",
    moderation: "PENDING",
    createdAt: new Date("2026-02-15T12:00:00Z"),
    updatedAt: new Date("2026-02-15T12:00:00Z")
  }
];

const applications = [
  {
    id: "app-1",
    jobId: "job-1",
    freelancerId: "usr-freelancer-1",
    freelancerProfileId: "prof-1",
    coverMessage: "I have created brand packaging for several local food producers and would love to help you build an authentic Jaffna palmyra brand.",
    status: "PENDING",
    createdAt: new Date("2026-01-26T10:00:00Z"),
    updatedAt: new Date("2026-01-26T10:00:00Z")
  }
];

const stores = {
  users,
  freelancerProfiles,
  jobs,
  applications
};

function generateId(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

function matchCondition(val, condition) {
  if (condition === undefined) return true;
  if (condition === null) return val === null;

  if (typeof condition === "object" && !Array.isArray(condition) && !(condition instanceof Date)) {
    if ("equals" in condition) {
      const mode = condition.mode;
      const target = condition.equals;
      if (mode === "insensitive" && typeof val === "string" && typeof target === "string") {
        return val.toLowerCase() === target.toLowerCase();
      }
      return val === target;
    }
    if ("contains" in condition) {
      const mode = condition.mode;
      const target = condition.contains;
      if (typeof val !== "string") return false;
      if (mode === "insensitive") {
        return val.toLowerCase().includes(String(target).toLowerCase());
      }
      return val.includes(String(target));
    }
    if ("has" in condition) {
      const target = condition.has;
      if (!Array.isArray(val)) return false;
      return val.some(item => String(item).toLowerCase() === String(target).toLowerCase());
    }
    if ("in" in condition && Array.isArray(condition.in)) {
      return condition.in.includes(val);
    }
    if ("is" in condition) {
      return matchesWhere(val, condition.is);
    }
    return matchesWhere(val, condition);
  }

  return val === condition;
}

function matchesWhere(item, where, modelName) {
  if (!where || Object.keys(where).length === 0) return true;
  if (!item) return false;

  for (const [key, cond] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(cond)) {
      const orMatched = cond.some(subWhere => matchesWhere(item, subWhere, modelName));
      if (!orMatched) return false;
      continue;
    }
    if (key === "AND" && Array.isArray(cond)) {
      const andMatched = cond.every(subWhere => matchesWhere(item, subWhere, modelName));
      if (!andMatched) return false;
      continue;
    }

    // Relation filtering
    if (key === "freelancerProfile") {
      const prof = stores.freelancerProfiles.find(p => p.userId === item.id);
      if (cond && typeof cond === "object" && "is" in cond) {
        if (!matchesWhere(prof, cond.is, "freelancerProfile")) return false;
      } else if (!matchesWhere(prof, cond, "freelancerProfile")) {
        return false;
      }
      continue;
    }

    if (key === "client" || key === "user") {
      const uId = item.clientId || item.userId;
      const u = stores.users.find(x => x.id === uId);
      if (!matchesWhere(u, cond, "user")) return false;
      continue;
    }

    if (key === "jobId_freelancerId" && typeof cond === "object") {
      if (item.jobId !== cond.jobId || item.freelancerId !== cond.freelancerId) return false;
      continue;
    }

    const val = item[key];
    if (!matchCondition(val, cond)) {
      return false;
    }
  }

  return true;
}

function populateAndSelect(item, select, modelName) {
  if (!item) return null;
  const copy = { ...item };

  // Expand relations
  if (modelName === "user") {
    copy.freelancerProfile = stores.freelancerProfiles.find(p => p.userId === item.id) || null;
    copy.jobs = stores.jobs.filter(j => j.clientId === item.id);
    copy.applications = stores.applications.filter(a => a.freelancerId === item.id);
  } else if (modelName === "freelancerProfile") {
    copy.user = stores.users.find(u => u.id === item.userId) || null;
    copy.applications = stores.applications.filter(a => a.freelancerProfileId === item.id);
  } else if (modelName === "job") {
    copy.client = stores.users.find(u => u.id === item.clientId) || null;
    copy.applications = stores.applications.filter(a => a.jobId === item.id);
    copy._count = { applications: copy.applications.length };
  } else if (modelName === "application") {
    const j = stores.jobs.find(x => x.id === item.jobId);
    if (j) {
      copy.job = {
        ...j,
        client: stores.users.find(u => u.id === j.clientId) || null
      };
    } else {
      copy.job = null;
    }
    copy.freelancer = stores.users.find(u => u.id === item.freelancerId) || null;
    copy.freelancerProfile = stores.freelancerProfiles.find(p => p.id === item.freelancerProfileId) || null;
  }

  if (!select) return copy;

  const result = {};
  for (const [key, selectRule] of Object.entries(select)) {
    if (!selectRule) continue;
    if (key === "_count" && typeof selectRule === "object") {
      result._count = {};
      if (selectRule.select) {
        for (const subKey of Object.keys(selectRule.select)) {
          if (copy._count && copy._count[subKey] !== undefined) {
            result._count[subKey] = copy._count[subKey];
          } else if (subKey === "jobs") {
            result._count.jobs = stores.jobs.filter(j => j.clientId === item.id).length;
          } else if (subKey === "applications") {
            result._count.applications = stores.applications.filter(a => a.freelancerId === item.id || a.jobId === item.id).length;
          }
        }
      }
      continue;
    }

    if (typeof selectRule === "object" && selectRule.select) {
      const related = copy[key];
      if (Array.isArray(related)) {
        result[key] = related.map(subItem => populateAndSelect(subItem, selectRule.select, getSubModelName(key)));
      } else if (related) {
        result[key] = populateAndSelect(related, selectRule.select, getSubModelName(key));
      } else {
        result[key] = null;
      }
    } else {
      result[key] = copy[key];
    }
  }

  return result;
}

function getSubModelName(key) {
  if (key === "client" || key === "user" || key === "freelancer") return "user";
  if (key === "freelancerProfile") return "freelancerProfile";
  if (key === "job") return "job";
  if (key === "application" || key === "applications") return "application";
  return key;
}

function createModelApi(storeArray, modelName) {
  return {
    async findMany(args = {}) {
      const { where, select, orderBy, skip = 0, take } = args;
      let matched = storeArray.filter(item => matchesWhere(item, where, modelName));

      if (orderBy) {
        for (const [sortField, sortDir] of Object.entries(orderBy)) {
          const dir = String(sortDir).toLowerCase() === "desc" ? -1 : 1;
          matched.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (valA instanceof Date && valB instanceof Date) return (valA.getTime() - valB.getTime()) * dir;
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }
      }

      if (skip > 0) matched = matched.slice(skip);
      if (take !== undefined) matched = matched.slice(0, take);

      return matched.map(item => populateAndSelect(item, select, modelName));
    },

    async findFirst(args = {}) {
      const { where, select } = args;
      const found = storeArray.find(item => matchesWhere(item, where, modelName));
      return found ? populateAndSelect(found, select, modelName) : null;
    },

    async findUnique(args = {}) {
      return this.findFirst(args);
    },

    async count(args = {}) {
      const { where } = args;
      return storeArray.filter(item => matchesWhere(item, where, modelName)).length;
    },

    async create(args = {}) {
      const { data = {}, select } = args;
      // Check unique constraints
      if (modelName === "user" && data.email) {
        const existing = storeArray.find(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (existing) {
          const err = new Error("Unique constraint failed");
          err.code = "P2002";
          throw err;
        }
      }
      if (modelName === "application" && data.jobId && data.freelancerId) {
        const existing = storeArray.find(a => a.jobId === data.jobId && a.freelancerId === data.freelancerId);
        if (existing) {
          const err = new Error("Unique constraint failed");
          err.code = "P2002";
          throw err;
        }
      }

      const now = new Date();
      const newItem = {
        id: data.id || generateId(modelName.slice(0, 3)),
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now
      };

      storeArray.push(newItem);
      return populateAndSelect(newItem, select, modelName);
    },

    async update(args = {}) {
      const { where, data = {}, select } = args;
      const idx = storeArray.findIndex(item => matchesWhere(item, where, modelName));
      if (idx === -1) {
        const err = new Error("Record not found");
        err.code = "P2025";
        throw err;
      }

      const existing = storeArray[idx];
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date()
      };
      storeArray[idx] = updated;
      return populateAndSelect(updated, select, modelName);
    },

    async upsert(args = {}) {
      const { where, create: createData = {}, update: updateData = {}, select } = args;
      const existing = storeArray.find(item => matchesWhere(item, where, modelName));
      if (existing) {
        return this.update({ where, data: updateData, select });
      }
      return this.create({ data: createData, select });
    },

    async delete(args = {}) {
      const { where, select } = args;
      const idx = storeArray.findIndex(item => matchesWhere(item, where, modelName));
      if (idx === -1) {
        const err = new Error("Record not found");
        err.code = "P2025";
        throw err;
      }
      const [removed] = storeArray.splice(idx, 1);
      return populateAndSelect(removed, select, modelName);
    }
  };
}

const inMemoryDb = {
  user: createModelApi(stores.users, "user"),
  freelancerProfile: createModelApi(stores.freelancerProfiles, "freelancerProfile"),
  job: createModelApi(stores.jobs, "job"),
  application: createModelApi(stores.applications, "application"),

  async $transaction(arg) {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    if (typeof arg === "function") {
      return arg(inMemoryDb);
    }
    return arg;
  }
};

module.exports = { inMemoryDb, stores };
