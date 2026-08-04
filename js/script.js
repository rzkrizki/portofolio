// ---- boot overlay ----
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('boot').classList.add('hide'), 1900);
});
setTimeout(() => document.getElementById('boot').classList.add('hide'), 2600);

// ---- topographic contour background (slow ambient drift) ----
(function(){
  const canvas = document.getElementById('contourbg');
  const ctx = canvas.getContext('2d');
  let W, H;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let driftT = 0;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = document.documentElement.scrollHeight;
    canvas.style.height = H + 'px';
    draw();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    const lineCount = Math.max(14, Math.floor(H / 130));
    const spacing = H / lineCount;

    for(let i=0; i<lineCount; i++){
      const baseY = i * spacing + spacing * 0.5;
      // each contour line = sum of a few smooth sine waves, seeded per-line for variety
      const seed = i * 13.37;
      const amp1 = 26 + 14 * Math.sin(seed);
      const amp2 = 12 + 8 * Math.cos(seed * 1.7);
      const freq1 = 0.0032 + 0.0009 * Math.sin(seed * 0.5);
      const freq2 = 0.0071 + 0.0006 * Math.cos(seed * 0.9);
      const dir = i % 2 === 0 ? 1 : -1;
      const phase1 = seed * 2.1 + driftT * 0.15 * dir;
      const phase2 = seed * 3.4 - driftT * 0.1 * dir;

      ctx.beginPath();
      for(let x=0; x<=W; x+=6){
        const y = baseY
          + amp1 * Math.sin(x * freq1 + phase1)
          + amp2 * Math.sin(x * freq2 + phase2);
        if(x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      const opacity = 0.05 + (i % 3 === 0 ? 0.035 : 0);
      ctx.strokeStyle = `rgba(239,238,230,${opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // occasional small elevation label, like a map contour marker
      if(i % 5 === 2){
        ctx.font = "9px 'IBM Plex Mono', monospace";
        ctx.fillStyle = 'rgba(160,156,148,0.22)';
        const lx = (i * 220) % (W - 60) + 20;
        const ly = baseY
          + amp1 * Math.sin(lx * freq1 + phase1)
          + amp2 * Math.sin(lx * freq2 + phase2) - 6;
        ctx.fillText((120 + i * 8) + 'm', lx, ly);
      }
    }
  }

  let rzt;
  window.addEventListener('resize', () => { clearTimeout(rzt); rzt = setTimeout(resize, 200); });
  resize();

  if(!reduceMotion){
    let last = 0;
    function loop(ts){
      if(ts - last > 45){ // ~22fps, subtle & light
        driftT += 1;
        draw();
        last = ts;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();

// ---- ruler ticks generation ----
(function(){
  const g = document.querySelector('.ruler g');
  let ticks = '';
  for(let x=0; x<=1000; x+=20){
    const tall = x % 100 === 0;
    ticks += `<line x1="${x}" y1="1" x2="${x}" y2="${tall?14:8}" />`;
  }
  g.innerHTML = ticks;
})();

// ---- reveal on scroll ----
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => io.observe(el));

// ---- magnetic hover on CTA / contact buttons ----
const reduceMotion2 = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion2){
  document.querySelectorAll('.cta-link, .cbtn').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width/2;
      const my = e.clientY - r.top - r.height/2;
      el.style.transform = `translate(${mx*0.18}px, ${my*0.28}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });
}

// ---- drafting crosshair cursor on the spec panel ----
if(!reduceMotion2){
  const panel = document.getElementById('specPanel');
  if(panel){
    const cross = document.createElement('div');
    cross.id = 'draftCursor';
    cross.innerHTML = '<span class="cx"></span><span class="cy"></span><span class="coord"></span>';
    document.body.appendChild(cross);
    panel.addEventListener('mouseenter', () => cross.classList.add('show'));
    panel.addEventListener('mouseleave', () => cross.classList.remove('show'));
    panel.addEventListener('mousemove', (e) => {
      const r = panel.getBoundingClientRect();
      const x = Math.round(e.clientX - r.left);
      const y = Math.round(e.clientY - r.top);
      cross.style.left = e.clientX + 'px';
      cross.style.top = e.clientY + 'px';
      cross.querySelector('.coord').textContent = `X ${x} · Y ${y}`;
    });
  }
}

// ---- active nav link on scroll ----
(function(){
  const sections = ['about','experience','stack','projects','education','contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('nav.links a');
  const navIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.getAttribute('id');
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => navIo.observe(s));
})();

// ---- back to top button ----
(function(){
  const btn = document.getElementById('toTop');
  if(!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 700);
  });
})();

// ---- live Jakarta clock ----
(function(){
  const el = document.getElementById('localTime');
  if(!el) return;
  function tick(){
    const now = new Date();
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(now);
    const get = (t) => parts.find(p => p.type === t)?.value || '--';
    el.textContent = `${get('hour')}:${get('minute')}:${get('second')} WIB`;
  }
  tick();
  setInterval(tick, 1000);
})();

// ---- section index number tick-in ----
(function(){
  const ticks = document.querySelectorAll('.num-tick');
  const tio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const el = entry.target;
        const target = el.dataset.target;
        let n = 0;
        const steps = 6;
        const iv = setInterval(() => {
          n++;
          if(n >= steps){ el.textContent = target; clearInterval(iv); }
          else{ el.textContent = String(Math.floor(Math.random()*99)).padStart(2,'0'); }
        }, 45);
        tio.unobserve(el);
      }
    });
  }, { threshold: 0.6 });
  ticks.forEach(el => tio.observe(el));
})();

// ---- subtle parallax on hero photo ----
if(!reduceMotion2){
  const heroImg = document.querySelector('.photo-duotone img');
  if(heroImg){
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if(y < 900){ heroImg.style.transform = `translateY(${y * 0.06}px) scale(1.08)`; }
    }, { passive: true });
  }
}

// ---- language toggle (ID / EN) ----
(function(){
  const richText = {
    heroRole: {
      id: 'Insinyur backend asal Jakarta. <strong>5+ tahun</strong> merancang dan menjaga sistem yang melayani jutaan pembaca berita setiap hari, dari lonjakan trafik breaking news hingga permintaan pencarian real-time. Fokus saya: <span class="term">API</span> <span class="term">Caching</span> <span class="term">Search</span> yang cepat dan andal, dipadukan dengan fitur rekomendasi berbasis <span class="term">AI/ML</span> yang membuat pembaca terus kembali.',
      en: 'Backend engineer based in Jakarta. <strong>5+ years</strong> designing and maintaining systems that serve millions of news readers every day, from breaking-news traffic surges to real-time search demands. My focus: fast, reliable <span class="term">API</span> <span class="term">Caching</span> <span class="term">Search</span>, paired with AI/ML-driven recommendation features that keep readers coming back.'
    },
    aboutText: {
      id: 'Lulusan <strong>Computer Science</strong> dengan fokus pada <strong>backend development</strong> — terbiasa bekerja dengan <span class="term">Go</span> <span class="term">PHP</span> <span class="dim">(Laravel, CodeIgniter)</span> dan <span class="term">Node.js</span> untuk membangun REST API, sistem CMS, hingga fitur pencarian dan rekomendasi berskala tinggi. Berpengalaman merancang arsitektur yang mengandalkan <span class="term">Elasticsearch</span> untuk pencarian cepat, <span class="term">Redis</span> untuk caching, serta <span class="term">MySQL</span> <span class="term">PostgreSQL</span> dan <span class="term">MongoDB</span> sebagai penyimpanan data. Terbiasa memimpin tim kecil, berkoordinasi lintas tim frontend &amp; infrastruktur, dan menjaga sistem tetap stabil di bawah trafik tinggi.',
      en: 'A <strong>Computer Science</strong> graduate focused on <strong>backend development</strong> — experienced with <span class="term">Go</span> <span class="term">PHP</span> <span class="dim">(Laravel, CodeIgniter)</span> and <span class="term">Node.js</span> to build REST APIs, CMS platforms, and high-scale search and recommendation features. Skilled in designing architectures powered by <span class="term">Elasticsearch</span> for fast search, <span class="term">Redis</span> for caching, and <span class="term">MySQL</span> <span class="term">PostgreSQL</span> and <span class="term">MongoDB</span> for data storage. Comfortable leading small teams, coordinating with frontend &amp; infrastructure teams, and keeping systems stable under heavy traffic.'
    },
    contactP: {
      id: 'Terbuka untuk peluang <strong>backend</strong> / <strong>fullstack developer</strong>. Silakan hubungi lewat email atau WhatsApp.',
      en: 'Open to new <strong>backend</strong> / <strong>fullstack developer</strong> opportunities. Feel free to reach out via email or WhatsApp.'
    }
  };

  const toggle = document.getElementById('langToggle');
  if(toggle){
    let lang = 'id';

    function apply(){
      document.querySelectorAll('.i18n').forEach(el => {
        const text = el.dataset[lang];
        if(text !== undefined) el.textContent = text;
      });
      document.querySelectorAll('.i18n-placeholder').forEach(el => {
        const text = el.dataset[lang];
        if(text !== undefined) el.setAttribute('placeholder', text);
      });
      Object.keys(richText).forEach(key => {
        const el = document.getElementById(key);
        if(el) el.innerHTML = richText[key][lang];
      });
      document.documentElement.lang = lang;
      window.currentLang = lang;
      toggle.querySelector('.lt-id').classList.toggle('active', lang === 'id');
      toggle.querySelector('.lt-en').classList.toggle('active', lang === 'en');
      const toTopBtn = document.getElementById('toTop');
      if(toTopBtn) toTopBtn.setAttribute('aria-label', lang === 'id' ? 'Kembali ke atas' : 'Back to top');
    }

    window.setLang = function(next){
      if(next !== 'id' && next !== 'en') return;
      if(next === lang) return;
      lang = next;
      apply();
    };

    toggle.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => window.setLang(btn.dataset.lang));
    });
  }
})();

// ---- job entry expand / collapse ----
(function(){
  document.querySelectorAll('.job-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.job').classList.toggle('open');
    });
  });
})();

// ---- filter projects by tech (click a stack chip) ----
(function(){
  const chips = document.querySelectorAll('.stack-card .items span[data-tech]');
  const rows = document.querySelectorAll('.proj-row');
  const statusBar = document.getElementById('filterStatus');
  const techNameEl = document.getElementById('filterTechName');
  const clearBtn = document.getElementById('filterClear');
  let active = null;

  function setFilter(tech, label){
    active = tech;
    rows.forEach(row => {
      const techs = (row.dataset.tech || '').split(' ');
      row.classList.toggle('filtered-out', !!tech && !techs.includes(tech));
    });
    chips.forEach(c => c.classList.toggle('filter-active', c.dataset.tech === tech));
    if(tech){
      statusBar.classList.add('show');
      techNameEl.textContent = label;
    } else if(statusBar){
      statusBar.classList.remove('show');
    }
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if(active === chip.dataset.tech){ setFilter(null, ''); }
      else{
        setFilter(chip.dataset.tech, chip.textContent);
        const projSection = document.getElementById('projects');
        if(projSection) projSection.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
  if(clearBtn) clearBtn.addEventListener('click', () => setFilter(null, ''));
})();

// ---- scroll progress: side ruler + navbar bar ----
(function(){
  const fill = document.getElementById('rulerFill');
  const dot = document.getElementById('rulerDot');
  const pct = document.getElementById('rulerPctTop');
  const navBar = document.getElementById('navProgress');

  function update(){
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? Math.min(100, Math.max(0, (scrolled / max) * 100)) : 0;
    if(fill){ fill.style.height = p + '%'; dot.style.top = p + '%'; pct.textContent = Math.round(p) + '%'; }
    if(navBar){ navBar.style.width = p + '%'; }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
// ---- shared toast helper ----
let hideToastTimer;
function showToast(msgText){
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  if(!toast || !msgEl) return;
  msgEl.textContent = msgText;
  toast.classList.add('show');
  clearTimeout(hideToastTimer);
  hideToastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---- download CV confirmation toast ----
(function(){
  const btn = document.getElementById('downloadCv');
  if(!btn) return;
  btn.addEventListener('click', () => {
    const lang = window.currentLang || 'id';
    showToast(lang === 'id' ? 'CV terunduh' : 'CV downloaded');
  });
})();

// ---- copy email to clipboard ----
(function(){
  const btn = document.getElementById('copyEmailBtn');
  const emailEl = document.getElementById('emailText');
  if(!btn || !emailEl) return;
  btn.addEventListener('click', async () => {
    const email = emailEl.textContent.trim();
    const lang = window.currentLang || 'id';
    try{
      await navigator.clipboard.writeText(email);
    }catch(e){
      const ta = document.createElement('textarea');
      ta.value = email; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    btn.classList.add('copied');
    showToast(lang === 'id' ? 'Email disalin' : 'Email copied');
    setTimeout(() => btn.classList.remove('copied'), 1500);
  });
})();

// ---- command palette (Cmd/Ctrl+K) ----
(function(){
  const overlay = document.getElementById('cmdPalette');
  const input = document.getElementById('cmdInput');
  const results = document.getElementById('cmdResults');
  const openBtn = document.getElementById('cmdOpenBtn');
  if(!overlay || !input || !results) return;

  function items(){
    const lang = window.currentLang || 'id';
    const t = (id, en) => lang === 'id' ? id : en;
    return [
      { label: t('Tentang', 'About'), sub: t('Bagian', 'Section'), action: () => go('#about') },
      { label: t('Pengalaman Kerja', 'Work Experience'), sub: t('Bagian', 'Section'), action: () => go('#experience') },
      { label: 'Stack', sub: t('Bagian', 'Section'), action: () => go('#stack') },
      { label: t('Proyek Unggulan', 'Featured Projects'), sub: t('Bagian', 'Section'), action: () => go('#projects') },
      { label: t('Pendidikan', 'Education'), sub: t('Bagian', 'Section'), action: () => go('#education') },
      { label: t('Kontak', 'Contact'), sub: t('Bagian', 'Section'), action: () => go('#contact') },
      { label: t('Fitur Geolocation iNews', 'iNews Geolocation Feature'), sub: t('Proyek', 'Project'), action: () => go('#projects') },
      { label: '"For You" — Okezone', sub: t('Proyek', 'Project'), action: () => go('#projects') },
      { label: 'Orion SSO', sub: t('Proyek', 'Project'), action: () => go('#projects') },
      { label: t('API & CMS Logistik', 'Logistics API & CMS'), sub: t('Proyek', 'Project'), action: () => go('#projects') },
      { label: t('E-Recap Pemilu 2020', '2020 Election E-Recap'), sub: t('Proyek', 'Project'), action: () => go('#projects') },
      { label: t('Unduh CV', 'Download CV'), sub: t('Aksi', 'Action'), action: () => document.getElementById('downloadCv')?.click() },
      { label: t('Kirim Email', 'Send Email'), sub: t('Aksi', 'Action'), action: () => window.location.href = 'mailto:rrizki.rmdhan@gmail.com' },
      { label: t('Salin Email', 'Copy Email'), sub: t('Aksi', 'Action'), action: () => document.getElementById('copyEmailBtn')?.click() },
      { label: 'WhatsApp', sub: t('Aksi', 'Action'), action: () => window.open('https://wa.me/6281991910964', '_blank') },
      { label: 'GitHub', sub: t('Aksi', 'Action'), action: () => window.open('https://github.com/rzkrizki', '_blank') },
      { label: t('Ganti Bahasa (ID/EN)', 'Switch Language (ID/EN)'), sub: t('Aksi', 'Action'), action: () => window.setLang && window.setLang(lang === 'id' ? 'en' : 'id') },
      { label: t('Kembali ke Atas', 'Back to Top'), sub: t('Aksi', 'Action'), action: () => go('#top') },
    ];
  }

  function go(hash){
    close();
    const el = document.querySelector(hash);
    if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  let filtered = [];
  let activeIndex = 0;

  function render(){
    const q = input.value.trim().toLowerCase();
    filtered = items().filter(it => it.label.toLowerCase().includes(q));
    activeIndex = 0;
    if(filtered.length === 0){
      const lang = window.currentLang || 'id';
      results.innerHTML = `<div class="cmd-empty">${lang === 'id' ? 'Tidak ada hasil' : 'No results'}</div>`;
      return;
    }
    results.innerHTML = filtered.map((it, i) =>
      `<div class="cmd-item${i===0?' active':''}" data-i="${i}"><span class="cmd-label">${it.label}</span><span class="cmd-sub">${it.sub}</span></div>`
    ).join('');
    results.querySelectorAll('.cmd-item').forEach(el => {
      el.addEventListener('mouseenter', () => setActive(parseInt(el.dataset.i)));
      el.addEventListener('click', () => filtered[parseInt(el.dataset.i)].action());
    });
  }

  function setActive(i){
    activeIndex = i;
    results.querySelectorAll('.cmd-item').forEach((el, idx) => el.classList.toggle('active', idx === i));
    const activeEl = results.querySelector('.cmd-item.active');
    if(activeEl) activeEl.scrollIntoView({ block:'nearest' });
  }

  function open(){
    overlay.classList.add('show');
    input.value = '';
    render();
    setTimeout(() => input.focus(), 50);
    document.body.style.overflow = 'hidden';
  }
  function close(){
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', (e) => {
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      overlay.classList.contains('show') ? close() : open();
    } else if(e.key === 'Escape' && overlay.classList.contains('show')){
      close();
    } else if(overlay.classList.contains('show')){
      if(e.key === 'ArrowDown'){ e.preventDefault(); if(filtered.length) setActive((activeIndex+1) % filtered.length); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); if(filtered.length) setActive((activeIndex-1+filtered.length) % filtered.length); }
      else if(e.key === 'Enter'){ e.preventDefault(); if(filtered[activeIndex]) filtered[activeIndex].action(); }
    }
  });

  input.addEventListener('input', render);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
  if(openBtn) openBtn.addEventListener('click', open);
})();

