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
    // closing fireworks finale
    if (current === pages.length - 1) {
      setTimeout(() => { launchFireworks(); burstSparkles(window.innerWidth / 2, window.innerHeight * 0.45, 30); }, 350);
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

  // Diyas + secret (tap any diya 5 times to unlock)
  const diyas = Array.from(document.querySelectorAll('.diya'));
  const roomGlow = document.getElementById('room-glow');
  const diyaMsg = document.getElementById('diya-msg');
  const diyaSecret = document.getElementById('diya-secret');
  let secretUnlocked = false;
  function updateRoomGlow() {
    const lit = diyas.filter(d => d.classList.contains('lit')).length;
    roomGlow.className = 'room-glow lit-' + lit;
    if (lit === diyas.length) {
      diyaMsg.classList.remove('hidden');
      diyaMsg.classList.add('show');
      burstSparkles(window.innerWidth / 2, window.innerHeight / 2, 22);
    }
  }
  diyas.forEach(d => {
    d._taps = 0;
    d.addEventListener('click', () => {
      d._taps++;
      const r = d.getBoundingClientRect();
      if (!d.classList.contains('lit')) {
        d.classList.add('lit');
        d.setAttribute('data-lit', 'true');
        burstSparkles(r.left + r.width / 2, r.top, 10);
        updateRoomGlow();
      } else {
        burstSparkles(r.left + r.width / 2, r.top, 6);
      }
      if (!secretUnlocked && d._taps >= 5 && diyaSecret) {
        secretUnlocked = true;
        diyaSecret.classList.remove('hidden');
        diyaSecret.classList.add('show');
        burstSparkles(r.left + r.width / 2, r.top, 30);
        burstSparkles(window.innerWidth / 2, window.innerHeight / 2, 20);
      }
    });
  });

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

  // Music player
  const playlist = [
    { title: 'Raske Kamar', src: 'assets/music/Raske Kamar.mp3' },
    { title: 'Cat Sahiba', src: 'assets/music/Cat Sahiba.mp4' }
  ];
  let track = 0;
  let builtinPlaying = false;
  let builtinTimer = null;
  let builtinStep = 0;
  const audio = document.getElementById('audio');
  const toggleBtn = document.getElementById('music-toggle');
  const nextBtn = document.getElementById('music-next');
  const titleEl = document.getElementById('music-title');
  const eq = document.getElementById('eq');
  const volumeSlider = document.getElementById('music-volume');
  if (audio) audio.volume = 0.8;
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => { if (audio) audio.volume = volumeSlider.value / 100; });
  }

  function playBuiltinNote(freq, start, dur, vol=0.05) {
    const ctx = ensureAudioCtx(); if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.02);
  }
  function stopBuiltin() {
    builtinPlaying = false;
    if (builtinTimer) clearTimeout(builtinTimer);
    builtinTimer = null;
  }
  function startBuiltin() {
    const ctx = ensureAudioCtx(); if (!ctx) return;
    builtinPlaying = true;
    const melody = [523.25,659.25,783.99,659.25,698.46,783.99,880,783.99,659.25,587.33,659.25,523.25];
    const beat = 0.28;
    const loop = () => {
      if (!builtinPlaying) return;
      const now = ctx.currentTime + 0.05;
      for (let i=0;i<4;i++) {
        const f = melody[(builtinStep + i) % melody.length];
        playBuiltinNote(f, now + i*beat, beat*0.9, i%2===0?0.045:0.03);
        if (i%2===0) playBuiltinNote(f/2, now + i*beat, beat*0.85, 0.02);
      }
      builtinStep = (builtinStep + 4) % melody.length;
      builtinTimer = setTimeout(loop, beat*4*1000);
    };
    loop();
  }

  function loadTrack(i) {
    if (!playlist.length) return;
    stopBuiltin();
    audio.pause();
    track = (i + playlist.length) % playlist.length;
    const t = playlist[track];
    titleEl.textContent = t.title;
    if (t.type !== 'builtin') {
      audio.src = t.src;
    } else {
      audio.removeAttribute('src');
      audio.load();
    }
  }
  function updateMusicUI() {
    const t = playlist[track];
    const playing = t && t.type === 'builtin' ? builtinPlaying : (!audio.paused && !!audio.src);
    toggleBtn.textContent = playing ? '⏸' : '▶';
    eq.classList.toggle('hidden', !playing);
  }
  toggleBtn.addEventListener('click', async () => {
    if (!playlist.length) return;
    if (!titleEl.textContent || titleEl.textContent.includes('Add your songs')) loadTrack(track);
    const t = playlist[track];
    if (t.type === 'builtin') {
      if (builtinPlaying) stopBuiltin(); else startBuiltin();
    } else {
      if (!audio.src) loadTrack(track);
      if (audio.paused) { try { await audio.play(); } catch(e) {} } else { audio.pause(); }
    }
    updateMusicUI();
  });
  nextBtn.addEventListener('click', async () => {
    if (!playlist.length) return;
    loadTrack(track + 1);
    const t = playlist[track];
    if (t.type === 'builtin') startBuiltin();
    else { try { await audio.play(); } catch(e) {} }
    updateMusicUI();
  });
  audio.addEventListener('ended', () => { if (playlist.length) { loadTrack(track + 1); const t=playlist[track]; if(t.type==='builtin') startBuiltin(); else audio.play().catch(()=>{}); updateMusicUI(); } });
  audio.addEventListener('play', updateMusicUI);
  audio.addEventListener('pause', updateMusicUI);
  loadTrack(0);

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

  // Global cool click sparkles
  document.addEventListener('click', (e) => {
    if (journey.classList.contains('hidden')) return;
    if (e.target.closest('button,a,.flip-card,.sweet,.polaroid,.photo-frame')) return;
    burstSparkles(e.clientX, e.clientY, 6);
  });

  // 3D tilt on flip cards
  document.querySelectorAll('.flip-card:not(.main-card)').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - 0.5;
      const y = (e.clientY - r.top)/r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x*10}deg) rotateX(${y*-10}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

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

  // Virtual tilak - animated hand applies tilak (drag hand or press & hold)
  // Supports photos: assets/photos/tilak.jpg|png|jpeg|webp and assets/photos/bhaiya.jpg|png|jpeg|webp
  const tilakBtn = document.getElementById('tilak-btn');
  const tilakWrap = document.getElementById('tilak-photo-wrap');
  const tilakPhoto = document.getElementById('tilak-photo');
  const tilakMsg = document.getElementById('tilak-msg');
  const tilakScene = document.getElementById('tilak-scene');
  const tilakProgress = document.getElementById('tilak-progress-bar');
  const tilakHand = document.getElementById('tilak-hand');
  const brotherChar = document.getElementById('brother-char');
  const bhaiyaPhoto = document.getElementById('bhaiya-photo');
  let tilakApplying = false;
  let tilakDone = false;
  let tilakHoldTimer = null;
  let tilakProgressVal = 0;
  let draggingHand = false;
  let handStart = null;

  function tryLoadPhoto(imgEl, wrapEl, base, onHas) {
    if (!imgEl) return;
    const exts = ['jpg','jpeg','png','webp'];
    const attempt = (i) => {
      if (i >= exts.length) return;
      const src = `assets/photos/${base}.${exts[i]}`;
      const probe = new Image();
      probe.onload = () => { imgEl.src = src; imgEl.classList.remove('hidden'); if (wrapEl) wrapEl.classList.add('has-photo'); if (onHas) onHas(); };
      probe.onerror = () => attempt(i + 1);
      probe.src = src;
    };
    attempt(0);
  }
  tryLoadPhoto(tilakPhoto, tilakWrap, 'tilak');
  tryLoadPhoto(bhaiyaPhoto, brotherChar, 'bhaiya');

  function completeTilak() {
    if (tilakDone) return;
    tilakDone = true;
    tilakApplying = false;
    draggingHand = false;
    if (tilakHand) { tilakHand.classList.remove('dragging'); tilakHand.style.transform = ''; tilakHand.style.left = ''; tilakHand.style.top = ''; }
    if (tilakScene) { tilakScene.classList.remove('applying'); tilakScene.classList.add('applied'); }
    if (tilakWrap) tilakWrap.classList.add('applied');
    if (tilakProgress) tilakProgress.style.width = '100%';
    if (tilakMsg) { tilakMsg.classList.remove('hidden'); tilakMsg.classList.add('show'); }
    const r = (tilakWrap || tilakBtn).getBoundingClientRect();
    burstSparkles(r.left + r.width/2, r.top + r.height*0.25, 40);
    playChime();
    if (tilakBtn) { tilakBtn.textContent = 'Tilak Applied with Love ✅'; tilakBtn.disabled = true; }
  }

  function setTilakProgress(val) {
    tilakProgressVal = Math.max(0, Math.min(100, val));
    if (tilakProgress) tilakProgress.style.width = tilakProgressVal + '%';
    if (tilakProgressVal >= 100) completeTilak();
  }

  function startTilakApply() {
    if (tilakDone || tilakApplying) return;
    tilakApplying = true;
    ensureAudioCtx();
    if (tilakScene) tilakScene.classList.add('applying');
    if (tilakBtn) tilakBtn.textContent = 'Applying tilak...';
    if (tilakHoldTimer) cancelAnimationFrame(tilakHoldTimer);
    const step = () => {
      if (!tilakApplying || tilakDone || draggingHand) return;
      setTilakProgress(tilakProgressVal + 2.2);
      if (!tilakDone) tilakHoldTimer = requestAnimationFrame(step);
    };
    tilakHoldTimer = requestAnimationFrame(step);
  }
  function stopTilakApply() {
    if (tilakDone) return;
    if (draggingHand) return;
    tilakApplying = false;
    if (tilakScene) tilakScene.classList.remove('applying');
    if (tilakHoldTimer) cancelAnimationFrame(tilakHoldTimer);
    if (tilakProgressVal < 100) {
      setTilakProgress(0);
      if (tilakBtn) tilakBtn.textContent = 'Press & Hold or Drag Hand to Apply Tilak';
    }
  }

  function playChime() {
    if (!sfxOn) return;
    const ctx = ensureAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + i*0.06);
      g.gain.exponentialRampToValueAtTime(0.07, now + i*0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i*0.06 + 0.5);
      o.connect(g).connect(ctx.destination); o.start(now + i*0.06); o.stop(now + i*0.06 + 0.55);
    });
  }

  if (tilakBtn) {
    tilakBtn.addEventListener('mousedown', (e) => { if (e.button===0) startTilakApply(); });
    tilakBtn.addEventListener('mouseup', stopTilakApply);
    tilakBtn.addEventListener('mouseleave', stopTilakApply);
    tilakBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startTilakApply(); }, { passive: false });
    tilakBtn.addEventListener('touchend', stopTilakApply);
  }

  // Drag hand to apply tilak
  if (tilakHand && tilakScene) {
    const onPointerDown = (e) => {
      if (tilakDone) return;
      draggingHand = true; tilakApplying = true; ensureAudioCtx();
      tilakHand.classList.add('dragging');
      tilakScene.classList.add('applying');
      if (tilakBtn) tilakBtn.textContent = 'Applying tilak...';
      handStart = { x: e.clientX, y: e.clientY, t: Date.now() };
      tilakHand.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!draggingHand || tilakDone) return;
      const dx = e.clientX - handStart.x;
      const dy = e.clientY - handStart.y;
      // move hand toward target (clamped)
      const mx = Math.max(-20, Math.min(160, dx));
      const my = Math.max(-80, Math.min(40, dy));
      tilakHand.style.transform = `rotate(${-20 + mx*0.05}deg) translateX(${80 + mx}px) translateY(${-20 + my}px)`;
      // progress based on how far dragged toward target
      const prog = Math.min(100, Math.max(0, (mx + 20) / 140 * 70 + Math.max(0, -my) / 60 * 30));
      setTilakProgress(Math.max(tilakProgressVal, prog));
      if (prog > 92) completeTilak();
    };
    const onPointerUp = (e) => {
      if (!draggingHand) return;
      draggingHand = false;
      tilakHand.classList.remove('dragging');
      if (!tilakDone) {
        tilakHand.style.transform = '';
        tilakApplying = false;
        tilakScene.classList.remove('applying');
        if (tilakProgressVal < 100) { setTilakProgress(0); if (tilakBtn) tilakBtn.textContent = 'Press & Hold or Drag Hand to Apply Tilak'; }
      }
      try { tilakHand.releasePointerCapture(e.pointerId); } catch(_) {}
    };
    tilakHand.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  // Extra confetti
  const confettiBtn = document.getElementById('confetti-btn');
  if (confettiBtn) {
    confettiBtn.addEventListener('click', () => {
      for (let i=0;i<5;i++) setTimeout(() => burstSparkles(Math.random()*window.innerWidth, Math.random()*window.innerHeight*0.7, 18), i*120);
    });
  }

  // Dice surprise
  const dice = document.getElementById('dice');
  const rollDiceBtn = document.getElementById('roll-dice');
  const diceResult = document.getElementById('dice-result');
  const diceFaces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const diceSurprises = [
    "Aapko ek badi si smile aur ek virtual hug! 🤗",
    "Surprise: Aap aaj ki sabse cute insaan hain! 💛",
    "Kaddu Bhaiya ki taraf se ek extra mithai wish! 🍬",
    "Aaj ka din aur bhi wonderful ho — yahi dua hai! ✨",
    "Secret compliment: Aapki presence hi special hai! 🌟",
    "Jackpot! Unlimited blessings aur khushiyaan for Pyari Velvet! 🎉"
  ];
  if (rollDiceBtn && dice && diceResult) {
    rollDiceBtn.addEventListener('click', () => {
      rollDiceBtn.disabled = true;
      dice.classList.add('rolling');
      let ticks = 0;
      const t = setInterval(() => {
        const r = Math.floor(Math.random()*6);
        dice.textContent = diceFaces[r];
        ticks++;
        if (ticks > 12) {
          clearInterval(t);
          dice.classList.remove('rolling');
          const final = Math.floor(Math.random()*6);
          dice.textContent = diceFaces[final];
          diceResult.textContent = diceSurprises[final];
          diceResult.classList.remove('hidden');
          diceResult.classList.add('show');
          burstSparkles(window.innerWidth/2, window.innerHeight/2, 24);
          rollDiceBtn.disabled = false;
        }
      }, 90);
    });
  }

  // Fireworks finale on closing page
  const fwCanvas = document.getElementById('fireworks-canvas');
  let fwCtx, fwParticles = [], fwRunning = false, fwAnim;
  function resizeFw() {
    if (!fwCanvas) return;
    const rect = fwCanvas.parentElement.getBoundingClientRect();
    fwCanvas.width = rect.width; fwCanvas.height = rect.height;
  }
  function spawnFirework() {
    if (!fwCanvas) return;
    const x = Math.random()*fwCanvas.width*0.8 + fwCanvas.width*0.1;
    const y = Math.random()*fwCanvas.height*0.4 + fwCanvas.height*0.1;
    const colors = ['#ff5252','#ffd740','#69f0ae','#40c4ff','#ff4081','#fff'];
    const color = colors[Math.floor(Math.random()*colors.length)];
    for (let i=0;i<36;i++) {
      const a = (Math.PI*2*i)/36;
      const s = Math.random()*3 + 1.5;
      fwParticles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:60+Math.random()*20,color});
    }
  }
  function drawFw() {
    if (!fwCtx) return;
    fwCtx.clearRect(0,0,fwCanvas.width,fwCanvas.height);
    fwParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 1;
      fwCtx.globalAlpha = Math.max(0, p.life/80);
      fwCtx.fillStyle = p.color;
      fwCtx.beginPath(); fwCtx.arc(p.x,p.y,2.2,0,Math.PI*2); fwCtx.fill();
    });
    fwParticles = fwParticles.filter(p => p.life>0);
    if (fwRunning || fwParticles.length) fwAnim = requestAnimationFrame(drawFw);
  }
  function launchFireworks() {
    if (!fwCanvas) return;
    fwCtx = fwCanvas.getContext('2d');
    resizeFw();
    fwRunning = true;
    let bursts = 0;
    const interval = setInterval(() => { spawnFirework(); bursts++; if (bursts>6) { clearInterval(interval); fwRunning=false; } }, 450);
    if (!fwAnim) drawFw();
  }
  window.addEventListener('resize', () => { if (fwCanvas) resizeFw(); });

  // Cursor sparkle trail
  let lastTrail = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrail < 35) return;
    lastTrail = now;
    const s = document.createElement('span');
    s.className = 'cursor-spark';
    s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
    const colors = ['#fff7a1','#ff9800','#ff80ab','#ffd54f'];
    s.style.background = `radial-gradient(circle, ${colors[Math.floor(Math.random()*colors.length)]}, #ff9800)`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });
})();
