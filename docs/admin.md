# Admin System

Admin routes are server-side protected with the authenticated user's database role. Every route under `/api/admin` requires `requireAuth` and `requireRole("ADMIN")`.

## Endpoints

### Dashboard
- `GET /api/admin/dashboard`
- Returns counts for users, roles, jobs, pending moderation items, and applications.

### Freelancer moderation
- `GET /api/admin/freelancers?moderation=PENDING&page=1&limit=20&search=...`
- `PATCH /api/admin/freelancers/:id/moderation`
- Body: `{"moderation":"APPROVED"}`, `REJECTED`, or `PENDING`.

### Job moderation
- `GET /api/admin/jobs?moderation=PENDING&page=1&limit=20&search=...`
- `PATCH /api/admin/jobs/:id/moderation`
- Body: `{"moderation":"APPROVED"}`, `REJECTED`, or `PENDING`.

### User administration
- `GET /api/admin/users?role=FREELANCER&page=1&limit=20&search=...`
- Read-only in this task. User roles are not exposed as a client-editable field.

### Application overview
- `GET /api/admin/applications?status=PENDING&page=1&limit=20`
- Gives admins a platform-wide application view.

## Security rules

- Public registration cannot create ADMIN accounts.
- Admin authorization is checked on the server using the authenticated user's role.
- Admin endpoints do not trust a role supplied in request bodies or query strings for authorization.
- Password hashes are never returned.
- Admin-only data is not exposed through the public job/profile routes.
- No automatic hiring, rejection, suspension, or role changes are performed by the admin APIs.

## Frontend integration

The existing frontend can later use these APIs for a real admin dashboard. Browser-side checks should only control presentation; the API remains the security boundary.

## Runtime note

These routes use Prisma and require the application's `DATABASE_URL` to be configured before running endpoint integration tests.
