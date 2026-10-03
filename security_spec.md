# Jaffna Freelance Connect — Firestore Security Specification

## 1. Data Invariants
1. **User Identity & Role Protection**:
   - Every document in `/users/{userId}` is strictly keyed by the Firebase Auth UID.
   - Users may self-register ONLY as `CLIENT` or `FREELANCER`. Under no circumstances can a user grant themselves `ADMIN` during creation or updates.
   - A user's `role`, `uid`, and `email` cannot be modified after registration by non-admins.
2. **Freelancer Profile Integrity**:
   - `freelancerProfiles/{userId}` documents are keyed by Auth UID.
   - Any new profile submitted by a user begins strictly with `moderation: "PENDING"`.
   - Freelancers cannot approve their own profile or alter `moderation` state.
   - Only profiles with `moderation: "APPROVED"` can be read publicly.
3. **Job Listing Invariants**:
   - Jobs are created by authenticated clients with `moderation: "PENDING"` and `status: "OPEN"`.
   - Only `APPROVED` and `OPEN` jobs appear in public directory queries.
   - Clients cannot alter other clients' jobs, nor modify their own `moderation` status.
4. **Application Invariants**:
   - Freelancers can only apply to `OPEN` and `APPROVED` jobs.
   - Clients can only inspect applications for jobs they own.
   - Freelancers can withdraw applications only while `status == "PENDING"`.
   - Clients can update application status to `ACCEPTED` or `REJECTED` only while `status == "PENDING"`.
5. **Private Notifications**:
   - Notifications in `/notifications/{id}` are strictly private to the recipient `userId`.

---

## 2. The "Dirty Dozen" Threat Payloads (Must be Blocked)

1. **Self-Assigned Admin**: An attacker registers with `role: "ADMIN"`.
2. **Privilege Escalation Update**: An existing user attempts to patch their `role` from `FREELANCER` to `ADMIN`.
3. **Self-Approved Freelancer Profile**: A freelancer creates a profile with `moderation: "APPROVED"`.
4. **Moderation Bypass on Profile Update**: A pending freelancer updates their own profile to `moderation: "APPROVED"`.
5. **Spoofed Job Creation**: A user posts a job with a mismatched `clientId` belonging to another user.
6. **Self-Approved Job Post**: A client posts a job with `moderation: "APPROVED"` to bypass review.
7. **Cross-Client Job Modification**: Client B attempts to edit or close a job created by Client A.
8. **Unauthorized Application View**: Freelancer B attempts to view Freelancer A's application details.
9. **Post-Decision Application Withdrawal**: A freelancer attempts to withdraw an application that was already `ACCEPTED`.
10. **Foreign Job Application Tampering**: Client B attempts to accept/reject an application submitted to Client A's job.
11. **Notification Snooping**: User B attempts to query `/notifications` belonging to User A.
12. **Denial-of-Wallet Payload**: An attacker attempts to submit an oversized string (>160 chars for title, >5000 for desc) or malicious non-string type.

---

## 3. Verification & Compliance
All Firestore Security Rules are deployed in `firestore.rules` and enforced via `rules_version = '2'`.
Validation logic ensures that non-admin requests violating these invariants receive `PERMISSION_DENIED`.
