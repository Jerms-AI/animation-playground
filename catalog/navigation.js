/* ── Navigation: how one screen becomes another ─────────────────────────── */
(() => {
  const { h, finished, easeArr, sec, gsapEase, easeCtl, EASINGS } = Playground;

  // Two full-bleed screens, A on top of B or vice versa depending on `bOnTop`.
  function twoScreens(root, bOnTop = true) {
    const A = h(`<div class="screen screenA"><div class="label">A</div><div class="sub">current screen</div></div>`);
    const B = h(`<div class="screen screenB"><div class="label">B</div><div class="sub">next screen</div></div>`);
    root.append(...(bOnTop ? [A, B] : [B, A]));
    return { A, B };
  }
  const opt = (v, extra = {}) => ({ duration: v.duration, easing: EASINGS[v.easing], fill: 'forwards', ...extra });

  /* 1 ── Page Slide ─────────────────────────────────────────────────────── */
  register({
    id: 'page-slide', group: 'Navigation', name: 'Page Slide',
    blurb: 'Both screens travel in unison: A slides out one way, B comes in from the opposite side. The classic push / pop navigation. Forward = both slide left; reverse = both slide right.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 150, max: 1200, step: 10, def: 450, unit: 'ms' },
      { key: 'distance', label: 'Travel', type: 'range', min: 30, max: 100, step: 5, def: 100, unit: '%' },
      easeCtl(),
      { key: 'fade', label: 'Fade', type: 'toggle', def: true },
    ],
    mount(root, v) {
      const { A, B } = twoScreens(root);
      const d = v.distance, fa = v.fade ? 0 : 1;
      A.style.transform = 'translateX(0)'; B.style.transform = `translateX(${d}%)`; B.style.opacity = fa;
      let shown = false;  // which screen is on
      return {
        play(dir) {
          const fwd = dir === 1;
          if (fwd === shown) { // snap to the right rest state first
            A.style.transform = fwd ? 'translateX(0)' : `translateX(-${d}%)`; A.style.opacity = fwd ? 1 : fa;
            B.style.transform = fwd ? `translateX(${d}%)` : 'translateX(0)'; B.style.opacity = fwd ? fa : 1;
          }
          shown = fwd;
          const a1 = A.animate({ transform: fwd ? ['translateX(0)', `translateX(-${d}%)`] : [`translateX(-${d}%)`, 'translateX(0)'], opacity: fwd ? [1, fa] : [fa, 1] }, opt(v));
          const a2 = B.animate({ transform: fwd ? [`translateX(${d}%)`, 'translateX(0)'] : ['translateX(0)', `translateX(${d}%)`], opacity: fwd ? [fa, 1] : [1, fa] }, opt(v));
          return finished([a1, a2]);
        },
      };
    },
    snippets: {
      'framer-motion': v => `// PageTransition.tsx — forward (A → B): both slide LEFT
const variants = {
  initial: { x: "${v.distance}%", opacity: ${v.fade ? 0 : 1} },  // incoming waits to the right
  animate: { x: 0, opacity: 1, transition: { duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} } },
  exit:    { x: "-${v.distance}%", opacity: ${v.fade ? 0 : 1},   // outgoing leaves left
             transition: { duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} } },
};

<AnimatePresence mode="popLayout" custom={dir}>
  <motion.div key={pathname} variants={variants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
</AnimatePresence>`,
      'CSS / WAAPI': v => `// Both screens are position:absolute; inset:0 in the same container.
const opts = { duration: ${v.duration}, easing: "${EASINGS[v.easing]}", fill: "forwards" };

outgoing.animate({ transform: ["translateX(0)", "translateX(-${v.distance}%)"]${v.fade ? ', opacity: [1, 0]' : ''} }, opts);
incoming.animate({ transform: ["translateX(${v.distance}%)", "translateX(0)"]${v.fade ? ', opacity: [0, 1]' : ''} }, opts);

/* or as CSS, toggled by a class on the container: */
.screen { transition: transform ${v.duration}ms ${EASINGS[v.easing]}${v.fade ? `, opacity ${v.duration}ms ${EASINGS[v.easing]}` : ''}; }
.is-next .outgoing { transform: translateX(-${v.distance}%);${v.fade ? ' opacity: 0;' : ''} }
.is-next .incoming { transform: translateX(0);${v.fade ? ' opacity: 1;' : ''} }`,
      'GSAP': v => `const tl = gsap.timeline({ defaults: { duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}" } });
tl.to(outgoing, { xPercent: -${v.distance}${v.fade ? ', autoAlpha: 0' : ''} }, 0)
  .fromTo(incoming, { xPercent: ${v.distance}${v.fade ? ', autoAlpha: 0' : ''} }, { xPercent: 0${v.fade ? ', autoAlpha: 1' : ''} }, 0);`,
    },
  });

  /* 2 ── Fade Through ───────────────────────────────────────────────────── */
  register({
    id: 'fade-through', group: 'Navigation', name: 'Fade Through',
    blurb: 'The outgoing screen fades out quickly; the incoming one fades in and settles from a slight scale. No directional meaning, so it suits tab switches and unrelated destinations. (Material\'s "fade through".)',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 150, max: 900, step: 10, def: 320, unit: 'ms' },
      { key: 'scale', label: 'Incoming scale', type: 'range', min: 80, max: 100, step: 1, def: 92, unit: '%' },
      { key: 'outRatio', label: 'Out / total', type: 'range', min: 20, max: 60, step: 5, def: 30, unit: '%' },
      easeCtl('ease-out-expo'),
    ],
    mount(root, v) {
      const { A, B } = twoScreens(root);
      B.style.opacity = 0;
      let shown = false;
      return {
        play(dir) {
          const fwd = dir === 1;
          const out = fwd ? A : B, inn = fwd ? B : A;
          if (fwd === shown) { out.style.opacity = 1; out.style.transform = 'none'; inn.style.opacity = 0; }
          shown = fwd;
          const tOut = v.duration * v.outRatio / 100, tIn = v.duration - tOut, s = v.scale / 100;
          const a1 = out.animate({ opacity: [1, 0] }, { duration: tOut, easing: 'ease-in', fill: 'forwards' });
          const a2 = inn.animate({ opacity: [0, 1], transform: [`scale(${s})`, 'scale(1)'] }, { duration: tIn, delay: tOut, easing: EASINGS[v.easing], fill: 'forwards' });
          return finished([a1, a2]);
        },
      };
    },
    snippets: {
      'framer-motion': v => {
        const tOut = sec(v.duration * v.outRatio / 100), tIn = sec(v.duration - v.duration * v.outRatio / 100);
        return `const fadeThrough = {
  initial: { opacity: 0, scale: ${(v.scale / 100).toFixed(2)} },
  animate: { opacity: 1, scale: 1, transition: { duration: ${tIn}, delay: ${tOut}, ease: ${easeArr(v.easing)} } },
  exit:    { opacity: 0, transition: { duration: ${tOut}, ease: "easeIn" } },
};
<AnimatePresence mode="wait">   {/* "wait" lets the exit finish; the delay above covers the gap */}
  <motion.div key={tab} variants={fadeThrough} initial="initial" animate="animate" exit="exit" />
</AnimatePresence>`;
      },
      'CSS / WAAPI': v => {
        const tOut = Math.round(v.duration * v.outRatio / 100), tIn = v.duration - tOut;
        return `outgoing.animate({ opacity: [1, 0] }, { duration: ${tOut}, easing: "ease-in", fill: "forwards" });
incoming.animate(
  { opacity: [0, 1], transform: ["scale(${(v.scale / 100).toFixed(2)})", "scale(1)"] },
  { duration: ${tIn}, delay: ${tOut}, easing: "${EASINGS[v.easing]}", fill: "forwards" }
);`;
      },
      'GSAP': v => {
        const tOut = sec(v.duration * v.outRatio / 100), tIn = sec(v.duration - v.duration * v.outRatio / 100);
        return `gsap.timeline()
  .to(outgoing, { autoAlpha: 0, duration: ${tOut}, ease: "power2.in" })
  .fromTo(incoming, { autoAlpha: 0, scale: ${(v.scale / 100).toFixed(2)} }, { autoAlpha: 1, scale: 1, duration: ${tIn}, ease: "${gsapEase(v.easing)}" });`;
      },
    },
  });

  /* 3 ── Parallax Push ──────────────────────────────────────────────────── */
  register({
    id: 'parallax-push', group: 'Navigation', name: 'Parallax Push',
    blurb: 'The native iOS feel: the incoming screen slides over the top with a shadow while the outgoing one drifts a fraction of the distance and dims. Depth without a 3D transform.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 200, max: 1000, step: 10, def: 420, unit: 'ms' },
      { key: 'parallax', label: 'Outgoing travel', type: 'range', min: 0, max: 60, step: 5, def: 30, unit: '%' },
      { key: 'dim', label: 'Outgoing dim', type: 'range', min: 0, max: 60, step: 5, def: 25, unit: '%' },
      easeCtl('ease-out-expo'),
    ],
    mount(root, v) {
      const { A, B } = twoScreens(root);
      const dim = h(`<div style="position:absolute;inset:0;background:#000;opacity:0;pointer-events:none"></div>`);
      A.appendChild(dim);
      B.style.transform = 'translateX(100%)'; B.style.boxShadow = '-20px 0 40px rgba(0,0,0,.45)';
      let shown = false;
      return {
        play(dir) {
          const fwd = dir === 1;
          if (fwd === shown) { A.style.transform = fwd ? 'none' : `translateX(-${v.parallax}%)`; B.style.transform = fwd ? 'translateX(100%)' : 'none'; dim.style.opacity = fwd ? 0 : v.dim / 100; }
          shown = fwd;
          const p = v.parallax, d = v.dim / 100;
          const a1 = A.animate({ transform: fwd ? ['translateX(0)', `translateX(-${p}%)`] : [`translateX(-${p}%)`, 'translateX(0)'] }, opt(v));
          const a2 = dim.animate({ opacity: fwd ? [0, d] : [d, 0] }, opt(v));
          const a3 = B.animate({ transform: fwd ? ['translateX(100%)', 'translateX(0)'] : ['translateX(0)', 'translateX(100%)'] }, opt(v));
          return finished([a1, a2, a3]);
        },
      };
    },
    snippets: {
      'framer-motion': v => `// Outgoing screen (stays mounted underneath):
<motion.div animate={{ x: isPushed ? "-${v.parallax}%" : 0 }}
  transition={{ duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} }}>
  {children}
  <motion.div className="dim" animate={{ opacity: isPushed ? ${(v.dim / 100).toFixed(2)} : 0 }}
    style={{ position: "absolute", inset: 0, background: "#000", pointerEvents: "none" }} />
</motion.div>

// Incoming screen (on top, with a left shadow):
<motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
  transition={{ duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} }}
  style={{ position: "absolute", inset: 0, boxShadow: "-20px 0 40px rgba(0,0,0,.45)" }} />`,
      'CSS / WAAPI': v => `const opts = { duration: ${v.duration}, easing: "${EASINGS[v.easing]}", fill: "forwards" };
outgoing.animate({ transform: ["translateX(0)", "translateX(-${v.parallax}%)"] }, opts);
outgoingDim.animate({ opacity: [0, ${(v.dim / 100).toFixed(2)}] }, opts);
incoming.animate({ transform: ["translateX(100%)", "translateX(0)"] }, opts);
// incoming gets: box-shadow: -20px 0 40px rgba(0,0,0,.45)`,
      'GSAP': v => `gsap.timeline({ defaults: { duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}" } })
  .to(outgoing, { xPercent: -${v.parallax} }, 0)
  .to(outgoingDim, { opacity: ${(v.dim / 100).toFixed(2)} }, 0)
  .fromTo(incoming, { xPercent: 100 }, { xPercent: 0 }, 0);`,
    },
  });

  /* 4 ── Bottom Sheet ───────────────────────────────────────────────────── */
  register({
    id: 'bottom-sheet', group: 'Navigation', name: 'Bottom Sheet',
    blurb: 'A sheet rises from the bottom edge while a scrim darkens and the page behind recedes slightly. The modal that still feels like it belongs to the page.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 200, max: 1000, step: 10, def: 460, unit: 'ms' },
      { key: 'height', label: 'Sheet height', type: 'range', min: 30, max: 95, step: 5, def: 60, unit: '%' },
      { key: 'recede', label: 'Page recede', type: 'range', min: 0, max: 10, step: 1, def: 4, unit: '%' },
      { key: 'scrim', label: 'Scrim', type: 'range', min: 0, max: 80, step: 5, def: 45, unit: '%' },
      easeCtl('ease-out-quint'),
    ],
    mount(root, v) {
      const page = h(`<div class="screen screenA" style="transform-origin:50% 0"><div class="label">Page</div><div class="sub">tap-through content</div></div>`);
      const scrim = h(`<div style="position:absolute;inset:0;background:#000;opacity:0"></div>`);
      const sheet = h(`<div style="position:absolute;left:0;right:0;bottom:0;height:${v.height}%;background:#1e2733;border-radius:18px 18px 0 0;transform:translateY(100%);box-shadow:0 -10px 40px rgba(0,0,0,.4);padding:16px;color:#dbe4f2;font-size:13px">
        <div style="width:36px;height:4px;border-radius:2px;background:#4a5668;margin:0 auto 14px"></div>
        <div style="font-weight:700;font-size:15px;margin-bottom:10px">Sheet</div>
        ${[0,1,2].map(() => `<div style="height:28px;border-radius:7px;background:#28323f;margin-bottom:8px"></div>`).join('')}
      </div>`);
      root.append(page, scrim, sheet);
      const r = 1 - v.recede / 100, s = v.scrim / 100;
      let open = false;
      return {
        play(dir) {
          const fwd = dir === 1;
          if (fwd === open) { page.style.transform = fwd ? 'none' : `scale(${r})`; scrim.style.opacity = fwd ? 0 : s; sheet.style.transform = fwd ? 'translateY(100%)' : 'none'; }
          open = fwd;
          const o = opt(v); if (!fwd) o.easing = EASINGS['ease-in-out'];
          const a1 = sheet.animate({ transform: fwd ? ['translateY(100%)', 'translateY(0)'] : ['translateY(0)', 'translateY(100%)'] }, o);
          const a2 = scrim.animate({ opacity: fwd ? [0, s] : [s, 0] }, o);
          const a3 = page.animate({ transform: fwd ? ['scale(1)', `scale(${r})`] : [`scale(${r})`, 'scale(1)'], borderRadius: fwd ? ['0px', '12px'] : ['12px', '0px'] }, o);
          return finished([a1, a2, a3]);
        },
      };
    },
    snippets: {
      'framer-motion': v => `const t = { duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} };

// Page behind (scale from the top edge):
<motion.main animate={{ scale: open ? ${(1 - v.recede / 100).toFixed(2)} : 1, borderRadius: open ? 12 : 0 }}
  transition={t} style={{ transformOrigin: "50% 0" }} />

<AnimatePresence>
  {open && (<>
    <motion.div className="scrim" onClick={close}
      initial={{ opacity: 0 }} animate={{ opacity: ${(v.scrim / 100).toFixed(2)} }} exit={{ opacity: 0 }} transition={t} />
    <motion.div className="sheet"  /* position:fixed; left:0; right:0; bottom:0; height:${v.height}vh */
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%", transition: { ...t, ease: "easeInOut" } }}
      transition={t}
      drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
      onDragEnd={(e, info) => { if (info.offset.y > 120 || info.velocity.y > 500) close(); }} />
  </>)}
</AnimatePresence>`,
      'CSS / WAAPI': v => `.sheet { position: fixed; inset: auto 0 0; height: ${v.height}vh; transform: translateY(100%);
         transition: transform ${v.duration}ms ${EASINGS[v.easing]}; }
.scrim { position: fixed; inset: 0; background: #000; opacity: 0; pointer-events: none;
         transition: opacity ${v.duration}ms ${EASINGS[v.easing]}; }
.page  { transform-origin: 50% 0; transition: transform ${v.duration}ms ${EASINGS[v.easing]}, border-radius ${v.duration}ms; }

.is-open .sheet { transform: none; }
.is-open .scrim { opacity: ${(v.scrim / 100).toFixed(2)}; pointer-events: auto; }
.is-open .page  { transform: scale(${(1 - v.recede / 100).toFixed(2)}); border-radius: 12px; }`,
      'GSAP': v => `const open = gsap.timeline({ paused: true, defaults: { duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}" } })
  .fromTo(".sheet", { yPercent: 100 }, { yPercent: 0 }, 0)
  .to(".scrim", { autoAlpha: ${(v.scrim / 100).toFixed(2)} }, 0)
  .to(".page",  { scale: ${(1 - v.recede / 100).toFixed(2)}, borderRadius: 12, transformOrigin: "50% 0" }, 0);
// open.play() / open.reverse()`,
    },
  });

  /* 5 ── Side Drawer ────────────────────────────────────────────────────── */
  register({
    id: 'side-drawer', group: 'Navigation', name: 'Side Drawer',
    blurb: 'A navigation drawer slides in from the edge. Optionally the page gets pushed along with it instead of being covered, which reads as one connected surface.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 150, max: 900, step: 10, def: 380, unit: 'ms' },
      { key: 'width', label: 'Drawer width', type: 'range', min: 40, max: 85, step: 5, def: 65, unit: '%' },
      { key: 'push', label: 'Push page', type: 'toggle', def: true },
      { key: 'stagger', label: 'Item stagger', type: 'range', min: 0, max: 80, step: 5, def: 30, unit: 'ms' },
      easeCtl('ease-out-quint'),
    ],
    mount(root, v) {
      const page = h(`<div class="screen screenA"><div class="label">Page</div><div class="sub">☰ menu</div></div>`);
      const scrim = h(`<div style="position:absolute;inset:0;background:#000;opacity:0"></div>`);
      const drawer = h(`<div style="position:absolute;top:0;bottom:0;left:0;width:${v.width}%;max-width:320px;background:#161b24;transform:translateX(-100%);box-shadow:10px 0 40px rgba(0,0,0,.45);padding:22px 18px;color:#dbe4f2">
        <div style="font-weight:700;font-size:15px;margin-bottom:16px">Menu</div>
        ${['Home', 'Projects', 'Lab', 'About', 'Contact'].map(t => `<div class="it" style="padding:10px 0;font-size:13.5px;opacity:0;transform:translateX(-14px)">${t}</div>`).join('')}
      </div>`);
      root.append(page, scrim, drawer);
      const items = [...drawer.querySelectorAll('.it')];
      let open = false;
      return {
        play(dir) {
          const fwd = dir === 1;
          if (fwd === open) { drawer.style.transform = fwd ? 'translateX(-100%)' : 'none'; scrim.style.opacity = fwd ? 0 : .4; page.style.transform = (fwd || !v.push) ? 'none' : `translateX(${Math.min(v.width, 320 / root.clientWidth * 100)}%)`; items.forEach(i => { i.style.opacity = fwd ? 0 : 1; i.style.transform = fwd ? 'translateX(-14px)' : 'none'; }); }
          open = fwd;
          const o = opt(v); if (!fwd) o.easing = EASINGS['ease-in-out'];
          const pushPct = Math.min(v.width, 320 / root.clientWidth * 100);
          const anims = [
            drawer.animate({ transform: fwd ? ['translateX(-100%)', 'translateX(0)'] : ['translateX(0)', 'translateX(-100%)'] }, o),
            scrim.animate({ opacity: fwd ? [0, .4] : [.4, 0] }, o),
          ];
          if (v.push) anims.push(page.animate({ transform: fwd ? ['translateX(0)', `translateX(${pushPct}%)`] : [`translateX(${pushPct}%)`, 'translateX(0)'] }, o));
          items.forEach((it, i) => anims.push(it.animate(
            fwd ? { opacity: [0, 1], transform: ['translateX(-14px)', 'translateX(0)'] } : { opacity: [1, 0], transform: ['translateX(0)', 'translateX(-14px)'] },
            { duration: fwd ? v.duration * .7 : v.duration * .4, delay: fwd ? v.duration * .25 + i * v.stagger : 0, easing: EASINGS[v.easing], fill: 'forwards' })));
          return finished(anims);
        },
      };
    },
    snippets: {
      'framer-motion': v => `const t = { duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} };
const list = { open: { transition: { delayChildren: ${sec(v.duration * .25)}, staggerChildren: ${sec(v.stagger)} } }, closed: {} };
const item = { open: { opacity: 1, x: 0, transition: t }, closed: { opacity: 0, x: -14 } };

<motion.nav className="drawer"  /* position:fixed; inset:0 auto 0 0; width:${v.width}vw; max-width:320px */
  initial={false} animate={open ? "open" : "closed"}
  variants={{ open: { x: 0, transition: t }, closed: { x: "-100%", transition: { ...t, ease: "easeInOut" } } }}>
  <motion.ul variants={list}>
    {links.map(l => <motion.li key={l} variants={item}>{l}</motion.li>)}
  </motion.ul>
</motion.nav>
${v.push ? `<motion.main animate={{ x: open ? "min(${v.width}vw, 320px)" : 0 }} transition={t} />` : `{/* page stays put; the scrim covers it */}`}`,
      'CSS / WAAPI': v => `.drawer { position: fixed; inset: 0 auto 0 0; width: ${v.width}vw; max-width: 320px;
          transform: translateX(-100%); transition: transform ${v.duration}ms ${EASINGS[v.easing]}; }
.drawer li { opacity: 0; transform: translateX(-14px); transition: opacity ${Math.round(v.duration * .7)}ms, transform ${Math.round(v.duration * .7)}ms ${EASINGS[v.easing]}; }
.is-open .drawer { transform: none; }
.is-open .drawer li { opacity: 1; transform: none; }
.is-open .drawer li:nth-child(n) { transition-delay: calc(${Math.round(v.duration * .25)}ms + (var(--i) * ${v.stagger}ms)); }  /* set --i inline per li */
${v.push ? `.page { transition: transform ${v.duration}ms ${EASINGS[v.easing]}; }\n.is-open .page { transform: translateX(min(${v.width}vw, 320px)); }` : ''}`,
      'GSAP': v => `const drawer = gsap.timeline({ paused: true, defaults: { ease: "${gsapEase(v.easing)}" } })
  .fromTo(".drawer", { xPercent: -100 }, { xPercent: 0, duration: ${sec(v.duration)} }, 0)
  .to(".scrim", { autoAlpha: 0.4, duration: ${sec(v.duration)} }, 0)${v.push ? `\n  .to(".page", { x: () => Math.min(innerWidth * ${(v.width / 100).toFixed(2)}, 320), duration: ${sec(v.duration)} }, 0)` : ''}
  .fromTo(".drawer li", { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: ${sec(v.duration * .7)}, stagger: ${sec(v.stagger)} }, ${sec(v.duration * .25)});
// drawer.play() / drawer.reverse()`,
    },
  });
})();
