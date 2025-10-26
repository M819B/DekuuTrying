
/* Dekuu App JS — unique micro-interactions and demo auth */

const $ = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));

// Active nav
(function(){
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href===page) a.classList.add('active-link');
  });
})();

// IntersectionObserver for reveal
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); obs.unobserve(e.target);} });
},{ threshold:.12 });
$$('.reveal').forEach(el=> obs.observe(el));

// Simple auth (demo only). DO NOT use in production.
const AUTH_KEY = 'dekuu_auth_v1';
const EMAIL_TO = 'mujtaba819best@gmail.com';

function authRead(){ try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || {users:{}, session:null}; } catch{ return {users:{}, session:null}; } }
function authWrite(v){ localStorage.setItem(AUTH_KEY, JSON.stringify(v)); }
function session(){ return authRead().session; }

async function sha256(t){
  const enc = new TextEncoder().encode(t);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function refreshAuthUI(){
  const tgt = $('#navAuth'); if(!tgt) return;
  const s = session();
  if(s){
    tgt.innerHTML = `<a class="btn small" href="profile.html">Profile</a> <a class="btn small ghost" id="logout">Logout</a>`;
    $('#logout')?.addEventListener('click', (e)=>{ e.preventDefault(); const d=authRead(); d.session=null; authWrite(d); location.href='index.html'; });
  }else{
    tgt.innerHTML = `<a class="btn small" href="login.html">Login</a> <a class="btn small ghost" href="signup.html">Sign up</a>`;
  }
}
refreshAuthUI();

// Register
async function onSignup(e){
  e.preventDefault();
  const name = $('#s_name').value.trim();
  const email = $('#s_email').value.trim().toLowerCase();
  const pass = $('#s_pass').value;
  const pass2 = $('#s_pass2').value;
  const out = $('#s_out');
  if(!name || !email || !pass) return outSet(out, 'Please fill all fields.', true);
  if(pass!==pass2) return outSet(out, 'Passwords do not match.', true);
  const db = authRead();
  if(db.users[email]) return outSet(out, 'Email already exists.', true);
  const hash = await sha256(pass);
  db.users[email] = {name, email, hash, createdAt: Date.now()};
  db.session = {email, name};
  authWrite(db);
  outSet(out, 'Account created. Redirecting…');
  setTimeout(()=> location.href='profile.html', 600);
}

// Login
async function onLogin(e){
  e.preventDefault();
  const email = $('#l_email').value.trim().toLowerCase();
  const pass = $('#l_pass').value;
  const out = $('#l_out');
  const db = authRead();
  const u = db.users[email];
  if(!u) return outSet(out, 'User not found.', true);
  const hash = await sha256(pass);
  if(hash !== u.hash) return outSet(out, 'Incorrect password.', true);
  db.session = {email, name:u.name};
  authWrite(db);
  outSet(out, 'Logged in. Redirecting…');
  setTimeout(()=> location.href='profile.html', 500);
}

function outSet(el, msg, err=false){ el.className = 'alert ' + (err?'err':'ok'); el.textContent = msg; }

// Profile
function loadProfile(){
  const s = session();
  if(!s){ location.href='login.html'; return; }
  $('#pf_name').textContent = s.name || s.email;
  $('#pf_email').textContent = s.email;
}

// Contact — mailto to your address; replace with Formspree if you want true backend.
function onContact(e){
  e.preventDefault();
  const name = $('#c_name').value.trim();
  const email = $('#c_email').value.trim();
  const msg = $('#c_msg').value.trim();
  const out = $('#c_out');
  if(!name || !email || !msg) return outSet(out, 'Please fill all fields.', true);

  // Build mailto
  const subject = encodeURIComponent('Dekuu Contact — ' + name);
  const body = encodeURIComponent(`${msg}\n\nFrom: ${name} <${email}>`);
  location.href = `mailto:${EMAIL_TO}?subject=${subject}&body=${body}`;
  outSet(out, 'Opening your email app to send…');
}

// Blog loader
async function loadPosts(){
  const wrap = $('#posts');
  if(!wrap) return;
  try{
    const res = await fetch('posts.json');
    const posts = await res.json();
    wrap.innerHTML = posts.map(p => `
      <article class="post reveal">
        <h4>${p.title}</h4>
        <div class="meta">${new Date(p.date).toLocaleDateString()} • ${p.category}</div>
        <p>${p.excerpt}</p>
        ${p.link ? `<a class="btn small" href="${p.link}">Read more</a>` : ''}
      </article>
    `).join('');
    $$('.post.reveal').forEach(el=>obs.observe(el));
  }catch(e){
    wrap.innerHTML = '<div class="alert err">Could not load posts.</div>';
  }
}

// Page boot
document.addEventListener('DOMContentLoaded', ()=>{
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if(page==='signup.html') $('#s_form')?.addEventListener('submit', onSignup);
  if(page==='login.html') $('#l_form')?.addEventListener('submit', onLogin);
  if(page==='contact.html') $('#c_form')?.addEventListener('submit', onContact);
  if(page==='profile.html') loadProfile();
  if(page==='info.html' || page==='blog.html') loadPosts();
});
