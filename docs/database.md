# Database Foundation

Phase 1, Task 3 uses **PostgreSQL + Prisma ORM**.

## Core entities

- **User** — account identity and role (client, freelancer, admin)
- **FreelancerProfile** — freelancer skills, experience, rate, availability, moderation state
- **Job** — client job requirements, budget, location, status, moderation state
- **Application** — a freelancer's application to a job, with duplicate protection

The schema is intentionally focused on the marketplace foundation. Authentication, AI analysis/matching data, notifications, and email delivery will be added in later phases.

## Local setup

1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your PostgreSQL database.
4. Install dependencies with `npm install`.
5. Generate the Prisma client with `npm run db:generate`.
6. Apply migrations in development with `npm run db:migrate`.

For an already-built deployment, use `npm run db:deploy`.

## Database rules

- Do not commit `.env` or real database credentials.
- Production database credentials must be supplied through environment variables/secrets.
- Prisma migrations are the source of truth for schema changes.
- AI matching will provide compatibility information only; it will not automatically hire or reject users.
