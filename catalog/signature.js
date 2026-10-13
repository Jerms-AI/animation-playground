/* ── Signature moves: ported from Motion Demos (cybercanvascollective.art/motion)
   Each of these was reverse-engineered frame-by-frame from a Dribbble/After
   Effects GIF. The playground entry keeps the MECHANISM and exposes the
   measured parameters as sliders. ───────────────────────────────────────── */
(() => {
  const { h, finished, wait, sec } = Playground;
  gsap.registerPlugin(CustomEase);
  CustomEase.create('sweep', 'M0,0 C0.4,0 0.5,0.08 0.58,0.34 0.64,0.8 0.66,0.97 0.74,0.995 0.82,1.005 0.9,1 1,1');
  CustomEase.create('gifEase', 'M0,0 C0.15,0 0.2,0.35 0.27,0.53 0.35,0.72 0.5,0.92 1,1');
  const DEMOS = 'https://cybercanvascollective.art/motion/';

  /* 1 ── Liquid Swipe ───────────────────────────────────────────────────── */
  register({
    id: 'liquid-swipe', group: 'Signature moves', name: 'Liquid Swipe',
    source: { label: 'Cuberto — Onboarding Swipe Animation (via Motion Demos)', url: DEMOS + 'experiments/mobile/liquid-swipe/' },
    blurb: 'The next page is revealed by a liquid edge that bulges around the finger. Drag from the right edge: the wave follows you 1:1, past the threshold it sweeps across on its own, hits the far edge, and wobbles.',
    notes: `<p>The incoming page is a full-size layer with a <code>clip-path: path()</code> sampled from a Gaussian: <code>x(y) = W − reveal − bulge·e^(−(y−fy)²/2σ²)</code>. Three numbers (<code>reveal</code>, <code>bulge</code>, <code>fy</code>) are the entire state; drag writes them, the completion tween writes them, elastic tweens on <code>bulge</code> give the settle. On impact the OLD page's leftover sliver is clipped and springs with a second, wider Gaussian so the edge rings.</p>`,
    stage: { phone: true, hint: 'drag from the right edge' },
    controls: [
      { key: 'idle', label: 'Idle bulge', type: 'range', min: 10, max: 60, step: 2, def: 28, unit: 'px' },
      { key: 'sigma', label: 'Wave width σ', type: 'range', min: 50, max: 220, step: 5, def: 110, unit: 'px' },
      { key: 'sweep', label: 'Sweep duration', type: 'range', min: 300, max: 1400, step: 20, def: 650, unit: 'ms' },
      { key: 'threshold', label: 'Commit at', type: 'range', min: 20, max: 60, step: 2, def: 34, unit: '%' },
      { key: 'ring', label: 'Impact ring', type: 'range', min: 0, max: 30, step: 1, def: 13, unit: 'px' },
    ],
    mount(root, v, ctx) {
      const W = ctx.W, H = ctx.H, k = H / 535;
      root.style.cursor = 'grab';
      const PAGES = [
        { bg: '#ffffff', fg: '#3d1652', mute: '#b9b9c3', thin: 'Online', bold: 'GAMBLING', p: 'Spin the wheel from anywhere. Verified tables and live dealers.', ill: ['#f4415f', '#3d1652', '#f6c344'] },
        { bg: '#54006b', fg: '#f4415f', mute: '#b98ecb', thin: 'For', bold: 'GAMERS', p: 'Tournaments, squads and seasonal ladders. Climb the ranks together.', ill: ['#f4415f', '#ffffff', '#7b2cbf'] },
        { bg: '#0b2a3a', fg: '#4ade80', mute: '#6fa3b8', thin: 'Live', bold: 'SPORTS', p: 'Every match, every market, settled in seconds.', ill: ['#4ade80', '#ffffff', '#1e90ff'] },
      ];
      const layer = (pg) => h(`<div class="layer" style="position:absolute;inset:0;background:${pg.bg};color:${pg.mute};will-change:clip-path">
        <div style="height:100%;display:flex;flex-direction:column;padding:${20 * k}px ${26 * k}px">
          <div style="display:flex;justify-content:space-between;font-size:${12 * k}px;font-weight:600"><span>GameHub</span><span>Skip</span></div>
          <div class="illo-wrap" style="flex:1;display:flex;align-items:center;justify-content:center">
            <svg class="illo" viewBox="0 0 200 200" style="width:${150 * k}px"><path d="M40 70 C40 20 160 20 160 70 S180 160 120 170 S20 140 40 70 Z" fill="${pg.ill[0]}" opacity=".9"/><circle cx="88" cy="92" r="30" fill="${pg.ill[1]}"/><rect x="110" y="110" width="46" height="46" rx="10" fill="${pg.ill[2]}" transform="rotate(12 133 133)"/></svg>
          </div>
          <div class="lq-copy" style="padding-bottom:${34 * k}px">
            <div class="thin" style="font-size:${22 * k}px">${pg.thin}</div>
            <div class="bold" style="font-size:${26 * k}px;font-weight:800;letter-spacing:.06em;color:${pg.fg}">${pg.bold}</div>
            <p style="margin-top:${10 * k}px;font-size:${13 * k}px;line-height:1.5">${pg.p}</p>
          </div>
        </div></div>`);
      let idx = 0;
      let cur = layer(PAGES[0]), nxt = layer(PAGES[1]);
      const chev = h(`<div style="position:absolute;z-index:5;font-size:20px;line-height:1;pointer-events:none;transform:translate(-50%,-50%);opacity:.9">‹</div>`);
      root.append(cur, nxt, chev);
      const ambient = (el) => { const i = el.querySelector('.illo'); gsap.to(i, { y: -7, rotation: 1.4, duration: 1.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }); };
      ambient(cur); ambient(nxt);

      const S = { reveal: 0, bulge: 0, fy: 0, settling: false };
      const sigma = () => v.sigma * k;
      const IDLE = () => ({ reveal: 0, bulge: v.idle * k, fy: H * 0.75 });
      function wavePath(reveal, bulge, fy) {
        const N = 48; let d = `M ${W} 0 `;
        for (let i = 0; i <= N; i++) { const y = H * i / N, g = Math.exp(-((y - fy) ** 2) / (2 * sigma() ** 2)); d += `L ${(W - reveal - bulge * g).toFixed(1)} ${y.toFixed(1)} `; }
        return `path('${d}L ${W} ${H} Z')`;
      }
      function render() {
        nxt.style.clipPath = wavePath(S.reveal, S.bulge, S.fy);
        const foldLeft = W - S.reveal - S.bulge;
        chev.style.left = (foldLeft + S.bulge * 0.45) + 'px'; chev.style.top = S.fy + 'px';
        chev.style.opacity = S.reveal > W * 0.5 ? 0 : 0.9;
        chev.style.color = PAGES[(idx + 1) % PAGES.length].bg === '#ffffff' ? '#3d1652' : '#fff';
        const p = Math.min(1, Math.max(0, 1 - foldLeft / W)), ps = Math.min(p, 0.82);
        gsap.set(nxt.querySelector('.illo-wrap'), { x: Math.max(0, foldLeft + 40 + v.idle * k), scale: 1 + 0.18 * Math.sin(Math.pow(ps, 1.6) * Math.PI) });
      }
      function resetIdle() { Object.assign(S, IDLE()); render(); }
      resetIdle();

      let dragging = false, busy = false, startX = 0;
      const onDown = e => { if (busy) return; dragging = true; startX = e.clientX; root.setPointerCapture(e.pointerId); gsap.killTweensOf(S); root.style.cursor = 'grabbing'; };
      const onMove = e => {
        if (!dragging) return;
        const r = root.getBoundingClientRect();
        const drag = Math.max(0, startX - e.clientX);
        S.fy = e.clientY - r.top; S.bulge = 15 * k + Math.min(drag * 0.42, 140 * k); S.reveal = drag * 0.5; render();
        if (S.reveal + S.bulge > W * 0.5) { dragging = false; complete(); }
      };
      const onUp = () => { if (!dragging) return; dragging = false; root.style.cursor = 'grab'; (S.reveal + S.bulge > W * v.threshold / 100) ? complete() : springBack(); };
      root.addEventListener('pointerdown', onDown); root.addEventListener('pointermove', onMove); root.addEventListener('pointerup', onUp); root.addEventListener('pointercancel', onUp);

      function springBack() { gsap.to(S, { ...IDLE(), duration: 0.6, ease: 'elastic.out(1, 0.55)', onUpdate: render }); }
      let resolveDone = null;
      function complete() {
        busy = true; root.style.cursor = 'grab';
        const startReveal = S.reveal, startBulge = S.bulge, p0 = startReveal / W, t = { u: 0 }; let hit = false;
        const sheet = nxt;
        const tw = gsap.to(t, { u: 1, duration: (v.sweep / 1000) * (1 - p0 * 0.6), ease: 'sweep',
          onUpdate() {
            if (hit) return;
            const p = p0 + (1 - p0) * t.u;
            S.reveal = startReveal + ((W + 40) - startReveal) * t.u;
            const targetBulge = (v.idle + 44 * Math.sin(p * Math.PI) * 2.2) * k;
            S.bulge = startBulge + (targetBulge - startBulge) * Math.min(1, t.u * 3);
            render();
            if (W - S.reveal - S.bulge <= 0) { hit = true; tw.kill(); onImpact(sheet, { ...S }); }
          },
          onComplete: () => { if (!hit) { hit = true; onImpact(sheet, { ...S }); } } });
        const txt = sheet.querySelectorAll('.thin, .bold, .lq-copy p');
        gsap.set(txt, { x: -18 * k, opacity: 0 });
        gsap.to(txt, { opacity: 1, duration: 0.12, stagger: 0.04, delay: 0.18 });
        gsap.to(txt, { x: 0, duration: 0.45, ease: 'back.out(1.6)', stagger: 0.04, delay: 0.24 });
      }
      function onImpact(sheet, C) {
        const N = 32, bSigma = 150 * k, leftover = [];
        for (let i = 0; i <= N; i++) { const y = H * i / N, g = Math.exp(-((y - C.fy) ** 2) / (2 * sigma() ** 2)); leftover.push(Math.max(0, W - C.reveal - C.bulge * g)); }
        const old = cur; idx = (idx + 1) % PAGES.length; cur = sheet;
        nxt = layer(PAGES[(idx + 1) % PAGES.length]); root.insertBefore(nxt, chev); ambient(nxt);
        gsap.to(sheet.querySelector('.illo-wrap'), { x: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
        resetIdle(); busy = false;
        gsap.fromTo(S, { bulge: 72 * k }, { bulge: v.idle * k, duration: 1.25, ease: 'elastic.out(1, 0.28)', onUpdate: render });
        const B = { L: 0, c: 1 };
        const clip = () => { let d = `M ${W} 0 `; for (let i = 0; i <= N; i++) { const y = H * i / N, g = Math.exp(-((y - C.fy) ** 2) / (2 * bSigma * bSigma)); d += `L ${(leftover[i] * B.c + B.L * (0.45 + 0.55 * g)).toFixed(1)} ${y.toFixed(1)} `; } sheet.style.clipPath = `path('${d}L ${W} ${H} Z')`; };
        gsap.timeline({ onComplete: () => { sheet.style.clipPath = 'none'; gsap.killTweensOf(old.querySelectorAll('*')); old.remove(); if (resolveDone) { resolveDone(); resolveDone = null; } } })
          .to(B, { L: v.ring * k, c: 0, duration: 0.12, ease: 'power2.out', onUpdate: clip })
          .to(B, { L: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)', onUpdate: clip });
      }
      return {
        play() {
          if (busy) return wait(300);
          // Scripted drag: finger at 55% height pulls the wave past the commit point.
          return new Promise(res => {
            resolveDone = res;
            const d = { x: 0 }; S.fy = H * 0.55;
            gsap.to(d, { x: W * 0.42, duration: 0.5, ease: 'power2.in', onUpdate() { S.bulge = 15 * k + Math.min(d.x * 0.42, 140 * k); S.reveal = d.x * 0.5; render(); }, onComplete: complete });
          });
        },
        destroy() { gsap.killTweensOf(S); root.querySelectorAll('.illo').forEach(i => gsap.killTweensOf(i)); },
      };
    },
    reversible: false,
    snippets: {
      'GSAP': v => `// State is three numbers. Everything draws from them.
const S = { reveal: 0, bulge: ${v.idle}, fy: innerHeight * .75 };
const SIGMA = ${v.sigma};

function wavePath(W, H) {                     // Gaussian edge → clip-path on the incoming layer
  const N = 48; let d = \`M \${W} 0 \`;
  for (let i = 0; i <= N; i++) {
    const y = H * i / N, g = Math.exp(-((y - S.fy) ** 2) / (2 * SIGMA * SIGMA));
    d += \`L \${(W - S.reveal - S.bulge * g).toFixed(1)} \${y.toFixed(1)} \`;
  }
  return \`path('\${d}L \${W} \${H} Z')\`;
}
const render = () => next.style.clipPath = wavePath(innerWidth, innerHeight);

// Drag writes S directly (1:1 with the finger):
stage.onpointermove = e => { if (!dragging) return;
  const drag = Math.max(0, startX - e.clientX);
  S.fy = e.clientY; S.bulge = 15 + Math.min(drag * .42, 140); S.reveal = drag * .5; render(); };
stage.onpointerup = () => (S.reveal + S.bulge > innerWidth * ${(v.threshold / 100).toFixed(2)}) ? complete() : springBack();

function springBack() { gsap.to(S, { reveal: 0, bulge: ${v.idle}, fy: innerHeight * .75, duration: .6, ease: "elastic.out(1, .55)", onUpdate: render }); }

function complete() {                           // sweep across with a measured ease, then ring on impact
  CustomEase.create("sweep", "M0,0 C0.4,0 0.5,0.08 0.58,0.34 0.64,0.8 0.66,0.97 0.74,0.995 0.82,1.005 0.9,1 1,1");
  gsap.to(S, { reveal: innerWidth + 40, duration: ${sec(v.sweep)}, ease: "sweep", onUpdate: render,
    onComplete: () => gsap.fromTo(S, { bulge: 72 }, { bulge: ${v.idle}, duration: 1.25, ease: "elastic.out(1, .28)", onUpdate: render }) });
}
// Full engine incl. the impact ring on the old page's sliver: ${DEMOS}experiments/mobile/liquid-swipe/engine.js`,
    },
  });

  /* 2 ── Goo FAB ────────────────────────────────────────────────────────── */
  register({
    id: 'goo-fab', group: 'Signature moves', name: 'Goo FAB',
    source: { label: 'Tubik — Tap Bar Concept (via Motion Demos)', url: DEMOS + 'experiments/mobile/tap-bar.html' },
    blurb: 'Tap the + and three satellites tear off the floating button like drops of liquid, snapping into place with a pop. Close pulls them back in and the FAB rings. SVG goo filter plus measured easing.',
    notes: `<p>Metaballs: blurred circles passed through an <code>feColorMatrix</code> with a steep alpha curve (<code>0 0 0 19 -8</code>), so any overlap of soft edges fuses into one hard shape. Each satellite is a circle tweened from the FAB centre outward; while it's still within blur range of the FAB a neck forms automatically. The "pop" is a custom ease: a slow creep, an explosive jump, then a crawl, with a small pre-launch bump on the FAB surface. After landing, the blur relaxes so the FAB settles into a perfect circle.</p>`,
    stage: { height: 360, bg: '#2f3a55', hint: 'tap the +' },
    controls: [
      { key: 'dur', label: 'Launch duration', type: 'range', min: 400, max: 1400, step: 20, def: 720, unit: 'ms' },
      { key: 'stagger', label: 'Stagger', type: 'range', min: 60, max: 500, step: 10, def: 180, unit: 'ms' },
      { key: 'creep', label: 'Creep phase', type: 'range', min: 5, max: 40, step: 1, def: 21, unit: '%' },
      { key: 'jump', label: 'Jump to', type: 'range', min: 30, max: 90, step: 1, def: 65, unit: '%' },
      { key: 'blur', label: 'Goo blur', type: 'range', min: 3, max: 12, step: 0.5, def: 7, unit: '' },
      { key: 'ring', label: 'Ring amplitude', type: 'range', min: 0, max: 18, step: 1, def: 6, unit: '%' },
    ],
    mount(root, v, ctx) {
      const W = ctx.W, H = ctx.H, k = Math.min(W, 520) / 316;
      const R = 41 * k, cx = W / 2, cy = H - 23 * k, navH = Math.round(44 * k);
      const uid = 'goo' + Math.random().toString(36).slice(2, 7);
      root.append(
        h(`<div style="position:absolute;left:0;right:0;bottom:0;height:${navH}px;background:#16213a"></div>`),
        h(`<svg style="position:absolute;inset:0;pointer-events:none" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
          <defs><filter id="${uid}"><feGaussianBlur in="SourceGraphic" stdDeviation="${v.blur * k}" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"/></filter></defs>
          <g filter="url(#${uid})" fill="#1ea1ff">
            <circle class="sat" r="0"/><circle class="sat" r="0"/><circle class="sat" r="0"/>
            <circle class="bump" r="0"/><circle class="bump" r="0"/><circle class="bump" r="0"/>
            <circle class="fab" cx="${cx}" cy="${cy}" r="${R}"/>
          </g></svg>`),
        h(`<div style="position:absolute;inset:0;pointer-events:none">
          <span class="plus" style="position:absolute;width:${26 * k}px;height:${26 * k}px;transform:translate(-50%,-50%)"><svg viewBox="0 0 26 26"><path d="M13 3 v20 M3 13 h20" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg></span>
          ${['M4 7h4l2-2.5h4L16 7h4a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-16a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 7z M12 16.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z', 'M2.5 6h13a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 0 15.5v-7A2.5 2.5 0 0 1 2.5 6z M15.5 11l6-3.5v9l-6-3.5z', 'M4 20l1.2-4.6L16.8 3.8a2.2 2.2 0 0 1 3.1 0l.3.3a2.2 2.2 0 0 1 0 3.1L8.6 18.8 4 20z'].map(d => `<span class="ico" style="position:absolute;width:${20 * k}px;height:${20 * k}px;transform:translate(-50%,-50%);opacity:0"><svg viewBox="0 0 24 24"><path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></span>`).join('')}
        </div>`),
        h(`<div class="hit" style="position:absolute;left:${cx - R * 1.15}px;top:${cy - R * 2.3 * .62}px;width:${R * 2.3}px;height:${R * 2.3}px;border-radius:50%;cursor:pointer"></div>`),
      );
      const svg = root.querySelector('svg'), blurEl = svg.querySelector('feGaussianBlur'), fab = svg.querySelector('.fab');
      const sats = [...svg.querySelectorAll('.sat')], bumps = [...svg.querySelectorAll('.bump')], icos = [...root.querySelectorAll('.ico')], plus = root.querySelector('.plus');
      const SATS = [{ ux: -1.34, uy: -1.15, ur: .51, bx: -.63, by: -.54 }, { ux: 0, uy: -1.73, ur: .39, bx: 0, by: -.83 }, { ux: 1.37, uy: -1.17, ur: .51, bx: .66, by: -.56 }]
        .map((s, i) => ({ ...s, dx: s.ux * R, dy: s.uy * R, r: s.ur * R, blob: sats[i], bump: bumps[i], icon: icos[i] }));
      SATS.forEach(s => { gsap.set(s.bump, { attr: { cx: cx + s.bx * R, cy: cy + s.by * R, r: 0 } }); gsap.set(s.blob, { attr: { cx, cy, r: 0 } }); });
      gsap.set(plus, { left: cx, top: cy });
      const P = { dur: v.dur / 1000, stagger: v.stagger / 1000, creepT: v.creep / 100, jump: v.jump / 100, ringAmp: v.ring / 100, ringPer: .115, ringDur: 2.6 };
      const pop = 'pop' + uid;
      const c = P.creepT, j = P.jump;
      CustomEase.create(pop, `M0,0 C${c * .5},0 ${c * .85},0.02 ${c},0.05 C${c + .02},${j * .5} ${c + .01},${j * .8} ${c + .04},${j} C${c + .09},${j + .13} ${c + .15},${j + .18} ${c + .24},${Math.min(j + .23, .94)} C0.6,0.95 0.8,0.99 1,1`);
      const bump = (tl, el, at, rMax) => tl.fromTo(el, { attr: { r: 0 } }, { attr: { r: rMax * k }, duration: .15, ease: 'sine.out' }, at).to(el, { attr: { r: 0 }, duration: .18, ease: 'power2.out' }, at + .16);
      const ring = (tl, at, amp) => tl.fromTo(fab, { scaleX: 1 + P.ringAmp * amp, scaleY: 1 - P.ringAmp * amp * .55 }, { scaleX: 1, scaleY: 1, duration: P.ringDur, ease: `elastic.out(1, ${P.ringPer})`, svgOrigin: `${cx} ${cy}`, overwrite: 'auto', immediateRender: false }, at);
      let open = false, busy = false, tl = null;
      function buildOpen() {
        const t = gsap.timeline({ onComplete: () => busy = false });
        t.to(plus, { rotation: 45, duration: .35, ease: 'power2.inOut' }, 0);
        SATS.forEach((s, i) => {
          const t0 = i * P.stagger;
          bump(t, s.bump, t0, 12);
          t.fromTo(s.blob, { attr: { cx, cy, r: 0 } }, { attr: { cx: cx + s.dx, cy: cy + s.dy, r: s.r }, duration: P.dur, ease: pop }, t0);
          t.fromTo(s.icon, { left: cx, top: cy }, { left: cx + s.dx, top: cy + s.dy, duration: P.dur, ease: pop }, t0);
          t.to(s.icon, { opacity: 1, duration: .16 }, t0 + P.dur * .28);
          ring(t, t0 + P.dur * P.creepT + .02, 1);
        });
        t.to(blurEl, { attr: { stdDeviation: 2.5 * k }, duration: .35, ease: 'sine.out' }, 2 * P.stagger + P.dur);
        return t;
      }
      function buildClose() {
        const t = gsap.timeline({ onComplete: () => busy = false });
        gsap.set(fab, { scaleX: 1, scaleY: 1 });
        t.to(blurEl, { attr: { stdDeviation: v.blur * k }, duration: .2, ease: 'sine.in' }, 0);
        t.to(plus, { rotation: 0, duration: .35, ease: 'power2.inOut' }, .15);
        [...SATS].reverse().forEach((s, i) => {
          const t0 = i * P.stagger;
          t.to(s.blob, { attr: { cx: cx + s.dx * .76, cy: cy + s.dy * .76 }, duration: .4, ease: 'power1.in' }, t0);
          t.to(s.icon, { left: cx + s.dx * .76, top: cy + s.dy * .76, duration: .4, ease: 'power1.in' }, t0);
          t.to(s.icon, { opacity: 0, duration: .18 }, t0 + .24);
          t.to(s.blob, { attr: { cx, cy, r: 0 }, duration: .07, ease: 'power1.in' }, t0 + .4);
          ring(t, t0 + .47, 1.25);
        });
        return t;
      }
      const toggle = (next) => { if (busy || next === open) return wait(50); busy = true; open = next; if (tl) tl.kill(); tl = open ? buildOpen() : buildClose(); return wait((2 * P.stagger + P.dur) * 1000 + 150); };
      root.querySelector('.hit').onclick = () => toggle(!open);
      return { play(dir) { return toggle(dir === 1); }, destroy() { if (tl) tl.kill(); gsap.killTweensOf([fab, plus, ...sats, ...bumps, ...icos, blurEl]); } };
    },
    snippets: {
      'GSAP': v => `<!-- The goo: blur, then crush alpha so overlapping soft edges fuse -->
<svg><defs><filter id="goo">
  <feGaussianBlur in="SourceGraphic" stdDeviation="${v.blur}" result="blur"/>
  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"/>
</filter></defs>
<g filter="url(#goo)" fill="#1ea1ff">
  <circle class="sat" r="0"/><circle class="sat" r="0"/><circle class="sat" r="0"/>
  <circle id="fab" cx="50%" cy="100%" r="41"/>
</g></svg>

// The pop: creep ${v.creep}% of the way, jump to ${v.jump}%, crawl home.
const c = ${(v.creep / 100).toFixed(2)}, j = ${(v.jump / 100).toFixed(2)};
CustomEase.create("pop", \`M0,0 C\${c*.5},0 \${c*.85},0.02 \${c},0.05 C\${c+.02},\${j*.5} \${c+.01},\${j*.8} \${c+.04},\${j} C\${c+.09},\${j+.13} \${c+.15},\${j+.18} \${c+.24},\${Math.min(j+.23,.94)} C0.6,0.95 0.8,0.99 1,1\`);

const SATS = [{ ux: -1.34, uy: -1.15, ur: .51 }, { ux: 0, uy: -1.73, ur: .39 }, { ux: 1.37, uy: -1.17, ur: .51 }];  // in FAB radii
function open(R, cx, cy) {
  const tl = gsap.timeline();
  SATS.forEach((s, i) => {
    tl.fromTo(sats[i], { attr: { cx, cy, r: 0 } },
      { attr: { cx: cx + s.ux * R, cy: cy + s.uy * R, r: s.ur * R }, duration: ${sec(v.dur)}, ease: "pop" }, i * ${sec(v.stagger)});${v.ring ? `
    tl.fromTo("#fab", { scaleX: ${(1 + v.ring / 100).toFixed(3)}, scaleY: ${(1 - v.ring / 100 * .55).toFixed(3)} },          // surface ring
      { scaleX: 1, scaleY: 1, duration: 2.6, ease: "elastic.out(1, .115)", svgOrigin: \`\${cx} \${cy}\` }, i * ${sec(v.stagger)} + ${sec(v.dur * v.creep / 100)});` : ''}
  });
  tl.to("#goo feGaussianBlur", { attr: { stdDeviation: 2.5 }, duration: .35 }, 2 * ${sec(v.stagger)} + ${sec(v.dur)});   // relax → perfect circle
  return tl;
}
// Close, bumps, icon choreography: ${DEMOS}experiments/mobile/tap-bar.html`,
    },
  });

  /* 3 ── Shared-Anchor Accordion ────────────────────────────────────────── */
  register({
    id: 'shared-anchor-accordion', group: 'Signature moves', name: 'Shared-Anchor Accordion',
    source: { label: 'Tubik — GIF for the Weather App (via Motion Demos)', url: DEMOS + 'experiments/mobile/weather-accordion.html' },
    blurb: 'Four stacked bands; dragging opens one and closes its neighbour, with exactly one edge moving at a time. The icon never jumps: every band draws its own version at one shared screen anchor, and the moving edge sweeps across it.',
    notes: `<p>One source of truth, <code>pos ∈ [0, N−1]</code>. Band heights are a function of pos (only bands ⌊pos⌋ and ⌊pos⌋+1 share the spare height). The icon anchor is <code>pos·COLLAPSED + pad</code> in screen space; each band positions its icon at <code>anchor − bandTop</code> inside its own <code>overflow:hidden</code>, so as the edge passes, the top band's icon is clipped away exactly where the bottom band's begins. Drag is 1:1 with a small detent at integers; release snaps with the GIF's measured ease (fast attack, 1.35s settle tail).</p>`,
    stage: { phone: true, hint: 'drag a band up or down · tap to open' },
    controls: [
      { key: 'collapsed', label: 'Collapsed height', type: 'range', min: 50, max: 110, step: 2, def: 72, unit: 'px' },
      { key: 'snap', label: 'Snap duration', type: 'range', min: 400, max: 2000, step: 50, def: 1350, unit: 'ms' },
      { key: 'detent', label: 'Detent', type: 'range', min: 0, max: 25, step: 1, def: 10, unit: '%' },
      { key: 'spring', label: 'Detail spring', type: 'toggle', def: true },
    ],
    mount(root, v, ctx) {
      const k = ctx.k, COLLAPSED = v.collapsed * k, PAD = 22 * k;
      const sun = (ring, dots, dotC, n = 8) => `<g class="rays">${Array.from({ length: n }, (_, i) => { const a = (i * 360 / n - 90) * Math.PI / 180; return `<circle cx="${52 + Math.cos(a) * 30}" cy="${50 + Math.sin(a) * 30}" r="5" fill="${dotC}"/>`; }).join('')}</g><circle cx="52" cy="50" r="15" fill="none" stroke="${ring}" stroke-width="9"/>`;
      const cloud = c => `<g class="cloud"><path d="M52 108a15 15 0 0 1 5-29a21 21 0 0 1 40-3a16 16 0 0 1 7 32z" fill="${c}"/></g>`;
      const DATA = [
        { bg: '#e8c99a', fg: '#4a3733', label: 'Morning', temp: '- 1°', cond: 'Sunny', meta: 'Wind: W 3 mph · Humidity: 97%', icon: `${sun('#d28a5c', 0, '#d28a5c')}` },
        { bg: '#d4874f', fg: '#4a3733', label: 'Day', temp: '+ 3°', cond: 'Mostly Sunny', meta: 'Wind: N 5 mph · Humidity: 45%', icon: `${sun('#b0603f', 0, '#4a3733', 9)}${cloud('#4a3733')}` },
        { bg: '#b85f45', fg: '#f6e3c8', label: 'Evening', temp: '0°', cond: 'Rain', meta: 'Wind: W 12 mph · Humidity: 91%', icon: `${sun('#4a3733', 0, '#4a3733', 9)}${cloud('#f0dcb4')}${[0, 1, 2, 3, 4, 5].map(i => `<path class="drop" d="M${58 + (i % 3) * 22 + (i > 2 ? 9 : 0)} ${124 + (i > 2 ? 24 : 0)}q4.5 8 0 12.5q-4.5-4.5 0-12.5" fill="#e8c9a0"/>`).join('')}` },
        { bg: '#6b3f3a', fg: '#f6e3c8', label: 'Night', temp: '- 2°', cond: 'Cloudy', meta: 'Wind: N 2 mph · Humidity: 47%', icon: `<path d="M60 20a30 30 0 1 0 24 46a25 25 0 0 1-24-46z" fill="#c87c50"/>${cloud('#d29160')}` },
      ];
      const N = DATA.length;
      root.style.background = '#1f2a24';
      const wrap = h(`<div style="position:absolute;inset:0;display:flex;flex-direction:column;background:#9db58e"></div>`);
      const top = h(`<div style="height:${54 * k}px;background:#8fa88a;color:#fff;display:flex;align-items:center;padding:0 ${16 * k}px;font-size:${13 * k}px;font-weight:600">📍 Dnipro, Ukraine</div>`);
      const bandsEl = h(`<div style="flex:1;position:relative;display:flex;flex-direction:column;cursor:grab"></div>`);
      wrap.append(top, bandsEl); root.appendChild(wrap);
      const bands = DATA.map(d => { const b = h(`<div style="position:relative;overflow:hidden;background:${d.bg};color:${d.fg};flex:0 0 auto;font-family:system-ui">
        <div class="iconbox" style="position:absolute;left:${14 * k}px;top:0;width:${120 * k}px;height:${170 * k}px;will-change:transform"><svg viewBox="0 0 170 240" style="width:100%;height:100%">${d.icon}</svg></div>
        <div style="position:absolute;right:${0}px;top:${16 * k}px;width:${48}%;"><div style="font-size:${10 * k}px;letter-spacing:.18em;text-transform:uppercase;opacity:.8">${d.label}</div><div style="font-size:${26 * k}px;font-weight:500;margin-top:${4 * k}px">${d.temp}</div>
        <div class="detail" style="margin-top:${10 * k}px;opacity:0"><div style="font-size:${14 * k}px">${d.cond}</div><div style="font-size:${10 * k}px;opacity:.8;margin-top:${4 * k}px;line-height:1.5">${d.meta}</div></div></div></div>`); bandsEl.appendChild(b); return b; });
      const iconboxes = bands.map(b => b.querySelector('.iconbox'));
      bands.forEach(b => { const r = b.querySelector('.rays'); if (r) gsap.to(r, { rotation: 360, svgOrigin: '52 50', duration: 30, ease: 'none', repeat: -1 }); const c = b.querySelector('.cloud'); if (c) gsap.to(c, { x: 5, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }); b.querySelectorAll('.drop').forEach((d, i) => gsap.timeline({ repeat: -1, delay: (i % 3) * .3 + Math.floor(i / 3) * .15 }).set(d, { y: 0, opacity: 0 }).to(d, { opacity: 1, duration: .15 }).to(d, { y: 30, duration: 1, ease: 'power1.in' }, 0).to(d, { opacity: 0, duration: .25 }, .8)); });
      const state = { pos: 1 }; const shown = bands.map(() => false);
      function render() {
        const p = gsap.utils.clamp(0, N - 1, state.pos), total = bandsEl.clientHeight, extra = total - COLLAPSED * N;
        const i = Math.min(Math.floor(p), N - 2), f = p - i; const tops = []; let acc = 0;
        bands.forEach((b, j) => { const w = j === i ? 1 - f : j === i + 1 ? f : 0; const hgt = COLLAPSED + extra * w; tops[j] = acc; acc += hgt; b.style.height = hgt + 'px'; });
        const anchorY = p * COLLAPSED + PAD;
        iconboxes.forEach((box, j) => box.style.transform = `translateY(${anchorY - tops[j]}px)`);
        bands.forEach((b, j) => { const det = b.querySelector('.detail'), d = Math.abs(p - j);
          if (!shown[j] && d < .12) { shown[j] = true; gsap.killTweensOf([det, det.children]); gsap.set(det, { opacity: 1 }); if (v.spring) gsap.fromTo(det.children, { opacity: 0, y: 26 * k }, { opacity: 1, y: 0, duration: .75, ease: 'elastic.out(1, .5)', stagger: .06 }); else gsap.fromTo(det.children, { opacity: 0 }, { opacity: 1, duration: .3 }); }
          else if (shown[j] && d > .28) { shown[j] = false; gsap.killTweensOf([det, det.children]); gsap.to(det, { opacity: 0, duration: .15 }); } });
      }
      let dragging = false, startY = 0, startPos = 0, moved = 0, unitPx = 200, snapTween = null;
      const snapTo = (idx, dur) => { if (snapTween) snapTween.kill(); snapTween = gsap.to(state, { pos: idx, duration: dur, ease: 'gifEase', onUpdate: render }); return snapTween; };
      bandsEl.addEventListener('pointerdown', e => { dragging = true; moved = 0; startY = e.clientY; startPos = state.pos; unitPx = bandsEl.clientHeight - COLLAPSED * N; if (snapTween) snapTween.kill(); bandsEl.setPointerCapture(e.pointerId); bandsEl.style.cursor = 'grabbing'; });
      bandsEl.addEventListener('pointermove', e => { if (!dragging) return; const dy = e.clientY - startY; moved = Math.max(moved, Math.abs(dy)); let p = gsap.utils.clamp(0, N - 1, startPos + dy / unitPx); const nr = Math.round(p); if (Math.abs(p - nr) < v.detent / 100) p = nr; state.pos = p; render(); });
      const endDrag = e => { if (!dragging) return; dragging = false; bandsEl.style.cursor = 'grab';
        if (moved < 6) { const r = bandsEl.getBoundingClientRect(), y = e.clientY - r.top; let acc = 0, target = N - 1; for (let j = 0; j < N; j++) { const hgt = bands[j].getBoundingClientRect().height; if (y < acc + hgt) { target = j; break; } acc += hgt; } snapTo(target, v.snap / 1000); }
        else snapTo(Math.round(state.pos), v.snap / 1000 * .67); };
      bandsEl.addEventListener('pointerup', endDrag); bandsEl.addEventListener('pointercancel', endDrag);
      requestAnimationFrame(render);
      return {
        play(dir) { const cur = Math.round(state.pos); const next = dir === 1 ? (cur + 1) % N : (cur + N - 1) % N; return snapTo(next, v.snap / 1000).then(); },
        destroy() { if (snapTween) snapTween.kill(); root.querySelectorAll('*').forEach(el => gsap.killTweensOf(el)); },
      };
    },
    snippets: {
      'GSAP': v => `// ONE number drives everything. Drag writes it, snap tweens it, render() reads it.
const state = { pos: 1 };            // ∈ [0, N-1]; integer = a band fully open
const COLLAPSED = ${v.collapsed}, PAD = 22;
CustomEase.create("gifEase", "M0,0 C0.15,0 0.2,0.35 0.27,0.53 0.35,0.72 0.5,0.92 1,1");   // fast attack, long settle

function render() {
  const p = gsap.utils.clamp(0, N - 1, state.pos);
  const extra = container.clientHeight - COLLAPSED * N;           // the one spare chunk of height
  const i = Math.min(Math.floor(p), N - 2), f = p - i;
  const tops = []; let acc = 0;
  bands.forEach((band, k) => {                                     // only bands i and i+1 share "extra"
    const w = k === i ? 1 - f : k === i + 1 ? f : 0;
    const h = COLLAPSED + extra * w; tops[k] = acc; acc += h;
    gsap.set(band, { height: h });
  });
  const anchorY = p * COLLAPSED + PAD;                             // shared icon anchor, screen space
  icons.forEach((icon, k) => gsap.set(icon, { y: anchorY - tops[k] }));   // each band clips its own copy
}

// Drag: 1:1 with the finger, detent at integers
container.onpointermove = e => { if (!dragging) return;
  let p = gsap.utils.clamp(0, N - 1, startPos + (e.clientY - startY) / unitPx);
  const nearest = Math.round(p); if (Math.abs(p - nearest) < ${(v.detent / 100).toFixed(2)}) p = nearest;
  state.pos = p; render(); };
container.onpointerup = () => gsap.to(state, { pos: Math.round(state.pos), duration: ${sec(v.snap)}, ease: "gifEase", onUpdate: render });${v.spring ? `

// Detail text springs up once the band is nearly locked in (|p - k| < .12):
gsap.fromTo(detail.children, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .75, ease: "elastic.out(1, .5)", stagger: .06 });` : ''}
// Full source: ${DEMOS}experiments/mobile/weather-accordion.html`,
    },
  });

  /* 4 ── Feed → Detail ──────────────────────────────────────────────────── */
  register({
    id: 'feed-to-detail', group: 'Signature moves', name: 'Feed → Detail',
    source: { label: 'Tubik — ECHO App v2.1 (via Motion Demos)', url: DEMOS + 'experiments/mobile/echo-app/' },
    blurb: 'Tap a card\'s artwork and it grows into the detail page\'s header while a sheet rises from under it; the avatar chip drops in and the action button pops late with overshoot. Scroll the detail and the header collapses into a bar.',
    notes: `<p>No shared-element library: the detail layer is always mounted but hidden. On open, its art element is positioned at the tapped card's measured rect and tweened to the header rect (same width, so it's pure y + height). The sheet starts at the card's bottom edge and rises. Timings are measured from the GIF: open ≈0.27s, the chip at +0.18s, the button at +0.22s with <code>back.out(1.8)</code>. Scroll-collapse is a paused timeline played/reversed past a threshold.</p>`,
    stage: { phone: true, hint: 'tap the artwork · scroll the detail' },
    controls: [
      { key: 'duration', label: 'Expand duration', type: 'range', min: 180, max: 700, step: 10, def: 280, unit: 'ms' },
      { key: 'chip', label: 'Chip delay', type: 'range', min: 0, max: 400, step: 10, def: 180, unit: 'ms' },
      { key: 'button', label: 'Button delay', type: 'range', min: 0, max: 500, step: 10, def: 220, unit: 'ms' },
      { key: 'overshoot', label: 'Button overshoot', type: 'range', min: 0, max: 4, step: 0.1, def: 1.8, unit: '' },
    ],
    mount(root, v, ctx) {
      const k = ctx.k, ART_H = 200 * k, HDR_H = 48 * k;
      root.style.background = '#f4f5f8';
      const art = (c1, c2) => `background:linear-gradient(135deg,${c1},${c2})`;
      const CARDS = [['Imagine Dragons', 'Night Visions', '#2b3a55', '#0f1a2e'], ['ODESZA', 'In Return', '#8a2b3f', '#2a0f1a'], ['Tame Impala', 'Currents', '#2b6a55', '#0f2e1f']];
      const feed = h(`<div class="feed" style="position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain">
        <div style="height:${44 * k}px;background:#1f2a44;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;letter-spacing:.3em;font-size:${13 * k}px;position:sticky;top:0;z-index:1">ECHO</div>
        ${CARDS.map((c, i) => `<div style="background:#fff;margin-bottom:${8 * k}px">
          <div style="display:flex;align-items:center;gap:${8 * k}px;padding:${8 * k}px ${12 * k}px"><div style="width:${28 * k}px;height:${28 * k}px;border-radius:50%;background:#c9d2e3"></div><div style="font-size:${11 * k}px;font-weight:700;color:#1f2a44">User ${i + 1}<div style="font-weight:400;color:#8b93a1;font-size:${9 * k}px">Leicester, 12km</div></div></div>
          <div class="art" data-i="${i}" style="height:${130 * k}px;${art(c[2], c[3])};cursor:pointer;display:flex;align-items:center;justify-content:center"><div style="width:${44 * k}px;height:${44 * k}px;border-radius:50%;border:2px solid rgba(255,255,255,.6)"></div></div>
          <div style="padding:${10 * k}px ${12 * k}px ${14 * k}px;text-align:center;font-size:${12 * k}px;font-weight:700;color:#1f2a44">${c[0]} <span style="font-weight:400;color:#8b93a1">— ${c[1]}</span></div></div>`).join('')}
        <div style="height:${120 * k}px"></div></div>`);
      const detail = h(`<div class="detail" style="position:absolute;inset:0;visibility:hidden;background:#f4f5f8;z-index:2">
        <div class="d-art" style="position:absolute;left:0;right:0;top:0;height:${ART_H}px;${art('#2b3a55', '#0f1a2e')};overflow:hidden"><div class="shade" style="position:absolute;inset:0;background:#1f2a44;opacity:0"></div>
          <div class="d-hdr" style="position:absolute;left:0;right:0;top:0;height:${HDR_H}px;display:flex;align-items:center;padding:0 ${12 * k}px;color:#fff;font-size:${12 * k}px;opacity:0"><span class="d-back" style="cursor:pointer;font-size:${18 * k}px;margin-right:${10 * k}px">‹</span><span class="d-mid" style="opacity:0;font-weight:700;letter-spacing:.1em">IMAGINE DRAGONS</span></div>
          <div class="d-chip" style="position:absolute;left:${12 * k}px;bottom:${12 * k}px;display:flex;align-items:center;gap:${6 * k}px;color:#fff;font-size:${11 * k}px;font-weight:700"><div class="d-avatar" style="width:${26 * k}px;height:${26 * k}px;border-radius:50%;background:#c9d2e3"></div>User 1</div>
          </div>
        <div class="d-btn" style="position:absolute;right:${14 * k}px;top:${ART_H - 22 * k}px;width:${44 * k}px;height:${44 * k}px;border-radius:50%;background:#1ea1ff;transform:scale(0);box-shadow:0 6px 16px rgba(0,0,0,.3);z-index:3"></div>
        <div class="d-scroll" style="position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain;z-index:1"><div class="d-spacer" style="height:${ART_H}px"></div>
          <div style="padding:${20 * k}px ${16 * k}px;text-align:center"><div class="d-title" style="font-size:${15 * k}px;font-weight:700;color:#1f2a44">IMAGINE DRAGONS <span style="font-weight:400;color:#8b93a1">— Night Visions</span></div>
          <div class="d-stats" style="display:flex;justify-content:center;gap:${18 * k}px;margin-top:${10 * k}px;color:#8b93a1;font-size:${11 * k}px"><span>♥ 12,5K</span><span>💬 113</span><span>🎧 23K</span></div></div>
          ${Array.from({ length: 10 }, (_, i) => `<div style="margin:0 ${12 * k}px ${8 * k}px;height:${44 * k}px;border-radius:${8 * k}px;background:#fff;display:flex;align-items:center;padding:0 ${12 * k}px;font-size:${11 * k}px;color:#1f2a44">Track ${i + 1}</div>`).join('')}</div></div>`);
      root.append(feed, detail);
      const dArt = detail.querySelector('.d-art'), dScroll = detail.querySelector('.d-scroll'), btn = detail.querySelector('.d-btn'), hdr = detail.querySelector('.d-hdr');
      let inDetail = false, animating = false, collapsed = false, collapseTl = null, srcCard = feed.querySelector('.art');
      const D = v.duration / 1000;
      function open(card) {
        if (animating || inDetail) return wait(50);
        animating = true; srcCard = card;
        const rr = root.getBoundingClientRect(), r = card.getBoundingClientRect(), top = r.top - rr.top;
        dArt.style.background = card.style.background; detail.style.visibility = 'visible'; dScroll.scrollTop = 0;
        const tl = gsap.timeline({ onComplete: () => { animating = false; inDetail = true; } });
        tl.fromTo(dArt, { y: top, height: r.height }, { y: 0, height: ART_H, duration: D, ease: 'power3.out' }, 0);
        tl.fromTo(dScroll, { y: top + r.height - HDR_H, opacity: 0 }, { y: 0, opacity: 1, duration: D * 1.07, ease: 'power3.out' }, .02);
        tl.fromTo(hdr, { opacity: 0 }, { opacity: 1, duration: .25 }, .08);
        tl.fromTo(detail.querySelector('.d-avatar'), { y: -14 * k, opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: 'power2.out' }, v.chip / 1000);
        tl.fromTo(btn, { scale: 0 }, { scale: 1, duration: .38, ease: `back.out(${v.overshoot})` }, v.button / 1000);
        collapsed = false; if (collapseTl) collapseTl.progress(0).pause();
        return tl.then();
      }
      function close() {
        if (animating || !inDetail) return wait(50);
        animating = true;
        if (collapsed) { collapseTl.timeScale(2).reverse(); collapsed = false; }
        const rr = root.getBoundingClientRect(), r = srcCard.getBoundingClientRect(), top = r.top - rr.top;
        const tl = gsap.timeline({ onComplete: () => { detail.style.visibility = 'hidden'; gsap.set([dArt, dScroll, btn], { clearProps: 'all' }); animating = false; inDetail = false; } });
        tl.to(btn, { scale: 0, duration: .18, ease: 'power2.in' }, 0);
        tl.to(hdr, { opacity: 0, duration: .18 }, 0);
        tl.to(dArt, { y: top, height: r.height, duration: D, ease: 'power3.inOut' }, .05);
        tl.to(dScroll, { y: top + r.height - HDR_H, opacity: 0, duration: D, ease: 'power3.inOut' }, .05);
        return tl.then();
      }
      function buildCollapse() {
        const tl = gsap.timeline({ paused: true });
        tl.to(dArt, { height: HDR_H, duration: .22, ease: 'power3.out' }, 0);
        tl.to(detail.querySelector('.shade'), { opacity: .55, duration: .22 }, 0);
        tl.to(detail.querySelector('.d-mid'), { opacity: 1, duration: .2 }, .1);
        tl.to(detail.querySelector('.d-spacer'), { height: 0, duration: .26, ease: 'power3.out' }, 0);
        tl.to(detail.querySelectorAll('.d-stats span'), { y: -34 * k, opacity: 0, duration: .22, ease: 'power2.in', stagger: .05 }, .02);
        tl.to(detail.querySelector('.d-chip'), { y: -26 * k, opacity: 0, duration: .2, ease: 'power2.in' }, 0);
        tl.to(detail.querySelector('.d-title'), { opacity: 0, duration: .16 }, .04);
        tl.to(btn, { y: HDR_H / 2 - ART_H, scale: .58, duration: .3, ease: 'power3.inOut' }, .04);
        return tl;
      }
      dScroll.addEventListener('scroll', () => { if (!inDetail && !animating) return; if (!collapseTl) collapseTl = buildCollapse(); const st = dScroll.scrollTop;
        if (!collapsed && st > 34 * k) { collapsed = true; collapseTl.timeScale(1).play(); } else if (collapsed && st < 8) { collapsed = false; collapseTl.timeScale(1.4).reverse(); } }, { passive: true });
      feed.querySelectorAll('.art').forEach(a => a.addEventListener('click', () => open(a)));
      detail.querySelector('.d-back').addEventListener('click', close);
      return {
        play(dir) { return dir === 1 ? open(feed.querySelector('.art')) : close(); },
        destroy() { root.querySelectorAll('*').forEach(el => gsap.killTweensOf(el)); },
      };
    },
    snippets: {
      'GSAP': v => `// Detail layer is always mounted (visibility:hidden). Open = measure the card, start there, tween to the header.
function openDetail(card) {
  const r = card.getBoundingClientRect();
  detail.style.visibility = "visible";
  gsap.timeline()
    .fromTo(dArt,    { y: r.top, height: r.height }, { y: 0, height: ART_H, duration: ${sec(v.duration)}, ease: "power3.out" }, 0)
    .fromTo(dSheet,  { y: r.bottom - HDR_H, opacity: 0 }, { y: 0, opacity: 1, duration: ${sec(v.duration * 1.07)}, ease: "power3.out" }, .02)
    .fromTo(dHeader, { opacity: 0 }, { opacity: 1, duration: .25 }, .08)
    .fromTo(dAvatar, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: "power2.out" }, ${sec(v.chip)})
    .fromTo(dButton, { scale: 0 }, { scale: 1, duration: .38, ease: "back.out(${v.overshoot})" }, ${sec(v.button)});
}

// Scroll-collapse: a paused timeline, played past a threshold and reversed below it
const collapse = gsap.timeline({ paused: true })
  .to(dArt, { height: HDR_H, duration: .22, ease: "power3.out" }, 0)
  .to(".stats span", { y: -34, opacity: 0, duration: .22, ease: "power2.in", stagger: .05 }, .02)
  .to(dButton, { y: -(ART_H - HDR_H), scale: .58, duration: .3, ease: "power3.inOut" }, .04);
dSheet.addEventListener("scroll", () => {
  const st = dSheet.scrollTop;
  if (!collapsed && st > 34) { collapsed = true; collapse.play(); }
  else if (collapsed && st < 8) { collapsed = false; collapse.timeScale(1.4).reverse(); }
}, { passive: true });
// Full source: ${DEMOS}experiments/mobile/echo-app/`,
      'framer-motion': v => `// Same choreography with a shared layoutId for the art, and explicit delays for the rest:
<motion.div layoutId={\`art-\${id}\`} transition={{ duration: ${sec(v.duration)}, ease: [0.22, 1, 0.36, 1] }} />   {/* card ⇄ header */}
<motion.div className="sheet" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: ${sec(v.duration * 1.07)}, ease: [0.22, 1, 0.36, 1], delay: 0.02 }} />
<motion.img className="avatar" initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, delay: ${sec(v.chip)} }} />
<motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: ${Math.round(26 - v.overshoot * 5)}, delay: ${sec(v.button)} }} />`,
    },
  });

  /* 5 ── Icon Loops ─────────────────────────────────────────────────────── */
  register({
    id: 'icon-loops', group: 'Signature moves', name: 'Icon Loops',
    source: { label: 'Nino Mamaladze — Animated Shopping & Ecommerce Icons (via Motion Demos)', url: DEMOS + 'experiments/icons/shopping-icons.html' },
    blurb: 'Four looping SVG micro-animations, each a hand-timed timeline on the icon\'s parts: a clover that quarter-turns and breathes, a truck that bobs and lurches, a chat bubble that rocks while dots type, a pig that flicks an ear and looks up. Tap one to replay it.',
    notes: `<p>Every icon is plain SVG with ids on the parts that move. GSAP timelines tween attributes (<code>cx</code>, <code>cy</code>) and transforms with <code>svgOrigin</code> pivots, looping with a <code>repeatDelay</code> beat. The loops are phase-offset so the row never moves in lockstep.</p>`,
    reversible: false,
    stage: { height: 300, bg: '#ffffff', hint: 'tap an icon to replay it' },
    controls: [
      { key: 'speed', label: 'Speed', type: 'range', min: 25, max: 200, step: 5, def: 100, unit: '%' },
      { key: 'offset', label: 'Phase offset', type: 'toggle', def: true },
      { key: 'color', label: 'Colour', type: 'select', options: ['#f4415f', '#1ea1ff', '#4ade80', '#1a1a1a'], def: '#f4415f' },
    ],
    mount(root, v) {
      const C = v.color;
      const row = h(`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:6%"></div>`);
      const ico = (id, svg) => h(`<div data-id="${id}" style="width:18%;max-width:110px;cursor:pointer"><svg viewBox="0 0 100 100" style="width:100%;display:block">${svg}</svg></div>`);
      const clover = ico('clover', `<g class="cl-g"><circle class="petal" cx="34" cy="34" r="21" fill="${C}"/><circle class="petal" cx="66" cy="34" r="21" fill="${C}"/><circle class="petal" cx="66" cy="66" r="21" fill="${C}"/><circle class="petal" cx="34" cy="66" r="21" fill="${C}"/><path class="cl-star" d="M50 36 Q53.5 46.5 64 50 Q53.5 53.5 50 64 Q46.5 53.5 36 50 Q46.5 46.5 50 36 Z" fill="#fff"/></g>`);
      const truck = ico('truck', `<g class="tr-body"><path d="M36 30 h40 a4 4 0 0 1 4 4 v32 h-60 v-19 a5 5 0 0 1 1.5 -3.5 l9.5 -12 A5 5 0 0 1 35 30 z" fill="${C}"/><rect x="25" y="38" width="10" height="9" rx="2.5" fill="#fff"/></g><g><circle cx="34" cy="67" r="7.5" fill="${C}"/><circle cx="34" cy="67" r="2.8" fill="#fff"/><circle cx="66" cy="67" r="7.5" fill="${C}"/><circle cx="66" cy="67" r="2.8" fill="#fff"/></g><circle class="puff1" cx="84" cy="60" r="0" fill="${C}"/><circle class="puff2" cx="84" cy="60" r="0" fill="${C}" opacity=".6"/>`);
      const chat = ico('chat', `<g class="ch-g"><path d="M50 16 a 30 30 0 1 1 -19 53 L20 76 l4.5 -13.5 A 30 30 0 0 1 50 16 z" fill="${C}"/><circle class="dot" cx="38" cy="47" r="4.2" fill="#fff"/><circle class="dot" cx="50" cy="47" r="4.2" fill="#fff"/><circle class="dot" cx="62" cy="47" r="4.2" fill="#fff"/></g>`);
      const pig = ico('pig', `<g class="pg-g"><g class="pg-tail"><path d="M78 52 q 9 -4 7 -11 q -7 -5 -8 2" fill="none" stroke="${C}" stroke-width="3.4" stroke-linecap="round"/></g><rect x="38" y="66" width="9" height="14" rx="3.5" fill="${C}"/><rect x="56" y="66" width="9" height="14" rx="3.5" fill="${C}"/><path class="pg-ear" d="M36 30 q 4 -12 14 -10 l -2 12 z" fill="${C}"/><path d="M52 24 a 28 27 0 1 0 0 54 a 28 27 0 0 0 0 -54 z M28 44 h-6 a 4 4 0 0 0 -4 4 v6 a 4 4 0 0 0 4 4 h6 z" fill="${C}"/><circle cx="41" cy="42" r="3.6" fill="#fff"/></g>`);
      row.append(clover, truck, chat, pig); root.appendChild(row);
      const q = (el, s) => el.querySelectorAll(s);
      const PP = [[34, 34], [66, 34], [66, 66], [34, 66]];
      const tls = {
        clover: (() => { const tl = gsap.timeline({ repeat: -1, repeatDelay: .55 }); for (const pass of [0, 1]) { const at = pass * 1.15; q(clover, '.petal').forEach((p, i) => { const [cx, cy] = PP[i], dx = (cx - 50) / 16, dy = (cy - 50) / 16; tl.to(p, { attr: { cx: cx + dx * 6, cy: cy + dy * 6 }, duration: .22, ease: 'power2.out' }, at).to(p, { attr: { cx, cy }, duration: .3, ease: 'power2.in' }, at + .28); }); tl.to(q(clover, '.cl-star'), { scale: .35, rotation: 45, svgOrigin: '50 50', duration: .25, ease: 'power2.in' }, at).to(q(clover, '.cl-star'), { scale: 1, rotation: 90, svgOrigin: '50 50', duration: .3, ease: 'back.out(2.2)' }, at + .28); tl.to(q(clover, '.cl-g'), { rotation: '+=90', svgOrigin: '50 50', duration: .55, ease: 'back.out(1.35)' }, at + .04); } return tl; })(),
        truck: (() => { const tl = gsap.timeline({ repeat: -1 }); const body = q(truck, '.tr-body'); tl.to(body, { y: -1.6, duration: .32, ease: 'sine.inOut', yoyo: true, repeat: 7 }, 0); [.25, 1.45].forEach((at, i) => { const puff = q(truck, i ? '.puff2' : '.puff1'); tl.fromTo(puff, { attr: { r: 0 }, x: 0, opacity: .9 }, { attr: { r: 3.2 }, duration: .18, ease: 'back.out(2)' }, at).to(puff, { x: 9, opacity: 0, duration: .6, ease: 'power1.out' }, at + .18).set(puff, { attr: { r: 0 }, x: 0 }, at + .85); }); tl.to(body, { rotation: -3, svgOrigin: '35 66', duration: .16, ease: 'power2.out' }, 1.35).to(body, { rotation: 0, svgOrigin: '35 66', duration: .7, ease: 'elastic.out(1, .45)' }, 1.55); tl.to({}, { duration: .3 }, 2.3); return tl; })(),
        chat: (() => { const tl = gsap.timeline({ repeat: -1, repeatDelay: .5 }); const g = q(chat, '.ch-g'); tl.to(g, { rotation: -7, svgOrigin: '46 50', duration: .3, ease: 'sine.inOut' }, 0).to(g, { rotation: 6, svgOrigin: '46 50', duration: .55, ease: 'sine.inOut' }, .3).to(g, { rotation: 0, svgOrigin: '46 50', duration: .6, ease: 'elastic.out(1, .5)' }, .85); for (const w of [0, 1]) tl.to(q(chat, '.dot'), { y: -6.5, duration: .17, ease: 'power2.out', yoyo: true, repeat: 1, stagger: .09 }, .15 + w * .55); return tl; })(),
        pig: (() => { const tl = gsap.timeline({ repeat: -1, repeatDelay: .6 }); tl.to(q(pig, '.pg-ear'), { rotation: -14, svgOrigin: '44 32', duration: .12, ease: 'power2.out', yoyo: true, repeat: 1 }, .15); tl.to(q(pig, '.pg-g'), { rotation: -9, svgOrigin: '60 80', duration: .34, ease: 'back.out(1.6)' }, .55).to(q(pig, '.pg-g'), { rotation: 0, svgOrigin: '60 80', duration: .55, ease: 'elastic.out(1, .4)' }, 1.45); tl.to(q(pig, '.pg-tail'), { rotation: 14, svgOrigin: '78 52', duration: .3, ease: 'sine.out' }, .55).to(q(pig, '.pg-tail'), { rotation: 0, svgOrigin: '78 52', duration: .6, ease: 'elastic.out(1, .35)' }, 1.45); return tl; })(),
      };
      Object.values(tls).forEach(t => t.timeScale(v.speed / 100));
      if (v.offset) { tls.truck.seek(.6); tls.chat.seek(.3); tls.pig.seek(.9); }
      const replay = id => { tls[id].restart(); gsap.fromTo(row.querySelector(`[data-id=${id}] svg`), { scale: .92 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .4)' }); };
      [...row.children].forEach(el => el.onclick = () => replay(el.dataset.id));
      return { play() { Object.keys(tls).forEach(replay); return wait(2400 * 100 / v.speed); }, destroy() { Object.values(tls).forEach(t => t.kill()); } };
    },
    snippets: {
      'GSAP': v => `// Plain SVG with ids on the moving parts; one looping timeline per icon.
const clover = gsap.timeline({ repeat: -1, repeatDelay: 0.55 })${v.speed !== 100 ? `.timeScale(${(v.speed / 100).toFixed(2)})` : ''};
PETALS.forEach((p, i) => {                                   // petals breathe outward then back
  const [cx, cy] = POS[i], dx = (cx - 50) / 16, dy = (cy - 50) / 16;
  clover.to(p, { attr: { cx: cx + dx * 6, cy: cy + dy * 6 }, duration: .22, ease: "power2.out" }, 0)
        .to(p, { attr: { cx, cy }, duration: .3, ease: "power2.in" }, .28);
});
clover.to("#star",  { scale: .35, rotation: 45, svgOrigin: "50 50", duration: .25, ease: "power2.in" }, 0)
      .to("#star",  { scale: 1, rotation: 90, svgOrigin: "50 50", duration: .3, ease: "back.out(2.2)" }, .28)
      .to("#group", { rotation: "+=90", svgOrigin: "50 50", duration: .55, ease: "back.out(1.35)" }, .04);   // quarter turn

const truck = gsap.timeline({ repeat: -1 })
  .to("#body", { y: -1.6, duration: .32, ease: "sine.inOut", yoyo: true, repeat: 7 }, 0)           // idle bob
  .fromTo("#puff", { attr: { r: 0 }, x: 0, opacity: .9 }, { attr: { r: 3.2 }, duration: .18, ease: "back.out(2)" }, .25)
  .to("#puff", { x: 9, opacity: 0, duration: .6 }, .43)
  .to("#body", { rotation: -3, svgOrigin: "35 66", duration: .16 }, 1.35)                          // lurch
  .to("#body", { rotation: 0, svgOrigin: "35 66", duration: .7, ease: "elastic.out(1, .45)" }, 1.55);
${v.offset ? `
// Phase-offset the loops so the row never moves in lockstep:
truck.seek(0.6); chat.seek(0.3); pig.seek(0.9);` : ''}
// Tap to replay: tl.restart(); gsap.fromTo(svg, { scale: .92 }, { scale: 1, duration: .5, ease: "elastic.out(1, .4)" });
// All four timelines: ${DEMOS}experiments/icons/shopping-icons.html`,
    },
  });
})();
