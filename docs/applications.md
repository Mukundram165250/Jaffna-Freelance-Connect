# Applications

Phase 1, Task 7 connects approved freelancers with approved open jobs.

## Endpoints

### Freelancer

- `POST /api/applications` — apply to an approved open job.
- `GET /api/applications/mine` — list the freelancer's applications.
- `PATCH /api/applications/:id/withdraw` — withdraw a pending application.

### Client/Admin

- `GET /api/applications/job/:jobId` — view applications for a job. Only the job owner or an admin can access this.
- `PATCH /api/applications/:id/status` — accept or reject a pending application.

## Application rules

- Only authenticated FREELANCER accounts can apply.
- The freelancer must have an approved freelancer profile.
- The target job must be OPEN and APPROVED.
- A freelancer cannot apply to their own job.
- The database unique constraint prevents duplicate applications.
- New applications start as PENDING.
- Only PENDING applications can be withdrawn or accepted/rejected.
- Application status is limited to PENDING, ACCEPTED, REJECTED, or WITHDRAWN.

## Privacy

Client application views expose the applicant's public display name, location, and approved profile information needed for evaluating the application. Password hashes, private account email addresses, and phone numbers are not returned.

## Database

Applications use the existing PostgreSQL Application table through Prisma. No second database or separate application store is introduced.
