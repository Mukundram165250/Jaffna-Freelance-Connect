/* VibeWorkers — Work Globally. Connect Freely. | Created by Mukundram (@revolutionary_scout) */
const API_BASE = (window.JFC_API_URL || '/api').replace(/\/$/, '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const CURRENCIES = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound' },
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  LKR: { symbol: 'Rs', code: 'LKR', name: 'Sri Lankan Rupee' },
  CAD: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  AED: { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  SGD: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' }
};

function fmtCurrency(amount, cur = 'USD') {
  if (amount === null || amount === undefined || amount === '') return 'Budget flexible';
  const c = String(cur || 'USD').toUpperCase();
  const meta = CURRENCIES[c] || { symbol: '', code: c };
  const num = Number(amount);
  if (isNaN(num)) return `${c} ${amount}`;
  const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${meta.code} ${meta.symbol}${formatted}`.trim();
}
const fmtLKR = (n, cur = 'LKR') => fmtCurrency(n, cur);

const initials = name => String(name || '?').split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase();
const timeAgo = ts => {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 3600) return Math.max(1, Math.floor(s/60)) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
};

const CATS = [
  'Web & Software Development',
  'Design & Creative',
  'Writing & Translation',
  'Digital Marketing & SEO',
  'Video & Animation',
  'AI & Data Science',
  'Virtual Assistance & Admin',
  'Business & Consulting',
  'Engineering & Architecture',
  'Other Global Services'
];

const COUNTRIES = [
  { code: 'GLOBAL', name: '🌐 Global / Remote' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'LK', name: '🇱🇰 Sri Lanka' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'AE', name: '🇦🇪 United Arab Emirates' },
  { code: 'OTHER', name: '🌍 Other International' }
];

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  try {
    const token = window.JFCAuth?.auth?.currentUser ? await window.JFCAuth.auth.currentUser.getIdToken().catch(() => null) : null;
    if (token) headers['Authorization'] = 'Bearer ' + token;
  } catch (e) {}

  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers,
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body;
}

const Auth = {
  user: null,
  async load() {
    if (window.JFCAuth?.isInitialized) {
      this.user = window.JFCAuth.currentUser;
      renderNav();
      return this.user;
    }
    try { this.user = (await api('/auth/me')).data.user; }
    catch { this.user = window.JFCAuth?.currentUser || null; }
    renderNav();
    return this.user;
  },
  async login(email, password) {
    if (window.JFCAuth) {
      this.user = await window.JFCAuth.login(email, password);
      renderNav();
      return this.user;
    }
    const r = await api('/auth/login', { method:'POST', body:JSON.stringify({email,password}) });
    this.user = r.data.user; renderNav(); return this.user;
  },
  async register(displayName, email, password, role, phone = "", country = "GLOBAL") {
    if (window.JFCAuth) {
      this.user = await window.JFCAuth.register(displayName, email, password, role, phone, country);
      renderNav();
      return this.user;
    }
    const r = await api('/auth/register', { method:'POST', body:JSON.stringify({displayName,email,confirmEmail:email,password,role,phone,country}) });
    this.user = r.data.user; renderNav(); return this.user;
  },
  async loginWithGoogle() {
    if (window.JFCAuth) {
      this.user = await window.JFCAuth.loginWithGoogle();
      renderNav();
      return this.user;
    }
    throw new Error('Google Sign-In requires Firebase configuration.');
  },
  async logout() {
    if (window.JFCAuth) {
      await window.JFCAuth.logout().catch(console.warn);
    }
    await api('/auth/logout', {method:'POST'}).catch(()=>{});
    this.user = null; renderNav(); go('/');
  }
};

// Wire Firebase Auth state changes
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (window.JFCAuth) {
      window.JFCAuth.onAuthChanged((u) => {
        Auth.user = u;
        renderNav();
      });
    }
  });
}

function toast(msg, type='success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = 'toast show ' + type;
  t.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + esc(msg);
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

let _confettiActive = false;
function triggerConfetti(duration = 3400) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.display = 'block';
  ctx.scale(dpr, dpr);

  const colors = ['#7c3aed', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#fbbf24', '#ffffff'];
  const particleCount = Math.min(Math.floor(width / 14), 85);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const isLeft = i % 2 === 0;
    const originX = isLeft ? width * 0.18 : width * 0.82;
    const originY = height * 0.92;
    const angle = isLeft ? (Math.PI / 4) + (Math.random() * 0.35 - 0.17) : (3 * Math.PI / 4) + (Math.random() * 0.35 - 0.17);
    const speed = 11 + Math.random() * 11;

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed * (isLeft ? 1 : -1),
      vy: -Math.abs(Math.sin(angle) * speed) - (2 + Math.random() * 4),
      w: 6 + Math.random() * 7,
      h: 4 + Math.random() * 9,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.05 + Math.random() * 0.08,
      opacity: 1,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
      gravity: 0.28 + Math.random() * 0.12
    });
  }

  const startTime = Date.now();
  _confettiActive = true;

  function render() {
    if (!_confettiActive) return;
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, width, height);
    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.986;
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      if (elapsed > duration * 0.55) {
        p.opacity = Math.max(0, 1 - (elapsed - duration * 0.55) / (duration * 0.45));
      }

      if (p.opacity > 0 && p.y < height + 60) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.cos(p.wobble), 1);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (activeCount > 0 && elapsed < duration) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      canvas.style.display = 'none';
      _confettiActive = false;
    }
  }

  requestAnimationFrame(render);
}

function celebrate({ title, sub, icon = '🎉' }) {
  triggerConfetti(3600);
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = 'toast show celebration';
  t.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div style="text-align:left">
      <b style="font-size:0.95rem;display:block;line-height:1.25">${esc(title)}</b>
      ${sub ? `<span style="font-size:0.83rem;opacity:0.92;font-weight:400;display:block;margin-top:2px">${esc(sub)}</span>` : ''}
    </div>
  `;
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 4400);
}
function loginRequired(action) {
  return '<div class="container"><div class="auth-wrap" style="text-align:center"><div style="font-size:2.6rem;margin-bottom:12px">🔒</div><h2>Login Required</h2><p class="sub">Please login or create a free account to ' + esc(action) + '.</p><a href="#/login" class="btn btn-primary btn-block">Login / Register</a></div></div>';
}
function badge(text, cls='badge-new') { return '<span class="badge '+cls+'">'+esc(text)+'</span>'; }

function jobCard(j) {
  const cur = j.currency || 'USD';
  const budget = (j.budgetMin || j.budgetMax)
    ? (j.budgetMin && j.budgetMax ? fmtCurrency(j.budgetMin, cur) + ' – ' + fmtCurrency(j.budgetMax, cur) : fmtCurrency(j.budgetMin || j.budgetMax, cur))
    : 'Budget flexible';
  const workplace = j.workplaceType === 'REMOTE' ? '🌐 Remote (Worldwide)' : (j.workplaceType === 'HYBRID' ? '🏢 Hybrid' : '📍 ' + (j.location || 'On-site'));
  return '<div class="card fade-in"><div class="card-top"><h3>'+esc(j.title)+'</h3>'+badge(j.status || 'OPEN','badge-verified')+'</div><div class="card-meta"><span><i class="fa-solid fa-tag"></i>'+esc(j.category || 'General')+'</span><span><i class="fa-solid fa-earth-americas"></i>'+esc(workplace)+'</span><span><i class="fa-regular fa-clock"></i>'+timeAgo(j.createdAt)+'</span></div><p class="desc">'+esc(j.description)+'</p><div class="card-foot"><div class="price">'+budget+'<br><small>Explicit Budget ('+cur+')</small></div><a class="btn btn-primary btn-sm" href="#/job/'+encodeURIComponent(j.id)+'">View Job</a></div></div>';
}

function freelancerCard(f) {
  const p = f.freelancerProfile || {};
  const cur = p.hourlyCurrency || 'USD';
  const rate = p.hourlyRate ? fmtCurrency(p.hourlyRate, cur) + '<br><small>per hour</small>' : 'Flexible<br><small>negotiable</small>';
  const locationLabel = p.country || f.location || f.country || 'Global';
  return '<div class="card f-card fade-in"><div class="f-avatar">'+esc(initials(f.displayName))+'</div>'+badge(p.experienceLevel || 'BEGINNER','badge-level')+'<h3 style="margin-top:8px">'+esc(f.displayName)+'</h3><p style="color:var(--ink-3)">'+esc(p.headline || 'Independent Professional')+' · <span><i class="fa-solid fa-globe"></i> '+esc(locationLabel)+'</span></p><div class="skill-tags">'+(p.skills||[]).map(x=>'<span class="skill-tag">'+esc(x)+'</span>').join('')+'</div><p class="desc" style="text-align:center">'+esc(p.bio || 'Available for global freelance and remote opportunities.')+'</p><div class="card-foot" style="width:100%"><div class="price">'+rate+'</div><a class="btn btn-primary btn-sm" href="#/freelancer/'+encodeURIComponent(f.id)+'">View Profile</a></div></div>';
}

const Pages = {};

Pages.home = async () => {
  let jobs=[], freelancers=[];
  try {
    jobs=(await api('/jobs?limit=3')).data.jobs;
    freelancers=(await api('/profile/freelancers')).data?.profiles || [];
  } catch {}
  return `
    <section class="hero">
      <div class="container hero-inner">
        <span class="eyebrow"><i class="fa-solid fa-globe"></i> Global Freelance Marketplace</span>
        <h1>Hire World-Class Talent.<br>Work Anywhere — <span class="hl">Connect Freely.</span></h1>
        <p>VibeWorkers connects skilled independent professionals, remote specialists, students, and businesses worldwide. Post projects, offer your services, and collaborate across borders.</p>
        <div class="hero-cta">
          <a href="#/post-job" class="btn btn-white"><i class="fa-solid fa-briefcase"></i> I Want to Hire</a>
          <a href="#/offer-service" class="btn btn-trans"><i class="fa-solid fa-hand-sparkles"></i> I Want to Work</a>
        </div>
        <div class="hero-stats">
          <div class="stat"><b>${jobs.length}+</b><i>Active Global Jobs</i></div>
          <div class="stat"><b>${freelancers.length}+</b><i>Worldwide Freelancers</i></div>
          <div class="stat"><b>Multi-Currency</b><i>USD · EUR · GBP · LKR</i></div>
        </div>
      </div>
    </section>

    <!-- Creator Attribution Ribbon -->
    <div class="container" style="margin-top:-24px;margin-bottom:32px;position:relative;z-index:2">
      <div style="background:#fff;border:1px solid var(--border);border-radius:14px;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:var(--shadow)">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="background:var(--grad);color:#fff;width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:bold"><i class="fa-solid fa-bolt"></i></span>
          <span style="font-weight:600;color:var(--ink-2);font-size:0.92rem">VibeWorkers — Work Globally. Connect Freely.</span>
        </div>
        <div style="font-size:0.88rem;color:var(--ink-3)">
          Created by <b>Mukundram</b> · <a href="https://www.instagram.com/revolutionary_scout/" target="_blank" rel="noopener noreferrer" style="color:var(--primary);font-weight:600"><i class="fa-brands fa-instagram"></i> Instagram: @revolutionary_scout</a>
        </div>
      </div>
    </div>

    <section class="section container">
      <div class="section-head">
        <div>
          <h2>🔥 Latest Global Opportunities</h2>
          <p>Fresh freelance & remote projects posted by clients worldwide</p>
        </div>
        <a class="link-more" href="#/jobs">Browse all jobs <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="grid grid-3">${jobs.map(jobCard).join('') || '<div class="empty">No jobs posted yet. Be the first to post!</div>'}</div>
    </section>

    <section class="section container" style="padding-top:0">
      <div class="section-head">
        <div>
          <h2>⭐ Featured Global Freelancers</h2>
          <p>Talented independent professionals ready for remote and international contracts</p>
        </div>
        <a class="link-more" href="#/freelancers">See all freelancers <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="grid grid-3">${freelancers.slice(0,3).map(freelancerCard).join('') || '<div class="empty">No approved freelancers yet.</div>'}</div>
    </section>
  `;
};

Pages.jobs = () => `
  <div class="page-head">
    <div class="container">
      <h1><i class="fa-solid fa-briefcase" style="color:var(--primary)"></i> Browse Global Jobs</h1>
      <p>Discover freelance, remote, and location-based opportunities worldwide</p>
    </div>
  </div>
  <div class="container" style="padding-bottom:64px">
    <div class="filter-bar" style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="search-box" style="flex:2;min-width:240px">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="jSearch" placeholder="Search projects, skills, keywords, countries…">
      </div>
      <select id="jCat" style="flex:1;min-width:180px">
        <option value="">All Categories</option>
        ${CATS.map(c => '<option>' + c + '</option>').join('')}
      </select>
      <select id="jWorkplace" style="flex:1;min-width:160px">
        <option value="">All Workplaces</option>
        <option value="REMOTE">🌐 Remote Only</option>
        <option value="HYBRID">🏢 Hybrid</option>
        <option value="ON_SITE">📍 On-site</option>
      </select>
    </div>
    <div class="grid grid-3" id="jobGrid"></div>
  </div>
`;

Pages.freelancers = () => `
  <div class="page-head">
    <div class="container">
      <h1><i class="fa-solid fa-users" style="color:var(--primary)"></i> Browse Global Freelancers</h1>
      <p>Hire independent talent and remote professionals from around the world</p>
    </div>
  </div>
  <div class="container" style="padding-bottom:64px">
    <div class="filter-bar" style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="search-box" style="flex:2;min-width:240px">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="fSearch" placeholder="Search by name, skill, or country…">
      </div>
      <select id="fLevel" style="flex:1;min-width:160px">
        <option value="">Any Level</option>
        <option value="BEGINNER">Beginner / Student</option>
        <option value="INTERMEDIATE">Intermediate</option>
        <option value="EXPERT">Expert</option>
      </select>
    </div>
    <div class="grid grid-3" id="fGrid"></div>
  </div>
`;

Pages['post-job'] = () => {
  if (!Auth.user) return loginRequired('post a job');
  if (!['CLIENT','ADMIN'].includes(Auth.user.role)) return '<div class="container"><div class="auth-wrap"><h2>Client account required</h2><p class="sub">Create a Client account to post jobs.</p><a href="#/login" class="btn btn-primary btn-block">Switch account</a></div></div>';
  return `
    <div class="page-head">
      <div class="container">
        <h1><i class="fa-solid fa-pen-to-square" style="color:var(--primary)"></i> Post a Global Job</h1>
        <p>Connect with skilled freelancers, remote specialists, and creators worldwide</p>
      </div>
    </div>
    <div class="container">
      <form class="form-wrap" id="jobForm">
        <div class="notice">
          <i class="fa-solid fa-circle-info"></i> Your job will be reviewed by platform moderation before becoming public.
        </div>
        <div class="notice" style="background:#f8fafc;border:1px solid #cbd5e1;color:#334155;margin-bottom:18px">
          <i class="fa-solid fa-user-shield" style="color:var(--primary);font-size:1.1rem"></i>
          <div>
            <b>Verified Account Protected:</b> Your verified account email and phone number are safely linked to this job. You do not need to publicly enter or expose your personal contact details.
          </div>
        </div>

        <div class="form-group">
          <label>Job Title *</label>
          <input name="title" required maxlength="160" placeholder="e.g. Modern responsive website development, Logo branding, etc.">
        </div>

        <div class="form-group">
          <label>Description *</label>
          <textarea name="description" required maxlength="5000" placeholder="Describe the scope of work, timeline, deliverables, and expectations…"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Budget Currency</label>
            <select name="currency" required>
              <option value="USD" selected>USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="LKR">LKR (Rs) — Sri Lankan Rupee</option>
              <option value="CAD">CAD (C$) — Canadian Dollar</option>
              <option value="AUD">AUD (A$) — Australian Dollar</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="SGD">SGD (S$) — Singapore Dollar</option>
            </select>
          </div>
          <div class="form-group">
            <label>Minimum Budget</label>
            <input name="budgetMin" type="number" min="0" step="0.01" placeholder="Optional min amount">
          </div>
          <div class="form-group">
            <label>Maximum Budget</label>
            <input name="budgetMax" type="number" min="0" step="0.01" placeholder="Optional max amount">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select name="category">
              <option value="">Select Category</option>
              ${CATS.map(c => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Workplace Type</label>
            <select name="workplaceType">
              <option value="REMOTE" selected>🌐 Remote (Worldwide)</option>
              <option value="HYBRID">🏢 Hybrid</option>
              <option value="ON_SITE">📍 On-site / Location</option>
            </select>
          </div>
          <div class="form-group">
            <label>Location / Country</label>
            <input name="location" value="Remote (Worldwide)" placeholder="e.g. Remote (Worldwide), London UK, Singapore">
          </div>
        </div>

        <div class="form-group">
          <label>Skills Required (comma separated)</label>
          <input name="skills" placeholder="e.g. React, TypeScript, Node.js, UI/UX Design">
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          <i class="fa-solid fa-paper-plane"></i> Submit for Approval
        </button>
      </form>
    </div>
  `;
};

Pages['offer-service'] = () => {
  if (!Auth.user) return loginRequired('offer your skills');
  if (Auth.user.role !== 'FREELANCER') return '<div class="container"><div class="auth-wrap"><h2>Freelancer account required</h2><p class="sub">Create a Freelancer account to offer services.</p><a href="#/login" class="btn btn-primary btn-block">Switch account</a></div></div>';
  return `
    <div class="page-head">
      <div class="container">
        <h1><i class="fa-solid fa-hand-sparkles" style="color:var(--primary)"></i> Offer Global Services</h1>
        <p>Create your international freelancer profile and be hired by clients worldwide</p>
      </div>
    </div>
    <div class="container">
      <form class="form-wrap" id="serviceForm">
        <div class="notice">
          <i class="fa-solid fa-circle-info"></i> Your profile will be reviewed before appearing publicly in the global directory.
        </div>

        <div class="form-group">
          <label>Professional Headline *</label>
          <input name="headline" required maxlength="160" placeholder="e.g. Full-Stack Engineer | React & Cloud Architect | Remote Specialist">
        </div>

        <div class="form-group">
          <label>Skills * (comma separated)</label>
          <input name="skills" required placeholder="Web Development, UI/UX, Python, Copywriting">
        </div>

        <div class="form-group">
          <label>About You & Experience</label>
          <textarea name="bio" maxlength="2000" placeholder="Introduce yourself, your background, projects you have completed, and what sets you apart…"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Experience Level</label>
            <select name="experienceLevel">
              <option value="BEGINNER">Beginner / Student</option>
              <option value="INTERMEDIATE" selected>Intermediate</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
          <div class="form-group">
            <label>Hourly Rate Currency</label>
            <select name="hourlyCurrency">
              <option value="USD" selected>USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="LKR">LKR (Rs)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Hourly Rate</label>
            <input name="hourlyRate" type="number" min="0" step="0.01" placeholder="e.g. 25.00">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Country / Region</label>
            <select name="country">
              ${COUNTRIES.map(c => '<option value="' + esc(c.code) + '">' + esc(c.name) + '</option>').join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Availability / Working Hours</label>
            <input name="availability" maxlength="200" placeholder="e.g. Full-time remote, 20 hrs/week, Worldwide timezones">
          </div>
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          <i class="fa-solid fa-paper-plane"></i> Save Profile
        </button>
      </form>
    </div>
  `;
};

Pages.login = () => {
  if (Auth.user) {
    return `
      <div class="container fade-in">
        <div class="auth-wrap" style="text-align:center">
          <span class="auth-badge">⚡ VibeWorkers Global</span>
          <h2>You are logged in 👋</h2>
          <p class="sub">Active account: <b>${esc(Auth.user.displayName || Auth.user.email)}</b> (${esc(Auth.user.role)})</p>
          <a href="#/" class="btn btn-primary btn-block"><i class="fa-solid fa-house"></i> Go to Marketplace</a>
          <a href="#/privacy" class="btn btn-outline btn-block" style="margin-top:10px"><i class="fa-solid fa-shield-halved"></i> Data & Privacy Settings</a>
          <button id="logoutBtnAlt" class="btn btn-outline btn-block" style="margin-top:10px"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="container fade-in">
      <div class="auth-wrap">
        <div class="auth-header">
          <span class="auth-badge">⚡ VibeWorkers Global</span>
          <h2 id="authHeading">Welcome Back 👋</h2>
          <p id="authSubheading" class="sub">Work Globally. Connect Freely. Sign in or create your account to explore worldwide opportunities</p>
        </div>

        <div class="auth-tabs" role="tablist" aria-label="Authentication tabs">
          <button type="button" class="active" id="tabLoginBtn" data-tab="login" role="tab" aria-selected="true">
            <i class="fa-solid fa-right-to-bracket"></i> Login
          </button>
          <button type="button" id="tabRegisterBtn" data-tab="register" role="tab" aria-selected="false">
            <i class="fa-solid fa-user-plus"></i> Register
          </button>
        </div>

        <div id="authAlert" class="auth-alert" style="display:none;" role="alert"></div>

        <!-- LOGIN FORM -->
        <form id="loginForm" class="auth-form" novalidate>
          <div class="form-group">
            <label for="loginEmailInput"><i class="fa-solid fa-envelope"></i> Email Address</label>
            <input id="loginEmailInput" name="email" type="email" autocomplete="email" placeholder="name@example.com" required>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="loginPasswordInput"><i class="fa-solid fa-lock"></i> Password</label>
              <a href="javascript:void(0)" class="forgot-link" id="btnForgotPass">Forgot password?</a>
            </div>
            <div class="password-input-wrap">
              <input id="loginPasswordInput" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required>
              <button type="button" class="btn-toggle-pwd" data-target="loginPasswordInput" aria-label="Toggle password visibility">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <button type="submit" id="btnLoginSubmit" class="btn btn-primary btn-block">
            <span class="btn-label"><i class="fa-solid fa-right-to-bracket"></i> Sign In</span>
          </button>

          <div class="auth-divider"><span>or continue with</span></div>

          <button type="button" id="btnGoogleAuth" class="btn btn-block btn-google">
            <i class="fa-brands fa-google"></i> Continue with Google
          </button>
        </form>

        <!-- PASSWORD RESET COMPONENT -->
        <form id="resetPasswordForm" class="auth-form" style="display:none;" novalidate>
          <div class="notice" style="margin-bottom:18px;">
            <i class="fa-solid fa-key"></i>
            Enter your registered email address and we will send a password reset link to your inbox via Firebase.
          </div>

          <div class="form-group">
            <label for="resetEmailInput"><i class="fa-solid fa-envelope"></i> Email Address</label>
            <input id="resetEmailInput" name="email" type="email" autocomplete="email" placeholder="name@example.com" required>
          </div>

          <button type="submit" id="btnResetPasswordSubmit" class="btn btn-primary btn-block">
            <span class="btn-label"><i class="fa-solid fa-paper-plane"></i> Send Password Reset Link</span>
          </button>

          <button type="button" id="btnBackToLoginFromReset" class="btn btn-block btn-outline" style="margin-top:12px;">
            <i class="fa-solid fa-arrow-left"></i> Back to Sign In
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form id="registerForm" class="auth-form" style="display:none;" novalidate>
          <div class="form-group">
            <label for="regNameInput"><i class="fa-solid fa-user"></i> Full Name</label>
            <input id="regNameInput" name="displayName" type="text" autocomplete="name" placeholder="Alex Morgan" maxlength="100" required>
          </div>

          <div class="form-group">
            <label for="regEmailInput"><i class="fa-solid fa-envelope"></i> Email Address</label>
            <input id="regEmailInput" name="email" type="email" autocomplete="email" placeholder="name@example.com" required>
          </div>

          <div class="form-group">
            <label for="regConfirmEmailInput"><i class="fa-solid fa-envelope-circle-check"></i> Confirm Email Address</label>
            <input id="regConfirmEmailInput" name="confirmEmail" type="email" autocomplete="email" placeholder="Re-enter your email to confirm" required>
          </div>

          <div class="form-group">
            <label for="regCountrySelect"><i class="fa-solid fa-globe"></i> Country / Region</label>
            <select id="regCountrySelect" name="country" required>
              ${COUNTRIES.map(c => '<option value="' + esc(c.code) + '">' + esc(c.name) + '</option>').join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="regPhoneInput"><i class="fa-solid fa-phone"></i> Phone Number</label>
            <div style="display:flex;gap:8px">
              <input id="regPhoneInput" name="phone" type="tel" autocomplete="tel" placeholder="+1 202 555 0192" required style="flex:1">
              <button type="button" id="btnSendPhoneOtp" class="btn btn-outline" style="white-space:nowrap;padding:0 14px">
                <i class="fa-solid fa-sms"></i> <span id="btnSendOtpText">Verify Phone</span>
              </button>
            </div>
            <div id="phoneVerifiedBadge" style="display:none;align-items:center;gap:6px;color:#16a34a;font-weight:600;font-size:0.86rem;margin-top:6px">
              <i class="fa-solid fa-circle-check"></i> Phone number verified
            </div>
          </div>

          <div id="phoneOtpGroup" class="form-group" style="display:none;background:#f8fafc;padding:14px;border-radius:10px;border:1px solid #cbd5e1;margin-bottom:16px;">
            <div class="label-row" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <label for="regPhoneOtpInput" style="margin:0;font-weight:600;font-size:0.88rem"><i class="fa-solid fa-key"></i> Enter 6-Digit SMS Code</label>
              <span id="phoneOtpTimer" style="font-size:0.8rem;color:#64748b"></span>
            </div>
            <div style="display:flex;gap:8px">
              <input id="regPhoneOtpInput" type="text" maxlength="6" placeholder="123456" style="flex:1;letter-spacing:6px;font-size:1.15rem;font-weight:700;text-align:center">
              <button type="button" id="btnConfirmPhoneOtp" class="btn btn-primary" style="white-space:nowrap;padding:0 16px">
                <i class="fa-solid fa-check"></i> Confirm
              </button>
            </div>
            <small id="phoneOtpHint" style="display:block;color:#64748b;margin-top:6px;font-size:0.82rem">Enter the 6-digit verification code sent to your phone (demo test code: <b style="color:var(--primary)">123456</b> or code shown in toast).</small>
          </div>

          <div class="form-group">
            <label for="regPasswordInput"><i class="fa-solid fa-lock"></i> Password (min 8 chars)</label>
            <div class="password-input-wrap">
              <input id="regPasswordInput" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="••••••••" required>
              <button type="button" class="btn-toggle-pwd" data-target="regPasswordInput" aria-label="Toggle password visibility">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="regRoleSelect"><i class="fa-solid fa-briefcase"></i> Account Type</label>
            <select id="regRoleSelect" name="role" required>
              <option value="FREELANCER" selected>Freelancer — I offer skills and services</option>
              <option value="CLIENT">Client — I want to hire talent and post jobs</option>
            </select>
          </div>

          <button type="submit" id="btnRegisterSubmit" class="btn btn-primary btn-block">
            <span class="btn-label"><i class="fa-solid fa-user-plus"></i> Create Free Account</span>
          </button>

          <div class="auth-divider"><span>or sign up with</span></div>

          <button type="button" id="btnGoogleRegister" class="btn btn-block btn-google">
            <i class="fa-brands fa-google"></i> Sign Up with Google
          </button>
        </form>
      </div>
    </div>
  `;
};

Pages.about = () => `
  <div class="page-head">
    <div class="container">
      <span class="auth-badge" style="background:#ede9fe;color:#7c3aed;margin-bottom:12px">⚡ About the Platform</span>
      <h1>Work Globally. Connect Freely.</h1>
      <p>VibeWorkers is a global freelance marketplace built for borderless collaboration</p>
    </div>
  </div>

  <div class="container" style="padding-bottom:64px;max-width:920px">
    <!-- Founder & Creator Spotlight -->
    <div class="card" style="padding:32px;margin-bottom:28px;border-left:5px solid var(--primary);background:linear-gradient(to right, #ffffff, #faf5ff)">
      <div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap">
        <div style="width:68px;height:68px;border-radius:50%;background:var(--grad);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 6px 18px rgba(124,58,237,.35)">
          <i class="fa-solid fa-crown"></i>
        </div>
        <div style="flex:1;min-width:260px">
          <span class="badge badge-verified" style="margin-bottom:8px">Founder & Creator</span>
          <h2 style="font-size:1.6rem;color:var(--ink);margin-bottom:6px">Created by Mukundram</h2>
          <p style="color:var(--ink-2);font-size:1rem;line-height:1.6;margin-bottom:14px">
            VibeWorkers was conceived, architected, and built by <b>Mukundram</b> with the mission to give independent professionals, students, remote workers, and international businesses an open, transparent, and fair digital workplace.
          </p>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <a href="https://www.instagram.com/revolutionary_scout/" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="background:linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)">
              <i class="fa-brands fa-instagram"></i> Instagram: @revolutionary_scout
            </a>
            <span style="font-size:0.88rem;color:var(--ink-3)">Official Creator Profile</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Origin & Mission -->
    <div class="card" style="padding:32px;margin-bottom:28px">
      <h3 style="font-size:1.35rem;margin-bottom:12px"><i class="fa-solid fa-earth-americas" style="color:var(--primary)"></i> The VibeWorkers Story</h3>
      <p style="color:var(--ink-2);margin-bottom:14px;line-height:1.7">
        <b>VibeWorkers was originally started as Jaffna Freelance Connect by Mukundram.</b> What began as an initiative to empower skilled youth has expanded into an international marketplace reaching worldwide clients and borderless freelancers.
      </p>
      <p style="color:var(--ink-2);line-height:1.7">
        Our global architecture breaks down geographical walls. Whether you are an independent software engineer, a graphic designer, a video editor, a student freelancer, or an international business looking for reliable talent, VibeWorkers gives you the tools to collaborate with confidence.
      </p>
    </div>

    <!-- Pillars -->
    <div class="grid grid-3" style="gap:20px;margin-bottom:28px">
      <div class="card" style="padding:24px">
        <div style="font-size:1.8rem;color:var(--primary);margin-bottom:12px"><i class="fa-solid fa-globe"></i></div>
        <h4 style="margin-bottom:8px">1. Truly Global</h4>
        <p style="font-size:0.9rem;color:var(--ink-3);line-height:1.6">Designed for remote, hybrid, and location-based jobs worldwide with transparent multi-currency budgets (USD, EUR, GBP, LKR, INR, etc.).</p>
      </div>
      <div class="card" style="padding:24px">
        <div style="font-size:1.8rem;color:var(--primary);margin-bottom:12px"><i class="fa-solid fa-shield-halved"></i></div>
        <h4 style="margin-bottom:8px">2. Verified Security</h4>
        <p style="font-size:0.9rem;color:var(--ink-3);line-height:1.6">Every user undergoes email and SMS phone verification. Contact information is securely linked without exposing raw phone or email details.</p>
      </div>
      <div class="card" style="padding:24px">
        <div style="font-size:1.8rem;color:var(--primary);margin-bottom:12px"><i class="fa-solid fa-hand-holding-dollar"></i></div>
        <h4 style="margin-bottom:8px">3. Fair & Accessible</h4>
        <p style="font-size:0.9rem;color:var(--ink-3);line-height:1.6">100% open for students, beginners, seasoned experts, and entrepreneurs. Transparent terms with zero hidden deductions.</p>
      </div>
    </div>

    <div style="text-align:center;padding:24px">
      <a href="#/jobs" class="btn btn-primary" style="margin-right:8px"><i class="fa-solid fa-briefcase"></i> Explore Global Jobs</a>
      <a href="#/freelancers" class="btn btn-outline"><i class="fa-solid fa-users"></i> Discover Freelancers</a>
    </div>
  </div>
`;

Pages.privacy = () => `
  <div class="page-head">
    <div class="container">
      <h1><i class="fa-solid fa-shield-cat" style="color:var(--primary)"></i> Privacy Policy & Data Rights</h1>
      <p>VibeWorkers Global Data Protection and Privacy Charter (GDPR-Aligned)</p>
    </div>
  </div>
  <div class="container" style="padding-bottom:64px;max-width:920px">
    <div class="card" style="padding:32px;margin-bottom:24px;line-height:1.7">
      <span class="badge badge-verified" style="margin-bottom:12px">Last Updated: October 2026</span>
      <h2 style="font-size:1.4rem;margin-bottom:12px">Your Privacy at VibeWorkers</h2>
      <p style="color:var(--ink-2);margin-bottom:16px">
        VibeWorkers ("we", "our", or "the platform"), created and maintained by Mukundram, values the privacy of its international users. This policy outlines how information is collected, safeguarded, and how you retain full control over your personal data under global data protection principles, including the General Data Protection Regulation (GDPR).
      </p>

      <h3 style="font-size:1.15rem;margin:20px 0 8px;color:var(--ink)">1. Information We Collect</h3>
      <ul style="padding-left:22px;color:var(--ink-2);margin-bottom:16px">
        <li><b>Account Identification:</b> Display name, verified email address, verified phone number, country/region.</li>
        <li><b>Professional Profile (Freelancers):</b> Headline, bio, skills, hourly rate & currency, experience level, availability.</li>
        <li><b>Job Listings (Clients):</b> Project titles, descriptions, budget amounts, explicit currencies, and workplace types.</li>
      </ul>

      <h3 style="font-size:1.15rem;margin:20px 0 8px;color:var(--ink)">2. Privacy-Protected Contact Linking</h3>
      <p style="color:var(--ink-2);margin-bottom:16px">
        When posting jobs or submitting applications, users are never required to publicly reveal their raw personal email or telephone numbers. Communication occurs securely through authenticated accounts.
      </p>

      <h3 style="font-size:1.15rem;margin:20px 0 8px;color:var(--ink)">3. Your Data Rights (GDPR & International Access)</h3>
      <p style="color:var(--ink-2);margin-bottom:16px">
        You hold the right to access, rectify, export, and completely erase your personal data at any time.
      </p>

      <div style="background:#f8fafc;padding:20px;border-radius:12px;border:1px solid var(--border);margin-top:20px">
        <h4 style="margin-bottom:10px"><i class="fa-solid fa-sliders" style="color:var(--primary)"></i> Self-Service Data Management</h4>
        <p style="font-size:0.9rem;color:var(--ink-3);margin-bottom:14px">As an authenticated user, you can download a copy of all your stored data or request immediate permanent account deletion below:</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button id="btnExportData" class="btn btn-outline btn-sm"><i class="fa-solid fa-download"></i> Export My Data (JSON)</button>
          <button id="btnDeleteAccount" class="btn btn-outline btn-sm" style="color:#b91c1c;border-color:#fca5a5"><i class="fa-solid fa-trash-can"></i> Delete My Account</button>
        </div>
      </div>

      <h3 style="font-size:1.15rem;margin:24px 0 8px;color:var(--ink)">4. Contact the Platform</h3>
      <p style="color:var(--ink-2)">
        For privacy inquiries, contact: <b>contact@vibeworkers.com</b> or reach the creator on Instagram: <a href="https://www.instagram.com/revolutionary_scout/" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;">@revolutionary_scout</a>.
      </p>
    </div>
  </div>
`;

Pages.terms = () => `
  <div class="page-head">
    <div class="container">
      <h1><i class="fa-solid fa-scale-balanced" style="color:var(--primary)"></i> Terms of Service</h1>
      <p>VibeWorkers International Marketplace Guidelines & Conditions</p>
    </div>
  </div>
  <div class="container" style="padding-bottom:64px;max-width:920px">
    <div class="card" style="padding:32px;line-height:1.7">
      <span class="badge badge-verified" style="margin-bottom:12px">Effective: October 2026</span>
      <h2 style="font-size:1.4rem;margin-bottom:12px">Welcome to VibeWorkers</h2>
      <p style="color:var(--ink-2);margin-bottom:16px">
        By accessing or using VibeWorkers, created by Mukundram, you agree to comply with and be bound by these Terms of Service.
      </p>
      <h3 style="font-size:1.15rem;margin:20px 0 8px;color:var(--ink)">1. Platform Nature</h3>
      <p style="color:var(--ink-2);margin-bottom:16px">
        VibeWorkers is an international directory and connection platform facilitating introductions between clients and independent freelance professionals across countries. VibeWorkers was originally started as Jaffna Freelance Connect by Mukundram.
      </p>
      <h3 style="font-size:1.15rem;margin:20px 0 8px;color:var(--ink)">2. Account Verification & Authenticity</h3>
      <p style="color:var(--ink-2);margin-bottom:16px">
        Users agree to provide accurate information and complete email and phone verification. Accounts engaging in impersonation, spam, harassment, or malicious activity will be moderated and terminated.
      </p>
      <h3 style="font-size:1.15rem;margin:20px 0 8px;color:var(--ink)">3. Multi-Currency Budgets & Payments</h3>
      <p style="color:var(--ink-2);margin-bottom:16px">
        Job postings must specify their explicit currency (USD, EUR, GBP, LKR, INR, etc.). Clients and freelancers agree on remuneration directly. Note: International payment gateways, direct in-app escrow, and automated freelancer payouts are prepared for future phases and are not currently represented as live processing services.
      </p>
      <h3 style="font-size:1.15rem;margin:20px 0 8px;color:var(--ink)">4. Creator Attribution</h3>
      <p style="color:var(--ink-2);margin-bottom:16px">
        VibeWorkers is created and developed by Mukundram. (Instagram: <a href="https://www.instagram.com/revolutionary_scout/" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;">@revolutionary_scout</a>).
      </p>
    </div>
  </div>
`;

Pages.admin = async () => {
  if (!Auth.user || Auth.user.role !== 'ADMIN') return '<div class="container"><div class="auth-wrap"><h2>🛡️ Admin Access</h2><p class="sub">Administrators only.</p><a href="#/login" class="btn btn-primary btn-block">Login</a></div></div>';
  let d={counts:{}}; try { d=(await api('/admin/dashboard')).data; } catch(e) { return '<div class="container"><div class="empty">'+esc(e.message)+'</div></div>'; }
  const isSupreme = (Auth.user.email?.toLowerCase() === 'mukundram165250@gmail.com' || Auth.user.isSupremeAdmin === true);
  const supremeBanner = isSupreme ? `
    <div class="notice" style="background:#eef2ff;border-color:#c7d2fe;color:#3730a3;margin-bottom:20px;padding:16px 20px;border-radius:12px;display:flex;align-items:center;gap:14px;">
      <i class="fa-solid fa-crown" style="color:#4f46e5;font-size:1.6rem"></i>
      <div>
        <h4 style="margin:0 0 3px;font-size:1rem;color:#312e81">Supreme Admin Mode Active</h4>
        <p style="margin:0;font-size:.86rem;opacity:.9">You are authenticated as <b>Mukundram</b> (mukundram165250@gmail.com). You hold full system authority and can promote normal accounts into Admins or revoke admin access from the <b>Users</b> tab.</p>
      </div>
    </div>
  ` : '';
  return '<div class="page-head"><div class="container">'+supremeBanner+'<h1><i class="fa-solid fa-gauge-high" style="color:var(--primary)"></i> Admin Dashboard</h1><p>Moderate jobs, review freelancer profiles, and manage account permissions</p></div></div><div class="container" style="padding-bottom:64px"><div class="admin-stats"><div class="stat-card"><div class="ico"><i class="fa-solid fa-hourglass-half"></i></div><div><b>'+d.counts.pendingJobs+d.counts.pendingFreelancers+'</b><span>Pending Approval</span></div></div><div class="stat-card"><div class="ico"><i class="fa-solid fa-briefcase"></i></div><div><b>'+d.counts.jobs+'</b><span>Total Jobs</span></div></div><div class="stat-card"><div class="ico"><i class="fa-solid fa-users"></i></div><div><b>'+d.counts.freelancers+'</b><span>Freelancers</span></div></div><div class="stat-card"><div class="ico"><i class="fa-solid fa-user-check"></i></div><div><b>'+d.counts.users+'</b><span>Users</span></div></div></div><div class="admin-tabs"><button class="active" data-atab="pending">⏳ Pending</button><button data-atab="jobs">💼 Jobs</button><button data-atab="freelancers">🧑‍💻 Freelancers</button><button data-atab="users">👥 Users</button></div><div id="adminContent"></div></div>';
};

Pages['job'] = async id => {
  try {
    const j=(await api('/jobs/'+encodeURIComponent(id))).data.job;
    const cur = j.currency || 'USD';
    const budget = (j.budgetMin || j.budgetMax)
      ? (j.budgetMin && j.budgetMax ? fmtCurrency(j.budgetMin, cur)+' – '+fmtCurrency(j.budgetMax, cur) : fmtCurrency(j.budgetMin || j.budgetMax, cur))
      : 'Budget flexible';
    const workplace = j.workplaceType === 'REMOTE' ? '🌐 Remote (Worldwide)' : (j.workplaceType === 'HYBRID' ? '🏢 Hybrid' : '📍 ' + (j.location || 'On-site'));
    const apply = Auth.user?.role === 'FREELANCER' ? '<form id="applyForm" class="form-wrap" style="margin-top:24px"><h3>Apply for this job</h3><textarea name="coverMessage" maxlength="2000" placeholder="Tell the client about your relevant experience, proposed milestones, and why you are suitable…"></textarea><button class="btn btn-primary btn-block"><i class="fa-solid fa-paper-plane"></i> Send Application</button></form>' : '';
    return '<div class="container" style="padding:64px 20px;max-width:880px"><div class="card" style="padding:32px"><h1>'+esc(j.title)+'</h1><div class="card-meta" style="margin:16px 0"><span><i class="fa-solid fa-tag"></i> '+esc(j.category||'General')+'</span><span><i class="fa-solid fa-earth-americas"></i> '+esc(workplace)+'</span><span><i class="fa-regular fa-clock"></i> '+timeAgo(j.createdAt)+'</span></div><div style="background:#f8fafc;padding:16px;border-radius:12px;margin:20px 0;border:1px solid var(--border)"><h4 style="margin-bottom:4px;color:var(--ink)">Explicit Budget</h4><div style="font-size:1.3rem;font-weight:700;color:var(--primary)">'+budget+' <span style="font-size:0.9rem;font-weight:500;color:var(--ink-3)">('+cur+')</span></div></div><h3 style="margin-top:24px;margin-bottom:8px">Scope of Work</h3><p class="desc" style="white-space:pre-wrap;line-height:1.7">'+esc(j.description)+'</p><div style="margin-top:24px;padding-top:18px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span style="color:var(--ink-3);font-size:0.9rem"><i class="fa-solid fa-user-check" style="color:var(--green)"></i> Verified Client: '+esc(j.client?.displayName||'Client')+'</span><span class="badge badge-verified">Open for Proposals</span></div></div>'+apply+'</div>';
  } catch(e) { return '<div class="container"><div class="empty">'+esc(e.message)+'</div></div>'; }
};

Pages['freelancer'] = async id => {
  try {
    const f=(await api('/profile/freelancers/'+encodeURIComponent(id))).data.profile;
    const p = f.freelancerProfile || {};
    const cur = p.hourlyCurrency || 'USD';
    const rate = p.hourlyRate ? fmtCurrency(p.hourlyRate, cur) + ' / hr' : 'Flexible';
    const locationLabel = p.country || f.location || f.country || 'Global / Remote';
    return '<div class="container" style="padding:64px 20px;max-width:880px"><div class="card f-card" style="padding:36px"><div class="f-avatar" style="width:72px;height:72px;font-size:1.6rem">'+esc(initials(f.displayName))+'</div><h1 style="margin-top:12px">'+esc(f.displayName)+'</h1><p style="font-size:1.1rem;color:var(--primary);font-weight:600;margin-top:4px">'+esc(p.headline||'Independent Professional')+'</p><p style="color:var(--ink-3);margin-top:4px"><i class="fa-solid fa-globe"></i> '+esc(locationLabel)+'</p><div class="skill-tags" style="justify-content:center;margin:18px 0">'+(p.skills||[]).map(x=>'<span class="skill-tag">'+esc(x)+'</span>').join('')+'</div><div style="background:#f8fafc;padding:20px;border-radius:12px;margin:20px 0;text-align:left;border:1px solid var(--border)"><h4 style="margin-bottom:6px">About</h4><p class="desc" style="white-space:pre-wrap;line-height:1.7">'+esc(p.bio||'Available for international freelance and remote work.')+'</p></div><div class="card-foot" style="width:100%;margin-top:20px"><div class="price">'+rate+'<br><small>Rate ('+cur+')</small></div><span class="badge badge-level">'+esc(p.experienceLevel||'Beginner')+'</span></div></div></div>';
  } catch(e) { return '<div class="container"><div class="empty">'+esc(e.message)+'</div></div>'; }
};

async function wire(route, parts) {
  if (route === 'jobs') {
    const render = async () => {
      const q = document.getElementById('jSearch')?.value.trim() || '';
      const cat = document.getElementById('jCat')?.value || '';
      const wp = document.getElementById('jWorkplace')?.value || '';
      let url = '/jobs?limit=50';
      if (q) url += '&search=' + encodeURIComponent(q);
      if (cat) url += '&category=' + encodeURIComponent(cat);
      try {
        const jobs = (await api(url)).data.jobs;
        const filtered = jobs.filter(j => !wp || j.workplaceType === wp);
        document.getElementById('jobGrid').innerHTML = filtered.map(jobCard).join('') || '<div class="empty">No global jobs match your filters.</div>';
      } catch (e) {
        document.getElementById('jobGrid').innerHTML = '<div class="empty">' + esc(e.message) + '</div>';
      }
    };
    ['jSearch', 'jCat', 'jWorkplace'].forEach(id => document.getElementById(id)?.addEventListener('input', render));
    render();
  }
  if (route === 'freelancers') {
    const render = async () => {
      try {
        const r = await api('/profile/freelancers');
        const list = r.data.profiles || [];
        const q = document.getElementById('fSearch')?.value.toLowerCase() || '';
        const lvl = document.getElementById('fLevel')?.value || '';
        const filtered = list.filter(f => {
          const p = f.freelancerProfile || {};
          const matchQuery = (!q || (f.displayName + ' ' + (p.headline || '') + ' ' + (p.skills || []).join(' ') + ' ' + (p.country || f.location || '')).toLowerCase().includes(q));
          const matchLevel = (!lvl || p.experienceLevel === lvl);
          return matchQuery && matchLevel;
        });
        document.getElementById('fGrid').innerHTML = filtered.map(freelancerCard).join('') || '<div class="empty">No freelancers found.</div>';
      } catch (e) {
        document.getElementById('fGrid').innerHTML = '<div class="empty">' + esc(e.message) + '</div>';
      }
    };
    ['fSearch', 'fLevel'].forEach(id => document.getElementById(id)?.addEventListener('input', render));
    render();
  }
  const jf = document.getElementById('jobForm');
  if (jf) {
    jf.onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(jf);
      try {
        await api('/jobs', {
          method: 'POST',
          body: JSON.stringify({
            title: f.get('title'),
            description: f.get('description'),
            category: f.get('category') || null,
            workplaceType: f.get('workplaceType') || 'REMOTE',
            location: f.get('location') || 'Remote (Worldwide)',
            currency: f.get('currency') || 'USD',
            contact: null,
            skills: String(f.get('skills') || '').split(',').map(x => x.trim()).filter(Boolean),
            budgetMin: f.get('budgetMin') || null,
            budgetMax: f.get('budgetMax') || null
          })
        });
        celebrate({
          title: 'Global Job Submitted! 🚀',
          sub: 'Your listing is under review and will soon connect with international talent.',
          icon: '⚡'
        });
        go('/jobs');
      } catch (e) {
        toast(e.message, 'error');
      }
    };
  }
  const sf = document.getElementById('serviceForm');
  if (sf) {
    sf.onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(sf);
      try {
        await api('/profile/me', {
          method: 'PATCH',
          body: JSON.stringify({
            headline: f.get('headline'),
            skills: String(f.get('skills') || '').split(',').map(x => x.trim()).filter(Boolean),
            bio: f.get('bio'),
            experienceLevel: f.get('experienceLevel'),
            hourlyCurrency: f.get('hourlyCurrency') || 'USD',
            hourlyRate: f.get('hourlyRate') || null,
            country: f.get('country') || 'GLOBAL',
            availability: f.get('availability')
          })
        });
        celebrate({
          title: 'Freelancer Profile Saved! ⭐',
          sub: 'Your international profile is active and ready to attract clients.',
          icon: '✨'
        });
        go('/freelancers');
      } catch (e) {
        toast(e.message, 'error');
      }
    };
  }
  const af = document.getElementById('applyForm');
  if (af) {
    af.onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(af);
      try {
        await api('/applications', {
          method: 'POST',
          body: JSON.stringify({ jobId: parts[1], coverMessage: f.get('coverMessage') })
        });
        celebrate({
          title: 'Application Sent Successfully! 🎯',
          sub: 'The client will be notified of your proposal.',
          icon: '📨'
        });
        af.remove();
      } catch (e) {
        toast(e.message, 'error');
      }
    };
  }

  if (route === 'privacy') {
    const exportBtn = document.getElementById('btnExportData');
    if (exportBtn) {
      exportBtn.onclick = async () => {
        try {
          const res = await api('/auth/export-data');
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vibeworkers-data-${Auth.user?.displayName || 'export'}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast('Your personal data archive has been exported! 📦');
        } catch (e) {
          toast(e.message || 'Please log in to export your account data.', 'error');
        }
      };
    }
    const deleteBtn = document.getElementById('btnDeleteAccount');
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (!Auth.user) return toast('Please log in first.', 'error');
        const confirmStr = prompt('This action is irreversible. Type DELETE to permanently delete your account and all associated profiles/jobs:');
        if (confirmStr !== 'DELETE') return;
        try {
          await api('/auth/account', { method: 'DELETE' });
          toast('Your account and personal data have been completely deleted.');
          await Auth.logout();
        } catch (e) {
          toast(e.message || 'Failed to delete account.', 'error');
        }
      };
    }
  }

  if (route === 'login') {
    const alertBox = document.getElementById('authAlert');
    const showAlert = (msg, type = 'error') => {
      if (!alertBox) return;
      alertBox.className = 'auth-alert ' + type;
      alertBox.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + esc(msg);
      alertBox.style.display = 'flex';
    };
    const hideAlert = () => { if (alertBox) alertBox.style.display = 'none'; };

    // Tabs & Forms
    const authTabs = document.querySelector('.auth-tabs');
    const tabLogin = document.getElementById('tabLoginBtn') || document.querySelector('.auth-tabs button[data-tab="login"]');
    const tabRegister = document.getElementById('tabRegisterBtn') || document.querySelector('.auth-tabs button[data-tab="register"]');
    const lf = document.getElementById('loginForm');
    const rf = document.getElementById('registerForm');
    const pf = document.getElementById('resetPasswordForm');
    const heading = document.getElementById('authHeading');
    const subhead = document.getElementById('authSubheading');

    const switchTab = (tab) => {
      hideAlert();
      if (tab === 'login') {
        if (authTabs) authTabs.style.display = 'flex';
        tabLogin?.classList.add('active');
        tabRegister?.classList.remove('active');
        if (lf) lf.style.display = '';
        if (rf) rf.style.display = 'none';
        if (pf) pf.style.display = 'none';
        if (heading) heading.textContent = 'Welcome Back 👋';
        if (subhead) subhead.textContent = 'Work Globally. Connect Freely. Sign in or create your account to explore worldwide opportunities';
      } else if (tab === 'register') {
        if (authTabs) authTabs.style.display = 'flex';
        tabRegister?.classList.add('active');
        tabLogin?.classList.remove('active');
        if (lf) lf.style.display = 'none';
        if (rf) rf.style.display = '';
        if (pf) pf.style.display = 'none';
        if (heading) heading.textContent = 'Join VibeWorkers 🚀';
        if (subhead) subhead.textContent = 'Work Globally. Connect Freely. Create your free international account';
      } else if (tab === 'reset') {
        if (authTabs) authTabs.style.display = 'none';
        tabLogin?.classList.remove('active');
        tabRegister?.classList.remove('active');
        if (lf) lf.style.display = 'none';
        if (rf) rf.style.display = 'none';
        if (pf) pf.style.display = '';
        if (heading) heading.textContent = 'Reset Password 🔑';
        if (subhead) subhead.textContent = 'Enter your account email to receive a password reset link';

        // Auto-fill reset email input with value from login input if present
        const currentEmail = document.getElementById('loginEmailInput')?.value.trim();
        const resetEmailInput = document.getElementById('resetEmailInput');
        if (resetEmailInput && currentEmail) {
          resetEmailInput.value = currentEmail;
        }
        resetEmailInput?.focus();
      }
    };

    if (tabLogin) tabLogin.onclick = () => switchTab('login');
    if (tabRegister) tabRegister.onclick = () => switchTab('register');

    // Password visibility toggles
    document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
      btn.onclick = () => {
        const inputId = btn.dataset.target;
        const input = document.getElementById(inputId);
        if (!input) return;
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.innerHTML = `<i class="fa-solid fa-eye${isPwd ? '-slash' : ''}"></i>`;
      };
    });

    // Forgot password link -> Switch to password reset component
    const btnForgot = document.getElementById('btnForgotPass');
    if (btnForgot) {
      btnForgot.onclick = () => {
        switchTab('reset');
      };
    }

    // Back to Login from password reset component
    const btnBackToLogin = document.getElementById('btnBackToLoginFromReset');
    if (btnBackToLogin) {
      btnBackToLogin.onclick = () => {
        switchTab('login');
      };
    }

    // Password reset form submission -> triggers Firebase sendPasswordResetEmail
    if (pf) {
      pf.onsubmit = async (e) => {
        e.preventDefault();
        hideAlert();
        const resetEmailInput = document.getElementById('resetEmailInput');
        const email = resetEmailInput?.value.trim();
        const submitBtn = document.getElementById('btnResetPasswordSubmit');
        const origHTML = submitBtn?.innerHTML;

        if (!email || !email.includes('@')) {
          showAlert('Please enter a valid email address.');
          resetEmailInput?.focus();
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending link...';
        }

        try {
          if (window.JFCAuth) {
            await window.JFCAuth.sendPasswordResetEmail(email);
          } else {
            throw new Error('Authentication service not ready. Please try again.');
          }
          showAlert('Password reset link sent to ' + email + '! Check your inbox and spam folder.', 'success');
        } catch (err) {
          let msg = err.message || 'Failed to send password reset email.';
          if (msg.includes('auth/user-not-found')) {
            msg = 'No user account found with this email address.';
          } else if (msg.includes('auth/invalid-email')) {
            msg = 'Please enter a valid email address.';
          } else if (msg.includes('auth/too-many-requests')) {
            msg = 'Too many requests. Please wait a few moments before trying again.';
          }
          showAlert(msg);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHTML;
          }
        }
      };
    }

    // Google Sign In / Up
    const onGoogleClick = async () => {
      hideAlert();
      try {
        const u = await Auth.loginWithGoogle();
        const isRegistering = tabRegister?.classList.contains('active');
        if (isRegistering) {
          celebrate({
            title: `Welcome to VibeWorkers, ${u.displayName || 'Friend'}! 🎉`,
            sub: 'Your Google account is now connected and ready for global work.',
            icon: '🚀'
          });
        } else {
          toast('Welcome back, ' + (u.displayName || 'friend') + '! 👋');
        }
        go(u.role === 'ADMIN' ? '/admin' : '/');
      } catch (err) {
        showAlert(err.message || 'Google sign-in was cancelled or failed.');
      }
    };
    const gBtn1 = document.getElementById('btnGoogleAuth');
    const gBtn2 = document.getElementById('btnGoogleRegister');
    if (gBtn1) gBtn1.onclick = onGoogleClick;
    if (gBtn2) gBtn2.onclick = onGoogleClick;

    // Login Form Submit
    if (lf) {
      lf.onsubmit = async e => {
        e.preventDefault();
        hideAlert();
        const f = new FormData(lf);
        const email = f.get('email')?.trim();
        const password = f.get('password');
        const submitBtn = document.getElementById('btnLoginSubmit');
        const origHTML = submitBtn?.innerHTML;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...';
        }

        try {
          const u = await Auth.login(email, password);
          toast('Welcome back, ' + (u.displayName || 'friend') + '! 👋');
          go(u.role === 'ADMIN' ? '/admin' : '/');
        } catch (err) {
          let msg = err.message || 'Login failed.';
          if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
            msg = 'Invalid email or password. Please check your credentials or register.';
          } else if (msg.includes('auth/too-many-requests')) {
            msg = 'Too many attempts. Access temporarily restricted. Please try again later.';
          }
          showAlert(msg);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHTML;
          }
        }
      };
    }

    // Phone OTP Verification State & Logic
    let phoneIsVerified = false;
    let expectedPhoneOtp = null;
    let otpCountdownInterval = null;

    const phoneInput = document.getElementById('regPhoneInput');
    const btnSendOtp = document.getElementById('btnSendPhoneOtp');
    const btnSendOtpText = document.getElementById('btnSendOtpText');
    const otpGroup = document.getElementById('phoneOtpGroup');
    const otpInput = document.getElementById('regPhoneOtpInput');
    const btnConfirmOtp = document.getElementById('btnConfirmPhoneOtp');
    const phoneBadge = document.getElementById('phoneVerifiedBadge');
    const timerSpan = document.getElementById('phoneOtpTimer');

    if (btnSendOtp) {
      btnSendOtp.onclick = async () => {
        hideAlert();
        const phone = phoneInput?.value.trim();
        if (!phone || phone.length < 8) {
          showAlert('Please enter a valid phone number (e.g. +94 77 123 4567) before verifying.');
          phoneInput?.focus();
          return;
        }

        btnSendOtp.disabled = true;
        if (btnSendOtpText) btnSendOtpText.textContent = 'Sending...';

        try {
          let otpCode = '123456';
          if (window.JFCAuth && window.JFCAuth.sendPhoneOtp) {
            const res = await window.JFCAuth.sendPhoneOtp(phone);
            if (res?.data?.code) otpCode = res.data.code;
          } else {
            otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          }

          expectedPhoneOtp = otpCode;
          if (otpGroup) otpGroup.style.display = 'block';
          if (otpInput) {
            otpInput.value = '';
            otpInput.focus();
          }

          toast(`📱 Verification code sent to ${phone}! (Code: ${expectedPhoneOtp})`);

          let secondsLeft = 60;
          if (timerSpan) timerSpan.textContent = `Expires in ${secondsLeft}s`;
          if (otpCountdownInterval) clearInterval(otpCountdownInterval);
          otpCountdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
              clearInterval(otpCountdownInterval);
              if (timerSpan) timerSpan.textContent = 'Code expired. Request new code.';
              btnSendOtp.disabled = false;
              if (btnSendOtpText) btnSendOtpText.textContent = 'Resend Code';
            } else {
              if (timerSpan) timerSpan.textContent = `Expires in ${secondsLeft}s`;
            }
          }, 1000);
        } catch (err) {
          showAlert(err.message || 'Failed to dispatch phone verification code.');
          btnSendOtp.disabled = false;
          if (btnSendOtpText) btnSendOtpText.textContent = 'Verify Phone';
        }
      };
    }

    if (btnConfirmOtp) {
      btnConfirmOtp.onclick = async () => {
        hideAlert();
        const entered = otpInput?.value.trim();
        if (!entered || entered.length < 4) {
          showAlert('Please enter the 6-digit SMS verification code.');
          otpInput?.focus();
          return;
        }

        if (entered === expectedPhoneOtp || entered === '123456') {
          phoneIsVerified = true;
          if (otpGroup) otpGroup.style.display = 'none';
          if (phoneBadge) phoneBadge.style.display = 'flex';
          if (phoneInput) phoneInput.readOnly = true;
          if (btnSendOtp) {
            btnSendOtp.disabled = true;
            btnSendOtp.className = 'btn btn-green';
            btnSendOtp.innerHTML = '<i class="fa-solid fa-check"></i> Verified';
          }
          if (otpCountdownInterval) clearInterval(otpCountdownInterval);
          toast('Phone number verified successfully! ✅');
        } else {
          showAlert('Invalid verification code. Please check the code (or use demo code 123456).');
        }
      };
    }

    // Register Form Submit
    if (rf) {
      rf.onsubmit = async e => {
        e.preventDefault();
        hideAlert();
        const f = new FormData(rf);
        const displayName = f.get('displayName')?.trim();
        const email = f.get('email')?.trim();
        const confirmEmail = f.get('confirmEmail')?.trim();
        const phone = f.get('phone')?.trim();
        const password = f.get('password');
        const role = f.get('role');
        const submitBtn = document.getElementById('btnRegisterSubmit');
        const origHTML = submitBtn?.innerHTML;

        if (!displayName) {
          showAlert('Please enter your full name.');
          document.getElementById('regNameInput')?.focus();
          return;
        }

        if (!email || !email.includes('@')) {
          showAlert('Please enter a valid email address.');
          document.getElementById('regEmailInput')?.focus();
          return;
        }

        if (!confirmEmail) {
          showAlert('Please confirm your email address.');
          document.getElementById('regConfirmEmailInput')?.focus();
          return;
        }

        if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
          showAlert('Email addresses do not match. Please verify your confirmation email.');
          document.getElementById('regConfirmEmailInput')?.focus();
          return;
        }

        if (!phone || phone.length < 8) {
          showAlert('Please enter a valid phone number.');
          phoneInput?.focus();
          return;
        }

        if (!phoneIsVerified) {
          showAlert('Please verify your phone number using the SMS verification code before creating an account.');
          btnSendOtp?.focus();
          return;
        }

        if (!password || password.length < 8) {
          showAlert('Password must be at least 8 characters.');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating account & sending confirmation...';
        }

        try {
          const country = f.get('country') || 'GLOBAL';
          const u = await Auth.register(displayName, email, password, role, phone, country);
          celebrate({
            title: 'Welcome to VibeWorkers! 🎉',
            sub: `Account created! Please check ${email} for your confirmation link.`,
            icon: '🚀'
          });
          go('/');
        } catch (err) {
          let msg = err.message || 'Registration failed.';
          if (msg.includes('auth/email-already-in-use')) {
            msg = 'This email is already registered. Please sign in instead.';
          } else if (msg.includes('auth/weak-password')) {
            msg = 'Password is too weak. Please use at least 8 characters.';
          } else if (msg.includes('auth/invalid-email')) {
            msg = 'Please enter a valid email address.';
          }
          showAlert(msg);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHTML;
          }
        }
      };
    }

    const logoutAlt = document.getElementById('logoutBtnAlt');
    if (logoutAlt) logoutAlt.onclick = () => Auth.logout();
  }
  if(route==='admin' && Auth.user?.role==='ADMIN') {
    const renderTab=async tab=>{const el=document.getElementById('adminContent');el.innerHTML='<div class="empty">Loading…</div>';try{
      if(tab==='pending'||tab==='freelancers'){const r=await api('/admin/freelancers?moderation='+ (tab==='pending'?'PENDING':'APPROVED') +'&limit=50');const rows=r.data.freelancers.map(x=>'<div class="admin-row"><div class="info"><h4>'+esc(x.user.displayName)+' '+badge(x.moderation,x.moderation==='APPROVED'?'badge-verified':'badge-new')+'</h4><p>'+esc(x.headline||'')+' · '+esc((x.skills||[]).join(', '))+'</p></div><div class="actions">'+(x.moderation!=='APPROVED'?'<button class="btn btn-green btn-sm" data-m="APPROVED" data-id="'+x.id+'">Approve</button>':'')+(x.moderation!=='REJECTED'?'<button class="btn btn-outline btn-sm" data-m="REJECTED" data-id="'+x.id+'">Reject</button>':'')+'</div></div>').join('');el.innerHTML='<div class="admin-table">'+(rows||'<div class="empty">None.</div>')+'</div>';el.querySelectorAll('[data-m]').forEach(b=>b.onclick=async()=>{try{await api('/admin/freelancers/'+b.dataset.id+'/moderation',{method:'PATCH',body:JSON.stringify({moderation:b.dataset.m})});toast('Freelancer updated.');renderTab(tab);}catch(e){toast(e.message,'error');}});}
      else if(tab==='jobs'){const r=await api('/admin/jobs?moderation=PENDING&limit=50');const rows=r.data.jobs.map(x=>'<div class="admin-row"><div class="info"><h4>'+esc(x.title)+' '+badge(x.moderation,'badge-new')+'</h4><p>'+esc(x.category||'Other')+' · '+fmtLKR(x.budgetMin||x.budgetMax)+' · '+esc(x.client.displayName)+'</p><p>'+esc(x.description.slice(0,160))+'…</p></div><div class="actions"><button class="btn btn-green btn-sm" data-m="APPROVED" data-id="'+x.id+'">Approve</button><button class="btn btn-outline btn-sm" data-m="REJECTED" data-id="'+x.id+'">Reject</button></div></div>').join('');el.innerHTML='<div class="admin-table">'+(rows||'<div class="empty">No pending jobs.</div>')+'</div>';el.querySelectorAll('[data-m]').forEach(b=>b.onclick=async()=>{try{await api('/admin/jobs/'+b.dataset.id+'/moderation',{method:'PATCH',body:JSON.stringify({moderation:b.dataset.m})});toast('Job moderation updated.');renderTab('jobs');}catch(e){toast(e.message,'error');}});}
      else {
        const isSupreme = (Auth.user?.email?.toLowerCase() === 'mukundram165250@gmail.com' || Auth.user?.isSupremeAdmin === true);
        const r = await api('/admin/users?limit=50');
        const rows = (r.data?.users || []).map(u => {
          const userIsSupreme = (u.email?.toLowerCase() === 'mukundram165250@gmail.com' || u.isSupremeAdmin);
          let badgeHtml = '';
          if (userIsSupreme) {
            badgeHtml = '<span class="badge" style="background:#4338ca;color:#fff"><i class="fa-solid fa-crown"></i> Supreme Admin</span>';
          } else if (u.role === 'ADMIN') {
            badgeHtml = '<span class="badge badge-verified"><i class="fa-solid fa-shield"></i> Admin</span>';
          } else {
            badgeHtml = badge(u.role, 'badge-level');
          }

          let actionHtml = '';
          if (isSupreme && !userIsSupreme) {
            if (u.role !== 'ADMIN') {
              actionHtml = `<button class="btn btn-primary btn-sm btn-role-change" data-id="${u.id}" data-email="${esc(u.email)}" data-name="${esc(u.displayName)}" data-role="ADMIN"><i class="fa-solid fa-shield-halved"></i> Make Admin</button>`;
            } else {
              actionHtml = `<button class="btn btn-outline btn-sm btn-role-change" data-id="${u.id}" data-email="${esc(u.email)}" data-name="${esc(u.displayName)}" data-role="FREELANCER" style="color:#b91c1c;border-color:#fca5a5"><i class="fa-solid fa-user-minus"></i> Remove Admin</button>`;
            }
          }

          return `<div class="admin-row">
            <div class="info">
              <h4>${esc(u.displayName)} ${badgeHtml}</h4>
              <p>${esc(u.email)} · ${esc(u.country || u.location || 'Global / Remote')} · Registered: ${timeAgo(u.createdAt)}</p>
            </div>
            <div class="actions">
              ${actionHtml}
            </div>
          </div>`;
        }).join('');

        el.innerHTML = '<div class="admin-table">' + (rows || '<div class="empty">No users found.</div>') + '</div>';

        // Wire role change buttons for Supreme Admin
        el.querySelectorAll('.btn-role-change').forEach(btn => {
          btn.onclick = async () => {
            const targetId = btn.dataset.id;
            const targetEmail = btn.dataset.email;
            const targetName = btn.dataset.name || targetEmail;
            const newRole = btn.dataset.role;
            const isPromote = newRole === 'ADMIN';

            const confirmMsg = isPromote
              ? `Are you sure you want to promote ${targetName} (${targetEmail}) to Admin? They will receive full moderation permissions.`
              : `Revoke admin privileges from ${targetName} (${targetEmail})? Their account will be converted to Freelancer.`;

            if (!confirm(confirmMsg)) return;

            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${isPromote ? 'Promoting...' : 'Updating...'}`;

            try {
              if (isPromote) {
                if (window.JFCAuth && window.JFCAuth.promoteToAdmin) {
                  await window.JFCAuth.promoteToAdmin(targetId, targetEmail);
                }
              } else {
                if (window.JFCAuth && window.JFCAuth.demoteFromAdmin) {
                  await window.JFCAuth.demoteFromAdmin(targetId, newRole);
                }
              }

              await api(`/admin/users/${encodeURIComponent(targetId)}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
              });

              toast(isPromote ? `👑 Promoted ${targetName} to Admin!` : `Admin privileges revoked for ${targetName}.`);
              renderTab('users');
            } catch (err) {
              toast(err.message || 'Failed to update account role.', 'error');
              btn.disabled = false;
              btn.innerHTML = isPromote ? '<i class="fa-solid fa-shield-halved"></i> Make Admin' : '<i class="fa-solid fa-user-minus"></i> Remove Admin';
            }
          };
        });
      }
    }catch(e){el.innerHTML='<div class="empty">'+esc(e.message)+'</div>';}};
    document.querySelectorAll('.admin-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.admin-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderTab(b.dataset.atab);}); renderTab('pending');
  }
}

function renderNav(){
  const el=document.getElementById('navAuth');
  if(Auth.user) {
    const isSupreme = (Auth.user.email?.toLowerCase() === 'mukundram165250@gmail.com' || Auth.user.isSupremeAdmin === true);
    const adminLink = Auth.user.role === 'ADMIN'
      ? `<a href="#/admin" class="btn btn-ghost btn-sm" style="${isSupreme ? 'color:#4f46e5;font-weight:700' : ''}">
          <i class="fa-solid ${isSupreme ? 'fa-crown' : 'fa-shield-halved'}" style="${isSupreme ? 'color:#eab308' : ''}"></i> ${isSupreme ? 'Supreme Admin' : 'Admin'}
        </a>`
      : '';
    el.innerHTML='<span class="nav-user">'+adminLink+'<span class="avatar-chip" title="'+esc(Auth.user.displayName)+'">'+esc(initials(Auth.user.displayName))+'</span><button class="btn btn-outline btn-sm" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i></button></span>';
  } else {
    el.innerHTML='<a href="#/login" class="btn btn-primary btn-sm" style="margin-left:8px"><i class="fa-solid fa-right-to-bracket"></i> Login</a>';
  }
  const out=document.getElementById('logoutBtn'); if(out)out.onclick=()=>Auth.logout();
}

async function route(){
  const path=(location.hash.slice(1)||'/').replace(/^\//,'')||'home';
  const parts=path.split('/');
  const name=parts[0]||'home';
  const page=Pages[name]||Pages.home;
  const app=document.getElementById('app');
  app.innerHTML=await page(parts[1]);
  document.querySelectorAll('.nav-links a[data-route]').forEach(a=>a.classList.toggle('active',a.dataset.route===name));
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo(0,0);
  await wire(name,parts);
}
function go(path){location.hash='#'+path;}

(async()=>{
  document.getElementById('navToggle').onclick=()=>document.getElementById('navLinks').classList.toggle('open');
  window.addEventListener('hashchange',route);
  if (typeof window !== 'undefined' && window.JFCAuthReady) {
    try {
      await Promise.race([
        window.JFCAuthReady,
        new Promise(r => setTimeout(r, 1200))
      ]);
    } catch(e) {}
  }
  await Auth.load();
  await route();
})();
