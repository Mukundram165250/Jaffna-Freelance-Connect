# 🌴 Jaffna Freelance Connect — Firebase Migration

A modern freelance marketplace connecting local talent with opportunity in **Jaffna, Sri Lanka**.

**Production Architecture**:
- **Frontend**: GitHub Pages (Pure HTML, CSS, JavaScript SPA)
- **Backend & Database**: Google Firebase (Authentication, Cloud Firestore, Cloud Functions)
- **Security**: Hardened Firestore Security Rules (ABAC & RBAC)

---

## 🚀 Migration Roadmap

- [x] **Phase 1: Repository Inspection & Firebase Foundation**
  - Provisioned Firebase project and Cloud Firestore database (`sinuous-brace-583d0`)
  - Created Intermediate Representation schema (`firebase-blueprint.json`)
  - Configured project rules (`firestore.rules`) and deployed via Firebase RPC
  - Defined query compound indexes (`firestore.indexes.json`)
  - Created Cloud Functions modular architecture (`functions/`)
  - Created client-side Firebase configuration (`js/firebase/firebase-config.js`)
  - Implemented standardized Firestore error handling (`js/firebase/firestore-errors.js`)
  - Drafted comprehensive security specification (`security_spec.md`)
- [ ] **Phase 2: Authentication System**
  - Firebase Authentication (Email/Password & Google Sign-In)
  - Role-based account creation (`CLIENT` & `FREELANCER`)
  - Protected routes and session management
- [ ] **Phase 3: Freelancer Profiles**
  - Profile creation, skills, hourly rate, and portfolio management
  - Admin moderation and public directory listing
- [ ] **Phase 4: Job Management**
  - Client job posting, editing, and closing
  - Public job search, categories, and LKR budget filtering
- [ ] **Phase 5: Application System**
  - Application submission with duplicate prevention
  - Client acceptance/rejection and freelancer withdrawal
- [ ] **Phase 6: Admin Dashboard**
  - Secure moderation of jobs and profiles
  - User management and platform analytics
- [ ] **Phase 7: Production Deployment**
  - GitHub Pages deployment and Firebase domain authorization
- [ ] **Phase 8: Future Enhancements**
  - Real-time notifications and AI-assisted skill matching

---

## 📁 Repository Structure

```
Jaffna-Freelance-Connect/
├── index.html                   # Main frontend single-page application
├── css/
│   └── style.css                # Visual design and responsive layouts
├── js/
│   ├── app.js                   # Application state and UI routing
│   └── firebase/
│       ├── firebase-config.js   # Client Firebase configuration
│       └── firestore-errors.js  # Standardized Firestore error handler
├── functions/                   # Cloud Functions for Firebase (Node.js 22)
│   ├── package.json
│   ├── index.js                 # Exported callable functions
│   └── src/
│       ├── config/              # Admin SDK initialization
│       ├── middleware/          # Auth and Admin guards
│       ├── auth/                # Auth triggers & admin claims
│       ├── jobs/                # Job mutations & closures
│       ├── profiles/            # Profile retrieval & updates
│       ├── applications/        # Secure application transactions
│       └── admin/               # Moderation & stats
├── firebase.json                # Firebase emulator and deployment config
├── .firebaserc.example          # Firebase project alias template
├── firestore.rules              # Deployed Firestore security rules
├── firestore.indexes.json       # Compound query indexes
├── firebase-blueprint.json      # Complete data entity blueprint
├── security_spec.md             # Threat model & Dirty Dozen attack tests
├── server/                      # Existing legacy Express server (preserved)
├── prisma/                      # Existing database migrations (preserved)
└── package.json
```

---

## 🔒 Security Architecture
1. **Zero-Trust Rules**: Default deny catch-all on all documents.
2. **Role Protection**: Ordinary users cannot self-assign `ADMIN` or alter account roles.
3. **Content Moderation**: Newly created jobs and freelancer profiles must be `APPROVED` by an administrator before appearing in public listings.
4. **Data Isolation**: Application submissions and private notifications are strictly limited to authorized participants.

---

## 🛠️ Local Development & Emulators
```bash
# Start the local development server
npm run dev

# Start Firebase Emulators (when firebase-tools is installed)
firebase emulators:start
```

---
Built with ❤️ for the Jaffna community.
