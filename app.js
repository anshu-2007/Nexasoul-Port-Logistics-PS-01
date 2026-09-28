/* ================================================================
   GALLEY-LA DOCKMASTER — NEXASOUL PS-01 PLATFORM ENGINE
   One Piece · Water 7 · Grand Line · Gol D. Roger Edition
   3D Eye-Tracking Characters · Water Attraction Cursor · Supabase Full Backend
   All 10 Core Specs + 4 Bonus Enhancements
   ================================================================ */

'use strict';

// ─── CONSTANTS & CONFIGURATION ──────────────────────────────────
const ADMIN_CREDS       = { username: 'iceburg', password: 'galleyla2024', name: 'Iceburg', role: 'admin' };
const NO_SHOW_PENALTY   = 15;
const CANCEL_PENALTY    = 5;
const CHECKIN_REWARD    = 2;
const CHECKIN_WIN_MINS  = 30;   // check-in window opens 30 mins before start
const FORFEITURE_MINS   = 15;   // marked as no-show after 15 mins past start

// 12 Distinctive Water 7 Docks
const DEFAULT_BERTHS = [
  { id: 'B1',  name: 'Berth 1 — Merry Cove',       type: 'Sloop',          emoji: '🛶', desc: 'Protected cove slip for small vessels and caravels' },
  { id: 'B2',  name: 'Berth 2 — Thousand Bay',     type: 'Galleon',        emoji: '⛵', desc: 'Mid-sized pier equipped with cola refuel pumps' },
  { id: 'B3',  name: 'Berth 3 — Adam Wood Quay',   type: 'Marine Warship', emoji: '🚢', desc: 'Heavily reinforced slip for iron-clad battleships' },
  { id: 'B4',  name: "Berth 4 — Paulie's Rigging", type: 'Sloop',          emoji: '🛶', desc: 'Fast turnaround slip with rope cranes' },
  { id: 'B5',  name: "Berth 5 — Blueno's Wharf",   type: 'Galleon',        emoji: '⛵', desc: 'Spacious deep-water mooring pier' },
  { id: 'B6',  name: "Berth 6 — Franky's Yard",    type: 'Marine Warship', emoji: '🚢', desc: 'Cyborg dock equipped with heavy battle repair cranes' },
  { id: 'B7',  name: 'Berth 7 — Iceburg Inlet',    type: 'Sloop',          emoji: '🛶', desc: 'Prime entrance slip near Galley-La headquarters' },
  { id: 'B8',  name: "Berth 8 — Kokoro's Station", type: 'Galleon',        emoji: '⛵', desc: 'Adjoining the Puffing Tom sea-train canal' },
  { id: 'B9',  name: "Berth 9 — Robin's Haven",    type: 'Sloop',          emoji: '🛶', desc: 'Quiet, secluded berth for discrete arrivals' },
  { id: 'B10', name: "Berth 10 — Zoro's Bastion",  type: 'Marine Warship', emoji: '🚢', desc: 'Fortified warship quay with three-blade security' },
  { id: 'B11', name: "Berth 11 — Nami's Reach",    type: 'Galleon',        emoji: '⛵', desc: 'Clear sightlines for Grand Line log pose navigators' },
  { id: 'B12', name: "Berth 12 — Luffy's Launch",  type: 'Sloop',          emoji: '🛶', desc: 'Adventure launch point with direct open-sea current' }
];

// Seed Pirates & Captains
const DEFAULT_USERS = [
  { username: 'luffy',   name: 'Monkey D. Luffy', email: 'luffy@strawhat.sea',   password: 'gomugomu',    ship: 'Galleon',        score: 100, role: 'user' },
  { username: 'zoro',    name: 'Roronoa Zoro',    email: 'zoro@strawhat.sea',    password: 'santoryu',    ship: 'Sloop',          score: 95,  role: 'user' },
  { username: 'law',     name: 'Trafalgar Law',   email: 'law@heartpirates.sea',  password: 'roomshambles', ship: 'Sloop',          score: 98,  role: 'user' },
  { username: 'smoker',  name: 'Vice Admiral Smoker', email: 'smoker@marine.gov', password: 'whiteblow', ship: 'Marine Warship', score: 90,  role: 'user' },
  { username: 'iceburg', name: 'Iceburg (Admin)', email: 'iceburg@galleyla.co',  password: 'galleyla2024', ship: 'Galleon',        score: 100, role: 'admin' }
];

// ─── APPLICATION STATE ──────────────────────────────────────────
let currentUser        = null;
let berths             = [];
let bookings           = [];
let users              = [];
let noShowLog          = [];
let selectedBerthId    = null;
let countdownIntvl     = null;
let berthFilter        = 'all';
let historyFilter      = 'all';
let selectedShipClass  = 'Sloop';
let selectedPresetName = 'Twilight Port';
let bookingCurrentStep = 1;
let grandLineClockInterval = null;


// Audio & Web Audio Context
let audioCtx        = null;
let seaNoiseNode    = null;
let seaGainNode     = null;
let seaIsPlaying    = false;
let sfxEnabled      = true;

// Supabase Client instance (local fallback mode)
let supabaseClient  = null;

function syncToSupabase() {
  try {
    saveData();
  } catch (e) {
    // Graceful local sync fallback
  }
}

// ─── INITIALIZATION ON DOM READY ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDataStore();
  initWaterAttractionCursor();
  initAmbientParticles();
  initAuthStars();
  initChar3DTracking();
  initThreeOceanStage();
  initWantedPoster3D();
  initRouletteWheel();
  initTiltCards();
  setTodayMin();
  startGrandLineClock();
  updateNavBadges();

  // Instant Direct Load: Remove any lingering splash element and auto-navigate straight to user's page
  const splash = document.getElementById('splashScreen');
  if (splash) splash.remove();

  // Automatically authenticate and open captain home page
  checkExistingSession();
  showView('dashboard');

  // Periodic Automated No-Show Checker (Runs every 45 seconds)
  setInterval(checkNoShows, 45000);
});

// ─── 1. WATER ATTRACTION ANIMATED CURSOR ─────────────────────────
function initWaterAttractionCursor() {
  const canvas = document.getElementById('waterCursorCanvas');
  const cursorWrap = document.getElementById('animeCursorWrap');
  if (!canvas || !cursorWrap) return;

  const ctx = canvas.getContext('2d');
  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  // Mouse coordinates with spring lerp
  let mouse = { x: W / 2, y: H / 2, targetX: W / 2, targetY: H / 2, moved: false, speed: 0 };
  let prevX = W / 2, prevY = H / 2;

  // Ripples & Click Splashes
  const ripples = [];

  // Generate 55 fluid water droplets
  const droplets = Array.from({ length: 55 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    radius: Math.random() * 3.5 + 1.5,
    baseRadius: Math.random() * 3.5 + 1.5,
    alpha: Math.random() * 0.6 + 0.25,
    swirlAngle: Math.random() * Math.PI * 2,
    swirlSpeed: (Math.random() * 0.04 + 0.02) * (Math.random() > 0.5 ? 1 : -1),
    orbitDist: Math.random() * 60 + 20
  }));

  window.addEventListener('mousemove', e => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.moved = true;

    // Check if hovering over clickable / interactive elements
    const hoveredEl = document.elementFromPoint(e.clientX, e.clientY);
    const isInteractive = hoveredEl && hoveredEl.closest(
      'button, a, input, select, textarea, .qa-manga-card, .ch-stat, .bmc, .bbc-card, .wanted-card-inner, .ps01-card-parchment'
    );
    if (isInteractive) {
      document.body.classList.add('cursor-hover');
    } else {
      document.body.classList.remove('cursor-hover');
    }
  });

  window.addEventListener('mousedown', e => {
    // Spawn water splash ripple
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      radius: 5,
      maxRadius: 75,
      alpha: 0.9,
      color: '#06d6f0'
    });
    // Droplet burst away from click
    droplets.forEach(d => {
      const dx = d.x - e.clientX;
      const dy = d.y - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        const force = (1 - dist / 140) * 8;
        d.vx += (dx / (dist || 1)) * force;
        d.vy += (dy / (dist || 1)) * force;
      }
    });
    playSFX('click');
  });

  function renderCursor() {
    ctx.clearRect(0, 0, W, H);

    // Smooth cursor movement interpolation
    const lerp = 0.16;
    mouse.x += (mouse.targetX - mouse.x) * lerp;
    mouse.y += (mouse.targetY - mouse.y) * lerp;

    // Mouse velocity
    const dx = mouse.x - prevX;
    const dy = mouse.y - prevY;
    mouse.speed = Math.sqrt(dx * dx + dy * dy);
    prevX = mouse.x;
    prevY = mouse.y;

    cursorWrap.style.left = mouse.x + 'px';
    cursorWrap.style.top = mouse.y + 'px';

    // 1. Draw Magnetic Attracted Water Droplets
    const attractionRadius = 260;
    const attractionForce = 0.085;

    droplets.forEach(d => {
      // Natural ambient drift
      d.x += d.vx;
      d.y += d.vy;

      // Friction
      d.vx *= 0.985;
      d.vy *= 0.985;

      // Wrap around viewport edges
      if (d.x < -20) d.x = W + 20;
      if (d.x > W + 20) d.x = -20;
      if (d.y < -20) d.y = H + 20;
      if (d.y > H + 20) d.y = -20;

      // Vector to cursor
      const distX = mouse.x - d.x;
      const distY = mouse.y - d.y;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < attractionRadius && mouse.moved) {
        // Gravitational magnetic suction towards cursor
        const pull = (1 - dist / attractionRadius) * attractionForce;
        d.vx += (distX / dist) * pull * 4.5;
        d.vy += (distY / dist) * pull * 4.5;

        // Tangential swirl (vortex) near cursor
        if (dist < 80) {
          d.swirlAngle += d.swirlSpeed;
          const swirlX = -distY / dist;
          const swirlY = distX / dist;
          d.vx += swirlX * 0.9;
          d.vy += swirlY * 0.9;
        }

        // Draw glowing attraction water tether stream
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(6, 214, 240, ${(1 - dist / 120) * 0.22})`;
          ctx.lineWidth = (1 - dist / 120) * 1.5;
          ctx.stroke();
        }
      }

      // Render Water Droplet with liquid refraction glow
      const grad = ctx.createRadialGradient(
        d.x - d.radius * 0.3,
        d.y - d.radius * 0.3,
        0,
        d.x,
        d.y,
        d.radius
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.4, 'rgba(6, 214, 240, 0.7)');
      grad.addColorStop(1, 'rgba(2, 132, 199, 0.15)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = '#06d6f0';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });

    // 2. Render Ripples & Splash Rings
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += 2.8;
      r.alpha *= 0.94;

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 214, 240, ${r.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (r.alpha < 0.02 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
      }
    }

    requestAnimationFrame(renderCursor);
  }

  requestAnimationFrame(renderCursor);
}

// ─── 2. PROCEDURAL WEB AUDIO SEA AMBIANCE & SOUND FX ────────────
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function toggleSeaAmbiance() {
  const btn = document.getElementById('btnSeaAmbiance');
  const icon = document.getElementById('seaAmbianceIcon');
  const ctx = getAudioContext();
  if (!ctx) return;

  if (seaIsPlaying) {
    if (seaGainNode) {
      seaGainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      setTimeout(() => {
        if (seaNoiseNode) {
          try { seaNoiseNode.stop(); } catch(e){}
          seaNoiseNode.disconnect();
          seaNoiseNode = null;
        }
      }, 1200);
    }
    seaIsPlaying = false;
    if (btn) btn.classList.remove('active');
    if (icon) icon.textContent = '🌊';
    showToast('info', 'Sea Ambiance silenced');
  } else {
    // Generate realistic procedural ocean surf waves
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    // Pink-noise filter for warm ocean roar
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    seaNoiseNode = ctx.createBufferSource();
    seaNoiseNode.buffer = noiseBuffer;
    seaNoiseNode.loop = true;

    // Lowpass filter modulated by LFO to simulate rolling ocean waves
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12; // wave surge cycle every ~8 seconds
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(filter.frequency);
    lfo.start();

    seaGainNode = ctx.createGain();
    seaGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    seaGainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.5);

    seaNoiseNode.connect(filter);
    filter.connect(seaGainNode);
    seaGainNode.connect(ctx.destination);

    seaNoiseNode.start();
    seaIsPlaying = true;
    if (btn) btn.classList.add('active');
    if (icon) icon.textContent = '🌊🔊';
    showToast('info', 'Grand Line Ocean Waves playing');
  }
}

function toggleSoundFX() {
  sfxEnabled = !sfxEnabled;
  const btn = document.getElementById('btnSoundFX');
  const icon = document.getElementById('soundFXIcon');
  if (btn) {
    if (sfxEnabled) {
      btn.classList.add('active');
      if (icon) icon.textContent = '🔊';
      playSFX('click');
      showToast('info', 'Sound FX enabled');
    } else {
      btn.classList.remove('active');
      if (icon) icon.textContent = '🔇';
      showToast('info', 'Sound FX muted');
    }
  }
}

function playSFX(type) {
  if (!sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (type === 'book') {
    // Grand Line bell chime
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, now + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + i * 0.08);
      o.stop(now + i * 0.08 + 0.6);
    });
  } else if (type === 'checkin') {
    // Victory fanfare
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + i * 0.1);
      o.stop(now + i * 0.1 + 0.5);
    });
  } else if (type === 'quote') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.32);
  }
}

// ─── 3. THREE.JS 3D OCEAN WATER & PIRATE SHIP STAGE ─────────────
function initThreeOceanStage() {
  const canvas = document.getElementById('three3dStage');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 15, 30);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0x063a5a, 1.2);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xf5c518, 1.4);
  sunLight.position.set(10, 25, 15);
  scene.add(sunLight);

  const cursorPointLight = new THREE.PointLight(0x06d6f0, 2.5, 45);
  cursorPointLight.position.set(0, 10, 10);
  scene.add(cursorPointLight);

  // 3D Undulating Ocean Mesh
  const planeGeo = new THREE.PlaneGeometry(80, 80, 48, 48);
  const planeMat = new THREE.MeshPhongMaterial({
    color: 0x071e3d,
    emissive: 0x021024,
    specular: 0x06d6f0,
    shininess: 40,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });
  const ocean = new THREE.Mesh(planeGeo, planeMat);
  ocean.rotation.x = -Math.PI / 2;
  scene.add(ocean);

  // Stylized 3D Pirate Ship (Thousand Sunny / Going Merry)
  const shipGroup = new THREE.Group();

  // Hull
  const hullGeo = new THREE.BoxGeometry(4, 2, 8);
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6 });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 1;
  shipGroup.add(hull);

  // Mast
  const mastGeo = new THREE.CylinderGeometry(0.15, 0.2, 7, 8);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.set(0, 4.5, 0);
  shipGroup.add(mast);

  // Billowing Main Sail
  const sailGeo = new THREE.PlaneGeometry(3.8, 3.2);
  const sailMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    side: THREE.DoubleSide,
    roughness: 0.4
  });
  const sail = new THREE.Mesh(sailGeo, sailMat);
  sail.position.set(0, 4.8, 0.2);
  shipGroup.add(sail);

  // Golden Sun Figurehead
  const headGeo = new THREE.SphereGeometry(0.8, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 1.8, 4.2);
  shipGroup.add(head);

  shipGroup.position.set(0, 0, 0);
  scene.add(shipGroup);

  // Resize handler
  window.addEventListener('resize', () => {
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });

  // Mouse reaction
  let mouseNormX = 0, mouseNormY = 0;
  window.addEventListener('mousemove', e => {
    mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;
    cursorPointLight.position.x = mouseNormX * 25;
    cursorPointLight.position.y = mouseNormY * 15 + 8;
  });

  const positionAttribute = planeGeo.attributes.position;
  const initialPositions = positionAttribute.clone();

  let clock = 0;
  function animateThree() {
    requestAnimationFrame(animateThree);
    clock += 0.035;

    // Animate wave displacement
    for (let i = 0; i < positionAttribute.count; i++) {
      const u = initialPositions.getX(i);
      const v = initialPositions.getY(i);
      const wave =
        Math.sin(u * 0.35 + clock) * 1.2 +
        Math.cos(v * 0.35 + clock * 1.2) * 1.2;
      positionAttribute.setZ(i, wave);
    }
    positionAttribute.needsUpdate = true;

    // Bobbing ship physics
    shipGroup.position.y = Math.sin(clock * 1.8) * 0.6;
    shipGroup.rotation.z = Math.sin(clock * 1.2) * 0.08 + mouseNormX * 0.12;
    shipGroup.rotation.x = Math.cos(clock * 1.4) * 0.08 - mouseNormY * 0.08;
    shipGroup.rotation.y = clock * 0.15;

    renderer.render(scene, camera);
  }

  animateThree();
}

// ─── 4. 3D CHARACTERS WITH REAL-TIME EYE & HEAD TRACKING ────────
function initChar3DTracking() {
  const cardZoro = document.getElementById('cardZoro');
  const cardLuffy = document.getElementById('cardLuffy');
  const pupilZoro = document.getElementById('pupilZoro');
  const pupilLuffyL = document.getElementById('pupilLuffyL');
  const pupilLuffyR = document.getElementById('pupilLuffyR');

  window.addEventListener('mousemove', e => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Normalized mouse [-1, 1]
    const mx = (e.clientX / W) * 2 - 1;
    const my = (e.clientY / H) * 2 - 1;

    // 1. Zoro 3D Head & Eye Tracking
    if (cardZoro) {
      const rectZ = cardZoro.getBoundingClientRect();
      const zcx = rectZ.left + rectZ.width / 2;
      const zcy = rectZ.top + rectZ.height / 2;
      const zdx = (e.clientX - zcx) / (W / 2);
      const zdy = (e.clientY - zcy) / (H / 2);

      cardZoro.style.transform = `perspective(1200px) rotateY(${zdx * 20}deg) rotateX(${-zdy * 16}deg) translateZ(15px)`;

      // Zoro Eye Pupil tracking (one visible scarred eye)
      if (pupilZoro) {
        const pupilX = Math.max(-4, Math.min(4, zdx * 6));
        const pupilY = Math.max(-3, Math.min(3, zdy * 5));
        pupilZoro.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
      }
    }

    // 2. Luffy 3D Head & Eye Tracking
    if (cardLuffy) {
      const rectL = cardLuffy.getBoundingClientRect();
      const lcx = rectL.left + rectL.width / 2;
      const lcy = rectL.top + rectL.height / 2;
      const ldx = (e.clientX - lcx) / (W / 2);
      const ldy = (e.clientY - lcy) / (H / 2);

      cardLuffy.style.transform = `perspective(1200px) rotateY(${ldx * 22}deg) rotateX(${-ldy * 18}deg) translateZ(15px)`;

      // Luffy Eye Pupils tracking (both eyes wide open)
      const pupilX = Math.max(-5, Math.min(5, ldx * 6.5));
      const pupilY = Math.max(-3.5, Math.min(3.5, ldy * 5));
      if (pupilLuffyL) pupilLuffyL.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
      if (pupilLuffyR) pupilLuffyR.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
    }
  });
}

const ZORO_QUOTES = [
  '"Nothing happened..."',
  '"If I die here, then I was a man that could only make it this far!"',
  '"Scars on the back are a swordsman\'s shame!"',
  '"You need a reservation slip to moor at Dock 1, pirate!"'
];
const LUFFY_QUOTES = [
  '"I\'m gonna be King of the Pirates!"',
  '"Gomu Gomu no... Safe Harbor Docking!"',
  '"Iceburg-san promised us Adam Wood repairs at Dock 1!"',
  '"Join my fleet and reserve your berth right now!"'
];
let zoroQuoteIdx = 0;
let luffyQuoteIdx = 0;

function triggerCharQuote(char) {
  playSFX('quote');
  if (char === 'zoro') {
    const bubble = document.getElementById('speechZoro');
    if (bubble) {
      zoroQuoteIdx = (zoroQuoteIdx + 1) % ZORO_QUOTES.length;
      bubble.textContent = ZORO_QUOTES[zoroQuoteIdx];
      bubble.classList.add('active');
      setTimeout(() => bubble.classList.remove('active'), 2800);
    }
  } else if (char === 'luffy') {
    const bubble = document.getElementById('speechLuffy');
    if (bubble) {
      luffyQuoteIdx = (luffyQuoteIdx + 1) % LUFFY_QUOTES.length;
      bubble.textContent = LUFFY_QUOTES[luffyQuoteIdx];
      bubble.classList.add('active');
      setTimeout(() => bubble.classList.remove('active'), 2800);
    }
  }
}

// ─── 5. WANTED POSTER 3D MOUSE PARALLAX TILT ────────────────────
function initWantedPoster3D() {
  const container = document.getElementById('wantedPoster3D');
  if (!container) return;
  const card = container.querySelector('.wanted-card-inner');
  if (!card) return;

  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(800px) rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg) scale(1.02)`;
  });

  container.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotate(1deg) scale(1)';
  });
}

function togglePsRequirements() {
  const list = document.getElementById('psReqList');
  const arrow = document.getElementById('psReqArrow');
  if (!list) return;
  const isHidden = list.style.display === 'none';
  list.style.display = isHidden ? 'flex' : 'none';
  if (arrow) arrow.textContent = isHidden ? '▲' : '▼';
}

// ─── 6. GRAND LINE DESTINY ROULETTE MINI-GAME ───────────────────
const ROULETTE_SECTORS = [
  { label: '💰 +500 Berries', desc: 'Bounty reward added to your pirate reputation!', color: '#b91c1c' },
  { label: '🛶 Adam Wood 50%', desc: 'Premium slip discount granted by Iceburg!', color: '#b45309' },
  { label: '🌊 Aqua Laguna', desc: 'Storm surge warning! Docking berths secured.', color: '#0369a1' },
  { label: '🍖 Sanji Feast', desc: 'Full crew stamina restored! +2 Reliability karma.', color: '#15803d' },
  { label: '⚓ VIP Dock 1', desc: 'Guaranteed prime berth slip access!', color: '#7e22ce' },
  { label: '⚡ Buster Call', desc: 'Marine security alert at Dock 3!', color: '#991b1b' },
  { label: '💎 One Piece', desc: 'Legendary pirate status granted! Maximum karma.', color: '#d97706' },
  { label: '⛵ Coup de Burst', desc: 'Instant check-in pass unlocked!', color: '#0f766e' }
];

let rouletteAngle = 0;
let rouletteSpinning = false;

function initRouletteWheel() {
  const canvas = document.getElementById('rouletteCanvas');
  if (!canvas) return;
  drawRouletteWheel(canvas, rouletteAngle);
}

function drawRouletteWheel(canvas, angle) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = canvas.width / 2 - 8;
  const numSectors = ROULETTE_SECTORS.length;
  const arc = (Math.PI * 2) / numSectors;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  for (let i = 0; i < numSectors; i++) {
    const startAngle = i * arc;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.fillStyle = ROULETTE_SECTORS[i].color;
    ctx.fill();
    ctx.strokeStyle = '#f5c518';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Labels
    ctx.save();
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px "Cinzel", serif';
    ctx.fillText(ROULETTE_SECTORS[i].label, radius - 15, 5);
    ctx.restore();
  }

  // Golden Center Cap
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c518';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#1e1008';
  ctx.font = 'bold 16px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('NEXA', 0, 5);

  ctx.restore();
}

function openRouletteModal() {
  const modal = document.getElementById('rouletteModal');
  if (modal) {
    modal.style.display = 'flex';
    initRouletteWheel();
  }
}

function spinDestinyWheel() {
  if (rouletteSpinning) return;
  rouletteSpinning = true;
  const canvas = document.getElementById('rouletteCanvas');
  const btn = document.getElementById('btnSpinRoulette');
  const resCard = document.getElementById('rouletteResult');
  if (btn) btn.disabled = true;
  if (resCard) resCard.classList.add('hidden');

  // Random spin rotations (between 5 and 9 full spins + random offset)
  const extraRotations = (Math.random() * 4 + 5) * Math.PI * 2;
  const targetAngle = rouletteAngle + extraRotations;
  const duration = 4000;
  const startTime = performance.now();

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease out
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentAngle = rouletteAngle + extraRotations * ease;

    drawRouletteWheel(canvas, currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      rouletteAngle = targetAngle % (Math.PI * 2);
      rouletteSpinning = false;
      if (btn) btn.disabled = false;

      // Determine winning sector under top pointer (-PI/2)
      const numSectors = ROULETTE_SECTORS.length;
      const arc = (Math.PI * 2) / numSectors;
      // Pointer is at -PI/2
      let normalized = (Math.PI * 1.5 - rouletteAngle) % (Math.PI * 2);
      if (normalized < 0) normalized += Math.PI * 2;
      const winningIdx = Math.floor(normalized / arc) % numSectors;
      const win = ROULETTE_SECTORS[winningIdx];

      playSFX('book');
      if (resCard) {
        document.getElementById('rrTitle').textContent = win.label;
        document.getElementById('rrDesc').textContent = win.desc;
        resCard.classList.remove('hidden');
      }
      showToast('success', `🎡 Grand Line Destiny: ${win.label}!`);
    }
  }

  requestAnimationFrame(animateSpin);
}

// ─── 7. LOCAL DATA STORE (INITIALIZATION & PERSISTENCE) ──────────
function initDataStore() {
  const bData = localStorage.getItem('galleyla_berths');
  berths = bData ? JSON.parse(bData) : JSON.parse(JSON.stringify(DEFAULT_BERTHS));

  const bkData = localStorage.getItem('galleyla_bookings');
  bookings = bkData ? JSON.parse(bkData) : [];

  const uData = localStorage.getItem('galleyla_users');
  users = uData ? JSON.parse(uData) : JSON.parse(JSON.stringify(DEFAULT_USERS));

  const nsData = localStorage.getItem('galleyla_noshows');
  noShowLog = nsData ? JSON.parse(nsData) : [];

  // Seed realistic bookings leaving 10 of 12 berths 100% free all day
  if (!bkData || bookings.length === 0 || (bookings.length === 3 && bookings[0].id === 'BK-1001' && bookings[1].id === 'BK-1002')) {
    const today = new Date().toISOString().split('T')[0];
    bookings = [
      {
        id: 'BK-1001',
        userId: 'luffy',
        captainName: 'Monkey D. Luffy',
        berthId: 'B2',
        shipType: 'Galleon',
        date: today,
        timeStart: '09:00',
        timeEnd: '12:00',
        notes: 'Thousand Sunny dock for cola reload',
        status: 'checked_in',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'BK-1002',
        userId: 'smoker',
        captainName: 'Vice Admiral Smoker',
        berthId: 'B3',
        shipType: 'Marine Warship',
        date: today,
        timeStart: '13:00',
        timeEnd: '16:00',
        notes: 'Marine patrol standby at Adam Wood quay',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }

  saveData();
}

function saveData() {
  localStorage.setItem('galleyla_berths', JSON.stringify(berths));
  localStorage.setItem('galleyla_bookings', JSON.stringify(bookings));
  localStorage.setItem('galleyla_users', JSON.stringify(users));
  localStorage.setItem('galleyla_noshows', JSON.stringify(noShowLog));
}

// ─── 10. AUTHENTICATION & SESSION MANAGEMENT ─────────────────────
function checkExistingSession() {
  const sess = localStorage.getItem('galleyla_session');
  if (sess) {
    try {
      const u = JSON.parse(sess);
      loginAs(u);
      return;
    } catch(e) {
      localStorage.removeItem('galleyla_session');
    }
  }

  // Automatically land straight on the captain's page (default: Monkey D. Luffy)
  const defaultCaptain = (users && users.find(u => u.username === 'luffy')) || (users && users[0]) || {
    username: 'luffy',
    name: 'Monkey D. Luffy',
    ship: 'Galleon',
    score: 100,
    role: 'user'
  };
  loginAs(defaultCaptain);
}

function showRegister(e) {
  if (e) e.preventDefault();
  document.getElementById('loginPanel').classList.add('hidden');
  document.getElementById('registerPanel').classList.remove('hidden');
}

function showLogin(e) {
  if (e) e.preventDefault();
  document.getElementById('registerPanel').classList.add('hidden');
  document.getElementById('loginPanel').classList.remove('hidden');
}

function handleLogin() {
  const uIn = document.getElementById('loginUsername')?.value.trim();
  const pIn = document.getElementById('loginPassword')?.value;
  const err = document.getElementById('loginError');

  if (!uIn || !pIn) {
    showAuthError(err, 'Please enter your pirate call sign and secret code');
    return;
  }

  // Admin Check
  if (uIn === ADMIN_CREDS.username && pIn === ADMIN_CREDS.password) {
    loginAs({ ...ADMIN_CREDS, ship: 'Galleon', score: 100 });
    return;
  }

  const found = users.find(u => u.username.toLowerCase() === uIn.toLowerCase() && u.password === pIn);
  if (!found) {
    showAuthError(err, 'Invalid pirate call sign or code. Try: luffy / gomugomu');
    return;
  }

  loginAs(found);
}

function handleAdminLogin() {
  loginAs({ ...ADMIN_CREDS, ship: 'Galleon', score: 100 });
}

function handleRegister() {
  const name = document.getElementById('regName')?.value.trim();
  const uname = document.getElementById('regUsername')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const pass = document.getElementById('regPassword')?.value;
  const ship = document.getElementById('regShipType')?.value || 'Sloop';
  const err = document.getElementById('regError');

  if (!name || !uname || !pass) {
    showAuthError(err, 'Captain name, call sign, and secret code are required');
    return;
  }
  if (pass.length < 6) {
    showAuthError(err, 'Secret code must be at least 6 characters');
    return;
  }
  if (users.some(u => u.username.toLowerCase() === uname.toLowerCase())) {
    showAuthError(err, `Call sign "${uname}" is already claimed on the Grand Line`);
    return;
  }

  const newUser = {
    username: uname,
    name: name,
    email: email,
    password: pass,
    ship: ship,
    score: 100,
    role: 'user'
  };

  users.push(newUser);
  saveData();
  syncToSupabase();
  loginAs(newUser);
  showToast('success', `Welcome to Water 7, Captain ${name}!`);
}

function loginAs(user) {
  currentUser = user;
  localStorage.setItem('galleyla_session', JSON.stringify(user));

  // Hide Auth, Show Main App
  document.getElementById('authScreen')?.classList.add('hidden');
  const mainApp = document.getElementById('mainApp');
  if (mainApp) mainApp.classList.remove('hidden');

  // Update Nav Profile
  const unameEl = document.getElementById('navUsername');
  const avatarEl = document.getElementById('navAvatar');
  const scoreMini = document.getElementById('navScoreMini');
  if (unameEl) unameEl.textContent = user.name || user.username;
  if (avatarEl) avatarEl.textContent = (user.name || user.username)[0].toUpperCase();
  if (scoreMini) scoreMini.textContent = `⭐ ${user.score || 100}`;

  // Show/Hide Admin Navigation
  const adminLinks = document.querySelectorAll('.admin-nl, #mNavAdmin');
  adminLinks.forEach(el => {
    if (user.role === 'admin') el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  // Hero greeting
  const heroG = document.getElementById('heroGreeting');
  const heroC = document.getElementById('heroCrew');
  if (heroG) heroG.textContent = `Welcome, Captain ${user.name.split(' ')[0]}!`;
  if (heroC) heroC.textContent = `Flagship: ${user.ship} · Water 7 Dock Slip Reserve`;

  // Update Captain's Quarterdeck Bridge Card
  const cbcAvatar = document.getElementById('cbcAvatar');
  const cbcName = document.getElementById('cbcCaptainName');
  const cbcInfo = document.getElementById('cbcShipInfo');
  if (cbcAvatar) cbcAvatar.textContent = (user.name || user.username)[0].toUpperCase();
  if (cbcName) cbcName.textContent = `Captain ${user.name}`;
  if (cbcInfo) cbcInfo.textContent = `Flagship: ${user.ship} · Standing: ⭐ ${user.score || 100} (${getRankTitle(user.score || 100)})`;

  if (user.ship) {
    selectedShipClass = user.ship;
  }

  refreshAllViews();
  updateNavBadges();
  playSFX('checkin');
}

function handleLogout() {
  localStorage.removeItem('galleyla_session');
  currentUser = null;
  document.getElementById('mainApp')?.classList.add('hidden');
  document.getElementById('authScreen')?.classList.remove('hidden');
  showLogin();
  showToast('info', 'Departed Water 7 Harbor safely');
}

function showAuthError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ─── 11. VIEW NAVIGATION & TRANSITIONS ───────────────────────────
function showView(viewName) {
  const views = ['dashboard', 'book', 'history', 'admin'];
  views.forEach(v => {
    const el = document.getElementById('view' + capitalize(v));
    if (el) {
      if (v === viewName) {
        el.classList.remove('hidden-view');
        el.classList.add('active-view', 'view-enter');
        setTimeout(() => el.classList.remove('view-enter'), 500);
      } else {
        el.classList.add('hidden-view');
        el.classList.remove('active-view');
      }
    }

    // Nav active pills
    const navBtn = document.getElementById('nav' + capitalize(v === 'dashboard' ? 'dash' : v));
    const mNavBtn = document.getElementById('mNav' + capitalize(v === 'dashboard' ? 'dash' : v));
    if (navBtn) {
      if (v === viewName) navBtn.classList.add('active');
      else navBtn.classList.remove('active');
    }
    if (mNavBtn) {
      if (v === viewName) mNavBtn.classList.add('active');
      else mNavBtn.classList.remove('active');
    }
  });

  if (viewName === 'book') {
    setTodayMin();
    if (currentUser && currentUser.ship) {
      selectVesselClass(currentUser.ship);
    } else {
      selectVesselClass(selectedShipClass || 'Sloop');
    }
    if (!selectedBerthId) {
      autoSelectBestBerth(false);
    } else {
      renderBookBerths();
      validateBookingSlot();
    }
  } else if (viewName === 'history') {
    renderHistory();
  } else if (viewName === 'admin') {
    renderAdminDashboard();
  } else if (viewName === 'dashboard') {
    renderDashboard();
  }

  playSFX('click');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── 12. DASHBOARD VIEW RENDERING ────────────────────────────────
function renderDashboard() {
  renderBerthGrid();
  updateHarborStats();
  renderActiveCountdown();
  renderReliabilityScore();
  updateNavBadges();
}

function renderBerthGrid() {
  const container = document.getElementById('berthGrid');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];
  const nowTime = getNowTimeString();

  let list = berths;
  if (berthFilter !== 'all') {
    if (berthFilter === 'available') {
      list = berths.filter(b => !getBerthActiveBooking(b.id, today, nowTime));
    } else {
      list = berths.filter(b => b.type === berthFilter);
    }
  }

  container.innerHTML = list.map((b, idx) => {
    const activeBk = getBerthActiveBooking(b.id, today, nowTime);
    let statusClass = 'ld-green';
    let statusLabel = 'Available';
    let badgeText = 'FREE SLIP';

    if (activeBk) {
      if (activeBk.status === 'checked_in') {
        statusClass = 'ld-teal';
        statusLabel = 'Docked & Checked In';
        badgeText = 'DOCKED';
      } else if (currentUser && activeBk.userId === currentUser.username) {
        statusClass = 'ld-gold';
        statusLabel = 'My Reservation';
        badgeText = 'YOUR SLIP';
      } else {
        statusClass = 'ld-red';
        statusLabel = 'Occupied';
        badgeText = 'OCCUPIED';
      }
    }

    return `
      <div class="bmc bmc-${statusClass.replace('ld-', '')}" style="animation-delay:${idx * 0.05}s" onclick="openBerthQuickAction('${b.id}')">
        <div class="bmc-shimmer"></div>
        <div class="bmc-header">
          <span class="bmc-id font-heading">${b.id}</span>
          <span class="bmc-badge font-pirate">${badgeText}</span>
        </div>
        <div class="bmc-body">
          <div class="bmc-emoji">${b.emoji}</div>
          <h3 class="bmc-name font-pirate">${b.name}</h3>
          <p class="bmc-desc">${b.desc}</p>
          <div class="bmc-ship-type font-heading">⚓ Class: ${b.type}</div>
        </div>
        <div class="bmc-footer">
          <span class="leg-dot ${statusClass}"></span>
          <span class="bmc-status font-heading">${statusLabel}</span>
        </div>
        ${!activeBk ? `
          <button class="bmc-moor-btn font-pirate" onclick="event.stopPropagation();openBerthQuickAction('${b.id}')">
            <span>⚓</span> Reserve Slip Now
          </button>
        ` : `
          <button class="bmc-moor-btn font-pirate" style="background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.35);color:#fca5a5" onclick="event.stopPropagation();openBerthQuickAction('${b.id}')">
            <span>🔍</span> View Occupant Details
          </button>
        `}
      </div>
    `;
  }).join('');
}

function filterBerths(type, btn) {
  berthFilter = type;
  document.querySelectorAll('.berth-filter-row .bf').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBerthGrid();
  playSFX('click');
}

function updateHarborStats() {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = getNowTimeString();

  const occupiedCount = berths.filter(b => getBerthActiveBooking(b.id, today, nowTime)).length;
  const availCount = berths.length - occupiedCount;

  const statAvail = document.getElementById('statAvail');
  const statBooked = document.getElementById('statBooked');
  const myScore = document.getElementById('myScore');

  if (statAvail) statAvail.textContent = availCount;
  if (statBooked) statBooked.textContent = occupiedCount;
  if (myScore && currentUser) myScore.textContent = currentUser.score || 100;

  const tickerCap = document.getElementById('tickerCapacity');
  if (tickerCap) tickerCap.textContent = `${availCount} / ${berths.length} Berths Available`;
  updateNavBadges();
}

function getBerthActiveBooking(berthId, date, time) {
  return bookings.find(bk =>
    bk.berthId === berthId &&
    bk.date === date &&
    (bk.status === 'confirmed' || bk.status === 'checked_in') &&
    time >= bk.timeStart &&
    time <= bk.timeEnd
  );
}

// ─── 13. CONFLICT-FREE BOOKING ENGINE ────────────────────────────
function setTodayMin() {
  const dateInput = document.getElementById('bookDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    if (!dateInput.value) dateInput.value = today;
  }
}

function onBookingDateTimeChange() {
  renderBookBerths();
  validateBookingSlot();
}

function selectVesselClass(shipType) {
  selectedShipClass = shipType;
  const cards = {
    'Sloop': document.getElementById('vCardSloop'),
    'Galleon': document.getElementById('vCardGalleon'),
    'Marine Warship': document.getElementById('vCardWarship')
  };
  Object.keys(cards).forEach(k => {
    if (cards[k]) {
      if (k === shipType) cards[k].classList.add('active');
      else cards[k].classList.remove('active');
    }
  });

  const descVessel = document.getElementById('bsDescVessel');
  if (descVessel) descVessel.textContent = shipType;

  // Re-render berths for this ship class
  renderBookBerths();

  // If currently selected berth doesn't match this ship class, auto-assign valid one
  const currentBerth = berths.find(b => b.id === selectedBerthId);
  if (!currentBerth || currentBerth.type !== shipType) {
    autoSelectBestBerth(false);
  } else {
    validateBookingSlot();
  }
}

function selectTimePreset(start, end, presetName, btnEl) {
  selectedPresetName = presetName;
  const tStartInput = document.getElementById('bookTimeStart');
  const tEndInput = document.getElementById('bookTimeEnd');
  if (tStartInput) tStartInput.value = start;
  if (tEndInput) tEndInput.value = end;

  // Hide custom inputs if selecting a standard preset
  const customPanel = document.getElementById('customTimeInputs');
  if (customPanel) customPanel.classList.add('hidden');

  // Update preset buttons active state
  document.querySelectorAll('.tide-preset-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const descTime = document.getElementById('bsDescTime');
  if (descTime) descTime.textContent = `${start} – ${end}`;

  onBookingDateTimeChange();
  playSFX('click');
}

function selectQuickDate(type) {
  const dateInput = document.getElementById('bookDate');
  if (!dateInput) return;

  const now = new Date();
  if (type === 'tomorrow') {
    now.setDate(now.getDate() + 1);
  } else if (type === 'dayAfter') {
    now.setDate(now.getDate() + 2);
  }
  const dateStr = now.toISOString().split('T')[0];
  dateInput.value = dateStr;

  document.querySelectorAll('.date-pill').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(type === 'today' ? 'dpToday' : type === 'tomorrow' ? 'dpTomorrow' : 'dpDayAfter');
  if (activeBtn) activeBtn.classList.add('active');

  onBookingDateTimeChange();
  playSFX('click');
}

function toggleCustomTime(btnEl) {
  selectedPresetName = 'Custom';
  const customPanel = document.getElementById('customTimeInputs');
  if (customPanel) customPanel.classList.remove('hidden');

  document.querySelectorAll('.tide-preset-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const descTime = document.getElementById('bsDescTime');
  if (descTime) descTime.textContent = 'Custom Hours';

  onBookingDateTimeChange();
  playSFX('click');
}

function goToBookingStep(stepNum) {
  bookingCurrentStep = stepNum;
  [1, 2, 3].forEach(n => {
    const tab = document.getElementById(`bStep${n}Tab`);
    if (tab) {
      if (n === stepNum) tab.classList.add('active');
      else tab.classList.remove('active');
    }
  });

  const targetEl = document.getElementById(`bookingStep${stepNum}`);
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  playSFX('click');
}

function autoSelectBestBerth(showFeedback = true) {
  const date = document.getElementById('bookDate')?.value || new Date().toISOString().split('T')[0];
  const tStart = document.getElementById('bookTimeStart')?.value || '16:00';
  const tEnd = document.getElementById('bookTimeEnd')?.value || '20:00';

  // Find compatible berths
  const compatible = berths.filter(b => b.type === selectedShipClass);
  // Find first berth with 0 conflict
  const freeBerth = compatible.find(b => !hasBookingConflict(b.id, date, tStart, tEnd));

  if (freeBerth) {
    selectedBerthId = freeBerth.id;
    renderBookBerths();
    validateBookingSlot();
    if (showFeedback) {
      showToast('success', `✨ Auto-Assigned ${freeBerth.name} (${freeBerth.id})! 100% Free Mooring.`);
      playSFX('book');
    }
  } else {
    // If none in this class are free for this slot, try finding any free berth across harbor
    const anyFree = berths.find(b => !hasBookingConflict(b.id, date, tStart, tEnd));
    if (anyFree) {
      selectVesselClass(anyFree.type);
      selectedBerthId = anyFree.id;
      renderBookBerths();
      validateBookingSlot();
      if (showFeedback) {
        showToast('info', `✨ Auto-Assigned ${anyFree.name} (${anyFree.type})!`);
        playSFX('book');
      }
    } else {
      if (showFeedback) {
        showToast('warning', 'All slips are currently booked for this exact tide window. Try another slot!');
      }
    }
  }
}

function fastTrackBooking() {
  showView('book');
  if (currentUser && currentUser.ship) {
    selectVesselClass(currentUser.ship);
  } else {
    selectVesselClass('Sloop');
  }
  autoSelectBestBerth(true);
}

function renderBookBerths() {
  const grid = document.getElementById('bookBerthGrid');
  if (!grid) return;

  const date = document.getElementById('bookDate')?.value || new Date().toISOString().split('T')[0];
  const tStart = document.getElementById('bookTimeStart')?.value || '16:00';
  const tEnd = document.getElementById('bookTimeEnd')?.value || '20:00';

  // Filter list by selected ship class
  let list = berths.filter(b => b.type === selectedShipClass);
  if (list.length === 0) list = berths;

  // Count available slips for this slot
  const freeCount = list.filter(b => !hasBookingConflict(b.id, date, tStart, tEnd)).length;
  const countEl = document.getElementById('bookFreeCount');
  if (countEl) {
    countEl.textContent = `Showing ${freeCount} of ${list.length} slips available for ${selectedShipClass}`;
  }

  // Update preset badges dynamically
  updatePresetBadges(date);

  grid.innerHTML = list.map(b => {
    const isConflict = date && tStart && tEnd ? hasBookingConflict(b.id, date, tStart, tEnd) : false;
    const isSelected = b.id === selectedBerthId;
    let cls = isSelected ? 'bbc-selected' : isConflict ? 'bbc-unavailable' : 'bbc-available';

    let occupantText = '';
    if (isConflict) {
      const activeBk = bookings.find(bk =>
        bk.berthId === b.id &&
        bk.date === date &&
        (bk.status === 'confirmed' || bk.status === 'checked_in') &&
        tStart < bk.timeEnd && tEnd > bk.timeStart
      );
      occupantText = activeBk ? `Taken by ${activeBk.captainName.split(' ')[0]} until ${activeBk.timeEnd}` : 'Occupied';
    }

    return `
      <div class="bbc-card ${cls}" onclick="selectBookingBerth('${b.id}', ${isConflict})">
        <div class="bbc-top">
          <span class="bbc-id font-heading">${b.id}</span>
          <span class="bbc-emoji">${b.emoji}</span>
        </div>
        <div class="bbc-name font-pirate">${b.name}</div>
        <div class="bbc-type font-heading">Draft: ${b.type}</div>
        <div class="bbc-status-tag font-heading">
          ${isConflict ? `🔒 ${occupantText}` : isSelected ? '✔ SELECTED SLIP' : '🟢 READY TO MOOR'}
        </div>
      </div>
    `;
  }).join('');
}

function updatePresetBadges(date) {
  const presets = [
    { id: 'tpbAvailMorning', start: '08:00', end: '12:00' },
    { id: 'tpbAvailMidday',  start: '12:00', end: '16:00' },
    { id: 'tpbAvailSunset',  start: '16:00', end: '20:00' },
    { id: 'tpbAvailFullDay', start: '08:00', end: '20:00' }
  ];

  presets.forEach(p => {
    const el = document.getElementById(p.id);
    if (el) {
      const free = berths.filter(b => b.type === selectedShipClass && !hasBookingConflict(b.id, date, p.start, p.end)).length;
      if (free > 0) {
        el.textContent = `🟢 ${free} Open Slips`;
        el.style.color = '#34d399';
      } else {
        el.textContent = `🔴 Fully Booked`;
        el.style.color = '#f87171';
      }
    }
  });
}

function hasBookingConflict(berthId, date, timeStart, timeEnd, excludeBookingId = null) {
  if (!timeStart || !timeEnd || timeStart >= timeEnd) return false;
  return bookings.some(bk => {
    if (excludeBookingId && bk.id === excludeBookingId) return false;
    if (bk.berthId !== berthId || bk.date !== date) return false;
    if (bk.status === 'cancelled' || bk.status === 'no_show') return false;
    // Overlapping condition: start1 < end2 && end1 > start2
    return timeStart < bk.timeEnd && timeEnd > bk.timeStart;
  });
}

function selectBookingBerth(berthId, isConflict) {
  const date = document.getElementById('bookDate')?.value || new Date().toISOString().split('T')[0];
  const tStart = document.getElementById('bookTimeStart')?.value || '16:00';
  const tEnd = document.getElementById('bookTimeEnd')?.value || '20:00';

  if (isConflict) {
    const conflictBk = bookings.find(bk =>
      bk.berthId === berthId &&
      bk.date === date &&
      (bk.status === 'confirmed' || bk.status === 'checked_in') &&
      tStart < bk.timeEnd && tEnd > bk.timeStart
    );
    openBerthOccupancyModal(berthId, conflictBk);
    return;
  }

  selectedBerthId = berthId;
  const descSlip = document.getElementById('bsDescSlip');
  if (descSlip) descSlip.textContent = `Slip ${berthId}`;

  renderBookBerths();
  validateBookingSlot();
  playSFX('click');

  // Scroll gently towards the manifest confirmation
  const manifestEl = document.getElementById('voyageManifest');
  if (manifestEl) {
    manifestEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function openBerthOccupancyModal(berthId, conflictBk) {
  const modal = document.getElementById('berthOccupancyModal');
  const body = document.getElementById('berthOccupancyModalBody');
  const berthObj = berths.find(b => b.id === berthId);
  if (!modal || !body || !berthObj) return;

  const date = document.getElementById('bookDate')?.value || new Date().toISOString().split('T')[0];
  const occupant = conflictBk ? conflictBk.captainName : 'Another Pirate Fleet';
  const departTime = conflictBk ? conflictBk.timeEnd : '16:00';

  // Find an alternative free berth for this ship
  const tStart = document.getElementById('bookTimeStart')?.value || '16:00';
  const tEnd = document.getElementById('bookTimeEnd')?.value || '20:00';
  const altBerth = berths.find(b => b.type === berthObj.type && b.id !== berthId && !hasBookingConflict(b.id, date, tStart, tEnd));

  body.innerHTML = `
    <div class="mm-info">
      <div style="font-size:2.4rem;text-align:center;margin-bottom:8px">🔒⚓</div>
      <h4 class="font-pirate text-center" style="font-size:1.2rem;color:var(--gold);margin-bottom:8px">
        ${berthObj.name} (${berthObj.id}) is Currently Occupied
      </h4>
      <p style="color:var(--t300);font-size:0.85rem;line-height:1.5;text-align:center;margin-bottom:16px">
        Reserved by <strong style="color:#fff">${occupant}</strong> until <strong style="color:var(--gold)">${departTime}</strong> on ${date}.
      </p>

      <div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px">
        <strong class="font-heading" style="color:var(--emerald);font-size:0.8rem">1-CLICK CONFLICT SOLUTIONS:</strong>
        
        ${altBerth ? `
          <button class="btn-fast-book font-pirate" style="justify-content:center" onclick="closeModal('berthOccupancyModal');selectBookingBerth('${altBerth.id}', false)">
            <span>⛵</span> Switch to ${altBerth.name} (100% Free Now)
          </button>
        ` : ''}

        <button class="btn-quick-checkin font-pirate" style="justify-content:center" onclick="switchBerthTimeAndSelect('${berthId}', '${departTime}', '20:00')">
          <span>⏰</span> Moor after ${departTime} (${departTime} – 20:00)
        </button>
      </div>

      <div class="mm-actions" style="margin-top:16px">
        <button class="btn-sec" style="width:100%" onclick="closeModal('berthOccupancyModal')">Close</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  playSFX('cancel');
}

function switchBerthTimeAndSelect(berthId, newStart, newEnd) {
  closeModal('berthOccupancyModal');
  const tStartInput = document.getElementById('bookTimeStart');
  const tEndInput = document.getElementById('bookTimeEnd');
  if (tStartInput) tStartInput.value = newStart;
  if (tEndInput) tEndInput.value = newEnd;

  const descTime = document.getElementById('bsDescTime');
  if (descTime) descTime.textContent = `${newStart} – ${newEnd}`;

  selectedBerthId = berthId;
  renderBookBerths();
  validateBookingSlot();
  showToast('success', `Adjusted time to ${newStart} – ${newEnd} for Berth ${berthId}!`);
  playSFX('book');
}

function validateBookingSlot() {
  const date = document.getElementById('bookDate')?.value;
  const tStart = document.getElementById('bookTimeStart')?.value;
  const tEnd = document.getElementById('bookTimeEnd')?.value;
  const conflictMsg = document.getElementById('bookConflictMsg');
  const confirmBtn = document.getElementById('confirmBookBtn');

  const vmBerth = document.getElementById('vmBerthName');
  const vmCaptain = document.getElementById('vmCaptainShip');
  const vmWindow = document.getElementById('vmTimeWindow');
  const vmGuarantee = document.getElementById('vmGuarantee');

  const berthObj = berths.find(b => b.id === selectedBerthId);

  if (berthObj && currentUser) {
    if (vmBerth) vmBerth.textContent = `${berthObj.name} (${berthObj.id} · ${berthObj.type})`;
    if (vmCaptain) vmCaptain.textContent = `Captain ${currentUser.name} (${currentUser.ship || berthObj.type})`;
    if (vmWindow) vmWindow.textContent = `${date || 'Today'} · ${tStart || '00:00'} – ${tEnd || '00:00'}`;
  }

  if (!date || !tStart || !tEnd || !selectedBerthId) {
    if (confirmBtn) confirmBtn.disabled = true;
    if (vmGuarantee) vmGuarantee.textContent = '🔒 Select an available slip above to continue';
    return;
  }

  if (tStart >= tEnd) {
    if (conflictMsg) {
      conflictMsg.textContent = '⚠️ Departure time must be after arrival time!';
      conflictMsg.classList.remove('hidden');
    }
    if (confirmBtn) confirmBtn.disabled = true;
    if (vmGuarantee) vmGuarantee.textContent = '⚠️ Invalid arrival / departure hours';
    return;
  }

  const isConflict = hasBookingConflict(selectedBerthId, date, tStart, tEnd);
  if (isConflict) {
    if (conflictMsg) {
      conflictMsg.textContent = `⚠️ Scheduling Conflict! Slip ${selectedBerthId} is already booked for that window.`;
      conflictMsg.classList.remove('hidden');
    }
    if (confirmBtn) confirmBtn.disabled = true;
    if (vmGuarantee) vmGuarantee.textContent = '⚠️ Mooring Slot Conflict Detected';
  } else {
    if (conflictMsg) conflictMsg.classList.add('hidden');
    if (confirmBtn) confirmBtn.disabled = false;
    if (vmGuarantee) vmGuarantee.textContent = '✅ 100% Conflict-Free Mooring Guaranteed';
  }
}

function createBooking() {
  if (!currentUser) return;
  const date = document.getElementById('bookDate')?.value;
  const tStart = document.getElementById('bookTimeStart')?.value;
  const tEnd = document.getElementById('bookTimeEnd')?.value;
  const notes = document.getElementById('bookNotes')?.value.trim();

  if (!selectedBerthId || !date || !tStart || !tEnd) {
    showToast('error', 'Please complete date, time, and berth selection');
    return;
  }

  if (hasBookingConflict(selectedBerthId, date, tStart, tEnd)) {
    showToast('error', 'Conflict detected! Please select another time slot or berth.');
    return;
  }

  const newBooking = {
    id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
    userId: currentUser.username,
    captainName: currentUser.name || currentUser.username,
    berthId: selectedBerthId,
    shipType: currentUser.ship || selectedShipClass || 'Sloop',
    date: date,
    timeStart: tStart,
    timeEnd: tEnd,
    notes: notes,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  bookings.unshift(newBooking);
  saveData();
  syncToSupabase();

  playSFX('book');
  showToast('success', `Berth ${selectedBerthId} successfully reserved for ${date}!`);
  triggerDendenTransmission(`Berth ${selectedBerthId} confirmed for Captain ${currentUser.name}!`);

  const successMsg = document.getElementById('bookSuccessMsg');
  if (successMsg) {
    successMsg.classList.remove('hidden');
    setTimeout(() => successMsg.classList.add('hidden'), 4000);
  }

  selectedBerthId = null;
  refreshAllViews();
  updateNavBadges();
  setTimeout(() => showView('history'), 1200);
}

function startGrandLineClock() {
  function tick() {
    const el = document.getElementById('liveGrandLineClock');
    if (el) {
      const now = new Date();
      el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
  }
  tick();
  if (grandLineClockInterval) clearInterval(grandLineClockInterval);
  grandLineClockInterval = setInterval(tick, 1000);
}

function updateNavBadges() {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = getNowTimeString();
  const occupiedCount = berths.filter(b => getBerthActiveBooking(b.id, today, nowTime)).length;
  const availCount = berths.length - occupiedCount;

  const availBadge = document.getElementById('navAvailBadge');
  if (availBadge) availBadge.textContent = `${availCount} Open`;

  const histBadge = document.getElementById('navHistoryBadge');
  if (histBadge && currentUser) {
    const userCount = bookings.filter(b => b.userId === currentUser.username).length;
    histBadge.textContent = `${userCount}`;
  }

  const tickerCap = document.getElementById('tickerCapacity');
  if (tickerCap) tickerCap.textContent = `${availCount} / ${berths.length} Berths Available`;
}

function getRankTitle(score) {
  if (score >= 95) return 'Legendary Yonko';
  if (score >= 80) return 'Grand Line Warlord';
  if (score >= 65) return 'Supernova Captain';
  if (score >= 50) return 'East Blue Rookie';
  return 'Harbor Drifter';
}

// ─── 14. CHECK-IN PASS & ARRIVAL VERIFICATION ───────────────────
function openCheckinModal(bookingId = null) {
  if (!currentUser) return;
  const modal = document.getElementById('checkinModal');
  const body = document.getElementById('checkinModalBody');
  if (!modal || !body) return;

  const today = new Date().toISOString().split('T')[0];
  const userBookings = bookings.filter(b =>
    (b.userId === currentUser.username || currentUser.role === 'admin') &&
    b.status === 'confirmed'
  );

  if (userBookings.length === 0) {
    body.innerHTML = `
      <div class="mm-info text-center">
        <p>No confirmed reservations awaiting check-in for your fleet.</p>
        <button class="btn-manga-primary" style="margin-top:14px" onclick="closeModal('checkinModal');showView('book')">
          <span class="bmp-text font-pirate">⚓ Book a Berth Now</span>
        </button>
      </div>
    `;
    modal.style.display = 'flex';
    return;
  }

  const targetBk = bookingId ? userBookings.find(b => b.id === bookingId) : userBookings[0];
  const berthObj = berths.find(b => b.id === targetBk.berthId);

  body.innerHTML = `
    <div class="mm-info">
      <div class="mm-row"><span class="mm-label">Booking ID:</span><span class="mm-val">${targetBk.id}</span></div>
      <div class="mm-row"><span class="mm-label">Berth:</span><span class="mm-val">${berthObj ? berthObj.name : targetBk.berthId}</span></div>
      <div class="mm-row"><span class="mm-label">Date:</span><span class="mm-val">${targetBk.date}</span></div>
      <div class="mm-row"><span class="mm-label">Time Window:</span><span class="mm-val">${targetBk.timeStart} – ${targetBk.timeEnd}</span></div>
      <div class="mm-row"><span class="mm-label">Ship Class:</span><span class="mm-val">${targetBk.shipType}</span></div>
    </div>
    <div class="mm-qr-box text-center" style="background:#fff;padding:12px;border-radius:10px;margin-bottom:16px;display:inline-block;width:100%">
      <div style="font-family:monospace;font-size:0.75rem;color:#1e293b;letter-spacing:2px">
        [ GRAND LINE DOCK PASS QR: ${targetBk.id} ]
      </div>
      <div style="font-size:2.5rem;margin:8px 0">⚓📶🚢</div>
      <small style="color:#64748b">Verified by Galley-La Shipyard Authority</small>
    </div>
    <div class="mm-actions">
      <button class="btn-sec" onclick="closeModal('checkinModal')">Cancel</button>
      <button class="btn-success" onclick="confirmCheckIn('${targetBk.id}')">
        ✅ Complete Dock Check-In
      </button>
    </div>
  `;

  modal.style.display = 'flex';
}

function confirmCheckIn(bookingId) {
  const bk = bookings.find(b => b.id === bookingId);
  if (!bk) return;

  bk.status = 'checked_in';
  bk.checkedInAt = new Date().toISOString();

  // Reward Captain Karma for Punctual Arrival (+2 score)
  const user = users.find(u => u.username === bk.userId);
  if (user) {
    user.score = Math.min(100, (user.score || 100) + CHECKIN_REWARD);
  }

  saveData();
  syncToSupabase();
  closeModal('checkinModal');
  playSFX('checkin');
  showToast('success', `✅ Check-in complete! Berth ${bk.berthId} is now locked for your ship.`);
  triggerDendenTransmission(`Den Den Mushi: Captain ${bk.captainName} has safely moored at Berth ${bk.berthId}!`);
  refreshAllViews();
}

// ─── 15. CANCELLATION ENGINE WITH RELIABILITY PENALTIES ───────────
function openCancelModal(bookingId) {
  const modal = document.getElementById('cancelModal');
  const body = document.getElementById('cancelModalBody');
  const bk = bookings.find(b => b.id === bookingId);
  if (!modal || !body || !bk) return;

  body.innerHTML = `
    <div class="mm-info">
      <p style="color:#fca5a5;margin-bottom:10px">
        ⚠️ Relinquishing your reservation will free Berth ${bk.berthId} for other pirate fleets.
      </p>
      <div class="mm-row"><span class="mm-label">Booking ID:</span><span class="mm-val">${bk.id}</span></div>
      <div class="mm-row"><span class="mm-label">Berth:</span><span class="mm-val">${bk.berthId}</span></div>
      <div class="mm-row"><span class="mm-label">Date & Time:</span><span class="mm-val">${bk.date} (${bk.timeStart} – ${bk.timeEnd})</span></div>
      <div class="mm-row"><span class="mm-label">Reliability Impact:</span><span class="mm-val" style="color:#f87171">-${CANCEL_PENALTY} Karma Points</span></div>
    </div>
    <div class="mm-actions">
      <button class="btn-sec" onclick="closeModal('cancelModal')">Keep Reservation</button>
      <button class="btn-danger" onclick="confirmCancel('${bk.id}')">
        ❌ Confirm Cancellation
      </button>
    </div>
  `;

  modal.style.display = 'flex';
}

function openCancelFromDash() {
  if (!currentUser) return;
  const userBks = bookings.filter(b => b.userId === currentUser.username && b.status === 'confirmed');
  if (userBks.length === 0) {
    showToast('info', 'You have no active confirmed reservations to cancel.');
    return;
  }
  openCancelModal(userBks[0].id);
}

function confirmCancel(bookingId) {
  const bk = bookings.find(b => b.id === bookingId);
  if (!bk) return;

  bk.status = 'cancelled';
  bk.cancelledAt = new Date().toISOString();

  // Deduct penalty
  const user = users.find(u => u.username === bk.userId);
  if (user) {
    user.score = Math.max(0, (user.score || 100) - CANCEL_PENALTY);
    user.cancellations = (user.cancellations || 0) + 1;
  }

  // Audit incident log
  noShowLog.unshift({
    timestamp: new Date().toISOString(),
    username: bk.userId,
    berthId: bk.berthId,
    type: 'User Cancellation',
    impact: `-${CANCEL_PENALTY} Karma`
  });

  saveData();
  syncToSupabase();
  closeModal('cancelModal');
  playSFX('cancel');
  showToast('warning', `Reservation cancelled. Berth ${bk.berthId} is now open to the Grand Line.`);
  refreshAllViews();
}

// ─── 16. AUTOMATED NO-SHOW AUDIT ENGINE ──────────────────────────
function checkNoShows() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const nowMins = now.getHours() * 60 + now.getMinutes();

  let modified = false;

  bookings.forEach(bk => {
    if (bk.status === 'confirmed') {
      if (bk.date < today) {
        // Expired past date
        bk.status = 'no_show';
        penalizeNoShow(bk);
        modified = true;
      } else if (bk.date === today) {
        const [h, m] = bk.timeStart.split(':').map(Number);
        const startMins = h * 60 + m;
        // If 15 minutes past start time without checking in
        if (nowMins > startMins + FORFEITURE_MINS) {
          bk.status = 'no_show';
          penalizeNoShow(bk);
          modified = true;
        }
      }
    }
  });

  if (modified) {
    saveData();
    syncToSupabase();
    refreshAllViews();
  }
}

function penalizeNoShow(bk) {
  const user = users.find(u => u.username === bk.userId);
  if (user) {
    user.score = Math.max(0, (user.score || 100) - NO_SHOW_PENALTY);
    user.noShows = (user.noShows || 0) + 1;
  }
  noShowLog.unshift({
    timestamp: new Date().toISOString(),
    username: bk.userId,
    berthId: bk.berthId,
    type: 'Berth No-Show Forfeiture',
    impact: `-${NO_SHOW_PENALTY} Karma`
  });
  triggerDendenTransmission(`Harbor Alert: No-show logged for Berth ${bk.berthId} by ${bk.captainName}. Slip forfeited!`);
}

// ─── 17. ACTIVE RESERVATION COUNTDOWN BANNER ─────────────────────
function renderActiveCountdown() {
  const section = document.getElementById('activeBookingSection');
  const card = document.getElementById('activeBookingCard');
  if (!section || !card || !currentUser) return;

  const today = new Date().toISOString().split('T')[0];
  const activeBk = bookings.find(b =>
    b.userId === currentUser.username &&
    (b.status === 'confirmed' || b.status === 'checked_in') &&
    b.date >= today
  );

  if (!activeBk) {
    section.style.display = 'none';
    if (countdownIntvl) clearInterval(countdownIntvl);
    return;
  }

  section.style.display = 'block';
  const berthObj = berths.find(b => b.id === activeBk.berthId);

  card.innerHTML = `
    <div class="amc-left">
      <div class="amc-badge font-pirate">
        ${activeBk.status === 'checked_in' ? '✅ VESSEL MOORED' : '⏳ UPCOMING RESERVATION'}
      </div>
      <h3 class="amc-title font-pirate">${berthObj ? berthObj.name : activeBk.berthId}</h3>
      <p class="amc-meta font-heading">
        📅 ${activeBk.date} &nbsp;|&nbsp; ⏰ ${activeBk.timeStart} – ${activeBk.timeEnd} &nbsp;|&nbsp; 🚢 ${activeBk.shipType}
      </p>
      <div class="amc-notes font-lore">"${activeBk.notes || 'All supplies secured for Grand Line passage'}"</div>
    </div>
    <div class="amc-right">
      <div class="amc-timer-label font-heading">Time to Arrival Slot:</div>
      <div class="amc-timer font-pirate" id="countdownTimer">--:--:--</div>
      <div class="amc-actions">
        ${activeBk.status === 'confirmed' ? `
          <button class="btn-success" onclick="openCheckinModal('${activeBk.id}')">Check In</button>
          <button class="btn-danger" onclick="openCancelModal('${activeBk.id}')">Cancel</button>
        ` : `
          <span style="color:#34d399;font-weight:700">Dock Pass Verified</span>
        `}
      </div>
    </div>
  `;

  // Start live timer
  if (countdownIntvl) clearInterval(countdownIntvl);
  updateCountdown(activeBk);
  countdownIntvl = setInterval(() => updateCountdown(activeBk), 1000);
}

function updateCountdown(bk) {
  const timerEl = document.getElementById('countdownTimer');
  if (!timerEl) return;

  const targetDate = new Date(`${bk.date}T${bk.timeStart}:00`);
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    timerEl.textContent = 'WINDOW OPEN';
    timerEl.style.color = '#10b981';
  } else {
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    timerEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    timerEl.style.color = '#f5c518';
  }
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}

// ─── 18. CREW RELIABILITY SCORE & KARMA SHOWCASE ─────────────────
function renderReliabilityScore() {
  if (!currentUser) return;
  const scoreVal = document.getElementById('scoreValue');
  const scoreRank = document.getElementById('scoreRank');
  const arc = document.getElementById('scoreProgressCircle');
  const breakdown = document.getElementById('scoreBreakdown');

  const score = currentUser.score || 100;
  if (scoreVal) scoreVal.textContent = score;

  // Rank Badge logic
  let rank = '⭐ Legendary Yonko';
  let color = '#f5c518';
  if (score < 40) {
    rank = '☠ Castaway / Impel Down Risk';
    color = '#ef4444';
  } else if (score < 65) {
    rank = '🛶 East Blue Rookie';
    color = '#f97316';
  } else if (score < 85) {
    rank = '⚔ Grand Line Supernova';
    color = '#06d6f0';
  } else if (score < 95) {
    rank = '👑 Shichibukai Warlord';
    color = '#8b5cf6';
  }

  if (scoreRank) {
    scoreRank.textContent = rank;
    scoreRank.style.color = color;
  }

  // SVG Circular progress bar
  if (arc) {
    const circumference = 2 * Math.PI * 50; // r=50 -> ~314.16
    const offset = circumference - (score / 100) * circumference;
    arc.style.strokeDasharray = `${circumference}`;
    arc.style.strokeDashoffset = `${offset}`;
    arc.style.stroke = color;
  }

  if (breakdown) {
    const userBookings = bookings.filter(b => b.userId === currentUser.username);
    const userCancels = userBookings.filter(b => b.status === 'cancelled').length;
    const userNoShows = userBookings.filter(b => b.status === 'no_show').length;
    const userDone = userBookings.filter(b => b.status === 'checked_in' || b.status === 'completed').length;

    breakdown.innerHTML = `
      <div class="sb-item"><span>Total Bookings:</span><strong>${userBookings.length}</strong></div>
      <div class="sb-item"><span>Completed & Checked In:</span><strong style="color:#10b981">${userDone}</strong></div>
      <div class="sb-item"><span>Cancellations:</span><strong style="color:#f59e0b">${userCancels}</strong></div>
      <div class="sb-item"><span>No-Show Incidents:</span><strong style="color:#ef4444">${userNoShows}</strong></div>
    `;
  }
}

// ─── 19. VOYAGE LOG & BOOKING HISTORY ────────────────────────────
function renderHistory() {
  const container = document.getElementById('historyList');
  if (!container || !currentUser) return;

  let list = bookings.filter(b => b.userId === currentUser.username || currentUser.role === 'admin');
  if (historyFilter !== 'all') {
    list = list.filter(b => b.status === historyFilter);
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="manga-card-panel text-center" style="padding:40px">
        <h3 class="font-pirate">No Voyage Logs Found</h3>
        <p style="color:#94a3b8;margin-top:6px">No reservations match the selected filter category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(bk => {
    const berthObj = berths.find(b => b.id === bk.berthId);
    let tagClass = 'tag-confirmed';
    let statusText = 'CONFIRMED';
    if (bk.status === 'checked_in') { tagClass = 'tag-checkedin'; statusText = 'CHECKED IN'; }
    else if (bk.status === 'cancelled') { tagClass = 'tag-cancelled'; statusText = 'CANCELLED'; }
    else if (bk.status === 'no_show') { tagClass = 'tag-noshow'; statusText = 'NO SHOW'; }

    return `
      <div class="hmc">
        <div class="h-left">
          <div class="h-id font-heading">${bk.id}</div>
          <div class="h-status-tag ${tagClass} font-pirate">${statusText}</div>
        </div>
        <div class="h-mid">
          <h4 class="h-berth-name font-pirate">${berthObj ? berthObj.name : bk.berthId}</h4>
          <p class="h-meta">
            📅 ${bk.date} &nbsp;•&nbsp; ⏰ ${bk.timeStart} – ${bk.timeEnd} &nbsp;•&nbsp; 🚢 ${bk.shipType}
          </p>
          <div class="h-notes">"${bk.notes || 'Normal harbor docking operations'}"</div>
        </div>
        <div class="h-right">
          ${bk.status === 'confirmed' ? `
            <button class="btn-success" onclick="openCheckinModal('${bk.id}')">Check In</button>
            <button class="btn-danger" onclick="openCancelModal('${bk.id}')">Cancel</button>
          ` : `
            <span class="h-archived">Archived</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function filterHistory(status, btn) {
  historyFilter = status;
  document.querySelectorAll('.hf-row .hf').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderHistory();
  playSFX('click');
}

// ─── 20. ADMIN CONTROL ROOM (DOCKMASTER ICEBURG) ──────────────────
function renderAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') return;
  renderAdminStats();
  renderAdminCharts();
  renderAdminTable();
  renderAdminUsers();
  renderAdminNoShows();
}

function renderAdminStats() {
  const grid = document.getElementById('adminStatsGrid');
  if (!grid) return;

  const totalBks = bookings.length;
  const activeBks = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length;
  const cancels = bookings.filter(b => b.status === 'cancelled').length;
  const noShows = bookings.filter(b => b.status === 'no_show').length;

  grid.innerHTML = `
    <div class="ams cs-gold">
      <div class="ams-val font-pirate">${totalBks}</div>
      <div class="ams-lbl">Total Reservations</div>
    </div>
    <div class="ams cs-green">
      <div class="ams-val font-pirate">${activeBks}</div>
      <div class="ams-lbl">Active & Checked In</div>
    </div>
    <div class="ams cs-teal">
      <div class="ams-val font-pirate">${cancels}</div>
      <div class="ams-lbl">Cancellations</div>
    </div>
    <div class="ams cs-red">
      <div class="ams-val font-pirate">${noShows}</div>
      <div class="ams-lbl">No-Show Incidents</div>
    </div>
  `;
}

function renderAdminCharts() {
  // 1. Status Pie Chart
  const canvas = document.getElementById('statusChart');
  const legend = document.getElementById('pieLegend');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const checkedIn = bookings.filter(b => b.status === 'checked_in').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const noShow = bookings.filter(b => b.status === 'no_show').length;
    const total = bookings.length || 1;

    const slices = [
      { label: 'Confirmed', val: confirmed, color: '#f5c518' },
      { label: 'Checked In', val: checkedIn, color: '#10b981' },
      { label: 'Cancelled', val: cancelled, color: '#06d6f0' },
      { label: 'No-Show', val: noShow, color: '#ef4444' }
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let startAngle = 0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = canvas.width / 2 - 10;

    slices.forEach(s => {
      const sliceAngle = (s.val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.fillStyle = s.color;
      ctx.fill();
      startAngle += sliceAngle;
    });

    if (legend) {
      legend.innerHTML = slices.map(s => `
        <div class="pl-item">
          <span class="pl-dot" style="background:${s.color}"></span>
          <span>${s.label}: <strong>${s.val}</strong> (${Math.round((s.val / total) * 100)}%)</span>
        </div>
      `).join('');
    }
  }

  // 2. Ship Type Bar Chart
  const barWrap = document.getElementById('shipBarChart');
  if (barWrap) {
    const sloops = bookings.filter(b => b.shipType === 'Sloop').length;
    const galleons = bookings.filter(b => b.shipType === 'Galleon').length;
    const warships = bookings.filter(b => b.shipType === 'Marine Warship').length;
    const maxVal = Math.max(sloops, galleons, warships, 1);

    const shipTypes = [
      { name: '🛶 Sloop (Small)', val: sloops, color: '#06d6f0' },
      { name: '⛵ Galleon (Medium)', val: galleons, color: '#f5c518' },
      { name: '🚢 Marine Warship (Heavy)', val: warships, color: '#ef4444' }
    ];

    barWrap.innerHTML = shipTypes.map(s => `
      <div class="bar-item">
        <div class="bar-label"><span>${s.name}</span><strong>${s.val}</strong></div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(s.val / maxVal) * 100}%;background:${s.color}"></div>
        </div>
      </div>
    `).join('');
  }
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  const search = document.getElementById('adminSearch')?.value.toLowerCase() || '';
  if (!tbody) return;

  let list = bookings;
  if (search) {
    list = list.filter(b =>
      b.captainName.toLowerCase().includes(search) ||
      b.berthId.toLowerCase().includes(search) ||
      b.id.toLowerCase().includes(search) ||
      b.shipType.toLowerCase().includes(search)
    );
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td><code>${b.id}</code></td>
      <td><strong>${b.captainName}</strong></td>
      <td>${b.berthId}</td>
      <td>${b.shipType}</td>
      <td>${b.date}</td>
      <td>${b.timeStart} – ${b.timeEnd}</td>
      <td><span class="badge-${b.status}">${b.status.toUpperCase()}</span></td>
      <td>
        ${b.status === 'confirmed' ? `
          <button class="btn-success btn-xs" onclick="confirmCheckIn('${b.id}')">Check In</button>
          <button class="btn-danger btn-xs" onclick="openCancelModal('${b.id}')">Cancel</button>
        ` : `—`}
      </td>
    </tr>
  `).join('');
}

function renderAdminUsers() {
  const tbody = document.getElementById('adminUsersBody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    const userBks = bookings.filter(b => b.userId === u.username);
    const cancels = userBks.filter(b => b.status === 'cancelled').length;
    const noShows = userBks.filter(b => b.status === 'no_show').length;

    return `
      <tr>
        <td><code>${u.username}</code></td>
        <td>${u.name}</td>
        <td>${u.ship}</td>
        <td><strong style="color:#f5c518">⭐ ${u.score || 100}</strong></td>
        <td>${userBks.length}</td>
        <td style="color:#ef4444">${noShows}</td>
        <td style="color:#f59e0b">${cancels}</td>
      </tr>
    `;
  }).join('');
}

function renderAdminNoShows() {
  const tbody = document.getElementById('adminNoshowBody');
  if (!tbody) return;

  tbody.innerHTML = noShowLog.map(ns => `
    <tr>
      <td>${new Date(ns.timestamp).toLocaleString()}</td>
      <td>${ns.username}</td>
      <td>${ns.berthId}</td>
      <td>${ns.type}</td>
      <td><strong style="color:#ef4444">${ns.impact}</strong></td>
    </tr>
  `).join('');
}

// ─── 21. AMBIENT PARTICLES & 3D TILT CARDS ───────────────────────
function initAmbientParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 65 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -Math.random() * 0.45 - 0.15,
    radius: Math.random() * 2 + 0.8,
    color: Math.random() > 0.5 ? 'rgba(6, 214, 240, 0.4)' : 'rgba(245, 197, 24, 0.3)'
  }));

  function animateParticles() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = H + 10;
        p.x = Math.random() * W;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}

function initAuthStars() {
  // Decorative subtle manga grid
}

function initTiltCards() {
  document.querySelectorAll('.qa-manga-card, .ch-stat, .ams, .ps01-card-parchment').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `translateY(-5px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) rotateX(0) rotateY(0) scale(1)';
    });
  });
}

function openBerthQuickAction(berthId) {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = getNowTimeString();
  const activeBk = getBerthActiveBooking(berthId, today, nowTime);
  const berthObj = berths.find(b => b.id === berthId);
  if (!berthObj) return;

  if (!activeBk) {
    showView('book');
    goToBookingStep(3);
    selectVesselClass(berthObj.type);
    selectedBerthId = berthId;
    renderBookBerths();
    validateBookingSlot();
    showToast('success', `⚓ Selected ${berthObj.name} (${berthId}) for immediate reservation!`);
    playSFX('book');
  } else {
    openBerthOccupancyModal(berthId, activeBk);
  }
}

// ─── 22. MODAL & TOAST NOTIFICATION UTILITIES ─────────────────────
function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'none';
}

function showToast(type, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '⚓';
  toast.innerHTML = `<span class="t-icon">${icon}</span><span class="t-msg">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function triggerDendenTransmission(msg) {
  const el = document.getElementById('dendenAlert');
  const msgEl = document.getElementById('dendenMsg');
  if (!el || !msgEl) return;

  msgEl.textContent = msg;
  el.classList.remove('hidden');
  playSFX('book');

  setTimeout(() => {
    el.classList.add('hidden');
  }, 6500);
}

function closeDenden() {
  document.getElementById('dendenAlert')?.classList.add('hidden');
}

function refreshAllViews() {
  renderDashboard();
  renderBookBerths();
  renderHistory();
  renderAdminDashboard();
}

function getNowTimeString() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
