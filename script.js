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

  function goTo(idx) {
    if (isAnimating || idx < 0 || idx >= pages.length || idx === current) return;
    isAnimating = true;
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
    const toggle = () => card.classList.toggle('flipped');
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
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

  // Gallery lightbox (for when real images are added)
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  document.getElementById('gallery-grid').addEventListener('click', (e) => {
    const img = e.target.closest('.photo-frame')?.querySelector('img');
    if (!img) return;
    lightboxImg.src = img.src;
    lightbox.classList.remove('hidden');
  });
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
})();
