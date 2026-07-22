# 🌴 Jaffna Freelance Connect

A modern freelance marketplace MVP connecting local talent with opportunity in **Jaffna, Sri Lanka**.

**Live Demo:** enable GitHub Pages on this repo (Settings → Pages → Deploy from branch `main`, root) — then visit:
`https://mukundram165250.github.io/Jaffna-Freelance-Connect/`

## ✨ Features

### User Roles
- **Guests** — browse approved jobs & freelancer profiles
- **Registered users** — post jobs ("I need a worker") or offer services ("I can work")
- **Admin** — full moderation dashboard

### Job Posting
Title, description, budget (LKR), location, category, contact — all posts start as **Pending Approval**.

### Freelancer Profiles
Name, skills, experience level (Beginner / Intermediate / Expert), hourly rate, contact — also **Pending Approval**.

### 🛡️ Admin Panel (`#/admin`)
- Secure admin login
- Dashboard stats (pending, jobs, services, users)
- Approve ✅ / Reject ❌ / Delete 🗑️ any post
- Only **approved** posts appear publicly

**Demo admin login:** `admin@jaffnafreelance.lk` / `admin123`
> ⚠️ Change these credentials before real launch.

### Extras
- 🔍 Search & filter (skill, category, budget, rate, level)
- ⭐ Star ratings on freelancer cards
- 💬 One-tap WhatsApp contact buttons
- 🏷️ Badges: Verified, New, Top Skill
- 🚫 Spam protection (rate-limited submissions)
- 📱 Fully responsive, modern gradient UI

## 🧱 Tech Stack
- Pure **HTML + CSS + JavaScript** SPA (hash routing) — zero build step, deploys anywhere
- Data layer: `localStorage` (clean `DB` abstraction — swap in Firebase/Supabase later without touching UI code)

## 🚀 Run Locally
```bash
# any static server works
python3 -m http.server 8000
# open http://localhost:8000
```

## 🔮 Upgrade Path (post-MVP)
1. Replace `DB` object in `js/app.js` with Supabase/Firebase calls
2. Move admin auth to real backend sessions
3. Add image uploads, reviews, in-app chat

---
Built with ❤️ in Jaffna
