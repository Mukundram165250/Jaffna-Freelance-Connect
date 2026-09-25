# Job System

Phase 1, Task 6 adds the marketplace job API.

## Endpoints

### Public

- `GET /api/jobs` — browse approved jobs.
- `GET /api/jobs/:id` — view an approved job.

List filters:

- `page`
- `limit` (1–50, default 20)
- `search`
- `category`
- `location`
- `status` (OPEN, CLOSED, CANCELLED)

Without an explicit status filter, only OPEN approved jobs are listed.

### Authenticated

- `POST /api/jobs` — clients/admins create jobs.
- `PATCH /api/jobs/:id` — job owner or admin edits a job.
- `DELETE /api/jobs/:id` — job owner or admin deletes a job.

## Moderation

New jobs start as:

- `status = OPEN`
- `moderation = PENDING`

They are therefore not visible through the public job endpoints until approved.

When a client edits an already-approved job, its moderation state returns to `PENDING` so the changed content can be reviewed again. Admin edits do not trigger this automatic reset.

## Validation

The API validates:

- title: 1–160 characters
- description: 1–5000 characters
- category: up to 100 characters
- location: up to 150 characters
- contact: up to 200 characters
- skills: up to 30 unique skills, each up to 100 characters
- budgets: non-negative, up to 2 decimal places
- minimum budget cannot exceed maximum budget

## Authorization

- Only CLIENT and ADMIN accounts can create jobs.
- Only the owning client or ADMIN can update/delete a job.
- Job data is stored in the project's single PostgreSQL database through Prisma.
- Public responses do not expose the client's email, phone, password hash, or moderation state.

## Next scope

Applications will be implemented in Phase 1 Task 7 and will connect freelancers to jobs through the existing Application model.
