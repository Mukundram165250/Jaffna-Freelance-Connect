# ⚡ VibeWorkers — Work Globally. Connect Freely.

**Official Global Freelance Marketplace**

> **Created by Mukundram**  
> **Instagram**: [@revolutionary_scout](https://www.instagram.com/revolutionary_scout/)

*Historical Note: VibeWorkers was originally started as Jaffna Freelance Connect by Mukundram.*

---

## 🌍 Overview

**VibeWorkers** is an international freelance marketplace connecting talented independent professionals, remote workers, students, and businesses worldwide. Designed without regional boundaries, VibeWorkers enables global collaboration with multi-currency job budgets, country selection, verified accounts, and modern privacy protection.

**Platform Highlights**:
- **Work Globally, Connect Freely**: Open to freelancers and clients worldwide with remote, hybrid, and location-based opportunities.
- **Multi-Currency Budgets**: Explicit currency assignment across USD, EUR, GBP, LKR, INR, CAD, AUD, AED, and SGD.
- **Account Verification**: Two-step account verification with email confirmation and phone verification.
- **Contact Privacy**: Clients and freelancers do not need to publicly expose email or phone numbers when posting jobs or submitting offers.
- **GDPR & Privacy Charter**: In-app self-service data export (JSON) and permanent account deletion.
- **Supreme Admin Management**: Dedicated system management and role administration.

---

## 🏗️ Architecture

- **Frontend**: Lightweight SPA (Semantic HTML5, CSS3 with modern gradient accents, JavaScript ES Modules).
- **Authentication**: Firebase Authentication (Email/Password & Google Sign-In with email verification status) with fallback Express API.
- **Database & Persistence**: Google Cloud Firestore & Relational SQLite/PostgreSQL (Prisma).
- **Security & Authorization**: Role-based access control (`CLIENT`, `FREELANCER`, `ADMIN`) with Firebase security rules.

---

## 📁 Repository Structure

```
VibeWorkers/
├── index.html                   # Global single-page application entry point
├── css/
│   └── style.css                # Global responsive styling with purple/pink accents
├── js/
│   ├── app.js                   # Application state, router, and UI views
│   └── firebase/
│       ├── firebase-config.js   # Client Firebase SDK configuration
│       ├── firestore-errors.js  # Standardized Firestore error handler
│       └── auth-service.js      # Global authentication and profile service
├── server/                      # Full-stack Node.js/Express API server
│   ├── routes/                  # Modular endpoints (auth, jobs, profiles, etc.)
│   └── config/                  # Database configuration and environment
├── firestore.rules              # Deployed Firestore security rules
├── firestore.indexes.json       # Compound query indexes
├── firebase-blueprint.json      # Firestore entity schema representation
└── package.json
```

---

## 🔒 Security & Privacy

1. **Email & Phone Verification**: Validated authentication prevents spam and verifies legitimate international users.
2. **Contact Privacy**: Contact information is securely linked to accounts; users never expose personal phone/email on public listings.
3. **GDPR Data Rights**: Users can export their complete profile data or trigger permanent account deletion directly.
4. **Moderation Architecture**: Listings and profiles pass through moderation before public visibility.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start the local development server (port 3000)
npm run dev

# Lint server and scripts
npm run lint
```

---

**VibeWorkers** · Work Globally. Connect Freely.  
Created by **Mukundram** · [Instagram: @revolutionary_scout](https://www.instagram.com/revolutionary_scout/)
