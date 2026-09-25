# User Profiles

## Endpoints

- GET /api/profile/me — authenticated user's profile.
- PATCH /api/profile/me — update the authenticated user's profile.
- GET /api/profile/freelancers/:id — public approved freelancer profile.

## Profile rules

All profile routes are protected except the public freelancer lookup.

The authenticated profile response includes:
- account email, display name, role, phone, and location
- freelancer profile data when the account role is FREELANCER

Freelancer profiles support:
- headline
- bio
- skills
- experience level
- hourly rate
- availability
- moderation status

Users cannot change their account role or moderation status through the profile API. Public freelancer profiles are only returned after the profile has been approved by moderation.

## Update example

    PATCH /api/profile/me

    {
      "displayName": "Mukundram",
      "phone": "+94 77 123 4567",
      "location": "Jaffna",
      "headline": "Web Developer",
      "bio": "I build responsive websites for local businesses.",
      "skills": ["HTML", "CSS", "JavaScript"],
      "experienceLevel": "INTERMEDIATE",
      "hourlyRate": "1500.00",
      "availability": "Evenings and weekends"
    }

The profile endpoint accepts partial updates. Empty optional strings can be cleared. Skills are deduplicated and limited to 30 entries.

## Security

- Authentication uses the existing HttpOnly JWT cookie.
- passwordHash is never selected or returned.
- User role and freelancer moderation status are not client-editable.
- Public freelancer profiles do not expose email or phone.
- Public freelancer lookup only exposes approved freelancer profiles.

## Database

The existing User and FreelancerProfile models already support this task, so no schema migration is required.

## Scope

This task establishes profile management. Jobs, applications, AI analysis/matching, email notifications, and frontend migration remain separate tasks.
