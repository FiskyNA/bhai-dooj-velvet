(function () {
  const preloader = document.getElementById('preloader');
  const envelopeStage = document.getElementById('stage-envelope');
  const envelope = document.getElementById('envelope');
  const journey = document.getElementById('journey');
  const pages = Array.from(document.querySelectorAll('.page'));
  const dotsWrap = document.getElementById('page-dots');
  let current = 0;
  let isAnimating = false;
  let touchStartY = 0;
  let sfxOn = true;
  let audioCtx = null;

  // Preloader: wait a bit for feel + window load
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hide');
      setTimeout(() => preloader.classList.add('hidden'), 800);
    }, 1200);
  });

  // Envelope open
  function openEnvelope() {
    if (envelope.classList.contains('open')) return;
    envelope.classList.add('open');
    burstSparkles(window.innerWidth / 2, window.innerHeight / 2, 24);
    setTimeout(() => {
      envelopeStage.classList.remove('active');
      envelopeStage.classList.add('hidden');
      journey.classList.remove('hidden');
      updatePages();
      burstSparkles(window.innerWidth / 2, window.innerHeight / 3, 18);
    }, 1100);
  }
  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); } });

  // Page turn navigation
  function buildDots() {
    pages.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to page ' + (i + 1));
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });
  }
  buildDots();

  function updatePages() {
    pages.forEach((p, i) => {
      p.classList.remove('current', 'prev', 'next');
      if (i === current) p.classList.add('current');
      else if (i < current) p.classList.add('prev');
      else p.classList.add('next');
    });
    dotsWrap.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === current));
    // closing sparkles
    if (current === pages.length - 1) {
      setTimeout(() => burstSparkles(window.innerWidth / 2, window.innerHeight * 0.45, 20), 400);
    }
  }

  function ensureAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    return audioCtx;
  }
  function playPageTurn() {
    if (!sfxOn) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // soft paper whoosh
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.25);
  }

  function goTo(idx) {
    if (isAnimating || idx < 0 || idx >= pages.length || idx === current) return;
    isAnimating = true;
    playPageTurn();
    current = idx;
    updatePages();
    setTimeout(() => { isAnimating = false; }, 850);
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // Wheel scroll -> page turns (when journey visible)
  window.addEventListener('wheel', (e) => {
    if (journey.classList.contains('hidden')) return;
    // let inner scroll areas scroll if needed
    const inner = e.target.closest('.page-inner');
    if (inner) {
      const canDown = inner.scrollTop + inner.clientHeight < inner.scrollHeight - 2;
      const canUp = inner.scrollTop > 2;
      if ((e.deltaY > 0 && canDown) || (e.deltaY < 0 && canUp)) return;
    }
    e.preventDefault();
    if (isAnimating) return;
    if (e.deltaY > 30) next();
    else if (e.deltaY < -30) prev();
  }, { passive: false });

  // Touch swipe for page turns
  window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (journey.classList.contains('hidden')) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    const inner = e.target.closest('.page-inner');
    if (inner) {
      const canDown = inner.scrollTop + inner.clientHeight < inner.scrollHeight - 2;
      const canUp = inner.scrollTop > 2;
      if ((dy > 0 && canDown) || (dy < 0 && canUp)) return;
    }
    if (Math.abs(dy) > 50) { dy > 0 ? next() : prev(); }
  }, { passive: true });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (journey.classList.contains('hidden')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') next();
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') prev();
  });

  // Sparkles
  const sparkleLayer = document.getElementById('sparkle-layer');
  function burstSparkles(x, y, count) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 40 + Math.random() * 120;
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      const colors = ['#fff7a1','#ff9800','#ff5252','#ffd54f','#fff'];
      s.style.background = `radial-gradient(circle, ${colors[i % colors.length]}, #ff9800)`;
      sparkleLayer.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    }
  }

  // Phuljhadi button
  const phuljhadiBtn = document.getElementById('phuljhadi-btn');
  phuljhadiBtn.addEventListener('click', (e) => {
    const r = phuljhadiBtn.getBoundingClientRect();
    burstSparkles(r.left + r.width / 2, r.top, 30);
    burstSparkles(window.innerWidth * 0.5, window.innerHeight * 0.35, 25);
    phuljhadiBtn.textContent = 'Phuljhadi lit! 🎆✨';
    phuljhadiBtn.disabled = true;
    const glow = document.querySelector('.scene-glow');
    if (glow) glow.style.opacity = '1';
  });

  // Diyas
  const diyas = Array.from(document.querySelectorAll('.diya'));
  const roomGlow = document.getElementById('room-glow');
  const diyaMsg = document.getElementById('diya-msg');
  function updateRoomGlow() {
    const lit = diyas.filter(d => d.classList.contains('lit')).length;
    roomGlow.className = 'room-glow lit-' + lit;
    if (lit === diyas.length) {
      diyaMsg.classList.remove('hidden');
      diyaMsg.classList.add('show');
      burstSparkles(window.innerWidth / 2, window.innerHeight / 2, 22);
    }
  }
  diyas.forEach(d => d.addEventListener('click', () => {
    if (d.classList.contains('lit')) return;
    d.classList.add('lit');
    d.setAttribute('data-lit', 'true');
    const r = d.getBoundingClientRect();
    burstSparkles(r.left + r.width / 2, r.top, 10);
    updateRoomGlow();
  }));

  // Flip cards
  document.querySelectorAll('.flip-card').forEach(card => {
    const toggle = (e) => {
      card.classList.toggle('flipped');
      const r = card.getBoundingClientRect();
      burstSparkles(r.left + r.width/2, r.top + r.height/2, 10);
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
  });

  // Sweets
  const sweetMsg = document.getElementById('sweet-msg');
  document.querySelectorAll('.sweet').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.getAttribute('data-msg');
      sweetMsg.textContent = msg;
      sweetMsg.classList.remove('hidden');
      sweetMsg.classList.add('show');
      const r = btn.getBoundingClientRect();
      burstSparkles(r.left + r.width / 2, r.top, 12);
    });
  });

  // Wheel gallery
  const wheel = document.getElementById('wheel');
  const polaroids = Array.from(wheel.querySelectorAll('.polaroid'));
  const total = polaroids.length;
  let wheelIndex = 0;
  function layoutWheel() {
    const radius = Math.min(wheel.clientWidth, 420) * 0.55;
    polaroids.forEach((p, i) => {
      const offset = i - wheelIndex;
      const angle = offset * (360 / total);
      const rad = angle * Math.PI / 180;
      const x = Math.sin(rad) * radius;
      const z = Math.cos(rad) * radius - radius;
      const scale = offset === 0 ? 1.15 : 0.85;
      const opacity = Math.abs(offset) > 2 ? 0 : (offset === 0 ? 1 : 0.7);
      p.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${angle * 0.3}deg) scale(${scale})`;
      p.style.opacity = opacity;
      p.style.zIndex = offset === 0 ? 5 : 1;
    });
  }
  function wheelNext() { wheelIndex = (wheelIndex + 1) % total; layoutWheel(); }
  function wheelPrev() { wheelIndex = (wheelIndex - 1 + total) % total; layoutWheel(); }
  document.getElementById('wheel-next').addEventListener('click', (e) => { e.stopPropagation(); wheelNext(); });
  document.getElementById('wheel-prev').addEventListener('click', (e) => { e.stopPropagation(); wheelPrev(); });
  let wheelStartX = 0;
  wheel.addEventListener('pointerdown', (e) => { wheelStartX = e.clientX; wheel.setPointerCapture(e.pointerId); });
  wheel.addEventListener('pointerup', (e) => {
    const dx = e.clientX - wheelStartX;
    if (Math.abs(dx) > 30) dx < 0 ? wheelNext() : wheelPrev();
  });
  window.addEventListener('resize', layoutWheel);
  layoutWheel();

  // Gallery lightbox + auto-load images (1.jpg, 2.png etc. from assets/photos/)
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    const frames = Array.from(galleryGrid.querySelectorAll('.photo-frame'));
    frames.forEach((frame, idx) => {
      const n = frame.getAttribute('data-slot') || (idx + 1);
      const exts = ['jpg','jpeg','png','webp','gif'];
      const tryLoad = (i) => {
        if (i >= exts.length) return;
        const img = new Image();
        const src = `assets/photos/${n}.${exts[i]}`;
        img.onload = () => {
          frame.classList.remove('placeholder');
          frame.innerHTML = '';
          img.alt = `Photo ${n} - Velvet & Kaddu Bhaiya`;
          img.loading = 'lazy';
          frame.appendChild(img);
        };
        img.onerror = () => tryLoad(i + 1);
        img.src = src;
      };
      tryLoad(0);
    });
    galleryGrid.addEventListener('click', (e) => {
      const img = e.target.closest('.photo-frame')?.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.src;
      lightbox.classList.remove('hidden');
    });
  }
  document.getElementById('lightbox-close').addEventListener('click', () => lightbox.classList.add('hidden'));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.add('hidden'); });

  // Closing title wobble letters
  const closingTitle = document.getElementById('closing-title');
  if (closingTitle) {
    const text = closingTitle.textContent;
    closingTitle.textContent = '';
    [...text].forEach(ch => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      closingTitle.appendChild(span);
    });
  }

  // Music player (placeholder playlist - user adds files to assets/music/)
  const playlist = [
    // Add your files here, e.g. { title: 'Raske Kamar', src: 'assets/music/raske-kamar.mp3' }
  ];
  let track = 0;
  const audio = document.getElementById('audio');
  const toggleBtn = document.getElementById('music-toggle');
  const nextBtn = document.getElementById('music-next');
  const titleEl = document.getElementById('music-title');
  const eq = document.getElementById('eq');

  function loadTrack(i) {
    if (!playlist.length) return;
    track = (i + playlist.length) % playlist.length;
    audio.src = playlist[track].src;
    titleEl.textContent = playlist[track].title;
  }
  function updateMusicUI() {
    const playing = !audio.paused && playlist.length;
    toggleBtn.textContent = playing ? '⏸' : '▶';
    eq.classList.toggle('hidden', !playing);
  }
  toggleBtn.addEventListener('click', async () => {
    if (!playlist.length) { titleEl.textContent = 'Add songs in assets/music/'; return; }
    if (!audio.src) loadTrack(0);
    if (audio.paused) { try { await audio.play(); } catch(e) {} } else { audio.pause(); }
    updateMusicUI();
  });
  nextBtn.addEventListener('click', async () => {
    if (!playlist.length) return;
    loadTrack(track + 1);
    try { await audio.play(); } catch(e) {}
    updateMusicUI();
  });
  audio.addEventListener('ended', () => { if (playlist.length) { loadTrack(track + 1); audio.play().catch(()=>{}); } });
  audio.addEventListener('play', updateMusicUI);
  audio.addEventListener('pause', updateMusicUI);

  // SFX toggle (page turn sound)
  const sfxBtn = document.getElementById('sfx-toggle');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      sfxOn = !sfxOn;
      sfxBtn.textContent = sfxOn ? '🔊' : '🔇';
      sfxBtn.setAttribute('aria-label', sfxOn ? 'Mute page turn sound' : 'Enable page turn sound');
      if (sfxOn) { ensureAudioCtx(); playPageTurn(); }
    });
  }
  // unlock audio context on first interaction
  ['click','touchstart','keydown'].forEach(ev => window.addEventListener(ev, () => ensureAudioCtx(), { once: true, passive: true }));

  // Scene parallax & ambient sparkles
  const sceneWrap = document.getElementById('scene-wrap');
  if (sceneWrap) {
    sceneWrap.addEventListener('mousemove', (e) => {
      const r = sceneWrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      const img = sceneWrap.querySelector('.scene-img, .fallback-svg');
      if (img) img.style.transform = `scale(1.04) translate(${x*-10}px, ${y*-6}px)`;
      sceneWrap.querySelectorAll('.float-lantern, .petal, .star').forEach((el, i) => {
        const d = (i % 3 + 1) * 6;
        el.style.transform = `translate(${x*d}px, ${y*d}px)`;
      });
    });
    sceneWrap.addEventListener('mouseleave', () => {
      const img = sceneWrap.querySelector('.scene-img, .fallback-svg');
      if (img) img.style.transform = '';
    });
    setInterval(() => {
      if (journey.classList.contains('hidden') || current !== 0) return;
      const r = sceneWrap.getBoundingClientRect();
      burstSparkles(r.left + 30 + Math.random()*(r.width-60), r.top + 20 + Math.random()*60, 3);
    }, 2200);
  }

  // Wish spinner
  const spinBtn = document.getElementById('spin-wish');
  const wishWheel = document.getElementById('wish-wheel');
  const wishResult = document.getElementById('wish-result');
  const wishes = [
    "You make days brighter, Pyari Velvet! ✨",
    "Aapki vibes sabse cutest hain! 💛",
    "Kaddu Bhaiya is always proud of you 🌼",
    "Unlimited smiles aur khushiyaan for you 😊",
    "Aapke saath yeh bond bohot special hai 💫",
    "Aapka Kaddu Bhaiya hamesha aapke saath hai 🤝"
  ];
  let wishRot = 0;
  if (spinBtn && wishWheel) {
    spinBtn.addEventListener('click', () => {
      const pick = Math.floor(Math.random() * wishes.length);
      const extra = 360 * (3 + Math.floor(Math.random()*2));
      const seg = 360 / wishes.length;
      wishRot += extra + (360 - (pick * seg) - seg/2) - (wishRot % 360);
      wishWheel.style.transform = `rotate(${wishRot}deg)`;
      spinBtn.disabled = true;
      setTimeout(() => {
        wishResult.textContent = wishes[pick];
        wishResult.classList.remove('hidden');
        wishResult.classList.add('show');
        burstSparkles(window.innerWidth/2, window.innerHeight/2, 28);
        spinBtn.disabled = false;
      }, 2600);
    });
  }

  // Virtual tilak (supports optional photo: assets/photos/tilak.jpg|png|jpeg|webp)
  const tilakBtn = document.getElementById('tilak-btn');
  const tilakWrap = document.getElementById('tilak-photo-wrap');
  const tilakPhoto = document.getElementById('tilak-photo');
  const tilakMsg = document.getElementById('tilak-msg');
  if (tilakPhoto && tilakWrap) {
    const tryTilak = (i) => {
      const exts = ['jpg','jpeg','png','webp'];
      if (i >= exts.length) return;
      const src = `assets/photos/tilak.${exts[i]}`;
      const img = new Image();
      img.onload = () => { tilakPhoto.src = src; tilakPhoto.classList.remove('hidden'); tilakWrap.classList.add('has-photo'); };
      img.onerror = () => tryTilak(i + 1);
      img.src = src;
    };
    tryTilak(0);
  }
  if (tilakBtn && tilakWrap) {
    tilakBtn.addEventListener('click', () => {
      tilakWrap.classList.add('applied');
      tilakMsg.classList.remove('hidden');
      tilakMsg.classList.add('show');
      const r = tilakWrap.getBoundingClientRect();
      burstSparkles(r.left + r.width/2, r.top + r.height*0.2, 24);
      tilakBtn.textContent = 'Tilak Applied ✅';
      tilakBtn.disabled = true;
    });
  }

  // Extra confetti
  const confettiBtn = document.getElementById('confetti-btn');
  if (confettiBtn) {
    confettiBtn.addEventListener('click', () => {
      for (let i=0;i<5;i++) setTimeout(() => burstSparkles(Math.random()*window.innerWidth, Math.random()*window.innerHeight*0.7, 18), i*120);
    });
  }
})();
