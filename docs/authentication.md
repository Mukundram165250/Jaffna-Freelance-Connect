# Authentication Foundation

## Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## Security

- Passwords are hashed with bcrypt before storage.
- passwordHash is never returned by the API.
- Authentication uses a signed JWT in an HttpOnly cookie.
- The cookie is SameSite=Lax and Secure in production.
- Authentication endpoints have a dedicated rate limit.
- Public registration can create CLIENT or FREELANCER accounts only.
- requireAuth and requireRole middleware are available for later protected routes.
- Admin accounts are not created through public registration.

## Environment

Add these to .env:

    JWT_SECRET="replace-with-a-long-random-secret"
    JWT_EXPIRES_IN="7d"
    AUTH_COOKIE_NAME="jfc_auth"
    AUTH_COOKIE_MAX_AGE_MS=604800000
    BCRYPT_ROUNDS=12

JWT_SECRET must be a strong unique production secret and must never be committed.

## Frontend

Because the JWT is HttpOnly, browser JavaScript cannot read it. Authenticated fetch requests should use:

    fetch("/api/auth/me", { credentials: "include" })

Do not store authentication tokens in localStorage.

## Scope

This task establishes authentication and authorization primitives. Profiles, jobs, applications, password reset, email verification, and frontend migration are later tasks.
