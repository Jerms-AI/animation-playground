/* ── Micro-interactions: feedback at the point of touch ─────────────────── */
(() => {
  const { h, finished, wait, easeArr, sec, gsapEase, easeCtl, EASINGS } = Playground;
  const center = (root) => { root.style.background = '#0e1118'; const c = h(`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:18px;flex-direction:column"></div>`); root.appendChild(c); return c; };

  /* 1 ── Button Press ───────────────────────────────────────────────────── */
  register({
    id: 'button-press', group: 'Micro-interactions', name: 'Button Press',
    blurb: 'Press: the button shrinks instantly under the finger. Release: it springs back with a little overshoot, and a ripple spreads from the touch point. The tap feels physical.',
    reversible: false,
    controls: [
      { key: 'press', label: 'Press scale', type: 'range', min: 85, max: 99, step: 1, def: 94, unit: '%' },
      { key: 'down', label: 'Press-in', type: 'range', min: 40, max: 200, step: 10, def: 90, unit: 'ms' },
      { key: 'up', label: 'Release', type: 'range', min: 150, max: 800, step: 10, def: 380, unit: 'ms' },
      { key: 'ripple', label: 'Ripple', type: 'toggle', def: true },
    ],
    stage: { hint: 'press and hold the button' },
    mount(root, v) {
      const c = center(root);
      const btn = h(`<button style="position:relative;overflow:hidden;background:#6ea8fe;color:#06122b;border:0;border-radius:14px;font-weight:700;font-size:16px;padding:16px 38px;cursor:pointer;will-change:transform">Add to cart</button>`);
      c.appendChild(btn);
      const s = v.press / 100;
      const down = () => btn.animate({ transform: ['scale(1)', `scale(${s})`] }, { duration: v.down, easing: 'ease-out', fill: 'forwards' });
      const up = (x, y) => {
        const a = btn.animate({ transform: [`scale(${s})`, 'scale(1)'] }, { duration: v.up, easing: EASINGS['spring-ish'], fill: 'forwards' });
        if (v.ripple) {
          const r = h(`<span style="position:absolute;left:${x}px;top:${y}px;width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.45);transform:translate(-50%,-50%) scale(0);pointer-events:none"></span>`);
          btn.appendChild(r);
          r.animate({ transform: ['translate(-50%,-50%) scale(0)', 'translate(-50%,-50%) scale(28)'], opacity: [.7, 0] }, { duration: v.up * 1.4, easing: 'ease-out' }).finished.then(() => r.remove());
        }
        return a;
      };
      btn.addEventListener('pointerdown', e => { down(); btn.setPointerCapture(e.pointerId); });
      btn.addEventListener('pointerup', e => { const b = btn.getBoundingClientRect(); up(e.clientX - b.left, e.clientY - b.top); });
      return { async play() { down(); await wait(v.down + 80); const b = btn.getBoundingClientRect(); return finished([up(b.width * .6, b.height * .5)]); } };
    },
    snippets: {
      'framer-motion': v => `<motion.button
  whileTap={{ scale: ${(v.press / 100).toFixed(2)}, transition: { duration: ${sec(v.down)}, ease: "easeOut" } }}
  transition={{ type: "spring", stiffness: 500, damping: 22 }}   /* release springs back */
  onTapStart={${v.ripple ? '(e, info) => spawnRipple(info.point)' : 'undefined'}}>
  Add to cart
</motion.button>${v.ripple ? `

// Ripple from the touch point (one-shot element):
function spawnRipple({ x, y }) {
  const r = document.createElement("span");
  Object.assign(r.style, { position: "absolute", left: x + "px", top: y + "px", width: "12px", height: "12px", borderRadius: "50%", background: "rgba(255,255,255,.45)", transform: "translate(-50%,-50%)", pointerEvents: "none" });
  button.appendChild(r);
  r.animate({ transform: ["translate(-50%,-50%) scale(0)", "translate(-50%,-50%) scale(28)"], opacity: [.7, 0] }, { duration: ${Math.round(v.up * 1.4)}, easing: "ease-out" }).finished.then(() => r.remove());
}` : ''}`,
      'CSS / WAAPI': v => `button { transition: transform ${v.up}ms ${EASINGS['spring-ish']}; }   /* release: overshoot */
button:active { transform: scale(${(v.press / 100).toFixed(2)}); transition-duration: ${v.down}ms; transition-timing-function: ease-out; }  /* press: fast, no bounce */
${v.ripple ? `
button.addEventListener("pointerup", e => {
  const b = button.getBoundingClientRect();
  const r = Object.assign(document.createElement("span"), { className: "ripple" });
  r.style.left = (e.clientX - b.left) + "px"; r.style.top = (e.clientY - b.top) + "px";
  button.appendChild(r);
  r.animate({ transform: ["translate(-50%,-50%) scale(0)", "translate(-50%,-50%) scale(28)"], opacity: [.7, 0] },
            { duration: ${Math.round(v.up * 1.4)}, easing: "ease-out" }).finished.then(() => r.remove());
});
/* .ripple { position:absolute; width:12px; height:12px; border-radius:50%; background:rgba(255,255,255,.45); pointer-events:none } */` : ''}`,
      'GSAP': v => `button.addEventListener("pointerdown", () => gsap.to(button, { scale: ${(v.press / 100).toFixed(2)}, duration: ${sec(v.down)}, ease: "power2.out" }));
button.addEventListener("pointerup",   () => gsap.to(button, { scale: 1, duration: ${sec(v.up)}, ease: "back.out(2)" }));`,
    },
  });

  /* 2 ── Toast ──────────────────────────────────────────────────────────── */
  register({
    id: 'toast', group: 'Micro-interactions', name: 'Toast',
    blurb: 'A notification slides up from the bottom edge, holds, then drops away. Enter with overshoot so it feels arrived; exit quicker and without bounce so it feels dismissed.',
    controls: [
      { key: 'enter', label: 'Enter', type: 'range', min: 150, max: 900, step: 10, def: 420, unit: 'ms' },
      { key: 'hold', label: 'Hold', type: 'range', min: 500, max: 4000, step: 100, def: 1800, unit: 'ms' },
      { key: 'exit', label: 'Exit', type: 'range', min: 100, max: 600, step: 10, def: 240, unit: 'ms' },
      { key: 'from', label: 'Edge', type: 'select', options: ['bottom', 'top'], def: 'bottom' },
      easeCtl('spring-ish'),
    ],
    reversible: false,
    mount(root, v) {
      root.style.background = '#0e1118';
      const top = v.from === 'top';
      const t = h(`<div style="position:absolute;left:50%;${top ? 'top:18px' : 'bottom:18px'};transform:translate(-50%, ${top ? '-' : ''}140%);background:#1e2733;color:#e6e8ec;border:1px solid #2f3a4b;border-radius:12px;padding:12px 16px;font-size:13px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.4);white-space:nowrap"><span style="width:8px;height:8px;border-radius:50%;background:#4ade80"></span>Saved to your library<span style="color:#8b93a1;margin-left:6px">Undo</span></div>`);
      root.appendChild(t);
      const off = `translate(-50%, ${top ? '-' : ''}140%)`, on = 'translate(-50%, 0)';
      let timer;
      return {
        async play() {
          clearTimeout(timer);
          await finished([t.animate({ transform: [off, on], opacity: [0, 1] }, { duration: v.enter, easing: EASINGS[v.easing], fill: 'forwards' })]);
          await new Promise(r => timer = setTimeout(r, v.hold));
          return finished([t.animate({ transform: [on, off], opacity: [1, 0] }, { duration: v.exit, easing: EASINGS['ease-in'], fill: 'forwards' })]);
        },
        destroy() { clearTimeout(timer); },
      };
    },
    snippets: {
      'framer-motion': v => `<AnimatePresence>
  {toast && (
    <motion.div className="toast"   /* position: fixed; ${v.from}: 18px; left: 50%; x handled below */
      initial={{ y: "${v.from === 'top' ? '-' : ''}140%", x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1, transition: { duration: ${sec(v.enter)}, ease: ${easeArr(v.easing)} } }}
      exit={{ y: "${v.from === 'top' ? '-' : ''}140%", x: "-50%", opacity: 0, transition: { duration: ${sec(v.exit)}, ease: "easeIn" } }}>
      {toast.message}
    </motion.div>
  )}
</AnimatePresence>
// useEffect(() => { const id = setTimeout(() => setToast(null), ${v.hold}); return () => clearTimeout(id); }, [toast]);`,
      'CSS / WAAPI': v => `const off = "translate(-50%, ${v.from === 'top' ? '-' : ''}140%)", on = "translate(-50%, 0)";
toast.animate({ transform: [off, on], opacity: [0, 1] }, { duration: ${v.enter}, easing: "${EASINGS[v.easing]}", fill: "forwards" });
setTimeout(() => toast.animate({ transform: [on, off], opacity: [1, 0] }, { duration: ${v.exit}, easing: "ease-in", fill: "forwards" })
  .finished.then(() => toast.remove()), ${v.enter + v.hold});`,
      'GSAP': v => `gsap.timeline()
  .fromTo(toast, { yPercent: ${v.from === 'top' ? '-' : ''}140, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: ${sec(v.enter)}, ease: "${gsapEase(v.easing)}" })
  .to(toast, { yPercent: ${v.from === 'top' ? '-' : ''}140, autoAlpha: 0, duration: ${sec(v.exit)}, ease: "power2.in" }, "+=${sec(v.hold)}");`,
    },
  });

  /* 3 ── Tab Indicator ──────────────────────────────────────────────────── */
  register({
    id: 'tab-indicator', group: 'Micro-interactions', name: 'Tab Indicator',
    blurb: 'The underline slides to the selected tab, stretching while in motion and snapping back to size when it lands. Measured from the real tab widths, so it works with any labels.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 150, max: 800, step: 10, def: 360, unit: 'ms' },
      { key: 'stretch', label: 'Stretch', type: 'toggle', def: true },
      easeCtl('ease-out-expo'),
    ],
    stage: { hint: 'click a tab' },
    mount(root, v) {
      const c = center(root);
      const bar = h(`<div style="position:relative;display:flex;gap:4px;border-bottom:1px solid #2a2f3a;padding-bottom:10px"></div>`);
      const labels = ['Overview', 'Specs', 'Reviews', 'Q&A'];
      const tabs = labels.map((l, i) => h(`<button style="background:none;border:0;color:${i ? '#8b93a1' : '#e6e8ec'};font-size:14px;font-weight:600;padding:8px 14px;cursor:pointer">${l}</button>`));
      const ind = h(`<div style="position:absolute;bottom:-1px;height:2px;background:#6ea8fe;border-radius:2px;left:0;width:0"></div>`);
      bar.append(...tabs, ind); c.appendChild(bar);
      let cur = 0;
      const place = (i) => { ind.style.left = tabs[i].offsetLeft + 'px'; ind.style.width = tabs[i].offsetWidth + 'px'; };
      place(0);
      const go = (i) => {
        if (i === cur) return Promise.resolve();
        const a = tabs[cur], b = tabs[i];
        tabs.forEach((t, k) => t.style.color = k === i ? '#e6e8ec' : '#8b93a1');
        const L0 = a.offsetLeft, W0 = a.offsetWidth, L1 = b.offsetLeft, W1 = b.offsetWidth;
        cur = i;
        const frames = v.stretch
          ? [{ left: L0 + 'px', width: W0 + 'px' }, { left: Math.min(L0, L1) + 'px', width: (Math.max(L0 + W0, L1 + W1) - Math.min(L0, L1)) + 'px', offset: .45 }, { left: L1 + 'px', width: W1 + 'px' }]
          : [{ left: L0 + 'px', width: W0 + 'px' }, { left: L1 + 'px', width: W1 + 'px' }];
        return finished([ind.animate(frames, { duration: v.duration, easing: EASINGS[v.easing], fill: 'forwards' })]);
      };
      tabs.forEach((t, i) => t.onclick = () => go(i));
      return { play(dir) { return go(dir === 1 ? (cur + 1) % tabs.length : (cur + tabs.length - 1) % tabs.length); } };
    },
    snippets: {
      'framer-motion': v => `// layoutId does the measuring: one indicator, rendered under the active tab.
{tabs.map(t => (
  <button key={t} onClick={() => setActive(t)} style={{ position: "relative" }}>
    {t}
    {active === t && (
      <motion.span layoutId="tab-underline"
        transition={{ duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} }}
        style={{ position: "absolute", left: 0, right: 0, bottom: -11, height: 2, background: "#6ea8fe" }} />
    )}
  </button>
))}${v.stretch ? `
// The stretch comes free: layoutId interpolates left AND width, so mid-flight the bar spans both.` : ''}`,
      'CSS / WAAPI': v => `function moveTo(tab) {
  const L0 = ind.offsetLeft, W0 = ind.offsetWidth, L1 = tab.offsetLeft, W1 = tab.offsetWidth;
  ind.animate([
    { left: L0 + "px", width: W0 + "px" },${v.stretch ? `
    { left: Math.min(L0, L1) + "px", width: (Math.max(L0 + W0, L1 + W1) - Math.min(L0, L1)) + "px", offset: .45 },  // stretch across both` : ''}
    { left: L1 + "px", width: W1 + "px" },
  ], { duration: ${v.duration}, easing: "${EASINGS[v.easing]}", fill: "forwards" });
}
/* Simplest CSS version (no stretch): .indicator { transition: left ${v.duration}ms ${EASINGS[v.easing]}, width ${v.duration}ms ${EASINGS[v.easing]}; } */`,
      'GSAP': v => `gsap.to(indicator, { left: tab.offsetLeft, width: tab.offsetWidth, duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}" });${v.stretch ? `
// Stretch: tween to the union first, then to the target
// gsap.timeline().to(ind, { left: Math.min(L0,L1), width: union, duration: ${sec(v.duration * .45)} }).to(ind, { left: L1, width: W1, duration: ${sec(v.duration * .55)} });` : ''}`,
    },
  });

  /* 4 ── Toggle Switch ──────────────────────────────────────────────────── */
  register({
    id: 'toggle-switch', group: 'Micro-interactions', name: 'Toggle Switch',
    blurb: 'The knob slides across while the track recolours. A squash-and-stretch on the knob (wider while moving, round when it lands) sells the weight.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 120, max: 700, step: 10, def: 300, unit: 'ms' },
      { key: 'squash', label: 'Squash', type: 'range', min: 0, max: 40, step: 5, def: 20, unit: '%' },
      easeCtl('ease-out-quint'),
    ],
    stage: { hint: 'click the switch' },
    mount(root, v) {
      const c = center(root);
      const sw = h(`<div style="position:relative;width:64px;height:36px;border-radius:18px;background:#3a4252;cursor:pointer"><div class="knob" style="position:absolute;top:4px;left:4px;width:28px;height:28px;border-radius:14px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4);transform-origin:center"></div></div>`);
      const lbl = h(`<div style="font-size:13px;color:#8b93a1">Notifications <b style="color:#e6e8ec">off</b></div>`);
      c.append(sw, lbl);
      const knob = sw.firstElementChild;
      let on = false;
      const run = (next) => {
        on = next; lbl.querySelector('b').textContent = on ? 'on' : 'off';
        const s = 1 + v.squash / 100, x0 = on ? 0 : 28, x1 = on ? 28 : 0;
        return finished([
          sw.animate({ background: [on ? '#3a4252' : '#4ade80', on ? '#4ade80' : '#3a4252'] }, { duration: v.duration, fill: 'forwards' }),
          knob.animate([{ transform: `translateX(${x0}px) scale(1,1)` }, { transform: `translateX(${(x0 + x1) / 2}px) scale(${s},${1 / s})`, offset: .5 }, { transform: `translateX(${x1}px) scale(1,1)` }], { duration: v.duration, easing: EASINGS[v.easing], fill: 'forwards' }),
        ]);
      };
      sw.onclick = () => run(!on);
      return { play(dir) { const next = dir === 1; if (next === on) { knob.style.transform = `translateX(${next ? 0 : 28}px)`; sw.style.background = next ? '#3a4252' : '#4ade80'; } return run(next); } };
    },
    snippets: {
      'framer-motion': v => `<motion.div className="track" onClick={() => setOn(o => !o)}
  animate={{ backgroundColor: on ? "#4ade80" : "#3a4252" }} transition={{ duration: ${sec(v.duration)} }}
  style={{ display: "flex", justifyContent: on ? "flex-end" : "flex-start", padding: 4 }}>
  <motion.div className="knob" layout   /* layout animates the position change from justify-content */
    transition={{ duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} }}${v.squash ? `
    animate={{ scaleX: [1, ${(1 + v.squash / 100).toFixed(2)}, 1], scaleY: [1, ${(1 / (1 + v.squash / 100)).toFixed(2)}, 1] }}
    key={String(on)}   /* re-trigger the squash on each toggle */` : ''} />
</motion.div>`,
      'CSS / WAAPI': v => `.track { transition: background ${v.duration}ms; }
.knob  { transition: transform ${v.duration}ms ${EASINGS[v.easing]}; }
.track.on { background: #4ade80; }
.track.on .knob { transform: translateX(28px); }
${v.squash ? `
/* squash while moving (WAAPI, on click): */
knob.animate([
  { transform: \`translateX(\${x0}px) scale(1,1)\` },
  { transform: \`translateX(\${(x0+x1)/2}px) scale(${(1 + v.squash / 100).toFixed(2)}, ${(1 / (1 + v.squash / 100)).toFixed(2)})\`, offset: .5 },
  { transform: \`translateX(\${x1}px) scale(1,1)\` },
], { duration: ${v.duration}, easing: "${EASINGS[v.easing]}", fill: "forwards" });` : ''}`,
      'GSAP': v => `gsap.timeline({ defaults: { duration: ${sec(v.duration / 2)} } })
  .to(track, { backgroundColor: on ? "#4ade80" : "#3a4252", duration: ${sec(v.duration)} }, 0)
  .to(knob, { x: on ? 14 : 14, scaleX: ${(1 + v.squash / 100).toFixed(2)}, scaleY: ${(1 / (1 + v.squash / 100)).toFixed(2)}, ease: "power2.in" }, 0)
  .to(knob, { x: on ? 28 : 0, scaleX: 1, scaleY: 1, ease: "${gsapEase(v.easing)}" });`,
    },
  });

  /* 5 ── Number Counter ─────────────────────────────────────────────────── */
  register({
    id: 'number-counter', group: 'Micro-interactions', name: 'Number Counter',
    blurb: 'A stat counts up to its value with a decelerating curve, so the last digits settle slowly and the number reads as earned. Tabular figures stop the width from jittering.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 400, max: 3000, step: 50, def: 1400, unit: 'ms' },
      { key: 'target', label: 'Target', type: 'range', min: 100, max: 99999, step: 100, def: 12480, unit: '' },
      { key: 'decimals', label: 'Decimals', type: 'range', min: 0, max: 2, step: 1, def: 0, unit: '' },
      easeCtl('ease-out-expo'),
    ],
    mount(root, v) {
      const c = center(root);
      const el = h(`<div style="font-size:64px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:#e6e8ec">0</div>`);
      const sub = h(`<div style="font-size:13px;color:#8b93a1;margin-top:-10px">monthly active users</div>`);
      c.append(el, sub);
      const fmt = n => n.toLocaleString(undefined, { minimumFractionDigits: v.decimals, maximumFractionDigits: v.decimals });
      let raf;
      return {
        play(dir) {
          cancelAnimationFrame(raf);
          const from = dir === 1 ? 0 : v.target, to = dir === 1 ? v.target : 0;
          // Drive the number with a WAAPI animation on a dummy so we get the real cubic-bezier curve.
          const probe = h(`<i style="position:absolute;opacity:0;transform:translateX(0px)"></i>`); root.appendChild(probe);
          const a = probe.animate({ transform: ['translateX(0px)', 'translateX(1000px)'] }, { duration: v.duration, easing: EASINGS[v.easing], fill: 'forwards' });
          return new Promise(res => {
            const tick = () => {
              const p = parseFloat(getComputedStyle(probe).transform.split(',')[4] || 0) / 1000;
              el.textContent = fmt(from + (to - from) * p);
              if (a.playState === 'finished' || p >= 1) { el.textContent = fmt(to); probe.remove(); res(); } else raf = requestAnimationFrame(tick);
            };
            tick();
          });
        },
        destroy() { cancelAnimationFrame(raf); },
      };
    },
    snippets: {
      'framer-motion': v => `import { animate, useMotionValue, useTransform, motion } from "framer-motion";

function Counter({ to = ${v.target} }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, n => n.toLocaleString(undefined, { maximumFractionDigits: ${v.decimals}, minimumFractionDigits: ${v.decimals} }));
  useEffect(() => { const c = animate(mv, to, { duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} }); return c.stop; }, [to]);
  return <motion.span style={{ fontVariantNumeric: "tabular-nums" }}>{text}</motion.span>;
}`,
      'CSS / WAAPI': v => `function countTo(el, to, { duration = ${v.duration}, ease = ${easeArr(v.easing)} } = {}) {
  const [x1, y1, x2, y2] = ease, t0 = performance.now();
  const bez = t => { /* cubic-bezier sampled on t∈[0,1] */ let lo = 0, hi = 1, s = t;
    for (let i = 0; i < 20; i++) { s = (lo + hi) / 2; const x = 3*(1-s)**2*s*x1 + 3*(1-s)*s*s*x2 + s**3; x < t ? lo = s : hi = s; }
    return 3*(1-s)**2*s*y1 + 3*(1-s)*s*s*y2 + s**3; };
  const fmt = n => n.toLocaleString(undefined, { maximumFractionDigits: ${v.decimals}, minimumFractionDigits: ${v.decimals} });
  (function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    el.textContent = fmt(to * bez(p));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
// el.style.fontVariantNumeric = "tabular-nums";  — stops width jitter

/* Pure CSS (Chrome 116+/Safari 17+): @property --n { syntax: "<integer>"; initial-value: 0; inherits: false; }
   .stat { counter-reset: n var(--n); transition: --n ${v.duration}ms ${EASINGS[v.easing]}; } .stat::after { content: counter(n); } */`,
      'GSAP': v => `const obj = { n: 0 };
gsap.to(obj, { n: ${v.target}, duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}",
  onUpdate: () => el.textContent = obj.n.toLocaleString(undefined, { maximumFractionDigits: ${v.decimals}, minimumFractionDigits: ${v.decimals} }) });`,
    },
  });
})();
