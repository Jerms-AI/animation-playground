/* ── Content: lists, cards, expansion, loading, reorder ─────────────────── */
(() => {
  const { h, finished, wait, easeArr, sec, gsapEase, easeCtl, EASINGS } = Playground;
  const ROW = 'height:34px;border-radius:9px;border:1px solid #2a2f3a;background:linear-gradient(90deg,#1e3f66,#16314f);display:flex;align-items:center;padding:0 14px;color:#cdd9ee;font-size:13px;font-weight:600;will-change:transform,opacity;';

  /* 1 ── Staggered List ─────────────────────────────────────────────────── */
  register({
    id: 'staggered-list', group: 'Content', name: 'Staggered List',
    blurb: 'Rows fly in one after another from the chosen side, each offset by a small delay. The cascade. For a feed or list revealing after the page lands.',
    controls: [
      { key: 'from', label: 'Fly in from', type: 'select', options: ['right', 'left', 'below'], def: 'right' },
      { key: 'items', label: 'Rows', type: 'range', min: 3, max: 8, step: 1, def: 6, unit: '' },
      { key: 'stagger', label: 'Stagger / row', type: 'range', min: 20, max: 160, step: 5, def: 60, unit: 'ms' },
      { key: 'duration', label: 'Row duration', type: 'range', min: 150, max: 900, step: 10, def: 380, unit: 'ms' },
      { key: 'distance', label: 'Travel', type: 'range', min: 10, max: 240, step: 5, def: 80, unit: 'px' },
      easeCtl(),
      { key: 'fade', label: 'Fade', type: 'toggle', def: true },
    ],
    mount(root, v) {
      root.style.background = '#0e1118';
      const list = h(`<div style="position:absolute;inset:0;display:flex;flex-direction:column;gap:10px;padding:28px"></div>`);
      root.appendChild(list);
      const off = () => v.from === 'below' ? `translateY(${v.distance}px)` : `translateX(${v.from === 'left' ? -v.distance : v.distance}px)`;
      const rows = Array.from({ length: v.items }, (_, i) => { const r = h(`<div style="${ROW}">Row ${i + 1}</div>`); r.style.transform = off(); r.style.opacity = v.fade ? 0 : 1; list.appendChild(r); return r; });
      return {
        play(dir) {
          const fwd = dir === 1, f0 = v.fade ? 0 : 1;
          return finished(rows.map((r, i) => r.animate(
            fwd ? { transform: [off(), 'none'], opacity: [f0, 1] } : { transform: ['none', off()], opacity: [1, f0] },
            { duration: v.duration, delay: i * v.stagger, easing: EASINGS[v.easing], fill: 'forwards' })));
        },
      };
    },
    snippets: {
      'framer-motion': v => {
        const axis = v.from === 'below' ? 'y' : 'x', sign = v.from === 'left' ? '-' : '';
        return `// Parent orchestrates; children only declare their own in/out.
const list = { show: { transition: { staggerChildren: ${sec(v.stagger)} } }, hide: { transition: { staggerChildren: ${sec(v.stagger)}, staggerDirection: 1 } } };
const row  = {
  hide: { ${axis}: ${sign}${v.distance}, opacity: ${v.fade ? 0 : 1} },
  show: { ${axis}: 0, opacity: 1, transition: { duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} } },
};

<motion.ul variants={list} initial="hide" animate="show">
  {rows.map(r => <motion.li key={r.id} variants={row}>{r.title}</motion.li>)}
</motion.ul>

// NOTE: if rows also carry a layoutId for a detail morph, gate the layoutId
// off during page transitions — layoutId + an animating ancestor conflict.`;
      },
      'CSS / WAAPI': v => {
        const from = v.from === 'below' ? `translateY(${v.distance}px)` : `translateX(${v.from === 'left' ? '-' : ''}${v.distance}px)`;
        return `rows.forEach((row, i) => row.animate(
  { transform: ["${from}", "none"]${v.fade ? ', opacity: [0, 1]' : ''} },
  { duration: ${v.duration}, delay: i * ${v.stagger}, easing: "${EASINGS[v.easing]}", fill: "forwards" }
));

/* CSS-only version (set --i per row inline):
.row { animation: fly ${v.duration}ms ${EASINGS[v.easing]} both; animation-delay: calc(var(--i) * ${v.stagger}ms); }
@keyframes fly { from { transform: ${from};${v.fade ? ' opacity: 0;' : ''} } }  */`;
      },
      'GSAP': v => `gsap.from(".row", {
  ${v.from === 'below' ? 'y' : 'x'}: ${v.from === 'left' ? '-' : ''}${v.distance}${v.fade ? ', autoAlpha: 0' : ''},
  duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}",
  stagger: ${sec(v.stagger)},
});`,
    },
  });

  /* 2 ── Card Morph (shared element) ────────────────────────────────────── */
  register({
    id: 'card-morph', group: 'Content', name: 'Card Morph',
    blurb: 'A list card expands into the detail page\'s header: same element, size and position interpolate. The list backdrop fades out; detail content cascades in beneath. The list → detail transition.',
    controls: [
      { key: 'duration', label: 'Morph duration', type: 'range', min: 200, max: 1000, step: 10, def: 480, unit: 'ms' },
      easeCtl(),
      { key: 'stagger', label: 'Content stagger', type: 'range', min: 0, max: 140, step: 5, def: 55, unit: 'ms' },
      { key: 'lift', label: 'Header shadow', type: 'toggle', def: true },
    ],
    mount(root, v) {
      root.style.background = '#0e1118';
      const S = { left: '7%', top: '206px', width: '54%', height: '48px', borderRadius: '10px' };
      const T = { left: '5%', top: '20px', width: '90%', height: '92px', borderRadius: '14px' };
      const sh = v.lift ? '0 10px 30px rgba(0,0,0,.45)' : '0 2px 8px rgba(0,0,0,.3)';
      root.append(
        h(`<div id="bd" style="position:absolute;inset:0;padding:18px;display:flex;flex-direction:column;gap:8px">${[0,1,2,3,4,5].map(() => `<div style="height:40px;border-radius:8px;background:#161a22;border:1px solid #232838"></div>`).join('')}</div>`),
        h(`<div id="ct" style="position:absolute;left:5%;right:5%;top:132px;display:flex;flex-direction:column;gap:10px">${[0,1,2].map(() => `<div class="dRow" style="height:30px;border-radius:8px;background:#161a22;border:1px solid #232838;opacity:0"></div>`).join('')}</div>`),
        h(`<div id="card" style="position:absolute;left:${S.left};top:${S.top};width:${S.width};height:${S.height};border-radius:${S.borderRadius};background:linear-gradient(135deg,#1e3f66,#0f2540);border:1px solid #2a3550;color:#dce6f5;display:flex;align-items:center;gap:12px;padding:0 16px;box-shadow:${sh};overflow:hidden">
          <div id="av" style="width:28px;height:28px;border-radius:50%;background:#3b6ea5;flex:none"></div>
          <div><div id="nm" style="font-weight:700;font-size:13px;line-height:1.1">Jane Cooper</div><div style="font-size:11px;opacity:.7;margin-top:2px">#014 · Designer · Boston</div></div></div>`));
      const card = root.querySelector('#card'), av = root.querySelector('#av'), nm = root.querySelector('#nm'), bd = root.querySelector('#bd'), rows = [...root.querySelectorAll('.dRow')];
      let open = false;
      return {
        play(dir) {
          const fwd = dir === 1;
          if (fwd === open) { Object.assign(card.style, fwd ? S : T); av.style.width = av.style.height = (fwd ? 28 : 46) + 'px'; nm.style.fontSize = (fwd ? 13 : 19) + 'px'; bd.style.opacity = fwd ? 1 : 0; rows.forEach(r => r.style.opacity = fwd ? 0 : 1); }
          open = fwd;
          const o = { duration: v.duration, easing: EASINGS[v.easing], fill: 'forwards' };
          const anims = [
            card.animate([fwd ? S : T, fwd ? T : S], o),
            av.animate([{ width: (fwd ? 28 : 46) + 'px', height: (fwd ? 28 : 46) + 'px' }, { width: (fwd ? 46 : 28) + 'px', height: (fwd ? 46 : 28) + 'px' }], o),
            nm.animate([{ fontSize: (fwd ? 13 : 19) + 'px' }, { fontSize: (fwd ? 19 : 13) + 'px' }], o),
            bd.animate([{ opacity: fwd ? 1 : 0 }, { opacity: fwd ? 0 : 1 }], { ...o, duration: v.duration * .5 }),
            ...rows.map((r, i) => r.animate([{ opacity: fwd ? 0 : 1, transform: fwd ? 'translateY(8px)' : 'none' }, { opacity: fwd ? 1 : 0, transform: fwd ? 'none' : 'translateY(8px)' }],
              { ...o, duration: v.duration * .55, delay: fwd ? v.duration * .4 + i * v.stagger : i * v.stagger })),
          ];
          return finished(anims);
        },
      };
    },
    snippets: {
      'framer-motion': v => `// SHARED ELEMENT MORPH — list card ⇄ detail header. Same layoutId on both;
// framer-motion interpolates size + position (FLIP under the hood).

// List row:
<motion.div layoutId={\`item-\${p.id}-card\`} />

// Detail header:
<motion.div layoutId={\`item-\${p.id}-card\`} transition={{ duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} }} />

// Detail content cascades in after the morph is ~40% done:
{sections.map((s, i) => (
  <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: ${sec(v.duration * .55)}, delay: ${sec(v.duration * .4)} + i * ${sec(v.stagger)} }} />
))}

// CRITICAL: layoutId must be ON for the morph but OFF during a page slide.
// Drive it from context — layoutId + an ancestor mid-transform de-syncs.`,
      'CSS / WAAPI': v => `// FLIP by hand: measure the card in the list, measure it in the detail, play the inverse.
const first = card.getBoundingClientRect();        // in the list
// …swap DOM / class so the card is now the detail header…
const last  = card.getBoundingClientRect();
const dx = first.left - last.left, dy = first.top - last.top;
const sx = first.width / last.width, sy = first.height / last.height;

card.animate(
  [{ transformOrigin: "0 0", transform: \`translate(\${dx}px, \${dy}px) scale(\${sx}, \${sy})\` },
   { transformOrigin: "0 0", transform: "none" }],
  { duration: ${v.duration}, easing: "${EASINGS[v.easing]}" }
);
detailRows.forEach((r, i) => r.animate({ opacity: [0, 1], transform: ["translateY(8px)", "none"] },
  { duration: ${Math.round(v.duration * .55)}, delay: ${Math.round(v.duration * .4)} + i * ${v.stagger}, easing: "${EASINGS[v.easing]}", fill: "forwards" }));`,
      'GSAP': v => `// Flip plugin (gsap.registerPlugin(Flip)) — the same measure/swap/invert, automated.
const state = Flip.getState(".card");
card.classList.toggle("is-header");               // change the layout
Flip.from(state, { duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}", absolute: true });
gsap.from(".detail-row", { autoAlpha: 0, y: 8, duration: ${sec(v.duration * .55)}, stagger: ${sec(v.stagger)}, delay: ${sec(v.duration * .4)} });`,
    },
  });

  /* 3 ── Accordion Expand ───────────────────────────────────────────────── */
  register({
    id: 'accordion-expand', group: 'Content', name: 'Accordion Expand',
    blurb: 'A row grows to reveal its body; siblings slide down to make room. Height is measured, never guessed, and the content fades in slightly after the edge starts moving so it never looks clipped.',
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 150, max: 800, step: 10, def: 360, unit: 'ms' },
      { key: 'lag', label: 'Content lag', type: 'range', min: 0, max: 60, step: 5, def: 25, unit: '%' },
      { key: 'chevron', label: 'Chevron rotate', type: 'toggle', def: true },
      easeCtl('ease-out-quint'),
    ],
    mount(root, v) {
      root.style.background = '#0e1118';
      const wrap = h(`<div style="position:absolute;inset:0;padding:24px 28px;display:flex;flex-direction:column;gap:8px"></div>`);
      const mk = (t, body) => h(`<div style="border:1px solid #232838;border-radius:10px;background:#161a22;overflow:hidden">
        <div class="hd" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;font-size:13px;font-weight:600;color:#dce6f5;cursor:pointer">${t}<span class="chev" style="display:inline-block;color:#8b93a1;transition:transform ${v.duration}ms ${EASINGS[v.easing]}">⌄</span></div>
        <div class="body" style="height:0;overflow:hidden"><div class="inner" style="padding:0 14px 14px;font-size:12.5px;line-height:1.55;color:#aab3c2;opacity:0">${body}</div></div></div>`);
      const items = [
        mk('Shipping & returns', 'Free shipping on orders over $50. Returns accepted within 30 days in original condition. Refunds post within 5 business days.'),
        mk('Materials', 'Full-grain leather, solid brass hardware, waxed cotton thread.'),
        mk('Care', 'Wipe with a dry cloth. Condition twice a year.'),
      ];
      wrap.append(...items); root.appendChild(wrap);
      const target = items[0], body = target.querySelector('.body'), inner = target.querySelector('.inner'), chev = target.querySelector('.chev');
      let open = false;
      const run = (fwd) => {
        open = fwd;
        const hgt = inner.scrollHeight;
        const o = { duration: v.duration, easing: EASINGS[v.easing], fill: 'forwards' };
        if (v.chevron) chev.style.transform = fwd ? 'rotate(180deg)' : 'none';
        const lag = v.duration * v.lag / 100;
        return finished([
          body.animate({ height: fwd ? ['0px', hgt + 'px'] : [hgt + 'px', '0px'] }, o),
          inner.animate({ opacity: fwd ? [0, 1] : [1, 0], transform: fwd ? ['translateY(-6px)', 'none'] : ['none', 'translateY(-6px)'] }, { ...o, duration: Math.max(80, v.duration - lag), delay: fwd ? lag : 0 }),
        ]);
      };
      target.querySelector('.hd').onclick = () => run(!open);
      return { play(dir) { const fwd = dir === 1; if (fwd === open) { body.style.height = fwd ? '0px' : inner.scrollHeight + 'px'; inner.style.opacity = fwd ? 0 : 1; } return run(fwd); } };
    },
    snippets: {
      'framer-motion': v => `// height:"auto" is the whole trick — framer-motion measures it for you.
<motion.div initial={false} animate={{ height: open ? "auto" : 0 }}
  transition={{ duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} }}
  style={{ overflow: "hidden" }}>
  <motion.div animate={{ opacity: open ? 1 : 0, y: open ? 0 : -6 }}
    transition={{ duration: ${sec(v.duration - v.duration * v.lag / 100)}, delay: open ? ${sec(v.duration * v.lag / 100)} : 0 }}>
    {body}
  </motion.div>
</motion.div>
${v.chevron ? `<motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: ${sec(v.duration)} }}>⌄</motion.span>` : ''}`,
      'CSS / WAAPI': v => `// Measure, then animate the measured px — "height: auto" can't be tweened by CSS.
const target = open ? inner.scrollHeight : 0;
body.animate({ height: [body.offsetHeight + "px", target + "px"] },
  { duration: ${v.duration}, easing: "${EASINGS[v.easing]}", fill: "forwards" });
inner.animate({ opacity: open ? [0, 1] : [1, 0], transform: open ? ["translateY(-6px)", "none"] : ["none", "translateY(-6px)"] },
  { duration: ${Math.round(v.duration - v.duration * v.lag / 100)}, delay: open ? ${Math.round(v.duration * v.lag / 100)} : 0, easing: "${EASINGS[v.easing]}", fill: "forwards" });

/* Modern CSS-only alternative (Chrome 129+): */
.body { height: 0; overflow: hidden; transition: height ${v.duration}ms ${EASINGS[v.easing]}; interpolate-size: allow-keywords; }
.is-open .body { height: auto; }`,
      'GSAP': v => `gsap.to(body, { height: open ? "auto" : 0, duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}" });  // GSAP tweens "auto"
gsap.to(inner, { autoAlpha: open ? 1 : 0, y: open ? 0 : -6, duration: ${sec(v.duration - v.duration * v.lag / 100)}, delay: open ? ${sec(v.duration * v.lag / 100)} : 0 });${v.chevron ? `\ngsap.to(chevron, { rotation: open ? 180 : 0, duration: ${sec(v.duration)} });` : ''}`,
    },
  });

  /* 4 ── Skeleton → Content ─────────────────────────────────────────────── */
  register({
    id: 'skeleton-to-content', group: 'Content', name: 'Skeleton → Content',
    blurb: 'A shimmering placeholder holds the layout while data loads, then crossfades into real content row by row. Layout never jumps because the skeleton already has the final shape.',
    controls: [
      { key: 'shimmer', label: 'Shimmer period', type: 'range', min: 600, max: 2400, step: 50, def: 1400, unit: 'ms' },
      { key: 'duration', label: 'Swap duration', type: 'range', min: 150, max: 800, step: 10, def: 320, unit: 'ms' },
      { key: 'stagger', label: 'Row stagger', type: 'range', min: 0, max: 120, step: 5, def: 45, unit: 'ms' },
      { key: 'lift', label: 'Content lift', type: 'range', min: 0, max: 16, step: 1, def: 6, unit: 'px' },
    ],
    mount(root, v) {
      root.style.background = '#0e1118';
      const wrap = h(`<div style="position:absolute;inset:0;padding:24px 28px;display:flex;flex-direction:column;gap:14px"></div>`);
      const data = [['Jane Cooper', 'Designer · Boston'], ['Wade Warren', 'Engineer · Austin'], ['Esther Howard', 'PM · Chicago'], ['Cameron Wills', 'Researcher · Denver']];
      const rows = data.map(([n, s]) => h(`<div style="position:relative;height:44px">
        <div class="sk" style="position:absolute;inset:0;display:flex;gap:12px;align-items:center">
          <div class="sh" style="width:40px;height:40px;border-radius:50%"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:7px"><div class="sh" style="height:12px;width:45%;border-radius:6px"></div><div class="sh" style="height:10px;width:30%;border-radius:5px"></div></div></div>
        <div class="re" style="position:absolute;inset:0;display:flex;gap:12px;align-items:center;opacity:0">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#3b6ea5,#1e3f66)"></div>
          <div><div style="font-size:13px;font-weight:700;color:#dce6f5">${n}</div><div style="font-size:11.5px;color:#8b93a1;margin-top:3px">${s}</div></div></div></div>`));
      wrap.append(...rows); root.appendChild(wrap);
      const style = h(`<style>.sh{background:linear-gradient(90deg,#1b2029 25%,#28303d 50%,#1b2029 75%);background-size:200% 100%;animation:shim ${v.shimmer}ms linear infinite}@keyframes shim{from{background-position:200% 0}to{background-position:-200% 0}}</style>`);
      root.appendChild(style);
      let loaded = false;
      return {
        play(dir) {
          const fwd = dir === 1;
          loaded = fwd;
          const o = { duration: v.duration, easing: EASINGS['ease-out-quint'], fill: 'forwards' };
          return finished(rows.flatMap((r, i) => [
            r.querySelector('.sk').animate({ opacity: fwd ? [1, 0] : [0, 1] }, { ...o, delay: i * v.stagger }),
            r.querySelector('.re').animate({ opacity: fwd ? [0, 1] : [1, 0], transform: fwd ? [`translateY(${v.lift}px)`, 'none'] : ['none', `translateY(${v.lift}px)`] }, { ...o, delay: i * v.stagger }),
          ]));
        },
      };
    },
    snippets: {
      'framer-motion': v => `// Render BOTH layers in the same grid cell so the swap never reflows.
{rows.map((r, i) => (
  <div key={r.id} className="cell">   {/* position: relative; fixed height */}
    <AnimatePresence>
      {!loaded && <motion.div className="skeleton shimmer" exit={{ opacity: 0 }} transition={{ duration: ${sec(v.duration)}, delay: i * ${sec(v.stagger)} }} />}
    </AnimatePresence>
    {loaded && (
      <motion.div initial={{ opacity: 0, y: ${v.lift} }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ${sec(v.duration)}, delay: i * ${sec(v.stagger)}, ease: [0.16, 1, 0.3, 1] }}>
        {r.content}
      </motion.div>
    )}
  </div>
))}

/* CSS for the shimmer: */
.shimmer { background: linear-gradient(90deg, #1b2029 25%, #28303d 50%, #1b2029 75%);
           background-size: 200% 100%; animation: shim ${v.shimmer}ms linear infinite; }
@keyframes shim { from { background-position: 200% 0 } to { background-position: -200% 0 } }`,
      'CSS / WAAPI': v => `.shimmer { background: linear-gradient(90deg, #1b2029 25%, #28303d 50%, #1b2029 75%);
           background-size: 200% 100%; animation: shim ${v.shimmer}ms linear infinite; }
@keyframes shim { from { background-position: 200% 0 } to { background-position: -200% 0 } }

/* On data arrival: */
cells.forEach((cell, i) => {
  const o = { duration: ${v.duration}, delay: i * ${v.stagger}, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" };
  cell.querySelector(".skeleton").animate({ opacity: [1, 0] }, o);
  cell.querySelector(".content").animate({ opacity: [0, 1], transform: ["translateY(${v.lift}px)", "none"] }, o);
});`,
      'GSAP': v => `gsap.to(".skeleton", { autoAlpha: 0, duration: ${sec(v.duration)}, stagger: ${sec(v.stagger)} });
gsap.from(".content", { autoAlpha: 0, y: ${v.lift}, duration: ${sec(v.duration)}, stagger: ${sec(v.stagger)}, ease: "power4.out" });`,
    },
  });

  /* 5 ── FLIP Reorder ───────────────────────────────────────────────────── */
  register({
    id: 'flip-reorder', group: 'Content', name: 'FLIP Reorder',
    blurb: 'Items shuffle to new positions and glide there instead of teleporting. First, Last, Invert, Play: measure before, change the DOM, measure after, animate the difference. Sorting, filtering, drag-reorder.',
    reversible: false,
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 200, max: 1200, step: 10, def: 520, unit: 'ms' },
      { key: 'stagger', label: 'Stagger', type: 'range', min: 0, max: 60, step: 5, def: 15, unit: 'ms' },
      easeCtl('ease-out-expo'),
      { key: 'scale', label: 'Squash while moving', type: 'toggle', def: true },
    ],
    mount(root, v) {
      root.style.background = '#0e1118';
      const grid = h(`<div style="position:absolute;inset:0;padding:24px 28px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;align-content:start"></div>`);
      const cols = ['#c2410c', '#1e3f66', '#3b6ea5', '#7c2d12', '#2d6a4f', '#5b3a8a', '#8a5b3a', '#3a7c8a'];
      const tiles = cols.map((c, i) => h(`<div style="height:58px;border-radius:10px;background:${c};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px">${i + 1}</div>`));
      grid.append(...tiles); root.appendChild(grid);
      return {
        play() {
          const first = new Map(tiles.map(t => [t, t.getBoundingClientRect()]));
          const order = [...tiles].sort(() => Math.random() - 0.5);
          grid.append(...order);
          return finished(order.map((t, i) => {
            const f = first.get(t), l = t.getBoundingClientRect();
            const dx = f.left - l.left, dy = f.top - l.top;
            const mid = v.scale ? `translate(${dx / 2}px, ${dy / 2}px) scale(.94)` : `translate(${dx / 2}px, ${dy / 2}px)`;
            return t.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: mid, offset: .5 }, { transform: 'none' }],
              { duration: v.duration, delay: i * v.stagger, easing: EASINGS[v.easing] });
          }));
        },
      };
    },
    snippets: {
      'framer-motion': v => `// The "layout" prop is FLIP built in: change the array order, items glide.
<motion.ul layout>
  {items.map(item => (
    <motion.li key={item.id} layout
      transition={{ layout: { duration: ${sec(v.duration)}, ease: ${easeArr(v.easing)} } }}${v.scale ? `
      // optional squash while in flight:
      animate={{ scale: 1 }} whileLayout={{ scale: 0.94 }}` : ''} />
  ))}
</motion.ul>
// Drag-to-reorder: <Reorder.Group values={items} onReorder={setItems}> / <Reorder.Item value={item}>`,
      'CSS / WAAPI': v => `function flip(container, mutate) {
  const kids = [...container.children];
  const first = new Map(kids.map(el => [el, el.getBoundingClientRect()]));   // F
  mutate();                                                                  // change the DOM
  kids.forEach((el, i) => {
    const f = first.get(el), l = el.getBoundingClientRect();                 // L
    const dx = f.left - l.left, dy = f.top - l.top;
    if (!dx && !dy) return;
    el.animate([                                                             // I + P
      { transform: \`translate(\${dx}px, \${dy}px)\` },${v.scale ? `
      { transform: \`translate(\${dx / 2}px, \${dy / 2}px) scale(.94)\`, offset: .5 },` : ''}
      { transform: "none" },
    ], { duration: ${v.duration}, delay: i * ${v.stagger}, easing: "${EASINGS[v.easing]}" });
  });
}
flip(grid, () => grid.append(...sorted));`,
      'GSAP': v => `gsap.registerPlugin(Flip);
const state = Flip.getState(".tile");
grid.append(...sorted);                          // any DOM/layout change
Flip.from(state, { duration: ${sec(v.duration)}, ease: "${gsapEase(v.easing)}", stagger: ${sec(v.stagger)}${v.scale ? ', scale: true' : ''} });`,
    },
  });

  /* 6 ── View Transition (list ⇄ grid) ──────────────────────────────────── */
  register({
    id: 'view-transition', group: 'Content', name: 'View Transition',
    blurb: 'The browser\'s own cross-fade-and-morph: snapshot the old DOM, change it, and every element with a view-transition-name glides to its new place. Zero animation code for layout changes. Falls back to FLIP where unsupported.',
    notes: `<p>Same-document <code>document.startViewTransition()</code>. Each named element gets its own old/new snapshot pair; the browser animates <code>::view-transition-group(name)</code> between them. Cross-document (MPA) works too via <code>@view-transition { navigation: auto }</code>, which is how the Shop demo in Motion Demos carries icons across real page loads.</p>`,
    controls: [
      { key: 'duration', label: 'Duration', type: 'range', min: 150, max: 1000, step: 10, def: 420, unit: 'ms' },
      easeCtl('ease-out-quint'),
    ],
    mount(root, v) {
      root.style.background = '#0e1118';
      const supported = 'startViewTransition' in document;
      const wrap = h(`<div style="position:absolute;inset:0;padding:22px 28px;display:flex;flex-direction:column;gap:10px"></div>`);
      const cols = ['#c2410c', '#1e3f66', '#3b6ea5', '#7c2d12', '#2d6a4f', '#5b3a8a'];
      const items = cols.map((c, i) => h(`<div style="display:flex;align-items:center;gap:12px;background:#161a22;border:1px solid #232838;border-radius:10px;padding:8px;view-transition-name:vt-${i}"><div style="width:40px;height:40px;border-radius:8px;background:${c};flex:none"></div><div style="font-size:13px;color:#dce6f5;font-weight:600">Item ${i + 1}</div></div>`));
      wrap.append(...items); root.appendChild(wrap);
      const style = h(`<style>::view-transition-group(*){animation-duration:${v.duration}ms;animation-timing-function:${EASINGS[v.easing]}}</style>`);
      document.head.appendChild(style);
      if (!supported) root.appendChild(h(`<div style="position:absolute;right:12px;bottom:10px;font-size:11px;color:#8b93a1">no View Transitions here — FLIP fallback</div>`));
      let grid = false;
      const setLayout = (g) => {
        wrap.style.flexDirection = g ? 'row' : 'column'; wrap.style.flexWrap = g ? 'wrap' : 'nowrap';
        items.forEach(it => { it.style.flexDirection = g ? 'column' : 'row'; it.style.width = g ? 'calc(33.33% - 7px)' : 'auto'; it.style.alignItems = g ? 'flex-start' : 'center'; it.firstElementChild.style.width = g ? '100%' : '40px'; it.firstElementChild.style.height = g ? '54px' : '40px'; });
      };
      return {
        play(dir) {
          const fwd = dir === 1; if (fwd === grid) setLayout(!fwd);
          grid = fwd;
          if (supported) { const t = document.startViewTransition(() => setLayout(fwd)); return t.finished.catch(() => {}); }
          const first = new Map(items.map(t => [t, t.getBoundingClientRect()])); setLayout(fwd);
          return finished(items.map(t => { const f = first.get(t), l = t.getBoundingClientRect(); return t.animate([{ transform: `translate(${f.left - l.left}px,${f.top - l.top}px) scale(${f.width / l.width},${f.height / l.height})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: v.duration, easing: EASINGS[v.easing] }); }));
        },
        destroy() { style.remove(); },
      };
    },
    snippets: {
      'CSS / WAAPI': v => `/* 1. Name the elements that should morph (unique per element): */
.item { view-transition-name: var(--vt); }      /* style={{ "--vt": \`item-\${id}\` }} */

/* 2. Tune the browser's default group animation: */
::view-transition-group(*) { animation-duration: ${v.duration}ms; animation-timing-function: ${EASINGS[v.easing]}; }

/* 3. Wrap the DOM change: */
function toggleLayout() {
  if (!document.startViewTransition) return applyLayout();        // graceful fallback
  document.startViewTransition(() => applyLayout());
}

/* Cross-document (real navigations, no JS): */
@view-transition { navigation: auto; }`,
      'framer-motion': v => `// React: wrap the state change so the DOM mutation happens inside the transition.
import { flushSync } from "react-dom";

function toggleLayout() {
  if (!document.startViewTransition) return setGrid(g => !g);
  document.startViewTransition(() => { flushSync(() => setGrid(g => !g)); });
}

// CSS (global):
// .item { view-transition-name: var(--vt); }
// ::view-transition-group(*) { animation-duration: ${v.duration}ms; animation-timing-function: ${EASINGS[v.easing]}; }
//
// Or skip the API and use framer-motion's layout prop (see FLIP Reorder) — same effect, works everywhere.`,
    },
  });
})();
