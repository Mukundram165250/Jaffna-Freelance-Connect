/* Jaffna Freelance Connect — API-backed frontend */
const API_BASE = (window.JFC_API_URL || '/api').replace(/\\/$/, '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtLKR = n => n == null ? '—' : 'Rs ' + Number(n).toLocaleString('en-LK');
const initials = name => String(name || '?').split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase();
const timeAgo = ts => {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 3600) return Math.max(1, Math.floor(s/60)) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
};
const CATS = ['Graphic Design','Web Development','Typing / Data Entry','Tutoring','Photography','Video Editing','Translation','Marketing','Handyman / Repair','Other'];

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body;
}

const Auth = {
  user: null,
  async load() {
    try { this.user = (await api('/auth/me')).data.user; }
    catch { this.user = null; }
    renderNav();
    return this.user;
  },
  async login(email, password) {
    const r = await api('/auth/login', { method:'POST', body:JSON.stringify({email,password}) });
    this.user = r.data.user; renderNav(); return this.user;
  },
  async register(displayName, email, password, role) {
    const r = await api('/auth/register', { method:'POST', body:JSON.stringify({displayName,email,password,role}) });
    this.user = r.data.user; renderNav(); return this.user;
  },
  async logout() {
    await api('/auth/logout', {method:'POST'}).catch(()=>{});
    this.user = null; renderNav(); go('/');
  }
};

function toast(msg, type='success') {
  const t = document.getElementById('toast');
  t.className = 'toast show ' + type;
  t.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + esc(msg);
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
}
function loginRequired(action) {
  return '<div class="container"><div class="auth-wrap" style="text-align:center"><div style="font-size:2.6rem;margin-bottom:12px">🔒</div><h2>Login Required</h2><p class="sub">Please login or create a free account to ' + esc(action) + '.</p><a href="#/login" class="btn btn-primary btn-block">Login / Register</a></div></div>';
}
function badge(text, cls='badge-new') { return '<span class="badge '+cls+'">'+esc(text)+'</span>'; }

function jobCard(j) {
  const budget = j.budgetMin || j.budgetMax ? (j.budgetMin && j.budgetMax ? fmtLKR(j.budgetMin)+' – '+fmtLKR(j.budgetMax) : fmtLKR(j.budgetMin || j.budgetMax)) : 'Budget flexible';
  return '<div class="card fade-in"><div class="card-top"><h3>'+esc(j.title)+'</h3>'+badge(j.status || 'OPEN','badge-verified')+'</div><div class="card-meta"><span><i class="fa-solid fa-tag"></i>'+esc(j.category || 'Other')+'</span><span><i class="fa-solid fa-location-dot"></i>'+esc(j.location || 'Jaffna')+'</span><span><i class="fa-regular fa-clock"></i>'+timeAgo(j.createdAt)+'</span></div><p class="desc">'+esc(j.description)+'</p><div class="card-foot"><div class="price">'+budget+'<br><small>Budget</small></div><a class="btn btn-primary btn-sm" href="#/job/'+encodeURIComponent(j.id)+'">View Job</a></div></div>';
}

function freelancerCard(f) {
  const p = f.freelancerProfile || {};
  return '<div class="card f-card fade-in"><div class="f-avatar">'+esc(initials(f.displayName))+'</div>'+badge(p.experienceLevel || 'BEGINNER','badge-level')+'<h3 style="margin-top:8px">'+esc(f.displayName)+'</h3><p style="color:var(--ink-3)">'+esc(p.headline || 'Freelancer')+'</p><div class="skill-tags">'+(p.skills||[]).map(x=>'<span class="skill-tag">'+esc(x)+'</span>').join('')+'</div><p class="desc" style="text-align:center">'+esc(p.bio || 'Available for freelance work in Jaffna.')+'</p><div class="card-foot" style="width:100%"><div class="price">'+fmtLKR(p.hourlyRate)+'<br><small>per hour</small></div><a class="btn btn-primary btn-sm" href="#/freelancer/'+encodeURIComponent(f.id)+'">View Profile</a></div></div>';
}

const Pages = {};

Pages.home = async () => {
  let jobs=[], freelancers=[];
  try {
    jobs=(await api('/jobs?limit=3')).data.jobs;
    freelancers=(await api('/profile/freelancers')).data?.profiles || [];
  } catch {}
  return '<section class="hero"><div class="container hero-inner"><span class="eyebrow"><i class="fa-solid fa-location-dot"></i> Proudly serving Jaffna, Sri Lanka</span><h1>Find Local Talent.<br>Get Work Done — <span class="hl">the Jaffna Way.</span></h1><p>Jaffna Freelance Connect links skilled locals with people who need work done. Post a job, offer your skills, and grow together.</p><div class="hero-cta"><a href="#/post-job" class="btn btn-white"><i class="fa-solid fa-briefcase"></i> I Need a Worker</a><a href="#/offer-service" class="btn btn-trans"><i class="fa-solid fa-hand-sparkles"></i> I Can Work</a></div><div class="hero-stats"><div class="stat"><b>'+jobs.length+'+</b><i>Active Jobs</i></div><div class="stat"><b>'+freelancers.length+'+</b><i>Freelancers</i></div><div class="stat"><b>100%</b><i>Local & Free</i></div></div></div></section><section class="section container"><div class="section-head"><div><h2>🔥 Latest Jobs</h2><p>Fresh opportunities posted by people in Jaffna</p></div><a class="link-more" href="#/jobs">Browse all jobs <i class="fa-solid fa-arrow-right"></i></a></div><div class="grid grid-3">'+(jobs.map(jobCard).join('')||'<div class="empty">No jobs yet.</div>')+'</div></section><section class="section container" style="padding-top:0"><div class="section-head"><div><h2>⭐ Featured Freelancers</h2><p>Talented locals ready to work</p></div><a class="link-more" href="#/freelancers">See all freelancers <i class="fa-solid fa-arrow-right"></i></a></div><div class="grid grid-3">'+(freelancers.slice(0,3).map(freelancerCard).join('')||'<div class="empty">No approved freelancers yet.</div>')+'</div></section>';
};

Pages.jobs = () => '<div class="page-head"><div class="container"><h1><i class="fa-solid fa-briefcase" style="color:var(--primary)"></i> Browse Jobs</h1><p>Find work opportunities across Jaffna</p></div></div><div class="container" style="padding-bottom:64px"><div class="filter-bar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="jSearch" placeholder="Search jobs, skills, keywords…"></div><select id="jCat"><option value="">All Categories</option>'+CATS.map(c=>'<option>'+c+'</option>').join('')+'</select></div><div class="grid grid-3" id="jobGrid"></div></div>';

Pages.freelancers = () => '<div class="page-head"><div class="container"><h1><i class="fa-solid fa-users" style="color:var(--primary)"></i> Browse Freelancers</h1><p>Hire skilled locals for any task</p></div></div><div class="container" style="padding-bottom:64px"><div class="filter-bar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="fSearch" placeholder="Search by name or skill…"></div><select id="fLevel"><option value="">Any Level</option><option>BEGINNER</option><option>INTERMEDIATE</option><option>EXPERT</option></select></div><div class="grid grid-3" id="fGrid"></div></div>';

Pages['post-job'] = () => {
  if (!Auth.user) return loginRequired('post a job');
  if (!['CLIENT','ADMIN'].includes(Auth.user.role)) return '<div class="container"><div class="auth-wrap"><h2>Client account required</h2><p class="sub">Create a Client account to post jobs.</p><a href="#/login" class="btn btn-primary btn-block">Switch account</a></div></div>';
  return '<div class="page-head"><div class="container"><h1><i class="fa-solid fa-pen-to-square" style="color:var(--primary)"></i> Post a Job</h1><p>Tell us what you need done — freelancers can apply</p></div></div><div class="container"><form class="form-wrap" id="jobForm"><div class="notice"><i class="fa-solid fa-circle-info"></i> Your job will be reviewed before it becomes public.</div><div class="form-group"><label>Job Title *</label><input name="title" required maxlength="160" placeholder="e.g. Logo design for my shop"></div><div class="form-group"><label>Description *</label><textarea name="description" required maxlength="5000" placeholder="Describe the work, timeline and expectations…"></textarea></div><div class="form-row"><div class="form-group"><label>Minimum Budget</label><input name="budgetMin" type="number" min="0" step="0.01"></div><div class="form-group"><label>Maximum Budget</label><input name="budgetMax" type="number" min="0" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Category</label><select name="category"><option value="">Select</option>'+CATS.map(c=>'<option>'+c+'</option>').join('')+'</select></div><div class="form-group"><label>Location</label><input name="location" value="Jaffna"></div></div><div class="form-group"><label>Skills (comma separated)</label><input name="skills" placeholder="e.g. Photoshop, Logo Design"></div><div class="form-group"><label>Contact</label><input name="contact" maxlength="200" placeholder="Phone or WhatsApp"></div><button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-paper-plane"></i> Submit for Approval</button></form></div>';
};

Pages['offer-service'] = () => {
  if (!Auth.user) return loginRequired('offer your skills');
  if (Auth.user.role !== 'FREELANCER') return '<div class="container"><div class="auth-wrap"><h2>Freelancer account required</h2><p class="sub">Create a Freelancer account to offer services.</p><a href="#/login" class="btn btn-primary btn-block">Switch account</a></div></div>';
  return '<div class="page-head"><div class="container"><h1><i class="fa-solid fa-hand-sparkles" style="color:var(--primary)"></i> Offer a Service</h1><p>Create your freelancer profile</p></div></div><div class="container"><form class="form-wrap" id="serviceForm"><div class="notice"><i class="fa-solid fa-circle-info"></i> Your profile will be reviewed before appearing publicly.</div><div class="form-group"><label>Headline</label><input name="headline" maxlength="160" placeholder="e.g. Graphic designer for Jaffna businesses"></div><div class="form-group"><label>Skills *</label><input name="skills" required placeholder="Graphic Design, Logo Design, Photoshop"></div><div class="form-group"><label>About You</label><textarea name="bio" maxlength="2000" placeholder="Tell clients about your experience…"></textarea></div><div class="form-row"><div class="form-group"><label>Experience Level</label><select name="experienceLevel"><option>BEGINNER</option><option>INTERMEDIATE</option><option>EXPERT</option></select></div><div class="form-group"><label>Hourly Rate (LKR)</label><input name="hourlyRate" type="number" min="0" step="0.01"></div></div><div class="form-group"><label>Availability</label><input name="availability" maxlength="200" placeholder="Weekdays / weekends / evenings"></div><button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-paper-plane"></i> Save Profile</button></form></div>';
};

Pages.login = () => {
  if (Auth.user) return '<div class="container"><div class="auth-wrap" style="text-align:center"><h2>You are already logged in.</h2><a href="#/" class="btn btn-primary btn-block">Go Home</a></div></div>';
  return '<div class="container"><div class="auth-wrap"><h2>Welcome 👋</h2><p class="sub">Login or create your free account</p><div class="auth-tabs"><button class="active" data-tab="login">Login</button><button data-tab="register">Register</button></div><form id="loginForm"><div class="form-group"><label>Email</label><input name="email" type="email" required></div><div class="form-group"><label>Password</label><input name="password" type="password" required></div><button class="btn btn-primary btn-block">Login</button></form><form id="registerForm" style="display:none"><div class="form-group"><label>Full Name</label><input name="displayName" required maxlength="100"></div><div class="form-group"><label>Email</label><input name="email" type="email" required></div><div class="form-group"><label>Password</label><input name="password" type="password" minlength="8" required></div><div class="form-group"><label>Account Type</label><select name="role"><option value="FREELANCER">Freelancer — I offer skills</option><option value="CLIENT">Client — I need workers</option></select></div><button class="btn btn-primary btn-block">Create Free Account</button></form></div></div>';
};

Pages.admin = async () => {
  if (!Auth.user || Auth.user.role !== 'ADMIN') return '<div class="container"><div class="auth-wrap"><h2>🛡️ Admin Access</h2><p class="sub">Administrators only.</p><a href="#/login" class="btn btn-primary btn-block">Login</a></div></div>';
  let d={counts:{}}; try { d=(await api('/admin/dashboard')).data; } catch(e) { return '<div class="container"><div class="empty">'+esc(e.message)+'</div></div>'; }
  return '<div class="page-head"><div class="container"><h1><i class="fa-solid fa-gauge-high" style="color:var(--primary)"></i> Admin Dashboard</h1><p>Moderate jobs and freelancer profiles</p></div></div><div class="container" style="padding-bottom:64px"><div class="admin-stats"><div class="stat-card"><div class="ico"><i class="fa-solid fa-hourglass-half"></i></div><div><b>'+d.counts.pendingJobs+d.counts.pendingFreelancers+'</b><span>Pending Approval</span></div></div><div class="stat-card"><div class="ico"><i class="fa-solid fa-briefcase"></i></div><div><b>'+d.counts.jobs+'</b><span>Total Jobs</span></div></div><div class="stat-card"><div class="ico"><i class="fa-solid fa-users"></i></div><div><b>'+d.counts.freelancers+'</b><span>Freelancers</span></div></div><div class="stat-card"><div class="ico"><i class="fa-solid fa-user-check"></i></div><div><b>'+d.counts.users+'</b><span>Users</span></div></div></div><div class="admin-tabs"><button class="active" data-atab="pending">⏳ Pending</button><button data-atab="jobs">💼 Jobs</button><button data-atab="freelancers">🧑‍💻 Freelancers</button><button data-atab="users">👥 Users</button></div><div id="adminContent"></div></div>';
};

Pages['job'] = async id => {
  try {
    const j=(await api('/jobs/'+encodeURIComponent(id))).data.job;
    const apply = Auth.user?.role === 'FREELANCER' ? '<form id="applyForm" class="form-wrap"><h3>Apply for this job</h3><textarea name="coverMessage" maxlength="2000" placeholder="Tell the client why you are suitable…"></textarea><button class="btn btn-primary btn-block">Send Application</button></form>' : '';
    return '<div class="container" style="padding:64px 20px"><div class="card"><h1>'+esc(j.title)+'</h1><div class="card-meta"><span>'+esc(j.category||'Other')+'</span><span>'+esc(j.location||'Jaffna')+'</span></div><p class="desc">'+esc(j.description)+'</p><h3>Budget</h3><p>'+((j.budgetMin||j.budgetMax)?fmtLKR(j.budgetMin||j.budgetMax):'Flexible')+'</p><p>Client: '+esc(j.client?.displayName||'Client')+'</p></div>'+apply+'</div>';
  } catch(e) { return '<div class="container"><div class="empty">'+esc(e.message)+'</div></div>'; }
};

Pages['freelancer'] = async id => {
  try {
    const f=(await api('/profile/freelancers/'+encodeURIComponent(id))).data.profile;
    return '<div class="container" style="padding:64px 20px"><div class="card f-card"><div class="f-avatar">'+esc(initials(f.displayName))+'</div><h1>'+esc(f.displayName)+'</h1><p>'+esc(f.freelancerProfile?.headline||'Freelancer')+'</p><div class="skill-tags">'+(f.freelancerProfile?.skills||[]).map(x=>'<span class="skill-tag">'+esc(x)+'</span>').join('')+'</div><p class="desc">'+esc(f.freelancerProfile?.bio||'')+'</p><p><strong>Experience:</strong> '+esc(f.freelancerProfile?.experienceLevel||'')+'</p><p><strong>Rate:</strong> '+fmtLKR(f.freelancerProfile?.hourlyRate)+'</p></div></div>';
  } catch(e) { return '<div class="container"><div class="empty">'+esc(e.message)+'</div></div>'; }
};

async function wire(route, parts) {
  if (route === 'jobs') {
    const render=async()=>{ const q=document.getElementById('jSearch').value.trim(); const cat=document.getElementById('jCat').value; let url='/jobs?limit=50'; if(q)url+='&search='+encodeURIComponent(q); if(cat)url+='&category='+encodeURIComponent(cat); try { const jobs=(await api(url)).data.jobs; document.getElementById('jobGrid').innerHTML=jobs.map(jobCard).join('')||'<div class="empty">No jobs match your filters.</div>'; } catch(e){document.getElementById('jobGrid').innerHTML='<div class="empty">'+esc(e.message)+'</div>'; } };
    ['jSearch','jCat'].forEach(id=>document.getElementById(id).addEventListener('input',render)); render();
  }
  if (route === 'freelancers') {
    const render=async()=>{ try { const r=await api('/profile/freelancers'); const list=r.data.profiles||[]; const q=document.getElementById('fSearch').value.toLowerCase(); const lvl=document.getElementById('fLevel').value; const filtered=list.filter(f=>{const p=f.freelancerProfile||{};return (!q||(f.displayName+' '+(p.headline||'')+' '+(p.skills||[]).join(' ')).toLowerCase().includes(q))&&(!lvl||p.experienceLevel===lvl)}); document.getElementById('fGrid').innerHTML=filtered.map(freelancerCard).join('')||'<div class="empty">No freelancers found.</div>'; }catch(e){document.getElementById('fGrid').innerHTML='<div class="empty">'+esc(e.message)+'</div>'; } };
    ['fSearch','fLevel'].forEach(id=>document.getElementById(id).addEventListener('input',render)); render();
  }
  const jf=document.getElementById('jobForm');
  if(jf) jf.onsubmit=async e=>{e.preventDefault();const f=new FormData(jf);try{await api('/jobs',{method:'POST',body:JSON.stringify({title:f.get('title'),description:f.get('description'),category:f.get('category')||null,location:f.get('location')||null,contact:f.get('contact')||null,skills:String(f.get('skills')||'').split(',').map(x=>x.trim()).filter(Boolean),budgetMin:f.get('budgetMin')||null,budgetMax:f.get('budgetMax')||null})});toast('Job submitted for admin approval! 🎉');go('/jobs');}catch(e){toast(e.message,'error');}};
  const sf=document.getElementById('serviceForm');
  if(sf) sf.onsubmit=async e=>{e.preventDefault();const f=new FormData(sf);try{await api('/profile/me',{method:'PATCH',body:JSON.stringify({headline:f.get('headline'),skills:String(f.get('skills')||'').split(',').map(x=>x.trim()).filter(Boolean),bio:f.get('bio'),experienceLevel:f.get('experienceLevel'),hourlyRate:f.get('hourlyRate')||null,availability:f.get('availability')})});toast('Freelancer profile saved for admin approval! 🎉');go('/freelancers');}catch(e){toast(e.message,'error');}};
  const af=document.getElementById('applyForm');
  if(af) af.onsubmit=async e=>{e.preventDefault();const f=new FormData(af);try{await api('/applications',{method:'POST',body:JSON.stringify({jobId:parts[1],coverMessage:f.get('coverMessage')})});toast('Application submitted! 🎉');af.remove();}catch(e){toast(e.message,'error');}};
  if(route==='login'){
    document.querySelectorAll('.auth-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.auth-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('loginForm').style.display=b.dataset.tab==='login'?'':'none';document.getElementById('registerForm').style.display=b.dataset.tab==='register'?'':'none';});
    const lf=document.getElementById('loginForm'); if(lf)lf.onsubmit=async e=>{e.preventDefault();const f=new FormData(lf);try{const u=await Auth.login(f.get('email'),f.get('password'));toast('Welcome back, '+u.displayName+'! 👋');go(u.role==='ADMIN'?'/admin':'/');}catch(e){toast(e.message,'error');}};
    const rf=document.getElementById('registerForm'); if(rf)rf.onsubmit=async e=>{e.preventDefault();const f=new FormData(rf);try{const u=await Auth.register(f.get('displayName'),f.get('email'),f.get('password'),f.get('role'));toast('Welcome to Jaffna Freelance Connect, '+u.displayName+'! 🎉');go('/');}catch(e){toast(e.message,'error');}};
  }
  if(route==='admin' && Auth.user?.role==='ADMIN') {
    const renderTab=async tab=>{const el=document.getElementById('adminContent');el.innerHTML='<div class="empty">Loading…</div>';try{
      if(tab==='pending'||tab==='freelancers'){const r=await api('/admin/freelancers?moderation='+ (tab==='pending'?'PENDING':'APPROVED') +'&limit=50');const rows=r.data.freelancers.map(x=>'<div class="admin-row"><div class="info"><h4>'+esc(x.user.displayName)+' '+badge(x.moderation,x.moderation==='APPROVED'?'badge-verified':'badge-new')+'</h4><p>'+esc(x.headline||'')+' · '+esc((x.skills||[]).join(', '))+'</p></div><div class="actions">'+(x.moderation!=='APPROVED'?'<button class="btn btn-green btn-sm" data-m="APPROVED" data-id="'+x.id+'">Approve</button>':'')+(x.moderation!=='REJECTED'?'<button class="btn btn-outline btn-sm" data-m="REJECTED" data-id="'+x.id+'">Reject</button>':'')+'</div></div>').join('');el.innerHTML='<div class="admin-table">'+(rows||'<div class="empty">None.</div>')+'</div>';el.querySelectorAll('[data-m]').forEach(b=>b.onclick=async()=>{try{await api('/admin/freelancers/'+b.dataset.id+'/moderation',{method:'PATCH',body:JSON.stringify({moderation:b.dataset.m})});toast('Freelancer updated.');renderTab(tab);}catch(e){toast(e.message,'error');}});}
      else if(tab==='jobs'){const r=await api('/admin/jobs?moderation=PENDING&limit=50');const rows=r.data.jobs.map(x=>'<div class="admin-row"><div class="info"><h4>'+esc(x.title)+' '+badge(x.moderation,'badge-new')+'</h4><p>'+esc(x.category||'Other')+' · '+fmtLKR(x.budgetMin||x.budgetMax)+' · '+esc(x.client.displayName)+'</p><p>'+esc(x.description.slice(0,160))+'…</p></div><div class="actions"><button class="btn btn-green btn-sm" data-m="APPROVED" data-id="'+x.id+'">Approve</button><button class="btn btn-outline btn-sm" data-m="REJECTED" data-id="'+x.id+'">Reject</button></div></div>').join('');el.innerHTML='<div class="admin-table">'+(rows||'<div class="empty">No pending jobs.</div>')+'</div>';el.querySelectorAll('[data-m]').forEach(b=>b.onclick=async()=>{try{await api('/admin/jobs/'+b.dataset.id+'/moderation',{method:'PATCH',body:JSON.stringify({moderation:b.dataset.m})});toast('Job moderation updated.');renderTab('jobs');}catch(e){toast(e.message,'error');}});}
      else {const r=await api('/admin/users?limit=50');el.innerHTML='<div class="admin-table">'+r.data.users.map(u=>'<div class="admin-row"><div class="info"><h4>'+esc(u.displayName)+' '+badge(u.role,'badge-level')+'</h4><p>'+esc(u.email)+' · '+esc(u.location||'No location')+'</p></div></div>').join('')+'</div>';}
    }catch(e){el.innerHTML='<div class="empty">'+esc(e.message)+'</div>';}};
    document.querySelectorAll('.admin-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.admin-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderTab(b.dataset.atab);}); renderTab('pending');
  }
}

function renderNav(){
  const el=document.getElementById('navAuth');
  if(Auth.user) el.innerHTML='<span class="nav-user">'+(Auth.user.role==='ADMIN'?'<a href="#/admin" class="btn btn-ghost btn-sm"><i class="fa-solid fa-shield-halved"></i> Admin</a>':'')+'<span class="avatar-chip" title="'+esc(Auth.user.displayName)+'">'+esc(initials(Auth.user.displayName))+'</span><button class="btn btn-outline btn-sm" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i></button></span>';
  else el.innerHTML='<a href="#/login" class="btn btn-primary btn-sm" style="margin-left:8px"><i class="fa-solid fa-right-to-bracket"></i> Login</a>';
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
  await Auth.load();
  await route();
})();
