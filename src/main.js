import kaplay from 'kaplay';
import { i18n } from './i18n.js';

// ─── ASSET PRELOAD ───────────────────────────────────────────────────────────
const ASSETS_TO_LOAD = [
  '/assets/background_day.png',
  '/assets/logo.png',
  '/assets/Jugador.png',
  '/assets/ball.png',
];

function preloadImages(urls) {
  return Promise.all(
    urls.map(url => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ url, width: img.width, height: img.height });
      img.onerror = () => resolve({ url, width: 480, height: 854 });
      img.src = url;
    }))
  );
}

const loadingScreen = document.getElementById('loading-screen');
let loadingTimeout = setTimeout(() => {
  if (loadingScreen) loadingScreen.classList.add('show');
}, 200);

preloadImages(ASSETS_TO_LOAD)
  .then((loadedAssets) => {
    clearTimeout(loadingTimeout);
    if (loadingScreen) loadingScreen.remove();
    initGame(loadedAssets);
  })
  .catch(() => {
    clearTimeout(loadingTimeout);
    const textEl = document.getElementById('loading-text');
    if (textEl) { textEl.textContent = 'Error. Refresca la página.'; textEl.style.color = '#ff6432'; }
    if (loadingScreen) loadingScreen.classList.add('show');
  });

// ─── INIT ────────────────────────────────────────────────────────────────────
function initGame(preloadedAssets) {
  const k = kaplay({
    width: 480,
    height: 854,
    background: [26, 10, 46],
    letterbox: true,
    pixelDensity: Math.min(window.devicePixelRatio || 1, 2),
    crisp: false,
    texFilter: 'linear',
    touchToMouse: true,
    debug: false,
  });

  k.canvas.classList.add('loaded');

  k.loadSprite('background_day',   '/assets/background_day.png');
  k.loadSprite('background_night', '/assets/background_night.png');
  k.loadSprite('logo',    '/assets/logo.png');
  k.loadSprite('player',  '/assets/Jugador.png');
  k.loadSprite('ball',    '/assets/ball.png');
  k.loadSprite('pu_rebote',      '/assets/PowerUps/pu_rebote.png');
  k.loadSprite('pu_precision',   '/assets/PowerUps/pu_precision.png');
  k.loadSprite('pu_perfectzone', '/assets/PowerUps/pu_perfectzone.png');
  k.loadSprite('pu_doble',       '/assets/PowerUps/pu_doble.png');
  k.loadSprite('pu_fuego',       '/assets/PowerUps/pu_fuego.png');

  k.onLoad(() => {
    createScenes(k, preloadedAssets);
    k.go('menu');
  });
}

// ─── SCENES ──────────────────────────────────────────────────────────────────
function createScenes(k, preloadedAssets) {
  const bgData     = preloadedAssets.find(a => a.url.includes('background'));
  const logoData   = preloadedAssets.find(a => a.url.includes('logo'));
  const playerData = preloadedAssets.find(a => a.url.includes('Jugador'));

  // ── Settings (persisted across scenes) ──
  const settings = {
    sfxVolume: 0.5,
    musicVolume: 0.4,
    nightMode: false,
    language: 'es',
    powerupsEnabled: true,   // competitive mode toggle
  };

  const getBg = () => settings.nightMode ? 'background_night' : 'background_day';

  const t = (key) => {
    const val = i18n[settings.language][key];
    return typeof val === 'function' ? val : (val || key);
  };

  // ── Music ──
  const TRACKS = ['/assets/music_day.mp3', '/assets/music_night.mp3'];
  let bgMusic = null;
  let musicStarted = false;

  function startMusic() {
    stopMusic();
    musicStarted = true;
    try {
      const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
      bgMusic = new Audio(track);
      bgMusic.volume = settings.musicVolume;
      bgMusic.loop = false;
      const p = bgMusic.play();
      if (p !== undefined) {
        p.then(() => {
          bgMusic.addEventListener('canplay', () => {
            if (bgMusic && bgMusic.duration > 10)
              bgMusic.currentTime = Math.random() * Math.min(bgMusic.duration - 5, 60);
          }, { once: true });
        }).catch(err => { console.warn('[music]', err.message); musicStarted = false; });
      }
      bgMusic.addEventListener('ended', () => { bgMusic = null; musicStarted = false; startMusic(); }, { once: true });
    } catch (e) { bgMusic = null; musicStarted = false; }
  }

  function stopMusic() {
    if (bgMusic) { try { bgMusic.pause(); } catch {} bgMusic.src = ''; bgMusic = null; }
    musicStarted = false;
  }

  function setMusicVolume(v) {
    settings.musicVolume = Math.max(0, Math.min(1, v));
    if (bgMusic) bgMusic.volume = settings.musicVolume;
  }

  function ensureMusicStarted() { if (!musicStarted) startMusic(); }

  function onFirstGesture() {
    document.removeEventListener('pointerdown', onFirstGesture);
    document.removeEventListener('touchstart', onFirstGesture);
    ensureMusicStarted();
  }
  document.addEventListener('pointerdown', onFirstGesture, { passive: true });
  document.addEventListener('touchstart', onFirstGesture, { passive: true });

  // ── Audio SFX ──
  let audioCtx = null;
  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state !== 'running') audioCtx.resume();
    } catch {}
  }
  ['pointerdown','touchstart','mousedown','keydown'].forEach(ev =>
    window.addEventListener(ev, () => ensureAudio(), { once: true, passive: true })
  );

  function playSFX(type) {
    if (settings.sfxVolume === 0) return;
    ensureAudio();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = settings.sfxVolume;

    if (type === 'kick') {
      osc.type = 'sine';
      osc.frequency.value = 220;
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
      gain.gain.value = settings.sfxVolume * 0.7;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'perfect') {
      osc.type = 'triangle';
      osc.frequency.value = 880;
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'good') {
      osc.type = 'triangle';
      osc.frequency.value = 550;
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.value = 200;
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'powerup') {
      osc.frequency.value = 600;
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'combo') {
      osc.frequency.value = 440;
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'rebote') {
      // Shield bounce — low thud + rising tone
      osc.type = 'sine';
      osc.frequency.value = 150;
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.18);
      gain.gain.value = settings.sfxVolume * 0.8;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(); osc.stop(ctx.currentTime + 0.18);
    }
  }

  // ── Persistence ──
  const HS_KEY = 'lareta-high-score';
  function loadHighScore() {
    try { const v = parseInt(localStorage.getItem(HS_KEY), 10); return isNaN(v) ? 0 : v; } catch { return 0; }
  }
  function saveHighScore(s) {
    try { if (s > loadHighScore()) localStorage.setItem(HS_KEY, String(s)); } catch {}
  }

  // ── Shared helpers ──
  function makeBtn(k, label, x, y, w, h, onClick, color) {
    const r = 16;
    const c = color || k.rgb(255, 180, 0);
    k.add([k.rect(w, h, { radius: r }), k.pos(x, y + 6), k.anchor('center'), k.color(0,0,0), k.opacity(0.32), k.z(9)]);
    const btn = k.add([
      k.rect(w, h, { radius: r }), k.pos(x, y), k.anchor('center'),
      k.color(c.r ?? c[0], c.g ?? c[1], c.b ?? c[2]),
      k.outline(4, k.rgb(255, 220, 80)), k.area(), k.z(10),
    ]);
    k.add([k.text(label, { size: Math.round(h * 0.38) }), k.pos(x, y), k.anchor('center'), k.color(255,255,255), k.z(11)]);
    btn.onClick(onClick);
    btn.onHover(() => k.setCursor('pointer'));
    btn.onHoverEnd(() => k.setCursor('default'));
    return btn;
  }

  function addBg(k, opacity) {
    k.add([k.rect(480, 854), k.color(26, 10, 46), k.pos(0,0), k.z(-1)]);
    if (bgData) {
      const sc = Math.max(480 / bgData.width, 854 / bgData.height);
      const bg = k.add([k.sprite(getBg()), k.pos(240, 427), k.anchor('center'), k.scale(sc), k.z(0)]);
      if (opacity !== undefined) bg.opacity = opacity;
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // SCENE: MENU
  // ══════════════════════════════════════════════════════════════════════════
  k.scene('menu', () => {
    k.setGravity(0);
    addBg(k);

    // Night mode toggle (top-right)
    const nightBtn = k.add([k.rect(50,50,{radius:25}), k.pos(450,30), k.anchor('center'), k.color(80,60,120), k.outline(2,k.rgb(180,160,220)), k.area(), k.z(100)]);
    k.add([k.text(settings.nightMode ? '☀️' : '🌙', {size:28}), k.pos(450,30), k.anchor('center'), k.z(101)]);
    nightBtn.onClick(() => { settings.nightMode = !settings.nightMode; k.go('menu'); });
    nightBtn.onHover(() => k.setCursor('pointer')); nightBtn.onHoverEnd(() => k.setCursor('default'));

    // Music mute
    const musicBtn = k.add([k.rect(50,50,{radius:25}), k.pos(390,30), k.anchor('center'), k.color(80,60,120), k.outline(2,k.rgb(180,160,220)), k.area(), k.z(100)]);
    const musicLbl = k.add([k.text(settings.musicVolume===0?'🔇':'🎵',{size:26}), k.pos(390,30), k.anchor('center'), k.z(101)]);
    musicBtn.onClick(() => {
      if (settings.musicVolume > 0) { settings._prevMusicVol = settings.musicVolume; setMusicVolume(0); musicLbl.text = '🔇'; }
      else { setMusicVolume(settings._prevMusicVol || 0.4); musicLbl.text = '🎵'; }
    });
    musicBtn.onHover(() => k.setCursor('pointer')); musicBtn.onHoverEnd(() => k.setCursor('default'));

    // Language toggle (top-left)
    const langBtn = k.add([k.rect(70,50,{radius:25}), k.pos(50,30), k.anchor('center'), k.color(80,60,120), k.outline(2,k.rgb(180,160,220)), k.area(), k.z(100)]);
    k.add([k.text(settings.language==='es'?'ES':'EN',{size:20}), k.pos(50,30), k.anchor('center'), k.color(255,255,255), k.z(101)]);
    langBtn.onClick(() => { settings.language = settings.language==='es'?'en':'es'; k.go('menu'); });
    langBtn.onHover(() => k.setCursor('pointer')); langBtn.onHoverEnd(() => k.setCursor('default'));

    // Competitive mode toggle (⚡ = powerups ON, 🏆 = competitive/no powerups)
    const compColor = () => settings.powerupsEnabled ? k.rgb(80,60,120) : k.rgb(180,120,0);
    const compBtn = k.add([k.rect(50,50,{radius:25}), k.pos(120,30), k.anchor('center'), k.color(compColor()), k.outline(2,k.rgb(180,160,220)), k.area(), k.z(100)]);
    k.add([k.text(settings.powerupsEnabled ? '⚡' : '🏆', {size:26}), k.pos(120,30), k.anchor('center'), k.z(101)]);
    compBtn.onClick(() => { settings.powerupsEnabled = !settings.powerupsEnabled; k.go('menu'); });
    compBtn.onHover(() => k.setCursor('pointer')); compBtn.onHoverEnd(() => k.setCursor('default'));

    // Logo — ~280px wide
    const logoY = 160;
    const logoSc = 280 / 1536;
    k.add([k.sprite('logo'), k.pos(240, logoY), k.anchor('center'), k.scale(logoSc), k.z(2)]);

    // High score
    const hsY = logoY + 60;

    const playBtnY = 770;
    const playBtnH = 70;
    const howToPlayBtnY = playBtnY - playBtnH - 14;

    makeBtn(k, t('menu_how_to_play'), 240, howToPlayBtnY, 260, 52,
      () => { ensureMusicStarted(); k.go('tutorial'); }, k.rgb(60,140,200));
    makeBtn(k, t('menu_play'), 240, playBtnY, 260, playBtnH,
      () => { ensureMusicStarted(); k.go('game'); }, k.rgb(220,60,60));

    // Player character — sits just above the "Cómo jugar" button, as large as possible
    // Asset is 1536x1024. Available space: from below logo to above the button.
    const charBottom = howToPlayBtnY - 30;   // 30px gap above button
    const charTop    = logoY + 85;            // just below logo
    const availH = charBottom - charTop;
    const availW = 480 * 0.88;               // 88% of canvas width
    const scByH  = availH / 1024;
    const scByW  = availW / 1536;
    const charSc = Math.min(scByH, scByW);
    const charH  = 1024 * charSc;
    const charY  = charBottom - charH / 2;
    k.add([k.sprite('player'), k.pos(240, charY), k.anchor('center'), k.scale(charSc), k.z(3)]);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE: TUTORIAL
  // ══════════════════════════════════════════════════════════════════════════
  k.scene('tutorial', () => {
    k.setGravity(0);
    addBg(k, 0.3);
    k.add([k.rect(460,820,{radius:18}), k.pos(240,427), k.anchor('center'), k.color(26,10,46), k.opacity(0.88), k.z(1)]);

    let page = 0;
    const TOTAL = 6;
    const pageObjs = [];
    const clearPage = () => { while (pageObjs.length) { try { k.destroy(pageObjs.pop()); } catch {} } };
    const addObj = (o) => { pageObjs.push(o); return o; };

    function renderPage() {
      clearPage();
      addObj(k.add([k.text(`${page+1}/${TOTAL}`,{size:16}), k.pos(240,760), k.anchor('center'), k.color(255,255,255), k.opacity(0.6), k.z(3)]));

      if (page === 0) {
        addObj(k.add([k.text(t('tutorial_0_title'),{size:28}), k.pos(240,160), k.anchor('center'), k.color(255,220,80), k.z(3)]));
        addObj(k.add([k.text([t('tutorial_0_line1'),t('tutorial_0_line2'),'',t('tutorial_0_line3')].join('\n'),
          {size:20,width:400,lineSpacing:12,align:'center'}), k.pos(240,430), k.anchor('center'), k.color(230,240,255), k.z(3)]));
        addObj(k.add([k.sprite('ball'), k.pos(240,290), k.anchor('center'), k.scale(80/1536), k.z(4)]));
      }
      else if (page === 1) {
        addObj(k.add([k.text(t('tutorial_1_title'),{size:28}), k.pos(240,160), k.anchor('center'), k.color(255,220,80), k.z(3)]));
        addObj(k.add([k.text([t('tutorial_1_line1'),t('tutorial_1_line2'),t('tutorial_1_line3'),'',t('tutorial_1_line4')].join('\n'),
          {size:18,width:400,lineSpacing:12,align:'center'}), k.pos(240,430), k.anchor('center'), k.color(230,240,255), k.z(3)]));
      }
      else if (page === 2) {
        // Layout: título y=110, balón centrado y=330, flechas izq/der a los lados,
        // flecha abajo llega a y=480, gravedad top-right, hitbox label y=680

        addObj(k.add([k.text(t('tutorial_2_title'),{size:26}), k.pos(240,110), k.anchor('center'), k.color(255,220,80), k.z(3)]));

        const BX = 240, BY = 330;
        const BR = 52;
        const BSC = (BR*2) / 1536;

        // Helper: arrow from ball EDGE to tip
        function addArrow(angleDeg, tipX, tipY, col, label, labelX, labelY) {
          const rad = angleDeg * Math.PI / 180;
          const startX = BX + Math.cos(rad) * (BR + 4);
          const startY = BY + Math.sin(rad) * (BR + 4);
          const dx = tipX - startX, dy = tipY - startY;
          const len = Math.sqrt(dx*dx + dy*dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          addObj(k.add([k.rect(len, 4, {radius:2}), k.pos(startX, startY), k.anchor('left'), k.rotate(angle), k.color(col), k.opacity(0.9), k.z(3)]));
          addObj(k.add([k.rect(13, 13), k.pos(tipX, tipY), k.anchor('center'), k.rotate(angle+45), k.color(col), k.opacity(0.9), k.z(3)]));
          addObj(k.add([k.circle(8), k.pos(tipX, tipY), k.anchor('center'), k.color(255,255,255), k.opacity(0.9), k.z(3)]));
          if (label) addObj(k.add([k.text(label,{size:13,width:110,align:'center'}), k.pos(labelX, labelY), k.anchor('center'), k.color(col), k.z(3)]));
        }

        // Roja: sale borde inferior-DERECHO → va arriba-IZQUIERDA  \
        addArrow(45, BX-110, BY-110, k.rgb(255,100,100), t('tutorial_2_left'), BX-148, BY-138);

        // Azul: sale borde inferior-IZQUIERDO → va arriba-DERECHA  /
        addArrow(135, BX+110, BY-110, k.rgb(100,200,255), t('tutorial_2_right'), BX+148, BY-138);

        // Verde → recto arriba |
        addArrow(90, BX, BY+160, k.rgb(120,255,120), t('tutorial_2_below'), 240, 545);

        // Gravedad — centrado arriba
        addObj(k.add([k.text('↓ ' + t('tutorial_2_gravity'),{size:13,width:100,align:'center'}), k.pos(240, 180), k.anchor('center'), k.color(255,180,60), k.opacity(0.9), k.z(3)]));

        // Ball on top (z:6)
        addObj(k.add([k.sprite('ball'), k.pos(BX, BY), k.anchor('center'), k.scale(BSC), k.z(6)]));

        // Hitbox ring
        addObj(k.add([k.circle(BR+18), k.pos(BX, BY), k.anchor('center'), k.color(255,220,80), k.opacity(0), k.outline(2, k.rgb(255,220,80)), k.z(7)]));

        // Hitbox label — bien abajo, zona libre
        addObj(k.add([k.text(t('tutorial_2_hitbox'),{size:14,width:340,align:'center'}), k.pos(240, 680), k.anchor('center'), k.color(255,255,255), k.opacity(0.7), k.z(3)]));
      }
      else if (page === 3) {
        // Powerups page — use actual sprites
        addObj(k.add([k.text(t('tutorial_3_title'),{size:28}), k.pos(240,100), k.anchor('center'), k.color(255,220,80), k.z(3)]));
        const pups = [
          { sprite:'pu_rebote',      label:t('tutorial_3_rebote'),      color:k.rgb(100,200,255) },
          { sprite:'pu_precision',   label:t('tutorial_3_precision'),   color:k.rgb(100,255,180) },
          { sprite:'pu_perfectzone', label:t('tutorial_3_perfectzone'), color:k.rgb(255,220,0)   },
          { sprite:'pu_doble',       label:t('tutorial_3_doble'),       color:k.rgb(255,140,0)   },
          { sprite:'pu_fuego',       label:t('tutorial_3_fuego'),       color:k.rgb(255,80,80)   },
        ];
        const rows = [[0,1,2],[3,4]];
        rows.forEach((row, ri) => {
          const y = 270 + ri * 200;
          row.forEach((idx, ci) => {
            const x = 240 - (row.length-1)*80 + ci*160;
            const p = pups[idx];
            // Sprite icon: 1536x1024, target ~60px tall
            const TU_PU_SCALE = 60 / 1024;
            addObj(k.add([k.sprite(p.sprite), k.pos(x, y), k.anchor('center'), k.scale(TU_PU_SCALE), k.z(4)]));
            addObj(k.add([k.text(p.label,{size:13,width:140,align:'center'}), k.pos(x, y+52), k.anchor('center'), k.color(p.color), k.z(3)]));
          });
        });
      }
      else if (page === 4) {
        addObj(k.add([k.text(t('tutorial_4_title'),{size:28}), k.pos(240,160), k.anchor('center'), k.color(255,220,80), k.z(3)]));
        addObj(k.add([k.text([t('tutorial_4_line1'),'',t('tutorial_4_line2'),'',t('tutorial_4_line3')].join('\n'),
          {size:19,width:400,lineSpacing:12,align:'center'}), k.pos(240,430), k.anchor('center'), k.color(230,240,255), k.z(3)]));
      }
      else if (page === 5) {
        // Home screen controls explanation
        addObj(k.add([k.text(t('tutorial_5_title'),{size:26}), k.pos(240,110), k.anchor('center'), k.color(255,220,80), k.z(3)]));

        const rows = [
          { icon:'ES/EN', col:k.rgb(180,160,255), label:t('tutorial_5_lang')   },
          { icon:'⚡/🏆', col:k.rgb(255,200,80),  label:t('tutorial_5_comp')   },
          { icon:'🎵/🔇', col:k.rgb(100,220,255), label:t('tutorial_5_music')  },
          { icon:'🌙/☀️', col:k.rgb(180,220,255), label:t('tutorial_5_night')  },
        ];
        rows.forEach((r, i) => {
          const y = 240 + i * 110;
          addObj(k.add([k.rect(70,50,{radius:12}), k.pos(70,y), k.anchor('center'), k.color(40,30,60), k.outline(2,r.col), k.z(3)]));
          addObj(k.add([k.text(r.icon,{size:18}), k.pos(70,y), k.anchor('center'), k.color(255,255,255), k.z(4)]));
          addObj(k.add([k.text(r.label,{size:16,width:300,align:'left'}), k.pos(130,y), k.anchor('left'), k.color(230,240,255), k.z(3)]));
        });
      }
    }
    const closeBtn = k.add([k.rect(52,52,{radius:16}), k.pos(440,80), k.anchor('center'), k.color(220,60,60), k.outline(4,k.rgb(255,220,80)), k.area(), k.z(10)]);
    k.add([k.text('✕',{size:28}), k.pos(440,80), k.anchor('center'), k.color(255,255,255), k.z(11)]);
    closeBtn.onClick(() => k.go('menu'));
    closeBtn.onHover(() => k.setCursor('pointer')); closeBtn.onHoverEnd(() => k.setCursor('default'));

    makeBtn(k, t('tutorial_back'), 130, 810, 160, 50, () => { page=(page-1+TOTAL)%TOTAL; renderPage(); });
    makeBtn(k, t('tutorial_next'), 350, 810, 160, 50, () => { page=(page+1)%TOTAL; renderPage(); });
    renderPage();
  });


  // ══════════════════════════════════════════════════════════════════════════
  // SCENE: GAME
  // ══════════════════════════════════════════════════════════════════════════
  k.scene('game', () => {
    k.setGravity(0);
    addBg(k);

    // ── Game State ──
    let score = 0;
    let combo = 0;
    let elapsed = 0;
    let paused = false;
    let gameOver = false;

    // Ball state
    let ballX = 240;
    let ballY = 427;  // centro de pantalla
    let ballVX = 0;
    let ballVY = 0;
    let ballSpin = 0;
    let ballRotation = 0;
    let gameStarted = false;  // física no corre hasta el primer toque válido
    // ball.png: 1536x1024, content bbox x: 289-1247 (958px wide), y: 16-1009 (~993px tall)
    // Target ball diameter on screen: 90px
    // Content width in sprite: 958px → scale = 90/958 = 0.094
    // At that scale, full sprite renders as: 1536*0.094=144px wide, 1024*0.094=96px tall
    // Content renders as: 958*0.094≈90px wide, 993*0.094≈93px tall → ~90px diameter ✓
    const BALL_DIAMETER = 90;
    const BALL_SCALE = BALL_DIAMETER / 958;
    const BALL_RADIUS = BALL_DIAMETER / 2;  // 45px — matches visual size
    const GRAVITY = 980;
    const GROUND_Y = 854 - 50;
    const CEILING_Y = 90 + BALL_RADIUS;  // below HUD
    let hasRebote = false;
    let precisionActive = false;
    let precisionTimer = 0;
    let perfectZoneActive = false;
    let perfectZoneTimer = 0;
    let dobleActive = false;
    let dobleTimer = 0;
    let fuegoActive = false;
    let fuegoTimer = 0;

    const activePowerups = [];
    let powerupSpawnTimer = settings.powerupsEnabled ? 8 : 999999;
    let modalOpen = false;  // shared flag — prevents pause + settings overlapping

    function diffMult() { return 1 + elapsed * 0.01; }

    // ── Ball ──
    const ballObj = k.add([k.sprite('ball'), k.pos(ballX, ballY), k.anchor('center'), k.scale(BALL_SCALE), k.z(20)]);

    // ── HUD ──
    k.add([k.rect(220,110,{radius:12}), k.pos(10,10), k.color(0,0,0), k.opacity(0.65), k.z(99)]);
    const scoreText = k.add([k.text(`${t('game_score')}: 0`,{size:22}), k.pos(18,18), k.color(255,220,80), k.z(100)]);
    const comboText = k.add([k.text('',{size:20}), k.pos(18,48), k.color(255,140,0), k.z(100)]);
    const puText    = k.add([k.text('',{size:17}), k.pos(18,76), k.color(255,255,255), k.z(100)]);

    function refreshPowerupHUD() {
      const parts = [];
      if (hasRebote)         parts.push('🛡');
      if (perfectZoneActive) parts.push(`⭐${perfectZoneTimer.toFixed(1)}s`);
      if (precisionActive)   parts.push(`🎯${precisionTimer.toFixed(1)}s`);
      if (dobleActive)       parts.push(`💰${dobleTimer.toFixed(1)}s`);
      if (fuegoActive)       parts.push(`🔥${fuegoTimer.toFixed(1)}s`);
      puText.text = parts.join(' ');
    }

    const pauseBtn = k.add([k.rect(50,50,{radius:12}), k.pos(450,30), k.anchor('center'), k.color(80,60,120), k.outline(2,k.rgb(180,160,220)), k.area(), k.z(100)]);
    k.add([k.text('⏸',{size:28}), k.pos(450,30), k.anchor('center'), k.z(101)]);

    const settingsBtn = k.add([k.rect(50,50,{radius:12}), k.pos(390,30), k.anchor('center'), k.color(80,60,120), k.outline(2,k.rgb(180,160,220)), k.area(), k.z(100)]);
    k.add([k.text('⚙',{size:28}), k.pos(390,30), k.anchor('center'), k.z(101)]);

    // ── Toast ──
    const toastBg = k.add([k.rect(440,60,{radius:12}), k.pos(240,140), k.anchor('center'), k.color(0,0,0), k.opacity(0), k.z(119)]);
    const toastTxt = k.add([k.text('',{size:22,width:420}), k.pos(240,140), k.anchor('center'), k.color(255,255,255), k.opacity(0), k.z(120)]);
    let toastTimer = 0;

    function showToast(msg, color) {
      toastTxt.text = msg;
      toastTxt.color = color || k.rgb(255,255,255);
      toastTxt.opacity = 1;
      toastBg.opacity = 0.72;
      toastTimer = 0;
    }

    function spawnParticles(x, y, color) {
      for (let i = 0; i < 12; i++) {
        k.add([
          k.circle(k.rand(4,9)),
          k.pos(x, y),
          k.anchor('center'),
          k.color(color || k.rgb(255,220,0)),
          k.opacity(1),
          k.move(k.rand(0,360), k.rand(120,320)),
          k.lifespan(0.6, { fade: 0.3 }),
          k.z(200),
        ]);
      }
    }

    // ── Kick logic ──
    // Solo válido si el toque está dentro del radio de hitbox del balón
    const KICK_HITBOX = BALL_RADIUS * 2.2; // área generosa alrededor del balón

    function kickBall(tapX, tapY) {
      if (gameOver || paused) return;

      const distToBall = Math.sqrt((tapX - ballX) ** 2 + (tapY - ballY) ** 2);
      if (distToBall > KICK_HITBOX) return;

      const offsetX = tapX - ballX;
      const offsetY = tapY - ballY;
      const baseForce = 680 + elapsed * 1.5 * diffMult();
      const force = Math.min(baseForce, 1100);
      const verticalBias = offsetY > 0 ? 1.25 : 0.85;
      const kickVX = -offsetX * 6;
      const kickVY = -force * verticalBias;

      ballVX = kickVX;
      ballVY = kickVY;
      gameStarted = true;
      gameStarted = true;  // arranca la física

      const spinFactor = precisionActive ? 0.25 : 1.0;
      ballSpin = (offsetX / BALL_RADIUS) * 200 * spinFactor;

      // Score: +1 per touch + combo multiplier + fuego bonus
      combo++;
      const comboMult = Math.min(1 + (combo - 1) * 0.12, 3);
      const dobleBonus = dobleActive ? 2 : 1;
      const fuegoBonus = fuegoActive ? combo : 0;  // +combo extra points per touch
      const earned = Math.round(1 * comboMult * dobleBonus) + fuegoBonus;
      score += earned;

      scoreText.text = `${t('game_score')}: ${score}`;
      comboText.text = combo > 1 ? `${t('game_combo')} x${combo}` : '';

      // Fuego: fire trail particles
      if (fuegoActive) {
        spawnParticles(ballX, ballY, k.rgb(255, 100, 0));
      } else {
        spawnParticles(ballX, ballY, k.rgb(255,220,80));
      }
      playSFX('kick');

      if (combo > 1 && combo % 3 === 0) {
        showToast(t('toast_combo')(combo), k.rgb(255,140,0));
        playSFX('combo');
      }
    }

    // ── Powerup spawn ──
    const POWERUP_DEFS = [
      { key: 'rebote',      sprite: 'pu_rebote',      color: k.rgb(100,200,255), weight: 0.5 },  // less frequent
      { key: 'precision',   sprite: 'pu_precision',   color: k.rgb(100,255,180), weight: 1.0 },
      { key: 'perfectzone', sprite: 'pu_perfectzone', color: k.rgb(255,220,0),   weight: 1.0 },
      { key: 'doble',       sprite: 'pu_doble',       color: k.rgb(255,140,0),   weight: 1.0 },
      { key: 'fuego',       sprite: 'pu_fuego',       color: k.rgb(255,80,80),   weight: 1.0 },
    ];

    function spawnPowerup() {
      if (!settings.powerupsEnabled) return;
      // Weighted random
      const totalWeight = POWERUP_DEFS.reduce((sum, p) => sum + p.weight, 0);
      let rand = Math.random() * totalWeight;
      let def = POWERUP_DEFS[0];
      for (const p of POWERUP_DEFS) {
        rand -= p.weight;
        if (rand <= 0) { def = p; break; }
      }

      const x = k.rand(70, 410);
      const y = k.rand(160, 520);
      const lifetime = 3;

      // Powerup sprite: 1536x1024, target ~56px tall on screen
      const PU_SCALE = 56 / 1024;
      const bg = k.add([k.circle(36), k.pos(x,y), k.anchor('center'), k.color(def.color), k.opacity(0.25), k.z(30)]);
      const icon = k.add([k.sprite(def.sprite), k.pos(x,y), k.anchor('center'), k.scale(PU_SCALE), k.z(31)]);
      const ring = k.add([k.circle(36), k.pos(x,y), k.anchor('center'), k.color(def.color), k.opacity(0.7), k.z(29), { t:0, lifetime }]);

      ring.onUpdate(() => {
        ring.t += k.dt();
        const progress = ring.t / ring.lifetime;
        ring.radius = 36 * (1 - progress);
        if (ring.t >= ring.lifetime) {
          k.destroy(bg); k.destroy(icon); k.destroy(ring);
          const idx = activePowerups.findIndex(p => p.ring === ring);
          if (idx !== -1) activePowerups.splice(idx, 1);
        }
      });

      activePowerups.push({ key: def.key, x, y, bg, icon, ring, alive: true });
    }

    function checkPowerupCollision() {
      for (let i = activePowerups.length - 1; i >= 0; i--) {
        const p = activePowerups[i];
        if (!p.alive) continue;
        const dx = ballX - p.x;
        const dy = ballY - p.y;
        if (Math.sqrt(dx*dx + dy*dy) < BALL_RADIUS + 36) {
          p.alive = false;
          try { k.destroy(p.bg); k.destroy(p.icon); k.destroy(p.ring); } catch {}
          activePowerups.splice(i, 1);
          applyPowerup(p.key);
        }
      }
    }

    function applyPowerup(key) {
      playSFX('powerup');
      if (key === 'rebote') {
        hasRebote = true;
        showToast(t('toast_rebote'), k.rgb(100,200,255));
      } else if (key === 'precision') {
        precisionActive = true;
        precisionTimer = 5;
        showToast(t('toast_precision'), k.rgb(100,255,180));
      } else if (key === 'perfectzone') {
        perfectZoneActive = true;
        perfectZoneTimer = 5;
        showToast(t('toast_perfectzone'), k.rgb(255,220,0));
      } else if (key === 'doble') {
        dobleActive = true;
        dobleTimer = 8;
        showToast(t('toast_doble'), k.rgb(255,140,0));
        ballVX *= 1.25;
        ballVY *= 1.25;
      } else if (key === 'fuego') {
        fuegoActive = true;
        fuegoTimer = 10;
        showToast(t('toast_fuego'), k.rgb(255,80,80));
      }
      refreshPowerupHUD();
    }

    function endGame() {
      if (gameOver) return;
      gameOver = true;
      playSFX('fail');
      spawnParticles(ballX, ballY, k.rgb(255,80,80));
      stopMusic();
      saveHighScore(score);
      k.wait(0.6, () => k.go('gameover', { score, highScore: loadHighScore() }));
    }

    // ── Input — usa onClick que funciona con mouse y touch ──
    k.onClick(() => {
      if (paused || modalOpen) return;
      const pos = k.mousePos();
      if (pos.y < 80 && pos.x > 330) return;
      kickBall(pos.x, pos.y);
    });

    k.onTouchStart((id, pos) => {
      if (paused || modalOpen) return;
      if (pos.y < 80 && pos.x > 330) return;
      kickBall(pos.x, pos.y);
    });

    // ── Main update loop ──
    k.onUpdate(() => {
      if (paused || gameOver) return;
      const dt = k.dt();
      elapsed += dt;

      if (toastTxt.opacity > 0) {
        toastTimer += dt;
        if (toastTimer > 1.2) {
          toastTxt.opacity = Math.max(0, toastTxt.opacity - 2*dt);
          toastBg.opacity = toastTxt.opacity * 0.72;
        }
      }

      if (precisionTimer > 0)   { precisionTimer -= dt;   if (precisionTimer <= 0)   { precisionActive = false;   precisionTimer = 0;   refreshPowerupHUD(); } }
      if (perfectZoneTimer > 0) { perfectZoneTimer -= dt; if (perfectZoneTimer <= 0) { perfectZoneActive = false; perfectZoneTimer = 0; refreshPowerupHUD(); } }
      if (dobleTimer > 0)       { dobleTimer -= dt;       if (dobleTimer <= 0)       { dobleActive = false;       dobleTimer = 0;       refreshPowerupHUD(); } }
      if (fuegoTimer > 0) { fuegoTimer -= dt; if (fuegoTimer <= 0) { fuegoActive = false; fuegoTimer = 0; refreshPowerupHUD(); } }

      // Refresh countdown display every frame while any timed powerup is active
      if (precisionActive || perfectZoneActive || dobleActive || fuegoActive) refreshPowerupHUD();

      if (settings.powerupsEnabled) {
        powerupSpawnTimer -= dt;
        if (powerupSpawnTimer <= 0) {
          powerupSpawnTimer = k.rand(9, 15);
          spawnPowerup();
        }
      }

      // Ball physics — solo corre después del primer toque
      if (!gameStarted) return;

      ballVY += GRAVITY * dt;

      // Instability — crece con el tiempo
      const instability = Math.min(elapsed * 0.4, 50);
      ballVX += (Math.random() - 0.5) * instability * dt;

      // Cap horizontal velocity so ball never flies off screen
      ballVX = Math.max(-600, Math.min(600, ballVX));

      ballX += ballVX * dt;
      ballY += ballVY * dt;

      // Wall bounce — balón siempre dentro de pantalla
      if (ballX < BALL_RADIUS)           { ballX = BALL_RADIUS;           ballVX =  Math.abs(ballVX) * 0.65; }
      if (ballX > 480 - BALL_RADIUS)     { ballX = 480 - BALL_RADIUS;     ballVX = -Math.abs(ballVX) * 0.65; }
      if (ballY < CEILING_Y)             { ballY = CEILING_Y;             ballVY =  Math.abs(ballVY) * 0.55; }
      if (ballY > GROUND_Y - BALL_RADIUS){ ballY = GROUND_Y - BALL_RADIUS; }

      // Spin
      ballRotation += ballSpin * dt;
      ballSpin *= 0.96;

      ballObj.pos.x = ballX;
      ballObj.pos.y = ballY;
      ballObj.angle = ballRotation;

      checkPowerupCollision();

      // Ground check
      if (ballY + BALL_RADIUS >= GROUND_Y) {
        if (hasRebote) {
          hasRebote = false;
          ballVY = -650;
          ballY = GROUND_Y - BALL_RADIUS - 1;
          showToast(t('toast_saved'), k.rgb(100,200,255));
          playSFX('rebote');
          refreshPowerupHUD();
        } else {
          if (fuegoActive) { fuegoActive = false; fuegoTimer = 0; refreshPowerupHUD(); }
          endGame();
        }
      }
    });

    // ── Pause ──
    pauseBtn.onClick(() => {
      if (modalOpen) return;
      if (paused) { paused = false; return; }
      paused = true;
      modalOpen = true;
      const objs = [];
      const add = (o) => { objs.push(o); return o; };
      const close = () => { objs.forEach(o => { try { k.destroy(o); } catch {} }); paused = false; modalOpen = false; };

      add(k.add([k.rect(360,280,{radius:18}), k.pos(240,427), k.anchor('center'), k.color(26,10,46), k.opacity(0.96), k.z(200)]));
      add(k.add([k.text(t('game_pause'),{size:32}), k.pos(240,340), k.anchor('center'), k.color(255,255,255), k.z(201)]));

      const cont = add(k.add([k.rect(240,52,{radius:14}), k.pos(240,420), k.anchor('center'), k.color(60,180,100), k.outline(3,k.rgb(120,220,160)), k.area(), k.z(201)]));
      add(k.add([k.text(t('game_pause_continue'),{size:22}), k.pos(240,420), k.anchor('center'), k.color(255,255,255), k.z(202)]));
      cont.onClick(close); cont.onHover(() => k.setCursor('pointer')); cont.onHoverEnd(() => k.setCursor('default'));

      const quit = add(k.add([k.rect(240,52,{radius:14}), k.pos(240,490), k.anchor('center'), k.color(180,60,60), k.outline(3,k.rgb(220,120,120)), k.area(), k.z(201)]));
      add(k.add([k.text(t('game_pause_quit'),{size:22}), k.pos(240,490), k.anchor('center'), k.color(255,255,255), k.z(202)]));
      quit.onClick(() => { close(); endGame(); }); quit.onHover(() => k.setCursor('pointer')); quit.onHoverEnd(() => k.setCursor('default'));
    });
    pauseBtn.onHover(() => k.setCursor('pointer')); pauseBtn.onHoverEnd(() => k.setCursor('default'));

    // ── Settings ──
    settingsBtn.onClick(() => {
      if (modalOpen) return; // pausa ya abierta
      paused = true;
      modalOpen = true;
      const objs = [];
      const add = (o) => { objs.push(o); return o; };
      const close = () => { objs.forEach(o => { try { k.destroy(o); } catch {} }); paused = false; modalOpen = false; };

      add(k.add([k.rect(360,320,{radius:18}), k.pos(240,427), k.anchor('center'), k.color(26,10,46), k.opacity(0.96), k.z(200)]));
      add(k.add([k.text(t('settings_title'),{size:22}), k.pos(240,300), k.anchor('center'), k.color(255,255,255), k.z(201)]));

      function volRow(label, getVal, onDown, onUp, onMute, y) {
        add(k.add([k.text(label,{size:16}), k.pos(90,y), k.anchor('center'), k.color(200,180,255), k.z(201)]));
        const valLbl = add(k.add([k.text(`${Math.round(getVal()*100)}%`,{size:16}), k.pos(185,y), k.anchor('center'), k.color(230,240,255), k.z(201)]));
        const bm = add(k.add([k.rect(36,36,{radius:8}), k.pos(230,y), k.anchor('center'), k.color(80,60,120), k.area(), k.z(201)]));
        add(k.add([k.text('−',{size:22}), k.pos(230,y), k.anchor('center'), k.color(255,255,255), k.z(202)]));
        const bp = add(k.add([k.rect(36,36,{radius:8}), k.pos(274,y), k.anchor('center'), k.color(80,60,120), k.area(), k.z(201)]));
        add(k.add([k.text('+',{size:22}), k.pos(274,y), k.anchor('center'), k.color(255,255,255), k.z(202)]));
        const bmute = add(k.add([k.rect(36,36,{radius:8}), k.pos(318,y), k.anchor('center'), k.color(80,60,120), k.area(), k.z(201)]));
        add(k.add([k.text('🔇',{size:18}), k.pos(318,y), k.anchor('center'), k.z(202)]));
        bm.onClick(() => { onDown(); valLbl.text=`${Math.round(getVal()*100)}%`; }); bm.onHover(()=>k.setCursor('pointer')); bm.onHoverEnd(()=>k.setCursor('default'));
        bp.onClick(() => { onUp(); valLbl.text=`${Math.round(getVal()*100)}%`; }); bp.onHover(()=>k.setCursor('pointer')); bp.onHoverEnd(()=>k.setCursor('default'));
        bmute.onClick(() => { onMute(); valLbl.text=`${Math.round(getVal()*100)}%`; }); bmute.onHover(()=>k.setCursor('pointer')); bmute.onHoverEnd(()=>k.setCursor('default'));
      }

      volRow('SFX', ()=>settings.sfxVolume, ()=>{settings.sfxVolume=Math.max(0,settings.sfxVolume-0.1);}, ()=>{settings.sfxVolume=Math.min(1,settings.sfxVolume+0.1);}, ()=>{settings.sfxVolume=0;}, 370);
      volRow('🎵 Música', ()=>settings.musicVolume, ()=>setMusicVolume(settings.musicVolume-0.1), ()=>setMusicVolume(settings.musicVolume+0.1), ()=>setMusicVolume(0), 430);

      const cb = add(k.add([k.rect(160,44,{radius:12}), k.pos(240,530), k.anchor('center'), k.color(220,60,60), k.outline(3,k.rgb(255,220,80)), k.area(), k.z(201)]));
      add(k.add([k.text(t('tutorial_back'),{size:20}), k.pos(240,530), k.anchor('center'), k.color(255,255,255), k.z(202)]));
      cb.onClick(close); cb.onHover(()=>k.setCursor('pointer')); cb.onHoverEnd(()=>k.setCursor('default'));
    });
    settingsBtn.onHover(()=>k.setCursor('pointer')); settingsBtn.onHoverEnd(()=>k.setCursor('default'));

    const onVis = () => { if (document.hidden && !paused) paused = true; };
    document.addEventListener('visibilitychange', onVis);
    k.onSceneLeave(() => document.removeEventListener('visibilitychange', onVis));

    k.onKeyPress('escape', () => k.go('menu'));
  });


  // ══════════════════════════════════════════════════════════════════════════
  // SCENE: GAMEOVER
  // ══════════════════════════════════════════════════════════════════════════
  k.scene('gameover', (data) => {
    const finalScore = data?.score ?? 0;
    const highScore  = data?.highScore ?? loadHighScore();
    k.setGravity(0);
    addBg(k, 0.25);
    k.add([k.rect(460,820,{radius:18}), k.pos(240,427), k.anchor('center'), k.color(26,10,46), k.opacity(0.92), k.z(1)]);
    k.add([k.text(t('gameover_title'),{size:44}), k.pos(240,110), k.anchor('center'), k.color(220,60,60), k.z(2)]);
    k.add([k.text(t('gameover_score')(finalScore),{size:26}), k.pos(240,200), k.anchor('center'), k.color(255,255,255), k.z(2)]);
    k.add([k.text(t('gameover_high_score')(highScore),{size:20}), k.pos(240,240), k.anchor('center'), k.color(255,220,80), k.z(2)]);

    k.add([k.text(t('gameover_save_prompt'),{size:18}), k.pos(240,295), k.anchor('center'), k.color(255,220,80), k.z(2)]);
    let playerName = '';
    let saved = false;

    const prev = document.getElementById('lr-name-input');
    if (prev) prev.remove();

    const nameBox = k.add([k.rect(280,42,{radius:12}), k.pos(200,335), k.anchor('center'), k.color(40,30,60), k.outline(2,k.rgb(140,100,220)), k.area(), k.z(2)]);
    const nameDisplay = k.add([k.text('',{size:20}), k.pos(200,335), k.anchor('center'), k.color(230,240,255), k.z(3)]);
    const placeholder = k.add([k.text(t('gameover_input_placeholder'),{size:18}), k.pos(200,335), k.anchor('center'), k.color(120,100,160), k.opacity(0.7), k.z(3)]);

    const domInput = document.createElement('input');
    domInput.id = 'lr-name-input';
    domInput.type = 'text';
    domInput.maxLength = 20;
    domInput.autocapitalize = 'words';
    Object.assign(domInput.style, { position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:'1px', height:'1px', opacity:'0', zIndex:'9999', border:'0', background:'transparent', color:'transparent', caretColor:'transparent' });
    document.body.appendChild(domInput);

    domInput.addEventListener('input', () => {
      if (saved) return;
      playerName = domInput.value.slice(0, 20);
      nameDisplay.text = playerName;
      placeholder.opacity = playerName.length ? 0 : 0.7;
    });
    nameBox.onClick(() => { if (!saved) { domInput.focus(); setTimeout(() => domInput.focus(), 20); } });
    nameBox.onHover(() => k.setCursor('text')); nameBox.onHoverEnd(() => k.setCursor('default'));

    const saveBtn = k.add([k.rect(50,42,{radius:12}), k.pos(370,335), k.anchor('center'), k.color(60,180,100), k.outline(2,k.rgb(120,220,160)), k.area(), k.z(2)]);
    k.add([k.text('💾',{size:26}), k.pos(370,335), k.anchor('center'), k.z(3)]);

    const saveName = () => {
      if (saved || playerName.length === 0) return;
      saved = true;
      fetch('/api/leaderboard', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name:playerName, score:finalScore }) })
        .then(() => { nameDisplay.text = t('gameover_saved_status'); nameDisplay.color = k.rgb(120,220,160); domInput.blur(); })
        .catch(() => { nameDisplay.text = t('gameover_error'); nameDisplay.color = k.rgb(255,100,100); });
    };
    saveBtn.onClick(saveName);
    saveBtn.onHover(() => k.setCursor('pointer')); saveBtn.onHoverEnd(() => k.setCursor('default'));
    k.onKeyPress('enter', saveName);

    makeBtn(k, t('gameover_play_again'), 240, 420, 280, 52, () => { domInput.remove(); k.go('game'); });
    makeBtn(k, t('gameover_leaderboard'), 240, 485, 280, 52, () => { domInput.remove(); k.go('leaderboard', { score:finalScore }); }, k.rgb(100,80,200));
    makeBtn(k, t('gameover_menu'), 240, 550, 280, 52, () => { domInput.remove(); k.go('menu'); }, k.rgb(60,140,200));

    const back = k.add([k.rect(110,36,{radius:12}), k.pos(70,60), k.anchor('center'), k.color(220,60,60), k.outline(3,k.rgb(255,220,80)), k.area(), k.z(20)]);
    k.add([k.text(t('gameover_menu'),{size:16}), k.pos(70,60), k.anchor('center'), k.color(255,255,255), k.z(21)]);
    back.onClick(() => { domInput.remove(); k.go('menu'); });
    back.onHover(() => k.setCursor('pointer')); back.onHoverEnd(() => k.setCursor('default'));

    k.onSceneLeave(() => { const inp = document.getElementById('lr-name-input'); if (inp) inp.remove(); });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE: LEADERBOARD
  // ══════════════════════════════════════════════════════════════════════════
  k.scene('leaderboard', (data) => {
    const myScore = data?.score;
    k.setGravity(0);
    addBg(k, 0.25);
    k.add([k.rect(460,800,{radius:18}), k.pos(240,427), k.anchor('center'), k.color(26,10,46), k.opacity(0.92), k.z(1)]);
    k.add([k.text(t('gameover_leaderboard'),{size:34}), k.pos(240,100), k.anchor('center'), k.color(255,220,80), k.z(2)]);

    const loadingText = k.add([k.text(t('leaderboard_loading'),{size:20}), k.pos(240,420), k.anchor('center'), k.color(240,245,255), k.z(2)]);

    fetch('/api/leaderboard')
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(rows => {
        try { k.destroy(loadingText); } catch {}
        if (!Array.isArray(rows) || rows.length === 0) {
          k.add([k.text(t('leaderboard_empty'),{size:20,align:'center'}), k.pos(240,420), k.anchor('center'), k.color(240,245,255), k.z(2)]);
          return;
        }
        const lines = rows.slice(0,10).map((r,i) => `${i+1}. ${r.name}  ${r.score} pts`).join('\n');
        k.add([k.text(lines,{size:18,width:420,lineSpacing:10}), k.pos(240,420), k.anchor('center'), k.color(240,245,255), k.z(2)]);
      })
      .catch(err => {
        try { k.destroy(loadingText); } catch {}
        k.add([k.text(`${t('leaderboard_error')}\n${err.message}`,{size:18,width:400,align:'center'}), k.pos(240,420), k.anchor('center'), k.color(255,120,120), k.z(2)]);
      });

    const backBtn = k.add([k.rect(200,48,{radius:14}), k.pos(240,760), k.anchor('center'), k.color(220,60,60), k.outline(3,k.rgb(255,220,80)), k.area(), k.z(3)]);
    k.add([k.text(t('tutorial_back'),{size:22}), k.pos(240,760), k.anchor('center'), k.color(255,255,255), k.z(4)]);
    backBtn.onClick(() => myScore !== undefined ? k.go('gameover', { score:myScore, highScore:loadHighScore() }) : k.go('menu'));
    backBtn.onHover(() => k.setCursor('pointer')); backBtn.onHoverEnd(() => k.setCursor('default'));
  });

} // end createScenes
