/* ── Scroll: motion driven by where the page is ─────────────────────────── */
(() => {
  const { h, finished, wait, easeArr, sec, gsapEase, easeCtl, EASINGS } = Playground;

  // Smoothly scroll an element to `to` over `ms`. Returns a promise.
  function scrollTo(el, to, ms) {
    const from = el.scrollTop, t0 = performance.now();
    return new Promise(res => (function tick(now) {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      el.scrollTop = from + (to - from) * e;
      p < 1 ? requestAnimationFrame(tick) : res();
    })(t0));
  }
  const scroller = (root) => { root.style.background = '#0e1118'; const s = h(`<div style="position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain"></div>`); root.appendChild(s); return s; };

  /* 1 ── Scroll Reveal ──────────────────────────────────────────────────── */
  register({
    id: 'scroll-reveal', group: 'Scroll', name: 'Scroll Reveal',
    blurb: 'Sections fade and rise into place as they enter the viewport, once. IntersectionObserver fires the animation; nothing runs on the scroll event itself. Play scrolls the stage for you, or scroll it by hand.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 200, max: 1200, step: 10, def: 600, unit: 'ms' },
      { key: 'rise', label: 'Rise', type: 'range', min: 0, max: 80, step: 2, def: 28, unit: 'px' },
      { key: 'threshold', label: 'Trigger at', type: 'range', min: 5, max: 60, step: 5, def: 20, unit: '%' },
      { key: 'stagger', label: 'Sibling stagger', type: 'range', min: 0, max: 150, step: 10, def: 80, unit: 'ms' },
      easeCtl('ease-out-quint'),
    ],
    mount(root, v) {
      const s = scroller(root);
      const inner = h(`<div style="padding:28px 32px 60px;display:flex;flex-direction:column;gap:22px"></div>`); s.appendChild(inner);
      inner.appendChild(h(`<div style="height:120px;display:flex;align-items:center;color:#8b93a1;font-size:13px">↓ scroll</div>`));
      const blocks = [];
      for (let i = 0; i < 6; i++) {
        const b = h(`<div class="rv" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="height:110px;border-radius:12px;background:linear-gradient(135deg,#1e3f66,#0f2540)"></div><div style="display:flex;flex-direction:column;gap:8px;justify-content:center"><div style="height:14px;width:60%;border-radius:7px;background:#28303d"></div><div style="height:10px;width:90%;border-radius:5px;background:#1b2029"></div><div style="height:10px;width:75%;border-radius:5px;background:#1b2029"></div></div></div>`);
        [...b.children].forEach(c => { c.style.opacity = 0; c.style.transform = `translateY(${v.rise}px)`; });
        inner.appendChild(b); blocks.push(b);
      }
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        [...en.target.children].forEach((c, i) => c.animate({ opacity: [0, 1], transform: [`translateY(${v.rise}px)`, 'none'] }, { duration: v.duration, delay: i * v.stagger, easing: EASINGS[v.easing], fill: 'forwards' }));
      }), { root: s, threshold: v.threshold / 100 });
      blocks.forEach(b => io.observe(b));
      return {
        async play(dir) {
          if (dir === 1) return scrollTo(s, s.scrollHeight, 3200);
          await scrollTo(s, 0, 900);
          blocks.forEach(b => { [...b.children].forEach(c => { c.getAnimations().forEach(a => a.cancel()); c.style.opacity = 0; c.style.transform = `translateY(${v.rise}px)`; }); io.observe(b); });
        },
        destroy() { io.disconnect(); },
      };
    },
    snippets: {
      'framer-motion': v => `// whileInView = IntersectionObserver under the hood. viewport.once stops it re-firing.
<motion.section
  initial={{ opacity: 0, y: ${v.rise} }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: ${(v.threshold / 100).toFixed(2)} }}
  transition={{ duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)}${v.stagger ? `, staggerChildren: ${sec(v.stagger)}` : ''} }}>
  {/* children with their own variants inherit the stagger */}
</motion.section>`,
      'CSS / WAAPI': v => `const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  io.unobserve(e.target);                                    // once
  [...e.target.children].forEach((c, i) => c.animate(
    { opacity: [0, 1], transform: ["translateY(${v.rise}px)", "none"] },
    { duration: ${v.duration}, delay: i * ${v.stagger}, easing: "${EASINGS[v.easing]}", fill: "forwards" }));
}), { threshold: ${(v.threshold / 100).toFixed(2)} });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));
/* .reveal > * { opacity: 0; }  — initial state, so nothing flashes before JS runs */

/* CSS-only (Chrome 115+): */
.reveal { animation: rise ${v.duration}ms ${EASINGS[v.easing]} both; animation-timeline: view(); animation-range: entry ${v.threshold}% entry 60%; }
@keyframes rise { from { opacity: 0; transform: translateY(${v.rise}px) } }`,
      'GSAP': v => `gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray(".reveal").forEach(section => {
  gsap.from(section.children, {
    autoAlpha: 0, y: ${v.rise}, duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}", stagger: ${sec(v.stagger)},
    scrollTrigger: { trigger: section, start: "top ${100 - v.threshold}%", once: true },
  });
});`,
    },
  });

  /* 2 ── Header Collapse ────────────────────────────────────────────────── */
  register({
    id: 'header-collapse', group: 'Scroll', name: 'Header Collapse',
    blurb: 'A tall profile header shrinks into a compact bar as the list scrolls under it: the avatar slides into the bar, the big title fades as the small one appears. Scrubbed from scroll position, so it reverses perfectly.',
    notes: `<p>One number, <code>p = clamp(scrollTop / range, 0, 1)</code>, drives every property. Nothing is "triggered"; the header is a pure function of scroll, which is why dragging back up never desyncs. This is the same mechanism as the ECHO detail-header collapse in Motion Demos, minus the measured timing on the stats cascade.</p>`,
    controls: [
      { key: 'tall', label: 'Expanded height', type: 'range', min: 120, max: 220, step: 4, def: 170, unit: 'px' },
      { key: 'short', label: 'Collapsed height', type: 'range', min: 44, max: 80, step: 2, def: 56, unit: 'px' },
      { key: 'range', label: 'Scroll range', type: 'range', min: 60, max: 240, step: 10, def: 140, unit: 'px' },
      { key: 'blur', label: 'Bar blur', type: 'toggle', def: true },
    ],
    mount(root, v) {
      const s = scroller(root);
      const hdr = h(`<div style="position:sticky;top:0;z-index:2;height:${v.tall}px;overflow:hidden;background:linear-gradient(140deg,#1e3f66,#0f2540);color:#fff;${v.blur ? 'backdrop-filter:blur(10px);' : ''}">
        <div class="av" style="position:absolute;left:28px;top:34px;width:64px;height:64px;border-radius:50%;background:#3b6ea5;border:3px solid rgba(255,255,255,.2);transform-origin:0 0"></div>
        <div class="big" style="position:absolute;left:28px;top:112px;font-size:24px;font-weight:800;letter-spacing:-.02em">Jane Cooper</div>
        <div class="sub" style="position:absolute;left:28px;top:144px;font-size:12px;opacity:.7">Product Designer · Boston</div>
        <div class="small" style="position:absolute;left:0;right:0;top:0;height:${v.short}px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;opacity:0">Jane Cooper</div>
      </div>`);
      const list = h(`<div style="padding:16px 28px 40px;display:flex;flex-direction:column;gap:10px">${Array.from({ length: 12 }, (_, i) => `<div style="height:48px;border-radius:10px;background:#161a22;border:1px solid #232838;display:flex;align-items:center;padding:0 14px;font-size:13px;color:#aab3c2">Post ${i + 1}</div>`).join('')}</div>`);
      s.append(hdr, list);
      const av = hdr.querySelector('.av'), big = hdr.querySelector('.big'), sub = hdr.querySelector('.sub'), small = hdr.querySelector('.small');
      const render = () => {
        const p = Math.max(0, Math.min(1, s.scrollTop / v.range));
        hdr.style.height = (v.tall + (v.short - v.tall) * p) + 'px';
        const sc = 1 + (32 / 64 - 1) * p;   // 64 → 32px
        av.style.transform = `translate(${(0) * p}px, ${((v.short - 32) / 2 - 34) * p}px) scale(${sc})`;
        big.style.opacity = sub.style.opacity = String(Math.max(0, 1 - p * 1.6));
        big.style.transform = sub.style.transform = `translateY(${-14 * p}px)`;
        small.style.opacity = String(Math.max(0, (p - 0.55) / 0.45));
        small.style.transform = `translateY(${6 * (1 - p)}px)`;
      };
      s.addEventListener('scroll', render, { passive: true }); render();
      return { play(dir) { return scrollTo(s, dir === 1 ? v.range + 120 : 0, 1100); } };
    },
    snippets: {
      'framer-motion': v => `const { scrollY } = useScroll({ container: listRef });
const p      = useTransform(scrollY, [0, ${v.range}], [0, 1], { clamp: true });
const height = useTransform(p, [0, 1], [${v.tall}, ${v.short}]);
const avScale = useTransform(p, [0, 1], [1, 0.5]);
const avY     = useTransform(p, [0, 1], [0, ${Math.round((v.short - 32) / 2 - 34)}]);
const bigOp   = useTransform(p, [0, 0.6], [1, 0]);
const smallOp = useTransform(p, [0.55, 1], [0, 1]);

<motion.header style={{ height, position: "sticky", top: 0 }}>
  <motion.img className="avatar" style={{ scale: avScale, y: avY, transformOrigin: "0 0" }} />
  <motion.h1 style={{ opacity: bigOp }}>Jane Cooper</motion.h1>
  <motion.div className="bar-title" style={{ opacity: smallOp }}>Jane Cooper</motion.div>
</motion.header>`,
      'CSS / WAAPI': v => `// Pure function of scroll: p ∈ [0,1] drives every property. No thresholds, no state.
list.addEventListener("scroll", () => {
  const p = Math.min(1, Math.max(0, list.scrollTop / ${v.range}));
  header.style.height = (${v.tall} + (${v.short} - ${v.tall}) * p) + "px";
  avatar.style.transform = \`translateY(\${${Math.round((v.short - 32) / 2 - 34)} * p}px) scale(\${1 - 0.5 * p})\`;   // 64 → 32px, origin 0 0
  bigTitle.style.opacity = Math.max(0, 1 - p * 1.6);
  barTitle.style.opacity = Math.max(0, (p - 0.55) / 0.45);
}, { passive: true });

/* CSS-only with scroll-driven animations (Chrome 115+):
header { animation: collapse linear both; animation-timeline: scroll(); animation-range: 0 ${v.range}px; }
@keyframes collapse { to { height: ${v.short}px } }  */`,
      'GSAP': v => `gsap.registerPlugin(ScrollTrigger);
gsap.timeline({ scrollTrigger: { scroller: list, start: 0, end: ${v.range}, scrub: true } })
  .to(header,   { height: ${v.short} }, 0)
  .to(avatar,   { scale: 0.5, y: ${Math.round((v.short - 32) / 2 - 34)}, transformOrigin: "0 0" }, 0)
  .to(bigTitle, { autoAlpha: 0, y: -14, duration: 0.6 }, 0)
  .fromTo(barTitle, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.55);`,
    },
  });

  /* 3 ── Parallax Layers ────────────────────────────────────────────────── */
  register({
    id: 'parallax-layers', group: 'Scroll', name: 'Parallax Layers',
    blurb: 'Background layers move slower than the content, so the scene has depth. Each layer\'s offset is scrollTop × its own factor; a factor of 1 scrolls normally, 0 is pinned.',
    controls: [
      { key: 'back', label: 'Far layer speed', type: 'range', min: 0, max: 100, step: 5, def: 20, unit: '%' },
      { key: 'mid', label: 'Mid layer speed', type: 'range', min: 0, max: 100, step: 5, def: 55, unit: '%' },
      { key: 'heroFade', label: 'Hero text fades', type: 'toggle', def: true },
    ],
    mount(root, v) {
      const s = scroller(root);
      const hero = h(`<div style="position:relative;height:300px;overflow:hidden;background:#0b1626">
        <div class="l back" style="position:absolute;inset:-40px 0 0;background:radial-gradient(circle at 70% 30%,#1e3f66 0,transparent 40%),radial-gradient(circle at 20% 70%,#7c2d12 0,transparent 35%)"></div>
        <div class="l mid" style="position:absolute;left:0;right:0;bottom:-20px;height:160px;background:linear-gradient(to top,#0f2540,transparent);"></div>
        <div class="l mid" style="position:absolute;left:12%;bottom:40px;width:120px;height:120px;border-radius:50%;background:#c2410c;opacity:.85"></div>
        <div class="txt" style="position:absolute;left:32px;top:110px;color:#fff;font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.05">Depth<br>without 3D</div>
      </div>`);
      const body = h(`<div style="padding:24px 32px 40px;display:flex;flex-direction:column;gap:12px;background:#0e1118;position:relative;z-index:1">${Array.from({ length: 8 }, () => `<div style="height:60px;border-radius:10px;background:#161a22;border:1px solid #232838"></div>`).join('')}</div>`);
      s.append(hero, body);
      const backs = [...hero.querySelectorAll('.back')], mids = [...hero.querySelectorAll('.mid')], txt = hero.querySelector('.txt');
      const render = () => {
        const y = s.scrollTop;
        backs.forEach(l => l.style.transform = `translateY(${y * (1 - v.back / 100)}px)`);
        mids.forEach(l => l.style.transform = `translateY(${y * (1 - v.mid / 100)}px)`);
        txt.style.transform = `translateY(${y * 0.35}px)`;
        if (v.heroFade) txt.style.opacity = String(Math.max(0, 1 - y / 160));
      };
      s.addEventListener('scroll', render, { passive: true }); render();
      return { play(dir) { return scrollTo(s, dir === 1 ? 300 : 0, 1400); } };
    },
    snippets: {
      'framer-motion': v => `const { scrollY } = useScroll();
const backY = useTransform(scrollY, y => y * ${(1 - v.back / 100).toFixed(2)});   // ${v.back}% speed → moves ${100 - v.back}% with the page... i.e. appears to lag
const midY  = useTransform(scrollY, y => y * ${(1 - v.mid / 100).toFixed(2)});
const txtY  = useTransform(scrollY, y => y * 0.35);${v.heroFade ? `\nconst txtOp = useTransform(scrollY, [0, 160], [1, 0]);` : ''}

<section className="hero" style={{ position: "relative", overflow: "hidden" }}>
  <motion.div className="layer back" style={{ y: backY }} />
  <motion.div className="layer mid"  style={{ y: midY }} />
  <motion.h1 style={{ y: txtY${v.heroFade ? ', opacity: txtOp' : ''} }}>Depth without 3D</motion.h1>
</section>`,
      'CSS / WAAPI': v => `// The layers live INSIDE the scrolling hero; translating them by a fraction of scrollTop makes them lag.
addEventListener("scroll", () => {
  const y = scrollY;
  back.style.transform = \`translateY(\${y * ${(1 - v.back / 100).toFixed(2)}}px)\`;
  mid.style.transform  = \`translateY(\${y * ${(1 - v.mid / 100).toFixed(2)}}px)\`;
  title.style.transform = \`translateY(\${y * 0.35}px)\`;${v.heroFade ? `\n  title.style.opacity = Math.max(0, 1 - y / 160);` : ''}
}, { passive: true });

/* CSS-only (Chrome 115+): */
.back { animation: drift linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
@keyframes drift { to { transform: translateY(${Math.round(100 * (1 - v.back / 100))}vh) } }`,
      'GSAP': v => `gsap.registerPlugin(ScrollTrigger);
const st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
gsap.to(".back",  { yPercent: ${Math.round(100 * (1 - v.back / 100))}, ease: "none", scrollTrigger: st });
gsap.to(".mid",   { yPercent: ${Math.round(100 * (1 - v.mid / 100))}, ease: "none", scrollTrigger: st });
gsap.to(".hero h1", { yPercent: 35${v.heroFade ? ', autoAlpha: 0' : ''}, ease: "none", scrollTrigger: st });`,
    },
  });
})();
