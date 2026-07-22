/* =========================================================
   Jaffna Freelance Connect — MVP SPA
   Data layer: localStorage (swap with Firebase/Supabase later)
   ========================================================= */

/* ---------------- Data Layer ---------------- */
const DB = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem('jfc_' + key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem('jfc_' + key, JSON.stringify(val)); }
};

// Simple hash (demo-grade; use real backend hashing in production)
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return 'h' + h.toString(36);
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------------- Seed Data ---------------- */
function seed() {
  if (DB.get('seeded')) return;
  const now = Date.now();
  DB.set('users', [
    { id: 'admin1', name: 'Site Admin', email: 'admin@jaffnafreelance.lk', pass: hash('admin123'), role: 'admin', created: now }
  ]);
  DB.set('jobs', [
    { id: uid(), title: 'Logo Design for Jaffna Café', desc: 'Need a modern, minimal logo for a new café opening near Nallur. Should reflect local culture with a modern twist. Deliverables: logo files (PNG/SVG) + simple brand colours.', budget: 15000, location: 'Nallur, Jaffna', contact: '0771234567', category: 'Graphic Design', status: 'approved', badges: ['verified'], postedBy: 'guest', created: now - 86400000 },
    { id: uid(), title: 'Tamil–English Document Typing', desc: 'Around 60 pages of handwritten Tamil notes need to be typed in both Tamil and English (Word format). Accuracy is important. Flexible deadline of 2 weeks.', budget: 8000, location: 'Jaffna Town', contact: '0759876543', category: 'Typing / Data Entry', status: 'approved', badges: ['new'], postedBy: 'guest', created: now - 43200000 },
    { id: uid(), title: 'Maths Tutor for A/L Student', desc: 'Looking for an experienced Combined Maths tutor for my son (2027 A/L). 2 sessions per week, home visit preferred around Kokuvil area.', budget: 12000, location: 'Kokuvil, Jaffna', contact: '0712223344', category: 'Tutoring', status: 'approved', badges: ['verified', 'new'], postedBy: 'guest', created: now - 7200000 },
    { id: uid(), title: 'Wedding Photography — 1 Day Event', desc: 'Need a photographer for a wedding at a Jaffna hotel in August. Full-day coverage, edited photos + highlight album. Please share portfolio when contacting.', budget: 45000, location: 'Jaffna', contact: '0761112233', category: 'Photography', status: 'approved', badges: [], postedBy: 'guest', created: now - 172800000 },
    { id: uid(), title: 'Small Business Website (5 pages)', desc: 'Hardware shop needs a simple website: home, products, about, gallery, contact. Mobile friendly. Content will be provided in Tamil and English.', budget: 35000, location: 'Chunnakam, Jaffna', contact: '0773334455', category: 'Web Development', status: 'pending', badges: [], postedBy: 'guest', created: now - 3600000 }
  ]);
  DB.set('services', [
    { id: uid(), name: 'Kavitha Sivakumar', skills: ['Graphic Design', 'Logo Design', 'Flyers'], level: 'Expert', desc: '5+ years designing logos, flyers and social media posts for Jaffna businesses. Fast delivery, unlimited revisions until you are happy.', rate: 2500, contact: '0771230001', status: 'approved', badges: ['verified', 'top'], rating: 4.9, reviews: 27, created: now - 259200000 },
    { id: uid(), name: 'Aravinth Raj', skills: ['Web Development', 'React', 'WordPress'], level: 'Intermediate', desc: 'Frontend developer building fast, mobile-friendly websites for local shops and startups. I also maintain and update existing sites.', rate: 4000, contact: '0759870002', status: 'approved', badges: ['verified'], rating: 4.7, reviews: 14, created: now - 172800000 },
    { id: uid(), name: 'Nilani Tharmarajah', skills: ['Tutoring', 'English', 'IELTS'], level: 'Expert', desc: 'English teacher with 8 years of experience. IELTS / spoken English classes online or in person around Jaffna town. Group discounts available.', rate: 1500, contact: '0712340003', status: 'approved', badges: ['top'], rating: 5.0, reviews: 41, created: now - 604800000 },
    { id: uid(), name: 'Suthan Krishnan', skills: ['Typing', 'Data Entry', 'Translation'], level: 'Beginner', desc: 'Fast and accurate Tamil/English typing and translation. Available for document work, data entry and transcription at student-friendly prices.', rate: 800, contact: '0768880004', status: 'approved', badges: ['new'], rating: 4.5, reviews: 6, created: now - 86400000 },
    { id: uid(), name: 'Mathura Ganesh', skills: ['Photography', 'Video Editing'], level: 'Intermediate', desc: 'Event photographer and video editor. Weddings, birthdays, product shoots. Own equipment with drone coverage available.', rate: 5000, contact: '0774440005', status: 'pending', badges: [], rating: 0, reviews: 0, created: now - 1800000 }
  ]);
  DB.set('seeded', true);
}

/* ---------------- Auth ---------------- */
const Auth = {
  current() { return DB.get('session', null); },
  login(email, pass) {
    const u = DB.get('users', []).find(x => x.email === email.toLowerCase().trim() && x.pass === hash(pass));
    if (!u) return null;
    const sess = { id: u.id, name: u.name, email: u.email, role: u.role };
    DB.set('session', sess);
    return sess;
  },
  register(name, email, pass) {
    const users = DB.get('users', []);
    email = email.toLowerCase().trim();
    if (users.some(u => u.email === email)) return { error: 'Email already registered.' };
    const u = { id: uid(), name: name.trim(), email, pass: hash(pass), role: 'user', created: Date.now() };
    users.push(u); DB.set('users', users);
    const sess = { id: u.id, name: u.name, email: u.email, role: u.role };
    DB.set('session', sess);
    return { user: sess };
  },
  logout() { localStorage.removeItem('jfc_session'); renderNav(); go('/'); toast('Logged out. See you soon!'); }
};

/* ---------------- Spam guard ---------------- */
function spamCheck() {
  const last = DB.get('lastPost', 0);
  if (Date.now() - last < 60000) return false; // 1 post per minute
  return true;
}
function markPost() { DB.set('lastPost', Date.now()); }

/* ---------------- Helpers ---------------- */
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.className = 'toast show ' + type;
  t.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${esc(msg)}`;
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3200);
}
const fmtLKR = n => 'Rs ' + Number(n).toLocaleString('en-LK');
function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 3600) return Math.max(1, Math.floor(s / 60)) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
function initials(name) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }
function starHTML(r) {
  let h = '';
  for (let i = 1; i <= 5; i++) h += `<i class="fa-solid fa-star ${i <= Math.round(r) ? '' : 'muted'}"></i>`;
  return h;
}
function badgeHTML(b) {
  const map = { verified: ['badge-verified', 'fa-circle-check', 'Verified'], new: ['badge-new', 'fa-bolt', 'New'], top: ['badge-top', 'fa-medal', 'Top Skill'] };
  const m = map[b]; if (!m) return '';
  return `<span class="badge ${m[0]}"><i class="fa-solid ${m[1]}"></i>${m[2]}</span>`;
}
function waLink(phone, text) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '94' + p.slice(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

/* ---------------- Card renderers ---------------- */
function jobCard(j) {
  return `<div class="card fade-in">
    <div class="card-top">
      <h3>${esc(j.title)}</h3>
      <div>${(j.badges || []).map(badgeHTML).join(' ')}</div>
    </div>
    <div class="card-meta">
      <span><i class="fa-solid fa-tag"></i>${esc(j.category)}</span>
      <span><i class="fa-solid fa-location-dot"></i>${esc(j.location)}</span>
      <span><i class="fa-regular fa-clock"></i>${timeAgo(j.created)}</span>
    </div>
    <p class="desc">${esc(j.desc)}</p>
    <div class="card-foot">
      <div class="price">${fmtLKR(j.budget)}<br><small>Budget</small></div>
      <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waLink(j.contact, 'Hi! I saw your job "' + j.title + '" on Jaffna Freelance Connect.')}"><i class="fa-brands fa-whatsapp"></i> Contact</a>
    </div>
  </div>`;
}
function serviceCard(s) {
  return `<div class="card f-card fade-in">
    <div class="f-avatar">${esc(initials(s.name))}</div>
    <div>${(s.badges || []).map(badgeHTML).join(' ')}</div>
    <h3 style="margin-top:8px">${esc(s.name)}</h3>
    <span class="badge badge-level" style="margin-top:6px"><i class="fa-solid fa-signal"></i>${esc(s.level)}</span>
    <div class="skill-tags">${s.skills.map(k => `<span class="skill-tag">${esc(k)}</span>`).join('')}</div>
    ${s.reviews ? `<div class="stars">${starHTML(s.rating)} <span style="color:var(--ink-3);font-size:.8rem;letter-spacing:0">${s.rating} (${s.reviews})</span></div>` : '<div class="stars" style="color:var(--ink-3);font-size:.8rem;letter-spacing:0">No reviews yet</div>'}
    <p class="desc" style="text-align:center">${esc(s.desc)}</p>
    <div class="card-foot" style="width:100%">
      <div class="price">${fmtLKR(s.rate)}<br><small>per hour / task</small></div>
      <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waLink(s.contact, 'Hi ' + s.name + '! I found your profile on Jaffna Freelance Connect.')}"><i class="fa-brands fa-whatsapp"></i> Hire Me</a>
    </div>
  </div>`;
}

/* ---------------- Pages ---------------- */
const Pages = {};

Pages.home = () => {
  const jobs = DB.get('jobs', []).filter(j => j.status === 'approved').sort((a, b) => b.created - a.created).slice(0, 3);
  const svcs = DB.get('services', []).filter(s => s.status === 'approved').sort((a, b) => b.created - a.created).slice(0, 3);
  return `
  <section class="hero">
    <div class="container hero-inner">
      <span class="eyebrow"><i class="fa-solid fa-location-dot"></i> Proudly serving Jaffna, Sri Lanka</span>
      <h1>Find Local Talent.<br>Get Work Done — <span class="hl">the Jaffna Way.</span></h1>
      <p>Jaffna Freelance Connect links skilled locals with people who need work done. Post a job, offer your skills, and grow together.</p>
      <div class="hero-cta">
        <a href="#/post-job" class="btn btn-white"><i class="fa-solid fa-briefcase"></i> I Need a Worker</a>
        <a href="#/offer-service" class="btn btn-trans"><i class="fa-solid fa-hand-sparkles"></i> I Can Work</a>
      </div>
      <div class="hero-stats">
        <div class="stat"><b>${DB.get('jobs', []).filter(j => j.status === 'approved').length}+</b><i>Active Jobs</i></div>
        <div class="stat"><b>${DB.get('services', []).filter(s => s.status === 'approved').length}+</b><i>Freelancers</i></div>
        <div class="stat"><b>100%</b><i>Local & Free</i></div>
      </div>
    </div>
  </section>

  <section class="section container">
    <div class="section-head">
      <div><h2>🔥 Latest Jobs</h2><p>Fresh opportunities posted by people in Jaffna</p></div>
      <a class="link-more" href="#/jobs">Browse all jobs <i class="fa-solid fa-arrow-right"></i></a>
    </div>
    <div class="grid grid-3">${jobs.map(jobCard).join('') || '<div class="empty"><i class="fa-solid fa-inbox"></i>No jobs yet — be the first to post!</div>'}</div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="section-head">
      <div><h2>⭐ Featured Freelancers</h2><p>Talented locals ready to work</p></div>
      <a class="link-more" href="#/freelancers">See all freelancers <i class="fa-solid fa-arrow-right"></i></a>
    </div>
    <div class="grid grid-3">${svcs.map(serviceCard).join('') || '<div class="empty"><i class="fa-solid fa-inbox"></i>No freelancers yet.</div>'}</div>
  </section>

  <section class="section container" style="padding-top:0">
    <div class="section-head"><div><h2>How It Works</h2><p>Simple, fast and free</p></div></div>
    <div class="steps">
      <div class="step"><div class="ico"><i class="fa-solid fa-user-plus"></i></div><h3>1. Register Free</h3><p>Create your account in under a minute — no fees, ever.</p></div>
      <div class="step"><div class="ico"><i class="fa-solid fa-pen-to-square"></i></div><h3>2. Post or Offer</h3><p>Post a job you need done, or list the skills you offer.</p></div>
      <div class="step"><div class="ico"><i class="fa-solid fa-shield-halved"></i></div><h3>3. Admin Approves</h3><p>Every post is reviewed to keep the platform spam-free.</p></div>
      <div class="step"><div class="ico"><i class="fa-brands fa-whatsapp"></i></div><h3>4. Connect & Work</h3><p>Chat directly on WhatsApp and get the job done.</p></div>
    </div>
  </section>

  <section class="section container">
    <div class="cta-banner">
      <h2>Ready to grow with Jaffna?</h2>
      <p>Join the community connecting local talent with local needs.</p>
      <a href="#/login" class="btn btn-white" style="background:#fff;color:var(--primary)"><i class="fa-solid fa-rocket"></i> Get Started Free</a>
    </div>
  </section>`;
};

Pages.jobs = () => {
  return `
  <div class="page-head"><div class="container"><h1><i class="fa-solid fa-briefcase" style="color:var(--primary)"></i> Browse Jobs</h1><p>Find work opportunities across Jaffna</p></div></div>
  <div class="container" style="padding-bottom:64px">
    <div class="filter-bar">
      <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="jSearch" placeholder="Search jobs, skills, keywords…"></div>
      <select id="jCat"><option value="">All Categories</option>${CATS.map(c => `<option>${c}</option>`).join('')}</select>
      <select id="jBudget"><option value="">Any Budget</option><option value="0-10000">Under Rs 10,000</option><option value="10000-30000">Rs 10,000 – 30,000</option><option value="30000-999999999">Over Rs 30,000</option></select>
    </div>
    <div class="grid grid-3" id="jobGrid"></div>
  </div>`;
};

Pages.freelancers = () => {
  return `
  <div class="page-head"><div class="container"><h1><i class="fa-solid fa-users" style="color:var(--primary)"></i> Browse Freelancers</h1><p>Hire skilled locals for any task</p></div></div>
  <div class="container" style="padding-bottom:64px">
    <div class="filter-bar">
      <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="fSearch" placeholder="Search by name or skill…"></div>
      <select id="fLevel"><option value="">Any Level</option><option>Beginner</option><option>Intermediate</option><option>Expert</option></select>
      <select id="fRate"><option value="">Any Rate</option><option value="0-1500">Under Rs 1,500</option><option value="1500-4000">Rs 1,500 – 4,000</option><option value="4000-999999999">Over Rs 4,000</option></select>
    </div>
    <div class="grid grid-3" id="fGrid"></div>
  </div>`;
};

const CATS = ['Graphic Design', 'Web Development', 'Typing / Data Entry', 'Tutoring', 'Photography', 'Video Editing', 'Translation', 'Marketing', 'Handyman / Repair', 'Other'];

Pages['post-job'] = () => {
  const u = Auth.current();
  if (!u) return loginRequired('post a job');
  return `
  <div class="page-head"><div class="container"><h1><i class="fa-solid fa-pen-to-square" style="color:var(--primary)"></i> Post a Job</h1><p>Tell us what you need done — freelancers will reach out</p></div></div>
  <div class="container">
    <form class="form-wrap" id="jobForm">
      <div class="notice"><i class="fa-solid fa-circle-info"></i> Your post will be reviewed by our admin team before it appears publicly. This keeps the platform safe & spam-free.</div>
      <div class="form-group"><label>Job Title *</label><input name="title" required maxlength="90" placeholder="e.g. Logo design for my shop"></div>
      <div class="form-group"><label>Description *</label><textarea name="desc" required minlength="30" maxlength="1000" placeholder="Describe the work, timeline and expectations (min 30 characters)…"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Budget (LKR) *</label><input name="budget" type="number" min="500" max="10000000" required placeholder="15000"></div>
        <div class="form-group"><label>Category *</label><select name="category" required>${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Location *</label><input name="location" required value="Jaffna" placeholder="e.g. Nallur, Jaffna"></div>
        <div class="form-group"><label>Contact (Phone/WhatsApp) *</label><input name="contact" required pattern="0[0-9]{9}" placeholder="0771234567"><div class="form-hint">Sri Lankan number, e.g. 0771234567</div></div>
      </div>
      <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-paper-plane"></i> Submit for Approval</button>
    </form>
  </div>`;
};

Pages['offer-service'] = () => {
  const u = Auth.current();
  if (!u) return loginRequired('offer a service');
  return `
  <div class="page-head"><div class="container"><h1><i class="fa-solid fa-hand-sparkles" style="color:var(--primary)"></i> Offer a Service</h1><p>Create your freelancer profile and start earning</p></div></div>
  <div class="container">
    <form class="form-wrap" id="serviceForm">
      <div class="notice"><i class="fa-solid fa-circle-info"></i> Your profile will be reviewed by our admin team before appearing publicly.</div>
      <div class="form-group"><label>Your Name *</label><input name="name" required maxlength="60" value="${esc(u.name)}"></div>
      <div class="form-group"><label>Skills * <span class="form-hint" style="display:inline">(comma separated)</span></label><input name="skills" required placeholder="e.g. Graphic Design, Logo Design, Flyers"></div>
      <div class="form-group"><label>About You / Your Service *</label><textarea name="desc" required minlength="30" maxlength="800" placeholder="Describe your experience and what you offer (min 30 characters)…"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Experience Level *</label><select name="level" required><option>Beginner</option><option>Intermediate</option><option>Expert</option></select></div>
        <div class="form-group"><label>Rate (LKR per hour/task) *</label><input name="rate" type="number" min="100" max="1000000" required placeholder="2500"></div>
      </div>
      <div class="form-group"><label>Contact (Phone/WhatsApp) *</label><input name="contact" required pattern="0[0-9]{9}" placeholder="0771234567"><div class="form-hint">Sri Lankan number, e.g. 0771234567</div></div>
      <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-paper-plane"></i> Submit for Approval</button>
    </form>
  </div>`;
};

function loginRequired(action) {
  return `<div class="container"><div class="auth-wrap" style="text-align:center">
    <div style="font-size:2.6rem;margin-bottom:12px">🔒</div>
    <h2>Login Required</h2>
    <p class="sub">Please login or create a free account to ${action}.</p>
    <a href="#/login" class="btn btn-primary btn-block"><i class="fa-solid fa-right-to-bracket"></i> Login / Register</a>
  </div></div>`;
}

Pages.login = () => {
  if (Auth.current()) { setTimeout(() => go('/'), 0); return ''; }
  return `
  <div class="container">
    <div class="auth-wrap">
      <h2>Welcome 👋</h2>
      <p class="sub">Login or create your free account</p>
      <div class="auth-tabs">
        <button class="active" data-tab="login">Login</button>
        <button data-tab="register">Register</button>
      </div>
      <form id="loginForm">
        <div class="form-group"><label>Email</label><input name="email" type="email" required placeholder="you@example.com"></div>
        <div class="form-group"><label>Password</label><input name="pass" type="password" required minlength="6" placeholder="••••••••"></div>
        <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-right-to-bracket"></i> Login</button>
        <p class="form-hint" style="text-align:center;margin-top:14px">Admin demo: admin@jaffnafreelance.lk / admin123</p>
      </form>
      <form id="registerForm" style="display:none">
        <div class="form-group"><label>Full Name</label><input name="name" required maxlength="60" placeholder="Your name"></div>
        <div class="form-group"><label>Email</label><input name="email" type="email" required placeholder="you@example.com"></div>
        <div class="form-group"><label>Password</label><input name="pass" type="password" required minlength="6" placeholder="Min 6 characters"></div>
        <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-user-plus"></i> Create Free Account</button>
      </form>
    </div>
  </div>`;
};

Pages.admin = () => {
  const u = Auth.current();
  if (!u || u.role !== 'admin') {
    return `<div class="container"><div class="auth-wrap">
      <h2 style="text-align:center">🛡️ Admin Login</h2>
      <p class="sub">Restricted area — administrators only</p>
      <form id="adminLoginForm">
        <div class="form-group"><label>Admin Email</label><input name="email" type="email" required placeholder="admin@jaffnafreelance.lk"></div>
        <div class="form-group"><label>Password</label><input name="pass" type="password" required placeholder="••••••••"></div>
        <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-shield-halved"></i> Login as Admin</button>
      </form>
    </div></div>`;
  }
  return `<div class="page-head"><div class="container"><h1><i class="fa-solid fa-gauge-high" style="color:var(--primary)"></i> Admin Dashboard</h1><p>Manage submissions — approve, reject or delete posts</p></div></div>
  <div class="container" style="padding-bottom:64px">
    <div class="admin-stats" id="adminStats"></div>
    <div class="admin-tabs">
      <button class="active" data-atab="pending">⏳ Pending</button>
      <button data-atab="jobs">💼 All Jobs</button>
      <button data-atab="services">🧑‍💻 All Services</button>
      <button data-atab="users">👥 Users</button>
    </div>
    <div id="adminContent"></div>
  </div>`;
};

/* ---------------- Admin rendering ---------------- */
function renderAdminStats() {
  const jobs = DB.get('jobs', []), svcs = DB.get('services', []), users = DB.get('users', []);
  const pending = jobs.filter(j => j.status === 'pending').length + svcs.filter(s => s.status === 'pending').length;
  document.getElementById('adminStats').innerHTML = `
    <div class="stat-card"><div class="ico" style="background:var(--accent-light);color:#b45309"><i class="fa-solid fa-hourglass-half"></i></div><div><b>${pending}</b><span>Pending Approval</span></div></div>
    <div class="stat-card"><div class="ico" style="background:var(--primary-light);color:var(--primary)"><i class="fa-solid fa-briefcase"></i></div><div><b>${jobs.length}</b><span>Total Jobs</span></div></div>
    <div class="stat-card"><div class="ico" style="background:var(--blue-light);color:#1d4ed8"><i class="fa-solid fa-users"></i></div><div><b>${svcs.length}</b><span>Total Services</span></div></div>
    <div class="stat-card"><div class="ico" style="background:var(--green-light);color:#047857"><i class="fa-solid fa-user-check"></i></div><div><b>${users.length}</b><span>Registered Users</span></div></div>`;
}

function adminRow(item, type) {
  const isJob = type === 'job';
  const title = isJob ? item.title : item.name + ' — ' + item.skills.join(', ');
  const sub = isJob
    ? `${esc(item.category)} · ${fmtLKR(item.budget)} · ${esc(item.location)} · 📞 ${esc(item.contact)}`
    : `${esc(item.level)} · ${fmtLKR(item.rate)}/hr · 📞 ${esc(item.contact)}`;
  return `<div class="admin-row">
    <div class="info">
      <h4>${esc(title)} <span class="badge badge-${item.status}">${item.status}</span></h4>
      <p>${sub}</p>
      <p style="margin-top:4px">${esc(item.desc.slice(0, 140))}${item.desc.length > 140 ? '…' : ''}</p>
    </div>
    <div class="actions">
      ${item.status !== 'approved' ? `<button class="btn btn-green btn-sm" data-act="approve" data-type="${type}" data-id="${item.id}"><i class="fa-solid fa-check"></i> Approve</button>` : ''}
      ${item.status !== 'rejected' ? `<button class="btn btn-outline btn-sm" data-act="reject" data-type="${type}" data-id="${item.id}"><i class="fa-solid fa-xmark"></i> Reject</button>` : ''}
      <button class="btn btn-red btn-sm" data-act="delete" data-type="${type}" data-id="${item.id}"><i class="fa-solid fa-trash"></i> Delete</button>
    </div>
  </div>`;
}

function renderAdminTab(tab) {
  const el = document.getElementById('adminContent');
  const jobs = DB.get('jobs', []).sort((a, b) => b.created - a.created);
  const svcs = DB.get('services', []).sort((a, b) => b.created - a.created);
  let html = '';
  if (tab === 'pending') {
    const rows = [...jobs.filter(j => j.status === 'pending').map(j => adminRow(j, 'job')),
                  ...svcs.filter(s => s.status === 'pending').map(s => adminRow(s, 'service'))];
    html = rows.length ? `<div class="admin-table">${rows.join('')}</div>` : `<div class="empty"><i class="fa-solid fa-circle-check"></i>All caught up! No pending submissions.</div>`;
  } else if (tab === 'jobs') {
    html = jobs.length ? `<div class="admin-table">${jobs.map(j => adminRow(j, 'job')).join('')}</div>` : `<div class="empty"><i class="fa-solid fa-inbox"></i>No jobs.</div>`;
  } else if (tab === 'services') {
    html = svcs.length ? `<div class="admin-table">${svcs.map(s => adminRow(s, 'service')).join('')}</div>` : `<div class="empty"><i class="fa-solid fa-inbox"></i>No services.</div>`;
  } else if (tab === 'users') {
    const users = DB.get('users', []);
    html = `<div class="admin-table">${users.map(u => `<div class="admin-row"><div class="info"><h4>${esc(u.name)} ${u.role === 'admin' ? '<span class="badge badge-top">Admin</span>' : ''}</h4><p>${esc(u.email)} · joined ${new Date(u.created).toLocaleDateString()}</p></div></div>`).join('')}</div>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('[data-act]').forEach(btn => {
    btn.onclick = () => {
      const { act, type, id } = btn.dataset;
      const key = type === 'job' ? 'jobs' : 'services';
      let list = DB.get(key, []);
      if (act === 'delete') {
        if (!confirm('Delete this post permanently?')) return;
        list = list.filter(x => x.id !== id);
        toast('Post deleted.', 'success');
      } else {
        const item = list.find(x => x.id === id);
        if (item) item.status = act === 'approve' ? 'approved' : 'rejected';
        toast(act === 'approve' ? 'Post approved & now public! ✅' : 'Post rejected.');
      }
      DB.set(key, list);
      renderAdminStats();
      renderAdminTab(document.querySelector('.admin-tabs button.active').dataset.atab);
    };
  });
}

/* ---------------- Page wiring ---------------- */
function wire(route) {
  // Jobs filtering
  if (route === 'jobs') {
    const render = () => {
      const q = document.getElementById('jSearch').value.toLowerCase();
      const cat = document.getElementById('jCat').value;
      const bud = document.getElementById('jBudget').value;
      let list = DB.get('jobs', []).filter(j => j.status === 'approved');
      if (q) list = list.filter(j => (j.title + j.desc + j.category).toLowerCase().includes(q));
      if (cat) list = list.filter(j => j.category === cat);
      if (bud) { const [lo, hi] = bud.split('-').map(Number); list = list.filter(j => j.budget >= lo && j.budget <= hi); }
      list.sort((a, b) => b.created - a.created);
      document.getElementById('jobGrid').innerHTML = list.map(jobCard).join('') || `<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-magnifying-glass"></i>No jobs match your filters.</div>`;
    };
    ['jSearch', 'jCat', 'jBudget'].forEach(id => document.getElementById(id).addEventListener('input', render));
    render();
  }
  // Freelancers filtering
  if (route === 'freelancers') {
    const render = () => {
      const q = document.getElementById('fSearch').value.toLowerCase();
      const lvl = document.getElementById('fLevel').value;
      const rate = document.getElementById('fRate').value;
      let list = DB.get('services', []).filter(s => s.status === 'approved');
      if (q) list = list.filter(s => (s.name + s.desc + s.skills.join(' ')).toLowerCase().includes(q));
      if (lvl) list = list.filter(s => s.level === lvl);
      if (rate) { const [lo, hi] = rate.split('-').map(Number); list = list.filter(s => s.rate >= lo && s.rate <= hi); }
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      document.getElementById('fGrid').innerHTML = list.map(serviceCard).join('') || `<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-magnifying-glass"></i>No freelancers match your filters.</div>`;
    };
    ['fSearch', 'fLevel', 'fRate'].forEach(id => document.getElementById(id).addEventListener('input', render));
    render();
  }
  // Job form
  const jf = document.getElementById('jobForm');
  if (jf) jf.onsubmit = e => {
    e.preventDefault();
    if (!spamCheck()) return toast('Please wait a minute before posting again (spam protection).', 'error');
    const f = new FormData(jf);
    const jobs = DB.get('jobs', []);
    jobs.push({ id: uid(), title: f.get('title').trim(), desc: f.get('desc').trim(), budget: Number(f.get('budget')), location: f.get('location').trim(), contact: f.get('contact').trim(), category: f.get('category'), status: 'pending', badges: ['new'], postedBy: Auth.current().id, created: Date.now() });
    DB.set('jobs', jobs); markPost();
    toast('Job submitted! It will appear once approved by admin. 🎉');
    go('/jobs');
  };
  // Service form
  const sf = document.getElementById('serviceForm');
  if (sf) sf.onsubmit = e => {
    e.preventDefault();
    if (!spamCheck()) return toast('Please wait a minute before posting again (spam protection).', 'error');
    const f = new FormData(sf);
    const svcs = DB.get('services', []);
    svcs.push({ id: uid(), name: f.get('name').trim(), skills: f.get('skills').split(',').map(s => s.trim()).filter(Boolean).slice(0, 6), level: f.get('level'), desc: f.get('desc').trim(), rate: Number(f.get('rate')), contact: f.get('contact').trim(), status: 'pending', badges: ['new'], rating: 0, reviews: 0, postedBy: Auth.current().id, created: Date.now() });
    DB.set('services', svcs); markPost();
    toast('Profile submitted! It will appear once approved by admin. 🎉');
    go('/freelancers');
  };
  // Auth tabs + forms
  if (route === 'login') {
    document.querySelectorAll('.auth-tabs button').forEach(b => b.onclick = () => {
      document.querySelectorAll('.auth-tabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('loginForm').style.display = b.dataset.tab === 'login' ? '' : 'none';
      document.getElementById('registerForm').style.display = b.dataset.tab === 'register' ? '' : 'none';
    });
    document.getElementById('loginForm').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const s = Auth.login(f.get('email'), f.get('pass'));
      if (!s) return toast('Invalid email or password.', 'error');
      renderNav(); toast(`Welcome back, ${s.name}! 👋`);
      go(s.role === 'admin' ? '/admin' : '/');
    };
    document.getElementById('registerForm').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const r = Auth.register(f.get('name'), f.get('email'), f.get('pass'));
      if (r.error) return toast(r.error, 'error');
      renderNav(); toast(`Welcome to Jaffna Freelance Connect, ${r.user.name}! 🎉`);
      go('/');
    };
  }
  // Admin
  if (route === 'admin') {
    const alf = document.getElementById('adminLoginForm');
    if (alf) {
      alf.onsubmit = e => {
        e.preventDefault();
        const f = new FormData(alf);
        const s = Auth.login(f.get('email'), f.get('pass'));
        if (!s || s.role !== 'admin') { Auth.current()?.role !== 'admin' && localStorage.removeItem('jfc_session'); return toast('Invalid admin credentials.', 'error'); }
        renderNav(); toast('Admin logged in. 🛡️'); go('/admin');
      };
    } else {
      renderAdminStats();
      renderAdminTab('pending');
      document.querySelectorAll('.admin-tabs button').forEach(b => b.onclick = () => {
        document.querySelectorAll('.admin-tabs button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderAdminTab(b.dataset.atab);
      });
    }
  }
}

/* ---------------- Router ---------------- */
function route() {
  const path = (location.hash.slice(1) || '/').replace(/^\//, '') || 'home';
  const name = path.split('?')[0] || 'home';
  const page = Pages[name] || Pages.home;
  const app = document.getElementById('app');
  app.innerHTML = page();
  document.querySelectorAll('.nav-links a[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === name));
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo(0, 0);
  wire(name);
}
function go(path) { location.hash = '#' + path; }

/* ---------------- Nav ---------------- */
function renderNav() {
  const u = Auth.current();
  const el = document.getElementById('navAuth');
  if (u) {
    el.innerHTML = `<span class="nav-user">
      ${u.role === 'admin' ? '<a href="#/admin" class="btn btn-ghost btn-sm"><i class="fa-solid fa-shield-halved"></i> Admin</a>' : ''}
      <span class="avatar-chip" title="${esc(u.name)}">${esc(initials(u.name))}</span>
      <button class="btn btn-outline btn-sm" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i></button>
    </span>`;
    document.getElementById('logoutBtn').onclick = () => Auth.logout();
  } else {
    el.innerHTML = `<a href="#/login" class="btn btn-primary btn-sm" style="margin-left:8px"><i class="fa-solid fa-right-to-bracket"></i> Login</a>`;
  }
}

/* ---------------- Init ---------------- */
seed();
renderNav();
window.addEventListener('hashchange', route);
document.getElementById('navToggle').onclick = () => document.getElementById('navLinks').classList.toggle('open');
route();
