/* Aqua Dream poster: glossy Y2K / frutiger aero idol poster.
   Everything decorative is drawn here: gel stickers (SVG), glitter + bubbles (canvas),
   swimming fish, a working media player, tilt/parallax, and the photo slot. */
(() => {
  'use strict';

  const W = 1080, H = 1440;
  const STORE_KEY = 'aqua-dream-poster:v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const f2 = n => +n.toFixed(2);

  const stage = $('#stage'), wrap = $('#poster-wrap'), tilt = $('#poster-tilt'), poster = $('#poster');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ storage */
  const saved = (() => {
    try { return Object.assign({ text: {}, pos: {} }, JSON.parse(localStorage.getItem(STORE_KEY)) || {}); }
    catch { return { text: {}, pos: {} }; }
  })();
  const persist = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch { /* storage unavailable */ } };

  /* ------------------------------------------------------------ gel sticker SVGs */
  let uidN = 0;
  const uid = () => 'ad' + (++uidN);

  const PAL = {
    blue:   { hi: '#e6f8ff', mid: '#59bdff', lo: '#1167d6', rim: '#0b56b4', glow: '#b8ecff' },
    green:  { hi: '#f6ffdc', mid: '#a2e352', lo: '#3f9c14', rim: '#2f7d0b', glow: '#e4ffb0' },
    pink:   { hi: '#fff0f8', mid: '#ff9fcf', lo: '#e2559a', rim: '#c23d7d', glow: '#ffd6ec' },
    white:  { hi: '#ffffff', mid: '#f1f5fa', lo: '#b4c3d4', rim: '#93a6bb', glow: '#ffffff' },
    yellow: { hi: '#fffbe3', mid: '#ffe066', lo: '#eaa800', rim: '#c98c00', glow: '#fff3b0' },
  };

  // Path helpers. Paths passed through these use only absolute M/L/C/Q commands.
  const pairs = d => { const n = d.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; };
  const boxOf = d => { const p = pairs(d), xs = p.map(q => q[0]), ys = p.map(q => q[1]); const x = Math.min(...xs), y = Math.min(...ys); return [x, y, Math.max(...xs) - x, Math.max(...ys) - y]; };
  const mapPath = (d, fn) => d.replace(/(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)/g, (_, x, y) => fn(+x, +y).map(f2).join(' '));
  const rot = (x, y, deg, cx = 50, cy = 50) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
  const toward = (p, q, r) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), t = Math.min(r, L / 2) / L; return [f2(p[0] + dx * t), f2(p[1] + dy * t)]; };
  function roundStar(cx, cy, R, r, ro, ri, n = 5) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = (-90 + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    let d = '';
    pts.forEach((p, i) => {
      const rad = i % 2 ? ri : ro, a = toward(p, pts[(i + pts.length - 1) % pts.length], rad), b = toward(p, pts[(i + 1) % pts.length], rad);
      d += (i ? 'L' : 'M') + a.join(' ') + 'Q' + p.map(f2).join(' ') + ' ' + b.join(' ');
    });
    return d + 'Z';
  }

  const HEART = 'M50 90C22 70 6 52 8 32C10 14 32 6 50 26C68 6 90 14 92 32C94 52 78 70 50 90Z';
  const SPARK = 'M50 0C53 35 65 47 100 50C65 53 53 65 50 100C47 65 35 53 0 50C35 47 47 35 50 0Z';
  const SVG_OPEN = v => `<svg viewBox="${v}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;

  /* A gel shape: white die-cut border, per-part 3D shading, top shine and bottom bounce light. */
  function glossy(view, parts, pal, o = {}) {
    const id = uid(), out = o.outline ?? 7;
    parts = parts.map(p => (p.d ? { ...p, s: `<path d="${p.d}"/>`, b: p.b || boxOf(p.d) } : p));
    const shapes = parts.map(p => p.s).join('');
    const shine = parts.map(({ b: [x, y, w, h], hl = 1 }) => hl
      ? `<ellipse cx="${f2(x + w * .5)}" cy="${f2(y + h * .97)}" rx="${f2(w * .42)}" ry="${f2(h * .3)}" fill="url(#${id}g)"/>` +
        `<ellipse cx="${f2(x + w * .42)}" cy="${f2(y + h * .25)}" rx="${f2(w * .3 * hl)}" ry="${f2(h * .14 * hl)}" fill="url(#${id}h)" transform="rotate(-14 ${f2(x + w * .42)} ${f2(y + h * .25)})"/>`
      : '').join('');
    return SVG_OPEN(view) +
      '<defs>' +
        `<radialGradient id="${id}b" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="${pal.hi}"/><stop offset=".45" stop-color="${pal.mid}"/><stop offset="1" stop-color="${pal.lo}"/></radialGradient>` +
        `<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>` +
        `<radialGradient id="${id}g"><stop offset="0" stop-color="${pal.glow}" stop-opacity=".8"/><stop offset="1" stop-color="${pal.glow}" stop-opacity="0"/></radialGradient>` +
        `<clipPath id="${id}c">${shapes}</clipPath>` +
      '</defs>' +
      (out ? `<g fill="#fff" stroke="#fff" stroke-width="${out * 2}" stroke-linejoin="round">${shapes}</g>` : '') +
      `<g fill="url(#${id}b)" stroke="${pal.rim}" stroke-opacity=".45" stroke-width="1.2">${shapes}</g>` +
      `<g clip-path="url(#${id}c)">${shine}</g>` +
      (o.extra || '') + '</svg>';
  }

  function fishSVG(kind) {
    const id = uid();
    const body = 'M18 36C18 19 42 9 66 9C90 9 106 22 108 36C106 50 90 63 66 63C42 63 18 53 18 36Z';
    const tail = 'M26 36C17 27 10 19 3 14C7 27 7 45 3 58C10 53 17 45 26 36Z';
    const dorsal = 'M42 13C50 0 72 -2 84 12Z';
    const pelvic = 'M54 58C58 69 70 71 76 60Z';
    const K = {
      clown: { c: ['#ffc46e', '#ff7f1f', '#e0520a'], edge: '#3a1d0c', fin: '#ff8a2a', tail: '#ff8a2a',
        marks: ['M86 4C95 22 95 50 86 68L74 68C83 50 83 22 74 4Z', 'M61 4C68 22 68 50 61 68L47 68C54 50 54 22 47 4Z', 'M34 10C38 26 38 46 34 62L26 62C30 46 30 26 26 10Z']
          .map(d => `<path d="${d}" fill="#fff" stroke="#3a1d0c" stroke-width="2"/>`).join('') },
      tang: { c: ['#86ccff', '#2272e8', '#0d3fae'], edge: '#0f1f4a', fin: '#1b3f9e', tail: '#ffd21e',
        marks: '<path d="M101 25C85 14 57 14 35 24C30 27 31 32 37 31C52 28 60 34 55 45C67 35 84 34 104 39C106 33 105 28 101 25Z" fill="#0f1f4a"/>' },
      yellow: { c: ['#fff6a0', '#ffd51f', '#e6a600'], edge: '#2a2208', fin: '#ffd51f', tail: '#ffd51f',
        marks: ['M82 4C90 22 90 50 82 68L70 68C78 50 78 22 70 4Z', 'M52 6C58 24 58 48 52 66L41 66C47 48 47 24 41 6Z']
          .map(d => `<path d="${d}" fill="#1d1a10"/>`).join('') },
    }[kind];
    return SVG_OPEN('-4 -8 118 82') +
      `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.c[0]}"/><stop offset=".55" stop-color="${K.c[1]}"/><stop offset="1" stop-color="${K.c[2]}"/></linearGradient>` +
      `<clipPath id="${id}c"><path d="${body}"/></clipPath></defs>` +
      `<g fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"><path d="${body}"/><path d="${dorsal}"/><path d="${pelvic}"/></g>` +
      `<g class="tail"><path d="${tail}" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"/><path d="${tail}" fill="${K.tail}" stroke="${K.edge}" stroke-width="2" stroke-linejoin="round"/></g>` +
      `<path d="${dorsal}" fill="${K.fin}" stroke="${K.edge}" stroke-width="2"/><path d="${pelvic}" fill="${K.fin}" stroke="${K.edge}" stroke-width="2"/>` +
      `<path d="${body}" fill="url(#${id}b)" stroke="${K.edge}" stroke-width="2"/>` +
      `<g clip-path="url(#${id}c)">${K.marks}<ellipse cx="62" cy="19" rx="32" ry="7" fill="#fff" opacity=".55"/></g>` +
      `<circle cx="95" cy="30" r="5.5" fill="#fff" stroke="${K.edge}" stroke-width="1.5"/><circle cx="96" cy="30.5" r="3.2" fill="#111"/><circle cx="97.2" cy="29" r="1.2" fill="#fff"/>` +
      `<path d="M105 41Q101.5 43 98 41.5" fill="none" stroke="${K.edge}" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }

  const ICONS = {
    buddy: (c = 'blue', out = 7) => glossy('0 0 100 116', [
      { d: 'M14 100C14 72 30 58 50 58C70 58 86 72 86 100C86 104 83 106 79 106L21 106C17 106 14 104 14 100Z' },
      { s: '<circle cx="50" cy="32" r="22"/>', b: [28, 10, 44, 44] },
    ], PAL[c], { outline: +out }),

    note: (c = 'blue') => glossy('0 0 104 104', [
      { s: '<path d="M37 24L90 11L90 27L37 40Z"/>', b: [37, 11, 53, 29], hl: .8 },
      { s: '<rect x="37" y="26" width="8" height="54" rx="3"/>', b: [37, 26, 8, 54], hl: 0 },
      { s: '<rect x="82" y="15" width="8" height="54" rx="3"/>', b: [82, 15, 8, 54], hl: 0 },
      { s: '<ellipse cx="29" cy="80" rx="15" ry="11" transform="rotate(-22 29 80)"/>', b: [14, 69, 30, 22] },
      { s: '<ellipse cx="74" cy="69" rx="15" ry="11" transform="rotate(-22 74 69)"/>', b: [59, 58, 30, 22] },
    ], PAL[c]),

    heart: (c = 'pink', out = 6) => glossy('0 0 100 100', [{ d: HEART }], PAL[c], { outline: +out }),

    clover: (c = 'green', out = 6) => glossy('0 0 100 100',
      [0, 90, 180, 270].map(a => ({ d: mapPath(HEART, (x, y) => rot(27 + x * .46, 8.6 + y * .46, a)) })),
      PAL[c], { outline: +out }),

    puffystar: (c = 'pink') => glossy('0 0 200 200', [{ d: roundStar(100, 108, 92, 58, 26, 14) }], PAL[c], { outline: 9 }),

    smiley: () => glossy('0 0 100 100', [{ d: roundStar(50, 54, 46, 24, 10, 5) }], PAL.yellow, {
      outline: 5,
      extra: '<ellipse cx="41" cy="52" rx="3.4" ry="5" fill="#6b4300"/><ellipse cx="59" cy="52" rx="3.4" ry="5" fill="#6b4300"/>' +
        '<path d="M43 62Q50 68 57 62" fill="none" stroke="#6b4300" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="34" cy="61" rx="5" ry="3" fill="#ff8fb8" opacity=".65"/><ellipse cx="66" cy="61" rx="5" ry="3" fill="#ff8fb8" opacity=".65"/>',
    }),

    bubble: (c = 'blue') => glossy('0 0 100 100',
      [{ d: 'M50 8C77 8 94 25 94 47C94 69 77 85 52 85C46 85 41 84 36 82L14 94L22 74C12 66 6 57 6 47C6 25 23 8 50 8Z' }],
      PAL[c], { extra: `<path d="${mapPath(HEART, (x, y) => [27 + x * .46, 27 + y * .46])}" fill="${PAL[c].lo}" opacity=".35"/>` +
        `<path d="${mapPath(HEART, (x, y) => [27 + x * .46, 25 + y * .46])}" fill="#fff"/>` }),

    jelly: (c = 'blue', ears = 'round', wink = '') => {
      const earParts = ears === 'star'
        ? [{ d: roundStar(34, 30, 21, 11, 6, 3) }, { d: roundStar(106, 30, 21, 11, 6, 3) }]
        : [{ s: '<circle cx="34" cy="32" r="16"/>', b: [18, 16, 32, 32] }, { s: '<circle cx="106" cy="32" r="16"/>', b: [90, 16, 32, 32] }];
      const ink = '#173b6c';
      const eyeR = wink
        ? `<path d="M90 68L82 74L90 80" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<ellipse cx="86" cy="74" rx="4.2" ry="5.8" fill="${ink}"/><circle cx="87.4" cy="71.6" r="1.7" fill="#fff"/>`;
      const face = `<ellipse cx="54" cy="74" rx="4.2" ry="5.8" fill="${ink}"/><circle cx="55.4" cy="71.6" r="1.7" fill="#fff"/>` + eyeR +
        `<path d="M66 85Q70 88.5 74 85" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>` +
        '<ellipse cx="43" cy="84" rx="7" ry="4" fill="#ff8fc0" opacity=".5"/><ellipse cx="97" cy="84" rx="7" ry="4" fill="#ff8fc0" opacity=".5"/>' +
        '<circle cx="38" cy="50" r="4.5" fill="#fff" opacity=".9"/><circle cx="49" cy="43" r="2.2" fill="#fff" opacity=".8"/>';
      return glossy('0 0 140 150', [
        ...earParts,
        { s: '<ellipse cx="57" cy="136" rx="11" ry="7"/>', b: [46, 129, 22, 14], hl: 0 },
        { s: '<ellipse cx="83" cy="136" rx="11" ry="7"/>', b: [72, 129, 22, 14], hl: 0 },
        { s: '<ellipse cx="40" cy="110" rx="8" ry="11" transform="rotate(35 40 110)"/>', b: [32, 99, 16, 22], hl: 0 },
        { s: '<ellipse cx="100" cy="110" rx="8" ry="11" transform="rotate(-35 100 110)"/>', b: [92, 99, 16, 22], hl: 0 },
        { d: 'M46 96L94 96C97 112 95 128 86 133L54 133C45 128 43 112 46 96Z' },
        { d: 'M12 80C12 44 38 26 70 26C102 26 128 44 128 80C128 96 110 103 70 103C30 103 12 96 12 80Z', hl: 1.15 },
      ], PAL[c], { extra: face });
    },

    globe: () => {
      const id = uid();
      const vals = [0, 15.3, 28.3, 37, 40, 37, 28.3, 15.3, 0].join(';');
      const meridians = [0, 1, 2, 3].map(i => `<ellipse cx="50" cy="50" rx="0" ry="40"><animate attributeName="rx" values="${vals}" dur="4s" begin="${-i}s" repeatCount="indefinite"/></ellipse>`).join('');
      return SVG_OPEN('0 0 100 100') +
        `<defs><radialGradient id="${id}" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#cdd5ff"/><stop offset="1" stop-color="#5a68dc"/></radialGradient>` +
        `<clipPath id="${id}c"><circle cx="50" cy="50" r="40"/></clipPath></defs>` +
        `<circle cx="50" cy="50" r="46" fill="#fff"/><circle cx="50" cy="50" r="40" fill="url(#${id})"/>` +
        `<g clip-path="url(#${id}c)" fill="none" stroke="#fff" stroke-width="3.2" opacity=".95"><path d="M8 50L92 50"/><path d="M14 31Q50 22 86 31"/><path d="M14 69Q50 78 86 69"/>${meridians}</g>` +
        '<circle cx="50" cy="50" r="40" fill="none" stroke="#4352c4" stroke-opacity=".5" stroke-width="1.5"/>' +
        '<ellipse cx="38" cy="30" rx="16" ry="8" fill="#fff" opacity=".6" transform="rotate(-25 38 30)"/></svg>';
    },

    fish: kind => fishSVG(kind),

    sparkle: (c = '#ffffff') => SVG_OPEN('0 0 100 100') + `<path d="${SPARK}" fill="${c}"/><circle cx="50" cy="50" r="9" fill="#fff"/></svg>`,
  };

  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 4.5v15l12-7.5z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>';

  $$('[data-icon]').forEach(el => {
    const [name, ...args] = el.dataset.icon.split(':');
    el.insertAdjacentHTML('beforeend', ICONS[name](...args));
  });

  /* ------------------------------------------------------------- scale to fit */
  let scale = 1;
  function fit() {
    const row = getComputedStyle(stage).flexDirection === 'row';
    const toolbarW = row ? $('.toolbar').offsetWidth + 24 : 0;
    const availW = stage.clientWidth - toolbarW;
    const availH = window.innerHeight - 48;
    scale = clamp(Math.min(availW / W, Math.max(availH, 480) / H), 0.2, 1);
    wrap.style.width = W * scale + 'px';
    wrap.style.height = H * scale + 'px';
    poster.style.transform = `scale(${scale})`;
    tilt.style.borderRadius = 30 * scale + 'px';
    sizeCanvas();
  }

  /* ------------------------------------------------------------- editable text */
  const getText = key => (saved.text[key] ?? defaults[key]).trim() || defaults[key];
  const defaults = {};
  $$('[data-edit]').forEach(el => { defaults[el.dataset.edit] ??= el.textContent; });

  function applyText(key, val, source) {
    $$(`[data-edit="${key}"]`).forEach(el => { if (el !== source && el.textContent !== val) el.textContent = val; });
    if (key === 'title') { $$('.bt-back, .bt-mid').forEach(el => { el.textContent = val; }); fitTitle(); }
    if (key === 'date') updateDday();
    updateTicker();
    renderTrack();
  }
  function fitTitle() {
    const bt = $('#bubble-text'), front = $('.bt-front');
    bt.style.fontSize = '';
    const max = 790, w = front.offsetWidth;
    if (w > max) bt.style.fontSize = (144 * max / w) + 'px';
  }
  $$('[data-edit]').forEach(el => {
    const key = el.dataset.edit;
    el.addEventListener('input', () => {
      saved.text[key] = el.textContent;
      applyText(key, el.textContent, el);
      persist();
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
    el.addEventListener('paste', e => {
      const files = [...(e.clipboardData?.files || [])];
      if (files.some(f => f.type.startsWith('image/'))) return; // handled by the photo paste listener
      e.preventDefault();
      const txt = (e.clipboardData?.getData('text') || '').replace(/\s+/g, ' ');
      document.execCommand('insertText', false, txt);
    });
    el.addEventListener('blur', () => {
      if (!el.textContent.trim()) { el.textContent = defaults[key]; delete saved.text[key]; applyText(key, defaults[key], el); persist(); }
    });
  });

  /* ------------------------------------------------------------- D-day + ticker */
  function updateDday() {
    const num = $('#dday-num'), label = $('#dday-label');
    const m = getText('date').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    let text = 'SOON', lab = 'COMEBACK';
    if (m) {
      const release = new Date(+m[1], +m[2] - 1, +m[3]);
      const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diff = Math.round((release - today) / 864e5);
      if (diff > 0) text = `D-${diff}`;
      else if (diff === 0) text = 'D-DAY';
      else { text = 'OUT NOW'; lab = 'NEW RELEASE'; }
    }
    num.textContent = text;
    label.textContent = lab;
    num.classList.toggle('is-long', text.length > 5);
  }
  function updateTicker() {
    const name = getText('name'), title = getText('title');
    const tag = '#' + (name + '_' + title).replace(/\s+/g, '');
    const seg = `★ ${name} ${getText('kind')} 〈${title}〉   ★ ${getText('date')} 6PM KST   ★ PRE-SAVE NOW   ★ ${tag}   ★ 사랑해요 ♡   `;
    const half = seg.repeat(3);
    $('#ticker').innerHTML = '';
    for (let i = 0; i < 2; i++) { const s = document.createElement('span'); s.textContent = half; $('#ticker').append(s); }
  }

  /* ------------------------------------------------------------- media player */
  const TRACKS = [
    { name: null, len: 207 },        // title track: follows the editable title
    { name: 'sugar cloud', len: 185 },
    { name: 'dial-up love', len: 178 },
    { name: 'glitter ocean', len: 221 },
    { name: 'bye bye bubble', len: 192 },
  ];
  const player = { i: 0, t: 83, playing: !reduceMotion };
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const trackName = () => TRACKS[player.i].name || getText('title');

  function renderTrack() {
    const tr = TRACKS[player.i], pct = (player.t / tr.len) * 100;
    $('#pl-time').textContent = mmss(player.t);
    $('#pl-dur').textContent = mmss(tr.len);
    $('#cd-time').textContent = '00:' + mmss(player.t);
    $('#seek-fill').style.width = pct + '%';
    $('#seek-thumb').style.left = pct + '%';
    $('#cd-prog').style.width = pct + '%';
    $('#cd-song').textContent = `0${player.i + 1} · ${trackName()}`;
    const seek = $('#seek');
    seek.setAttribute('aria-valuemax', tr.len);
    seek.setAttribute('aria-valuenow', Math.floor(player.t));
    seek.setAttribute('aria-valuetext', `${mmss(player.t)} of ${mmss(tr.len)}`);
  }
  function renderPlayState() {
    $('#btn-play').innerHTML = player.playing ? ICON_PAUSE : ICON_PLAY;
    $('#btn-play').setAttribute('aria-label', player.playing ? 'Pause' : 'Play');
    $('#cd-play-icon').innerHTML = player.playing ? ICON_PAUSE : ICON_PLAY;
    $('#cd-state').textContent = player.playing ? '▶ PLAYING...' : '❚❚ PAUSED';
    poster.classList.toggle('is-playing', player.playing);
  }
  function setTrack(i) { player.i = (i + TRACKS.length) % TRACKS.length; player.t = 0; renderTrack(); }
  function seekBy(s) { player.t = clamp(player.t + s, 0, TRACKS[player.i].len - 1); renderTrack(); }
  function togglePlay() { player.playing = !player.playing; renderPlayState(); }

  setInterval(() => {
    if (!player.playing) return;
    player.t += 0.25;
    if (player.t >= TRACKS[player.i].len) setTrack(player.i + 1);
    else renderTrack();
  }, 250);

  $$('.pbtn').forEach(b => b.addEventListener('click', () => {
    const act = b.dataset.act;
    if (act === 'play') togglePlay();
    if (act === 'prev') { if (player.t > 3) seekBy(-player.t); else setTrack(player.i - 1); }
    if (act === 'next') setTrack(player.i + 1);
    if (act === 'back') seekBy(-10);
    if (act === 'fwd') seekBy(10);
  }));
  $('#cd-pad').addEventListener('click', togglePlay);

  const seekEl = $('#seek');
  const seekTo = e => { const r = seekEl.getBoundingClientRect(); player.t = clamp((e.clientX - r.left) / r.width, 0, .999) * TRACKS[player.i].len; renderTrack(); };
  seekEl.addEventListener('pointerdown', e => { seekEl.setPointerCapture(e.pointerId); seekTo(e); });
  seekEl.addEventListener('pointermove', e => { if (seekEl.hasPointerCapture(e.pointerId)) seekTo(e); });
  seekEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { seekBy(5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { seekBy(-5); e.preventDefault(); }
  });

  /* ------------------------------------------------------------- status + toasts */
  const STATUSES = ['is Online', 'is Sleepy zzz', 'is Feeling Lucky ✿', 'is Sweet & Pretty ♡', 'Loves Music ♫'];
  let statusI = 0;
  $('#status-btn').addEventListener('click', () => {
    statusI = (statusI + 1) % STATUSES.length;
    $('#tag-status').textContent = STATUSES[statusI];
  });

  let toastTimer = 0;
  function toast(msg) {
    $('#toast-text').textContent = msg;
    $('#toast').classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('is-on'), 3400);
  }
  const TOASTS = {
    about: () => `${getText('name')} just signed in ♡`,
    playlist: () => `Now playing: ${trackName()}`,
    love: () => `Your love was sent to ${getText('name')} ♡`,
    lucky: () => 'Lucky clover found! Good things are coming ✿',
  };

  /* ------------------------------------------------------------- bursts */
  const burstLayer = $('#burst');
  function burst(x, y, kind = 'sparkle') {
    if (!motionOn) return;
    const hearts = kind === 'hearts', n = hearts ? 8 : 10;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = 'burst-bit';
      el.innerHTML = hearts ? ICONS.heart(pick(['pink', 'pink', 'blue']), 5) : ICONS.sparkle(pick(['#ffffff', '#fff6a8', '#bff0ff', '#ffd1ec']));
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      burstLayer.append(el);
      const a = (i / n) * Math.PI * 2 + rand(-.3, .3), dist = rand(55, 120);
      el.animate([
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist - (hearts ? 70 : 0)}px) scale(${hearts ? 1.1 : .9}) rotate(${rand(-60, 60)}deg)`, opacity: 0 },
      ], { duration: rand(750, 1150), easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => el.remove();
    }
  }
  const centerOf = el => ({ x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 });

  $$('[data-toast]').forEach(el => el.addEventListener('click', () => {
    const c = centerOf(el);
    burst(c.x, c.y, el.dataset.toast === 'love' ? 'hearts' : 'sparkle');
    toast(TOASTS[el.dataset.toast]());
  }));
  $$('[data-fx]').forEach(el => el.addEventListener('click', () => {
    const c = centerOf(el), fx = el.dataset.fx;
    if (fx === 'lucky') { burst(c.x, c.y); toast(TOASTS.lucky()); }
    if (fx === 'hearts') burst(c.x, c.y, 'hearts');
    if (fx === 'bubbles') for (let i = 0; i < 9; i++) spawnBubble(c.x + rand(-30, 30), c.y + rand(-10, 20), rand(7, 20), rand(60, 120));
  }));
  $('#s-dday').addEventListener('click', () => { const c = centerOf($('#s-dday')); burst(c.x, c.y); });
  $('#win-close').addEventListener('click', () => toast('This window stays open until the comeback ♡'));

  /* ------------------------------------------------------------- stickers: drag + boing */
  const stickers = $$('.sticker');
  for (const [id, [x, y]] of Object.entries(saved.pos)) {
    const el = document.getElementById(id);
    if (el) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
  }

  let drag = null, suppressClickUntil = 0;
  poster.addEventListener('pointerdown', e => {
    const p = toPoster(e);
    popBubbleAt(p.x, p.y);
    const st = e.target.closest('.sticker');
    if (!st || e.button !== 0 || e.target.closest('[data-edit]')) return;
    drag = { el: st, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: st.offsetLeft, oy: st.offsetTop, moved: false };
  });
  poster.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = (e.clientX - drag.sx) / scale, dy = (e.clientY - drag.sy) / scale;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      drag.moved = true;
      drag.el.classList.add('is-dragging');
      // capture only once a drag starts, so plain taps still reach buttons inside stickers
      try { drag.el.setPointerCapture(e.pointerId); } catch { /* pointer already released */ }
    }
    drag.el.style.left = clamp(drag.ox + dx, -drag.el.offsetWidth / 2, W - drag.el.offsetWidth / 2) + 'px';
    drag.el.style.top = clamp(drag.oy + dy, -drag.el.offsetHeight / 2, H - drag.el.offsetHeight / 2) + 'px';
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.pid) return;
    const { el, moved } = drag;
    drag = null;
    el.classList.remove('is-dragging');
    if (moved) {
      suppressClickUntil = performance.now() + 80;
      saved.pos[el.id] = [el.offsetLeft, el.offsetTop];
      persist();
      boing(el);
    }
  };
  poster.addEventListener('pointerup', endDrag);
  poster.addEventListener('pointercancel', endDrag);
  poster.addEventListener('click', e => {
    if (performance.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); return; }
    const st = e.target.closest('.sticker');
    if (st && !e.target.closest('[data-edit]')) boing(st);
  }, true);

  function boing(el) {
    if (!motionOn || !el.animate) return;
    el.animate({ scale: ['1 1', '1.14 .86', '.94 1.08', '1.03 .98', '1 1'] }, { duration: 520, easing: 'ease-out' });
  }

  function toPoster(e) {
    const r = wrap.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }

  /* ------------------------------------------------------------- photo slot */
  const slot = $('#photo-slot'), img = $('#photo-img'), input = $('#photo-input');
  const photo = { url: null, nw: 1, nh: 1, x: 0, y: 0, z: 1 };

  function layoutPhoto() {
    const sw = slot.clientWidth, sh = slot.clientHeight;
    const base = Math.max(sw / photo.nw, sh / photo.nh), dw = photo.nw * base * photo.z, dh = photo.nh * base * photo.z;
    photo.x = clamp(photo.x, sw - dw, 0);
    photo.y = clamp(photo.y, sh - dh, 0);
    Object.assign(img.style, { width: dw + 'px', height: dh + 'px', left: photo.x + 'px', top: photo.y + 'px' });
    return { sw, sh, dw, dh };
  }
  function loadPhoto(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (photo.url) URL.revokeObjectURL(photo.url);
    photo.url = URL.createObjectURL(file);
    img.onload = () => {
      photo.nw = img.naturalWidth; photo.nh = img.naturalHeight; photo.z = 1;
      photo.x = -1e6; photo.y = 0;
      const { sw, sh, dw, dh } = layoutPhoto();
      photo.x = (sw - dw) / 2;
      photo.y = (sh - dh) * 0.2; // portraits: keep faces toward the top
      layoutPhoto();
      img.hidden = false;
      slot.classList.add('has-photo');
      $('#photo-clear').hidden = false;
      slot.setAttribute('aria-label', 'Photo slot: drag to reposition, scroll to zoom, double-click to replace');
    };
    img.src = photo.url;
  }
  function clearPhoto() {
    if (photo.url) URL.revokeObjectURL(photo.url);
    photo.url = null;
    img.hidden = true;
    img.removeAttribute('src');
    slot.classList.remove('has-photo');
    $('#photo-clear').hidden = true;
    slot.setAttribute('aria-label', 'Photo slot: click or drop an image to add a photo');
  }
  const pickPhoto = () => input.click();
  $('#btn-photo').addEventListener('click', pickPhoto);
  input.addEventListener('change', () => { loadPhoto(input.files[0]); input.value = ''; });
  slot.addEventListener('click', e => { if (!slot.classList.contains('has-photo') && !e.target.closest('.photo-clear')) pickPhoto(); });
  slot.addEventListener('dblclick', pickPhoto);
  slot.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === slot) { e.preventDefault(); pickPhoto(); } });
  $('#photo-clear').addEventListener('click', e => { e.stopPropagation(); clearPhoto(); });

  poster.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('is-drop'); });
  poster.addEventListener('dragleave', e => { if (!poster.contains(e.relatedTarget)) slot.classList.remove('is-drop'); });
  poster.addEventListener('drop', e => { e.preventDefault(); slot.classList.remove('is-drop'); loadPhoto(e.dataTransfer?.files?.[0]); });
  document.addEventListener('paste', e => {
    const file = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); loadPhoto(file); }
  });

  let pan = null;
  slot.addEventListener('pointerdown', e => {
    if (!slot.classList.contains('has-photo') || e.target.closest('.photo-clear')) return;
    pan = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: photo.x, oy: photo.y };
    slot.setPointerCapture(e.pointerId);
    slot.classList.add('is-panning');
  });
  slot.addEventListener('pointermove', e => {
    if (!pan || e.pointerId !== pan.pid) return;
    photo.x = pan.ox + (e.clientX - pan.sx) / scale;
    photo.y = pan.oy + (e.clientY - pan.sy) / scale;
    layoutPhoto();
  });
  const endPan = () => { pan = null; slot.classList.remove('is-panning'); };
  slot.addEventListener('pointerup', endPan);
  slot.addEventListener('pointercancel', endPan);
  slot.addEventListener('wheel', e => {
    if (!slot.classList.contains('has-photo')) return;
    e.preventDefault();
    const { sw, sh, dw, dh } = layoutPhoto();
    const cx = (sw / 2 - photo.x) / dw, cy = (sh / 2 - photo.y) / dh;
    photo.z = clamp(photo.z * Math.exp(-e.deltaY * 0.0015), 1, 4);
    const base = Math.max(sw / photo.nw, sh / photo.nh);
    photo.x = sw / 2 - cx * photo.nw * base * photo.z;
    photo.y = sh / 2 - cy * photo.nh * base * photo.z;
    layoutPhoto();
  }, { passive: false });

  /* ------------------------------------------------------------- sparkles + fish */
  const SPARKLES = [[22, 140, 30], [1046, 150, 24], [718, 124, 18], [726, 520, 24], [1052, 500, 18], [1046, 862, 26],
    [724, 1060, 22], [30, 1094, 18], [842, 1280, 24], [654, 1238, 16], [556, 1066, 20], [1004, 1300, 16], [714, 1188, 28], [700, 404, 14]];
  SPARKLES.forEach(([x, y, sz], i) => {
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.style.cssText = `left:${x}px;top:${y}px;--sz:${sz}px;--dur:${rand(2.2, 3.6).toFixed(2)}s;--delay:${(-i * .41).toFixed(2)}s`;
    el.innerHTML = ICONS.sparkle(i % 3 ? '#ffffff' : '#fff6a8');
    $('#sparkles').append(el);
  });

  const fishes = [
    { kind: 'clown', w: 88, y: 1338, x: 140, dir: 1, speed: 46, min: 20, max: 980 },
    { kind: 'tang', w: 80, y: 1350, x: 760, dir: -1, speed: 34, min: 20, max: 990 },
    { kind: 'yellow', w: 64, y: 1286, x: 900, dir: 1, speed: 26, min: 660, max: 1010 },
  ].map((f, i) => {
    const el = document.createElement('div');
    el.className = 'fish';
    el.style.width = f.w + 'px';
    el.style.height = f.w * 82 / 118 + 'px';
    el.innerHTML = fishSVG(f.kind);
    $('#fish-layer').append(el);
    return { ...f, el, svg: el.firstChild, ph: i * 2.1 };
  });
  function moveFish(t, dt) {
    for (const f of fishes) {
      f.x += f.dir * f.speed * dt * (0.85 + 0.15 * Math.sin(t / 900 + f.ph));
      if (f.x > f.max) f.dir = -1;
      if (f.x < f.min) f.dir = 1;
      const bob = Math.sin(t / 520 + f.ph) * 5;
      f.el.style.translate = `${f2(f.x - f.w / 2)}px ${f2(f.y + bob)}px`;
      const s = f.dir > 0 ? '1 1' : '-1 1';
      if (f.svg.style.scale !== s) f.svg.style.scale = s;
    }
  }

  /* ------------------------------------------------------------- canvas: bubbles + glitter */
  const fx = $('#fx'), ctx = fx.getContext('2d');
  let k = 1;
  function sizeCanvas() {
    k = clamp(scale * (window.devicePixelRatio || 1), 0.5, 2);
    fx.width = Math.round(W * k);
    fx.height = Math.round(H * k);
  }
  const PHOTO = { x: 92, y: 222, w: 590, h: 712 }; // keep the face clear of glitter and bubbles
  const inPhoto = (x, y, pad = 0) => x > PHOTO.x - pad && x < PHOTO.x + PHOTO.w + pad && y > PHOTO.y - pad && y < PHOTO.y + PHOTO.h + pad;

  const glitter = [];
  while (glitter.length < 700) {
    const x = rand(0, W), y = rand(0, H);
    if (inPhoto(x, y, 6)) continue;
    glitter.push({ x, y, s: rand(.8, 2.6), a: rand(0, Math.PI * 2), c: pick(['255,255,255', '200,245,255', '255,214,240', '255,248,180']) });
  }

  const bubbles = [];
  function spawnBubble(x, y, r, vy) { bubbles.push({ x, y, r, vy, ph: rand(0, 6.28), sway: rand(6, 16), pop: 0 }); }
  for (let i = 0; i < 20; i++) spawnBubble(rand(0, W), rand(0, H), rand(6, 26), rand(16, 40));

  function popBubbleAt(x, y) {
    for (const b of bubbles) {
      if (!b.pop && Math.hypot(b.x - x, b.y - y) < b.r + 14) { b.pop = 0.001; return true; }
    }
    return false;
  }

  function drawFx(t, dt, lx, ly) {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if (b.pop) {
        b.pop += dt * 3.2;
        if (b.pop >= 1) {
          if (bubbles.length > 20) bubbles.splice(i, 1);
          else Object.assign(b, { x: rand(0, W), y: H + 40, r: rand(6, 26), pop: 0 });
          continue;
        }
        const p = b.pop, rr = b.r * (1 + p * .8);
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = 'rgba(255,255,255,.95)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(190,235,255,.95)';
        for (let j = 0; j < 7; j++) {
          const a = j / 7 * Math.PI * 2;
          ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * rr * 1.35, b.y + Math.sin(a) * rr * 1.35, 2.4 * (1 - p) + .6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        continue;
      }
      b.y -= b.vy * dt;
      b.x += Math.sin(t / 900 + b.ph) * b.sway * dt;
      if (b.y < -40) {
        if (bubbles.length > 20) { bubbles.splice(i, 1); continue; }
        Object.assign(b, { x: rand(0, W), y: H + 40, r: rand(6, 26), vy: rand(16, 40) });
      }
      if (inPhoto(b.x, b.y, b.r)) continue;
      const g = ctx.createRadialGradient(b.x - b.r * .25, b.y - b.r * .25, b.r * .1, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(.72, 'rgba(185,232,255,.16)');
      g.addColorStop(1, 'rgba(120,200,255,.55)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.lineWidth = Math.max(1.2, b.r * .14);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * .66, Math.PI * 1.08, Math.PI * 1.42); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(b.x + b.r * .38, b.y + b.r * .4, Math.max(1, b.r * .08), 0, Math.PI * 2); ctx.fill();
    }

    // glitter: each speck flashes when the light hits its facet angle
    const drift = t * 0.00035;
    for (const g of glitter) {
      const ang = Math.atan2(ly - g.y, lx - g.x);
      let br = Math.cos(ang * 2 + g.a + drift);
      if (br <= 0) continue;
      br = br ** 12;
      if (br < .05) continue;
      ctx.fillStyle = `rgba(${g.c},${(br * .95).toFixed(3)})`;
      if (br > .6 && g.s > 1.7) {
        const L = g.s * 3.6;
        ctx.fillRect(g.x - L, g.y - .6, L * 2, 1.2);
        ctx.fillRect(g.x - .6, g.y - L, 1.2, L * 2);
        ctx.beginPath(); ctx.arc(g.x, g.y, g.s * .8, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(g.x - g.s / 2, g.y - g.s / 2, g.s, g.s);
      }
    }
  }

  /* ------------------------------------------------------------- tilt, parallax, light */
  const layers = $$('[data-depth]').map(el => ({ el, d: +el.dataset.depth }));
  const pointer = { x: .5, y: .35, last: -1e9 };
  const light = { x: .5, y: .35 };
  window.addEventListener('pointermove', e => {
    if (drag || pan) return;
    const r = wrap.getBoundingClientRect();
    pointer.x = clamp((e.clientX - r.left) / r.width, -.2, 1.2);
    pointer.y = clamp((e.clientY - r.top) / r.height, -.2, 1.2);
    pointer.last = performance.now();
  }, { passive: true });

  let motionOn = !reduceMotion, raf = 0, lastT = performance.now(), loaderPct = 87, loaderAcc = 0;

  function applyLight(nx, ny) {
    tilt.style.transform = motionOn ? `rotateX(${f2(-ny * 3)}deg) rotateY(${f2(nx * 4)}deg)` : '';
    poster.style.setProperty('--lx', f2(light.x * 100) + '%');
    poster.style.setProperty('--ly', f2(light.y * 100) + '%');
    poster.style.setProperty('--sheen', f2(light.x * 100) + '%');
    for (const L of layers) L.el.style.translate = motionOn ? `${f2(-nx * L.d * 6)}px ${f2(-ny * L.d * 6)}px` : '';
  }

  function frame(t) {
    const dt = Math.min(.05, (t - lastT) / 1000);
    lastT = t;
    const idle = t - pointer.last > 2500;
    const tx = idle ? .5 + Math.sin(t / 2700) * .4 : pointer.x;
    const ty = idle ? .45 + Math.sin(t / 3900 + 1) * .38 : pointer.y;
    const ease = Math.min(1, dt * (idle ? 2 : 6));
    light.x += (tx - light.x) * ease;
    light.y += (ty - light.y) * ease;
    const nx = clamp(light.x * 2 - 1, -1.2, 1.2), ny = clamp(light.y * 2 - 1, -1.2, 1.2);
    if (!drag) applyLight(nx, ny);
    moveFish(t, dt);
    drawFx(t, dt, light.x * W, light.y * H);
    loaderAcc += dt;
    if (loaderAcc > .09) { loaderAcc = 0; loaderPct = (loaderPct + 1) % 101; $('#loader-txt').textContent = `LOVE ${loaderPct}%`; }
    raf = requestAnimationFrame(frame);
  }

  function setMotion(on) {
    motionOn = on;
    cancelAnimationFrame(raf);
    poster.classList.toggle('no-motion', !on);
    $$('svg').forEach(s => { if (s.pauseAnimations) on ? s.unpauseAnimations() : s.pauseAnimations(); });
    $('#btn-motion').textContent = on ? 'Pause motion' : 'Resume motion';
    if (on) { lastT = performance.now(); raf = requestAnimationFrame(frame); }
    else {
      applyLight(0, 0);
      moveFish(0, 0);
      drawFx(0, 0, W * .35, H * .25);
    }
  }
  $('#btn-motion').addEventListener('click', () => setMotion(!motionOn));

  /* ------------------------------------------------------------- reset */
  let resetArmed = 0;
  $('#btn-reset').addEventListener('click', () => {
    const btn = $('#btn-reset');
    if (!resetArmed) {
      btn.textContent = 'Tap again to reset';
      resetArmed = setTimeout(() => { resetArmed = 0; btn.textContent = 'Reset'; }, 3000);
      return;
    }
    clearTimeout(resetArmed);
    resetArmed = 0;
    btn.textContent = 'Reset';
    saved.text = {};
    saved.pos = {};
    persist();
    stickers.forEach(el => { el.style.left = ''; el.style.top = ''; });
    Object.entries(defaults).forEach(([key, val]) => applyText(key, val));
    clearPhoto();
    statusI = 0;
    $('#tag-status').textContent = STATUSES[0];
    player.i = 0; player.t = 83; player.playing = !reduceMotion;
    renderTrack();
    renderPlayState();
    toast('Poster reset to the original layout.');
  });

  /* ------------------------------------------------------------- boot */
  Object.entries(saved.text).forEach(([key, val]) => { if (key in defaults && val.trim()) applyText(key, val); });
  updateDday();
  updateTicker();
  renderTrack();
  renderPlayState();
  fit();
  window.addEventListener('resize', fit);
  if (document.fonts?.ready) document.fonts.ready.then(() => { fitTitle(); fit(); });
  fitTitle();
  setMotion(motionOn);
  setTimeout(() => toast(TOASTS.about()), 1400);
})();
