/* ── Mood swipe + Logo splash families ─────────────────────────────────────
   Two families designed for a wellness app's cold start and page changes:
   MOOD SWIPE — the whole page changes mood in one move (ground, ink, accent,
   hero, shapes, copy), 12 takes on how the swap travels. LOGO SPLASH — the
   logomark arriving before any UI exists: blob-in, polygon morphs, liquid
   splashes, hand-drawn-style comets, the three-flip pool, and true
   frame-by-frame drawings. All entries share small rAF engines defined here.
   Written against the single-file playground API (rest/apply/snippet) and
   adapted to register() at the bottom of this file. ─────────────────────── */
(() => {
  const EASINGS = {
    ...Playground.EASINGS,
    "ease-out-back":    "cubic-bezier(0.34, 1.56, 0.64, 1)",
    "ease-in-out-circ": "cubic-bezier(0.85, 0, 0.15, 1)",
  };

  const MOODS = [
    { key: "dawn", eyebrow: "MORNING", h: "Ease into the day", p: "Three slow breaths before the inbox.", cta: "Begin",
      ground: "#f3e9d8", ink: "#2a1f3d", accent: "#c2410c", s1: "#f7c59f", s2: "#e8a87c", hero: ["#f59e0b", "#c2410c"],
      shapes: [{ cx: 1.0, cy: 0.08, r: 130 }, { cx: 0.02, cy: 0.95, r: 90 }] },
    { key: "dusk", eyebrow: "EVENING", h: "Let the day go", p: "A five-minute wind-down, lights low.", cta: "Unwind",
      ground: "#2a1f3d", ink: "#f3e9d8", accent: "#f59e0b", s1: "#5b3f8a", s2: "#8b5cf6", hero: ["#8b5cf6", "#312e81"],
      shapes: [{ cx: 0.08, cy: 0.12, r: 100 }, { cx: 0.92, cy: 0.9, r: 150 }] },
    { key: "noon", eyebrow: "MIDDAY", h: "Find your footing", p: "A two-minute reset between meetings.", cta: "Reset",
      ground: "#e9eef6", ink: "#1f2a44", accent: "#1d4ed8", s1: "#c7d7f4", s2: "#9db9ec", hero: ["#60a5fa", "#1d4ed8"],
      shapes: [{ cx: 0.9, cy: 0.0, r: 110 }, { cx: 0.15, cy: 1.0, r: 120 }] },
  ];
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(",")})`; };
  // Palette of mood `to`, blended only `shift`% of the way from `from` (100 = full swap, 25 = a tint).
  function palette(from, to, shift) {
    const t = shift / 100, o = {};
    for (const k of ["ground", "ink", "accent", "s1", "s2"]) o[k] = mix(from[k], to[k], t);
    o.hero = [mix(from.hero[0], to.hero[0], t), mix(from.hero[1], to.hero[1], t)];
    return { ...to, ...o };
  }
  function moodPage(pal, { id = "pg", ground = pal.ground, heroStyle = "" } = {}) {
    return `<div id="${id}" class="mp" style="position:absolute;inset:0;background:${ground};color:${pal.ink};overflow:hidden;will-change:transform,opacity,background-color;">
      ${pal.shapes.map((q, i) => `<div class="sh${i + 1}" style="position:absolute;width:${q.r * 2}px;height:${q.r * 2}px;border-radius:50%;background:${pal[i ? "s2" : "s1"]};left:calc(${q.cx * 100}% - ${q.r}px);top:calc(${q.cy * 100}% - ${q.r}px);opacity:${i ? ".8" : ".9"};will-change:transform;"></div>`).join("")}
      <div class="hero" style="position:absolute;left:24px;top:24px;width:150px;height:96px;border-radius:16px;background:linear-gradient(135deg,${pal.hero[0]},${pal.hero[1]});box-shadow:0 10px 30px rgba(0,0,0,.18);will-change:transform,opacity;${heroStyle}"></div>
      <div class="txt" style="position:absolute;left:24px;right:24px;top:136px;display:flex;flex-direction:column;gap:8px;">
        <div class="eyebrow" style="font-size:11px;letter-spacing:.16em;font-weight:700;color:${pal.accent};">${pal.eyebrow}</div>
        <div class="h" style="font-size:26px;font-weight:800;line-height:1.05;">${pal.h}</div>
        <div class="p" style="font-size:13px;opacity:.72;max-width:300px;">${pal.p}</div>
        <div class="cta" style="margin-top:6px;align-self:flex-start;background:${pal.accent};color:${pal.ground};border-radius:999px;padding:8px 16px;font-size:12px;font-weight:700;">${pal.cta}</div>
      </div>
    </div>`;
  }
  const MOOD_CONTROLS = (over = {}) => [
    { key: "duration", label: "Duration",      type: "range",  min: 200, max: 1400, step: 10, def: 600, unit: "ms" },
    { key: "inFrac",   label: "In speed (% of duration)", type: "range", min: 30, max: 100, step: 5, def: 60, unit: "%" },
    { key: "inEase",   label: "In easing",     type: "select", options: Object.keys(EASINGS), def: "ease-out-quint" },
    { key: "outEase",  label: "Out easing",    type: "select", options: Object.keys(EASINGS), def: "ease-in-out" },
    { key: "shift",    label: "Colour shift",  type: "range",  min: 0, max: 100, step: 5, def: 100, unit: "%" },
    { key: "travel",   label: "Travel",        type: "range",  min: 0, max: 80, step: 2, def: 24, unit: "px" },
    { key: "stagger",  label: "Stagger",       type: "range",  min: 0, max: 120, step: 5, def: 40, unit: "ms" },
  ].map((c) => ({ ...c, ...(over[c.key] || {}) }));

  // Stagger the text column in (y: travel → 0) or out (0 → -travel).
  function cascadeIn(page, c, delay = 0) {
    page.querySelectorAll(".txt > *").forEach((el, i) =>
      el.animate({ transform: [`translateY(${c.v.travel}px)`, "translateY(0)"], opacity: [0, 1] },
        { duration: c.tIn, delay: delay + i * c.v.stagger, easing: c.inE, fill: "both" }));
  }
  function cascadeOut(page, c) {
    page.querySelectorAll(".txt > *").forEach((el, i) =>
      el.animate({ transform: ["translateY(0)", `translateY(${-c.v.travel}px)`], opacity: [1, 0] },
        { duration: c.tOut, delay: i * c.v.stagger * 0.5, easing: c.outE, fill: "both" }));
  }
  const stageSize = (B) => ({ W: B.clientWidth, H: B.clientHeight });
  const SH = { sh1: "s1", sh2: "s2" }; // shape class → palette key

  function moodEntry(cfg) {
    const priv = Object.fromEntries(Object.entries(cfg).filter(([k]) => k.startsWith("_")));
    return {
      ...priv,
      id: cfg.id, name: cfg.name, blurb: cfg.blurb,
      controls: MOOD_CONTROLS(cfg.defaults || {}).concat(cfg.extra || []),
      rest(A, B, v, dir) {
        A.style.display = "none";
        B.style.cssText += ";background:#0a0c10;";
        const pair = cfg.pair || [0, 1], cur = dir === -1 ? pair[1] : pair[0], nxt = dir === -1 ? pair[0] : pair[1];
        this._from = MOODS[cur];
        this._to = palette(MOODS[cur], MOODS[nxt], v.shift);
        B.innerHTML = moodPage(this._from);
        if (this._unbind) { this._unbind(); this._unbind = null; }
        if (cfg.rest) cfg.rest.call(this, B, v, dir);
      },
      apply(A, B, dir, v) {
        const c = { dir, v, from: this._from, to: this._to, tIn: v.duration * v.inFrac / 100, tOut: v.duration,
                    inE: EASINGS[v.inEase], outE: EASINGS[v.outEase] };
        cfg.apply.call(this, B, c);
      },
      snippet(v) { return moodSnippet(v, cfg); },
    };
  }

  function moodSnippet(v, cfg) {
    const e = (k) => EASINGS[k].replace("cubic-bezier(", "[").replace(/\)$/, "]");
    const tOut = (v.duration / 1000).toFixed(2), tIn = (v.duration * v.inFrac / 100000).toFixed(2);
    return (
  `// Mood tokens per screen — the whole palette swaps as ONE tween.
  const MOODS = {
    dawn: { ground: "#f3e9d8", ink: "#2a1f3d", accent: "#c2410c" },
    dusk: { ground: "#2a1f3d", ink: "#f3e9d8", accent: "#f59e0b" },
  };
  const m = MOODS[screen];              // shift ${v.shift}% → blend toward m in the app if < 100
  const IN  = { duration: ${tIn}, ease: ${e(v.inEase)} };   // fast in
  const OUT = { duration: ${tOut}, ease: ${e(v.outEase)} };   // slow out

  <motion.div className="page" animate={{ backgroundColor: m.ground, color: m.ink }} transition={OUT}>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={screen} variants={column} initial="out" animate="in" exit="out">
        {/* eyebrow / heading / body / cta — each a <motion.div variants={item}> */}
      </motion.div>
    </AnimatePresence>
  </motion.div>

  const column = { in: { transition: { staggerChildren: ${(v.stagger / 1000).toFixed(3)} } },
                   out: { transition: { staggerChildren: ${(v.stagger / 2000).toFixed(3)} } } };
  const item = { in:  { y: 0, opacity: 1, transition: IN },
                 out: { y: ${v.travel}, opacity: 0, transition: OUT } };
  ` + (cfg.snippetExtra ? "\n" + cfg.snippetExtra(v, { e, tIn, tOut }) : ""));
  }

  const MOOD_ENTRIES = [
    moodEntry({
      id: "mood-field", name: "Mood · Colour Field",
      blurb: "The big one: the ground colour cross-tweens across the whole page while the old content lifts away slowly and the new content cascades in fast. Hero and shapes recolour with it. Full-bleed mood change, no reveal shape.",
      apply(B, c) {
        const old = B.querySelector("#pg");
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2", ground: "transparent" }));
        const nu = B.querySelector("#pg2");
        old.animate({ backgroundColor: [c.from.ground, c.to.ground] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        old.querySelector(".hero").animate({ opacity: [1, 0], transform: ["translateY(0)", `translateY(${-c.v.travel}px)`] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        ["sh1", "sh2"].forEach((s, i) => old.querySelector("." + s).animate(
          { backgroundColor: [c.from[SH[s]], c.to[SH[s]]], transform: ["translate(0,0)", `translate(${(i ? 1 : -1) * c.v.travel}px, ${c.v.travel}px)`] },
          { duration: c.tOut, easing: c.outE, fill: "forwards" }));
        cascadeOut(old, c);
        nu.querySelectorAll(".sh1,.sh2").forEach((s) => s.style.display = "none");
        nu.querySelector(".hero").animate({ opacity: [0, 1], transform: [`translateY(${c.v.travel}px)`, "translateY(0)"] }, { duration: c.tIn, easing: c.inE, fill: "both" });
        cascadeIn(nu, c);
      },
    }),

    moodEntry({
      id: "mood-blob", name: "Mood · Blob Reveal",
      blurb: "Liquid-swipe reveal: the next mood pours in from an edge as a growing blob (clip-path) while the old page shrinks back and dims. Turn on Drag to scrub the reveal with the pointer — the touch-and-pull mechanic, optional.",
      defaults: { duration: { def: 700 }, inFrac: { def: 70 }, inEase: { def: "ease-in-out" } },
      extra: [
        { key: "edge", label: "Pour from", type: "select", options: ["right", "left", "bottom"], def: "right" },
        { key: "drag", label: "Drag to pull (touch-and-pull)", type: "toggle", def: false },
      ],
      _origin(edge, dir) {
        const e = dir === 1 ? edge : ({ right: "left", left: "right", bottom: "bottom" })[edge];
        return e === "right" ? "100% 50%" : e === "left" ? "0% 50%" : "50% 100%";
      },
      _reveal(B, c, startR = 0) {
        const { W, H } = stageSize(B), R = Math.hypot(W, H);
        const at = this._origin(c.v.edge, c.dir);
        const old = B.querySelector("#pg");
        let nu = B.querySelector("#pg2");
        if (!nu) { B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" })); nu = B.querySelector("#pg2"); }
        nu.animate({ clipPath: [`circle(${startR}px at ${at})`, `circle(${R}px at ${at})`] }, { duration: c.tOut, easing: c.inE, fill: "forwards" });
        old.animate({ transform: ["scale(1)", "scale(0.94)"], filter: ["brightness(1)", "brightness(0.6)"] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        nu.querySelector(".hero").animate({ transform: [`translateX(${c.v.travel}px)`, "translateX(0)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.25, easing: c.inE, fill: "both" });
        cascadeIn(nu, c, c.tOut * 0.3);
      },
      rest(B, v, dir) {
        if (!v.drag) return;
        const self = this;
        const onDown = (e) => {
          const { W, H } = stageSize(B);
          const c = { dir, v, from: self._from, to: self._to, tIn: v.duration * v.inFrac / 100, tOut: v.duration, inE: EASINGS[v.inEase], outE: EASINGS[v.outEase] };
          const at = self._origin(v.edge, dir);
          B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" }));
          const nu = B.querySelector("#pg2"), old = B.querySelector("#pg");
          const x0 = e.clientX, y0 = e.clientY; let r = 0;
          nu.style.clipPath = `circle(0px at ${at})`;
          const move = (ev) => { r = Math.hypot(ev.clientX - x0, ev.clientY - y0) * 1.6; nu.style.clipPath = `circle(${r}px at ${at})`;
            old.style.transform = `scale(${1 - Math.min(r / Math.hypot(W, H), 1) * 0.06})`; };
          const up = () => {
            window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
            if (r > W * 0.3) { self._reveal(B, { ...c, tOut: c.tOut * 0.6 }, r); }
            else { nu.animate({ clipPath: [`circle(${r}px at ${at})`, `circle(0px at ${at})`] }, { duration: 260, easing: EASINGS["ease-in-out"], fill: "forwards" }).onfinish = () => nu.remove();
                   old.animate({ transform: [old.style.transform, "scale(1)"] }, { duration: 260, fill: "forwards" }); }
          };
          window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
        };
        B.style.cursor = "grab";
        B.addEventListener("pointerdown", onDown);
        this._unbind = () => { B.removeEventListener("pointerdown", onDown); B.style.cursor = ""; };
      },
      apply(B, c) { this._reveal(B, c, 0); },
      snippetExtra: (v, { e, tOut }) =>
  `// The incoming page is clipped by a growing circle from the ${v.edge} edge:
  <motion.div key={screen} className="page page--incoming" style={{ position: "absolute", inset: 0 }}
    initial={{ clipPath: "circle(0px at ${v.edge === "right" ? "100% 50%" : v.edge === "left" ? "0% 50%" : "50% 100%"})" }}
    animate={{ clipPath: "circle(150% at ${v.edge === "right" ? "100% 50%" : v.edge === "left" ? "0% 50%" : "50% 100%"})" }}
    transition={{ duration: ${tOut}, ease: ${e(v.inEase)} }} />
  // Outgoing page underneath: animate={{ scale: 0.94, filter: "brightness(0.6)" }}
  ${v.drag ? "// Drag: use useMotionValue for the radius, map pointer distance → clipPath, animate() to full or 0 on release." : ""}`,
    }),

    moodEntry({
      id: "mood-hue", name: "Mood · Hue Drift",
      blurb: "The subtle one. Same layout, same lightness — the palette drifts in hue (warm tan → cool pale blue) rather than flipping light/dark, the hero crossfades and breathes 3%, the type recolours, the copy crossfades with a tiny lift. For tab switches that should feel like a change of light, not a change of room.",
      pair: [0, 2],
      defaults: { duration: { def: 900 }, inFrac: { def: 80 }, inEase: { def: "ease-in-out" }, travel: { def: 8 }, stagger: { def: 30 } },
      apply(B, c) {
        const old = B.querySelector("#pg");
        old.animate({ backgroundColor: [c.from.ground, c.to.ground] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        const hero = old.querySelector(".hero");
        hero.animate({ transform: ["scale(1)", "scale(1.03)", "scale(1)"] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        hero.insertAdjacentHTML("beforeend", `<div style="position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,${c.to.hero[0]},${c.to.hero[1]});opacity:0;"></div>`);
        hero.lastElementChild.animate({ opacity: [0, 1] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        ["sh1", "sh2"].forEach((s) => old.querySelector("." + s).animate(
          { backgroundColor: [c.from[SH[s]], c.to[SH[s]]], transform: ["scale(1)", "scale(1.06)"] }, { duration: c.tOut, easing: c.outE, fill: "forwards" }));
        // Copy crossfades in place: new text column on top of the old one.
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2", ground: "transparent" }));
        const nu = B.querySelector("#pg2");
        nu.querySelectorAll(".sh1,.sh2,.hero").forEach((s) => s.style.display = "none");
        cascadeOut(old, c);
        cascadeIn(nu, c, c.tOut * 0.15);
      },
      snippetExtra: (v, { e, tOut }) =>
  `// Hero: a change of light, not of room — crossfade the gradient and breathe.
  <motion.div className="hero" animate={{ background: \`linear-gradient(135deg, \${m.heroA}, \${m.heroB})\`, scale: [1, 1.03, 1] }}
    transition={{ duration: ${tOut}, ease: ${e(v.outEase)} }} />
  // Keep sibling moods at the SAME lightness (tan ↔ pale blue); blending light→dark in RGB passes through grey.`,
    }),

    moodEntry({
      id: "mood-shapes", name: "Mood · Shape Drift",
      blurb: "Each mood owns a shape layout. On the swipe the two background circles travel to the next mood's spots — squashing and stretching on the way like something soft being pushed — while they recolour and the ground tweens underneath. Hero and copy ride along with less parallax. 'Shape travel' scales the move from a nudge to a full re-composition.",
      defaults: { duration: { def: 950 }, inFrac: { def: 55 }, outEase: { def: "ease-in-out-circ" }, travel: { def: 24 } },
      extra: [{ key: "extreme", label: "Shape travel", type: "range", min: 20, max: 160, step: 10, def: 100, unit: "%" }],
      apply(B, c) {
        const old = B.querySelector("#pg"), { W, H } = stageSize(B), k = c.v.extreme / 100, d = c.dir, t = c.v.travel;
        old.animate({ backgroundColor: [c.from.ground, c.to.ground] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        ["sh1", "sh2"].forEach((s, i) => {
          const a = c.from.shapes[i], b = c.to.shapes[i];
          const dx = (b.cx - a.cx) * W * k, dy = (b.cy - a.cy) * H * k, sc = 1 + (b.r / a.r - 1) * k;
          const mid = (1 + sc) / 2, along = Math.abs(dx) > Math.abs(dy);
          old.querySelector("." + s).animate(
            { backgroundColor: [c.from[SH[s]], c.to[SH[s]]],
              transform: ["translate(0,0) scale(1,1)", `translate(${dx * 0.5}px,${dy * 0.5}px) scale(${mid * (along ? 1.18 : 0.88)},${mid * (along ? 0.88 : 1.18)})`, `translate(${dx}px,${dy}px) scale(${sc},${sc})`],
              borderRadius: ["50%", "46% 54% 52% 48% / 52% 48% 54% 46%", "50%"] },
            { duration: c.tOut, delay: i * 60, easing: c.outE, fill: "forwards" });
        });
        old.querySelector(".hero").animate({ transform: ["translateX(0)", `translateX(${-d * t * 1.5}px)`], opacity: [1, 0] }, { duration: c.tOut * 0.7, easing: c.outE, fill: "forwards" });
        cascadeOut(old, c);
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2", ground: "transparent" }));
        const nu = B.querySelector("#pg2");
        nu.querySelectorAll(".sh1,.sh2").forEach((s) => s.style.display = "none");
        nu.querySelector(".hero").animate({ transform: [`translateX(${d * t * 1.5}px)`, "translateX(0)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.25, easing: c.inE, fill: "both" });
        cascadeIn(nu, c, c.tOut * 0.3);
      },
      snippetExtra: (v, { e, tOut }) =>
  `// Each mood owns a shape layout; shapes tween between layouts with a squash keyframe mid-way.
  const LAYOUT = { dawn: [{ x: "100%", y: "8%", r: 130 }, { x: "2%", y: "95%", r: 90 }],
                   dusk: [{ x: "8%", y: "12%", r: 100 }, { x: "92%", y: "90%", r: 150 }] };
  {LAYOUT[screen].map((q, i) => (
    <motion.div key={i} className="shape" animate={{ left: q.x, top: q.y, width: q.r * 2, height: q.r * 2, backgroundColor: m["s" + (i + 1)],
        scaleX: [1, 1.18, 1], scaleY: [1, 0.88, 1], borderRadius: ["50%", "46% 54% 52% 48% / 52% 48% 54% 46%", "50%"] }}
      transition={{ duration: ${tOut}, delay: i * 0.06, ease: ${e(v.outEase)} }} />
  ))}`,
    }),

    moodEntry({
      id: "mood-hero", name: "Mood · Hero Morph",
      blurb: "Shared-element: the small hero card in A grows into a full-bleed banner in B while its gradient and the ground swap mood, then the new copy cascades in beneath. The hero is the continuity thread; everything else changes. (layoutId pattern in the app.)",
      defaults: { duration: { def: 700 }, inFrac: { def: 60 }, outEase: { def: "ease-out-quint" } },
      rest(B, v, dir) {
        if (dir === -1) { // settled B state: banner hero, text lower
          const h = B.querySelector(".hero"); h.style.cssText += ";left:0;top:0;width:100%;height:130px;border-radius:0 0 22px 22px;";
          B.querySelector(".txt").style.top = "150px";
        }
      },
      apply(B, c) {
        const old = B.querySelector("#pg"), hero = old.querySelector(".hero"), fwd = c.dir === 1;
        const small = { left: "24px", top: "24px", width: "150px", height: "96px", borderRadius: "16px" };
        const big   = { left: "0px",  top: "0px",  width: `${stageSize(B).W}px`, height: "130px", borderRadius: "0 0 22px 22px" };
        const [a, b] = fwd ? [small, big] : [big, small];
        old.animate({ backgroundColor: [c.from.ground, c.to.ground] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        hero.animate([a, b], { duration: c.tOut, easing: c.outE, fill: "forwards" });
        hero.insertAdjacentHTML("beforeend", `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${c.to.hero[0]},${c.to.hero[1]});opacity:0;"></div>`);
        hero.lastElementChild.animate({ opacity: [0, 1] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        ["sh1", "sh2"].forEach((s) => old.querySelector("." + s).animate({ backgroundColor: [c.from[SH[s]], c.to[SH[s]]] }, { duration: c.tOut, easing: c.outE, fill: "forwards" }));
        cascadeOut(old, c);
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2", ground: "transparent" }));
        const nu = B.querySelector("#pg2");
        nu.querySelectorAll(".sh1,.sh2,.hero").forEach((s) => s.style.display = "none");
        nu.querySelector(".txt").style.top = fwd ? "150px" : "136px";
        cascadeIn(nu, c, c.tOut * 0.35);
      },
      snippetExtra: (v, { e, tOut }) =>
  `// Same layoutId on both screens' hero → Motion morphs position/size/radius:
  <motion.div layoutId="mood-hero" className={screen === "dusk" ? "hero hero--banner" : "hero hero--card"}
    animate={{ background: \`linear-gradient(135deg, \${m.heroA}, \${m.heroB})\` }}
    transition={{ layout: { duration: ${tOut}, ease: ${e(v.outEase)} } }} />
  // Gotcha: wrap both screens in one <LayoutGroup>; keep the hero OUTSIDE AnimatePresence's exiting subtree.`,
    }),

    moodEntry({
      id: "mood-depth", name: "Mood · Depth Zoom",
      blurb: "A change of place: the old page recedes — scales up, blurs and fades slowly — while the new mood lands from slightly below scale, fast. Its shapes zoom in behind the copy. The most cinematic of the six; use sparingly (onboarding steps, chapter breaks).",
      defaults: { duration: { def: 800 }, inFrac: { def: 50 }, inEase: { def: "ease-out-back" }, outEase: { def: "ease-in" }, travel: { def: 16 } },
      extra: [{ key: "blur", label: "Out blur", type: "range", min: 0, max: 16, step: 1, def: 8, unit: "px" }],
      apply(B, c) {
        const old = B.querySelector("#pg");
        old.animate({ transform: ["scale(1)", "scale(1.08)"], opacity: [1, 0], filter: ["blur(0px)", `blur(${c.v.blur}px)`] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" }));
        const nu = B.querySelector("#pg2");
        nu.animate({ transform: ["scale(0.92)", "scale(1)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.15, easing: c.inE, fill: "both" });
        nu.querySelectorAll(".sh1,.sh2").forEach((s, i) => s.animate({ transform: ["scale(0.6)", "scale(1)"] }, { duration: c.tIn * 1.4, delay: c.tOut * 0.15 + i * 60, easing: c.inE, fill: "both" }));
        nu.querySelector(".hero").animate({ transform: ["scale(0.8)", "scale(1)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.25, easing: c.inE, fill: "both" });
        cascadeIn(nu, c, c.tOut * 0.3);
      },
      snippetExtra: (v, { e, tIn, tOut }) =>
  `// Whole-page variants — the old page recedes, the new one lands:
  const page = {
    in:  { scale: 1,    opacity: 1, filter: "blur(0px)", transition: { duration: ${tIn}, ease: ${e(v.inEase)} } },
    out: { scale: 1.08, opacity: 0, filter: "blur(${v.blur}px)", transition: { duration: ${tOut}, ease: ${e(v.outEase)} } },
    pre: { scale: 0.92, opacity: 0, filter: "blur(0px)" },
  };
  <motion.div key={screen} variants={page} initial="pre" animate="in" exit="out" style={{ backgroundColor: m.ground }} />`,
    }),
  ];

  /* ── Logo Blob-In (cold-start splash) ──────────────────────────────────────
     Pieces of the mark start at the edges of the screen and flow inward,
     fusing (gooey filter) into a blob mass that resolves into the crisp
     vector. Quick and breezy, under ~900 ms. Blob targets are sampled from
     the real path, so the mass already reads as the mark before it sharpens. */
  const SWIRL_D = "M48.21 99.95C47.7 99.95 47.18 99.93 46.64 99.9C34.19 99.08 22.97 93.68 14.65 85.37C5.25 75.96 0.0 63.33 0.0 50.03C0.0 36.24 5.6 23.75 14.65 14.7C24.05 5.29 36.69 0.05 50.0 0.05C63.8 0.05 76.3 5.65 85.35 14.69C94.73 24.07 99.97 36.66 100.0 49.92L100.0 49.98L100.0 50.08L100.0 50.14L100.0 50.19L100.0 50.19L99.99 50.24L99.99 50.24L99.99 50.29L99.98 50.29C98.32 65.41 84.25 71.79 72.13 71.79C69.99 71.79 67.91 71.59 65.97 71.21C46.29 67.3 34.46 47.86 24.79 47.86C22.36 47.86 20.07 49.09 17.82 52.1C17.63 52.36 17.45 52.48 17.3 52.48C17.02 52.48 16.85 52.07 16.85 51.42C16.85 50.5 17.2 49.08 18.12 47.57C21.01 42.86 25.05 41.17 29.49 41.17C37.51 41.17 46.85 46.72 53.11 50.05C55.99 51.58 59.54 52.47 62.98 52.47C69.01 52.47 74.72 49.75 75.96 43.0C76.24 41.44 76.38 39.93 76.38 38.45C76.38 21.51 58.33 10.16 40.29 10.16C22.22 10.16 4.14 21.52 4.14 50.03C4.14 70.94 22.2 89.06 48.02 89.06C49.72 89.06 51.45 88.98 53.21 88.82C53.57 88.79 53.92 88.78 54.25 88.78C57.84 88.78 59.66 90.65 59.66 92.86C59.66 93.35 59.57 93.85 59.39 94.36C58.4 97.16 54.69 99.95 48.21 99.95Z";
  const LOGO_INKS = { "purple on tan": ["#2a1f3d", "#f3e9d8"], "tan on purple": ["#f3e9d8", "#2a1f3d"], "white on purple": ["#ffffff", "#2a1f3d"] };

  const LOGO_ENTRY = {
    id: "logo-blob-in", name: "Logo Blob-In",
    blurb: "Cold-start splash: pieces of the logomark start at the screen edges and flow inward, fusing into a liquid mass (SVG gooey filter) that settles into the crisp vector. Blob targets are sampled along the real path. Reverse = the mark dissolves back out to the edges. Reduced-motion fallback = plain fade.",
    controls: [
      { key: "duration", label: "Duration",   type: "range",  min: 400, max: 1600, step: 10, def: 850, unit: "ms" },
      { key: "blobs",    label: "Blobs",      type: "range",  min: 4, max: 14, step: 1, def: 8 },
      { key: "goo",      label: "Goo (blur)", type: "range",  min: 3, max: 16, step: 1, def: 9, unit: "px" },
      { key: "size",     label: "Mark size",  type: "range",  min: 100, max: 240, step: 10, def: 170, unit: "px" },
      { key: "easing",   label: "Easing",     type: "select", options: Object.keys(EASINGS), def: "ease-out-quint" },
      { key: "from",     label: "Start from", type: "select", options: ["edges", "corners", "ring"], def: "edges" },
      { key: "ink",      label: "Ink",        type: "select", options: Object.keys(LOGO_INKS), def: "purple on tan" },
      { key: "reduced",  label: "Reduced-motion fallback", type: "toggle", def: false },
    ],
    _targets(n, size) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", SWIRL_D); svg.appendChild(p); document.body.appendChild(svg);
      const L = p.getTotalLength(), pts = [];
      for (let i = 0; i < n; i++) { const q = p.getPointAtLength((i / n) * L); pts.push([(q.x - 50) / 100 * size, (q.y - 50) / 100 * size]); }
      svg.remove();
      return pts;
    },
    _starts(n, from, W, H, size) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.3;
        if (from === "ring") { pts.push([Math.cos(a) * size * 1.6, Math.sin(a) * size * 1.6]); continue; }
        if (from === "corners") { pts.push([Math.sign(Math.cos(a)) * (W / 2 + 60), Math.sign(Math.sin(a)) * (H / 2 + 60)]); continue; }
        // edges: cast the angle to the stage rectangle, then 50px past it
        const k = Math.min((W / 2) / Math.abs(Math.cos(a) || 1e-6), (H / 2) / Math.abs(Math.sin(a) || 1e-6)) + 50;
        pts.push([Math.cos(a) * k, Math.sin(a) * k]);
      }
      return pts;
    },
    rest(A, B, v, dir) {
      A.style.display = "none";
      const [ink, ground] = LOGO_INKS[v.ink];
      B.style.cssText += `;background:${ground};`;
      const { W, H } = stageSize(B);
      const r = v.size * 0.17;
      const T = this._targets(v.blobs, v.size), S = this._starts(v.blobs, v.from, W, H, v.size);
      const at = dir === 1 ? S : T;
      B.innerHTML =
        `<svg width="0" height="0" style="position:absolute"><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="${v.goo}" result="b"/>
           <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></svg>
         <div id="blobs" style="position:absolute;inset:0;filter:url(#goo);opacity:${dir === 1 ? 1 : 0};will-change:opacity;">
           ${T.map((t, i) => `<div class="blob" style="position:absolute;left:50%;top:50%;width:${r * 2}px;height:${r * 2}px;margin:${-r}px 0 0 ${-r}px;border-radius:50%;background:${ink};transform:translate(${at[i][0]}px,${at[i][1]}px) scale(${dir === 1 ? 0.7 : 1});will-change:transform;"></div>`).join("")}
         </div>
         <svg id="mark" viewBox="0 0 100 100" style="position:absolute;left:50%;top:50%;width:${v.size}px;height:${v.size}px;margin:${-v.size / 2}px 0 0 ${-v.size / 2}px;opacity:${dir === 1 ? 0 : 1};will-change:opacity,transform;"><path d="${SWIRL_D}" fill="${ink}"/></svg>`;
      this._T = T; this._S = S;
    },
    apply(A, B, dir, v) {
      const ease = EASINGS[v.easing], blobs = B.querySelector("#blobs"), mark = B.querySelector("#mark");
      if (v.reduced) { // plain fade, no travel
        mark.animate({ opacity: dir === 1 ? [0, 1] : [1, 0] }, { duration: Math.min(v.duration, 400), easing: ease, fill: "forwards" });
        blobs.style.opacity = 0; return;
      }
      const D = v.duration, fuse = D * 0.62;             // blobs travel for 62%, then the mark resolves
      const [from, to] = dir === 1 ? [this._S, this._T] : [this._T, this._S];
      blobs.querySelectorAll(".blob").forEach((b, i) => b.animate(
        { transform: [`translate(${from[i][0]}px,${from[i][1]}px) scale(${dir === 1 ? 0.7 : 1})`, `translate(${to[i][0]}px,${to[i][1]}px) scale(${dir === 1 ? 1 : 0.5})`] },
        { duration: dir === 1 ? fuse : D * 0.7, delay: dir === 1 ? i * (D * 0.02) : D * 0.2, easing: dir === 1 ? ease : EASINGS["ease-in"], fill: "forwards" }));
      if (dir === 1) {
        blobs.animate({ opacity: [1, 1, 0] }, { duration: D, easing: "linear", fill: "forwards", offset: [0, 0.7, 1] });
        mark.animate({ opacity: [0, 1], transform: ["scale(0.96)", "scale(1)"] }, { duration: D - fuse * 0.9, delay: fuse * 0.9, easing: ease, fill: "forwards" });
      } else {
        blobs.animate({ opacity: [0, 1, 1] }, { duration: D * 0.3, easing: "linear", fill: "forwards" });
        mark.animate({ opacity: [1, 0], transform: ["scale(1)", "scale(1.04)"] }, { duration: D * 0.3, easing: EASINGS["ease-in"], fill: "forwards" });
      }
    },
    snippet(v) {
      const ease = EASINGS[v.easing].replace("cubic-bezier(", "[").replace(/\)$/, "]");
      const D = v.duration / 1000, fuse = (D * 0.62).toFixed(2);
      return (
  `// 1. Gooey filter once, anywhere in the tree:
  <svg width="0" height="0"><filter id="goo">
    <feGaussianBlur in="SourceGraphic" stdDeviation="${v.goo}" result="b" />
    <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="g" />
    <feComposite in="SourceGraphic" in2="g" operator="atop" />
  </filter></svg>

  // 2. Blob targets sampled along the mark's path (once, at mount):
  const pts = samplePath(SWIRL_D, ${v.blobs}, ${v.size});   // getPointAtLength → [[x,y], …], centred
  const starts = ${v.from === "ring" ? "ringAround(pts, " + (v.size * 1.6).toFixed(0) + ")" : v.from === "corners" ? "nearestCorners(pts)" : "edgeCast(pts, 50 /* px past the viewport edge */)"};

  // 3. Blobs fly in and fuse, then the crisp mark takes over:
  const reduce = useReducedMotion();
  <motion.div style={{ filter: "url(#goo)" }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: ${D.toFixed(2)}, times: [0, 0.7, 1] }}>
    {pts.map(([x, y], i) => (
      <motion.div key={i} className="blob" style={{ width: ${(v.size * 0.34).toFixed(0)}, height: ${(v.size * 0.34).toFixed(0)}, borderRadius: "50%", background: "${LOGO_INKS[v.ink][0]}" }}
        initial={reduce ? false : { x: starts[i][0], y: starts[i][1], scale: 0.7 }}
        animate={{ x, y, scale: 1 }}
        transition={{ duration: ${fuse}, delay: i * ${(D * 0.02).toFixed(3)}, ease: ${ease} }} />
    ))}
  </motion.div>
  <motion.svg viewBox="0 0 100 100" width={${v.size}} height={${v.size}}
    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
    transition={reduce ? { duration: 0.3 } : { duration: ${(D - D * 0.62 * 0.9).toFixed(2)}, delay: ${(D * 0.62 * 0.9).toFixed(2)}, ease: ${ease} }}>
    <path d={SWIRL_D} fill="currentColor" />
  </motion.svg>
  // Reduced motion: skip the blobs entirely (initial={false}) — the mark just fades in.`
      );
    },
  };


  /* ── Blob reveal helper (shared by the blob variants) ─────────────────────── */
  // Pour the new page in through a growing circle. `at` is a CSS position ("100% 50%" or "120px 60px").
  function blobPour(B, c, { at, startR = 0, nu, dur = c.tOut, ease = c.inE, dimOld = true }) {
    const { W, H } = stageSize(B), R = Math.hypot(W, H) * 1.05;
    const old = B.querySelector("#pg");
    nu.animate({ clipPath: [`circle(${startR}px at ${at})`, `circle(${R}px at ${at})`] }, { duration: dur, easing: ease, fill: "forwards" });
    if (dimOld) old.animate({ transform: ["scale(1)", "scale(0.94)"], filter: ["brightness(1)", "brightness(0.6)"] }, { duration: dur, easing: c.outE, fill: "forwards" });
  }
  const edgeAt = (edge, dir) => {
    const e = dir === 1 ? edge : ({ right: "left", left: "right", bottom: "bottom", top: "top" })[edge];
    return { right: "100% 50%", left: "0% 50%", bottom: "50% 100%", top: "50% 0%" }[e];
  };

  const MOOD_ENTRIES_2 = [
    moodEntry({
      id: "mood-blob-hero", name: "Mood · Blob + Hero Morph",
      blurb: "Blob Reveal with a continuity thread: the hero card is lifted above both pages and morphs card → banner while the new mood pours in underneath it. The reveal says 'new place', the hero says 'same story'. Reverse shrinks the banner back as the old mood pours in.",
      defaults: { duration: { def: 750 }, inFrac: { def: 65 }, inEase: { def: "ease-in-out" }, outEase: { def: "ease-out-quint" } },
      extra: [{ key: "edge", label: "Pour from", type: "select", options: ["right", "left", "bottom", "top"], def: "right" }],
      rest(B, v, dir) {
        if (dir === -1) { B.querySelector(".hero").style.cssText += ";left:0;top:0;width:100%;height:130px;border-radius:0 0 22px 22px;"; B.querySelector(".txt").style.top = "150px"; }
      },
      apply(B, c) {
        const old = B.querySelector("#pg"), fwd = c.dir === 1, { W } = stageSize(B);
        const hero = old.querySelector(".hero");
        B.appendChild(hero); hero.style.zIndex = 3;                      // lift above both pages
        const small = { left: "24px", top: "24px", width: "150px", height: "96px", borderRadius: "16px" };
        const big   = { left: "0px",  top: "0px",  width: `${W}px`,   height: "130px", borderRadius: "0 0 22px 22px" };
        hero.animate(fwd ? [small, big] : [big, small], { duration: c.tOut, easing: c.outE, fill: "forwards" });
        hero.insertAdjacentHTML("beforeend", `<div style="position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,${c.to.hero[0]},${c.to.hero[1]});opacity:0;"></div>`);
        hero.lastElementChild.animate({ opacity: [0, 1] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" }));
        const nu = B.querySelector("#pg2"); nu.style.zIndex = 2;
        nu.querySelector(".hero").style.display = "none";
        nu.querySelector(".txt").style.top = fwd ? "150px" : "136px";
        blobPour(B, c, { at: edgeAt(c.v.edge, c.dir), nu });
        cascadeIn(nu, c, c.tOut * 0.3);
      },
      snippetExtra: (v, { e, tOut }) =>
  `// Hero carries layoutId across the reveal; the incoming page is clip-path'd under it.
  <LayoutGroup>
    <motion.div layoutId="mood-hero" className={isBanner ? "hero hero--banner" : "hero hero--card"} style={{ zIndex: 3 }}
      transition={{ layout: { duration: ${tOut}, ease: ${e(v.outEase)} } }} />
    <motion.div key={screen} className="page" style={{ zIndex: 2 }}
      initial={{ clipPath: "circle(0px at ${edgeAt(v.edge, 1)})" }} animate={{ clipPath: "circle(150% at ${edgeAt(v.edge, 1)})" }}
      transition={{ duration: ${tOut}, ease: ${e(v.inEase)} }} />
  </LayoutGroup>`,
    }),

    moodEntry({
      id: "mood-blob-tap", name: "Mood · Blob from Hero",
      blurb: "The reveal starts INSIDE the page: the circle grows out of the hero card (or the button), as if tapping it floods the screen with the new mood. Reads as cause → effect. Reverse pulls the mood back into the hero.",
      defaults: { duration: { def: 700 }, inFrac: { def: 60 }, inEase: { def: "ease-in-out" } },
      extra: [{ key: "source", label: "Grow from", type: "select", options: ["hero", "button"], def: "hero" }],
      apply(B, c) {
        const old = B.querySelector("#pg");
        const src = old.querySelector(c.v.source === "hero" ? ".hero" : ".cta");
        const r = src.getBoundingClientRect(), s = B.getBoundingClientRect();
        const at = `${r.left - s.left + r.width / 2}px ${r.top - s.top + r.height / 2}px`;
        src.animate({ transform: ["scale(1)", "scale(0.92)", "scale(1.04)"] }, { duration: c.tOut * 0.35, easing: c.outE, fill: "forwards" });
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" }));
        const nu = B.querySelector("#pg2");
        blobPour(B, c, { at, startR: Math.min(r.width, r.height) * 0.3, nu, dimOld: false });
        nu.querySelector(".hero").animate({ transform: ["scale(0.9)", "scale(1)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.2, easing: c.inE, fill: "both" });
        cascadeIn(nu, c, c.tOut * 0.3);
      },
      snippetExtra: (v, { e, tOut }) =>
  `// Measure the tapped element, grow the clip circle from its centre:
  const r = heroRef.current.getBoundingClientRect();
  const at = \`\${r.left + r.width / 2}px \${r.top + r.height / 2}px\`;
  <motion.div key={screen} className="page"
    initial={{ clipPath: \`circle(\${r.height * 0.3}px at \${at})\` }} animate={{ clipPath: \`circle(150% at \${at})\` }}
    transition={{ duration: ${tOut}, ease: ${e(v.inEase)} }} />`,
    }),

    moodEntry({
      id: "mood-blob-multi", name: "Mood · Triple Blob",
      blurb: "Three circles pour in from three places at staggered moments and merge into one flood — the page fills unevenly, like water finding its level. Three stacked copies of the incoming page, each with its own clip circle. Try a high stagger.",
      defaults: { duration: { def: 850 }, inFrac: { def: 60 }, inEase: { def: "ease-in-out" }, stagger: { def: 90 } },
      apply(B, c) {
        const old = B.querySelector("#pg");
        old.animate({ transform: ["scale(1)", "scale(0.95)"], filter: ["brightness(1)", "brightness(0.65)"] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        const ats = c.dir === 1 ? ["100% 20%", "0% 60%", "70% 100%"] : ["0% 80%", "100% 40%", "30% 0%"];
        ats.forEach((at, i) => {
          B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" + (i ? i : "") }));
          const nu = B.lastElementChild; nu.id = i === ats.length - 1 ? "pg2" : "pg2_" + i;
          if (i < ats.length - 1) { nu.querySelector(".txt").style.visibility = "hidden"; nu.querySelector(".hero").style.visibility = "hidden"; }
          nu.style.clipPath = `circle(0px at ${at})`;
          setTimeout(() => blobPour(B, c, { at, nu, dur: c.tOut - i * c.v.stagger * 1.5, dimOld: false }), i * c.v.stagger * 1.5);
        });
        const top = B.querySelector("#pg2");
        top.querySelector(".hero").animate({ transform: ["translateY(10px)", "translateY(0)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.35, easing: c.inE, fill: "both" });
        cascadeIn(top, c, c.tOut * 0.4);
      },
      snippetExtra: (v, { e, tOut }) =>
  `// Three stacked copies of the incoming page, each clipped from a different point:
  {["100% 20%", "0% 60%", "70% 100%"].map((at, i) => (
    <motion.div key={at} className="page page--copy" aria-hidden={i < 2}
      initial={{ clipPath: \`circle(0px at \${at})\` }} animate={{ clipPath: \`circle(150% at \${at})\` }}
      transition={{ duration: ${tOut}, delay: i * ${(v.stagger * 1.5 / 1000).toFixed(2)}, ease: ${e(v.inEase)} }} />
  ))}`,
    }),

    moodEntry({
      id: "mood-blob-liquid", name: "Mood · Liquid Edge",
      blurb: "Blob Reveal with a wobbling rim: the clip is a 40-point polygon whose vertices ripple as the circle grows, so the edge looks like liquid rather than a compass circle. Wobble fades out as it fills. Chrome/Firefox interpolate polygon() natively.",
      defaults: { duration: { def: 800 }, inFrac: { def: 60 }, inEase: { def: "ease-in-out" } },
      extra: [
        { key: "edge", label: "Pour from", type: "select", options: ["right", "left", "bottom", "top"], def: "right" },
        { key: "wobble", label: "Wobble", type: "range", min: 0, max: 60, step: 2, def: 22, unit: "%" },
      ],
      _poly(cx, cy, r, wob, phase, K = 40) {
        const pts = [];
        for (let i = 0; i < K; i++) {
          const a = (i / K) * Math.PI * 2;
          const rr = r * (1 + wob * (0.5 * Math.sin(3 * a + phase) + 0.3 * Math.sin(5 * a - phase * 1.7) + 0.2 * Math.sin(8 * a + phase * 0.6)));
          pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)}px ${(cy + Math.sin(a) * rr).toFixed(1)}px`);
        }
        return `polygon(${pts.join(",")})`;
      },
      apply(B, c) {
        const { W, H } = stageSize(B), R = Math.hypot(W, H) * 1.05;
        const [px, py] = edgeAt(c.v.edge, c.dir).split(" ").map(parseFloat);
        const cx = px / 100 * W, cy = py / 100 * H;
        const old = B.querySelector("#pg");
        old.animate({ transform: ["scale(1)", "scale(0.94)"], filter: ["brightness(1)", "brightness(0.6)"] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" }));
        const nu = B.querySelector("#pg2");
        const steps = 10, frames = [];
        for (let k = 0; k <= steps; k++) {
          const t = k / steps, wob = (c.v.wobble / 100) * (1 - t) ;
          frames.push({ clipPath: this._poly(cx, cy, 8 + R * t, wob, t * 6), offset: t });
        }
        nu.animate(frames, { duration: c.tOut, easing: c.inE, fill: "forwards" });
        nu.querySelector(".hero").animate({ transform: [`translateX(${c.v.travel}px)`, "translateX(0)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.25, easing: c.inE, fill: "both" });
        cascadeIn(nu, c, c.tOut * 0.3);
      },
      snippetExtra: (v, { e, tOut }) =>
  `// Build ~10 polygon() keyframes with the same vertex count; Motion interpolates them.
  const frames = Array.from({ length: 11 }, (_, k) => liquidPolygon(origin, R * k / 10, wobble * (1 - k / 10), k * 0.6));
  <motion.div key={screen} className="page" animate={{ clipPath: frames }} transition={{ duration: ${tOut}, ease: ${e(v.inEase)}, times: frames.map((_, k) => k / 10) }} />
  // liquidPolygon(): 40 points around origin, radius modulated by 3 sine harmonics × wobble (${v.wobble}% here).`,
    }),

    moodEntry({
      id: "mood-depth-tilt", name: "Mood · Depth Tilt",
      blurb: "Depth Zoom with perspective: the old page tilts away around its vertical axis in the direction of travel and recedes; the new one swings in from the opposite side and squares up. Like turning a card on a table. Keep tilt small for calm, big for drama.",
      defaults: { duration: { def: 800 }, inFrac: { def: 55 }, inEase: { def: "ease-out-quint" }, outEase: { def: "ease-in" }, travel: { def: 30 } },
      extra: [{ key: "tilt", label: "Tilt", type: "range", min: 4, max: 40, step: 1, def: 16, unit: "°" }],
      apply(B, c) {
        B.style.perspective = "1000px";
        const old = B.querySelector("#pg"), d = c.dir, t = c.v.tilt;
        old.style.transformOrigin = d === 1 ? "0% 50%" : "100% 50%";
        old.animate({ transform: ["rotateY(0deg) translateX(0) scale(1)", `rotateY(${-d * t}deg) translateX(${-d * c.v.travel * 2}px) scale(0.96)`], opacity: [1, 0], filter: ["blur(0px)", "blur(3px)"] }, { duration: c.tOut, easing: c.outE, fill: "forwards" });
        B.insertAdjacentHTML("beforeend", moodPage(c.to, { id: "pg2" }));
        const nu = B.querySelector("#pg2");
        nu.style.transformOrigin = d === 1 ? "100% 50%" : "0% 50%";
        nu.animate({ transform: [`rotateY(${d * t}deg) translateX(${d * c.v.travel * 2}px) scale(0.96)`, "rotateY(0deg) translateX(0) scale(1)"], opacity: [0, 1] }, { duration: c.tIn, delay: c.tOut * 0.2, easing: c.inE, fill: "both" });
        cascadeIn(nu, c, c.tOut * 0.35);
      },
      snippetExtra: (v, { e, tIn, tOut }) =>
  `// Parent: style={{ perspective: 1000 }}. Pages tilt around the edge they leave from:
  const page = {
    pre: (d) => ({ rotateY: d * ${v.tilt}, x: d * ${v.travel * 2}, scale: 0.96, opacity: 0, transformOrigin: d === 1 ? "100% 50%" : "0% 50%" }),
    in:  { rotateY: 0, x: 0, scale: 1, opacity: 1, transition: { duration: ${tIn}, ease: ${e(v.inEase)} } },
    out: (d) => ({ rotateY: -d * ${v.tilt}, x: -d * ${v.travel * 2}, scale: 0.96, opacity: 0, filter: "blur(3px)", transition: { duration: ${tOut}, ease: ${e(v.outEase)} } }),
  };`,
    }),

    moodEntry({
      id: "mood-depth-through", name: "Mood · Pass Through",
      blurb: "You move INTO the old page: it zooms up past the camera and dissolves, and the new mood is already waiting behind it, sharpening from a soft blur. The opposite camera move to Depth Zoom (there the old page recedes). Big, use for chapter breaks.",
      defaults: { duration: { def: 900 }, inFrac: { def: 70 }, inEase: { def: "ease-out-quint" }, outEase: { def: "ease-in" } },
      extra: [{ key: "zoom", label: "Zoom through", type: "range", min: 1.2, max: 2.4, step: 0.1, def: 1.7, unit: "×" }],
      apply(B, c) {
        const old = B.querySelector("#pg");
        B.insertAdjacentHTML("afterbegin", moodPage(c.to, { id: "pg2" }));   // new page BEHIND the old one
        const nu = B.querySelector("#pg2");
        old.animate({ transform: ["scale(1)", `scale(${c.v.zoom})`], opacity: [1, 1, 0], filter: ["blur(0px)", "blur(0px)", "blur(6px)"] }, { duration: c.tOut, easing: c.outE, fill: "forwards", offset: [0, 0.45, 1] });
        nu.animate({ transform: ["scale(0.86)", "scale(1)"], filter: ["blur(8px)", "blur(0px)"] }, { duration: c.tOut, easing: c.inE, fill: "forwards" });
        nu.querySelector(".hero").animate({ opacity: [0, 1], transform: ["scale(0.9)", "scale(1)"] }, { duration: c.tIn, delay: c.tOut * 0.3, easing: c.inE, fill: "both" });
        cascadeIn(nu, c, c.tOut * 0.35);
      },
      snippetExtra: (v, { e, tIn, tOut }) =>
  `// New page mounts BEHIND (lower z) and sharpens; old page zooms past the camera.
  const page = {
    pre: { scale: 0.86, filter: "blur(8px)" },
    in:  { scale: 1, filter: "blur(0px)", transition: { duration: ${tOut}, ease: ${e(v.inEase)} } },
    out: { scale: ${v.zoom}, opacity: [1, 1, 0], filter: ["blur(0px)", "blur(0px)", "blur(6px)"], transition: { duration: ${tOut}, ease: ${e(v.outEase)}, times: [0, 0.45, 1] } },
  };`,
    }),
  ];

  /* ── Logo morph engine ──────────────────────────────────────────────────────
     Real shape morphing, not a crossfade: the mark is sampled into K points
     and cut into N wedges from its centroid; each blob is a circle polygon
     with the same point count, so its vertices tween straight into a wedge.
     Everything is driven by a small rAF tween with JS easings (elastic /
     bounce aren't expressible in CSS), rendered as SVG polygons under the
     gooey filter so seams fuse. Crisp path crossfades in at the very end.  */
  const EASE_FN = {
    "ease-out-quint": (t) => 1 - Math.pow(1 - t, 5),
    "ease-in-out":    (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    "ease-in":        (t) => t * t * t,
    "ease-out-back":  (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    "elastic":        (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
    "bounce":         (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
    "linear":         (t) => t,
  };
  const CHAKRA = ["#e11d48", "#f97316", "#facc15", "#22c55e", "#0ea5e9", "#4f46e5", "#a855f7"]; // root → crown
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpPts = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);
  const ptsStr = (P) => P.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const mixT = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * Math.max(0, Math.min(1, t)))).join(",")})`; };

  // Sample the swirl into K points, centred on (cx, cy), `size` px tall.
  function swirlPoints(K, size, cx, cy) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", SWIRL_D); svg.appendChild(p); document.body.appendChild(svg);
    const L = p.getTotalLength(), pts = [];
    for (let i = 0; i < K; i++) { const q = p.getPointAtLength((i / K) * L); pts.push([cx + (q.x - 50) / 100 * size, cy + (q.y - 50) / 100 * size]); }
    svg.remove();
    return pts;
  }
  // Cut the sampled outline into N wedges from the centroid; each wedge has m+2 points.
  function wedges(pts, N) {
    const m = Math.floor(pts.length / N), K = m * N;
    const C = [pts.slice(0, K).reduce((s, p) => s + p[0], 0) / K, pts.slice(0, K).reduce((s, p) => s + p[1], 0) / K];
    return Array.from({ length: N }, (_, i) => {
      const w = [C];
      for (let j = 0; j <= m; j++) w.push(pts[(i * m + j) % K]);
      return w;
    });
  }
  const centroid = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
  // Circle polygon with n points, first point aimed at `aim` so the morph doesn't twist.
  function circlePts(cx, cy, r, n, aim = [cx + 1, cy]) {
    const a0 = Math.atan2(aim[1] - cy, aim[0] - cx), pts = [];
    for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  // rAF tween: fn(t) with t eased 0→1. Resolves when done. `reverse` runs 1→0.
  function tween(duration, ease, fn, { delay = 0, reverse = false } = {}) {
    return new Promise((res) => {
      const t0 = performance.now() + delay;
      const step = (now) => {
        const u = Math.max(0, Math.min(1, (now - t0) / duration));
        const e = ease(reverse ? 1 - u : u);
        fn(e);
        if (u < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  const LOGO_CONTROLS = (over = {}) => [
    { key: "duration", label: "Duration",   type: "range",  min: 500, max: 2200, step: 10, def: 900, unit: "ms" },
    { key: "blobs",    label: "Blobs",      type: "range",  min: 3, max: 12, step: 1, def: 7 },
    { key: "goo",      label: "Goo (blur)", type: "range",  min: 0, max: 16, step: 1, def: 8, unit: "px" },
    { key: "size",     label: "Mark size",  type: "range",  min: 100, max: 240, step: 10, def: 170, unit: "px" },
    { key: "easing",   label: "Easing",     type: "select", options: Object.keys(EASE_FN), def: "elastic" },
    { key: "ink",      label: "Ink",        type: "select", options: Object.keys(LOGO_INKS), def: "purple on tan" },
    { key: "reduced",  label: "Reduced-motion fallback", type: "toggle", def: false },
  ].map((c) => ({ ...c, ...(over[c.key] || {}) }));

  // cfg: { id, name, blurb, defaults, extra, starts(i, N, ctx) → [x,y], travel(i, t, start, end, ctx) → [x,y] (default straight line),
  //        colours(i, N) → hex (default ink), flyFrac (0..1 of duration spent flying), hold (ms pause before morph), stagger(i, N) → ms }
  function logoEntry(cfg) {
    return {
      id: cfg.id, name: cfg.name, blurb: cfg.blurb,
      controls: LOGO_CONTROLS(cfg.defaults || {}).concat(cfg.extra || []),
      rest(A, B, v, dir) {
        A.style.display = "none";
        const [ink, ground] = LOGO_INKS[v.ink];
        B.style.cssText += `;background:${ground};`;
        const { W, H } = stageSize(B), N = v.blobs, cx = W / 2, cy = H / 2;
        const K = Math.max(96, Math.round(v.blobs * 14));
        const pts = swirlPoints(K, v.size, cx, cy), WG = wedges(pts, N);
        const ctx = { W, H, cx, cy, size: v.size, v, N };
        const ends = WG.map(centroid), r = v.size * (cfg.radius || 0.16);
        const starts = WG.map((_, i) => cfg.starts(i, N, ctx, ends[i]));
        const circles = WG.map((w, i) => circlePts(starts[i][0], starts[i][1], r, w.length, ends[i]));
        const cols = WG.map((_, i) => (cfg.colours ? cfg.colours(i, N) : ink));
        this._m = { ink, ground, N, r, WG, ends, starts, circles, cols, ctx };
        B.innerHTML =
          `<svg id="goosvg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;">
             <defs><filter id="goo2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="${v.goo}" result="b"/>
               <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></defs>
             <g id="blobs" ${v.goo ? 'filter="url(#goo2)"' : ""} opacity="${dir === 1 ? 1 : 0}">
               ${WG.map((w, i) => `<polygon class="blob" fill="${dir === 1 ? cols[i] : ink}" points="${ptsStr(dir === 1 ? circles[i] : w)}"/>`).join("")}
             </g>
           </svg>
           <svg id="mark" viewBox="0 0 100 100" style="position:absolute;left:50%;top:50%;width:${v.size}px;height:${v.size}px;margin:${-v.size / 2}px 0 0 ${-v.size / 2}px;opacity:${dir === 1 ? 0 : 1};"><path d="${SWIRL_D}" fill="${ink}"/></svg>`;
      },
      async apply(A, B, dir, v) {
        const m = this._m, ease = EASE_FN[v.easing], polys = [...B.querySelectorAll(".blob")], g = B.querySelector("#blobs"), mark = B.querySelector("#mark");
        if (v.reduced) { mark.animate({ opacity: dir === 1 ? [0, 1] : [1, 0] }, { duration: 350, fill: "forwards" }); g.setAttribute("opacity", 0); return; }
        const D = v.duration, fly = D * (cfg.flyFrac ?? 0.5), hold = cfg.hold ?? 0, morph = D - fly - hold, stag = (i) => (cfg.stagger ? cfg.stagger(i, m.N, D) : 0);
        const travel = cfg.travel || ((i, t, s, e) => [lerp(s[0], e[0], t), lerp(s[1], e[1], t)]);
        const setCircle = (i, pos, rr = m.r) => polys[i].setAttribute("points", ptsStr(circlePts(pos[0], pos[1], rr, m.WG[i].length, m.ends[i])));
        const run = this._run = Symbol(); // cancels a previous run if the user replays mid-flight
        if (dir === 1) {
          // 1. fly in as circles
          await Promise.all(polys.map((_, i) => tween(fly, ease, (t) => {
            if (this._run !== run) return;
            setCircle(i, travel(i, t, m.starts[i], m.ends[i], m.ctx), m.r * (cfg.grow ? cfg.grow(t) : 1));
          }, { delay: stag(i) })));
          if (this._run !== run) return;
          if (hold) await new Promise((r) => setTimeout(r, hold));
          // 2. circles become wedges (and colours become ink)
          const C = polys.map((_, i) => circlePts(m.ends[i][0], m.ends[i][1], m.r, m.WG[i].length, m.ends[i]));
          await tween(morph, cfg.morphEase ? EASE_FN[cfg.morphEase] : ease, (t) => {
            if (this._run !== run) return;
            polys.forEach((p, i) => { p.setAttribute("points", ptsStr(lerpPts(C[i], m.WG[i], t))); if (m.cols[i] !== m.ink && !v.keep) p.setAttribute("fill", mixT(m.cols[i], m.ink, t * 1.3)); });
          });
          if (this._run !== run) return;
          // 3. crisp mark takes over
          // crisp mark first (under the still-opaque blobs), then the blobs fade to reveal it — no half-mixed grey
          if (!v.keep) { mark.animate({ opacity: [0, 1] }, { duration: 120, fill: "forwards" }); g.animate({ opacity: [1, 0] }, { duration: 160, delay: 120, fill: "forwards" }); }
        } else {
          g.animate({ opacity: [0, 1] }, { duration: 120, fill: "forwards" });
          mark.animate({ opacity: [1, 0] }, { duration: 160, fill: "forwards" });
          const C = polys.map((_, i) => circlePts(m.ends[i][0], m.ends[i][1], m.r, m.WG[i].length, m.ends[i]));
          await tween(morph, EASE_FN["ease-in-out"], (t) => { if (this._run !== run) return; polys.forEach((p, i) => p.setAttribute("points", ptsStr(lerpPts(m.WG[i], C[i], t)))); });
          if (this._run !== run) return;
          await Promise.all(polys.map((_, i) => tween(fly, EASE_FN["ease-in"], (t) => {
            if (this._run !== run) return;
            setCircle(i, travel(i, 1 - t, m.starts[i], m.ends[i], m.ctx), m.r * (1 - t * 0.5));
          }, { delay: stag(i) * 0.5 })));
          g.animate({ opacity: [1, 0] }, { duration: 150, fill: "forwards" });
        }
      },
      snippet(v) { return logoSnippet(v, cfg); },
    };
  }
  function logoSnippet(v, cfg) {
    const D = (v.duration / 1000).toFixed(2), fly = ((cfg.flyFrac ?? 0.5) * v.duration / 1000).toFixed(2);
    return (
  `// Shape morph: sample the mark, cut into ${v.blobs} wedges, tween circle → wedge vertices.
  // (Motion can't morph polygons natively — drive the points with animate()'s onUpdate, or use flubber.)
  import { animate } from "motion";
  const pts = samplePath(SWIRL_D, ${Math.max(24, v.blobs * 14)}, ${v.size});          // getPointAtLength, centred
  const wedges = cutWedges(pts, ${v.blobs});                        // [centroid, p_k … p_k+m] each
  const circles = wedges.map((w, i) => circlePts(start(i), ${(v.size * (cfg.radius || 0.16)).toFixed(0)}, w.length));

  // 1. fly in (${fly}s): ${cfg.flightNote || "straight line from the start point to the wedge centroid"}
  // 2. morph (${(v.duration / 1000 - (cfg.flyFrac ?? 0.5) * v.duration / 1000).toFixed(2)}s): vertices circle → wedge, easing "${v.easing}"${cfg.colours ? ", fill chakra → ink" : ""}
  wedges.forEach((w, i) => animate(0, 1, { duration: ${D} - ${fly}, delay: ${fly}, ease: ${JSON.stringify(v.easing)},
    onUpdate: (t) => poly[i].setAttribute("points", lerpPoints(circles[i], w, t).join(" ")) }));
  // 3. crossfade the crisp <path d={SWIRL_D}> in over 160ms, blobs out.
  // Wrap the polygons in <g filter="url(#goo)"> (feGaussianBlur ${v.goo} + feColorMatrix 19/-9) so seams fuse.
  // useReducedMotion() → skip 1–2, just fade the path in.`
    );
  }

  const LOGO_VARIANTS = [
    logoEntry({
      id: "logo-morph", name: "Logo Morph · Edges",
      blurb: "The true morph: perfect circles fly in from the screen edges, then their vertices tween straight into wedges of the mark — the circles BECOME the logo, no crossfade until the last 160 ms. Elastic easing gives the liquid bounce; try 'bounce' and 'ease-out-back' too.",
      starts: (i, N, { W, H, cx, cy }, end) => { const a = Math.atan2(end[1] - cy, end[0] - cx); const k = Math.min((W / 2) / Math.abs(Math.cos(a) || 1e-6), (H / 2) / Math.abs(Math.sin(a) || 1e-6)) + 60; return [cx + Math.cos(a) * k, cy + Math.sin(a) * k]; },
      stagger: (i, N, D) => i * D * 0.03, flyFrac: 0.45,
      flightNote: "each blob comes from the edge point in line with its wedge, so they converge radially",
    }),
    logoEntry({
      id: "logo-drop", name: "Logo Drop",
      blurb: "One liquid drop falls from above, squashes on landing, then spreads into the whole mark in a single morph. One blob = one polygon with every point of the outline. Bounce easing on the fall sells the weight; elastic on the morph sells the liquid.",
      defaults: { blobs: { def: 1, min: 1, max: 1 }, goo: { def: 0 }, easing: { def: "bounce" }, duration: { def: 1100 } },
      radius: 0.3, flyFrac: 0.4, hold: 40, morphEase: "elastic",
      starts: (i, N, { cx, cy, H }) => [cx, -H * 0.2],
      grow: (t) => 1,
      travel: (i, t, s, e) => [e[0], lerp(s[1], e[1], t)],
      flightNote: "vertical fall onto the centroid (bounce), then the circle inflates into the outline",
    }),
    logoEntry({
      id: "logo-chakra", name: "Logo Chakra",
      blurb: "Seven blobs in the seven chakra colours rise up the spine from below — root first, crown last — stack into a column, then flow out into the wedges of the mark as their colours settle into the ink. Toggle 'keep colours' to leave the mark as a seven-colour wheel.",
      defaults: { blobs: { def: 7, min: 7, max: 7 }, duration: { def: 1500 }, easing: { def: "ease-out-back" }, goo: { def: 10 } },
      extra: [{ key: "keep", label: "Keep chakra colours", type: "toggle", def: false }],
      colours: (i) => CHAKRA[i % 7],
      radius: 0.13, flyFrac: 0.55, hold: 120, morphEase: "elastic",
      starts: (i, N, { cx, H }) => [cx, H + 40],
      stagger: (i, N, D) => i * D * 0.06,
      // rise to a spine slot (t < .6), then drift to the wedge centroid
      travel: (i, t, s, e, { cx, cy, size, N }) => {
        const slot = [cx, cy + size * 0.42 - (i / (N - 1)) * size * 0.84];
        if (t < 0.6) { const u = t / 0.6; return [cx, lerp(s[1], slot[1], u)]; }
        const u = (t - 0.6) / 0.4; return [lerp(slot[0], e[0], u), lerp(slot[1], e[1], u)];
      },
      flightNote: "rise along the centre line into a 7-slot column (root → crown), then out to the wedges",
    }),
    logoEntry({
      id: "logo-bloom", name: "Logo Ink Bloom",
      blurb: "No travel at all: ink dots bloom from nothing exactly where the wedges will be, overshoot like drops hitting paper, fuse, and morph into the mark. The quietest of the set — good when the splash shouldn't feel like an arrival.",
      defaults: { duration: { def: 800 }, easing: { def: "ease-out-back" }, goo: { def: 10 } },
      flyFrac: 0.4, radius: 0.17,
      starts: (i, N, ctx, end) => end,
      grow: (t) => Math.max(0.02, t),
      stagger: (i, N, D) => (i % 3) * D * 0.05,
      flightNote: "no travel — each blob scales 0 → 1 in place (ease-out-back overshoot), then morphs",
    }),
    logoEntry({
      id: "logo-spiral", name: "Logo Spiral",
      blurb: "A ring of blobs orbits inward — one and a half turns while the radius tightens — matching the swirl's own spiral, then snaps into the wedges. The mark's geometry explained by its own entrance. Reverse unwinds it back out.",
      defaults: { duration: { def: 1300 }, easing: { def: "ease-out-quint" }, goo: { def: 8 } },
      extra: [{ key: "turns", label: "Turns", type: "range", min: 0.5, max: 2.5, step: 0.25, def: 1.5 }],
      flyFrac: 0.6, morphEase: "elastic",
      starts: (i, N, { cx, cy, size }) => { const a = (i / N) * Math.PI * 2; return [cx + Math.cos(a) * size * 1.4, cy + Math.sin(a) * size * 1.4]; },
      travel: (i, t, s, e, { cx, cy, v }) => {
        const a0 = Math.atan2(s[1] - cy, s[0] - cx), r0 = Math.hypot(s[0] - cx, s[1] - cy);
        const a1 = Math.atan2(e[1] - cy, e[0] - cx), r1 = Math.hypot(e[0] - cx, e[1] - cy);
        const a = a0 + (v.turns * Math.PI * 2) * t + ((a1 - a0 + Math.PI * 3) % (Math.PI * 2) - Math.PI) * t;
        const r = lerp(r0, r1, t);
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      },
      flightNote: "polar path — angle winds `turns` × 360° while the radius shrinks to the wedge centroid",
    }),
  ];


  /* ── Logo Splash engine ─────────────────────────────────────────────────────
     Cel-splash splash screens, after the Scribble / Behance / "Nice" liquid
     references: a liquid mass arrives (drop, swoosh, burst, or a drawn stroke),
     the GROUND FLIPS colour as a liquid flood passes, droplets fly, and the
     mass morphs into the mark in the inverted colour. Then the login buttons
     arrive — this is the cold-start moment before any UI exists.          */
  const rnd = (a, b) => a + Math.random() * (b - a);
  function liquidPts(cx, cy, r, wob, phase, K = 48) {
    const pts = [];
    for (let i = 0; i < K; i++) {
      const a = (i / K) * Math.PI * 2;
      const rr = r * (1 + wob * (0.5 * Math.sin(3 * a + phase) + 0.3 * Math.sin(5 * a - phase * 1.7) + 0.2 * Math.sin(8 * a + phase * 0.6)));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
  }
  const polyCss = (pts) => `polygon(${pts.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(",")})`;
  // Rising wave: a polygon from a wavy top edge at `level` (0 = top, 1 = bottom) down to the bottom.
  function wavePts(W, H, level, amp, phase, K = 24) {
    const y0 = H * level, pts = [];
    for (let i = 0; i <= K; i++) { const x = (i / K) * W; pts.push([x, y0 + Math.sin((i / K) * Math.PI * 3 + phase) * amp + Math.sin((i / K) * Math.PI * 7 - phase * 1.3) * amp * 0.4]); }
    pts.push([W, H + 10], [0, H + 10]);
    return pts;
  }
  const ellipsePts = (cx, cy, rx, ry, n, rot = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; });

  // Droplet system: tiny circles under gravity, drawn into an SVG <g>.
  function dropletSystem(g, colour) {
    const D = [];
    const sys = {
      colour,
      spawn(x, y, n, { speed = 300, dir = -Math.PI / 2, spread = Math.PI, r = [2, 6], life = 700 } = {}) {
        for (let i = 0; i < n; i++) {
          const a = dir + rnd(-spread / 2, spread / 2), s = speed * rnd(0.4, 1.1);
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("fill", sys.colour); g.appendChild(c);
          D.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rnd(r[0], r[1]), t: 0, life: life * rnd(0.6, 1.2), el: c, home: null });
        }
      },
      // pull every droplet toward a point (burst-and-gather)
      gather(x, y) { D.forEach((d) => { d.home = [x, y]; }); },
      step(dt, gravity = 900) {
        for (let i = D.length - 1; i >= 0; i--) {
          const d = D[i]; d.t += dt;
          if (d.home) { const k = 1 - Math.exp(-dt / 0.12); d.vx = (d.home[0] - d.x) / 0.18 * k + d.vx * (1 - k); d.vy = (d.home[1] - d.y) / 0.18 * k + d.vy * (1 - k); }
          else d.vy += gravity * dt;
          d.x += d.vx * dt; d.y += d.vy * dt;
          const u = d.t / (d.life / 1000), rr = d.home ? d.r * (1 - u * 0.4) : d.r * Math.max(0, 1 - u);
          if (u >= 1 || (d.home && Math.hypot(d.home[0] - d.x, d.home[1] - d.y) < 6)) { d.el.remove(); D.splice(i, 1); continue; }
          d.el.setAttribute("cx", d.x.toFixed(1)); d.el.setAttribute("cy", d.y.toFixed(1)); d.el.setAttribute("r", rr.toFixed(1));
        }
      },
      clear() { D.forEach((d) => d.el.remove()); D.length = 0; },
      get count() { return D.length; },
    };
    return sys;
  }
  // Run `fn(dt)` every frame for `ms`; resolves when done. Shares the run token so replays cancel it.
  function loopFor(ms, fn, alive) {
    return new Promise((res) => { let last = performance.now(); const t0 = last;
      const step = (now) => { if (!alive()) return res(); fn(Math.min(0.05, (now - last) / 1000)); last = now; if (now - t0 < ms) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step); });
  }

  const SPLASH_CONTROLS = (over = {}) => [
    { key: "duration", label: "Duration",  type: "range",  min: 700, max: 3000, step: 10, def: 1500, unit: "ms" },
    { key: "size",     label: "Mark size", type: "range",  min: 100, max: 240, step: 10, def: 160, unit: "px" },
    { key: "ink",      label: "Ink",       type: "select", options: Object.keys(LOGO_INKS), def: "purple on tan" },
    { key: "flood",    label: "Ground flip", type: "select", options: ["ripple", "wave", "none"], def: "ripple" },
    { key: "drops",    label: "Droplets",  type: "range",  min: 0, max: 40, step: 1, def: 16 },
    { key: "buttons",  label: "Then login buttons", type: "toggle", def: true },
    { key: "reduced",  label: "Reduced-motion fallback", type: "toggle", def: false },
  ].map((c) => ({ ...c, ...(over[c.key] || {}) }));

  function splashEntry(cfg) {
    const priv = Object.fromEntries(Object.entries(cfg).filter(([k]) => k.startsWith("_")));
    return {
      ...priv,
      id: cfg.id, name: cfg.name, blurb: cfg.blurb,
      controls: SPLASH_CONTROLS(cfg.defaults || {}).concat(cfg.extra || []),
      rest(A, B, v, dir) {
        A.style.display = "none";
        const [ink, ground] = LOGO_INKS[v.ink], { W, H } = stageSize(B), cx = W / 2, cy = H / 2 - (v.buttons ? 18 : 0);
        B.style.cssText += `;background:${ground};`;
        const flip = v.flood !== "none";
        const markCol = flip ? ground : ink, btnBg = flip ? ground : ink, btnFg = flip ? ink : ground;
        B.innerHTML =
          `<div id="flood" style="position:absolute;inset:0;background:${ink};clip-path:${v.flood === "wave" ? polyCss(wavePts(W, H, 1.1, 0, 0)) : polyCss(liquidPts(cx, cy, 0, 0, 0))};will-change:clip-path;"></div>
           <svg id="sp" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;overflow:visible;">
             <defs><filter id="goo3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>
               <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></defs>
             <g id="wet" filter="url(#goo3)"><g id="drops"></g><polygon id="mass" fill="${ink}" points="${ptsStr(ellipsePts(cx, -200, 1, 1, 8))}"/></g>
           </svg>
           <svg id="mark" viewBox="0 0 100 100" style="position:absolute;left:${cx - v.size / 2}px;top:${cy - v.size / 2}px;width:${v.size}px;height:${v.size}px;opacity:0;"><path d="${SWIRL_D}" fill="${markCol}"/></svg>
           <div id="btns" style="position:absolute;left:50%;top:${cy + v.size / 2 + 16}px;transform:translateX(-50%);display:flex;gap:10px;opacity:0;">
             <div style="padding:9px 22px;border-radius:999px;background:${btnBg};color:${btnFg};font-weight:700;font-size:12px;">Log in</div>
             <div style="padding:9px 22px;border-radius:999px;border:1.5px solid ${btnBg};color:${btnBg};font-weight:700;font-size:12px;">Sign up</div>
           </div>`;
        this._s = { ink, ground, W, H, cx, cy, flip, markCol };
        if (dir === -1) { B.querySelector("#mark").style.opacity = 1; B.querySelector("#btns").style.opacity = v.buttons ? 1 : 0;
          if (flip) B.querySelector("#flood").style.clipPath = v.flood === "wave" ? polyCss(wavePts(W, H, -0.2, 0, 0)) : polyCss(liquidPts(cx, cy, Math.hypot(W, H), 0, 0)); }
      },
      async apply(A, B, dir, v) {
        const s = this._s, run = this._run = Symbol(), alive = () => this._run === run;
        const mark = B.querySelector("#mark"), btns = B.querySelector("#btns"), flood = B.querySelector("#flood"), mass = B.querySelector("#mass");
        const drops = dropletSystem(B.querySelector("#drops"), s.ink);
        if (v.reduced) { mark.animate({ opacity: dir === 1 ? [0, 1] : [1, 0] }, { duration: 350, fill: "forwards" }); if (v.buttons) btns.animate({ opacity: dir === 1 ? [0, 1] : [1, 0] }, { duration: 350, delay: 200, fill: "forwards" }); return; }
        const D = v.duration, R = Math.hypot(s.W, s.H) * 0.75;
        // ground flip: liquid ripple from (x, y) or a wave rising from the bottom; mass + droplets recolour as it passes
        const doFlood = (x, y, ms) => {
          if (!s.flip) return Promise.resolve();
          const recolour = (t) => { const c = mixT(s.ink, s.ground, Math.min(1, t * 1.4)); mass.setAttribute("fill", c); B.querySelectorAll("#mass2").forEach((h) => h.setAttribute("fill", c)); drops.colour = c; B.querySelectorAll("#drops circle").forEach((d) => d.setAttribute("fill", c)); };
          return tween(ms, EASE_FN["ease-in-out"], (t) => {
            flood.style.clipPath = v.flood === "wave" ? polyCss(wavePts(s.W, s.H, 1.05 - 1.3 * t, 14 * (1 - t * 0.7), t * 9)) : polyCss(liquidPts(x, y, 4 + R * t, 0.25 * (1 - t), t * 7));
            recolour(t);
          });
        };
        const settle = async () => {   // crisp mark in, liquid out, buttons cascade
          mark.animate({ opacity: [0, 1] }, { duration: 140, fill: "forwards" });
          await tween(220, EASE_FN["ease-in-out"], (t) => mass.setAttribute("opacity", 1 - t), { delay: 120 });
          if (v.buttons) btns.animate({ opacity: [0, 1], transform: ["translate(-50%, 14px)", "translate(-50%, 0)"] }, { duration: Math.max(200, D * 0.18), easing: EASINGS["ease-out-quint"], fill: "forwards" });
        };
        const ctx = { s, v, D, mark, btns, flood, mass, drops, doFlood, settle, alive, B };
        const dropLoop = loopFor(D * 1.2, (dt) => drops.step(dt), alive);   // droplets live for the whole entrance
        if (dir === 1) { await cfg.enter(ctx); }
        else {
          // reverse: buttons out, mark melts to a drop that falls away, flood drains back
          if (v.buttons) btns.animate({ opacity: [1, 0], transform: ["translate(-50%, 0)", "translate(-50%, 10px)"] }, { duration: 200, fill: "forwards" });
          const K = 96, outline = swirlPoints(K, v.size, s.cx, s.cy), ball = ellipsePts(s.cx, s.cy, v.size * 0.2, v.size * 0.2, K);
          mass.setAttribute("fill", s.markCol); mass.setAttribute("opacity", 1); mass.setAttribute("points", ptsStr(outline));
          mark.animate({ opacity: [1, 0] }, { duration: 120, fill: "forwards" });
          await tween(D * 0.3, EASE_FN["ease-in-out"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(outline, ball, t))));
          if (!alive()) return;
          drops.spawn(s.cx, s.cy, v.drops, { speed: 220, dir: -Math.PI / 2, spread: Math.PI * 1.2, life: 600 });
          await Promise.all([
            tween(D * 0.3, EASE_FN["ease-in"], (t) => alive() && mass.setAttribute("points", ptsStr(ellipsePts(s.cx, lerp(s.cy, s.H + v.size, t), v.size * 0.2 * (1 - t * 0.3), v.size * 0.2 * (1 + t * 0.6), K)))),
            s.flip ? tween(D * 0.4, EASE_FN["ease-in-out"], (t) => { if (!alive()) return; flood.style.clipPath = v.flood === "wave" ? polyCss(wavePts(s.W, s.H, -0.25 + 1.3 * t, 12, t * 7)) : polyCss(liquidPts(s.cx, s.cy, R * (1 - t), 0.2 * t, t * 5)); }) : Promise.resolve(),
          ]);
        }
        await dropLoop; drops.clear();
      },
      snippet(v) { return cfg.snippet ? cfg.snippet(v) : splashSnippet(v, cfg); },
    };
  }
  function splashSnippet(v, cfg) {
    return (
  `// Splash screen choreography (${cfg.name}) — ${(v.duration / 1000).toFixed(1)}s total, before any UI exists.
  // Layers (bottom → top): ground · #flood (next ground colour, clip-path liquid) · <svg> liquid mass + droplets under a gooey filter · crisp <path> · buttons
  ${cfg.steps.map((st, i) => `// ${i + 1}. ${st}`).join("\n")}
  //
  // Ground flip = clip-path tween on a full-bleed div in the NEXT colour:
  //   ripple: polygon(48 pts around the impact point, radius 0 → 75% of the diagonal, rim wobble fading)
  //   wave:   polygon(24-pt sine top edge rising from the bottom, amplitude 14 → 4)
  // The liquid mass is one <polygon> (${v.size * 0.2 | 0}px ellipse → 96-pt mark outline, elastic) that recolours
  // ink → ground as the flood passes, so it ends in the INVERTED colour. Droplets: tiny <circle>s under gravity.
  // Reduced motion: fade the <path> in (350ms), buttons after 200ms. Nothing else.
  // Port: keep this as a small rAF module (as in the playground), or author the mass in Rive/Lottie and keep only
  // the flood + buttons in Motion: <motion.div animate={{ clipPath }} /> and the buttons' staggered fade.`
    );
  }

  const LOGO_SPLASH = [
    splashEntry({
      id: "splash-drop", name: "Splash · Drop & Flip",
      blurb: "A drop of ink falls from the top. On impact it squashes, droplets fly, and the ground FLIPS to the ink colour as a liquid ripple spreads from the splash — the drop itself becomes the mark in the old ground colour. Then the login buttons arrive. The cold-start moment, before any UI.",
      defaults: { duration: { def: 1600 } },
      steps: ["fall (28%): ellipse stretches as it drops, ease-in (gravity)", "impact (8%): squash wide, burst droplets upward, start the ground flip", "morph (36%): ellipse → mark outline, elastic", "settle: crisp path in, liquid out, buttons cascade"],
      async enter({ s, v, D, mass, drops, doFlood, settle, alive }) {
        const K = 96, r = v.size * 0.2, outline = swirlPoints(K, v.size, s.cx, s.cy);
        await tween(D * 0.28, EASE_FN["ease-in"], (t) => alive() && mass.setAttribute("points", ptsStr(ellipsePts(s.cx, lerp(-r * 2, s.cy, t), r * (1 - t * 0.2), r * (1 + t * 0.35), K))));
        if (!alive()) return;
        drops.spawn(s.cx, s.cy + r * 0.6, v.drops, { speed: 320, dir: -Math.PI / 2, spread: Math.PI * 1.1, life: 650 });
        const flood = doFlood(s.cx, s.cy, D * 0.4);
        await tween(D * 0.08, EASE_FN["ease-out-back"], (t) => alive() && mass.setAttribute("points", ptsStr(ellipsePts(s.cx, s.cy + r * 0.3 * t, r * lerp(1, 1.5, t), r * lerp(1.35, 0.6, t), K))));
        if (!alive()) return;
        const squashed = ellipsePts(s.cx, s.cy + r * 0.3, r * 1.5, r * 0.6, K);
        await tween(D * 0.36, EASE_FN["elastic"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(squashed, outline, t))));
        await flood; if (!alive()) return;
        await settle();
      },
    }),

    splashEntry({
      id: "splash-swoosh", name: "Splash · Swoosh (Behance)",
      blurb: "After the Behance reference: first a liquid wave rises from the bottom and flips the ground, then the mark arrives as a stretched liquid mass arcing in from the top-left with a trail of droplets, lands, splashes, and settles. Set the flip to 'wave' for the faithful version.",
      defaults: { duration: { def: 1800 }, flood: { def: "wave" }, drops: { def: 22 } },
      steps: ["wave (25%): ground flips bottom → top", "swoosh (35%): mass follows a bezier arc from top-left, stretched along its tangent, shedding droplets", "impact (8%): squash + burst", "morph (24%): → mark outline, elastic", "settle + buttons"],
      async enter({ s, v, D, mass, drops, doFlood, settle, alive }) {
        const K = 96, r = v.size * 0.2, outline = swirlPoints(K, v.size, s.cx, s.cy);
        await doFlood(s.cx, s.H, D * 0.25); if (!alive()) return;
        const P0 = [-r * 2, s.H * 0.15], P1 = [s.W * 0.55, -s.H * 0.35], P2 = [s.cx, s.cy];
        const bez = (t) => [ (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1] ];
        let lastSpawn = 0, prev = bez(0);
        await tween(D * 0.35, EASE_FN["ease-in-out"], (t) => {
          if (!alive()) return;
          const p = bez(t), ang = Math.atan2(p[1] - prev[1], p[0] - prev[0]) || 0, speed = Math.hypot(p[0] - prev[0], p[1] - prev[1]);
          const stretch = Math.min(1.9, 1 + speed * 0.08);
          mass.setAttribute("points", ptsStr(ellipsePts(p[0], p[1], r * stretch, r / Math.sqrt(stretch), K, ang)));
          if (t - lastSpawn > 0.06 && t < 0.9) { lastSpawn = t; drops.spawn(p[0] - Math.cos(ang) * r, p[1] - Math.sin(ang) * r, Math.max(1, v.drops / 8 | 0), { speed: 120, dir: ang + Math.PI, spread: 1.2, r: [1.5, 4], life: 500 }); }
          prev = p;
        });
        if (!alive()) return;
        drops.spawn(s.cx, s.cy, v.drops, { speed: 300, dir: -Math.PI / 2, spread: Math.PI * 1.3, life: 600 });
        const squashed = ellipsePts(s.cx, s.cy + r * 0.2, r * 1.6, r * 0.6, K);
        await tween(D * 0.08, EASE_FN["ease-out-back"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(ellipsePts(s.cx, s.cy, r * 1.2, r * 0.9, K), squashed, t))));
        if (!alive()) return;
        await tween(D * 0.24, EASE_FN["elastic"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(squashed, outline, t))));
        if (!alive()) return;
        await settle();
      },
    }),

    splashEntry({
      id: "splash-burst", name: "Splash · Burst & Gather",
      blurb: "After the 'Nice' cel splash: a dot pops at the centre and bursts into a ring of droplets, the ground flips in the ring's wake, then the droplets are pulled back in and gather into a growing mass that morphs into the mark. The liquid goes out and comes back as the logo.",
      defaults: { duration: { def: 1700 }, drops: { def: 28 } },
      steps: ["pop (10%): dot grows with overshoot", "burst (25%): ring of droplets outward, flood ripple follows", "gather (30%): droplets pulled back, mass grows as they land", "morph (25%): → mark, elastic", "settle + buttons"],
      async enter({ s, v, D, mass, drops, doFlood, settle, alive }) {
        const K = 96, r = v.size * 0.2, outline = swirlPoints(K, v.size, s.cx, s.cy);
        await tween(D * 0.1, EASE_FN["ease-out-back"], (t) => alive() && mass.setAttribute("points", ptsStr(ellipsePts(s.cx, s.cy, r * 0.5 * t, r * 0.5 * t, K))));
        if (!alive()) return;
        drops.spawn(s.cx, s.cy, v.drops, { speed: 420, dir: 0, spread: Math.PI * 2, r: [3, 8], life: 1400 });
        const flood = doFlood(s.cx, s.cy, D * 0.35);
        await tween(D * 0.25, EASE_FN["ease-out-quint"], (t) => alive() && mass.setAttribute("points", ptsStr(ellipsePts(s.cx, s.cy, r * (0.5 - 0.4 * t), r * (0.5 - 0.4 * t), K))));
        if (!alive()) return;
        drops.gather(s.cx, s.cy);
        await tween(D * 0.3, EASE_FN["ease-in-out"], (t) => alive() && mass.setAttribute("points", ptsStr(liquidPts(s.cx, s.cy, r * (0.1 + 0.9 * t), 0.12 * (1 - t) + 0.04, t * 8, K))));
        if (!alive()) return;
        const ball = liquidPts(s.cx, s.cy, r, 0.04, 8, K);
        await tween(D * 0.25, EASE_FN["elastic"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(ball, outline, t))));
        await flood; if (!alive()) return;
        await settle();
      },
    }),

    splashEntry({
      id: "splash-writeon", name: "Logo Write-On (Scribble)",
      blurb: "After the Scribble reference: a hand-drawn liquid stroke draws the mark as a spiral — thin inside, thick outside, a bulb at the leading tip shedding droplets, with a frame-by-frame 'boil' jitter so it reads as drawn, not plotted. The crisp vector takes over at the end. Ground flip optional (off by default).",
      defaults: { duration: { def: 1700 }, flood: { def: "none" }, drops: { def: 10 } },
      extra: [
        { key: "boil",  label: "Hand-drawn boil", type: "range", min: 0, max: 4, step: 0.5, def: 1.5, unit: "px" },
        { key: "turns", label: "Spiral turns", type: "range", min: 1.5, max: 3, step: 0.25, def: 2.25 },
      ],
      steps: ["draw (72%): tapered stroke polygon grows along a spiral centreline; boil re-seeds every ~100ms; droplets shed from the tip", "flip (optional): wave flood at 60%", "settle: crisp path crossfades over the drawn stroke, buttons cascade"],
      // Spiral centreline approximating the swirl, in viewBox units (0–100).
      _spiral(turns, n = 160) {
        const pts = [], total = turns * Math.PI * 2;
        for (let i = 0; i < n; i++) {
          const u = i / (n - 1), th = u * total;
          const r = Math.min(45, 5 + 40 * Math.pow(u, 0.75) * (total / (Math.PI * 2)) / 1.6);
          pts.push([48 + Math.cos(-th) * r, 48 + Math.sin(-th) * r]);
        }
        return pts;
      },
      _stroke(C, upto, widthAt, head, boil, seed) {
        const L = [], Rr = [], n = Math.max(2, Math.min(C.length, Math.ceil(upto)));
        let rs = seed;
        const noise = () => { rs = (rs * 9301 + 49297) % 233280; return rs / 233280 - 0.5; };
        for (let i = 0; i < n; i++) {
          const p = C[i], q = C[Math.min(C.length - 1, i + 1)], pp = C[Math.max(0, i - 1)];
          const tx = q[0] - pp[0], ty = q[1] - pp[1], len = Math.hypot(tx, ty) || 1, nx = -ty / len, ny = tx / len;
          const headK = Math.max(0, 1 - (n - 1 - i) / 7), w = (widthAt(i / (C.length - 1)) * (1 + head * headK * headK) + noise() * boil) / 2;
          L.push([p[0] + nx * w + noise() * boil, p[1] + ny * w + noise() * boil]); Rr.push([p[0] - nx * w + noise() * boil, p[1] - ny * w + noise() * boil]);
        }
        return L.concat(Rr.reverse());
      },
      async enter({ s, v, D, mass, drops, doFlood, settle, alive, B }) {
        const sc = v.size / 100, C = this._spiral(v.turns).map((p) => [s.cx + (p[0] - 50) * sc, s.cy + (p[1] - 50) * sc]);
        const widthAt = (u) => (5 + 7 * u) * sc, N = C.length;
        B.querySelector("#wet").removeAttribute("filter");               // a drawn stroke should stay crisp-edged
        let seed = 1, lastSeed = 0, lastSpawn = 0, flooded = false;
        await tween(D * 0.72, EASE_FN["ease-in-out"], (t) => {
          if (!alive()) return;
          const now = performance.now(); if (now - lastSeed > 100) { seed = (now | 0) % 1000 + 1; lastSeed = now; }
          const upto = 2 + t * (N - 2);
          mass.setAttribute("points", ptsStr(this._stroke(C, upto, widthAt, 0.9, v.boil, seed)));
          const head = C[Math.min(N - 1, Math.floor(upto))], prev = C[Math.max(0, Math.floor(upto) - 3)];
          if (t - lastSpawn > 0.09 && t > 0.1 && t < 0.95) { lastSpawn = t; const ang = Math.atan2(head[1] - prev[1], head[0] - prev[0]); drops.spawn(head[0], head[1], Math.max(1, v.drops / 6 | 0), { speed: 140, dir: ang, spread: 1.6, r: [1.5, 3.5], life: 450 }); }
          if (!flooded && t > 0.6 && s.flip) { flooded = true; doFlood(s.cx, s.H, D * 0.3); }
        });
        if (!alive()) return;
        await settle();
      },
    }),

    splashEntry({
      id: "splash-heavens", name: "Splash · From the Heavens",
      blurb: "Ether = the heavens, the space beyond the atmosphere. The ground deepens to night, a scatter of stars fades in and twinkles, then the stars drift together into a constellation of the mark; the mark fills between them with a soft glow, and the sky stays. Quiet, no splash — the brand's meaning as the entrance.",
      defaults: { duration: { def: 2200 }, flood: { def: "none" }, drops: { def: 0 }, ink: { def: "white on purple" } },
      extra: [
        { key: "stars", label: "Stars", type: "range", min: 24, max: 120, step: 4, def: 64 },
        { key: "night", label: "Night colour", type: "select", options: ["deep indigo", "ink black", "keep ground"], def: "deep indigo" },
      ],
      steps: ["night (25%): ground deepens; stars fade in at random, twinkling", "gather (40%): each star drifts (ease-in-out) to a point on the mark's outline — a constellation", "fill (20%): the outline polygon fades in between the stars, soft glow", "settle: crisp path + glow, stars dim to 40%, buttons cascade"],
      async enter({ s, v, D, mass, settle, alive, B }) {
        const night = { "deep indigo": "#0f0a2a", "ink black": "#07060c", "keep ground": s.ground }[v.night];
        const g = B.querySelector("#drops"), wet = B.querySelector("#wet"); wet.removeAttribute("filter");
        const K = 96, outline = swirlPoints(K, v.size, s.cx, s.cy);
        const targets = Array.from({ length: v.stars }, (_, i) => outline[Math.floor(i * K / v.stars) % K]);
        const stars = targets.map(() => { const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("fill", s.ink); c.setAttribute("r", rnd(0.8, 2.2).toFixed(1)); c.setAttribute("opacity", 0); g.appendChild(c);
          return { el: c, x: rnd(10, s.W - 10), y: rnd(10, s.H - 10), ph: rnd(0, 6.28), sp: rnd(2, 5) }; });
        B.animate({ backgroundColor: [s.ground, night] }, { duration: D * 0.3, easing: EASINGS["ease-in-out"], fill: "forwards" });
        mass.setAttribute("fill", s.ink); mass.setAttribute("opacity", 0); mass.setAttribute("points", ptsStr(outline));
        const twinkle = (st, t, base) => st.el.setAttribute("opacity", (base * (0.55 + 0.45 * Math.sin(t * st.sp + st.ph))).toFixed(2));
        await tween(D * 0.25, EASE_FN["ease-in-out"], (t) => { if (!alive()) return; stars.forEach((st, i) => { st.el.setAttribute("cx", st.x); st.el.setAttribute("cy", st.y); twinkle(st, t * 6, Math.min(1, Math.max(0, t * 1.6 - i / stars.length * 0.6))); }); });
        if (!alive()) return;
        await tween(D * 0.4, EASE_FN["ease-in-out"], (t) => { if (!alive()) return; stars.forEach((st, i) => { const [tx, ty] = targets[i]; st.el.setAttribute("cx", lerp(st.x, tx, t).toFixed(1)); st.el.setAttribute("cy", lerp(st.y, ty, t).toFixed(1)); twinkle(st, 6 + t * 6, 1); }); });
        if (!alive()) return;
        mass.style.filter = `drop-shadow(0 0 ${v.size * 0.08}px ${s.ink}88)`;
        await tween(D * 0.2, EASE_FN["ease-in-out"], (t) => { if (!alive()) return; mass.setAttribute("opacity", t.toFixed(2)); stars.forEach((st, i) => twinkle(st, 12 + t * 4, 1 - t * 0.6)); });
        if (!alive()) return;
        B.querySelector("#mark").style.filter = `drop-shadow(0 0 ${v.size * 0.1}px ${s.ink}66)`;
        await settle();
      },
    }),
  ];


  /* ── Comet engine (Scribble/Behance liquid treatment) ──────────────────────
     One vector blob: a bigger head in front, a long pointy tail built from
     its own recent path, little ink squirts shed off the tail, and every
     frame the outline is wobbled a touch (hand-drawn boil) so it never reads
     as a plotted shape. It flies a spline path, lands, splashes, and morphs
     into the mark. Ground can flip before the entrance (Behance: a wave
     rises first) or at impact (ripple), in either ink/ground pairing.       */

  // Catmull-Rom through waypoints → dense polyline with even arc-length spacing.
  function spline(way, samples = 400) {
    const P = [way[0], ...way, way[way.length - 1]], raw = [];
    for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t, [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      raw.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
    raw.push(way[way.length - 1]);
    const cum = [0]; for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    const L = cum[cum.length - 1], out = [];
    for (let s = 0, j = 0; s < samples; s++) { const d = (s / (samples - 1)) * L; while (j < cum.length - 2 && cum[j + 1] < d) j++;
      const u = (d - cum[j]) / ((cum[j + 1] - cum[j]) || 1); out.push([lerp(raw[j][0], raw[j + 1][0], u), lerp(raw[j][1], raw[j + 1][1], u)]); }
    return out;
  }
  // Blob outline from a head position + a trail of past positions (newest first).
  function cometPts(head, ang, rh, trail, tailW, boil, seed) {
    let rs = seed; const nz = () => { rs = (rs * 9301 + 49297) % 233280; return (rs / 233280 - 0.5) * boil; };
    const L = [], R = [];
    for (let i = trail.length - 1; i >= 0; i--) {              // tail end → head
      const p = trail[i], q = trail[Math.max(0, i - 1)], u = i / Math.max(1, trail.length - 1);
      const tx = q[0] - p[0], ty = q[1] - p[1], len = Math.hypot(tx, ty) || 1, nx = -ty / len, ny = tx / len;
      const w = rh * tailW * Math.pow(1 - u, 1.4) + 0.6;
      L.push([p[0] + nx * w + nz(), p[1] + ny * w + nz()]); R.push([p[0] - nx * w + nz(), p[1] - ny * w + nz()]);
    }
    const arc = [];                                               // head: arc from the left normal round the front to the right normal
    for (let k = 0; k <= 16; k++) { const a = ang - Math.PI / 2 + (k / 16) * Math.PI; arc.push([head[0] + Math.cos(a) * rh * 1.08 + nz(), head[1] + Math.sin(a) * rh + nz()]); }
    // L is left side (ang - 90°). Walk: tail-end → head along L, head arc, head → tail-end along R reversed.
    return L.concat(arc, R.reverse());
  }

  // cfg: way (fractions of W/H), flyFrac, flipWhen "before"|"impact"|"none", head (× size), tail (ms), tailW, boil (px),
  //      squirt (per s), ease, loopHold, ink default, flood default
  async function runComet(ctx, cfg) {
    const { s, v, D, mass, drops, doFlood, settle, alive, B } = ctx;
    if (cfg.crisp === false) B.querySelector("#wet").removeAttribute("filter");
    const K = 96, outline = swirlPoints(K, v.size, s.cx, s.cy), rh = v.size * (v.head / 100);
    const way = cfg.way.map(([x, y]) => [x * s.W, y * s.H]); way.push([s.cx, s.cy - rh * 0.2]);
    const path = spline(way), N = path.length;
    let pre = Promise.resolve();
    if (cfg.flipWhen === "before" && s.flip) { pre = doFlood(s.cx, s.H, D * cfg.floodFrac); if (!cfg.concurrent) { await pre; if (!alive()) return; } }
    const trail = []; let seed = 7, lastSeed = 0, squirtAcc = 0, lastP = path[0], lastNow = performance.now();
    const flyMs = D * cfg.flyFrac;
    await tween(flyMs, EASE_FN[v.flyEase], (t) => {
      if (!alive()) return;
      const now = performance.now(), dt = (now - lastNow) / 1000; lastNow = now;
      if (now - lastSeed > v.boilFps) { seed = (now | 0) % 997 + 1; lastSeed = now; }
      const p = path[Math.min(N - 1, Math.floor(t * (N - 1)))];
      trail.unshift([p[0], p[1], now]); while (trail.length && now - trail[trail.length - 1][2] > v.tail) trail.pop();
      const ang = Math.atan2(p[1] - lastP[1], p[0] - lastP[0]) || 0; lastP = p;
      mass.setAttribute("points", ptsStr(cometPts(p, ang, rh, trail.length > 2 ? trail : [[p[0], p[1]], [p[0] - 1, p[1]]], v.tailW / 100, v.boil, seed)));
      squirtAcc += v.squirt * dt;                                  // squirts: off the tail, backwards, low gravity
      while (squirtAcc >= 1) { squirtAcc -= 1; const tp = trail[Math.min(trail.length - 1, 4 + (Math.random() * 6 | 0))] || p;
        drops.spawn(tp[0], tp[1], 1, { speed: 90, dir: ang + Math.PI + rnd(-0.9, 0.9), spread: 0.6, r: [1.2, 3.2], life: 450 }); }
    });
    if (!alive()) return;
    // impact: tail collapses into the head, squash, burst, optional ripple flip
    const land = [s.cx, s.cy];
    drops.spawn(land[0], land[1] + rh * 0.5, v.drops, { speed: 260, dir: -Math.PI / 2, spread: Math.PI * 1.2, r: [1.5, 5], life: 600 });
    const flood = cfg.flipWhen === "impact" && s.flip ? doFlood(land[0], land[1], D * cfg.floodFrac) : Promise.resolve();
    const from = cometPts(land, -Math.PI / 2, rh, trail.slice(0, 8), v.tailW / 100, 0, 1);
    const squashed = ellipsePts(land[0], land[1] + rh * 0.25, rh * 1.45, rh * 0.62, from.length);
    await tween(D * 0.07, EASE_FN["ease-out-back"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(from, squashed, t))));
    if (!alive()) return;
    const ball = ellipsePts(land[0], land[1] + rh * 0.25, rh * 1.45, rh * 0.62, K);
    let seed2 = 3, last2 = 0;
    await tween(D * (1 - cfg.flyFrac - (cfg.flipWhen === "before" && !cfg.concurrent ? cfg.floodFrac : 0) - 0.07) - 80, EASE_FN[v.morphEase], (t) => {
      if (!alive()) return; const now = performance.now(); if (now - last2 > v.boilFps) { seed2 = (now | 0) % 991 + 1; last2 = now; }
      let rs = seed2; const nz = () => { rs = (rs * 9301 + 49297) % 233280; return (rs / 233280 - 0.5) * v.boil * (1 - t); };
      mass.setAttribute("points", ptsStr(lerpPts(ball, outline, t).map((q) => [q[0] + nz(), q[1] + nz()])));
    });
    await flood; await pre; if (!alive()) return;
    await settle();
  }


  /* ── Behance engine (frame-measured, Dribbble shot 3711930, 15 fps 800×600) ──
     The drop IS the mark: the logo outline flies tilted along the path, stretched
     by speed, shedding mass; its trailing edge melts into finger drips that break
     into droplets. Wipe first (wave rises from the bottom), enter at the LEFT edge
     mid-height, counter-clockwise loop, drift to upper-centre, then an almost
     instant fall (1 frame ≈ 67 ms) into a vertical column + splash crown, and the
     column becomes the mark. Keys are [x/W, y/H, t-of-flight] = centroids per frame. */
  const BEHANCE_KEYS = [
    [-0.12, 0.28, 0.00], [0.14, 0.45, 0.10], [0.15, 0.41, 0.17], [0.20, 0.38, 0.24], [0.28, 0.42, 0.31],
    [0.39, 0.49, 0.38], [0.62, 0.66, 0.46], [0.82, 0.43, 0.54], [0.79, 0.19, 0.62], [0.73, 0.10, 0.69],
    [0.67, 0.07, 0.77], [0.63, 0.07, 0.85], [0.60, 0.09, 0.92], [0.57, 0.14, 1.00],
  ];
  // Catmull-Rom between keys with the measured per-key timing: pos(t) honours the reference's speed profile.
  function keyedPath(keys, W, H) {
    const P = keys.map(([x, y, t]) => [x * W, y * H, t]);
    const cr = (p0, p1, p2, p3, u) => { const u2 = u * u, u3 = u2 * u; return [0, 1].map((k) =>
      0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3)); };
    return (t) => {
      t = Math.max(0, Math.min(1, t)); let i = 0; while (i < P.length - 2 && P[i + 1][2] <= t) i++;
      const u = (t - P[i][2]) / ((P[i + 1][2] - P[i][2]) || 1);
      return cr(P[Math.max(0, i - 1)], P[i], P[i + 1], P[Math.min(P.length - 1, i + 2)], u);
    };
  }
  // Mark outline (unit, centred) → head polygon at (x, y): tilted so its top leads, stretched along the velocity.
  function markHeadPts(unit, x, y, scale, rotAng, stretch, ang = rotAng) {
    const rot = rotAng + Math.PI / 2, c = Math.cos(rot), sn = Math.sin(rot);
    return unit.map(([ux, uy]) => {
      const rx = (ux * c - uy * sn) * scale, ry = (ux * sn + uy * c) * scale;      // rotate: local -y → velocity
      const va = rx * Math.cos(ang) + ry * Math.sin(ang), vb = -rx * Math.sin(ang) + ry * Math.cos(ang);
      const sa = va * (1 + stretch) - (va < 0 ? stretch * scale * 0.5 : 0), sb = vb / (1 + stretch * 0.35);
      return [x + sa * Math.cos(ang) - sb * Math.sin(ang), y + sa * Math.sin(ang) + sb * Math.cos(ang)];
    });
  }
  async function runBehance(ctx, cfg) {
    const { s, v, D, mass, drops, doFlood, settle, alive, B } = ctx;
    const K = 96, outline = swirlPoints(K, v.size, s.cx, s.cy), unit = swirlPoints(K, 1, 0, 0);
    const head = mass.cloneNode(); head.id = "mass2"; mass.parentNode.appendChild(head);
    const pos = keyedPath(cfg.way || BEHANCE_KEYS, s.W, s.H), rotOf = (a) => (cfg.upright ? -Math.PI / 2 : a);
    const hs0 = v.size * (v.head / 100), shed = cfg.shed ?? 0.55, fallStretch = cfg.fallStretch ?? 0.9;                          // head scale at entry → × shed by the top-edge pass
    // 1. wipe: wave rises from the bottom, ground flips. Reference: 4 frames ≈ 270 ms.
    if (s.flip && cfg.flipWhen === "before") { await doFlood(s.cx, s.H, D * cfg.floodFrac); if (!alive()) return; }
    head.setAttribute("fill", mass.getAttribute("fill"));
    // 2. flight on the measured keys (≈ 12 frames ≈ 800 ms in the reference)
    const trail = []; let seed = 7, lastSeed = 0, fingerAcc = 0, lastP = pos(0), lastNow = performance.now(), ang = 0, vel = 0;
    await tween(D * cfg.flyFrac, EASE_FN[cfg.flyEase || "linear"], (t) => {
      if (!alive()) return;
      const now = performance.now(), dt = Math.max(1e-3, (now - lastNow) / 1000); lastNow = now;
      if (now - lastSeed > v.boilFps) { seed = (now | 0) % 997 + 1; lastSeed = now; }
      const p = pos(t), dx = p[0] - lastP[0], dy = p[1] - lastP[1], sp = Math.hypot(dx, dy) / dt;
      if (sp > 1) ang = Math.atan2(dy, dx); vel = vel + (sp - vel) * 0.35; lastP = p;
      trail.unshift([p[0], p[1], now]); while (trail.length && now - trail[trail.length - 1][2] > v.tail) trail.pop();
      const scale = hs0 * (1 - (1 - shed) * t), stretch = Math.min(0.55, vel / (s.W * 3.2));
      head.setAttribute("points", ptsStr(markHeadPts(unit, p[0], p[1], scale, rotOf(ang), stretch, ang).map((q) => { seed = (seed * 9301 + 49297) % 233280; return [q[0] + (seed / 233280 - 0.5) * v.boil, q[1]]; })));
      // tail: the comet polygon with a small head hidden inside the mark; the goo filter fuses it to the trailing edge
      mass.setAttribute("points", ptsStr(cometPts(p, ang, scale * 0.3, trail.length > 2 ? trail : [[p[0], p[1]], [p[0] - 1, p[1]]], v.tailW / 100, v.boil, seed)));
      // finger drips: shed from the trailing edge, backwards + down, bigger than squirts
      fingerAcc += v.squirt * dt * (0.6 + stretch);
      while (fingerAcc >= 1) { fingerAcc -= 1; const back = ang + Math.PI, bx = p[0] + Math.cos(back) * scale * 0.45 + rnd(-scale * 0.3, scale * 0.3) * Math.sin(ang), by = p[1] + Math.sin(back) * scale * 0.45;
        drops.spawn(bx, by, 1, { speed: 60 + vel * 0.12, dir: back + rnd(-0.5, 0.5), spread: 0.4, r: [2, 5.5], life: 520 }); }
    });
    if (!alive()) return;
    // 3. the fall: 1 reference frame — 65% of the travel in ~70 ms, the rest in the column stretch
    const top = pos(1), land = [s.cx, s.cy], fallMs = Math.max(60, D * 0.03), hsEnd = hs0 * shed;
    await tween(fallMs, EASE_FN["ease-in"], (t) => { if (!alive()) return; const y = lerp(top[1], land[1] - v.size * 0.35, t), x = lerp(top[0], land[0], t);
      head.setAttribute("points", ptsStr(markHeadPts(unit, x, y, hsEnd, rotOf(Math.PI / 2), fallStretch * t, Math.PI / 2)));
      mass.setAttribute("points", ptsStr(ellipsePts(x, y - v.size * 0.25 * t, hsEnd * 0.3, v.size * 0.5 * t * fallStretch + 2, K))); });
    if (!alive()) return;
    // 4. impact: vertical column (ref f43: 154 × 268 px of 800 × 600) + splash crown both sides, then the column becomes the mark
    const col = ellipsePts(land[0], land[1] - v.size * 0.15, v.size * 0.19, v.size * 0.5, K);
    head.setAttribute("points", ptsStr(markHeadPts(unit, land[0], land[1] + v.size * 0.1, hsEnd * 0.9, rotOf(Math.PI / 2), 0)));
    const flood = s.flip && cfg.flipWhen === "impact" ? doFlood(land[0], land[1] + v.size * 0.2, D * cfg.floodFrac) : Promise.resolve();
    drops.spawn(land[0] - v.size * 0.2, land[1] + v.size * 0.2, Math.ceil(v.drops / 2), { speed: 240, dir: -Math.PI * 0.8, spread: 0.9, r: [1.5, 5], life: 600 });
    drops.spawn(land[0] + v.size * 0.2, land[1] + v.size * 0.2, Math.ceil(v.drops / 2), { speed: 240, dir: -Math.PI * 0.2, spread: 0.9, r: [1.5, 5], life: 600 });
    await tween(D * 0.07, EASE_FN["ease-out-back"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(ellipsePts(land[0], land[1] - v.size * 0.35, hsEnd * 0.3, v.size * 0.5, K), col, t))));
    if (!alive()) return;
    // head sinks into the column while the column morphs into the full mark (elastic), boil fading out
    const headStart = markHeadPts(unit, land[0], land[1] + v.size * 0.1, hsEnd * 0.9, rotOf(Math.PI / 2), 0), headEnd = outline;
    let seed2 = 3, last2 = 0;
    await tween(D * (1 - (cfg.flipWhen === "before" ? cfg.floodFrac : 0) - cfg.flyFrac - 0.03 - 0.07) - 80, EASE_FN[v.morphEase], (t) => {
      if (!alive()) return; const now = performance.now(); if (now - last2 > v.boilFps) { seed2 = (now | 0) % 991 + 1; last2 = now; }
      let rs = seed2; const nz = () => { rs = (rs * 9301 + 49297) % 233280; return (rs / 233280 - 0.5) * v.boil * (1 - t); };
      mass.setAttribute("points", ptsStr(lerpPts(col, outline, t).map((q) => [q[0] + nz(), q[1] + nz()])));
      head.setAttribute("points", ptsStr(lerpPts(headStart, headEnd, Math.min(1, t * 1.3))));
    });
    await flood; if (!alive()) return;
    head.remove();
    await settle();
  }

  const COMET_CONTROLS = [
    { key: "head",      label: "Head size",        type: "range",  min: 10, max: 30, step: 1, def: 18, unit: "% of mark" },
    { key: "tail",      label: "Tail length",      type: "range",  min: 80, max: 700, step: 10, def: 320, unit: "ms" },
    { key: "tailW",     label: "Tail thickness",   type: "range",  min: 20, max: 100, step: 5, def: 60, unit: "%" },
    { key: "boil",      label: "Hand-drawn boil",  type: "range",  min: 0, max: 5, step: 0.5, def: 1.5, unit: "px" },
    { key: "boilFps",   label: "Boil re-seed every", type: "range", min: 40, max: 200, step: 10, def: 90, unit: "ms" },
    { key: "squirt",    label: "Ink squirts",      type: "range",  min: 0, max: 60, step: 2, def: 18, unit: "/s" },
    { key: "flyEase",   label: "Flight easing",    type: "select", options: Object.keys(EASE_FN), def: "ease-in-out" },
    { key: "morphEase", label: "Land → mark easing", type: "select", options: Object.keys(EASE_FN), def: "elastic" },
  ];
  function cometEntry(cfg) {
    return splashEntry({
      id: cfg.id, name: cfg.name, blurb: cfg.blurb,
      defaults: { duration: { def: cfg.duration || 2200 }, ink: { def: cfg.ink || "purple on tan" }, flood: { def: cfg.flood || "wave" }, drops: { def: cfg.dropsN ?? 14 }, size: { def: 170 } },
      extra: COMET_CONTROLS.map((c) => ({ ...c, ...((cfg.over || {})[c.key] || {}) })),
      steps: cfg.steps || [`flip (${cfg.flipWhen}) ${cfg.flood || "wave"}`, `fly ${Math.round(cfg.flyFrac * 100)}% along ${cfg.way.length}-point spline: head + tail from path history + squirts + boil`, "impact squash + burst", "morph head → mark (boil fades out)", "settle + buttons"],
      enter: (ctx) => (cfg.engine || runComet)(ctx, cfg),
    });
  }

  const COMETS = [
    cometEntry({
      id: "drop-tan-flip", name: "Drop · Tan → Purple flip",
      blurb: "The brief. Purple ground. A tan drop falls straight from the top — shaped from the references: the mark itself as the head, upright, stretching with speed, finger drips peeling off its top edge into flick droplets, hand-drawn boil. It lands in a column with a splash crown; the ripple flips the ground purple → tan and the drop turns purple as the flood passes under it, then the column becomes the mark. Ends purple on tan.",
      engine: runBehance, duration: 2000, ink: "tan on purple", flood: "ripple", flipWhen: "impact", floodFrac: 0.3, flyFrac: 0.4, flyEase: "ease-in", upright: true, shed: 1, fallStretch: 0.35,
      way: [[0.5, -0.3, 0], [0.5, -0.05, 0.45], [0.5, 0.18, 0.8], [0.5, 0.3, 1]],
      over: { head: { min: 30, max: 100, def: 70 }, tail: { def: 180 }, tailW: { def: 40 }, squirt: { def: 20 }, boil: { def: 1.2 }, flyEase: { def: "ease-in" } },
      steps: ["fall 40% (ease-in = gravity): mark-shaped head, upright, stretched by speed, finger droplets off the top edge, tapered tail", "one-frame drop into a column", "impact 7%: column + splash crown; ripple flips ground purple → tan; drop recolours tan → purple", "column → mark (elastic), head sinks in", "settle + buttons"],
    }),
    cometEntry({
      id: "comet-behance", name: "Comet · Behance Loop",
      blurb: "Frame-measured from the reference (126 frames @ 15 fps). The drop IS the mark: the logo outline flies tilted along the path, stretched by speed, losing mass, its trailing edge melting into finger drips. Wave wipe first (4 frames), then in from the LEFT edge mid-height, counter-clockwise loop, drift to upper-centre, a one-frame fall into a vertical column, splash crown both sides, column → mark. Head size = the mark at 70%; tail thickness and squirts drive the fingers.",
      engine: runBehance, duration: 2400, ink: "purple on tan", flood: "wave", flipWhen: "before", floodFrac: 0.12, flyFrac: 0.42,
      way: BEHANCE_KEYS, over: { head: { min: 30, max: 100, def: 70 }, tail: { def: 140 }, tailW: { def: 45 }, squirt: { def: 22 }, boil: { def: 1 } },
      steps: ["wave wipe 12% (ground flips; ref: 4 frames ≈ 270 ms)", "flight 42% on 14 measured keys [x/W, y/H, t]: mark-shaped head, tilted to velocity, stretched by speed, scale 1 → 0.55, finger droplets off the trailing edge", "fall 3%: one-frame drop into a column", "impact 7%: column + splash crown", "column → mark (elastic), head sinks in", "settle + buttons"],
    }),
    cometEntry({
      id: "comet-behance-swap", name: "Comet · Behance Loop, swapped",
      blurb: "Same measured loop, inks swapped: purple ground, the wave flips it to tan, and a purple mark-shaped comet does the loop. Compare how much heavier the purple mass reads on tan than the tan mass on purple.",
      engine: runBehance, duration: 2400, ink: "tan on purple", flood: "wave", flipWhen: "before", floodFrac: 0.12, flyFrac: 0.42,
      way: BEHANCE_KEYS, over: { head: { min: 30, max: 100, def: 70 }, tail: { def: 140 }, tailW: { def: 45 }, squirt: { def: 22 }, boil: { def: 1 } },
    }),
    cometEntry({
      id: "comet-drop", name: "Comet · Straight Drop",
      blurb: "Your brief, as a comet: it falls straight from the top with a long pointy tail stretching back up, lands, and the ripple flips the ground at impact — the mark ends in the old ground colour. Purple on tan. Minimal path, maximum tail.",
      duration: 1700, ink: "purple on tan", flood: "ripple", flipWhen: "impact", floodFrac: 0.35, flyFrac: 0.4,
      way: [[0.5, -0.25], [0.5, 0.1]], over: { tail: { def: 520 }, tailW: { def: 45 }, flyEase: { def: "ease-in" } },
    }),
    cometEntry({
      id: "comet-drop-tan", name: "Comet · Straight Drop, tan on purple",
      blurb: "Straight drop, no flip: a tan comet onto a purple ground that stays purple. The quiet version — the brand's night ground is the constant, the mark is the light that arrives. Boil turned up a little so the tan reads as drawn.",
      duration: 1600, ink: "tan on purple", flood: "none", flipWhen: "none", floodFrac: 0, flyFrac: 0.4,
      way: [[0.5, -0.25], [0.5, 0.1]], over: { tail: { def: 520 }, tailW: { def: 45 }, boil: { def: 2.5 }, flyEase: { def: "ease-in" } },
    }),
    cometEntry({
      id: "comet-scurve", name: "Comet · S-Curve",
      blurb: "Enters top-right, carves an S down the frame and lands from the left. The wave flips the ground mid-flight, so the comet changes colour in the air as the flood passes under it (purple → tan while the ground goes tan → purple).",
      duration: 2100, ink: "purple on tan", flood: "wave", flipWhen: "before", concurrent: true, floodFrac: 0.3, flyFrac: 0.45,
      way: [[1.08, 0.05], [0.7, 0.3], [0.3, 0.45], [0.25, 0.75], [0.5, 0.4]],
      steps: ["wave flips the ground (30%) — the comet is already flying through it", "S-curve top-right → bottom-left → centre", "impact + morph", "settle + buttons"],
    }),
    cometEntry({
      id: "comet-spiral", name: "Comet · Spiral-In",
      blurb: "The comet spirals into the centre — two turns, tightening — so its own tail draws the swirl before it becomes the swirl. Ripple flip at impact. The mark's geometry explained by the entrance.",
      duration: 2300, ink: "purple on tan", flood: "ripple", flipWhen: "impact", floodFrac: 0.3, flyFrac: 0.55,
      way: (() => { const w = []; for (let i = 0; i <= 28; i++) { const u = i / 28, a = -Math.PI / 2 + u * Math.PI * 4, r = 0.62 * (1 - u) + 0.03; w.push([0.5 + Math.cos(a) * r * 0.9, 0.5 + Math.sin(a) * r * 1.25]); } return w; })(),
      over: { tail: { def: 420 }, flyEase: { def: "ease-in-out" } },
    }),
    cometEntry({
      id: "comet-whip", name: "Comet · Whip",
      blurb: "Fast and aggressive: in from the left at speed, overshoots past the centre, whips back and lands. No flip — tan on purple throughout. Short tail, hard easing, lots of squirts. The 'energy' end of the range.",
      duration: 1500, ink: "tan on purple", flood: "none", flipWhen: "none", floodFrac: 0, flyFrac: 0.42,
      way: [[-0.1, 0.55], [0.35, 0.5], [0.8, 0.42], [0.62, 0.3], [0.5, 0.38]],
      over: { tail: { def: 200 }, tailW: { def: 70 }, squirt: { def: 34 }, flyEase: { def: "ease-out-quint" }, head: { def: 20 } },
    }),
    cometEntry({
      id: "comet-rise", name: "Comet · Rise",
      blurb: "From below: the comet surfaces out of the bottom edge as the wave rises with it, arcs up and over, and settles down onto the centre. Tan on purple, no flip — the wave here is just a tan swell that recedes (set flip to 'wave' to see it flood).",
      duration: 2000, ink: "tan on purple", flood: "none", flipWhen: "none", floodFrac: 0, flyFrac: 0.5,
      way: [[0.3, 1.1], [0.36, 0.7], [0.5, 0.25], [0.64, 0.2], [0.56, 0.35]],
      over: { flyEase: { def: "ease-out-back" }, tail: { def: 380 } },
    }),
    cometEntry({
      id: "comet-loop-hold", name: "Comet · Loop, sketchy",
      blurb: "The Behance loop with the hand-drawn dial turned up: 3.5 px boil re-seeded every 70 ms (≈ 14 fps, like drawn twos), a bigger head, a short thick tail, and no gooey smoothing — every frame is a slightly different drawing. Purple on tan, wave flip.",
      duration: 2600, ink: "purple on tan", flood: "wave", flipWhen: "before", floodFrac: 0.14, flyFrac: 0.55, crisp: false,
      way: [[-0.08, 0.12], [0.22, 0.42], [0.42, 0.82], [0.74, 0.78], [0.86, 0.42], [0.66, 0.1], [0.5, 0.0], [0.5, 0.3]],
      over: { boil: { def: 3.5 }, boilFps: { def: 70 }, head: { def: 22 }, tail: { def: 220 }, tailW: { def: 80 } },
    }),
    cometEntry({
      id: "comet-tan-loop-flip", name: "Comet · Tan loop, flip at impact",
      blurb: "Tan comet on purple does the Behance loop, and the ripple flips the ground to tan ONLY when it lands — so the whole flight is light-on-dark, and the landing turns the screen to day with a purple mark. The reverse mood of the faithful one.",
      duration: 2400, ink: "tan on purple", flood: "ripple", flipWhen: "impact", floodFrac: 0.3, flyFrac: 0.55,
      way: [[-0.08, 0.12], [0.22, 0.42], [0.42, 0.82], [0.74, 0.78], [0.86, 0.42], [0.66, 0.1], [0.5, 0.0], [0.5, 0.3]],
    }),
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // Pool family — the Dribbble "Liquid Frame-by-Frame Logo Animation" drop section, three flips:
  //   1. an INK drop falls into a rising INK pool on the GROUND colour
  //   2. the pool fills the screen; what comes out underneath is a GROUND-coloured drop
  //   3. that drop spins into the swirl and splashes out to every edge — the screen is GROUND again, the mark stays INK
  // ───────────────────────────────────────────────────────────────────────────
  // Teardrop: round head at (cx, cy), pointed tail reaching `tail` px upward.
  function teardropPts(cx, cy, r, tail, K = 48) {
    const pts = [];
    for (let i = 0; i < K; i++) {
      const a = (i / K) * Math.PI * 2, up = Math.max(0, -Math.sin(a));
      pts.push([cx + Math.cos(a) * r * (1 - 0.6 * Math.pow(up, 1.5)), cy + Math.sin(a) * (r + tail * Math.pow(up, 2.5))]);   // neck stays thick enough to survive the goo filter
    }
    return pts;
  }
  // Pool surface: wavy top edge at `level` with an optional gaussian bump (h > 0 = cavity down, h < 0 = bulge up).
  function poolPts(W, H, level, amp, phase, bump = null, K = 40) {
    const y0 = H * level, pts = [];
    for (let i = 0; i <= K; i++) {
      const x = (i / K) * W;
      let y = y0 + Math.sin((i / K) * Math.PI * 3 + phase) * amp + Math.sin((i / K) * Math.PI * 7 - phase * 1.3) * amp * 0.4;
      if (bump) y += bump.h * Math.exp(-((x - bump.x) ** 2) / (2 * bump.w ** 2));
      pts.push([x, y]);
    }
    pts.push([W, H + 10], [0, H + 10]);
    return pts;
  }
  const scalePts = (P, cx, cy, S) => P.map((p) => [cx + (p[0] - cx) * S, cy + (p[1] - cy) * S]);

  const POOL_CONTROLS = [
    { key: "head", label: "Drop head", type: "range", min: 6, max: 24, step: 1, def: 12, unit: "% of mark" },
    { key: "spin", label: "Spin-up turns", type: "range", min: 0, max: 2, step: 0.25, def: 1 },
    { key: "pool", label: "Pool at impact", type: "range", min: 45, max: 80, step: 1, def: 62, unit: "% down" },
  ];

  // Outer silhouettes of the reference vortex (frames 136/137/139), 96 radii about the centroid, mean = 1.
  const VORTEX_SIL = [[1.05, 1.12, 1.18, 1.18, 1.18, 1.18, 1.18, 1.18, 1.15, 1.15, 1.12, 1.08, 1.12, 1.08, 1.08, 1.08, 1.05, 1.05, 1.05, 1.02, 1.02, 1.02, 0.98, 0.98, 0.98, 0.95, 0.95, 0.95, 0.95, 0.95, 0.91, 0.91, 0.91, 0.91, 0.91, 0.91, 0.91, 0.88, 0.88, 0.88, 0.88, 0.91, 0.91, 0.88, 0.91, 0.88, 0.91, 0.91, 0.91, 0.91, 0.91, 1.12, 1.25, 1.25, 1.25, 1.22, 1.22, 1.22, 1.18, 1.15, 1.15, 1.12, 1.12, 1.08, 1.08, 1.08, 1.05, 1.02, 1.02, 0.98, 0.98, 0.95, 0.95, 0.95, 0.91, 0.91, 0.91, 0.91, 0.91, 0.91, 0.88, 0.88, 0.85, 0.85, 0.85, 0.88, 0.88, 0.85, 0.88, 0.88, 0.88, 0.91, 0.91, 0.91, 0.91, 0.95], [1.03, 1.05, 1.03, 1.03, 1.0, 1.0, 0.98, 0.98, 0.94, 0.94, 0.94, 0.92, 0.92, 0.9, 0.9, 0.89, 0.87, 0.87, 0.87, 0.85, 0.87, 0.85, 0.83, 0.83, 0.85, 0.85, 0.85, 0.85, 0.87, 0.85, 1.07, 1.09, 1.14, 1.2, 1.24, 1.24, 1.24, 1.24, 1.25, 1.24, 1.24, 1.22, 1.24, 1.22, 1.2, 1.18, 1.14, 1.13, 1.07, 1.0, 1.0, 1.01, 1.0, 0.96, 0.92, 0.9, 0.87, 0.83, 0.83, 0.77, 0.76, 0.72, 0.68, 0.66, 0.65, 0.63, 0.57, 0.57, 0.55, 0.55, 0.85, 1.14, 1.18, 1.2, 1.22, 1.2, 1.18, 1.14, 1.16, 1.2, 1.18, 1.18, 1.16, 1.16, 1.16, 1.16, 1.14, 1.14, 1.14, 1.13, 1.13, 1.11, 1.09, 1.09, 1.07, 1.07], [0.97, 0.99, 0.99, 0.98, 0.95, 0.94, 0.93, 0.92, 0.92, 0.89, 0.86, 0.85, 0.84, 0.82, 0.8, 0.8, 0.78, 0.78, 0.77, 1.07, 1.1, 1.11, 1.11, 1.14, 1.15, 1.15, 1.14, 1.14, 1.15, 1.12, 1.12, 1.14, 1.12, 1.12, 1.11, 1.11, 1.09, 1.07, 1.07, 1.06, 1.06, 1.02, 1.01, 0.99, 0.99, 0.99, 0.98, 0.98, 0.94, 0.93, 0.9, 0.88, 0.86, 0.84, 0.81, 0.8, 0.77, 0.77, 0.73, 0.71, 0.68, 0.65, 0.85, 1.15, 1.16, 1.16, 1.15, 1.12, 1.15, 1.16, 1.15, 1.16, 0.93, 0.9, 1.11, 1.12, 1.12, 1.12, 1.12, 1.12, 1.11, 1.12, 1.11, 1.1, 1.1, 1.09, 1.07, 1.07, 1.05, 1.05, 1.01, 0.98, 0.95, 0.94, 0.95, 0.97]];

  function poolEntry(cfg) {
    const e = splashEntry({
      ...cfg,
      defaults: { duration: { def: 2400, max: 4000 }, ink: { def: "tan on purple" }, flood: { options: ["wave"], def: "wave" }, drops: { def: 18 }, ...(cfg.defaults || {}) },
      extra: POOL_CONTROLS,
      steps: cfg.steps || [
        "fall (0–23%): ink bead grows and stretches to ~6.5 heads as it accelerates; the ink pool rises from the bottom the whole time",
        "impact (23–32%): crown of ink beads, cavity, then a long GROUND-coloured tongue hangs under the surface",
        "flood + pinch-off (32–52%): surface bulges and leaves off the top; the tongue rounds into a drop that RISES (inverted gravity)",
        "drift (52–68%): the drop slows into the centre, wobbling; squashes flat against the ceiling (68–75%); gathers tall (75–86%)",
        "vortex + splash-out (86–100%): traced reference silhouettes, size doubling every ~5% while spinning, until every edge is covered",
        "settle: crisp ink mark fades up inside the vortex; buttons cascade",
      ],

      async enter({ s, v, D, mass, drops, flood, mark, btns, alive, B }) {
        // Timing and shapes measured off the reference (40ms frames, 1760ms drop section), expressed as fractions of D.
        const K = 96, r = v.size * v.head / 100, lvlImp = v.pool / 100, yImp = s.H * lvlImp, diag = Math.hypot(s.W, s.H);
        const surf = (level, amp, phase, bump) => { flood.style.clipPath = polyCss(poolPts(s.W, s.H, level, amp, phase, bump)); };
        // The pool never pauses: 1.0 → impact level by 23%, → 0.49 by 32%, → off the top by 52% (accelerating).
        const pool = (f) => f < 0.23 ? lerp(1.04, lvlImp, Math.max(0, (f - 0.05) / 0.18)) : f < 0.32 ? lerp(lvlImp, lvlImp - 0.14, (f - 0.23) / 0.09) : lerp(lvlImp - 0.14, -0.3, EASE_FN["ease-in"](Math.min(1, (f - 0.32) / 0.2)) * 0.6 + Math.min(1, (f - 0.32) / 0.2) * 0.4);
        const radial = (R, cx, cy, S, rot = 0) => R.map((q, i) => { const a = (i / R.length) * Math.PI * 2 + rot; return [cx + Math.cos(a) * q * S, cy + Math.sin(a) * q * S]; });
        // 1. fall (0–23%): bead grows as it accelerates, tail stretches to ~6.5 heads at impact
        await tween(D * 0.23, EASE_FN["linear"], (f) => { if (!alive()) return; const t = f * f;
          mass.setAttribute("points", ptsStr(teardropPts(s.cx, lerp(r * 1.2, yImp, t), r * (0.6 + 0.4 * t) * (1 - 0.3 * t), r * (0.2 + 6.5 * t * t), K)));
          surf(pool(f * 0.23), 2, f * 4, null);
        });
        if (!alive()) return;
        // 2. impact (23–32%): ink crown, cavity, then a long GROUND-coloured tongue hangs under the surface (bh ≈ 4 heads)
        drops.colour = s.ink; drops.spawn(s.cx, yImp, v.drops, { speed: 300, dir: -Math.PI / 2, spread: Math.PI * 0.8, r: [3, 6], life: 500 });
        await tween(D * 0.09, EASE_FN["ease-out-quint"], (t) => { if (!alive()) return; const f = 0.23 + t * 0.09, lv = pool(f) * s.H;
          mass.setAttribute("fill", mixT(s.ink, s.ground, t * 1.6));
          mass.setAttribute("points", ptsStr(teardropPts(s.cx, lv + r * 3.3 * t, r * 0.9, r * 2.4 * t, K)));  // tongue: round bulb at the bottom, neck pinched at the surface
          surf(pool(f), 2, 1, { x: s.cx, h: r * 1.0 * Math.sin(t * Math.PI), w: r * 2.2 });
        });
        if (!alive()) return;
        // 3. flood + pinch-off (32–52%): surface bulges and leaves; tongue shortens into a round drop that RISES (inverted world, inverted gravity)
        drops.colour = s.ground;
        await tween(D * 0.2, EASE_FN["linear"], (t) => { if (!alive()) return; const f = 0.32 + t * 0.2;
          surf(pool(f), 10 * (1 - t * 0.6), 2 + t * 6, { x: s.cx, h: -r * 2.4 * Math.sin(Math.min(1, t * 1.5) * Math.PI), w: r * 2.6 });
          const y0 = yImp - 0.14 * s.H + r * 3.6, y = lerp(y0, lerp(y0, s.cy, 0.5), EASE_FN["ease-out-quint"](t));
          const bh = r * lerp(4.2, 2.1, EASE_FN["ease-out-quint"](t)), bw = r * lerp(1.0, 1.8, t);
          mass.setAttribute("points", ptsStr(teardropPts(s.cx, y + bh / 2 - bw / 2, bw / 2, Math.max(0, bh - bw), K)));
          if (t < 0.55 && Math.random() < 0.35) drops.spawn(s.cx + rnd(-4, 4), y - bh / 2 - 2, 1, { speed: 40, dir: -Math.PI / 2, spread: 0.5, r: [2.5, 4.5], life: 800 });
        });
        if (!alive()) return;
        // 4. drift up (52–68%): slows into the centre, wobbling; then squashes flat against the ceiling (68–75%) and gathers tall (75–86%)
        const yA = lerp(yImp - 0.14 * s.H + r * 3.6, s.cy, 0.5), rb = r * 1.0;
        await tween(D * 0.16, EASE_FN["ease-out-quint"], (t) => { if (!alive()) return;
          const st = 1 + 0.22 * Math.sin(t * Math.PI * 3) * (1 - t);
          mass.setAttribute("points", ptsStr(ellipsePts(s.cx, lerp(yA, s.cy, t), rb / Math.sqrt(st) * 1.05, rb * st * 1.05, K)));
        });
        if (!alive()) return;
        const ball0 = ellipsePts(s.cx, s.cy, rb * 1.05, rb * 1.05, K), puddle = ellipsePts(s.cx, s.cy + rb * 0.35, rb * 1.5, rb * 0.78, K);
        drops.spawn(s.cx, s.cy - rb * 0.4, Math.round(v.drops / 5), { speed: 110, dir: Math.PI / 2, spread: Math.PI * 1.4, r: [1, 3], life: 420 });
        await tween(D * 0.07, EASE_FN["ease-out-quint"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(ball0, puddle, t))));
        if (!alive()) return;
        const tall = ellipsePts(s.cx, s.cy, rb * 1.4, rb * 1.65, K);
        await tween(D * 0.11, EASE_FN["ease-in-out"], (t) => alive() && mass.setAttribute("points", ptsStr(lerpPts(puddle, tall, t))));
        if (!alive()) return;
        // 5. vortex + splash-out (86–100%): traced reference silhouettes, doubling in size every ~5% while spinning, until every edge is covered
        const sizes = [rb * 2.1, rb * 3.7, rb * 4.9, diag * 1.3], sils = VORTEX_SIL.concat([VORTEX_SIL[2].map(() => 1)]);
        const tallR = tall.map((p) => Math.hypot(p[0] - s.cx, p[1] - s.cy) / rb / 1.5);
        const keys = [tallR].concat(sils), keyS = [rb * 1.5].concat(sizes);
        let revealed = false;
        await tween(D * 0.14, EASE_FN["linear"], (t) => { if (!alive()) return;
          const u = t * (keys.length - 1), i = Math.min(keys.length - 2, Math.floor(u)), w = u - i, e = i === keys.length - 2 ? EASE_FN["ease-in"](w) : w;
          const R = keys[i].map((q, k) => lerp(q, keys[i + 1][k], e)), S = lerp(keyS[i], keyS[i + 1], e);
          mass.setAttribute("points", ptsStr(radial(R, s.cx, s.cy, S, -Math.PI * 2 * v.spin * (1 - EASE_FN["ease-out-quint"](t)))));
          if (!revealed && t > 0.5) { revealed = true; mark.style.opacity = 1; mark.animate({ clipPath: ["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"] }, { duration: D * 0.12, easing: EASINGS["ease-out-quint"], fill: "forwards" }); }  // the mark grows out of the vortex centre
        });
        if (!alive()) return;
        // 6. settle: the mass IS the ground now — drop the flood, hide the mass (same colour), buttons cascade
        flood.style.clipPath = polyCss(wavePts(s.W, s.H, 1.1, 0, 0));
        mass.setAttribute("opacity", 0);
        if (v.buttons) btns.animate({ opacity: [0, 1], transform: ["translate(-50%, 14px)", "translate(-50%, 0)"] }, { duration: Math.max(200, D * 0.15), easing: EASINGS["ease-out-quint"], fill: "forwards" });
      },
    });
    // Final state is ground + INK mark (double flip), so patch what splashEntry assumes for a single flip.
    const baseRest = e.rest;
    e.rest = function (A, B, v, dir) {
      baseRest.call(this, A, B, v, dir);
      const s = this._s; s.flip = false; s.markCol = s.ink;
      B.querySelector("#mark path").setAttribute("fill", s.ink);
      const [b1, b2] = B.querySelectorAll("#btns > div");
      b1.style.background = s.ink; b1.style.color = s.ground; b2.style.borderColor = s.ink; b2.style.color = s.ink;
      B.querySelector("#flood").style.clipPath = polyCss(wavePts(s.W, s.H, 1.1, 0, 0));
    };
    return e;
  }

  const POOLS = [
    poolEntry({ id: "pool-drop", name: "Pool · Three Flips",
      blurb: "The Dribbble frame-by-frame drop, mapped to Ether: a tan drop falls into a rising tan pool on purple. The pool fills the screen, and what comes out underneath is a purple drop. It lands, spins up into the swirl, and splashes out past every edge — purple again, with the tan mark left at the centre. Then the buttons." }),
    poolEntry({ id: "pool-drop-swap", name: "Pool · Three Flips, swapped",
      blurb: "Same choreography with the inks swapped: purple drop into a purple pool on tan, tan drop comes out, tan swirl splashes out, tan screen with the purple mark.",
      defaults: { ink: { def: "purple on tan" } } }),
    poolEntry({ id: "pool-drop-slow", name: "Pool · Slow, two turns",
      blurb: "Longer and heavier: bigger head, more beads, the swirl winds up two full turns before it lets go of the edges.",
      defaults: { duration: { def: 3200, max: 4000 }, drops: { def: 30 } }, }),
    poolEntry({ id: "pool-drop-quick", name: "Pool · Quick, half turn",
      blurb: "The same three flips in a snap: small head, few beads, half a turn. Closer to a real cold-start budget.",
      defaults: { duration: { def: 1500, max: 4000 }, drops: { def: 10 } } }),
  ];
  POOLS[2].controls.find((c) => c.key === "head").def = 18; POOLS[2].controls.find((c) => c.key === "spin").def = 2;
  POOLS[3].controls.find((c) => c.key === "head").def = 11; POOLS[3].controls.find((c) => c.key === "spin").def = 0.5;


  // ───────────────────────────────────────────────────────────────────────────
  // Frame-by-frame family — every frame is its own drawing. The ink region of each reference frame
  // (Dribbble 3394567, drop section, 40ms frames) was traced to a closed evenodd path; playback STEPS
  // through them, nothing is interpolated, scaled or rotated. Private study for a personal project.
  // ───────────────────────────────────────────────────────────────────────────
  // A: all 45 frames traced from the reference; the two splash-out frames outpainted past the 4:3 box.
  const FBF_DROP_A = { w: 800, h: 600, ms: 40, swirl: [0.5, 0.46, 0.42], extendUntil: 43 /* the last two drawings are outpainted: arms extruded along their rays with a spiral twist, tapered and roughened */, frames: [
    "M387,0 420,0 423,11 423,26 418,34 418,29 416,28 417,31 415,31 414,33 414,38 408,40 395,40 386,33 382,24 382,10ZM386,28 390,32 390,35 392,35 391,33 393,33 397,36 395,38 406,39 406,34 408,34 409,38 413,37 413,31 411,31 412,33 410,36 410,33 408,33 407,31 406,34 404,33 405,37 403,37 402,34 399,37 400,34 396,35 395,33 397,32 395,32 395,29 393,29 394,32 390,32 390,29 387,28 387,24Z",
    "M393,0 418,0 419,2 423,19 423,38 420,47 413,53 399,54 392,52 389,49 390,47 388,48 384,42 384,27 387,21 388,14 391,10ZM388,36 388,45 391,45 394,50 396,49 396,51 402,51 406,53 407,51 410,52 410,48 411,50 413,50 413,48 415,48 413,46 417,46 416,43 408,43 405,44 405,47 402,43 401,48 401,45 398,44 398,41 395,40 398,44 397,46 395,45 393,40 393,42 391,42 391,38 389,38 389,35ZM414,41 418,43 417,40Z",
    "M393,0 418,0 419,2 423,19 423,38 420,47 413,53 399,54 392,52 389,49 390,47 388,48 384,42 384,27 387,21 388,14 391,10ZM388,36 388,45 391,45 394,50 396,49 396,51 402,51 406,53 407,51 410,52 410,48 411,50 413,50 413,48 415,48 413,46 417,46 416,43 408,43 405,44 405,47 402,43 401,48 401,45 398,44 398,41 395,40 398,44 397,46 395,45 393,40 393,42 391,42 391,38 389,38 389,35ZM414,41 418,43 417,40Z",
    "M398,0 410,1 411,14 416,34 418,65 416,69 408,75 394,75 385,68 384,64 385,48 393,26ZM386,64 390,65 388,66 388,68 391,69 392,72 394,71 397,73 397,71 399,71 399,73 400,71 401,73 405,73 405,71 408,72 407,68 412,70 415,66 414,63 412,63 410,66 406,66 407,68 403,68 401,66 397,67 392,63 387,63 387,61ZM47,559 800,559 800,600 0,600 0,560Z",
    "M400,0 406,0 407,3 409,32 416,76 416,98 412,106 403,111 390,108 385,99 385,85 395,43 398,8ZM409,95 411,98 409,98 408,96 408,99 402,99 402,102 399,102 400,99 397,102 398,99 393,100 390,96 388,96 388,101 390,102 391,106 393,106 394,108 396,107 396,109 400,109 400,106 401,108 404,108 404,106 411,104 411,99 413,98 413,96 411,96 411,94ZM567,511 800,511 800,600 0,600 0,512Z",
    "M400,0 406,0 407,3 409,32 416,76 416,98 412,106 403,111 390,108 385,99 385,85 395,43 398,8ZM409,95 411,98 409,98 408,96 408,99 402,99 402,102 399,102 400,99 397,102 398,99 393,100 390,96 388,96 388,101 390,102 391,106 393,106 394,108 396,107 396,109 400,109 400,106 401,108 404,108 404,106 411,104 411,99 413,98 413,96 411,96 411,94ZM567,511 800,511 800,600 0,600 0,512Z",
    "M399,0 404,0 405,5 405,25 410,87 413,106 414,139 412,151 409,155 407,155 407,152 409,150 409,147 411,148 410,145 412,144 406,143 407,147 404,145 403,147 398,148 398,146 396,146 397,142 391,142 391,139 393,139 391,138 391,135 390,137 388,137 391,139 388,140 390,142 389,145 391,145 390,147 392,151 395,150 396,153 399,153 401,155 402,153 403,155 406,154 407,156 404,157 393,154 388,149 386,144 388,107 392,90 392,77 397,49ZM770,454 800,454 800,600 0,600 0,455Z",
    "M399,0 404,0 405,5 405,25 410,87 413,106 414,139 412,151 409,155 407,155 407,152 409,150 409,147 411,148 410,145 412,144 406,143 407,147 404,145 403,147 398,148 398,146 396,146 397,142 391,142 391,139 393,139 391,138 391,135 390,137 388,137 391,139 388,140 390,142 389,145 391,145 390,147 392,151 395,150 396,153 399,153 401,155 402,153 403,155 406,154 407,156 404,157 393,154 388,149 386,144 388,107 392,90 392,77 397,49ZM770,454 800,454 800,600 0,600 0,455Z",
    "M400,88 402,88 403,91 405,106 404,122 406,156 408,165 408,187 410,195 414,249 417,264 417,294 414,305 409,312 407,310 409,310 409,308 411,307 411,303 413,303 412,296 410,296 411,299 409,298 409,301 406,301 404,299 405,304 403,302 400,303 400,300 398,304 397,301 393,301 396,299 391,298 389,300 390,296 387,297 389,294 387,293 387,290 385,292 386,296 384,297 382,292 385,252 390,230 390,219 395,191 395,176 397,162 398,93ZM384,297 386,297 389,306 392,307 393,310 395,310 396,312 403,312 404,314 397,314 391,309 389,309 384,300ZM0,397 800,397 800,600 0,600Z",
    "M402,182 405,183 406,187 408,247 416,326 415,361 412,370 408,375 403,377 403,380 800,381 800,600 0,600 0,381 396,380 398,379 398,377 394,376 388,368 390,368 390,370 395,375 403,376 405,375 405,373 407,374 407,371 410,370 409,367 412,364 407,363 407,367 405,367 404,369 399,369 395,368 392,364 389,363 387,368 384,360 384,336 387,320 388,303 394,277 395,254 400,215 399,193Z",
    "M402,182 405,183 406,187 408,247 416,326 415,361 412,370 408,375 403,377 403,380 800,381 800,600 0,600 0,381 396,380 398,379 398,377 394,376 385,364 384,336 387,320 388,303 394,277 395,254 400,215 399,193Z",
    "M403,158 406,159 407,166 406,171 402,176 400,174 399,167 400,162ZM403,183 406,183 408,185 409,191 409,224 406,234 406,230 403,231 403,229 405,229 406,227 402,228 402,226 401,230 399,231 400,233 398,234 399,189ZM403,232 405,235 403,237 400,237 399,234 403,234ZM399,245 404,245 407,247 410,256 411,267 407,273 405,269 407,270 408,268 404,268 404,270 399,271 394,266 393,271 396,274 398,274 395,275 392,272 392,263 396,249ZM405,273 407,273 405,276 398,276 402,274 404,275ZM397,285 402,285 408,290 412,299 414,311 414,333 411,338 411,331 413,330 409,331 409,335 407,334 403,336 401,334 401,337 397,337 396,334 394,335 393,333 394,330 389,329 391,331 390,334 392,334 393,339 410,338 409,340 403,343 393,341 390,338 390,335 387,331 388,302 392,290ZM445,353 800,354 800,600 0,600 0,354 357,354 371,361 380,372 382,379 382,407 384,414 393,423 403,424 408,420 412,412 414,404 414,379 419,367 425,360 432,358 436,355ZM619,357 620,359 622,359 621,356ZM67,358 69,358 69,356 66,357 66,359ZM374,371 375,370 373,370 374,374 372,376 376,379 376,382 377,374 375,374ZM315,375 320,376 320,372 316,371ZM353,375 356,378 361,378 363,376 363,370 355,368 353,370ZM475,376 476,374 474,372 471,372 469,375 471,379 474,379ZM437,381 440,385 443,385 445,383 445,375 439,375 437,377ZM344,392 346,392 346,387 344,385 340,386 340,393ZM441,399 442,401 446,401 448,397 446,395 443,395ZM432,410 432,398 430,395 425,395 423,419 425,420 429,418 431,416ZM353,413 358,418 367,418 372,413 372,408 365,401 357,401 353,406ZM381,422 386,425 386,423 384,423 384,419 383,422ZM382,438 384,444 390,449 408,450 415,444 416,434 414,431 411,431 404,435 393,435 388,432 384,432Z",
    "M402,133 406,134 406,145 404,148 400,147 400,145 402,146 401,141 399,145 399,140ZM402,160 406,162 406,177 404,200 403,203 400,203 399,200 402,201 403,199 403,191 401,191 401,188 403,189 403,187 401,187 399,190 401,191 401,193 399,193 400,197 398,198 398,171 399,165ZM400,220 405,220 408,224 408,231 406,233 404,240 399,240 397,237 397,233 398,235 400,235 399,237 402,235 398,233 397,229 397,224ZM402,255 406,256 410,261 411,287 407,299 404,302 398,303 391,299 391,294 394,297 394,300 404,300 405,296 407,296 406,289 408,288 405,288 405,292 401,293 400,296 398,291 396,292 397,295 395,295 394,291 397,289 394,289 395,287 393,287 393,285 391,286 392,293 390,293 390,277 394,262 397,258 399,258ZM22,328 370,329 379,333 385,339 385,341 389,345 393,358 393,377 382,416 382,436 386,444 389,446 389,448 394,451 403,450 404,448 407,448 415,434 415,415 407,391 404,375 404,355 405,347 409,337 414,332 420,329 800,329 800,600 0,600 0,329ZM420,336 421,334 419,334 419,338 421,339ZM417,337 412,341 412,344 410,344 413,347 413,345 415,344 414,340 418,340ZM378,342 376,344 379,345 382,349 381,345 378,344ZM470,348 470,345 466,346 467,350 469,350ZM315,353 319,355 321,353 321,350 319,348 316,348ZM370,359 371,354 368,352 367,360 370,361ZM437,361 439,364 441,364 444,361 444,355 442,353 439,353 437,355ZM337,372 340,375 344,374 343,368 338,368ZM444,383 448,384 449,380 447,378 444,379ZM432,394 432,385 426,385 426,407 430,407 432,403ZM367,402 367,393 359,393 357,396 358,409 364,410 366,408ZM421,450 422,447 420,447 409,456 406,456 404,458 394,458 389,456 380,447 378,442 376,443 376,452 379,458 387,467 391,469 404,469 412,465 419,458Z",
    "M403,115 406,115 404,128 401,127 401,125 403,125 401,124ZM401,145 404,145 406,148 406,162 401,172 401,174 403,172 402,176 400,176 400,167 398,165 399,148ZM401,193 404,193 406,195 407,201 406,210 402,215 398,213 398,210 400,210 400,213 402,212 402,210 400,210 401,207 400,209 398,209 398,198ZM401,231 406,231 406,233 409,235 410,257 409,261 407,259 404,259 404,262 402,262 401,265 399,264 401,263 400,259 397,259 397,257 395,257 396,263 394,265 394,242 397,235ZM0,310 357,310 375,312 383,319 387,326 387,329 392,340 395,355 395,389 388,411 384,437 387,449 396,457 405,456 410,451 410,448 414,440 414,424 412,412 404,382 404,371 402,362 402,340 404,332 409,322 412,321 416,316 424,312 451,310 800,310 800,600 0,600ZM67,316 69,316 69,314 66,315 65,317ZM414,325 416,325 414,323 412,323 411,325 413,329ZM318,328 318,326 315,326 315,330 318,330ZM372,338 373,332 370,330 367,331 367,340 372,340ZM434,343 436,345 441,345 443,343 442,331 436,332 434,337ZM343,350 344,341 338,340 337,351 341,353 343,352ZM452,365 453,362 450,361 449,366ZM423,369 424,374 426,376 428,376 431,373 432,363 430,359 424,360ZM364,384 365,373 363,371 359,371 356,375 356,385 359,389 362,389ZM426,455 426,444 425,442 421,441 416,456 412,460 401,466 402,472 406,475 415,473 425,461ZM372,457 377,468 383,474 391,475 393,473 393,468 384,457 377,440 373,441 372,443Z",
    "M401,96 404,96 404,104 402,104 401,102ZM401,126 404,126 406,133 405,147 404,142 402,143 401,140 399,141 399,132ZM403,147 403,151 400,151 400,148 402,149ZM401,173 403,173 407,178 407,182 404,182 403,184 401,184 402,182 398,183ZM401,186 402,188 405,187 405,189 401,190ZM399,217 405,217 408,222 408,234 407,231 405,231 404,236 399,236 400,234 398,234 398,231 395,235 395,224ZM406,235 407,239 404,245 399,245 396,237 398,238 398,241 400,243 403,243 406,238ZM0,295 379,296 386,299 390,303 394,311 398,310 402,301 408,296 800,296 800,600 0,600ZM407,306 408,307 406,307 406,312 404,312 406,314 406,312 408,311 407,309 409,307 409,305ZM315,311 318,312 318,308 316,308ZM438,317 442,317 441,307 438,308ZM367,322 370,323 369,315 367,316ZM338,323 339,326 341,326 343,323 343,318 339,318ZM393,330 393,379 390,401 385,421 385,442 388,449 393,454 406,455 412,449 415,443 416,422 413,412 412,400 406,383 403,365 402,321 399,316 394,317ZM423,349 424,351 428,350 427,336 423,338ZM362,353 363,348 359,347 358,357 359,359 361,359ZM424,430 425,441 420,451 420,455 422,457 426,457 432,448 431,424 429,420 425,420ZM365,433 369,447 375,452 379,453 374,433 373,422 369,421 366,424Z",
    "M401,109 403,109 405,112 405,124 403,124 404,118 402,124 400,122 401,120 399,120ZM401,157 406,158 406,162 404,162 403,165 402,161 400,161ZM399,196 404,196 407,200 407,205 405,204 406,207 404,207 404,213 403,211 401,213 398,210 399,208 397,208 396,206 397,199ZM384,276 415,276 425,279 443,280 458,284 800,284 800,600 0,600 0,283 334,284 358,282 362,280ZM314,298 317,300 318,296 315,296ZM437,298 441,298 440,292 437,293ZM400,303 400,297 395,296 394,305 396,307 399,307ZM339,307 340,309 342,309 343,303 339,303ZM428,324 429,317 425,315 423,319 423,325 424,328 427,328ZM363,333 364,327 361,323 359,323 358,334 359,336 362,336ZM403,345 404,337 402,326 400,322 397,321 394,323 393,326 393,350 395,354 399,354 403,350ZM422,405 425,426 428,429 431,429 432,415 430,394 428,392 424,393ZM375,411 376,407 374,403 372,403 368,408 366,433 369,436 372,436 375,433ZM383,436 384,441 386,445 389,447 389,449 397,453 408,453 411,449 414,448 417,442 415,409 407,376 402,367 398,367 396,369 392,378 391,386 388,390 386,405 383,414ZM425,437 426,436 424,435 423,442 425,441ZM390,441 394,441 395,445 397,445 398,443 398,445 403,446 408,444 408,442 410,443 411,441 411,445 409,445 406,448 399,449 398,447 395,448 395,446 391,444Z",
    "M400,72 403,73 403,83 402,79 399,80ZM399,96 403,97 404,99 404,105 403,102 400,103 401,106 403,105 402,108 398,104ZM401,125 405,128 405,140 404,138 402,138 402,140 399,140 399,129ZM403,140 404,144 401,148 400,143 402,146ZM396,237 421,239 457,248 491,252 800,253 800,600 0,600 0,252 316,253 366,243 370,241 390,239ZM399,243 392,244 398,246ZM389,245 391,248 391,243ZM378,246 382,246 381,248 389,247 388,243 382,245 373,245 371,247 364,246 359,250 355,249 355,251 351,252 346,251 344,254 348,255 348,252 351,254 354,252 357,253 357,251 363,251 364,253 366,253 363,251 364,249 367,251 367,249 365,248 368,248 368,250 370,251 368,253 370,253 371,249 377,247 375,249 377,250ZM420,246 424,248 422,245 419,245 419,247ZM399,249 400,247 396,249 397,251 403,250 403,248 401,250ZM409,249 409,251 412,251 410,248ZM338,275 339,278 342,278 343,272 340,271ZM428,295 429,285 428,283 425,283 424,298 427,299ZM362,297 363,291 359,289 358,298 362,299ZM400,308 401,306 398,302 393,303 394,313 399,314ZM392,357 396,363 400,364 403,361 403,343 401,332 398,328 396,328 393,335ZM424,363 426,379 430,381 432,379 433,374 433,351 432,349 428,349 426,351ZM370,379 371,360 369,356 365,354 361,360 361,384 362,387 367,388 370,385ZM380,427 384,438 386,438 392,443 411,444 420,435 421,407 419,404 419,397 416,386 409,377 399,376 389,388 381,408ZM409,433 411,433 411,437 407,439 407,437 409,437ZM395,437 402,437 403,439 406,438 407,440 399,441 394,439ZM408,449 410,451 413,450 409,448ZM407,452 408,454 410,453 409,451Z",
    "M402,25 404,25 405,27 403,34 401,34ZM400,46 403,48 402,56 399,55ZM400,77 403,81 402,97 400,97 398,93 398,84ZM389,153 410,153 431,158 448,166 449,168 458,172 459,174 466,177 473,183 492,192 499,193 515,199 535,200 539,202 800,202 800,600 0,600 0,202 270,201 289,196 302,195 306,192 314,190 326,183 334,181 348,174 349,172 356,169 358,166 376,157ZM428,247 429,237 427,236 425,237 425,251 428,251ZM359,251 360,253 362,253 362,245 359,246ZM431,315 432,302 430,295 427,295 425,303 426,324 428,327 430,326ZM400,322 401,319 398,315 394,315 392,317 393,326 398,327 400,325ZM370,334 371,320 368,316 366,316 364,318 363,324 362,344 364,347 368,346ZM390,353 393,365 400,366 401,336 398,332 395,334 393,338ZM375,408 378,427 380,431 386,437 392,440 398,441 410,439 418,435 427,424 427,395 421,384 418,382 418,380 409,373 394,374 380,386 375,400ZM386,428 389,429 390,433 388,432 388,430 386,430ZM408,429 412,430 412,432 410,432ZM396,430 398,430 398,434 395,434Z",
    "M402,25 404,25 405,27 403,34 401,34ZM400,46 403,48 402,56 399,55ZM400,77 403,81 402,97 400,97 398,93 398,84ZM389,153 410,153 431,158 448,166 449,168 458,172 459,174 466,177 473,183 492,192 499,193 515,199 535,200 539,202 800,202 800,600 0,600 0,202 270,201 289,196 302,195 306,192 314,190 326,183 334,181 348,174 349,172 356,169 358,166 376,157ZM428,247 429,237 427,236 425,237 425,251 428,251ZM359,251 360,253 362,253 362,245 359,246ZM431,315 432,302 430,295 427,295 425,303 426,324 428,327 430,326ZM400,322 401,319 398,315 394,315 392,317 393,326 398,327 400,325ZM370,334 371,320 368,316 366,316 364,318 363,324 362,344 364,347 368,346ZM390,353 393,365 400,366 401,336 398,332 395,334 393,338ZM375,408 378,427 380,431 386,437 392,440 398,441 410,439 418,435 427,424 427,395 421,384 418,382 418,380 409,373 394,374 380,386 375,400ZM386,428 389,429 390,433 388,432 388,430 386,430ZM408,429 412,430 412,432 410,432ZM396,430 398,430 398,434 395,434Z",
    "M400,34 402,34 401,42ZM400,60 402,61 401,76 399,76ZM464,120 473,123 482,123 494,129 514,133 516,135 532,137 534,139 562,147 638,158 800,159 800,600 0,600 0,159 162,159 207,152 212,149 222,148 225,146 261,137 264,135 281,132 292,127 298,128 301,126 319,124 334,124 344,126 348,125 362,128 370,132 392,136 395,138 404,138 417,134 423,129 432,127 440,123ZM458,128 460,130 463,129 463,132 460,133 463,133 466,129 468,129 469,132 469,127ZM441,129 437,129 436,131 434,130 435,132 431,132 429,136 426,135 429,133 428,132 425,135 419,136 418,138 409,140 408,142 411,142 408,144 407,141 404,143 402,142 403,145 401,144 398,147 398,152 400,152 400,147 402,147 401,149 403,150 401,151 403,152 403,145 409,145 411,142 412,145 409,147 412,146 412,148 416,147 414,146 414,143 415,145 419,145 420,142 421,144 424,144 422,142 422,139 424,140 425,138 427,138 424,142 430,140 430,134 434,133 434,135 436,135 437,133 437,136 435,136 436,138 437,136 439,136 437,131 454,129 454,132 451,131 451,133 454,133 456,128 450,129 449,127 445,127ZM315,131 318,133 319,129ZM476,131 477,133 482,132 480,130ZM330,133 332,134 332,131 330,131ZM295,134 299,135 294,132 291,135ZM343,134 347,135 347,133 345,134 344,132ZM485,134 487,133 484,133 484,135 487,137 496,137 493,135 489,136ZM367,136 368,135 364,135 364,138ZM281,137 282,136 277,136 275,138 277,139ZM374,139 378,142 380,141 378,141 377,137 374,137ZM369,140 367,140 367,142 371,144 370,142 368,142ZM273,141 275,141 275,139 272,140 272,142ZM382,141 385,144 385,146 383,147 384,148 388,143 388,140ZM394,143 394,145 391,141 389,141 389,145 387,145 385,150 390,145 390,147 396,149 395,151 393,151 396,151 397,153 397,145 399,145 400,143ZM407,150 408,152 405,155 408,155 408,152 411,151 409,149ZM148,164 149,163 145,163 144,165 142,163 142,165 139,164 141,165 139,167 141,167 142,165 143,167 147,167 149,166ZM631,164 635,164 635,162 631,162ZM429,255 430,244 427,240 425,240 423,242 421,252 422,265 427,266ZM369,287 370,269 365,268 363,277 363,295 369,295ZM391,335 393,337 397,337 399,335 399,330 397,328 393,328 391,331ZM413,349 415,356 417,354 417,350 415,350 415,347 413,347ZM409,354 410,349 407,344 403,342 394,342 387,347 385,358 387,360 392,360 393,358 407,357 409,356ZM378,355 378,357 376,357 376,361 377,359 379,359ZM410,359 413,362 415,362 415,359 413,359 413,357ZM379,363 381,363 380,360 377,362 376,370 374,370 373,368 374,372 372,372 371,369 369,373 370,374 372,372 371,379 372,375 376,372 377,369 379,370 379,368 381,368 382,366 384,367 384,363 383,365ZM437,403 438,388 434,379 432,378 430,373 427,372 425,369 413,364 396,364 384,369 376,377 371,391 372,412 377,418 379,418 380,421 386,423 387,425 397,426 420,422 431,414 431,412 435,409ZM399,414 401,418 396,417 396,415 399,416ZM432,420 434,421 435,419 432,418ZM427,422 428,423 425,424 425,426 423,425 422,427 419,427 420,429 417,428 416,430 414,430 414,432 411,432 412,430 409,430 407,432 403,432 403,434 401,432 398,433 399,435 405,435 405,432 407,435 408,433 410,434 410,432 411,434 416,434 415,432 421,432 421,429 423,430 423,427 425,427 426,425 430,425 430,423 432,425 431,420Z",
    "M400,34 402,34 401,42ZM400,60 402,61 401,76 399,76ZM464,120 473,123 482,123 494,129 514,133 516,135 532,137 534,139 562,147 638,158 800,159 800,600 0,600 0,159 162,159 207,152 212,149 222,148 225,146 261,137 264,135 281,132 292,127 298,128 301,126 319,124 334,124 344,126 348,125 362,128 370,132 392,136 395,138 404,138 417,134 423,129 432,127 440,123ZM458,128 460,130 463,129 463,132 460,133 463,133 466,129 468,129 469,132 469,127ZM441,129 437,129 436,131 434,130 435,132 431,132 429,136 426,135 429,133 428,132 425,135 419,136 418,138 409,140 408,142 411,142 408,144 407,141 404,143 402,142 403,145 401,144 398,147 398,152 400,152 400,147 402,147 401,149 403,150 401,151 403,152 403,145 409,145 411,142 412,145 409,147 412,146 412,148 416,147 414,146 414,143 415,145 419,145 420,142 421,144 424,144 422,142 422,139 424,140 425,138 427,138 424,142 430,140 430,134 434,133 434,135 436,135 437,133 437,136 435,136 436,138 437,136 439,136 437,131 454,129 454,132 451,131 451,133 454,133 456,128 450,129 449,127 445,127ZM315,131 318,133 319,129ZM476,131 477,133 482,132 480,130ZM330,133 332,134 332,131 330,131ZM295,134 299,135 294,132 291,135ZM343,134 347,135 347,133 345,134 344,132ZM485,134 487,133 484,133 484,135 487,137 496,137 493,135 489,136ZM367,136 368,135 364,135 364,138ZM281,137 282,136 277,136 275,138 277,139ZM374,139 378,142 380,141 378,141 377,137 374,137ZM369,140 367,140 367,142 371,144 370,142 368,142ZM273,141 275,141 275,139 272,140 272,142ZM382,141 385,144 385,146 383,147 384,148 388,143 388,140ZM394,143 394,145 391,141 389,141 389,145 387,145 385,150 390,145 390,147 396,149 395,151 393,151 396,151 397,153 397,145 399,145 400,143ZM407,150 408,152 405,155 408,155 408,152 411,151 409,149ZM148,164 149,163 145,163 144,165 142,163 142,165 139,164 141,165 139,167 141,167 142,165 143,167 147,167 149,166ZM631,164 635,164 635,162 631,162ZM429,255 430,244 427,240 425,240 423,242 421,252 422,265 427,266ZM369,287 370,269 365,268 363,277 363,295 369,295ZM391,335 393,337 397,337 399,335 399,330 397,328 393,328 391,331ZM413,349 415,356 417,354 417,350 415,350 415,347 413,347ZM409,354 410,349 407,344 403,342 394,342 387,347 385,358 387,360 392,360 393,358 407,357 409,356ZM378,355 378,357 376,357 376,361 377,359 379,359ZM410,359 413,362 415,362 415,359 413,359 413,357ZM379,363 381,363 380,360 377,362 376,370 374,370 373,368 374,372 372,372 371,369 369,373 370,374 372,372 371,379 372,375 376,372 377,369 379,370 379,368 381,368 382,366 384,367 384,363 383,365ZM437,403 438,388 434,379 432,378 430,373 427,372 425,369 413,364 396,364 384,369 376,377 371,391 372,412 377,418 379,418 380,421 386,423 387,425 397,426 420,422 431,414 431,412 435,409ZM399,414 401,418 396,417 396,415 399,416ZM432,420 434,421 435,419 432,418ZM427,422 428,423 425,424 425,426 423,425 422,427 419,427 420,429 417,428 416,430 414,430 414,432 411,432 412,430 409,430 407,432 403,432 403,434 401,432 398,433 399,435 405,435 405,432 407,435 408,433 410,434 410,432 411,434 416,434 415,432 421,432 421,429 423,430 423,427 425,427 426,425 430,425 430,423 432,425 431,420Z",
    "M398,15 400,16 400,19 402,21 402,28 400,33 397,32ZM238,56 271,56 277,58 297,60 317,65 325,69 358,80 379,85 391,85 395,87 404,87 422,83 483,63 488,63 502,59 524,57 541,58 561,62 569,66 578,68 580,70 586,70 601,76 616,78 629,82 662,86 800,86 800,600 0,600 0,86 74,85 79,83 126,80 178,69 194,67 218,60 227,59 228,57ZM304,69 307,71 310,70 307,70 305,67ZM316,73 317,71 314,72 313,75 318,75ZM321,74 323,74 322,78 324,78 325,74 323,74 322,72ZM327,78 329,77 326,76 326,79 328,80ZM332,79 330,79 329,82 332,82ZM332,79 334,79 333,81 337,81 340,83 337,79ZM348,86 351,87 347,91 351,91 350,88 352,88 352,91 356,92 356,87 352,88 350,84ZM357,87 357,89 360,89 359,85 357,85ZM382,92 383,94 389,94 389,91ZM379,93 377,93 375,96 377,97ZM406,93 404,93 404,95 402,96 399,95 398,100 393,100 393,103 395,101 401,100 405,94 408,96ZM363,95 365,95 367,99 370,96 369,95 367,97 367,95 362,94 361,97ZM427,191 428,177 425,176 425,178 423,179 422,187 422,201 424,202 426,200ZM424,209 426,210 423,210 423,212 427,210 426,208ZM370,229 371,218 366,217 364,220 362,229 363,246 366,246 368,243ZM402,315 405,315 405,312 403,312 402,310 397,310 391,314 391,317 398,317ZM417,335 417,331 410,324 403,322 392,322 385,328 383,332 384,337ZM426,347 429,348 429,350 431,350 428,346ZM435,376 436,371 432,357 425,349 418,346 417,344 410,342 388,343 375,353 370,365 370,381 373,388 381,397 384,397 392,401 405,402 408,400 413,400 414,398 422,395 433,384ZM388,392 393,392 394,396 392,395 392,393ZM400,392 406,392 407,395 403,395 403,393 401,395ZM407,392 410,392 412,394 409,395Z",
    "M161,26 215,28 248,34 264,35 267,38 278,38 296,44 324,47 335,50 343,49 357,52 406,54 451,52 455,50 483,47 491,43 508,42 521,39 524,37 538,36 574,27 619,26 640,29 652,28 656,30 665,30 710,40 713,42 721,43 724,45 732,46 735,48 751,52 777,56 800,57 800,600 0,600 0,69 2,69 0,68 0,54 37,50 74,42 102,39 119,33ZM232,36 236,36 236,39 238,37 242,37 231,35 231,38ZM129,38 134,39 131,36ZM253,40 251,39 252,42 249,41 248,43 255,43 256,45 258,45 257,43 253,42ZM269,43 270,44 267,45 262,45 266,45 266,47 270,45 272,46 272,48 274,48 272,46 274,45 273,42ZM94,45 98,47 98,44ZM290,48 283,47 282,51 280,51 279,49 278,50 280,52 283,52 283,50 285,51 285,49 292,50ZM294,50 296,52 299,51 295,49ZM317,54 319,55 318,52 316,53 316,55ZM357,57 358,59 360,58 359,56ZM374,57 376,59 379,58 377,58 376,56ZM2,59 3,58 1,58 3,65 6,65 6,63 3,62ZM5,59 8,62 8,60 6,58ZM9,61 10,63 11,61 14,62 14,60ZM427,145 427,137 425,137 422,142 421,157 423,166 426,163ZM368,174 368,171 364,173 362,188 363,193 367,193 369,183ZM362,200 366,201 365,198 362,198ZM392,264 394,266 397,266 399,264 399,259 397,256 394,256 392,258ZM387,288 388,293 392,298 399,299 405,288 404,278 402,274 399,272 394,273 388,281ZM373,347 374,355 377,359 379,366 387,374 395,378 408,377 417,372 424,365 428,358 430,351 430,338 427,330 427,325 425,321 422,319 422,317 416,312 403,308 394,309 389,313 385,314 378,322 374,334Z",
    "M113,0 214,0 275,12 278,14 294,18 301,22 324,27 327,29 344,30 352,32 456,27 461,25 485,22 499,17 526,11 538,6 543,6 566,0 635,0 653,2 668,7 699,13 759,33 770,35 800,35 800,600 0,600 0,38 2,38 0,37 0,26 12,22 19,22 43,13 62,9 65,7 70,7 89,2ZM69,13 67,14 67,16 69,16ZM54,16 55,17 51,18 51,20 49,18 46,20 44,19 43,21 41,20 42,24 49,22 48,19 50,20 50,22 55,20 53,18 58,19 58,16 57,18 55,15ZM38,23 40,25 40,22 35,23 35,25 37,26ZM28,25 33,26 35,28 35,26 33,26 31,23 30,25 27,24 27,27 23,27 23,25 21,25 16,28 20,27 20,29 23,29 27,32 26,30 24,30 24,27 26,27 26,29ZM11,29 11,31 8,32 8,34 14,31 16,32 16,29ZM11,35 11,37 14,36 12,34ZM426,113 427,96 424,95 422,98 421,114 424,116ZM367,146 368,130 365,129 364,147 367,148ZM396,210 397,208 395,203 391,203 390,213 395,214ZM401,252 401,231 398,228 392,228 389,235 389,257 391,264 394,267 397,267 399,265 401,259ZM396,274 394,274 394,278 396,277ZM426,334 427,315 424,300 417,291 417,289 408,283 396,283 388,287 381,295 377,309 377,339 385,355 389,359 397,362 406,362 410,360 423,346ZM414,366 416,367 416,365 413,365 412,369 416,370 418,367 413,368ZM393,368 393,366 392,368 391,366 389,367 389,369 391,369 393,373 394,372 392,371 392,369 397,371 398,369 401,370 400,368ZM410,368 407,368 406,374 409,369 413,371Z",
    "M113,0 214,0 275,12 278,14 294,18 301,22 324,27 327,29 344,30 352,32 456,27 461,25 485,22 499,17 526,11 538,6 543,6 566,0 635,0 653,2 668,7 699,13 759,33 770,35 800,35 800,600 0,600 0,38 2,38 0,37 0,26 12,22 19,22 43,13 62,9 65,7 70,7 89,2ZM69,13 67,14 67,16 69,16ZM54,16 55,17 51,18 51,20 49,18 46,20 44,19 43,21 41,20 42,24 49,22 48,19 50,20 50,22 55,20 53,18 58,19 58,16 57,18 55,15ZM38,23 40,25 40,22 35,23 35,25 37,26ZM28,25 33,26 35,28 35,26 33,26 31,23 30,25 27,24 27,27 23,27 23,25 21,25 16,28 20,27 20,29 23,29 27,32 26,30 24,30 24,27 26,27 26,29ZM11,29 11,31 8,32 8,34 14,31 16,32 16,29ZM11,35 11,37 14,36 12,34ZM426,113 427,96 424,95 422,98 421,114 424,116ZM367,146 368,130 365,129 364,147 367,148ZM396,210 397,208 395,203 391,203 390,213 395,214ZM401,252 401,231 398,228 392,228 389,235 389,257 391,264 394,267 397,267 399,265 401,259ZM396,274 394,274 394,278 396,277ZM426,334 427,315 424,300 417,291 417,289 408,283 396,283 388,287 381,295 377,309 377,339 385,355 389,359 397,362 406,362 410,360 423,346ZM414,366 416,367 416,365 413,365 412,369 416,370 418,367 413,368ZM393,368 393,366 392,368 391,366 389,367 389,369 391,369 393,373 394,372 392,371 392,369 397,371 398,369 401,370 400,368ZM410,368 407,368 406,374 409,369 413,371Z",
    "M24,0 153,0 152,2 154,0 166,0 177,5 185,5 189,7 213,9 246,15 264,15 287,18 414,18 517,14 578,3 586,0 756,0 758,2 782,8 784,10 790,11 800,16 800,600 0,600 0,17 8,10 10,10 12,7 14,7 15,5 19,4ZM483,22 486,25 486,21 484,20ZM302,24 304,26 307,23ZM422,60 422,65 426,64 425,52 423,52 422,54ZM362,107 366,107 365,95 363,96ZM394,182 395,175 391,173 388,176 388,183 389,185 393,185ZM387,222 391,238 395,239 397,237 398,217 397,209 394,203 391,203 388,206ZM373,328 375,338 381,346 381,348 386,353 391,354 393,356 406,356 414,352 421,344 424,337 422,293 415,276 410,270 406,268 397,267 389,271 385,275 384,279 382,280 379,286 375,299 373,312ZM387,363 388,364 385,365 390,364 390,368 390,365 393,366 391,363ZM406,365 409,365 409,367 397,366 399,368 397,368 396,372 400,371 401,369 405,369 404,372 402,371 401,373 406,373 406,369 410,368 411,366 410,363Z",
    "M0,0 84,0 109,8 598,7 610,6 620,3 638,2 642,0 799,0 800,600 0,600ZM424,28 425,16 422,16 420,31 423,32ZM394,150 395,141 387,140 385,142 385,151 391,153ZM385,195 388,207 392,208 393,206 393,194 390,178 386,179ZM368,301 371,316 374,320 374,323 383,333 393,338 408,337 420,327 426,315 427,293 423,276 420,270 414,263 405,258 388,259 375,271 375,273 372,276 369,286ZM383,347 385,349 389,348 387,344 385,346 383,345ZM390,349 392,349 390,351 395,351 395,353 398,353 398,350 396,351 392,348Z",
    "M0,0 66,0 75,3 690,3 700,2 704,0 800,0 800,600 0,600ZM89,8 91,8 91,10 93,11 92,8 95,7ZM394,122 395,116 392,113 387,113 385,115 385,123 393,124ZM385,156 386,167 390,168 392,163 392,149 388,147 386,149ZM366,295 369,306 379,316 393,319 408,318 426,309 426,307 430,303 432,295 432,283 424,264 415,255 408,252 389,252 380,259 378,259 368,271 366,277Z",
    "M0,0 66,0 75,3 690,3 700,2 704,0 800,0 800,600 0,600ZM89,8 91,8 91,10 93,11 92,8 95,7ZM394,122 395,116 392,113 387,113 385,115 385,123 393,124ZM385,156 386,167 390,168 392,163 392,149 388,147 386,149ZM366,295 369,306 379,316 393,319 408,318 426,309 426,307 430,303 432,295 432,283 424,264 415,255 408,252 389,252 380,259 378,259 368,271 366,277Z",
    "M0,0 55,0 55,2 56,0 66,0 66,2 68,0 130,0 129,2 131,0 182,0 182,2 183,0 187,0 186,2 188,0 227,0 228,2 228,0 287,0 286,2 288,0 335,0 334,2 336,0 349,0 349,2 350,0 360,0 361,2 362,0 364,2 366,2 364,0 367,0 368,2 369,0 389,0 389,2 390,0 421,0 420,2 422,0 455,0 455,2 456,0 510,0 511,2 511,0 620,0 620,2 622,2 622,0 651,0 650,2 652,0 654,0 654,2 655,0 657,0 658,2 658,0 665,0 666,2 668,2 667,0 800,0 800,600 0,600ZM387,81 391,82 392,78 388,77ZM392,132 393,121 389,118 387,120 387,134 388,136 391,136ZM360,289 363,297 369,303 380,309 390,310 394,312 418,311 429,303 429,301 433,297 433,294 435,293 435,274 429,260 421,253 407,247 392,247 383,249 375,253 371,258 368,259 368,261 365,263 362,269 360,278Z",
    "M0,0 800,0 800,600 0,600ZM391,97 392,82 389,81 386,86 385,98 387,101 391,101ZM351,283 355,292 357,292 360,296 367,299 368,301 385,306 406,308 421,306 438,298 445,289 446,276 442,268 438,265 438,263 427,256 408,252 394,252 379,255 362,263 352,275Z",
    "M0,0 800,0 800,600 0,600ZM391,97 392,82 389,81 386,86 385,98 387,101 391,101ZM351,283 355,292 357,292 360,296 367,299 368,301 385,306 406,308 421,306 438,298 445,289 446,276 442,268 438,265 438,263 427,256 408,252 394,252 379,255 362,263 352,275Z",
    "M0,0 800,0 800,600 0,600ZM448,281 449,278 444,269 431,260 410,255 384,255 370,258 362,262 360,265 358,265 351,272 350,289 358,296 371,299 374,301 387,303 415,304 425,303 442,295 448,286ZM379,310 380,312 382,312 380,308ZM391,310 389,312 387,311 388,316 390,315ZM394,312 395,314 398,313 395,312 395,309 393,309 393,313Z",
    "M0,0 800,0 800,600 0,600ZM448,281 449,278 444,269 431,260 410,255 384,255 370,258 362,262 360,265 358,265 351,272 350,289 358,296 371,299 374,301 387,303 415,304 425,303 442,295 448,286ZM379,310 380,312 382,312 380,308ZM391,310 389,312 387,311 388,316 390,315ZM394,312 395,314 398,313 395,312 395,309 393,309 393,313Z",
    "M0,0 800,0 800,600 0,600ZM354,286 358,296 366,303 393,308 413,308 424,306 436,300 444,290 445,279 438,262 433,257 425,253 419,253 415,251 403,251 381,253 367,258 357,267 355,271ZM433,309 430,309 427,312 422,312 422,314 415,313 415,315 413,315 410,318 412,318 413,316 420,317 420,315 424,317 422,315 424,315 425,312 429,313 429,311 433,311ZM381,312 381,314 379,312 380,316 382,316 383,313 384,317 387,317 388,315 388,318 391,318 389,317 391,314 388,315 386,313 387,315 385,315 383,311ZM393,315 393,318 395,319 395,314ZM406,315 408,318 412,314Z",
    "M0,0 800,0 800,600 0,600ZM358,285 363,301 372,312 374,312 376,315 382,318 393,319 401,315 410,312 415,312 427,307 436,296 438,290 438,278 432,261 430,260 429,256 427,255 426,251 421,245 415,242 399,242 386,245 381,248 377,248 362,261 358,274ZM412,320 415,321 419,319 415,318 415,320Z",
    "M0,0 800,0 800,600 0,600ZM355,287 359,302 369,315 371,315 374,319 384,323 402,325 407,324 415,315 424,312 434,304 438,297 440,280 438,269 433,258 430,256 429,252 415,238 405,234 390,234 383,238 379,246 369,250 359,260 355,272Z",
    "M0,0 800,0 800,600 0,600ZM371,242 372,244 364,252 362,252 362,254 357,259 352,273 352,290 362,315 369,322 371,322 378,328 381,328 385,331 392,333 409,334 417,333 427,329 434,321 432,310 437,305 444,291 443,272 436,250 422,235 420,235 412,229 404,228 401,226 385,227 376,230 371,236ZM417,323 418,325 421,325 417,328 413,328 413,324 416,325Z",
    "M0,0 800,0 800,600 0,600ZM327,262 328,266 333,268 337,268 341,264 345,265 346,293 348,300 353,310 358,315 358,317 369,328 373,329 379,334 396,340 419,340 430,337 443,331 457,319 457,317 464,309 469,297 468,286 464,282 456,279 455,273 450,263 448,262 444,254 441,252 441,250 436,246 436,244 423,232 405,225 399,225 389,222 378,222 370,223 359,228 356,228 352,230 350,233 348,233 345,237 343,237 335,245 331,254 328,256Z",
    "M0,0 800,0 800,600 0,600ZM412,153 418,161 418,167 413,175 413,186 415,190 421,195 425,204 428,206 431,216 421,214 417,212 415,209 399,207 368,208 360,212 350,214 343,218 340,222 338,222 333,228 327,231 319,239 317,244 316,260 312,264 312,266 309,266 304,271 301,279 300,290 298,295 298,309 304,329 310,341 314,344 317,351 322,355 322,357 327,361 327,363 339,372 341,372 342,374 344,374 345,376 361,378 371,375 385,375 387,373 387,369 377,351 381,351 386,355 401,359 439,360 457,357 459,355 470,353 485,346 486,344 500,336 518,317 518,314 522,312 522,310 525,308 528,300 531,297 539,274 541,260 541,234 539,230 538,221 533,206 525,190 513,178 509,171 503,168 498,162 490,158 484,152 463,148 457,142 446,137 430,136 423,138 413,146ZM466,155 472,158 481,166 481,168 495,182 497,189 494,188 480,172 476,171 474,168 467,165 467,163 464,160 464,157ZM369,159 375,166 389,168 393,171 402,170 408,163 408,158 406,154 401,151 382,153 378,150 375,150 369,154ZM523,181 528,185 529,189 537,199 539,208 544,218 546,228 546,251 544,256 544,262 548,263 553,256 552,240 555,223 554,210 546,195 543,193 541,189 537,187 536,183 528,175 523,176ZM405,188 406,187 404,186 404,190 402,190 402,188 401,190 405,190 406,194 409,196ZM441,219 444,219 453,229 455,233 454,236 450,236 444,231 440,224ZM460,243 462,243 464,246 463,257 460,251ZM329,251 333,253 332,258 329,260 329,262 326,264 324,268 324,276 322,282 319,282 319,263 321,259 324,258ZM421,272 428,274 428,277 430,278 429,281 416,285 414,287 407,286 412,282 416,282 418,280 416,275ZM508,295 510,295 512,298 511,303 502,313 499,313 499,309 504,304ZM492,316 495,318 494,322 487,325 482,330 472,333 466,339 460,339 468,332 481,326ZM473,360 471,359 469,361 469,366 473,362ZM459,363 456,363 454,366 456,366ZM425,370 427,370 426,373 428,373 429,369ZM444,370 445,371 442,372 448,370 450,371 450,368 448,370ZM391,381 395,385 401,387 414,388 418,385 418,382 416,380 413,380 407,376 400,374 391,374ZM375,384 375,386 378,388 378,383 375,382ZM385,385 382,382 380,382 379,384 379,386 381,387 386,387ZM382,389 385,389 387,392 390,391 390,389 388,391 385,388Z",
    "M0,0 800,0 800,600 0,600ZM412,153 418,161 418,167 413,175 413,186 415,190 421,195 425,204 428,206 431,216 421,214 417,212 415,209 399,207 368,208 360,212 350,214 343,218 340,222 338,222 333,228 327,231 319,239 317,244 316,260 312,264 312,266 309,266 304,271 301,279 300,290 298,295 298,309 304,329 310,341 314,344 317,351 322,355 322,357 327,361 327,363 339,372 341,372 342,374 344,374 345,376 361,378 371,375 385,375 387,373 387,369 377,351 381,351 386,355 401,359 439,360 457,357 459,355 470,353 485,346 486,344 500,336 518,317 518,314 522,312 522,310 525,308 528,300 531,297 539,274 541,260 541,234 539,230 538,221 533,206 525,190 513,178 509,171 503,168 498,162 490,158 484,152 463,148 457,142 446,137 430,136 423,138 413,146ZM466,155 472,158 481,166 481,168 495,182 497,189 494,188 480,172 476,171 474,168 467,165 467,163 464,160 464,157ZM369,159 375,166 389,168 393,171 402,170 408,163 408,158 406,154 401,151 382,153 378,150 375,150 369,154ZM523,181 528,185 529,189 537,199 539,208 544,218 546,228 546,251 544,256 544,262 548,263 553,256 552,240 555,223 554,210 546,195 543,193 541,189 537,187 536,183 528,175 523,176ZM405,188 406,187 404,186 404,190 402,190 402,188 401,190 405,190 406,194 409,196ZM441,219 444,219 453,229 455,233 454,236 450,236 444,231 440,224ZM460,243 462,243 464,246 463,257 460,251ZM329,251 333,253 332,258 329,260 329,262 326,264 324,268 324,276 322,282 319,282 319,263 321,259 324,258ZM421,272 428,274 428,277 430,278 429,281 416,285 414,287 407,286 412,282 416,282 418,280 416,275ZM508,295 510,295 512,298 511,303 502,313 499,313 499,309 504,304ZM492,316 495,318 494,322 487,325 482,330 472,333 466,339 460,339 468,332 481,326ZM473,360 471,359 469,361 469,366 473,362ZM459,363 456,363 454,366 456,366ZM425,370 427,370 426,373 428,373 429,369ZM444,370 445,371 442,372 448,370 450,371 450,368 448,370ZM391,381 395,385 401,387 414,388 418,385 418,382 416,380 413,380 407,376 400,374 391,374ZM375,384 375,386 378,388 378,383 375,382ZM385,385 382,382 380,382 379,384 379,386 381,387 386,387ZM382,389 385,389 387,392 390,391 390,389 388,391 385,388Z",
    "M0,0 800,0 800,600 0,600ZM449,78 457,86 466,89 471,89 472,91 484,93 495,98 498,98 502,101 505,101 513,105 524,114 542,114 542,108 533,98 523,93 513,85 502,83 478,71 463,66 456,66 450,71ZM419,96 420,94 416,91 390,92 383,95 381,97 381,100 377,103 354,106 352,108 346,109 335,114 329,119 327,128 331,134 350,139 354,141 354,143 358,147 358,156 355,158 351,158 349,161 346,162 345,173 351,179 373,189 375,193 361,193 340,198 330,202 327,206 320,210 312,218 312,220 302,229 302,231 299,233 299,235 293,242 276,279 276,297 281,312 281,316 284,322 287,351 294,366 296,367 299,374 301,375 307,386 310,388 310,390 331,413 333,413 337,418 341,419 342,421 358,429 372,433 383,439 408,444 428,444 443,442 448,439 458,437 461,434 476,428 482,421 482,415 480,411 471,405 451,400 447,395 449,388 453,384 473,379 477,376 491,372 492,370 501,368 507,364 514,363 522,356 538,347 552,334 553,331 556,330 557,326 560,323 560,320 563,316 567,314 569,309 568,302 566,300 561,300 559,304 556,306 554,314 550,317 550,319 542,319 543,315 549,309 550,305 553,302 555,284 557,285 557,288 559,290 565,290 566,296 571,299 575,297 578,291 577,263 568,239 568,226 571,216 571,197 565,179 558,165 552,158 551,154 547,151 545,146 534,136 532,132 528,131 525,127 523,127 521,124 519,124 503,112 496,109 492,109 483,104 462,98 450,98 445,102 445,104 448,107 465,110 465,112 463,112 459,116 459,122 465,127 477,132 482,137 482,140 475,142 467,142 453,138 426,125 413,115 411,102ZM544,126 548,129 548,131 560,145 567,145 568,137 560,127 551,123 548,120 544,121ZM321,147 322,144 316,137 302,137 296,140 291,140 286,144 283,144 275,148 274,150 271,150 268,153 266,153 259,160 256,166 256,175 260,179 266,179 270,177 278,169 288,167 290,165 304,161 305,159 314,156 318,153ZM554,151 557,152 556,149 554,149ZM312,164 310,165 310,167 312,167ZM290,173 294,172 288,172 288,174 285,174 290,176 288,175ZM288,178 288,181 290,178 294,177 292,176ZM279,179 277,179 278,185 279,181 281,183 280,180 285,182 285,180 282,180 280,178ZM401,188 409,189 418,194 428,203 428,205 432,209 432,212 428,212 420,208 419,206 415,205 414,203 409,202 408,200 405,200 400,196 397,196 396,190ZM445,214 448,214 453,218 454,222 459,228 458,231 452,228 452,226 447,222ZM560,214 562,215 561,225 563,241 569,264 569,275 565,283 561,280 559,275 559,251 557,248 557,242 553,228 556,216ZM405,274 419,276 426,281 426,289 424,293 421,295 421,297 419,297 418,299 413,299 409,296 402,296 400,298 395,298 392,296 391,293 398,288 400,280ZM297,296 300,296 303,302 303,327 308,345 311,350 311,358 307,357 300,351 297,343 294,339 292,339 290,335 290,324 292,320 292,304ZM524,367 522,367 519,370 516,369 516,372ZM510,372 511,373 506,373 506,375 504,376 499,376 498,380 497,378 495,378 494,383 497,383 495,380 500,380 500,382 498,383 502,383 500,379 502,378 504,380 504,377 509,376 508,374 514,375 515,371 514,373 512,373 513,370 512,372ZM483,383 481,383 479,387 478,385 474,385 473,387 469,387 469,389 458,390 457,393 458,395 461,394 465,397 466,395 468,397 476,396 478,392 480,393 482,391 480,388 485,388 484,385 486,384ZM478,388 480,389 480,391 475,392 474,389 477,390ZM472,391 474,391 474,394 470,394 470,392ZM535,393 536,389 531,386 521,387 516,391 510,393 503,399 499,400 497,403 495,403 491,408 491,413 493,416 505,415 508,412 513,411 515,408 527,402ZM469,421 473,421 473,423 467,424 467,422Z",
    "M0,0 800,0 800,600 0,600ZM449,78 457,86 466,89 471,89 472,91 484,93 495,98 498,98 502,101 505,101 513,105 524,114 542,114 542,108 533,98 523,93 513,85 502,83 478,71 463,66 456,66 450,71ZM419,96 420,94 416,91 390,92 383,95 381,97 381,100 377,103 354,106 352,108 346,109 335,114 329,119 327,128 331,134 350,139 354,141 354,143 358,147 358,156 355,158 351,158 349,161 346,162 345,173 351,179 373,189 375,193 361,193 340,198 330,202 327,206 320,210 312,218 312,220 302,229 302,231 299,233 299,235 293,242 276,279 276,297 281,312 281,316 284,322 287,351 294,366 296,367 299,374 301,375 307,386 310,388 310,390 331,413 333,413 337,418 341,419 342,421 358,429 372,433 383,439 408,444 428,444 443,442 448,439 458,437 461,434 476,428 482,421 482,415 480,411 471,405 451,400 447,395 449,388 453,384 473,379 477,376 491,372 492,370 501,368 507,364 514,363 522,356 538,347 552,334 553,331 556,330 557,326 560,323 560,320 563,316 567,314 569,309 568,302 566,300 561,300 559,304 556,306 554,314 550,317 550,319 542,319 543,315 549,309 550,305 553,302 555,284 557,285 557,288 559,290 565,290 566,296 571,299 575,297 578,291 577,263 568,239 568,226 571,216 571,197 565,179 558,165 552,158 551,154 547,151 545,146 534,136 532,132 528,131 525,127 523,127 521,124 519,124 503,112 496,109 492,109 483,104 462,98 450,98 445,102 445,104 448,107 465,110 465,112 463,112 459,116 459,122 465,127 477,132 482,137 482,140 475,142 467,142 453,138 426,125 413,115 411,102ZM544,126 548,129 548,131 560,145 567,145 568,137 560,127 551,123 548,120 544,121ZM321,147 322,144 316,137 302,137 296,140 291,140 286,144 283,144 275,148 274,150 271,150 268,153 266,153 259,160 256,166 256,175 260,179 266,179 270,177 278,169 288,167 290,165 304,161 305,159 314,156 318,153ZM554,151 557,152 556,149 554,149ZM312,164 310,165 310,167 312,167ZM290,173 294,172 288,172 288,174 285,174 290,176 288,175ZM288,178 288,181 290,178 294,177 292,176ZM279,179 277,179 278,185 279,181 281,183 280,180 285,182 285,180 282,180 280,178ZM401,188 409,189 418,194 428,203 428,205 432,209 432,212 428,212 420,208 419,206 415,205 414,203 409,202 408,200 405,200 400,196 397,196 396,190ZM445,214 448,214 453,218 454,222 459,228 458,231 452,228 452,226 447,222ZM560,214 562,215 561,225 563,241 569,264 569,275 565,283 561,280 559,275 559,251 557,248 557,242 553,228 556,216ZM405,274 419,276 426,281 426,289 424,293 421,295 421,297 419,297 418,299 413,299 409,296 402,296 400,298 395,298 392,296 391,293 398,288 400,280ZM297,296 300,296 303,302 303,327 308,345 311,350 311,358 307,357 300,351 297,343 294,339 292,339 290,335 290,324 292,320 292,304ZM524,367 522,367 519,370 516,369 516,372ZM510,372 511,373 506,373 506,375 504,376 499,376 498,380 497,378 495,378 494,383 497,383 495,380 500,380 500,382 498,383 502,383 500,379 502,378 504,380 504,377 509,376 508,374 514,375 515,371 514,373 512,373 513,370 512,372ZM483,383 481,383 479,387 478,385 474,385 473,387 469,387 469,389 458,390 457,393 458,395 461,394 465,397 466,395 468,397 476,396 478,392 480,393 482,391 480,388 485,388 484,385 486,384ZM478,388 480,389 480,391 475,392 474,389 477,390ZM472,391 474,391 474,394 470,394 470,392ZM535,393 536,389 531,386 521,387 516,391 510,393 503,399 499,400 497,403 495,403 491,408 491,413 493,416 505,415 508,412 513,411 515,408 527,402ZM469,421 473,421 473,423 467,424 467,422Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,456.3 1348.9,454.3 1265.9,454.3 1223.9,455.3 1214.9,457.3 1060.9,457.3 995.9,460.3 944.9,466.3 934.9,470.3 928.9,470.3 927.9,472.3 922.9,474.3 918.9,474.3 913.9,479.3 906.9,481.3 903.9,484.3 893.9,504.3 892.9,511.3 894.9,511.3 894.9,518.3 902.9,518.3 905.9,515.3 908.9,516.3 910.9,514.3 917.9,514.3 920.9,516.3 922.9,515.3 923.9,517.3 925.9,516.3 926.9,518.3 931.9,518.3 932.9,520.3 937.9,519.3 941.9,522.3 945.9,520.3 946.9,522.3 948.9,521.3 950.9,524.3 952.9,522.3 955.9,523.3 956.9,521.3 959.9,522.3 961.9,520.3 961.9,522.3 958.9,523.3 959.9,525.3 961.9,523.3 964.9,524.3 966.9,522.3 966.9,524.3 963.9,525.3 964.9,527.3 968.9,527.3 970.9,525.3 971.9,527.3 969.9,527.3 969.9,529.3 974.9,529.3 978.9,527.3 974.9,530.3 975.9,532.3 978.9,530.3 980.9,530.3 979.9,532.3 984.9,530.3 983.9,532.3 979.9,533.3 981.9,535.3 985.9,533.3 990.9,533.3 984.9,538.3 998.9,536.3 997.9,538.3 992.9,539.3 992.9,541.3 998.9,541.3 1000.9,539.3 1002.9,539.3 1002.9,541.3 1007.9,539.3 1006.9,541.3 1001.9,542.3 1000.9,545.3 1003.9,543.3 1005.9,543.3 1004.9,545.3 1008.9,543.3 1010.9,543.3 1009.9,545.3 1015.9,543.3 1015.9,545.3 1009.9,546.3 1010.9,548.3 1020.9,547.3 1020.9,549.3 1026.9,547.3 1025.9,549.3 1019.9,550.3 1019.9,552.3 1016.9,551.3 1018.9,553.3 1037.9,553.3 1009.9,562.3 963.9,589.3 960.9,589.3 947.9,595.3 930.9,599.3 890.9,603.3 784.9,605.3 708.9,609.3 703.9,604.3 704.9,602.3 701.9,598.3 693.9,596.3 702.9,588.3 704.9,588.3 716.9,575.3 730.9,568.3 739.9,558.3 739.9,556.3 741.9,556.3 744.9,553.3 745.9,549.3 747.9,548.3 749.9,539.3 749.9,519.3 745.9,510.3 743.9,510.3 739.9,506.3 729.9,504.3 720.9,505.3 712.9,511.3 708.9,511.3 705.9,513.3 700.9,513.3 698.9,509.3 698.9,505.3 703.9,497.3 703.9,494.3 706.9,492.3 712.9,478.3 712.9,473.3 710.9,471.3 712.9,468.3 718.9,443.3 719.9,364.3 717.9,359.3 717.9,349.3 715.9,344.3 714.9,330.3 708.9,312.3 707.9,302.3 696.9,277.3 681.9,263.3 670.9,261.3 662.9,266.3 660.9,275.3 658.9,277.3 657.9,286.3 652.9,292.3 650.9,299.3 645.9,304.3 642.9,311.3 634.9,311.3 626.9,305.3 615.9,278.3 607.9,245.3 607.9,216.3 605.9,215.3 607.9,212.3 605.9,207.3 606.9,186.3 604.9,175.3 598.9,169.3 583.9,169.3 577.9,166.3 569.9,158.3 565.9,147.3 565.9,139.3 568.9,136.3 574.9,136.3 578.9,131.3 578.9,127.3 576.9,123.3 573.9,121.3 571.9,113.3 575.9,113.3 579.9,116.3 587.9,136.3 594.9,144.3 602.9,144.3 610.9,139.3 612.9,135.3 612.9,122.3 610.9,118.3 607.9,116.3 607.9,114.3 603.9,112.3 594.9,102.3 592.9,102.3 583.9,93.3 583.9,91.3 563.9,72.3 561.9,72.3 545.9,60.3 541.9,59.3 540.9,57.3 532.9,53.3 528.9,53.3 503.9,39.3 500.9,39.3 496.9,36.3 493.9,36.3 489.9,33.3 486.9,33.3 478.9,29.3 466.9,27.3 442.9,19.3 427.9,17.3 423.9,15.3 388.9,14.3 345.9,15.3 342.9,17.3 317.9,20.3 311.9,23.3 310.9,25.3 306.9,26.3 303.9,30.3 301.9,30.3 296.9,38.3 296.9,43.3 298.9,47.3 303.9,51.3 311.9,53.3 314.9,56.3 314.9,60.3 310.9,64.3 294.9,71.3 280.9,73.3 272.9,76.3 257.9,77.3 235.9,84.3 201.9,101.3 192.9,110.3 192.9,112.3 176.9,126.3 166.9,125.3 166.9,120.3 172.9,109.3 175.9,107.3 175.9,105.3 183.9,98.3 186.9,90.3 187.9,81.3 192.9,76.3 203.9,73.3 210.9,69.3 212.9,67.3 213.9,61.3 210.9,58.3 205.9,57.3 202.9,60.3 200.9,60.3 200.9,62.3 191.9,63.3 177.9,70.3 176.9,72.3 168.9,76.3 166.9,79.3 164.9,79.3 162.9,82.3 160.9,82.3 158.9,85.3 156.9,85.3 154.9,88.3 152.9,88.3 146.9,95.3 144.9,95.3 140.9,100.3 138.9,100.3 132.9,108.3 131.9,114.3 134.9,117.3 146.9,116.3 146.9,123.3 141.9,132.3 139.9,133.3 139.9,135.3 137.9,136.3 137.9,138.3 135.9,139.3 135.9,141.3 133.9,142.3 133.9,144.3 130.9,146.3 130.9,148.3 127.9,150.3 127.9,152.3 124.9,154.3 119.9,164.3 117.9,165.3 113.9,180.3 114.9,184.3 120.9,191.3 132.9,193.3 133.9,195.3 138.9,196.3 142.9,200.3 143.9,211.3 139.9,216.3 135.9,226.3 136.9,238.3 141.9,242.3 149.9,241.3 152.9,244.3 167.9,250.3 185.9,250.3 208.9,238.3 221.9,225.3 223.9,225.3 227.9,220.3 241.9,212.3 245.9,207.3 257.9,202.3 263.9,202.3 267.9,205.3 263.9,217.3 261.9,218.3 255.9,230.3 251.9,233.3 249.9,239.3 247.9,240.3 240.9,254.3 238.9,261.3 235.9,264.3 233.9,273.3 229.9,279.3 226.9,290.3 224.9,292.3 222.9,300.3 222.9,314.3 219.9,321.3 219.9,330.3 216.9,343.3 216.9,395.3 222.9,429.3 227.9,444.3 227.9,450.3 234.9,467.3 238.9,472.3 246.9,474.3 249.9,472.3 251.9,464.3 255.9,466.3 261.9,484.3 283.9,527.3 290.9,535.3 290.9,537.3 316.9,563.3 318.9,563.3 320.9,566.3 322.9,566.3 324.9,569.3 326.9,569.3 333.9,575.3 343.9,580.3 346.9,580.3 354.9,585.3 369.9,590.3 376.9,597.3 368.9,598.3 374.9,604.3 376.9,604.3 384.9,611.3 386.9,611.3 386.9,613.3 388.9,613.3 389.9,616.3 398.9,621.3 410.9,632.3 412.9,631.3 413.9,633.3 415.9,633.3 419.9,638.3 421.9,638.3 425.9,643.3 428.9,643.3 436.9,651.3 442.9,653.3 447.9,658.3 450.9,657.3 454.9,661.3 457.9,661.3 460.9,664.3 467.9,666.3 468.9,668.3 469.9,667.3 465.9,663.3 463.9,664.3 456.9,656.3 455.9,659.3 447.9,650.3 443.9,649.3 437.9,642.3 435.9,644.3 428.9,636.3 426.9,636.3 424.9,633.3 418.9,630.3 407.9,619.3 407.9,617.3 396.9,606.3 394.9,601.3 391.9,598.3 389.9,598.3 400.9,596.3 393.9,593.3 383.9,584.3 377.9,572.3 371.9,566.3 361.9,562.3 348.9,560.3 347.9,558.3 343.9,557.3 341.9,554.3 337.9,553.3 336.9,551.3 325.9,545.3 323.9,542.3 318.9,540.3 313.9,534.3 308.9,532.3 308.9,530.3 302.9,524.3 299.9,515.3 296.9,511.3 292.9,494.3 290.9,491.3 288.9,473.3 296.9,472.3 302.9,475.3 311.9,474.3 312.9,476.3 314.9,476.3 316.9,479.3 320.9,481.3 321.9,484.3 324.9,485.3 328.9,493.3 335.9,501.3 342.9,504.3 343.9,506.3 352.9,509.3 360.9,516.3 360.9,518.3 363.9,520.3 363.9,522.3 365.9,523.3 366.9,527.3 368.9,528.3 374.9,539.3 388.9,551.3 399.9,555.3 400.9,557.3 447.9,580.3 454.9,586.3 457.9,586.3 458.9,588.3 472.9,596.3 465.9,598.3 473.9,602.3 474.9,604.3 478.9,604.3 487.9,610.3 491.9,610.3 492.9,612.3 497.9,613.3 498.9,615.3 502.9,615.3 504.9,617.3 516.9,620.3 515.9,623.3 518.9,626.3 517.9,629.3 519.9,629.3 518.9,631.3 520.9,634.3 517.9,634.3 513.9,637.3 510.9,637.3 508.9,635.3 510.9,639.3 507.9,640.3 498.9,650.3 493.9,662.3 492.9,677.3 495.9,679.3 498.9,687.3 502.9,691.3 501.9,694.3 506.9,697.3 508.9,702.3 511.9,704.3 511.9,706.3 514.9,708.3 517.9,714.3 521.9,717.3 521.9,719.3 534.9,732.3 534.9,734.3 567.9,766.3 569.9,766.3 573.9,771.3 575.9,771.3 581.9,777.3 583.9,777.3 596.9,787.3 600.9,788.3 601.9,790.3 634.9,806.3 637.9,806.3 650.9,813.3 653.9,813.3 663.9,819.3 666.9,819.3 678.9,825.3 679.9,827.3 691.9,832.3 692.9,834.3 698.9,836.3 699.9,838.3 703.9,839.3 709.9,844.3 713.9,845.3 714.9,847.3 721.9,850.3 722.9,852.3 724.9,852.3 725.9,854.3 727.9,854.3 728.9,856.3 730.9,856.3 731.9,858.3 733.9,858.3 734.9,860.3 736.9,860.3 737.9,862.3 739.9,862.3 740.9,864.3 742.9,864.3 743.9,866.3 757.9,874.3 759.9,877.3 770.9,883.3 772.9,886.3 774.9,886.3 782.9,893.3 790.9,897.3 792.9,900.3 800.9,904.3 802.9,907.3 804.9,907.3 805.9,909.3 813.9,913.3 815.9,916.3 826.9,922.3 828.9,925.3 830.9,925.3 831.9,927.3 833.9,927.3 834.9,929.3 836.9,929.3 837.9,931.3 839.9,931.3 840.9,933.3 842.9,933.3 858.9,945.3 862.9,946.3 869.9,952.3 873.9,953.3 877.9,957.3 881.9,958.3 882.9,960.3 886.9,961.3 887.9,963.3 891.9,964.3 897.9,969.3 903.9,971.3 904.9,973.3 910.9,975.3 911.9,977.3 923.9,982.3 924.9,984.3 942.9,993.3 945.9,993.3 955.9,999.3 958.9,999.3 962.9,1002.3 965.9,1002.3 982.9,1010.3 1015.9,1021.3 1033.9,1025.3 1036.9,1027.3 1044.9,1028.3 1047.9,1030.3 1059.9,1032.3 1062.9,1034.3 1078.9,1037.3 1081.9,1039.3 1117.9,1048.3 1200.9,1076.3 1202.9,1078.3 1208.9,1079.3 1210.9,1081.3 1229.9,1087.3 1251.9,1097.3 1257.9,1098.3 1271.9,1105.3 1274.9,1105.3 1276.9,1107.3 1279.9,1107.3 1281.9,1109.3 1284.9,1109.3 1303.9,1118.3 1306.9,1118.3 1325.9,1127.3 1338.9,1131.3 1342.9,1134.3 1345.9,1134.3 1347.9,1136.3 1350.9,1136.3 1364.9,1143.3 1367.9,1143.3 1369.9,1145.3 1372.9,1145.3 1374.9,1147.3 1377.9,1147.3 1386.9,1152.3 1396.9,1155.3 1397.9,1286.3 -602.1,1286.3 -602.1,1126.3 -574.1,1126.3 -575.1,1095.3 -578.1,1078.3 -580.1,1074.3 -540.1,1074.3 -522.1,1076.3 -522.1,1052.3 -527.1,1031.3 -479.1,1035.3 -479.1,1017.3 -484.1,997.3 -464.1,998.3 -433.1,1004.3 -415.1,1010.3 -409.1,1014.3 -406.1,1014.3 -367.1,1035.3 -350.1,1040.3 -326.1,1041.3 -301.1,1036.3 -284.1,1030.3 -282.1,1028.3 -279.1,1028.3 -271.1,1023.3 -268.1,1023.3 -260.1,1019.3 -259.1,1017.3 -249.1,1013.3 -248.1,1011.3 -242.1,1009.3 -236.1,1004.3 -232.1,1003.3 -231.1,1001.3 -229.1,1001.3 -228.1,999.3 -226.1,999.3 -225.1,997.3 -223.1,997.3 -222.1,995.3 -218.1,994.3 -216.1,991.3 -205.1,985.3 -192.1,974.3 -190.1,974.3 -181.1,962.3 -181.1,960.3 -179.1,959.3 -179.1,957.3 -177.1,956.3 -177.1,954.3 -175.1,953.3 -175.1,951.3 -173.1,950.3 -172.1,946.3 -166.1,939.3 -165.1,935.3 -159.1,928.3 -155.1,919.3 -153.1,918.3 -144.1,901.3 -142.1,900.3 -140.1,894.3 -138.1,893.3 -128.1,873.3 -126.1,872.3 -121.1,860.3 -119.1,859.3 -102.1,825.3 -102.1,822.3 -97.1,814.3 -97.1,811.3 -94.1,807.3 -94.1,804.3 -91.1,800.3 -84.1,779.3 -82.1,777.3 -81.1,771.3 -79.1,769.3 -74.1,751.3 -72.1,749.3 -65.1,725.3 -63.1,723.3 -61.1,714.3 -59.1,712.3 -52.1,691.3 -41.1,669.3 -41.1,666.3 -17.1,618.3 -15.1,617.3 -11.1,609.3 -18.1,533.3 -28.1,483.3 -33.1,441.3 -38.1,425.3 -43.1,416.3 -45.1,415.3 -45.1,413.3 -53.1,405.3 -55.1,405.3 -56.1,403.3 -65.1,398.3 -75.1,395.3 -88.1,394.3 -100.1,403.3 -102.1,403.3 -103.1,405.3 -105.1,405.3 -106.1,407.3 -108.1,407.3 -109.1,409.3 -111.1,409.3 -113.1,412.3 -115.1,412.3 -117.1,415.3 -123.1,418.3 -126.1,422.3 -132.1,425.3 -136.1,430.3 -138.1,430.3 -142.1,435.3 -144.1,435.3 -162.1,453.3 -164.1,453.3 -193.1,484.3 -193.1,486.3 -197.1,489.3 -197.1,491.3 -206.1,501.3 -208.1,506.3 -211.1,508.3 -216.1,518.3 -220.1,522.3 -221.1,526.3 -223.1,527.3 -224.1,531.3 -226.1,532.3 -227.1,536.3 -229.1,537.3 -231.1,543.3 -233.1,544.3 -236.1,552.3 -238.1,553.3 -240.1,559.3 -242.1,560.3 -256.1,587.3 -258.1,588.3 -262.1,597.3 -264.1,598.3 -272.1,613.3 -276.1,617.3 -277.1,621.3 -279.1,622.3 -279.1,624.3 -281.1,625.3 -281.1,627.3 -283.1,628.3 -283.1,630.3 -285.1,631.3 -285.1,633.3 -287.1,634.3 -287.1,636.3 -289.1,637.3 -289.1,639.3 -291.1,640.3 -291.1,642.3 -293.1,643.3 -293.1,645.3 -295.1,646.3 -295.1,648.3 -297.1,649.3 -297.1,651.3 -299.1,652.3 -307.1,666.3 -310.1,668.3 -318.1,682.3 -321.1,684.3 -329.1,698.3 -332.1,700.3 -340.1,714.3 -343.1,716.3 -343.1,718.3 -345.1,719.3 -345.1,721.3 -347.1,722.3 -347.1,724.3 -349.1,725.3 -349.1,727.3 -351.1,728.3 -351.1,730.3 -353.1,731.3 -353.1,733.3 -355.1,734.3 -355.1,736.3 -357.1,737.3 -357.1,739.3 -359.1,740.3 -359.1,742.3 -361.1,743.3 -361.1,745.3 -363.1,746.3 -363.1,748.3 -375.1,764.3 -376.1,768.3 -382.1,775.3 -383.1,779.3 -387.1,783.3 -393.1,795.3 -397.1,799.3 -398.1,803.3 -400.1,804.3 -401.1,808.3 -403.1,809.3 -404.1,813.3 -409.1,819.3 -411.1,825.3 -416.1,831.3 -418.1,837.3 -420.1,838.3 -422.1,844.3 -424.1,845.3 -432.1,862.3 -434.1,863.3 -438.1,873.3 -440.1,874.3 -445.1,886.3 -447.1,887.3 -453.1,901.3 -455.1,902.3 -478.1,948.3 -479.1,945.3 -461.1,874.3 -462.1,873.3 -469.1,887.3 -471.1,888.3 -473.1,894.3 -475.1,895.3 -477.1,901.3 -479.1,902.3 -482.1,910.3 -484.1,911.3 -488.1,921.3 -490.1,922.3 -493.1,930.3 -495.1,931.3 -499.1,941.3 -501.1,942.3 -506.1,954.3 -508.1,955.3 -520.1,979.3 -521.1,976.3 -501.1,897.3 -502.1,895.3 -510.1,910.3 -512.1,911.3 -513.1,915.3 -515.1,916.3 -516.1,920.3 -518.1,921.3 -520.1,927.3 -522.1,928.3 -523.1,932.3 -525.1,933.3 -527.1,939.3 -529.1,940.3 -531.1,946.3 -533.1,947.3 -535.1,953.3 -537.1,954.3 -539.1,960.3 -541.1,961.3 -543.1,967.3 -545.1,968.3 -548.1,976.3 -550.1,977.3 -557.1,992.3 -563.1,1000.3 -571.1,1017.3 -573.1,1018.3 -573.1,1014.3 -549.1,919.3 -551.1,920.3 -559.1,935.3 -563.1,939.3 -564.1,943.3 -568.1,947.3 -569.1,951.3 -576.1,960.3 -577.1,964.3 -579.1,965.3 -580.1,969.3 -582.1,970.3 -583.1,974.3 -585.1,975.3 -586.1,979.3 -588.1,980.3 -589.1,984.3 -591.1,985.3 -592.1,989.3 -594.1,990.3 -595.1,994.3 -597.1,995.3 -598.1,999.3 -602.1,1004.3 -602.1,164.3 -578.1,156.3 -574.1,156.3 -565.1,152.3 -554.1,150.3 -548.1,147.3 -537.1,145.3 -531.1,142.3 -520.1,140.3 -511.1,136.3 -507.1,136.3 -464.1,121.3 -444.1,111.3 -435.1,103.3 -433.1,103.3 -429.1,99.3 -423.1,88.3 -423.1,74.3 -429.1,61.3 -435.1,55.3 -435.1,53.3 -462.1,28.3 -464.1,28.3 -466.1,25.3 -468.1,25.3 -470.1,22.3 -475.1,20.3 -477.1,17.3 -479.1,17.3 -489.1,9.3 -493.1,8.3 -497.1,4.3 -501.1,3.3 -502.1,1.3 -506.1,0.3 -512.1,-4.7 -518.1,-6.7 -519.1,-8.7 -525.1,-10.7 -526.1,-12.7 -575.1,-37.7 -578.1,-37.7 -590.1,-44.7 -602.1,-48.7 -602.1,-154.7 -593.1,-151.7 -583.1,-145.7 -580.1,-145.7 -572.1,-140.7 -569.1,-140.7 -561.1,-135.7 -551.1,-132.7 -545.1,-128.7 -542.1,-128.7 -538.1,-125.7 -535.1,-125.7 -531.1,-122.7 -528.1,-122.7 -524.1,-119.7 -511.1,-115.7 -507.1,-112.7 -504.1,-112.7 -487.1,-104.7 -481.1,-103.7 -479.1,-101.7 -455.1,-93.7 -453.1,-91.7 -444.1,-89.7 -442.1,-87.7 -433.1,-85.7 -431.1,-83.7 -419.1,-80.7 -417.1,-78.7 -357.1,-58.7 -353.1,-58.7 -341.1,-53.7 -337.1,-53.7 -331.1,-50.7 -327.1,-50.7 -321.1,-47.7 -317.1,-47.7 -311.1,-44.7 -275.1,-35.7 -272.1,-33.7 -260.1,-31.7 -257.1,-29.7 -225.1,-21.7 -220.1,-21.7 -212.1,-18.7 -207.1,-18.7 -203.1,-16.7 -167.1,-10.7 -162.1,-8.7 -100.1,-1.7 -51.1,-1.7 -4.1,-4.7 117.9,-6.7 175.9,-11.7 206.9,-12.7 211.9,-7.7 211.9,-2.7 208.9,1.3 210.9,1.3 210.9,3.3 222.9,4.3 214.9,6.3 210.9,9.3 207.9,9.3 204.9,12.3 201.9,12.3 191.9,17.3 172.9,37.3 174.9,45.3 177.9,45.3 180.9,42.3 185.9,41.3 188.9,37.3 194.9,34.3 201.9,32.3 209.9,32.3 213.9,31.3 214.9,29.3 226.9,28.3 239.9,23.3 247.9,22.3 248.9,20.3 253.9,18.3 255.9,19.3 258.9,15.3 260.9,15.3 266.9,9.3 269.9,3.3 264.9,2.3 263.9,0.3 261.9,0.3 261.9,-1.7 257.9,-2.7 254.9,-6.7 250.9,-7.7 245.9,-12.7 243.9,-17.7 256.9,-20.7 268.9,-26.7 276.9,-33.7 278.9,-33.7 292.9,-47.7 292.9,-49.7 296.9,-53.7 302.9,-70.7 301.9,-77.7 297.9,-80.7 293.9,-87.7 286.9,-93.7 286.9,-95.7 206.9,-174.7 206.9,-176.7 129.9,-253.7 127.9,-253.7 117.9,-264.7 115.9,-264.7 108.9,-272.7 106.9,-272.7 91.9,-286.7 89.9,-286.7 75.9,-298.7 73.9,-298.7 66.9,-304.7 62.9,-305.7 58.9,-309.7 52.9,-311.7 51.9,-313.7 15.9,-328.7 -40.1,-341.7 -46.1,-344.7 -50.1,-344.7 -65.1,-349.7 -67.1,-351.7 -73.1,-352.7 -92.1,-361.7 -95.1,-361.7 -155.1,-390.7 -156.1,-392.7 -174.1,-400.7 -175.1,-402.7 -191.1,-409.7 -192.1,-411.7 -206.1,-417.7 -207.1,-419.7 -221.1,-425.7 -222.1,-427.7 -238.1,-434.7 -239.1,-436.7 -263.1,-447.7 -264.1,-449.7 -296.1,-465.7 -299.1,-465.7 -317.1,-475.7 -320.1,-475.7 -328.1,-480.7 -331.1,-480.7 -351.1,-490.7 -354.1,-490.7 -376.1,-500.7 -382.1,-501.7 -384.1,-503.7 -396.1,-506.7 -398.1,-508.7 -411.1,-511.7 -420.1,-515.7 -424.1,-515.7 -427.1,-517.7 -435.1,-518.7 -438.1,-520.7 -474.1,-528.7 -530.1,-536.7 -602.1,-543.7ZM1297.9,-354.7 1298.9,-355.7 1293.9,-355.7 1289.9,-353.7 1256.9,-347.7 1200.9,-333.7 1173.9,-324.7 1169.9,-324.7 1118.9,-307.7 1116.9,-305.7 1110.9,-304.7 1100.9,-299.7 1094.9,-298.7 1092.9,-296.7 1089.9,-296.7 1087.9,-294.7 1064.9,-286.7 1060.9,-283.7 1057.9,-283.7 1053.9,-280.7 1050.9,-280.7 1026.9,-268.7 1021.9,-267.7 1017.9,-263.7 1017.9,-261.7 999.9,-244.7 999.9,-242.7 984.9,-228.7 984.9,-226.7 953.9,-194.7 953.9,-192.7 945.9,-185.7 945.9,-183.7 937.9,-176.7 937.9,-174.7 930.9,-168.7 930.9,-166.7 924.9,-161.7 924.9,-159.7 918.9,-154.7 918.9,-152.7 912.9,-147.7 912.9,-145.7 897.9,-129.7 897.9,-127.7 893.9,-124.7 893.9,-122.7 889.9,-119.7 889.9,-117.7 885.9,-114.7 885.9,-112.7 881.9,-109.7 878.9,-103.7 874.9,-100.7 874.9,-98.7 871.9,-96.7 871.9,-94.7 868.9,-92.7 868.9,-90.7 864.9,-87.7 862.9,-82.7 853.9,-72.7 853.9,-70.7 848.9,-65.7 846.9,-60.7 843.9,-58.7 843.9,-56.7 841.9,-55.7 841.9,-53.7 839.9,-52.7 839.9,-50.7 837.9,-49.7 837.9,-47.7 835.9,-46.7 835.9,-44.7 833.9,-43.7 833.9,-41.7 831.9,-40.7 831.9,-38.7 819.9,-22.7 813.9,-10.7 811.9,-9.7 815.9,67.3 822.9,109.3 829.9,129.3 838.9,147.3 840.9,148.3 841.9,152.3 843.9,153.3 844.9,157.3 849.9,162.3 849.9,164.3 860.9,175.3 869.9,180.3 884.9,183.3 885.9,181.3 891.9,179.3 892.9,177.3 900.9,173.3 902.9,170.3 904.9,170.3 906.9,167.3 912.9,164.3 916.9,159.3 918.9,159.3 923.9,153.3 925.9,153.3 1006.9,72.3 1008.9,72.3 1033.9,46.3 1035.9,46.3 1105.9,-22.7 1105.9,-24.7 1121.9,-39.7 1121.9,-41.7 1130.9,-49.7 1130.9,-51.7 1137.9,-57.7 1137.9,-59.7 1153.9,-76.7 1153.9,-78.7 1156.9,-80.7 1156.9,-82.7 1160.9,-85.7 1160.9,-87.7 1172.9,-101.7 1172.9,-103.7 1174.9,-104.7 1174.9,-106.7 1176.9,-107.7 1176.9,-109.7 1188.9,-125.7 1189.9,-129.7 1191.9,-130.7 1192.9,-134.7 1197.9,-140.7 1200.9,-148.7 1202.9,-149.7 1208.9,-163.7 1210.9,-164.7 1215.9,-174.7 1215.9,-177.7 1224.9,-193.7 1224.9,-196.7 1229.9,-204.7 1229.9,-207.7 1234.9,-215.7 1238.9,-227.7 1243.9,-235.7 1243.9,-238.7 1248.9,-246.7 1248.9,-249.7 1253.9,-257.7 1253.9,-260.7 1259.9,-270.7 1259.9,-273.7 1266.9,-285.7 1266.9,-288.7 1273.9,-300.7 1273.9,-303.7 1297.9,-351.7ZM102.9,15.3 103.9,11.3 95.9,11.3 91.9,13.3 89.9,17.3 81.9,23.3 78.9,29.3 78.9,33.3 85.9,32.3ZM-417.1,21.3 -407.1,29.3 -409.1,30.3 -413.1,26.3 -414.1,27.3 -403.1,36.3 -405.1,37.3 -409.1,33.3 -412.1,33.3 -409.1,34.3 -384.1,61.3 -376.1,75.3 -373.1,87.3 -371.1,88.3 -369.1,93.3 -367.1,93.3 -363.1,82.3 -363.1,62.3 -370.1,33.3 -378.1,27.3 -379.1,28.3 -376.1,30.3 -378.1,31.3 -382.1,27.3 -383.1,28.3 -381.1,30.3 -383.1,30.3 -390.1,25.3 -381.1,34.3 -383.1,35.3 -387.1,31.3 -388.1,32.3 -386.1,34.3 -388.1,34.3 -389.1,32.3 -393.1,31.3 -405.1,22.3 -406.1,23.3 -404.1,25.3 -406.1,25.3 -412.1,20.3 -413.1,21.3 -411.1,23.3 -413.1,23.3 -416.1,20.3ZM-306.1,67.3 -305.1,66.3 -308.1,63.3 -310.1,63.3 -313.1,59.3 -315.1,60.3 -316.1,57.3 -317.1,65.3 -321.1,61.3 -321.1,80.3 -326.1,99.3 -324.1,99.3 -324.1,97.3 -321.1,95.3 -321.1,93.3 -315.1,86.3ZM735.9,69.3 735.9,72.3 738.9,72.3 742.9,76.3 746.9,75.3 749.9,72.3 749.9,69.3 741.9,62.3 735.9,63.3ZM404.9,124.3 419.9,124.3 423.9,126.3 428.9,126.3 431.9,129.3 435.9,130.3 437.9,133.3 445.9,137.3 447.9,141.3 450.9,143.3 452.9,147.3 452.9,155.3 447.9,156.3 422.9,153.3 420.9,151.3 416.9,151.3 405.9,147.3 400.9,142.3 395.9,140.3 392.9,137.3 392.9,135.3 389.9,134.3 389.9,132.3 387.9,131.3 387.9,128.3 391.9,125.3ZM348.9,132.3 359.9,133.3 367.9,137.3 380.9,138.3 382.9,141.3 381.9,148.3 368.9,150.3 367.9,152.3 355.9,155.3 347.9,160.3 344.9,160.3 343.9,162.3 339.9,163.3 337.9,166.3 329.9,170.3 317.9,181.3 315.9,181.3 313.9,184.3 311.9,184.3 309.9,187.3 307.9,187.3 298.9,194.3 281.9,199.3 279.9,199.3 276.9,196.3 278.9,184.3 281.9,182.3 281.9,180.3 287.9,174.3 287.9,172.3 292.9,167.3 294.9,167.3 305.9,155.3 307.9,155.3 314.9,148.3 320.9,145.3 324.9,145.3 329.9,141.3 335.9,139.3 336.9,137.3ZM460.9,142.3 465.9,142.3 477.9,146.3 479.9,149.3 484.9,150.3 485.9,152.3 491.9,154.3 492.9,156.3 506.9,164.3 506.9,166.3 512.9,171.3 516.9,179.3 523.9,187.3 525.9,193.3 527.9,194.3 534.9,214.3 540.9,222.3 542.9,228.3 542.9,240.3 540.9,243.3 535.9,242.3 531.9,237.3 530.9,233.3 527.9,231.3 527.9,229.3 502.9,206.3 499.9,200.3 486.9,187.3 484.9,187.3 479.9,182.3 478.9,178.3 475.9,176.3 469.9,164.3 465.9,161.3 463.9,155.3 459.9,150.3ZM571.9,146.3 572.9,147.3 570.9,148.3 570.9,152.3 573.9,153.3 573.9,156.3 575.9,158.3 578.9,158.3 578.9,161.3 579.9,157.3 575.9,157.3 576.9,154.3 573.9,153.3 574.9,151.3 571.9,151.3 572.9,147.3 574.9,147.3 572.9,146.3 572.9,143.3ZM632.9,154.3 633.9,161.3 630.9,165.3 630.9,174.3 635.9,179.3 639.9,179.3 641.9,186.3 645.9,192.3 653.9,218.3 656.9,221.3 657.9,226.3 661.9,230.3 662.9,234.3 671.9,241.3 675.9,241.3 679.9,237.3 681.9,229.3 683.9,227.3 683.9,206.3 679.9,191.3 671.9,175.3 659.9,159.3 658.9,155.3 655.9,152.3 653.9,152.3 650.9,148.3 640.9,144.3 633.9,148.3ZM307.9,179.3 308.9,178.3 306.9,177.3 303.9,178.3 302.9,184.3 296.9,183.3 296.9,185.3 294.9,185.3 293.9,187.3 299.9,184.3 298.9,188.3 300.9,188.3 300.9,186.3 303.9,186.3 304.9,181.3 308.9,182.3ZM297.9,180.3 301.9,182.3 300.9,178.3 299.9,180.3ZM670.9,247.3 671.9,246.3 669.9,245.3 668.9,249.3 672.9,249.3ZM395.9,268.3 409.9,268.3 414.9,271.3 417.9,271.3 424.9,279.3 427.9,289.3 427.9,302.3 424.9,310.3 420.9,314.3 415.9,316.3 399.9,314.3 398.9,322.3 391.9,321.3 385.9,315.3 380.9,302.3 381.9,290.3 385.9,278.3 387.9,277.3 388.9,273.3 394.9,270.3ZM142.9,283.3 143.9,275.3 139.9,270.3 137.9,262.3 130.9,253.3 120.9,253.3 114.9,261.3 114.9,263.3 112.9,264.3 111.9,270.3 109.9,272.3 102.9,302.3 101.9,339.3 104.9,348.3 106.9,364.3 111.9,371.3 118.9,372.3 120.9,369.3 129.9,305.3 132.9,300.3 132.9,297.3 140.9,288.3ZM401.9,308.3 399.9,307.3 399.9,309.3 403.9,310.3ZM409.9,309.3 412.9,311.3 412.9,309.3 414.9,308.3 412.9,307.3 412.9,309.3ZM125.9,402.3 126.9,396.3 123.9,393.3 122.9,389.3 115.9,381.3 110.9,381.3 109.9,392.3 107.9,394.3 106.9,400.3 106.9,411.3 107.9,413.3 109.9,413.3 111.9,421.3 113.9,423.3 118.9,422.3 123.9,412.3ZM260.9,505.3 260.9,507.3 263.9,509.3 263.9,512.3 265.9,512.3 264.9,515.3 266.9,514.3 267.9,516.3 267.9,512.3 265.9,512.3 265.9,510.3 267.9,509.3 264.9,510.3 262.9,508.3 263.9,506.3 261.9,505.3 261.9,503.3ZM258.9,507.3 259.9,506.3 255.9,505.3 255.9,508.3 258.9,508.3 260.9,510.3 260.9,513.3 262.9,514.3 262.9,510.3 260.9,510.3 260.9,508.3ZM352.9,528.3 353.9,530.3 355.9,530.3 354.9,527.3ZM273.9,529.3 275.9,529.3 275.9,534.3 278.9,534.3 277.9,530.3 275.9,528.3ZM997.9,566.3 999.9,566.3 999.9,563.3 996.9,565.3 996.9,567.3ZM313.9,570.3 316.9,572.3 316.9,574.3 318.9,573.3 317.9,570.3 314.9,569.3 312.9,569.3 312.9,572.3ZM447.9,589.3 449.9,588.3 447.9,587.3 446.9,590.3 450.9,592.3ZM504.9,608.3 508.9,610.3 509.9,615.3 505.9,613.3Z",
    "M498.9,-87.7 506.9,-86.7 503.9,-84.7 509.9,-85.7 513.9,-83.7 518.9,-83.7 519.9,-81.7 522.9,-81.7 523.9,-78.7 525.9,-79.7 527.9,-77.7 530.9,-77.7 530.9,-74.7 527.9,-76.7 526.9,-75.7 529.9,-74.7 532.9,-70.7 534.9,-72.7 540.9,-70.7 540.9,-68.7 537.9,-70.7 536.9,-68.7 540.9,-67.7 539.9,-63.7 541.9,-63.7 540.9,-65.7 543.9,-64.7 543.9,-62.7 541.9,-62.7 541.9,-59.7 544.9,-57.7 544.9,-55.7 546.9,-55.7 544.9,-58.7 547.9,-57.7 547.9,-59.7 543.9,-60.7 543.9,-62.7 545.9,-63.7 541.9,-67.7 544.9,-67.7 547.9,-62.7 548.9,-64.7 552.9,-62.7 550.9,-56.7 551.9,-54.7 549.9,-54.7 549.9,-51.7 547.9,-52.7 548.9,-49.7 545.9,-45.7 545.9,-42.7 542.9,-36.7 540.9,-37.7 540.9,-35.7 542.9,-35.7 541.9,-32.7 543.9,-31.7 543.9,-29.7 545.9,-29.7 548.9,-22.7 550.9,-22.7 550.9,-10.7 555.9,0.3 554.9,3.3 548.9,4.3 567.9,24.3 569.9,24.3 577.9,32.3 582.9,43.3 586.9,47.3 598.9,53.3 617.9,52.3 620.9,49.3 627.9,46.3 629.9,43.3 631.9,43.3 637.9,35.3 638.9,17.3 644.9,9.3 642.9,3.3 651.9,3.3 649.9,-0.7 651.9,-0.7 653.9,-3.7 655.9,-3.7 656.9,-6.7 664.9,-10.7 664.9,-12.7 683.9,-12.7 700.9,-14.7 713.9,-18.7 718.9,-18.7 726.9,-22.7 731.9,-22.7 731.9,-24.7 734.9,-25.7 736.9,-24.7 729.9,-20.7 729.9,-18.7 726.9,-15.7 724.9,-15.7 723.9,-12.7 721.9,-12.7 713.9,-4.7 715.9,1.3 695.9,3.3 709.9,3.3 712.9,16.3 717.9,22.3 717.9,24.3 732.9,38.3 741.9,42.3 748.9,42.3 751.9,38.3 752.9,19.3 749.9,9.3 745.9,3.3 796.9,3.3 752.9,2.3 752.9,0.3 759.9,-3.7 766.9,-11.7 769.9,-11.7 788.9,-29.7 792.9,-30.7 795.9,-20.7 804.9,-3.7 804.9,21.3 809.9,88.3 811.9,149.3 815.9,172.3 821.9,184.3 820.9,190.3 818.9,189.3 817.9,194.3 815.9,193.3 812.9,199.3 810.9,199.3 810.9,201.3 807.9,202.3 807.9,205.3 801.9,211.3 801.9,214.3 797.9,216.3 797.9,232.3 785.9,205.3 782.9,203.3 782.9,201.3 777.9,196.3 775.9,191.3 771.9,188.3 771.9,186.3 752.9,167.3 744.9,152.3 742.9,151.3 737.9,139.3 735.9,138.3 734.9,134.3 732.9,133.3 728.9,125.3 725.9,123.3 723.9,118.3 704.9,97.3 697.9,93.3 693.9,93.3 691.9,95.3 682.9,95.3 665.9,87.3 660.9,83.3 644.9,79.3 625.9,79.3 612.9,84.3 611.9,86.3 609.9,86.3 609.9,88.3 604.9,92.3 602.9,96.3 600.9,104.3 601.9,113.3 606.9,119.3 617.9,125.3 626.9,134.3 631.9,148.3 633.9,166.3 631.9,168.3 621.9,166.3 618.9,163.3 614.9,162.3 609.9,156.3 606.9,155.3 606.9,153.3 603.9,150.3 601.9,150.3 601.9,148.3 580.9,127.3 580.9,125.3 575.9,121.3 570.9,112.3 567.9,110.3 562.9,99.3 555.9,91.3 555.9,89.3 545.9,76.3 544.9,72.3 542.9,71.3 541.9,67.3 539.9,66.3 532.9,52.3 532.9,49.3 530.9,48.3 525.9,38.3 516.9,29.3 514.9,29.3 511.9,25.3 501.9,20.3 500.9,18.3 466.9,4.3 479.9,3.3 478.9,0.3 481.9,-8.7 480.9,-16.7 483.9,-14.7 485.9,-38.7 487.9,-34.7 489.9,-51.7 494.9,-73.7 495.9,-76.7 497.9,-76.7 496.9,-79.7 502.9,-79.7 496.9,-80.7 497.9,-85.7 501.9,-84.7 498.9,-85.7ZM517.9,-79.7 521.9,-77.7 519.9,-76.7 521.9,-75.7 521.9,-70.7 524.9,-70.7 525.9,-67.7 527.9,-68.7 529.9,-66.7 529.9,-63.7 529.9,-65.7 533.9,-65.7 532.9,-63.7 535.9,-60.7 537.9,-60.7 535.9,-55.7 532.9,-55.7 534.9,-55.7 537.9,-52.7 536.9,-57.7 539.9,-58.7 539.9,-53.7 544.9,-49.7 542.9,-52.7 545.9,-53.7 541.9,-54.7 541.9,-58.7 538.9,-59.7 539.9,-62.7 534.9,-62.7 533.9,-64.7 535.9,-66.7 528.9,-71.7 527.9,-70.7 531.9,-67.7 525.9,-69.7 526.9,-72.7 524.9,-71.7 523.9,-73.7 521.9,-73.7 522.9,-77.7 519.9,-80.7ZM525.9,-63.7 529.9,-61.7 529.9,-58.7 529.9,-60.7 532.9,-59.7 527.9,-64.7ZM142.9,-3.7 173.9,-3.7 178.9,3.3 186.9,4.3 180.9,7.3 178.9,10.3 176.9,10.3 169.9,17.3 169.9,19.3 156.9,31.3 156.9,33.3 150.9,38.3 150.9,40.3 143.9,46.3 143.9,48.3 140.9,51.3 111.9,63.3 102.9,72.3 100.9,72.3 91.9,81.3 91.9,83.3 85.9,90.3 84.9,94.3 82.9,95.3 80.9,101.3 76.9,106.3 70.9,128.3 71.9,140.3 73.9,142.3 79.9,142.3 83.9,138.3 87.9,138.3 88.9,141.3 77.9,154.3 77.9,156.3 71.9,161.3 62.9,183.3 60.9,197.3 60.9,255.3 57.9,268.3 49.9,288.3 49.9,297.3 46.9,305.3 40.9,349.3 38.9,352.3 34.9,352.3 29.9,346.3 26.9,334.3 26.9,319.3 24.9,315.3 20.9,312.3 17.9,302.3 18.9,277.3 21.9,260.3 20.9,258.3 26.9,232.3 26.9,219.3 24.9,214.3 20.9,210.3 12.9,210.3 5.9,214.3 4.9,217.3 2.9,208.3 0.9,212.3 -4.1,213.3 -8.1,212.3 -32.1,218.3 -44.1,218.3 -73.1,223.3 -93.1,225.3 -107.1,224.3 -123.1,226.3 -176.1,227.3 -155.1,184.3 -147.1,175.3 -147.1,173.3 -135.1,162.3 -133.1,162.3 -131.1,159.3 -129.1,159.3 -122.1,153.3 -118.1,152.3 -117.1,150.3 -113.1,149.3 -112.1,147.3 -94.1,138.3 -93.1,136.3 -79.1,128.3 -69.1,118.3 -63.1,118.3 -51.1,114.3 -45.1,118.3 -40.1,117.3 -39.1,119.3 -37.1,119.3 -36.1,117.3 -34.1,118.3 -32.1,115.3 -26.1,112.3 -20.1,95.3 -18.1,94.3 -19.1,90.3 -17.1,83.3 -19.1,84.3 -20.1,79.3 -24.1,79.3 -24.1,77.3 -27.1,74.3 -37.1,70.3 -38.1,68.3 -40.1,69.3 -41.1,67.3 -27.1,35.3 -25.1,34.3 -24.1,30.3 -22.1,29.3 -22.1,27.3 -20.1,26.3 -20.1,24.3 -18.1,23.3 -18.1,21.3 -16.1,20.3 -16.1,18.3 -11.1,13.3 -11.1,11.3 -2.1,-0.7 60.9,-1.7 62.9,3.3 71.9,3.3 64.9,9.3 62.9,9.3 52.9,19.3 52.9,21.3 49.9,23.3 49.9,25.3 46.9,27.3 46.9,29.3 36.9,42.3 34.9,49.3 32.9,51.3 32.9,56.3 34.9,59.3 41.9,59.3 44.9,56.3 46.9,56.3 56.9,46.3 58.9,41.3 68.9,30.3 68.9,28.3 70.9,27.3 70.9,25.3 72.9,24.3 72.9,22.3 78.9,14.3 78.9,3.3 80.9,2.3 74.9,1.3 71.9,-1.7ZM638.9,45.3 640.9,45.3 640.9,47.3 635.9,47.3 637.9,49.3 636.9,51.3 634.9,49.3 635.9,52.3 637.9,52.3 638.9,48.3 640.9,49.3 641.9,47.3 641.9,42.3ZM632.9,55.3 628.9,57.3 628.9,60.3 629.9,57.3 631.9,59.3 631.9,56.3 633.9,58.3ZM610.9,61.3 611.9,62.3 605.9,63.3 607.9,63.3 608.9,65.3 613.9,64.3 612.9,59.3ZM604.9,67.3 604.9,69.3 606.9,68.3 608.9,70.3 606.9,68.3 606.9,65.3 604.9,65.3ZM602.9,75.3 602.9,77.3 605.9,77.3 605.9,75.3ZM389.9,257.3 406.9,258.3 418.9,263.3 426.9,270.3 427.9,274.3 429.9,275.3 432.9,281.3 433.9,301.3 431.9,303.3 429.9,312.3 427.9,313.3 424.9,320.3 418.9,326.3 414.9,327.3 409.9,331.3 401.9,333.3 387.9,332.3 372.9,325.3 365.9,318.3 358.9,302.3 359.9,284.3 367.9,269.3 376.9,262.3ZM137.9,284.3 142.9,286.3 144.9,290.3 144.9,305.3 142.9,313.3 138.9,320.3 137.9,330.3 139.9,378.3 135.9,380.3 129.9,380.3 121.9,374.3 121.9,372.3 116.9,366.3 116.9,325.3 119.9,320.3 122.9,305.3 128.9,291.3ZM361.9,297.3 362.9,300.3 366.9,302.3 365.9,297.3 362.9,297.3 362.9,294.3ZM365.9,304.3 366.9,303.3 364.9,303.3 363.9,305.3 364.9,310.3 367.9,310.3 366.9,313.3 368.9,315.3 371.9,314.3 369.9,318.3 373.9,319.3 375.9,323.3 377.9,321.3 377.9,323.3 379.9,323.3 379.9,325.3 382.9,327.3 388.9,327.3 387.9,329.3 390.9,329.3 392.9,327.3 409.9,327.3 409.9,323.3 411.9,324.3 411.9,322.3 413.9,323.3 413.9,321.3 415.9,321.3 414.9,317.3 414.9,320.3 411.9,319.3 410.9,322.3 408.9,322.3 408.9,320.3 407.9,322.3 404.9,322.3 405.9,320.3 401.9,321.3 401.9,325.3 399.9,325.3 399.9,322.3 399.9,324.3 397.9,324.3 396.9,322.3 395.9,324.3 392.9,324.3 392.9,321.3 391.9,324.3 389.9,324.3 389.9,320.3 386.9,323.3 380.9,322.3 383.9,318.3 380.9,317.3 380.9,319.3 377.9,320.3 377.9,318.3 375.9,318.3 375.9,316.3 371.9,313.3 372.9,310.3 369.9,310.3 370.9,307.3 368.9,307.3 368.9,305.3ZM419.9,314.3 419.9,317.3 417.9,317.3 418.9,319.3 421.9,316.3 421.9,314.3ZM403.9,322.3 406.9,324.3 402.9,325.3ZM132.9,327.3 130.9,329.3 128.9,328.3 128.9,332.3 131.9,330.3ZM33.9,339.3 34.9,342.3 37.9,344.3 37.9,340.3 35.9,338.3ZM129.9,344.3 132.9,345.3 128.9,343.3 127.9,347.3 131.9,348.3ZM128.9,353.3 128.9,355.3 132.9,357.3 130.9,353.3ZM122.9,360.3 125.9,361.3 124.9,358.3 122.9,358.3ZM130.9,363.3 132.9,363.3 132.9,361.3 129.9,362.3 129.9,366.3 131.9,367.3ZM132.9,368.3 126.9,368.3 125.9,371.3 129.9,371.3 128.9,369.3 131.9,369.3 130.9,371.3 133.9,371.3ZM131.9,390.3 136.9,390.3 139.9,393.3 146.9,414.3 151.9,422.3 154.9,431.3 156.9,432.3 158.9,437.3 164.9,441.3 164.9,443.3 170.9,450.3 189.9,510.3 191.9,511.3 193.9,517.3 198.9,523.3 201.9,532.3 203.9,533.3 207.9,541.3 211.9,544.3 211.9,546.3 214.9,548.3 214.9,550.3 225.9,561.3 231.9,564.3 240.9,565.3 244.9,563.3 250.9,555.3 254.9,535.3 259.9,535.3 263.9,537.3 268.9,549.3 275.9,555.3 275.9,557.3 281.9,562.3 281.9,564.3 306.9,589.3 308.9,589.3 312.9,594.3 316.9,596.3 305.9,597.3 308.9,600.3 302.9,612.3 302.9,617.3 299.9,623.3 297.9,624.3 295.9,630.3 289.9,627.3 283.9,627.3 279.9,625.3 276.9,627.3 277.9,629.3 274.9,628.3 275.9,630.3 277.9,630.3 277.9,632.3 273.9,632.3 275.9,635.3 271.9,633.3 273.9,635.3 272.9,638.3 274.9,638.3 273.9,643.3 270.9,640.3 272.9,643.3 272.9,649.3 269.9,650.3 270.9,652.3 267.9,651.3 269.9,663.3 265.9,662.3 263.9,657.3 262.9,659.3 260.9,659.3 260.9,657.3 255.9,656.3 255.9,654.3 253.9,655.3 252.9,653.3 247.9,652.3 244.9,649.3 236.9,646.3 236.9,644.3 230.9,642.3 230.9,640.3 224.9,637.3 224.9,635.3 221.9,632.3 219.9,632.3 218.9,629.3 216.9,629.3 216.9,627.3 214.9,627.3 213.9,624.3 211.9,624.3 211.9,622.3 209.9,622.3 205.9,617.3 203.9,617.3 193.9,607.3 191.9,607.3 191.9,605.3 189.9,605.3 186.9,601.3 183.9,600.3 184.9,597.3 188.9,597.3 187.9,587.3 183.9,576.3 181.9,561.3 173.9,539.3 171.9,523.3 167.9,509.3 164.9,506.3 163.9,502.3 159.9,499.3 159.9,497.3 149.9,488.3 146.9,481.3 142.9,477.3 137.9,465.3 133.9,448.3 131.9,447.3 131.9,444.3 129.9,442.3 126.9,422.3 126.9,406.3 128.9,401.3 128.9,394.3ZM796.9,519.3 797.9,531.3 803.9,533.3 808.9,537.3 811.9,537.3 812.9,539.3 815.9,539.3 817.9,543.3 826.9,546.3 828.9,549.3 841.9,554.3 802.9,601.3 748.9,602.3 733.9,599.3 726.9,591.3 722.9,589.3 706.9,591.3 706.9,589.3 712.9,586.3 714.9,583.3 750.9,566.3 751.9,564.3 755.9,563.3 760.9,558.3 762.9,558.3 764.9,555.3 766.9,555.3 783.9,539.3 783.9,537.3 790.9,530.3ZM3.9,538.3 11.9,546.3 19.9,550.3 22.9,550.3 26.9,553.3 34.9,555.3 49.9,555.3 57.9,561.3 60.9,571.3 73.9,597.3 66.9,597.3 64.9,602.3 61.9,603.3 59.9,608.3 56.9,609.3 56.9,611.3 51.9,615.3 50.9,618.3 48.9,618.3 48.9,620.3 40.9,619.3 41.9,616.3 45.9,618.3 43.9,615.3 46.9,615.3 46.9,612.3 50.9,614.3 47.9,612.3 49.9,610.3 49.9,606.3 48.9,608.3 47.9,606.3 45.9,606.3 45.9,608.3 47.9,609.3 41.9,610.3 42.9,615.3 37.9,614.3 41.9,615.3 40.9,617.3 36.9,616.3 35.9,618.3 32.9,616.3 33.9,619.3 28.9,619.3 26.9,617.3 24.9,620.3 21.9,619.3 16.9,622.3 13.9,622.3 12.9,624.3 10.9,621.3 10.9,625.3 8.9,625.3 4.9,614.3 2.9,613.3 -0.1,606.3 -4.1,603.3 -4.1,550.3 1.9,544.3 3.9,544.3ZM268.9,561.3 266.9,561.3 266.9,563.3 268.9,563.3 266.9,565.3 270.9,564.3 269.9,566.3 274.9,566.3 273.9,564.3 270.9,564.3 270.9,562.3ZM255.9,565.3 258.9,566.3 257.9,563.3 255.9,563.3ZM42.9,569.3 42.9,571.3 44.9,571.3 43.9,566.3ZM450.9,573.3 491.9,574.3 504.9,578.3 509.9,578.3 535.9,588.3 555.9,592.3 584.9,592.3 588.9,594.3 611.9,597.3 549.9,597.3 573.9,600.3 559.9,600.3 560.9,606.3 555.9,606.3 555.9,602.3 553.9,602.3 554.9,605.3 551.9,602.3 549.9,602.3 550.9,605.3 545.9,605.3 546.9,608.3 542.9,608.3 542.9,605.3 534.9,605.3 536.9,609.3 533.9,610.3 528.9,610.3 529.9,608.3 527.9,607.3 526.9,601.3 522.9,599.3 523.9,603.3 521.9,602.3 521.9,609.3 523.9,608.3 523.9,612.3 521.9,612.3 521.9,610.3 519.9,609.3 520.9,613.3 516.9,612.3 517.9,609.3 514.9,605.3 514.9,602.3 510.9,600.3 505.9,601.3 502.9,597.3 500.9,597.3 501.9,599.3 503.9,599.3 504.9,604.3 506.9,605.3 508.9,610.3 511.9,612.3 509.9,610.3 510.9,605.3 515.9,614.3 499.9,618.3 497.9,616.3 495.9,617.3 487.9,613.3 477.9,611.3 475.9,609.3 472.9,609.3 470.9,607.3 467.9,607.3 463.9,604.3 451.9,600.3 449.9,597.3 455.9,596.3 453.9,596.3 447.9,590.3 447.9,588.3 444.9,586.3 442.9,582.3 442.9,576.3ZM464.9,581.3 466.9,582.3 464.9,583.3 465.9,585.3 467.9,583.3 467.9,580.3 465.9,579.3ZM471.9,582.3 474.9,584.3 479.9,584.3 479.9,580.3 476.9,583.3 475.9,580.3 474.9,582.3 473.9,580.3 470.9,580.3 470.9,584.3ZM497.9,584.3 498.9,585.3 496.9,587.3 499.9,587.3 499.9,584.3ZM513.9,598.3 516.9,599.3 514.9,601.3 517.9,607.3 520.9,608.3 518.9,607.3 518.9,599.3 516.9,599.3 516.9,597.3ZM35.9,608.3 31.9,615.3 36.9,612.3ZM51.9,608.3 52.9,609.3 50.9,609.3 49.9,612.3 51.9,612.3 54.9,609.3 52.9,607.3ZM267.9,609.3 268.9,608.3 266.9,608.3 266.9,611.3 262.9,613.3 267.9,614.3ZM27.9,615.3 28.9,617.3 30.9,616.3 28.9,615.3 28.9,613.3 26.9,613.3 26.9,616.3ZM261.9,625.3 263.9,624.3 261.9,623.3 260.9,627.3 266.9,630.3ZM259.9,638.3 260.9,640.3 262.9,640.3 260.9,636.3ZM255.9,640.3 257.9,641.3 256.9,635.3Z"
  ] };
  // B: the 38 drop/pool frames traced; the vortex redrawn as nine of our own frames with the swirl-e opening as the hole.
  const FBF_DROP_B = { w: 800, h: 600, ms: 40, swirl: [0.5, 0.46, 0.42], extendUntil: 38 /* from here the vortex frames are our own drawings on a 2000px canvas: the swirl-e opens as the hole in the vortex */, frames: [
    "M387,0 420,0 423,11 423,26 418,34 418,29 416,28 417,31 415,31 414,33 414,38 408,40 395,40 386,33 382,24 382,10ZM386,28 390,32 390,35 392,35 391,33 393,33 397,36 395,38 406,39 406,34 408,34 409,38 413,37 413,31 411,31 412,33 410,36 410,33 408,33 407,31 406,34 404,33 405,37 403,37 402,34 399,37 400,34 396,35 395,33 397,32 395,32 395,29 393,29 394,32 390,32 390,29 387,28 387,24Z",
    "M393,0 418,0 419,2 423,19 423,38 420,47 413,53 399,54 392,52 389,49 390,47 388,48 384,42 384,27 387,21 388,14 391,10ZM388,36 388,45 391,45 394,50 396,49 396,51 402,51 406,53 407,51 410,52 410,48 411,50 413,50 413,48 415,48 413,46 417,46 416,43 408,43 405,44 405,47 402,43 401,48 401,45 398,44 398,41 395,40 398,44 397,46 395,45 393,40 393,42 391,42 391,38 389,38 389,35ZM414,41 418,43 417,40Z",
    "M393,0 418,0 419,2 423,19 423,38 420,47 413,53 399,54 392,52 389,49 390,47 388,48 384,42 384,27 387,21 388,14 391,10ZM388,36 388,45 391,45 394,50 396,49 396,51 402,51 406,53 407,51 410,52 410,48 411,50 413,50 413,48 415,48 413,46 417,46 416,43 408,43 405,44 405,47 402,43 401,48 401,45 398,44 398,41 395,40 398,44 397,46 395,45 393,40 393,42 391,42 391,38 389,38 389,35ZM414,41 418,43 417,40Z",
    "M398,0 410,1 411,14 416,34 418,65 416,69 408,75 394,75 385,68 384,64 385,48 393,26ZM386,64 390,65 388,66 388,68 391,69 392,72 394,71 397,73 397,71 399,71 399,73 400,71 401,73 405,73 405,71 408,72 407,68 412,70 415,66 414,63 412,63 410,66 406,66 407,68 403,68 401,66 397,67 392,63 387,63 387,61ZM47,559 800,559 800,600 0,600 0,560Z",
    "M400,0 406,0 407,3 409,32 416,76 416,98 412,106 403,111 390,108 385,99 385,85 395,43 398,8ZM409,95 411,98 409,98 408,96 408,99 402,99 402,102 399,102 400,99 397,102 398,99 393,100 390,96 388,96 388,101 390,102 391,106 393,106 394,108 396,107 396,109 400,109 400,106 401,108 404,108 404,106 411,104 411,99 413,98 413,96 411,96 411,94ZM567,511 800,511 800,600 0,600 0,512Z",
    "M400,0 406,0 407,3 409,32 416,76 416,98 412,106 403,111 390,108 385,99 385,85 395,43 398,8ZM409,95 411,98 409,98 408,96 408,99 402,99 402,102 399,102 400,99 397,102 398,99 393,100 390,96 388,96 388,101 390,102 391,106 393,106 394,108 396,107 396,109 400,109 400,106 401,108 404,108 404,106 411,104 411,99 413,98 413,96 411,96 411,94ZM567,511 800,511 800,600 0,600 0,512Z",
    "M399,0 404,0 405,5 405,25 410,87 413,106 414,139 412,151 409,155 407,155 407,152 409,150 409,147 411,148 410,145 412,144 406,143 407,147 404,145 403,147 398,148 398,146 396,146 397,142 391,142 391,139 393,139 391,138 391,135 390,137 388,137 391,139 388,140 390,142 389,145 391,145 390,147 392,151 395,150 396,153 399,153 401,155 402,153 403,155 406,154 407,156 404,157 393,154 388,149 386,144 388,107 392,90 392,77 397,49ZM770,454 800,454 800,600 0,600 0,455Z",
    "M399,0 404,0 405,5 405,25 410,87 413,106 414,139 412,151 409,155 407,155 407,152 409,150 409,147 411,148 410,145 412,144 406,143 407,147 404,145 403,147 398,148 398,146 396,146 397,142 391,142 391,139 393,139 391,138 391,135 390,137 388,137 391,139 388,140 390,142 389,145 391,145 390,147 392,151 395,150 396,153 399,153 401,155 402,153 403,155 406,154 407,156 404,157 393,154 388,149 386,144 388,107 392,90 392,77 397,49ZM770,454 800,454 800,600 0,600 0,455Z",
    "M400,88 402,88 403,91 405,106 404,122 406,156 408,165 408,187 410,195 414,249 417,264 417,294 414,305 409,312 407,310 409,310 409,308 411,307 411,303 413,303 412,296 410,296 411,299 409,298 409,301 406,301 404,299 405,304 403,302 400,303 400,300 398,304 397,301 393,301 396,299 391,298 389,300 390,296 387,297 389,294 387,293 387,290 385,292 386,296 384,297 382,292 385,252 390,230 390,219 395,191 395,176 397,162 398,93ZM384,297 386,297 389,306 392,307 393,310 395,310 396,312 403,312 404,314 397,314 391,309 389,309 384,300ZM0,397 800,397 800,600 0,600Z",
    "M402,182 405,183 406,187 408,247 416,326 415,361 412,370 408,375 403,377 403,380 800,381 800,600 0,600 0,381 396,380 398,379 398,377 394,376 388,368 390,368 390,370 395,375 403,376 405,375 405,373 407,374 407,371 410,370 409,367 412,364 407,363 407,367 405,367 404,369 399,369 395,368 392,364 389,363 387,368 384,360 384,336 387,320 388,303 394,277 395,254 400,215 399,193Z",
    "M402,182 405,183 406,187 408,247 416,326 415,361 412,370 408,375 403,377 403,380 800,381 800,600 0,600 0,381 396,380 398,379 398,377 394,376 385,364 384,336 387,320 388,303 394,277 395,254 400,215 399,193Z",
    "M403,158 406,159 407,166 406,171 402,176 400,174 399,167 400,162ZM403,183 406,183 408,185 409,191 409,224 406,234 406,230 403,231 403,229 405,229 406,227 402,228 402,226 401,230 399,231 400,233 398,234 399,189ZM403,232 405,235 403,237 400,237 399,234 403,234ZM399,245 404,245 407,247 410,256 411,267 407,273 405,269 407,270 408,268 404,268 404,270 399,271 394,266 393,271 396,274 398,274 395,275 392,272 392,263 396,249ZM405,273 407,273 405,276 398,276 402,274 404,275ZM397,285 402,285 408,290 412,299 414,311 414,333 411,338 411,331 413,330 409,331 409,335 407,334 403,336 401,334 401,337 397,337 396,334 394,335 393,333 394,330 389,329 391,331 390,334 392,334 393,339 410,338 409,340 403,343 393,341 390,338 390,335 387,331 388,302 392,290ZM445,353 800,354 800,600 0,600 0,354 357,354 371,361 380,372 382,379 382,407 384,414 393,423 403,424 408,420 412,412 414,404 414,379 419,367 425,360 432,358 436,355ZM619,357 620,359 622,359 621,356ZM67,358 69,358 69,356 66,357 66,359ZM374,371 375,370 373,370 374,374 372,376 376,379 376,382 377,374 375,374ZM315,375 320,376 320,372 316,371ZM353,375 356,378 361,378 363,376 363,370 355,368 353,370ZM475,376 476,374 474,372 471,372 469,375 471,379 474,379ZM437,381 440,385 443,385 445,383 445,375 439,375 437,377ZM344,392 346,392 346,387 344,385 340,386 340,393ZM441,399 442,401 446,401 448,397 446,395 443,395ZM432,410 432,398 430,395 425,395 423,419 425,420 429,418 431,416ZM353,413 358,418 367,418 372,413 372,408 365,401 357,401 353,406ZM381,422 386,425 386,423 384,423 384,419 383,422ZM382,438 384,444 390,449 408,450 415,444 416,434 414,431 411,431 404,435 393,435 388,432 384,432Z",
    "M402,133 406,134 406,145 404,148 400,147 400,145 402,146 401,141 399,145 399,140ZM402,160 406,162 406,177 404,200 403,203 400,203 399,200 402,201 403,199 403,191 401,191 401,188 403,189 403,187 401,187 399,190 401,191 401,193 399,193 400,197 398,198 398,171 399,165ZM400,220 405,220 408,224 408,231 406,233 404,240 399,240 397,237 397,233 398,235 400,235 399,237 402,235 398,233 397,229 397,224ZM402,255 406,256 410,261 411,287 407,299 404,302 398,303 391,299 391,294 394,297 394,300 404,300 405,296 407,296 406,289 408,288 405,288 405,292 401,293 400,296 398,291 396,292 397,295 395,295 394,291 397,289 394,289 395,287 393,287 393,285 391,286 392,293 390,293 390,277 394,262 397,258 399,258ZM22,328 370,329 379,333 385,339 385,341 389,345 393,358 393,377 382,416 382,436 386,444 389,446 389,448 394,451 403,450 404,448 407,448 415,434 415,415 407,391 404,375 404,355 405,347 409,337 414,332 420,329 800,329 800,600 0,600 0,329ZM420,336 421,334 419,334 419,338 421,339ZM417,337 412,341 412,344 410,344 413,347 413,345 415,344 414,340 418,340ZM378,342 376,344 379,345 382,349 381,345 378,344ZM470,348 470,345 466,346 467,350 469,350ZM315,353 319,355 321,353 321,350 319,348 316,348ZM370,359 371,354 368,352 367,360 370,361ZM437,361 439,364 441,364 444,361 444,355 442,353 439,353 437,355ZM337,372 340,375 344,374 343,368 338,368ZM444,383 448,384 449,380 447,378 444,379ZM432,394 432,385 426,385 426,407 430,407 432,403ZM367,402 367,393 359,393 357,396 358,409 364,410 366,408ZM421,450 422,447 420,447 409,456 406,456 404,458 394,458 389,456 380,447 378,442 376,443 376,452 379,458 387,467 391,469 404,469 412,465 419,458Z",
    "M403,115 406,115 404,128 401,127 401,125 403,125 401,124ZM401,145 404,145 406,148 406,162 401,172 401,174 403,172 402,176 400,176 400,167 398,165 399,148ZM401,193 404,193 406,195 407,201 406,210 402,215 398,213 398,210 400,210 400,213 402,212 402,210 400,210 401,207 400,209 398,209 398,198ZM401,231 406,231 406,233 409,235 410,257 409,261 407,259 404,259 404,262 402,262 401,265 399,264 401,263 400,259 397,259 397,257 395,257 396,263 394,265 394,242 397,235ZM0,310 357,310 375,312 383,319 387,326 387,329 392,340 395,355 395,389 388,411 384,437 387,449 396,457 405,456 410,451 410,448 414,440 414,424 412,412 404,382 404,371 402,362 402,340 404,332 409,322 412,321 416,316 424,312 451,310 800,310 800,600 0,600ZM67,316 69,316 69,314 66,315 65,317ZM414,325 416,325 414,323 412,323 411,325 413,329ZM318,328 318,326 315,326 315,330 318,330ZM372,338 373,332 370,330 367,331 367,340 372,340ZM434,343 436,345 441,345 443,343 442,331 436,332 434,337ZM343,350 344,341 338,340 337,351 341,353 343,352ZM452,365 453,362 450,361 449,366ZM423,369 424,374 426,376 428,376 431,373 432,363 430,359 424,360ZM364,384 365,373 363,371 359,371 356,375 356,385 359,389 362,389ZM426,455 426,444 425,442 421,441 416,456 412,460 401,466 402,472 406,475 415,473 425,461ZM372,457 377,468 383,474 391,475 393,473 393,468 384,457 377,440 373,441 372,443Z",
    "M401,96 404,96 404,104 402,104 401,102ZM401,126 404,126 406,133 405,147 404,142 402,143 401,140 399,141 399,132ZM403,147 403,151 400,151 400,148 402,149ZM401,173 403,173 407,178 407,182 404,182 403,184 401,184 402,182 398,183ZM401,186 402,188 405,187 405,189 401,190ZM399,217 405,217 408,222 408,234 407,231 405,231 404,236 399,236 400,234 398,234 398,231 395,235 395,224ZM406,235 407,239 404,245 399,245 396,237 398,238 398,241 400,243 403,243 406,238ZM0,295 379,296 386,299 390,303 394,311 398,310 402,301 408,296 800,296 800,600 0,600ZM407,306 408,307 406,307 406,312 404,312 406,314 406,312 408,311 407,309 409,307 409,305ZM315,311 318,312 318,308 316,308ZM438,317 442,317 441,307 438,308ZM367,322 370,323 369,315 367,316ZM338,323 339,326 341,326 343,323 343,318 339,318ZM393,330 393,379 390,401 385,421 385,442 388,449 393,454 406,455 412,449 415,443 416,422 413,412 412,400 406,383 403,365 402,321 399,316 394,317ZM423,349 424,351 428,350 427,336 423,338ZM362,353 363,348 359,347 358,357 359,359 361,359ZM424,430 425,441 420,451 420,455 422,457 426,457 432,448 431,424 429,420 425,420ZM365,433 369,447 375,452 379,453 374,433 373,422 369,421 366,424Z",
    "M401,109 403,109 405,112 405,124 403,124 404,118 402,124 400,122 401,120 399,120ZM401,157 406,158 406,162 404,162 403,165 402,161 400,161ZM399,196 404,196 407,200 407,205 405,204 406,207 404,207 404,213 403,211 401,213 398,210 399,208 397,208 396,206 397,199ZM384,276 415,276 425,279 443,280 458,284 800,284 800,600 0,600 0,283 334,284 358,282 362,280ZM314,298 317,300 318,296 315,296ZM437,298 441,298 440,292 437,293ZM400,303 400,297 395,296 394,305 396,307 399,307ZM339,307 340,309 342,309 343,303 339,303ZM428,324 429,317 425,315 423,319 423,325 424,328 427,328ZM363,333 364,327 361,323 359,323 358,334 359,336 362,336ZM403,345 404,337 402,326 400,322 397,321 394,323 393,326 393,350 395,354 399,354 403,350ZM422,405 425,426 428,429 431,429 432,415 430,394 428,392 424,393ZM375,411 376,407 374,403 372,403 368,408 366,433 369,436 372,436 375,433ZM383,436 384,441 386,445 389,447 389,449 397,453 408,453 411,449 414,448 417,442 415,409 407,376 402,367 398,367 396,369 392,378 391,386 388,390 386,405 383,414ZM425,437 426,436 424,435 423,442 425,441ZM390,441 394,441 395,445 397,445 398,443 398,445 403,446 408,444 408,442 410,443 411,441 411,445 409,445 406,448 399,449 398,447 395,448 395,446 391,444Z",
    "M400,72 403,73 403,83 402,79 399,80ZM399,96 403,97 404,99 404,105 403,102 400,103 401,106 403,105 402,108 398,104ZM401,125 405,128 405,140 404,138 402,138 402,140 399,140 399,129ZM403,140 404,144 401,148 400,143 402,146ZM396,237 421,239 457,248 491,252 800,253 800,600 0,600 0,252 316,253 366,243 370,241 390,239ZM399,243 392,244 398,246ZM389,245 391,248 391,243ZM378,246 382,246 381,248 389,247 388,243 382,245 373,245 371,247 364,246 359,250 355,249 355,251 351,252 346,251 344,254 348,255 348,252 351,254 354,252 357,253 357,251 363,251 364,253 366,253 363,251 364,249 367,251 367,249 365,248 368,248 368,250 370,251 368,253 370,253 371,249 377,247 375,249 377,250ZM420,246 424,248 422,245 419,245 419,247ZM399,249 400,247 396,249 397,251 403,250 403,248 401,250ZM409,249 409,251 412,251 410,248ZM338,275 339,278 342,278 343,272 340,271ZM428,295 429,285 428,283 425,283 424,298 427,299ZM362,297 363,291 359,289 358,298 362,299ZM400,308 401,306 398,302 393,303 394,313 399,314ZM392,357 396,363 400,364 403,361 403,343 401,332 398,328 396,328 393,335ZM424,363 426,379 430,381 432,379 433,374 433,351 432,349 428,349 426,351ZM370,379 371,360 369,356 365,354 361,360 361,384 362,387 367,388 370,385ZM380,427 384,438 386,438 392,443 411,444 420,435 421,407 419,404 419,397 416,386 409,377 399,376 389,388 381,408ZM409,433 411,433 411,437 407,439 407,437 409,437ZM395,437 402,437 403,439 406,438 407,440 399,441 394,439ZM408,449 410,451 413,450 409,448ZM407,452 408,454 410,453 409,451Z",
    "M402,25 404,25 405,27 403,34 401,34ZM400,46 403,48 402,56 399,55ZM400,77 403,81 402,97 400,97 398,93 398,84ZM389,153 410,153 431,158 448,166 449,168 458,172 459,174 466,177 473,183 492,192 499,193 515,199 535,200 539,202 800,202 800,600 0,600 0,202 270,201 289,196 302,195 306,192 314,190 326,183 334,181 348,174 349,172 356,169 358,166 376,157ZM428,247 429,237 427,236 425,237 425,251 428,251ZM359,251 360,253 362,253 362,245 359,246ZM431,315 432,302 430,295 427,295 425,303 426,324 428,327 430,326ZM400,322 401,319 398,315 394,315 392,317 393,326 398,327 400,325ZM370,334 371,320 368,316 366,316 364,318 363,324 362,344 364,347 368,346ZM390,353 393,365 400,366 401,336 398,332 395,334 393,338ZM375,408 378,427 380,431 386,437 392,440 398,441 410,439 418,435 427,424 427,395 421,384 418,382 418,380 409,373 394,374 380,386 375,400ZM386,428 389,429 390,433 388,432 388,430 386,430ZM408,429 412,430 412,432 410,432ZM396,430 398,430 398,434 395,434Z",
    "M402,25 404,25 405,27 403,34 401,34ZM400,46 403,48 402,56 399,55ZM400,77 403,81 402,97 400,97 398,93 398,84ZM389,153 410,153 431,158 448,166 449,168 458,172 459,174 466,177 473,183 492,192 499,193 515,199 535,200 539,202 800,202 800,600 0,600 0,202 270,201 289,196 302,195 306,192 314,190 326,183 334,181 348,174 349,172 356,169 358,166 376,157ZM428,247 429,237 427,236 425,237 425,251 428,251ZM359,251 360,253 362,253 362,245 359,246ZM431,315 432,302 430,295 427,295 425,303 426,324 428,327 430,326ZM400,322 401,319 398,315 394,315 392,317 393,326 398,327 400,325ZM370,334 371,320 368,316 366,316 364,318 363,324 362,344 364,347 368,346ZM390,353 393,365 400,366 401,336 398,332 395,334 393,338ZM375,408 378,427 380,431 386,437 392,440 398,441 410,439 418,435 427,424 427,395 421,384 418,382 418,380 409,373 394,374 380,386 375,400ZM386,428 389,429 390,433 388,432 388,430 386,430ZM408,429 412,430 412,432 410,432ZM396,430 398,430 398,434 395,434Z",
    "M400,34 402,34 401,42ZM400,60 402,61 401,76 399,76ZM464,120 473,123 482,123 494,129 514,133 516,135 532,137 534,139 562,147 638,158 800,159 800,600 0,600 0,159 162,159 207,152 212,149 222,148 225,146 261,137 264,135 281,132 292,127 298,128 301,126 319,124 334,124 344,126 348,125 362,128 370,132 392,136 395,138 404,138 417,134 423,129 432,127 440,123ZM458,128 460,130 463,129 463,132 460,133 463,133 466,129 468,129 469,132 469,127ZM441,129 437,129 436,131 434,130 435,132 431,132 429,136 426,135 429,133 428,132 425,135 419,136 418,138 409,140 408,142 411,142 408,144 407,141 404,143 402,142 403,145 401,144 398,147 398,152 400,152 400,147 402,147 401,149 403,150 401,151 403,152 403,145 409,145 411,142 412,145 409,147 412,146 412,148 416,147 414,146 414,143 415,145 419,145 420,142 421,144 424,144 422,142 422,139 424,140 425,138 427,138 424,142 430,140 430,134 434,133 434,135 436,135 437,133 437,136 435,136 436,138 437,136 439,136 437,131 454,129 454,132 451,131 451,133 454,133 456,128 450,129 449,127 445,127ZM315,131 318,133 319,129ZM476,131 477,133 482,132 480,130ZM330,133 332,134 332,131 330,131ZM295,134 299,135 294,132 291,135ZM343,134 347,135 347,133 345,134 344,132ZM485,134 487,133 484,133 484,135 487,137 496,137 493,135 489,136ZM367,136 368,135 364,135 364,138ZM281,137 282,136 277,136 275,138 277,139ZM374,139 378,142 380,141 378,141 377,137 374,137ZM369,140 367,140 367,142 371,144 370,142 368,142ZM273,141 275,141 275,139 272,140 272,142ZM382,141 385,144 385,146 383,147 384,148 388,143 388,140ZM394,143 394,145 391,141 389,141 389,145 387,145 385,150 390,145 390,147 396,149 395,151 393,151 396,151 397,153 397,145 399,145 400,143ZM407,150 408,152 405,155 408,155 408,152 411,151 409,149ZM148,164 149,163 145,163 144,165 142,163 142,165 139,164 141,165 139,167 141,167 142,165 143,167 147,167 149,166ZM631,164 635,164 635,162 631,162ZM429,255 430,244 427,240 425,240 423,242 421,252 422,265 427,266ZM369,287 370,269 365,268 363,277 363,295 369,295ZM391,335 393,337 397,337 399,335 399,330 397,328 393,328 391,331ZM413,349 415,356 417,354 417,350 415,350 415,347 413,347ZM409,354 410,349 407,344 403,342 394,342 387,347 385,358 387,360 392,360 393,358 407,357 409,356ZM378,355 378,357 376,357 376,361 377,359 379,359ZM410,359 413,362 415,362 415,359 413,359 413,357ZM379,363 381,363 380,360 377,362 376,370 374,370 373,368 374,372 372,372 371,369 369,373 370,374 372,372 371,379 372,375 376,372 377,369 379,370 379,368 381,368 382,366 384,367 384,363 383,365ZM437,403 438,388 434,379 432,378 430,373 427,372 425,369 413,364 396,364 384,369 376,377 371,391 372,412 377,418 379,418 380,421 386,423 387,425 397,426 420,422 431,414 431,412 435,409ZM399,414 401,418 396,417 396,415 399,416ZM432,420 434,421 435,419 432,418ZM427,422 428,423 425,424 425,426 423,425 422,427 419,427 420,429 417,428 416,430 414,430 414,432 411,432 412,430 409,430 407,432 403,432 403,434 401,432 398,433 399,435 405,435 405,432 407,435 408,433 410,434 410,432 411,434 416,434 415,432 421,432 421,429 423,430 423,427 425,427 426,425 430,425 430,423 432,425 431,420Z",
    "M400,34 402,34 401,42ZM400,60 402,61 401,76 399,76ZM464,120 473,123 482,123 494,129 514,133 516,135 532,137 534,139 562,147 638,158 800,159 800,600 0,600 0,159 162,159 207,152 212,149 222,148 225,146 261,137 264,135 281,132 292,127 298,128 301,126 319,124 334,124 344,126 348,125 362,128 370,132 392,136 395,138 404,138 417,134 423,129 432,127 440,123ZM458,128 460,130 463,129 463,132 460,133 463,133 466,129 468,129 469,132 469,127ZM441,129 437,129 436,131 434,130 435,132 431,132 429,136 426,135 429,133 428,132 425,135 419,136 418,138 409,140 408,142 411,142 408,144 407,141 404,143 402,142 403,145 401,144 398,147 398,152 400,152 400,147 402,147 401,149 403,150 401,151 403,152 403,145 409,145 411,142 412,145 409,147 412,146 412,148 416,147 414,146 414,143 415,145 419,145 420,142 421,144 424,144 422,142 422,139 424,140 425,138 427,138 424,142 430,140 430,134 434,133 434,135 436,135 437,133 437,136 435,136 436,138 437,136 439,136 437,131 454,129 454,132 451,131 451,133 454,133 456,128 450,129 449,127 445,127ZM315,131 318,133 319,129ZM476,131 477,133 482,132 480,130ZM330,133 332,134 332,131 330,131ZM295,134 299,135 294,132 291,135ZM343,134 347,135 347,133 345,134 344,132ZM485,134 487,133 484,133 484,135 487,137 496,137 493,135 489,136ZM367,136 368,135 364,135 364,138ZM281,137 282,136 277,136 275,138 277,139ZM374,139 378,142 380,141 378,141 377,137 374,137ZM369,140 367,140 367,142 371,144 370,142 368,142ZM273,141 275,141 275,139 272,140 272,142ZM382,141 385,144 385,146 383,147 384,148 388,143 388,140ZM394,143 394,145 391,141 389,141 389,145 387,145 385,150 390,145 390,147 396,149 395,151 393,151 396,151 397,153 397,145 399,145 400,143ZM407,150 408,152 405,155 408,155 408,152 411,151 409,149ZM148,164 149,163 145,163 144,165 142,163 142,165 139,164 141,165 139,167 141,167 142,165 143,167 147,167 149,166ZM631,164 635,164 635,162 631,162ZM429,255 430,244 427,240 425,240 423,242 421,252 422,265 427,266ZM369,287 370,269 365,268 363,277 363,295 369,295ZM391,335 393,337 397,337 399,335 399,330 397,328 393,328 391,331ZM413,349 415,356 417,354 417,350 415,350 415,347 413,347ZM409,354 410,349 407,344 403,342 394,342 387,347 385,358 387,360 392,360 393,358 407,357 409,356ZM378,355 378,357 376,357 376,361 377,359 379,359ZM410,359 413,362 415,362 415,359 413,359 413,357ZM379,363 381,363 380,360 377,362 376,370 374,370 373,368 374,372 372,372 371,369 369,373 370,374 372,372 371,379 372,375 376,372 377,369 379,370 379,368 381,368 382,366 384,367 384,363 383,365ZM437,403 438,388 434,379 432,378 430,373 427,372 425,369 413,364 396,364 384,369 376,377 371,391 372,412 377,418 379,418 380,421 386,423 387,425 397,426 420,422 431,414 431,412 435,409ZM399,414 401,418 396,417 396,415 399,416ZM432,420 434,421 435,419 432,418ZM427,422 428,423 425,424 425,426 423,425 422,427 419,427 420,429 417,428 416,430 414,430 414,432 411,432 412,430 409,430 407,432 403,432 403,434 401,432 398,433 399,435 405,435 405,432 407,435 408,433 410,434 410,432 411,434 416,434 415,432 421,432 421,429 423,430 423,427 425,427 426,425 430,425 430,423 432,425 431,420Z",
    "M398,15 400,16 400,19 402,21 402,28 400,33 397,32ZM238,56 271,56 277,58 297,60 317,65 325,69 358,80 379,85 391,85 395,87 404,87 422,83 483,63 488,63 502,59 524,57 541,58 561,62 569,66 578,68 580,70 586,70 601,76 616,78 629,82 662,86 800,86 800,600 0,600 0,86 74,85 79,83 126,80 178,69 194,67 218,60 227,59 228,57ZM304,69 307,71 310,70 307,70 305,67ZM316,73 317,71 314,72 313,75 318,75ZM321,74 323,74 322,78 324,78 325,74 323,74 322,72ZM327,78 329,77 326,76 326,79 328,80ZM332,79 330,79 329,82 332,82ZM332,79 334,79 333,81 337,81 340,83 337,79ZM348,86 351,87 347,91 351,91 350,88 352,88 352,91 356,92 356,87 352,88 350,84ZM357,87 357,89 360,89 359,85 357,85ZM382,92 383,94 389,94 389,91ZM379,93 377,93 375,96 377,97ZM406,93 404,93 404,95 402,96 399,95 398,100 393,100 393,103 395,101 401,100 405,94 408,96ZM363,95 365,95 367,99 370,96 369,95 367,97 367,95 362,94 361,97ZM427,191 428,177 425,176 425,178 423,179 422,187 422,201 424,202 426,200ZM424,209 426,210 423,210 423,212 427,210 426,208ZM370,229 371,218 366,217 364,220 362,229 363,246 366,246 368,243ZM402,315 405,315 405,312 403,312 402,310 397,310 391,314 391,317 398,317ZM417,335 417,331 410,324 403,322 392,322 385,328 383,332 384,337ZM426,347 429,348 429,350 431,350 428,346ZM435,376 436,371 432,357 425,349 418,346 417,344 410,342 388,343 375,353 370,365 370,381 373,388 381,397 384,397 392,401 405,402 408,400 413,400 414,398 422,395 433,384ZM388,392 393,392 394,396 392,395 392,393ZM400,392 406,392 407,395 403,395 403,393 401,395ZM407,392 410,392 412,394 409,395Z",
    "M161,26 215,28 248,34 264,35 267,38 278,38 296,44 324,47 335,50 343,49 357,52 406,54 451,52 455,50 483,47 491,43 508,42 521,39 524,37 538,36 574,27 619,26 640,29 652,28 656,30 665,30 710,40 713,42 721,43 724,45 732,46 735,48 751,52 777,56 800,57 800,600 0,600 0,69 2,69 0,68 0,54 37,50 74,42 102,39 119,33ZM232,36 236,36 236,39 238,37 242,37 231,35 231,38ZM129,38 134,39 131,36ZM253,40 251,39 252,42 249,41 248,43 255,43 256,45 258,45 257,43 253,42ZM269,43 270,44 267,45 262,45 266,45 266,47 270,45 272,46 272,48 274,48 272,46 274,45 273,42ZM94,45 98,47 98,44ZM290,48 283,47 282,51 280,51 279,49 278,50 280,52 283,52 283,50 285,51 285,49 292,50ZM294,50 296,52 299,51 295,49ZM317,54 319,55 318,52 316,53 316,55ZM357,57 358,59 360,58 359,56ZM374,57 376,59 379,58 377,58 376,56ZM2,59 3,58 1,58 3,65 6,65 6,63 3,62ZM5,59 8,62 8,60 6,58ZM9,61 10,63 11,61 14,62 14,60ZM427,145 427,137 425,137 422,142 421,157 423,166 426,163ZM368,174 368,171 364,173 362,188 363,193 367,193 369,183ZM362,200 366,201 365,198 362,198ZM392,264 394,266 397,266 399,264 399,259 397,256 394,256 392,258ZM387,288 388,293 392,298 399,299 405,288 404,278 402,274 399,272 394,273 388,281ZM373,347 374,355 377,359 379,366 387,374 395,378 408,377 417,372 424,365 428,358 430,351 430,338 427,330 427,325 425,321 422,319 422,317 416,312 403,308 394,309 389,313 385,314 378,322 374,334Z",
    "M113,0 214,0 275,12 278,14 294,18 301,22 324,27 327,29 344,30 352,32 456,27 461,25 485,22 499,17 526,11 538,6 543,6 566,0 635,0 653,2 668,7 699,13 759,33 770,35 800,35 800,600 0,600 0,38 2,38 0,37 0,26 12,22 19,22 43,13 62,9 65,7 70,7 89,2ZM69,13 67,14 67,16 69,16ZM54,16 55,17 51,18 51,20 49,18 46,20 44,19 43,21 41,20 42,24 49,22 48,19 50,20 50,22 55,20 53,18 58,19 58,16 57,18 55,15ZM38,23 40,25 40,22 35,23 35,25 37,26ZM28,25 33,26 35,28 35,26 33,26 31,23 30,25 27,24 27,27 23,27 23,25 21,25 16,28 20,27 20,29 23,29 27,32 26,30 24,30 24,27 26,27 26,29ZM11,29 11,31 8,32 8,34 14,31 16,32 16,29ZM11,35 11,37 14,36 12,34ZM426,113 427,96 424,95 422,98 421,114 424,116ZM367,146 368,130 365,129 364,147 367,148ZM396,210 397,208 395,203 391,203 390,213 395,214ZM401,252 401,231 398,228 392,228 389,235 389,257 391,264 394,267 397,267 399,265 401,259ZM396,274 394,274 394,278 396,277ZM426,334 427,315 424,300 417,291 417,289 408,283 396,283 388,287 381,295 377,309 377,339 385,355 389,359 397,362 406,362 410,360 423,346ZM414,366 416,367 416,365 413,365 412,369 416,370 418,367 413,368ZM393,368 393,366 392,368 391,366 389,367 389,369 391,369 393,373 394,372 392,371 392,369 397,371 398,369 401,370 400,368ZM410,368 407,368 406,374 409,369 413,371Z",
    "M113,0 214,0 275,12 278,14 294,18 301,22 324,27 327,29 344,30 352,32 456,27 461,25 485,22 499,17 526,11 538,6 543,6 566,0 635,0 653,2 668,7 699,13 759,33 770,35 800,35 800,600 0,600 0,38 2,38 0,37 0,26 12,22 19,22 43,13 62,9 65,7 70,7 89,2ZM69,13 67,14 67,16 69,16ZM54,16 55,17 51,18 51,20 49,18 46,20 44,19 43,21 41,20 42,24 49,22 48,19 50,20 50,22 55,20 53,18 58,19 58,16 57,18 55,15ZM38,23 40,25 40,22 35,23 35,25 37,26ZM28,25 33,26 35,28 35,26 33,26 31,23 30,25 27,24 27,27 23,27 23,25 21,25 16,28 20,27 20,29 23,29 27,32 26,30 24,30 24,27 26,27 26,29ZM11,29 11,31 8,32 8,34 14,31 16,32 16,29ZM11,35 11,37 14,36 12,34ZM426,113 427,96 424,95 422,98 421,114 424,116ZM367,146 368,130 365,129 364,147 367,148ZM396,210 397,208 395,203 391,203 390,213 395,214ZM401,252 401,231 398,228 392,228 389,235 389,257 391,264 394,267 397,267 399,265 401,259ZM396,274 394,274 394,278 396,277ZM426,334 427,315 424,300 417,291 417,289 408,283 396,283 388,287 381,295 377,309 377,339 385,355 389,359 397,362 406,362 410,360 423,346ZM414,366 416,367 416,365 413,365 412,369 416,370 418,367 413,368ZM393,368 393,366 392,368 391,366 389,367 389,369 391,369 393,373 394,372 392,371 392,369 397,371 398,369 401,370 400,368ZM410,368 407,368 406,374 409,369 413,371Z",
    "M24,0 153,0 152,2 154,0 166,0 177,5 185,5 189,7 213,9 246,15 264,15 287,18 414,18 517,14 578,3 586,0 756,0 758,2 782,8 784,10 790,11 800,16 800,600 0,600 0,17 8,10 10,10 12,7 14,7 15,5 19,4ZM483,22 486,25 486,21 484,20ZM302,24 304,26 307,23ZM422,60 422,65 426,64 425,52 423,52 422,54ZM362,107 366,107 365,95 363,96ZM394,182 395,175 391,173 388,176 388,183 389,185 393,185ZM387,222 391,238 395,239 397,237 398,217 397,209 394,203 391,203 388,206ZM373,328 375,338 381,346 381,348 386,353 391,354 393,356 406,356 414,352 421,344 424,337 422,293 415,276 410,270 406,268 397,267 389,271 385,275 384,279 382,280 379,286 375,299 373,312ZM387,363 388,364 385,365 390,364 390,368 390,365 393,366 391,363ZM406,365 409,365 409,367 397,366 399,368 397,368 396,372 400,371 401,369 405,369 404,372 402,371 401,373 406,373 406,369 410,368 411,366 410,363Z",
    "M0,0 84,0 109,8 598,7 610,6 620,3 638,2 642,0 799,0 800,600 0,600ZM424,28 425,16 422,16 420,31 423,32ZM394,150 395,141 387,140 385,142 385,151 391,153ZM385,195 388,207 392,208 393,206 393,194 390,178 386,179ZM368,301 371,316 374,320 374,323 383,333 393,338 408,337 420,327 426,315 427,293 423,276 420,270 414,263 405,258 388,259 375,271 375,273 372,276 369,286ZM383,347 385,349 389,348 387,344 385,346 383,345ZM390,349 392,349 390,351 395,351 395,353 398,353 398,350 396,351 392,348Z",
    "M0,0 66,0 75,3 690,3 700,2 704,0 800,0 800,600 0,600ZM89,8 91,8 91,10 93,11 92,8 95,7ZM394,122 395,116 392,113 387,113 385,115 385,123 393,124ZM385,156 386,167 390,168 392,163 392,149 388,147 386,149ZM366,295 369,306 379,316 393,319 408,318 426,309 426,307 430,303 432,295 432,283 424,264 415,255 408,252 389,252 380,259 378,259 368,271 366,277Z",
    "M0,0 66,0 75,3 690,3 700,2 704,0 800,0 800,600 0,600ZM89,8 91,8 91,10 93,11 92,8 95,7ZM394,122 395,116 392,113 387,113 385,115 385,123 393,124ZM385,156 386,167 390,168 392,163 392,149 388,147 386,149ZM366,295 369,306 379,316 393,319 408,318 426,309 426,307 430,303 432,295 432,283 424,264 415,255 408,252 389,252 380,259 378,259 368,271 366,277Z",
    "M0,0 55,0 55,2 56,0 66,0 66,2 68,0 130,0 129,2 131,0 182,0 182,2 183,0 187,0 186,2 188,0 227,0 228,2 228,0 287,0 286,2 288,0 335,0 334,2 336,0 349,0 349,2 350,0 360,0 361,2 362,0 364,2 366,2 364,0 367,0 368,2 369,0 389,0 389,2 390,0 421,0 420,2 422,0 455,0 455,2 456,0 510,0 511,2 511,0 620,0 620,2 622,2 622,0 651,0 650,2 652,0 654,0 654,2 655,0 657,0 658,2 658,0 665,0 666,2 668,2 667,0 800,0 800,600 0,600ZM387,81 391,82 392,78 388,77ZM392,132 393,121 389,118 387,120 387,134 388,136 391,136ZM360,289 363,297 369,303 380,309 390,310 394,312 418,311 429,303 429,301 433,297 433,294 435,293 435,274 429,260 421,253 407,247 392,247 383,249 375,253 371,258 368,259 368,261 365,263 362,269 360,278Z",
    "M0,0 800,0 800,600 0,600ZM391,97 392,82 389,81 386,86 385,98 387,101 391,101ZM351,283 355,292 357,292 360,296 367,299 368,301 385,306 406,308 421,306 438,298 445,289 446,276 442,268 438,265 438,263 427,256 408,252 394,252 379,255 362,263 352,275Z",
    "M0,0 800,0 800,600 0,600ZM391,97 392,82 389,81 386,86 385,98 387,101 391,101ZM351,283 355,292 357,292 360,296 367,299 368,301 385,306 406,308 421,306 438,298 445,289 446,276 442,268 438,265 438,263 427,256 408,252 394,252 379,255 362,263 352,275Z",
    "M0,0 800,0 800,600 0,600ZM448,281 449,278 444,269 431,260 410,255 384,255 370,258 362,262 360,265 358,265 351,272 350,289 358,296 371,299 374,301 387,303 415,304 425,303 442,295 448,286ZM379,310 380,312 382,312 380,308ZM391,310 389,312 387,311 388,316 390,315ZM394,312 395,314 398,313 395,312 395,309 393,309 393,313Z",
    "M0,0 800,0 800,600 0,600ZM448,281 449,278 444,269 431,260 410,255 384,255 370,258 362,262 360,265 358,265 351,272 350,289 358,296 371,299 374,301 387,303 415,304 425,303 442,295 448,286ZM379,310 380,312 382,312 380,308ZM391,310 389,312 387,311 388,316 390,315ZM394,312 395,314 398,313 395,312 395,309 393,309 393,313Z",
    "M0,0 800,0 800,600 0,600ZM354,286 358,296 366,303 393,308 413,308 424,306 436,300 444,290 445,279 438,262 433,257 425,253 419,253 415,251 403,251 381,253 367,258 357,267 355,271ZM433,309 430,309 427,312 422,312 422,314 415,313 415,315 413,315 410,318 412,318 413,316 420,317 420,315 424,317 422,315 424,315 425,312 429,313 429,311 433,311ZM381,312 381,314 379,312 380,316 382,316 383,313 384,317 387,317 388,315 388,318 391,318 389,317 391,314 388,315 386,313 387,315 385,315 383,311ZM393,315 393,318 395,319 395,314ZM406,315 408,318 412,314Z",
    "M0,0 800,0 800,600 0,600ZM358,285 363,301 372,312 374,312 376,315 382,318 393,319 401,315 410,312 415,312 427,307 436,296 438,290 438,278 432,261 430,260 429,256 427,255 426,251 421,245 415,242 399,242 386,245 381,248 377,248 362,261 358,274ZM412,320 415,321 419,319 415,318 415,320Z",
    "M0,0 800,0 800,600 0,600ZM355,287 359,302 369,315 371,315 374,319 384,323 402,325 407,324 415,315 424,312 434,304 438,297 440,280 438,269 433,258 430,256 429,252 415,238 405,234 390,234 383,238 379,246 369,250 359,260 355,272Z",
    "M0,0 800,0 800,600 0,600ZM371,242 372,244 364,252 362,252 362,254 357,259 352,273 352,290 362,315 369,322 371,322 378,328 381,328 385,331 392,333 409,334 417,333 427,329 434,321 432,310 437,305 444,291 443,272 436,250 422,235 420,235 412,229 404,228 401,226 385,227 376,230 371,236ZM417,323 418,325 421,325 417,328 413,328 413,324 416,325Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM488.9,155.3 490.9,159.3 492.9,159.3 493.9,161.3 500.9,161.3 505.9,156.3 505.9,149.3 501.9,144.3 494.9,143.3 489.9,147.3ZM480.9,215.3 481.9,219.3 485.9,223.3 494.9,224.3 500.9,218.3 500.9,210.3 497.9,206.3 493.9,204.3 488.9,204.3 482.9,207.3ZM302.9,285.3 305.9,296.3 313.9,310.3 315.9,316.3 314.9,320.3 316.9,324.3 316.9,329.3 321.9,342.3 327.9,348.3 337.9,352.3 368.9,355.3 388.9,355.3 395.9,352.3 406.9,352.3 427.9,364.3 433.9,366.3 447.9,366.3 456.9,362.3 471.9,347.3 473.9,347.3 484.9,336.3 488.9,328.3 490.9,328.3 493.9,320.3 494.9,308.3 492.9,295.3 492.9,277.3 490.9,266.3 487.9,262.3 487.9,259.3 475.9,249.3 451.9,240.3 445.9,234.3 445.9,232.3 441.9,228.3 441.9,225.3 432.9,216.3 419.9,210.3 411.9,204.3 395.9,197.3 386.9,197.3 386.9,199.3 383.9,199.3 377.9,202.3 374.9,206.3 372.9,206.3 369.9,209.3 369.9,211.3 360.9,219.3 338.9,226.3 331.9,230.3 324.9,237.3 320.9,245.3 315.9,250.3 309.9,263.3 307.9,264.3 303.9,273.3ZM503.9,287.3 505.9,316.3 504.9,326.3 501.9,332.3 498.9,347.3 505.9,343.3 513.9,335.3 513.9,333.3 517.9,331.3 521.9,323.3 524.9,310.3 524.9,298.3 520.9,282.3 514.9,270.3 507.9,262.3 507.9,260.3 503.9,258.3ZM284.9,294.3 284.9,287.3 279.9,278.3 274.9,282.3 269.9,291.3 269.9,305.3 274.9,315.3 278.9,313.3 279.9,309.3 283.9,304.3Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM412.9,127.3 416.9,130.3 419.9,130.3 422.9,127.3 422.9,122.3 418.9,119.3 414.9,120.3 412.9,122.3ZM458.9,141.3 460.9,145.3 467.9,145.3 469.9,142.3 469.9,136.3 465.9,133.3 462.9,133.3 459.9,136.3ZM516.9,185.3 518.9,196.3 522.9,204.3 530.9,211.3 544.9,216.3 546.9,210.3 545.9,191.3 541.9,182.3 533.9,175.3 533.9,173.3 521.9,168.3 517.9,168.3ZM554.9,218.3 558.9,231.3 558.9,268.3 553.9,294.3 551.9,294.3 540.9,284.3 534.9,281.3 532.9,277.3 530.9,277.3 527.9,273.3 525.9,273.3 522.9,269.3 515.9,265.3 512.9,261.3 508.9,260.3 507.9,258.3 491.9,250.3 491.9,248.3 485.9,246.3 480.9,241.3 478.9,241.3 476.9,237.3 473.9,235.3 462.9,211.3 456.9,205.3 449.9,201.3 427.9,196.3 426.9,194.3 421.9,193.3 403.9,192.3 390.9,196.3 382.9,203.3 380.9,203.3 377.9,207.3 372.9,209.3 358.9,209.3 351.9,208.3 351.9,206.3 330.9,206.3 319.9,211.3 319.9,213.3 315.9,215.3 306.9,224.3 306.9,226.3 302.9,229.3 302.9,231.3 292.9,242.3 288.9,252.3 286.9,252.3 285.9,254.3 282.9,266.3 283.9,279.3 288.9,290.3 288.9,295.3 290.9,297.3 291.9,303.3 295.9,310.3 295.9,314.3 297.9,317.3 299.9,328.3 302.9,332.3 302.9,336.3 308.9,343.3 317.9,348.3 330.9,351.3 347.9,352.3 359.9,357.3 372.9,371.3 374.9,371.3 378.9,376.3 381.9,376.3 387.9,383.3 389.9,383.3 410.9,406.3 412.9,406.3 421.9,414.3 412.9,412.3 410.9,410.3 404.9,409.3 402.9,407.3 399.9,407.3 395.9,404.3 392.9,404.3 381.9,399.3 374.9,399.3 370.9,397.3 355.9,395.3 336.9,395.3 315.9,392.3 310.9,393.3 323.9,406.3 325.9,406.3 332.9,412.3 336.9,413.3 338.9,422.3 343.9,425.3 349.9,424.3 351.9,421.3 355.9,421.3 362.9,424.3 366.9,423.3 384.9,427.3 406.9,427.3 417.9,425.3 430.9,419.3 443.9,423.3 451.9,423.3 464.9,419.3 465.9,417.3 470.9,415.3 480.9,404.3 494.9,379.3 507.9,368.3 523.9,362.3 546.9,357.3 566.9,349.3 574.9,341.3 577.9,333.3 577.9,326.3 574.9,321.3 574.9,318.3 568.9,311.3 575.9,285.3 576.9,268.3 574.9,253.3 569.9,238.3 565.9,233.3 563.9,226.3 555.9,217.3ZM380.9,261.3 391.9,265.3 392.9,267.3 400.9,270.3 408.9,276.3 423.9,281.3 429.9,281.3 428.9,290.3 423.9,294.3 417.9,295.3 412.9,301.3 404.9,303.3 385.9,301.3 383.9,298.3 379.9,296.3 378.9,290.3 374.9,285.3 375.9,270.3 379.9,266.3ZM574.9,313.3 576.9,315.3 581.9,315.3 583.9,313.3 583.9,308.3 579.9,305.3 575.9,306.3ZM319.9,424.3 324.9,428.3 326.9,432.3 328.9,432.3 332.9,437.3 334.9,437.3 336.9,440.3 338.9,440.3 346.9,447.3 353.9,449.3 357.9,452.3 360.9,452.3 364.9,455.3 385.9,460.3 402.9,460.3 421.9,456.3 447.9,443.3 453.9,437.3 452.9,436.3 448.9,440.3 441.9,441.3 439.9,443.3 422.9,448.3 409.9,450.3 388.9,450.3 368.9,446.3 357.9,441.3 352.9,441.3 326.9,428.3 320.9,423.3Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM482.9,95.3 483.9,93.3 481.9,90.3 474.9,91.3 475.9,98.3 479.9,99.3 482.9,97.3ZM424.9,122.3 443.9,122.3 460.9,124.3 469.9,127.3 473.9,126.3 484.9,131.3 487.9,131.3 509.9,143.3 501.9,129.3 498.9,127.3 498.9,125.3 484.9,112.3 481.9,112.3 477.9,108.3 459.9,100.3 451.9,100.3 436.9,97.3 415.9,98.3 399.9,101.3 389.9,105.3 382.9,106.3 380.9,108.3 374.9,108.3 370.9,111.3 318.9,110.3 308.9,112.3 290.9,120.3 284.9,127.3 282.9,127.3 279.9,130.3 279.9,132.3 277.9,133.3 272.9,142.3 272.9,145.3 268.9,153.3 261.9,182.3 260.9,199.3 264.9,217.3 271.9,231.3 273.9,232.3 277.9,240.3 280.9,242.3 280.9,244.3 282.9,244.3 283.9,247.3 287.9,250.3 287.9,252.3 291.9,255.3 300.9,273.3 299.9,282.3 294.9,295.3 294.9,311.3 298.9,323.3 299.9,340.3 295.9,361.3 296.9,368.3 294.9,369.3 294.9,367.3 288.9,361.3 287.9,357.3 285.9,356.3 285.9,354.3 283.9,353.3 275.9,339.3 267.9,330.3 266.9,326.3 264.9,325.3 260.9,317.3 259.9,319.3 262.9,325.3 263.9,332.3 265.9,333.3 266.9,339.3 271.9,349.3 271.9,352.3 277.9,363.3 277.9,366.3 287.9,386.3 289.9,387.3 290.9,391.3 296.9,399.3 296.9,408.3 303.9,425.3 308.9,430.3 308.9,432.3 323.9,446.3 337.9,453.3 337.9,455.3 341.9,457.3 358.9,462.3 375.9,463.3 402.9,458.3 420.9,459.3 466.9,482.3 484.9,483.3 491.9,480.3 497.9,474.3 502.9,465.3 506.9,450.3 506.9,422.3 502.9,396.3 503.9,388.3 501.9,378.3 501.9,351.3 505.9,334.3 510.9,322.3 511.9,306.3 507.9,292.3 501.9,282.3 498.9,273.3 498.9,255.3 500.9,244.3 497.9,225.3 492.9,215.3 480.9,199.3 471.9,180.3 469.9,172.3 465.9,167.3 459.9,154.3 452.9,147.3 452.9,145.3 449.9,142.3 447.9,142.3 444.9,138.3 441.9,138.3 437.9,134.3 431.9,132.3 430.9,130.3 422.9,126.3 414.9,124.3ZM521.9,132.3 525.9,135.3 525.9,137.3 528.9,139.3 533.9,149.3 535.9,150.3 546.9,174.3 549.9,184.3 549.9,191.3 551.9,194.3 561.9,235.3 573.9,268.3 576.9,281.3 578.9,282.3 582.9,297.3 585.9,319.3 585.9,331.3 582.9,347.3 583.9,351.3 579.9,365.3 574.9,374.3 575.9,375.3 587.9,359.3 587.9,355.3 594.9,343.3 598.9,329.3 600.9,305.3 596.9,278.3 590.9,254.3 579.9,221.3 577.9,219.3 571.9,200.3 568.9,196.3 568.9,193.3 564.9,187.3 564.9,184.3 557.9,170.3 545.9,154.3 544.9,150.3 541.9,148.3 541.9,142.3 539.9,140.3 534.9,141.3 528.9,135.3 526.9,135.3 522.9,131.3ZM528.9,181.3 537.9,211.3 547.9,231.3 549.9,231.3 550.9,213.3 547.9,204.3 547.9,199.3 537.9,185.3 535.9,185.3 533.9,182.3 529.9,180.3ZM570.9,189.3 572.9,192.3 577.9,193.3 581.9,190.3 581.9,184.3 578.9,181.3 574.9,181.3 570.9,184.3ZM353.9,253.3 361.9,253.3 377.9,258.3 405.9,272.3 406.9,274.3 419.9,279.3 440.9,280.3 449.9,278.3 449.9,287.3 447.9,289.3 447.9,292.3 440.9,299.3 434.9,312.3 424.9,321.3 424.9,323.3 421.9,323.3 396.9,309.3 395.9,306.3 393.9,306.3 386.9,299.3 380.9,296.3 366.9,283.3 364.9,283.3 362.9,280.3 360.9,280.3 352.9,273.3 348.9,273.3 352.9,265.3ZM189.9,277.3 192.9,281.3 199.9,282.3 203.9,279.3 204.9,272.3 202.9,269.3 195.9,267.3 190.9,270.3ZM617.9,290.3 620.9,294.3 626.9,294.3 629.9,290.3 629.9,287.3 626.9,283.3 620.9,283.3 617.9,287.3ZM309.9,472.3 310.9,469.3 306.9,465.3 300.9,466.3 297.9,470.3 298.9,475.3 301.9,477.3 307.9,476.3Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM393.9,53.3 394.9,47.3 391.9,44.3 386.9,43.3 382.9,45.3 381.9,54.3 383.9,56.3 390.9,57.3 393.9,55.3ZM371.9,75.3 394.9,76.3 409.9,79.3 410.9,81.3 406.9,83.3 404.9,86.3 402.9,86.3 400.9,89.3 395.9,91.3 393.9,94.3 385.9,98.3 383.9,101.3 381.9,101.3 380.9,104.3 378.9,104.3 363.9,119.3 357.9,130.3 354.9,132.3 344.9,158.3 335.9,196.3 329.9,209.3 321.9,217.3 313.9,220.3 312.9,222.3 302.9,227.3 299.9,231.3 297.9,231.3 291.9,238.3 289.9,238.3 285.9,242.3 285.9,244.3 278.9,250.3 278.9,252.3 270.9,260.3 268.9,260.3 255.9,273.3 253.9,273.3 249.9,278.3 246.9,279.3 246.9,281.3 237.9,289.3 237.9,291.3 231.9,297.3 230.9,301.3 228.9,302.3 224.9,310.3 223.9,316.3 220.9,307.3 218.9,293.3 218.9,275.3 221.9,260.3 220.9,255.3 230.9,224.3 225.9,227.3 225.9,229.3 222.9,231.3 222.9,233.3 215.9,241.3 214.9,245.3 212.9,246.3 212.9,250.3 208.9,256.3 208.9,259.3 206.9,261.3 201.9,280.3 200.9,299.3 205.9,324.3 202.9,325.3 202.9,327.3 200.9,328.3 200.9,336.3 206.9,341.3 213.9,340.3 215.9,346.3 224.9,357.3 229.9,373.3 242.9,397.3 242.9,400.3 249.9,409.3 251.9,415.3 259.9,423.3 257.9,424.3 248.9,419.3 247.9,417.3 245.9,417.3 246.9,420.3 251.9,424.3 251.9,426.3 255.9,430.3 257.9,430.3 267.9,440.3 269.9,440.3 282.9,450.3 286.9,451.3 287.9,453.3 297.9,458.3 300.9,458.3 306.9,462.3 309.9,462.3 326.9,471.3 329.9,471.3 336.9,475.3 339.9,474.3 344.9,476.3 343.9,478.3 332.9,479.3 300.9,468.3 291.9,467.3 258.9,452.3 257.9,450.3 253.9,449.3 248.9,444.3 243.9,442.3 224.9,423.3 224.9,421.3 220.9,418.3 220.9,416.3 213.9,408.3 212.9,404.3 211.9,407.3 213.9,413.3 222.9,431.3 230.9,440.3 230.9,442.3 234.9,445.3 234.9,447.3 247.9,459.3 249.9,459.3 256.9,465.3 260.9,466.3 261.9,468.3 269.9,472.3 272.9,472.3 276.9,475.3 279.9,475.3 290.9,480.3 297.9,480.3 305.9,483.3 340.9,489.3 348.9,488.3 363.9,490.3 367.9,494.3 387.9,502.3 403.9,505.3 420.9,505.3 434.9,500.3 439.9,495.3 460.9,494.3 467.9,492.3 472.9,493.3 490.9,488.3 509.9,479.3 510.9,477.3 518.9,473.3 518.9,471.3 521.9,470.3 531.9,459.3 533.9,459.3 536.9,456.3 536.9,454.3 538.9,454.3 541.9,451.3 543.9,446.3 548.9,441.3 550.9,441.3 557.9,433.3 559.9,433.3 568.9,423.3 571.9,423.3 594.9,399.3 594.9,397.3 599.9,394.3 599.9,392.3 605.9,386.3 613.9,371.3 615.9,370.3 618.9,362.3 621.9,360.3 622.9,356.3 627.9,350.3 633.9,337.3 636.9,325.3 636.9,294.3 630.9,273.3 622.9,259.3 622.9,256.3 620.9,255.3 619.9,251.3 616.9,249.3 614.9,244.3 610.9,241.3 610.9,239.3 600.9,229.3 597.9,263.3 599.9,289.3 608.9,344.3 608.9,356.3 605.9,362.3 603.9,363.3 602.9,367.3 600.9,368.3 596.9,376.3 594.9,376.3 593.9,379.3 589.9,382.3 589.9,384.3 587.9,384.3 583.9,388.3 583.9,390.3 576.9,396.3 576.9,398.3 561.9,413.3 557.9,415.3 557.9,417.3 541.9,432.3 541.9,434.3 527.9,448.3 525.9,448.3 519.9,454.3 514.9,455.3 509.9,459.3 505.9,460.3 504.9,462.3 501.9,462.3 494.9,466.3 484.9,468.3 481.9,470.3 456.9,474.3 471.9,401.3 479.9,386.3 482.9,385.3 482.9,383.3 488.9,376.3 500.9,351.3 502.9,351.3 505.9,344.3 510.9,339.3 515.9,330.3 518.9,328.3 518.9,326.3 522.9,322.3 523.9,318.3 525.9,318.3 529.9,310.3 540.9,274.3 546.9,265.3 547.9,259.3 549.9,258.3 550.9,254.3 552.9,253.3 553.9,249.3 558.9,243.3 573.9,208.3 575.9,198.3 574.9,174.3 564.9,154.3 553.9,143.3 551.9,143.3 548.9,139.3 546.9,139.3 537.9,131.3 535.9,131.3 532.9,126.3 530.9,126.3 520.9,117.3 520.9,115.3 518.9,114.3 518.9,112.3 513.9,107.3 508.9,97.3 504.9,93.3 500.9,84.3 493.9,76.3 493.9,73.3 481.9,61.3 467.9,55.3 449.9,56.3 441.9,59.3 441.9,61.3 434.9,63.3 428.9,68.3 413.9,63.3 395.9,60.3 365.9,62.3 355.9,64.3 343.9,68.3 339.9,71.3 336.9,71.3 330.9,76.3 325.9,77.3 324.9,79.3 316.9,83.3 314.9,86.3 301.9,86.3 289.9,89.3 268.9,100.3 257.9,111.3 257.9,113.3 254.9,115.3 249.9,125.3 245.9,129.3 241.9,144.3 250.9,137.3 254.9,136.3 264.9,127.3 270.9,125.3 278.9,118.3 281.9,118.3 283.9,115.3 285.9,115.3 292.9,109.3 296.9,108.3 303.9,102.3 307.9,101.3 308.9,99.3 312.9,98.3 318.9,93.3 328.9,89.3 329.9,87.3 327.9,86.3 343.9,80.3ZM349.9,93.3 353.9,97.3 358.9,97.3 362.9,93.3 362.9,88.3 358.9,84.3 353.9,84.3 349.9,88.3ZM465.9,253.3 467.9,253.3 471.9,257.3 476.9,267.3 477.9,297.3 474.9,304.3 471.9,305.3 469.9,310.3 464.9,315.3 457.9,332.3 433.9,330.3 418.9,325.3 406.9,318.3 402.9,318.3 401.9,316.3 390.9,310.3 388.9,307.3 386.9,307.3 383.9,303.3 381.9,303.3 379.9,299.3 377.9,299.3 368.9,290.3 361.9,286.3 360.9,283.3 358.9,283.3 350.9,276.3 336.9,271.3 329.9,271.3 326.9,273.3 330.9,257.3 339.9,254.3 355.9,255.3 375.9,261.3 385.9,266.3 389.9,270.3 411.9,281.3 421.9,284.3 438.9,284.3 452.9,279.3 461.9,271.3 465.9,260.3ZM147.9,365.3 151.9,368.3 155.9,367.3 157.9,365.3 156.9,358.3 148.9,358.3ZM549.9,405.3 550.9,404.3 546.9,402.3 540.9,402.3 539.9,404.3 537.9,404.3 535.9,409.3 537.9,415.3 540.9,417.3 548.9,416.3 550.9,413.3ZM505.9,515.3 507.9,515.3 509.9,518.3 515.9,518.3 516.9,510.3 512.9,507.3 507.9,508.3 505.9,511.3Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM144.9,63.3 147.9,78.3 149.9,81.3 148.9,85.3 153.9,96.3 154.9,102.3 156.9,104.3 156.9,107.3 159.9,111.3 164.9,126.3 178.9,154.3 181.9,157.3 181.9,160.3 188.9,172.3 188.9,175.3 196.9,191.3 196.9,194.3 194.9,195.3 190.9,203.3 187.9,205.3 184.9,212.3 177.9,221.3 174.9,229.3 172.9,230.3 170.9,237.3 166.9,242.3 164.9,250.3 162.9,251.3 161.9,249.3 156.9,247.3 150.9,248.3 146.9,252.3 145.9,256.3 147.9,262.3 149.9,262.3 150.9,264.3 159.9,264.3 156.9,281.3 156.9,304.3 160.9,325.3 166.9,339.3 165.9,357.3 167.9,387.3 168.9,391.3 170.9,392.3 171.9,400.3 174.9,409.3 177.9,413.3 177.9,416.3 182.9,425.3 188.9,431.3 188.9,433.3 208.9,454.3 224.9,462.3 222.9,487.3 223.9,515.3 227.9,531.3 232.9,540.3 236.9,543.3 236.9,545.3 247.9,550.3 261.9,550.3 266.9,548.3 269.9,549.3 274.9,546.3 277.9,546.3 281.9,544.3 283.9,541.3 295.9,535.3 305.9,526.3 307.9,526.3 310.9,523.3 310.9,521.3 313.9,520.3 330.9,503.3 349.9,513.3 377.9,520.3 406.9,519.3 439.9,508.3 456.9,495.3 433.9,500.3 410.9,501.3 376.9,497.3 347.9,488.3 347.9,486.3 366.9,468.3 368.9,468.3 370.9,465.3 374.9,464.3 377.9,461.3 387.9,458.3 401.9,458.3 402.9,460.3 410.9,460.3 417.9,462.3 442.9,462.3 447.9,460.3 451.9,461.3 485.9,448.3 503.9,445.3 505.9,443.3 517.9,442.3 515.9,451.3 513.9,451.3 511.9,455.3 509.9,455.3 503.9,461.3 499.9,462.3 497.9,465.3 483.9,472.3 480.9,472.3 475.9,476.3 471.9,477.3 470.9,479.3 468.9,479.3 468.9,482.3 475.9,482.3 475.9,484.3 472.9,485.3 462.9,495.3 460.9,495.3 457.9,499.3 455.9,499.3 452.9,503.3 449.9,504.3 450.9,505.3 461.9,501.3 465.9,501.3 466.9,509.3 470.9,512.3 475.9,513.3 482.9,508.3 482.9,500.3 478.9,495.3 486.9,493.3 514.9,479.3 515.9,477.3 528.9,471.3 532.9,467.3 537.9,466.3 538.9,464.3 549.9,458.3 551.9,455.3 553.9,455.3 555.9,452.3 557.9,452.3 559.9,448.3 561.9,448.3 565.9,443.3 567.9,443.3 581.9,428.3 585.9,430.3 593.9,430.3 597.9,426.3 598.9,419.3 595.9,414.3 598.9,412.3 602.9,404.3 608.9,405.3 610.9,403.3 610.9,398.3 606.9,395.3 609.9,389.3 611.9,378.3 612.9,331.3 617.9,312.3 620.9,309.3 623.9,302.3 627.9,299.3 627.9,297.3 669.9,257.3 669.9,255.3 673.9,252.3 673.9,250.3 675.9,249.3 675.9,247.3 677.9,246.3 677.9,244.3 683.9,236.3 686.9,225.3 685.9,213.3 681.9,205.3 674.9,198.3 651.9,186.3 634.9,183.3 627.9,180.3 608.9,179.3 592.9,176.3 565.9,175.3 550.9,172.3 535.9,165.3 506.9,137.3 506.9,135.3 502.9,132.3 498.9,125.3 496.9,125.3 496.9,123.3 489.9,115.3 483.9,103.3 473.9,90.3 477.9,89.3 484.9,92.3 486.9,91.3 477.9,82.3 475.9,82.3 459.9,70.3 454.9,69.3 448.9,62.3 439.9,57.3 438.9,52.3 432.9,47.3 426.9,47.3 423.9,49.3 414.9,47.3 392.9,47.3 343.9,61.3 320.9,61.3 293.9,52.3 285.9,48.3 283.9,45.3 255.9,32.3 254.9,30.3 245.9,27.3 237.9,22.3 224.9,18.3 222.9,16.3 197.9,9.3 180.9,8.3 168.9,10.3 168.9,12.3 158.9,16.3 150.9,25.3 146.9,34.3 144.9,45.3ZM368.9,171.3 378.9,171.3 391.9,176.3 376.9,175.3 357.9,177.3 360.9,174.3ZM424.9,179.3 435.9,180.3 443.9,184.3 453.9,195.3 453.9,197.3 461.9,203.3 461.9,205.3 470.9,210.3 481.9,221.3 481.9,223.3 487.9,229.3 487.9,232.3 502.9,246.3 502.9,248.3 505.9,250.3 508.9,256.3 508.9,273.3 497.9,295.3 495.9,318.3 490.9,323.3 462.9,330.3 439.9,329.3 420.9,323.3 408.9,317.3 407.9,315.3 405.9,316.3 404.9,314.3 393.9,308.3 391.9,305.3 389.9,305.3 382.9,298.3 380.9,298.3 377.9,294.3 375.9,294.3 372.9,289.3 370.9,289.3 359.9,279.3 357.9,279.3 356.9,277.3 354.9,278.3 353.9,276.3 347.9,273.3 331.9,272.3 325.9,275.3 319.9,281.3 319.9,283.3 317.9,283.3 316.9,281.3 319.9,271.3 324.9,266.3 324.9,264.3 326.9,264.3 329.9,260.3 337.9,256.3 351.9,254.3 358.9,254.3 378.9,260.3 386.9,265.3 391.9,266.3 396.9,270.3 398.9,269.3 409.9,276.3 412.9,276.3 423.9,281.3 440.9,281.3 448.9,279.3 450.9,278.3 450.9,276.3 454.9,275.3 462.9,267.3 466.9,256.3 466.9,236.3 464.9,227.3 458.9,216.3 458.9,212.3 456.9,212.3 456.9,210.3 451.9,206.3 451.9,204.3 446.9,199.3 444.9,199.3 441.9,195.3 439.9,195.3 434.9,190.3 428.9,188.3 427.9,186.3 415.9,182.3 416.9,180.3ZM200.9,211.3 202.9,215.3 202.9,289.3 200.9,313.3 200.9,340.3 203.9,366.3 213.9,395.3 204.9,383.3 195.9,365.3 193.9,364.3 188.9,354.3 188.9,351.3 186.9,351.3 184.9,347.3 184.9,344.3 181.9,340.3 178.9,331.3 174.9,311.3 174.9,281.3 177.9,264.3 185.9,241.3 188.9,237.3 188.9,234.3ZM332.9,359.3 344.9,365.3 336.9,363.3ZM373.9,373.3 409.9,375.3 398.9,381.3 386.9,381.3 374.9,375.3ZM139.9,375.3 141.9,381.3 144.9,384.3 152.9,386.3 159.9,382.3 161.9,378.3 161.9,371.3 156.9,365.3 147.9,364.3 141.9,368.3ZM190.9,377.3 204.9,391.3 204.9,393.3 207.9,394.3 220.9,407.3 225.9,426.3 225.9,447.3 222.9,445.3 222.9,443.3 214.9,433.3 213.9,429.3 211.9,428.3 201.9,408.3 197.9,395.3 193.9,390.3ZM560.9,473.3 562.9,475.3 566.9,475.3 568.9,473.3 568.9,468.3 565.9,466.3 561.9,467.3ZM363.9,529.3 367.9,532.3 371.9,529.3 371.9,524.3 368.9,522.3 364.9,523.3Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM518.9,-35.7 520.9,-31.7 528.9,-30.7 532.9,-34.7 532.9,-40.7 527.9,-44.7 523.9,-44.7 519.9,-41.7ZM257.9,2.3 260.9,7.3 264.9,9.3 269.9,9.3 275.9,5.3 276.9,-3.7 270.9,-9.7 263.9,-9.7 258.9,-5.7ZM305.9,36.3 332.9,37.3 312.9,41.3 312.9,43.3 284.9,50.3 269.9,55.3 267.9,57.3 261.9,58.3 259.9,60.3 251.9,61.3 229.9,72.3 223.9,77.3 219.9,77.3 211.9,84.3 209.9,84.3 207.9,87.3 205.9,87.3 202.9,91.3 200.9,91.3 196.9,95.3 196.9,97.3 188.9,103.3 188.9,105.3 183.9,109.3 183.9,111.3 176.9,119.3 167.9,136.3 164.9,147.3 150.9,153.3 149.9,156.3 145.9,157.3 136.9,165.3 134.9,165.3 122.9,178.3 114.9,192.3 112.9,199.3 110.9,200.3 106.9,220.3 106.9,244.3 108.9,258.3 114.9,282.3 118.9,289.3 119.9,295.3 121.9,297.3 122.9,303.3 124.9,305.3 124.9,308.3 126.9,310.3 133.9,330.3 137.9,353.3 136.9,371.3 129.9,401.3 126.9,428.3 127.9,435.3 129.9,437.3 129.9,442.3 134.9,454.3 137.9,455.3 140.9,461.3 150.9,470.3 158.9,473.3 159.9,475.3 169.9,480.3 200.9,490.3 200.9,492.3 206.9,493.3 208.9,495.3 223.9,500.3 239.9,504.3 257.9,506.3 260.9,524.3 269.9,540.3 282.9,553.3 293.9,558.3 305.9,560.3 317.9,559.3 317.9,557.3 321.9,557.3 334.9,552.3 335.9,549.3 323.9,536.3 323.9,534.3 310.9,521.3 308.9,521.3 302.9,515.3 290.9,509.3 280.9,507.3 286.9,505.3 295.9,505.3 303.9,503.3 327.9,503.3 336.9,505.3 355.9,514.3 356.9,516.3 360.9,517.3 361.9,519.3 365.9,520.3 366.9,522.3 383.9,531.3 385.9,530.3 387.9,532.3 399.9,536.3 411.9,538.3 431.9,537.3 442.9,534.3 448.9,530.3 474.9,531.3 519.9,527.3 549.9,519.3 571.9,508.3 619.9,519.3 657.9,522.3 676.9,519.3 688.9,513.3 693.9,507.3 696.9,506.3 701.9,495.3 701.9,469.3 698.9,458.3 694.9,453.3 691.9,443.3 686.9,433.3 684.9,432.3 681.9,424.3 679.9,423.3 678.9,419.3 669.9,407.3 668.9,403.3 672.9,399.3 673.9,394.3 675.9,393.3 683.9,377.3 691.9,352.3 695.9,328.3 695.9,316.3 693.9,305.3 694.9,298.3 685.9,268.3 677.9,253.3 678.9,251.3 676.9,250.3 674.9,244.3 671.9,242.3 669.9,237.3 667.9,238.3 672.9,276.3 672.9,291.3 669.9,320.3 665.9,338.3 662.9,342.3 660.9,351.3 653.9,365.3 651.9,373.3 648.9,376.3 647.9,372.3 643.9,368.3 643.9,361.3 645.9,359.3 645.9,349.3 647.9,346.3 650.9,330.3 651.9,309.3 647.9,284.3 642.9,269.3 635.9,256.3 635.9,251.3 638.9,248.3 648.9,218.3 650.9,207.3 652.9,207.3 654.9,199.3 656.9,187.3 656.9,161.3 650.9,141.3 641.9,129.3 640.9,125.3 625.9,113.3 603.9,104.3 578.9,99.3 535.9,96.3 519.9,92.3 510.9,87.3 503.9,80.3 496.9,66.3 494.9,66.3 495.9,63.3 493.9,63.3 492.9,61.3 487.9,44.3 506.9,46.3 525.9,51.3 530.9,51.3 548.9,57.3 552.9,60.3 555.9,60.3 567.9,66.3 568.9,68.3 570.9,67.3 573.9,70.3 575.9,69.3 571.9,65.3 567.9,64.3 564.9,60.3 562.9,60.3 559.9,56.3 557.9,56.3 550.9,50.3 535.9,42.3 532.9,42.3 528.9,39.3 508.9,32.3 482.9,27.3 471.9,-5.7 458.9,-30.7 444.9,-45.7 434.9,-50.7 416.9,-50.7 411.9,-48.7 411.9,-46.7 405.9,-44.7 403.9,-41.7 399.9,-40.7 388.9,-29.7 388.9,-27.7 382.9,-21.7 378.9,-13.7 375.9,-12.7 359.9,18.3 359.9,21.3 331.9,23.3 304.9,28.3 301.9,30.3 297.9,30.3 297.9,32.3 283.9,36.3 271.9,43.3 287.9,39.3 304.9,38.3ZM342.9,57.3 343.9,59.3 341.9,63.3 333.9,67.3 331.9,70.3 327.9,72.3 327.9,74.3 320.9,78.3 311.9,87.3 311.9,91.3 302.9,98.3 303.9,99.3 305.9,97.3 323.9,91.3 324.9,89.3 327.9,90.3 318.9,102.3 318.9,104.3 312.9,110.3 312.9,112.3 308.9,115.3 308.9,117.3 289.9,134.3 263.9,139.3 198.9,139.3 171.9,145.3 176.9,140.3 176.9,138.3 191.9,123.3 193.9,123.3 204.9,113.3 206.9,113.3 213.9,107.3 217.9,106.3 218.9,104.3 224.9,102.3 225.9,100.3 231.9,97.3 235.9,97.3 259.9,85.3 262.9,85.3 255.9,93.3 253.9,93.3 250.9,96.3 250.9,98.3 242.9,105.3 242.9,107.3 238.9,109.3 239.9,111.3 242.9,109.3 249.9,108.3 273.9,96.3 276.9,96.3 281.9,92.3 283.9,93.3 293.9,88.3 294.9,86.3 300.9,84.3 301.9,82.3 305.9,81.3 306.9,79.3 325.9,69.3 326.9,66.3 341.9,59.3ZM395.9,151.3 415.9,152.3 433.9,156.3 436.9,160.3 442.9,162.3 443.9,164.3 449.9,167.3 452.9,166.3 466.9,169.3 467.9,171.3 475.9,175.3 478.9,179.3 480.9,179.3 486.9,186.3 489.9,187.3 489.9,189.3 496.9,195.3 496.9,197.3 503.9,204.3 503.9,206.3 507.9,210.3 510.9,219.3 513.9,222.3 514.9,229.3 519.9,240.3 519.9,245.3 523.9,259.3 524.9,282.3 520.9,297.3 515.9,306.3 512.9,308.3 512.9,310.3 504.9,318.3 492.9,323.3 489.9,326.3 473.9,331.3 469.9,330.3 462.9,332.3 447.9,332.3 446.9,330.3 439.9,330.3 421.9,324.3 417.9,320.3 405.9,315.3 404.9,313.3 396.9,309.3 392.9,304.3 390.9,304.3 387.9,300.3 381.9,297.3 367.9,284.3 365.9,284.3 359.9,278.3 353.9,276.3 352.9,274.3 346.9,271.3 331.9,270.3 325.9,273.3 320.9,279.3 320.9,281.3 318.9,281.3 317.9,279.3 317.9,274.3 321.9,266.3 324.9,264.3 324.9,262.3 326.9,262.3 332.9,256.3 341.9,253.3 357.9,253.3 377.9,259.3 397.9,269.3 399.9,272.3 405.9,274.3 406.9,276.3 419.9,281.3 444.9,282.3 453.9,278.3 461.9,270.3 464.9,263.3 465.9,239.3 462.9,227.3 456.9,215.3 449.9,208.3 449.9,206.3 435.9,194.3 421.9,186.3 404.9,180.3 378.9,176.3 358.9,178.3 353.9,177.3 345.9,179.3 324.9,188.3 323.9,190.3 317.9,192.3 314.9,196.3 312.9,196.3 298.9,214.3 291.9,228.3 287.9,241.3 288.9,244.3 285.9,257.3 284.9,278.3 286.9,293.3 288.9,294.3 288.9,299.3 293.9,310.3 293.9,313.3 297.9,321.3 303.9,328.3 303.9,330.3 306.9,332.3 306.9,334.3 320.9,348.3 322.9,348.3 324.9,351.3 326.9,351.3 334.9,358.3 346.9,364.3 368.9,371.3 379.9,372.3 381.9,374.3 417.9,374.3 420.9,377.3 422.9,377.3 422.9,379.3 424.9,380.3 424.9,389.3 422.9,393.3 413.9,400.3 401.9,403.3 380.9,401.3 359.9,396.3 355.9,393.3 350.9,392.3 350.9,390.3 338.9,385.3 337.9,383.3 326.9,377.3 319.9,362.3 298.9,339.3 288.9,319.3 286.9,318.3 280.9,307.3 277.9,305.3 274.9,286.3 274.9,264.3 280.9,232.3 291.9,209.3 297.9,202.3 300.9,195.3 308.9,188.3 308.9,186.3 310.9,184.3 313.9,184.3 318.9,178.3 327.9,173.3 329.9,170.3 342.9,163.3 344.9,164.3 350.9,162.3 372.9,161.3 385.9,157.3ZM98.9,236.3 98.9,230.3 93.9,226.3 88.9,226.3 83.9,231.3 83.9,238.3 88.9,242.3 94.9,242.3 95.9,240.3 97.9,240.3ZM733.9,391.3 734.9,384.3 731.9,380.3 727.9,378.3 720.9,379.3 716.9,385.3 716.9,392.3 721.9,397.3 729.9,397.3 733.9,393.3ZM231.9,541.3 234.9,544.3 240.9,544.3 242.9,541.3 242.9,536.3 239.9,533.3 234.9,532.3 231.9,535.3ZM353.9,541.3 358.9,547.3 369.9,547.3 374.9,541.3 374.9,533.3 369.9,527.3 358.9,527.3 353.9,533.3ZM442.9,589.3 442.9,581.3 437.9,577.3 431.9,577.3 427.9,579.3 427.9,581.3 425.9,582.3 425.9,590.3 430.9,595.3 438.9,595.3 442.9,591.3Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM437.9,-72.7 470.9,-39.7 472.9,-39.7 475.9,-35.7 484.9,-30.7 484.9,-28.7 486.9,-28.7 487.9,-26.7 501.9,-19.7 525.9,-13.7 552.9,-13.7 557.9,-15.7 552.9,-32.7 550.9,-36.7 548.9,-36.7 545.9,-44.7 543.9,-45.7 539.9,-53.7 536.9,-55.7 536.9,-57.7 524.9,-69.7 522.9,-69.7 520.9,-72.7 510.9,-77.7 510.9,-79.7 506.9,-81.7 485.9,-86.7 467.9,-85.7 450.9,-80.7ZM317.9,-62.7 322.9,-57.7 330.9,-57.7 335.9,-62.7 335.9,-69.7 329.9,-75.7 321.9,-74.7 317.9,-69.7ZM587.9,-52.7 588.9,-53.7 586.9,-56.7 581.9,-56.7 579.9,-54.7 581.9,-48.7 587.9,-49.7ZM319.9,44.3 373.9,46.3 377.9,49.3 404.9,53.3 404.9,55.3 442.9,57.3 447.9,59.3 444.9,60.3 439.9,66.3 437.9,66.3 433.9,71.3 431.9,71.3 427.9,76.3 425.9,76.3 422.9,80.3 420.9,80.3 413.9,86.3 411.9,85.3 407.9,88.3 399.9,90.3 388.9,90.3 381.9,88.3 378.9,85.3 367.9,80.3 366.9,78.3 352.9,70.3 351.9,67.3 349.9,67.3 339.9,59.3 335.9,58.3 331.9,54.3 325.9,52.3 324.9,49.3 318.9,47.3ZM733.9,63.3 734.9,44.3 732.9,32.3 731.9,29.3 729.9,29.3 729.9,26.3 724.9,16.3 717.9,9.3 717.9,7.3 700.9,-3.7 686.9,-7.7 669.9,-9.7 639.9,-8.7 629.9,-5.7 614.9,-4.7 576.9,2.3 556.9,4.3 551.9,7.3 545.9,7.3 521.9,13.3 505.9,20.3 499.9,20.3 495.9,18.3 489.9,19.3 469.9,15.3 429.9,14.3 403.9,16.3 383.9,20.3 378.9,19.3 373.9,21.3 348.9,18.3 333.9,18.3 318.9,20.3 314.9,22.3 310.9,21.3 294.9,27.3 287.9,27.3 275.9,31.3 242.9,30.3 219.9,35.3 219.9,37.3 207.9,40.3 180.9,53.3 179.9,55.3 170.9,59.3 157.9,69.3 135.9,80.3 134.9,82.3 123.9,88.3 114.9,97.3 113.9,83.3 105.9,87.3 94.9,97.3 94.9,99.3 87.9,106.3 77.9,124.3 76.9,129.3 72.9,133.3 70.9,133.3 66.9,138.3 64.9,138.3 47.9,155.3 47.9,157.3 43.9,160.3 43.9,162.3 37.9,169.3 28.9,190.3 25.9,205.3 25.9,215.3 23.9,219.3 24.9,274.3 22.9,293.3 22.9,313.3 28.9,339.3 33.9,348.3 35.9,349.3 35.9,351.3 47.9,363.3 47.9,365.3 60.9,375.3 64.9,376.3 65.9,378.3 88.9,389.3 95.9,390.3 97.9,391.3 97.9,393.3 100.9,392.3 100.9,394.3 103.9,393.3 103.9,395.3 106.9,394.3 118.9,399.3 126.9,400.3 154.9,410.3 158.9,410.3 180.9,422.3 188.9,430.3 198.9,449.3 198.9,455.3 201.9,461.3 201.9,465.3 209.9,489.3 211.9,491.3 211.9,496.3 217.9,506.3 215.9,507.3 203.9,496.3 201.9,497.3 216.9,527.3 224.9,536.3 224.9,538.3 228.9,540.3 229.9,543.3 245.9,558.3 247.9,558.3 250.9,562.3 260.9,567.3 261.9,569.3 277.9,577.3 307.9,585.3 313.9,584.3 325.9,586.3 341.9,586.3 364.9,584.3 375.9,589.3 382.9,590.3 406.9,599.3 412.9,599.3 428.9,605.3 461.9,612.3 499.9,611.3 520.9,606.3 550.9,596.3 586.9,589.3 590.9,587.3 594.9,588.3 607.9,584.3 621.9,577.3 634.9,564.3 640.9,553.3 644.9,539.3 644.9,500.3 639.9,476.3 640.9,471.3 634.9,443.3 634.9,425.3 640.9,409.3 645.9,405.3 646.9,402.3 648.9,402.3 652.9,397.3 657.9,395.3 659.9,392.3 663.9,391.3 664.9,389.3 666.9,390.3 667.9,388.3 674.9,385.3 672.9,392.3 670.9,393.3 670.9,396.3 666.9,403.3 665.9,409.3 663.9,411.3 654.9,439.3 651.9,455.3 655.9,454.3 687.9,436.3 693.9,430.3 701.9,426.3 715.9,412.3 715.9,410.3 720.9,406.3 720.9,404.3 723.9,403.3 723.9,401.3 729.9,394.3 731.9,388.3 733.9,387.3 743.9,361.3 746.9,343.3 747.9,324.3 745.9,315.3 748.9,301.3 747.9,275.3 740.9,251.3 725.9,221.3 724.9,214.3 718.9,202.3 713.9,181.3 713.9,159.3 715.9,146.3 730.9,89.3 733.9,72.3ZM394.9,150.3 424.9,152.3 445.9,158.3 467.9,169.3 479.9,180.3 481.9,180.3 487.9,187.3 489.9,187.3 490.9,191.3 503.9,205.3 510.9,219.3 513.9,222.3 513.9,225.3 520.9,239.3 525.9,265.3 525.9,280.3 521.9,293.3 516.9,302.3 513.9,304.3 513.9,306.3 505.9,314.3 493.9,320.3 490.9,324.3 486.9,324.3 484.9,326.3 469.9,330.3 446.9,331.3 434.9,329.3 419.9,324.3 403.9,316.3 402.9,314.3 391.9,308.3 389.9,305.3 387.9,305.3 380.9,298.3 378.9,298.3 375.9,294.3 373.9,294.3 372.9,291.3 368.9,289.3 365.9,285.3 363.9,285.3 357.9,279.3 355.9,279.3 354.9,277.3 345.9,272.3 330.9,271.3 324.9,274.3 319.9,279.3 319.9,282.3 317.9,282.3 316.9,280.3 316.9,275.3 320.9,267.3 323.9,265.3 323.9,263.3 325.9,263.3 331.9,257.3 340.9,254.3 356.9,254.3 376.9,260.3 384.9,265.3 389.9,266.3 390.9,268.3 403.9,274.3 406.9,277.3 421.9,282.3 438.9,282.3 452.9,277.3 461.9,269.3 463.9,265.3 465.9,258.3 465.9,238.3 461.9,226.3 462.9,224.3 457.9,214.3 445.9,200.3 443.9,200.3 433.9,191.3 417.9,183.3 397.9,177.3 375.9,175.3 359.9,176.3 334.9,183.3 321.9,190.3 304.9,205.3 304.9,207.3 297.9,215.3 290.9,229.3 287.9,238.3 287.9,245.3 284.9,258.3 285.9,290.3 287.9,300.3 289.9,305.3 291.9,306.3 293.9,314.3 297.9,322.3 303.9,329.3 303.9,331.3 319.9,349.3 321.9,349.3 323.9,352.3 325.9,352.3 333.9,359.3 345.9,365.3 372.9,373.3 415.9,374.3 418.9,377.3 420.9,377.3 420.9,379.3 423.9,381.3 423.9,388.3 421.9,392.3 412.9,399.3 400.9,402.3 374.9,400.3 351.9,393.3 337.9,386.3 333.9,382.3 329.9,381.3 308.9,363.3 307.9,359.3 302.9,355.3 302.9,353.3 299.9,351.3 299.9,349.3 293.9,342.3 283.9,322.3 278.9,306.3 278.9,301.3 276.9,301.3 275.9,296.3 273.9,269.3 275.9,251.3 278.9,243.3 277.9,239.3 281.9,231.3 281.9,228.3 284.9,224.3 284.9,221.3 288.9,216.3 290.9,209.3 295.9,203.3 295.9,201.3 307.9,189.3 307.9,187.3 310.9,184.3 312.9,184.3 314.9,181.3 316.9,181.3 318.9,178.3 320.9,178.3 322.9,175.3 327.9,173.3 332.9,168.3 348.9,160.3 375.9,152.3ZM779.9,327.3 784.9,334.3 794.9,334.3 798.9,329.3 797.9,318.3 793.9,315.3 785.9,315.3 785.9,317.3 781.9,319.3ZM67.9,385.3 75.9,416.3 89.9,443.3 92.9,444.3 92.9,446.3 100.9,455.3 100.9,457.3 114.9,471.3 114.9,473.3 118.9,477.3 120.9,477.3 129.9,487.3 131.9,487.3 139.9,495.3 141.9,495.3 146.9,500.3 148.9,500.3 149.9,502.3 158.9,507.3 155.9,497.3 149.9,486.3 149.9,481.3 141.9,466.3 139.9,465.3 138.9,461.3 136.9,460.3 132.9,452.3 129.9,451.3 126.9,445.3 123.9,442.3 121.9,442.3 121.9,440.3 116.9,436.3 116.9,434.3 103.9,421.3 103.9,419.3 107.9,416.3 106.9,407.3 103.9,405.3 96.9,405.3 91.9,410.3 91.9,408.3 74.9,392.3 74.9,390.3 68.9,384.3ZM649.9,579.3 651.9,587.3 657.9,591.3 665.9,589.3 668.9,585.3 668.9,577.3 666.9,576.3 666.9,574.3 663.9,574.3 662.9,572.3 654.9,572.3 650.9,575.3ZM532.9,671.3 533.9,667.3 530.9,664.3 526.9,664.3 524.9,666.3 525.9,673.3 530.9,674.3Z",
    "M-602.1,-713.7 1397.9,-713.7 1397.9,1286.3 -602.1,1286.3ZM1165.9,-372.7 1166.9,-375.7 1160.9,-397.7 1151.9,-413.7 1137.9,-428.7 1135.9,-428.7 1133.9,-431.7 1119.9,-439.7 1115.9,-439.7 1113.9,-441.7 1097.9,-446.7 1067.9,-450.7 1032.9,-450.7 1006.9,-446.7 1001.9,-444.7 997.9,-445.7 965.9,-437.7 959.9,-434.7 955.9,-434.7 916.9,-421.7 914.9,-419.7 900.9,-415.7 893.9,-411.7 885.9,-410.7 876.9,-405.7 861.9,-400.7 851.9,-394.7 841.9,-391.7 835.9,-387.7 832.9,-387.7 826.9,-383.7 823.9,-383.7 793.9,-368.7 790.9,-368.7 777.9,-361.7 774.9,-361.7 771.9,-358.7 756.9,-353.7 754.9,-350.7 751.9,-350.7 739.9,-344.7 732.9,-343.7 730.9,-341.7 724.9,-340.7 722.9,-338.7 701.9,-331.7 687.9,-328.7 686.9,-326.7 680.9,-324.7 647.9,-317.7 634.9,-316.7 627.9,-313.7 577.9,-308.7 575.9,-306.7 544.9,-302.7 525.9,-297.7 505.9,-294.7 475.9,-284.7 473.9,-282.7 470.9,-283.7 449.9,-273.7 445.9,-273.7 435.9,-267.7 426.9,-265.7 393.9,-248.7 390.9,-248.7 386.9,-246.7 384.9,-243.7 381.9,-243.7 377.9,-240.7 371.9,-239.7 366.9,-236.7 335.9,-235.7 295.9,-230.7 260.9,-240.7 258.9,-242.7 244.9,-246.7 242.9,-248.7 226.9,-253.7 219.9,-257.7 213.9,-258.7 211.9,-260.7 199.9,-263.7 191.9,-267.7 177.9,-270.7 175.9,-272.7 145.9,-278.7 136.9,-277.7 136.9,-279.7 104.9,-279.7 104.9,-277.7 96.9,-278.7 84.9,-276.7 53.9,-267.7 51.9,-265.7 33.9,-259.7 29.9,-256.7 19.9,-254.7 11.9,-249.7 7.9,-249.7 1.9,-245.7 -8.1,-242.7 -14.1,-238.7 -24.1,-235.7 -44.1,-225.7 -47.1,-225.7 -93.1,-202.7 -101.1,-195.7 -103.1,-195.7 -105.1,-192.7 -107.1,-192.7 -121.1,-179.7 -121.1,-177.7 -126.1,-173.7 -126.1,-171.7 -133.1,-163.7 -143.1,-141.7 -142.1,-137.7 -146.1,-121.7 -145.1,-81.7 -138.1,-47.7 -127.1,-14.7 -125.1,-12.7 -119.1,5.3 -116.1,9.3 -116.1,12.3 -113.1,16.3 -113.1,19.3 -110.1,23.3 -110.1,26.3 -106.1,32.3 -106.1,35.3 -93.1,61.3 -93.1,64.3 -90.1,68.3 -90.1,71.3 -88.1,73.3 -88.1,76.3 -86.1,78.3 -86.1,81.3 -84.1,83.3 -84.1,86.3 -79.1,97.3 -71.1,132.3 -71.1,156.3 -74.1,172.3 -80.1,187.3 -80.1,191.3 -89.1,208.3 -88.1,210.3 -100.1,234.3 -102.1,235.3 -105.1,241.3 -105.1,244.3 -110.1,252.3 -109.1,254.3 -117.1,268.3 -117.1,271.3 -121.1,277.3 -121.1,280.3 -128.1,294.3 -135.1,315.3 -138.1,332.3 -140.1,332.3 -143.1,361.3 -151.1,360.3 -158.1,367.3 -158.1,374.3 -154.1,380.3 -149.1,382.3 -142.1,381.3 -141.1,393.3 -136.1,411.3 -135.1,421.3 -133.1,423.3 -128.1,439.3 -124.1,445.3 -125.1,448.3 -121.1,453.3 -107.1,481.3 -107.1,486.3 -104.1,490.3 -97.1,510.3 -94.1,528.3 -94.1,544.3 -98.1,570.3 -107.1,600.3 -113.1,613.3 -112.1,616.3 -117.1,625.3 -122.1,640.3 -126.1,646.3 -126.1,649.3 -129.1,653.3 -132.1,665.3 -145.1,691.3 -145.1,696.3 -152.1,709.3 -155.1,720.3 -164.1,738.3 -164.1,741.3 -169.1,750.3 -173.1,763.3 -176.1,765.3 -179.1,777.3 -181.1,779.3 -183.1,788.3 -189.1,801.3 -195.1,819.3 -195.1,823.3 -199.1,832.3 -201.1,843.3 -203.1,846.3 -203.1,851.3 -209.1,871.3 -215.1,903.3 -218.1,930.3 -218.1,969.3 -214.1,996.3 -208.1,1015.3 -199.1,1034.3 -197.1,1035.3 -196.1,1039.3 -191.1,1044.3 -191.1,1046.3 -176.1,1061.3 -174.1,1061.3 -171.1,1065.3 -169.1,1065.3 -161.1,1072.3 -141.1,1082.3 -137.1,1082.3 -118.1,1089.3 -103.1,1091.3 -102.1,1093.3 -88.1,1095.3 -18.1,1095.3 18.9,1091.3 23.9,1090.3 25.9,1088.3 69.9,1082.3 79.9,1078.3 112.9,1072.3 132.9,1067.3 135.9,1065.3 139.9,1065.3 142.9,1063.3 146.9,1063.3 179.9,1052.3 181.9,1050.3 199.9,1044.3 203.9,1041.3 206.9,1041.3 212.9,1037.3 215.9,1037.3 225.9,1032.3 226.9,1030.3 240.9,1024.3 241.9,1022.3 251.9,1018.3 252.9,1016.3 258.9,1014.3 268.9,1006.3 272.9,1006.3 276.9,1002.3 280.9,1001.3 281.9,999.3 283.9,999.3 284.9,997.3 286.9,997.3 287.9,995.3 289.9,995.3 290.9,993.3 292.9,993.3 293.9,991.3 295.9,991.3 296.9,989.3 298.9,989.3 299.9,987.3 313.9,979.3 315.9,976.3 323.9,972.3 325.9,969.3 333.9,965.3 335.9,962.3 343.9,958.3 345.9,955.3 351.9,953.3 352.9,951.3 354.9,951.3 355.9,949.3 357.9,949.3 373.9,937.3 377.9,936.3 381.9,932.3 398.9,924.3 399.9,922.3 404.9,922.3 410.9,918.3 413.9,918.3 421.9,914.3 448.9,909.3 476.9,909.3 515.9,917.3 549.9,929.3 553.9,929.3 562.9,933.3 566.9,933.3 569.9,935.3 589.9,940.3 594.9,939.3 606.9,942.3 633.9,943.3 635.9,941.3 657.9,938.3 673.9,932.3 675.9,929.3 684.9,925.3 685.9,923.3 693.9,919.3 696.9,915.3 698.9,915.3 717.9,896.3 717.9,894.3 722.9,890.3 725.9,884.3 731.9,879.3 733.9,874.3 736.9,872.3 737.9,868.3 739.9,867.3 744.9,857.3 748.9,853.3 748.9,849.3 750.9,848.3 751.9,844.3 753.9,843.3 755.9,837.3 757.9,836.3 758.9,832.3 760.9,831.3 770.9,812.3 774.9,808.3 775.9,804.3 779.9,801.3 784.9,791.3 786.9,790.3 786.9,787.3 788.9,786.3 794.9,775.3 798.9,772.3 800.9,767.3 803.9,765.3 803.9,763.3 811.9,753.3 812.9,749.3 815.9,745.3 817.9,745.3 818.9,741.3 823.9,735.3 836.9,707.3 842.9,687.3 845.9,663.3 847.9,662.3 847.9,618.3 834.9,522.3 834.9,504.3 837.9,483.3 842.9,468.3 850.9,454.3 850.9,451.3 855.9,445.3 854.9,443.3 856.9,442.3 860.9,434.3 863.9,432.3 863.9,430.3 877.9,416.3 876.9,414.3 886.9,403.3 888.9,397.3 895.9,388.3 904.9,370.3 914.9,340.3 918.9,316.3 918.9,293.3 917.9,286.3 915.9,284.3 915.9,278.3 911.9,261.3 905.9,243.3 902.9,239.3 903.9,236.3 901.9,234.3 901.9,231.3 899.9,229.3 899.9,226.3 897.9,224.3 897.9,221.3 894.9,217.3 887.9,196.3 885.9,194.3 884.9,184.3 881.9,175.3 880.9,152.3 886.9,128.3 890.9,123.3 899.9,103.3 902.9,101.3 907.9,91.3 914.9,83.3 914.9,81.3 921.9,73.3 921.9,71.3 924.9,69.3 926.9,64.3 930.9,61.3 930.9,59.3 939.9,49.3 940.9,45.3 951.9,33.3 951.9,31.3 955.9,28.3 955.9,26.3 959.9,23.3 959.9,21.3 963.9,18.3 963.9,16.3 967.9,13.3 971.9,5.3 984.9,-8.7 988.9,-15.7 993.9,-18.7 993.9,-20.7 997.9,-23.7 1000.9,-29.7 1008.9,-37.7 1008.9,-39.7 1015.9,-46.7 1018.9,-52.7 1022.9,-55.7 1024.9,-59.7 1026.9,-59.7 1026.9,-61.7 1029.9,-63.7 1029.9,-65.7 1032.9,-67.7 1032.9,-69.7 1044.9,-83.7 1046.9,-89.7 1049.9,-91.7 1051.9,-96.7 1054.9,-98.7 1056.9,-104.7 1059.9,-106.7 1063.9,-114.7 1068.9,-119.7 1067.9,-121.7 1085.9,-145.7 1087.9,-152.7 1093.9,-159.7 1094.9,-163.7 1096.9,-164.7 1097.9,-168.7 1099.9,-169.7 1100.9,-173.7 1105.9,-179.7 1107.9,-185.7 1109.9,-186.7 1111.9,-192.7 1113.9,-193.7 1117.9,-203.7 1119.9,-204.7 1133.9,-232.7 1132.9,-235.7 1134.9,-235.7 1133.9,-237.7 1137.9,-243.7 1137.9,-246.7 1140.9,-250.7 1140.9,-253.7 1150.9,-275.7 1157.9,-297.7 1157.9,-301.7 1159.9,-301.7 1166.9,-338.7ZM392.9,150.3 416.9,151.3 416.9,153.3 423.9,153.3 444.9,159.3 459.9,166.3 462.9,170.3 467.9,171.3 468.9,173.3 476.9,177.3 479.9,181.3 481.9,181.3 487.9,188.3 490.9,189.3 490.9,191.3 495.9,196.3 497.9,196.3 497.9,198.3 501.9,201.3 501.9,203.3 508.9,211.3 519.9,234.3 525.9,258.3 525.9,281.3 521.9,295.3 516.9,304.3 513.9,306.3 513.9,308.3 505.9,316.3 499.9,318.3 498.9,320.3 492.9,322.3 489.9,325.3 469.9,331.3 452.9,333.3 438.9,332.3 419.9,326.3 403.9,318.3 402.9,316.3 391.9,310.3 389.9,307.3 387.9,307.3 380.9,300.3 378.9,300.3 375.9,296.3 373.9,296.3 369.9,291.3 367.9,291.3 356.9,281.3 354.9,281.3 353.9,279.3 344.9,274.3 326.9,273.3 322.9,275.3 316.9,281.3 316.9,283.3 314.9,283.3 313.9,280.3 315.9,273.3 321.9,266.3 321.9,264.3 323.9,264.3 329.9,258.3 332.9,259.3 339.9,256.3 355.9,256.3 375.9,262.3 403.9,276.3 406.9,279.3 421.9,284.3 439.9,283.3 453.9,278.3 461.9,270.3 464.9,263.3 465.9,239.3 462.9,227.3 456.9,215.3 444.9,201.3 442.9,201.3 435.9,194.3 432.9,194.3 431.9,192.3 415.9,184.3 399.9,180.3 395.9,177.3 374.9,175.3 358.9,176.3 334.9,183.3 321.9,190.3 304.9,205.3 304.9,207.3 297.9,215.3 290.9,229.3 289.9,234.3 287.9,235.3 287.9,242.3 285.9,245.3 283.9,258.3 283.9,290.3 290.9,314.3 294.9,322.3 300.9,329.3 300.9,331.3 303.9,333.3 303.9,335.3 317.9,349.3 319.9,349.3 324.9,354.3 328.9,355.3 332.9,359.3 344.9,365.3 362.9,371.3 366.9,371.3 367.9,373.3 372.9,374.3 415.9,375.3 418.9,378.3 420.9,378.3 420.9,380.3 422.9,381.3 422.9,389.3 420.9,393.3 411.9,400.3 399.9,402.3 379.9,401.3 355.9,395.3 336.9,386.3 335.9,384.3 321.9,376.3 316.9,370.3 314.9,370.3 300.9,355.3 295.9,346.3 292.9,345.3 289.9,338.3 287.9,337.3 276.9,310.3 272.9,287.3 272.9,265.3 275.9,246.3 277.9,243.3 276.9,239.3 285.9,217.3 287.9,216.3 287.9,214.3 289.9,214.3 290.9,210.3 292.9,209.3 296.9,201.3 300.9,198.3 300.9,196.3 308.9,189.3 308.9,187.3 311.9,184.3 314.9,183.3 314.9,181.3 318.9,177.3 320.9,177.3 322.9,174.3 327.9,172.3 332.9,167.3 350.9,158.3 362.9,154.3 374.9,151.3 379.9,152.3ZM-142.1,208.3 -141.1,206.3 -143.1,206.3 -144.1,200.3 -150.1,196.3 -158.1,197.3 -162.1,204.3 -161.1,213.3 -154.1,218.3 -145.1,216.3 -142.1,212.3ZM902.9,407.3 908.9,413.3 916.9,413.3 922.9,407.3 922.9,399.3 916.9,393.3 908.9,393.3 902.9,399.3Z",
    "M-475.1,-713.7 -398.1,-713.7 -402.1,-695.7 -401.1,-689.7 -407.1,-662.7 -406.1,-656.7 -422.1,-581.7 -425.1,-577.7 -429.1,-559.7 -432.1,-556.7 -437.1,-538.7 -440.1,-535.7 -446.1,-516.7 -447.1,-514.7 -449.1,-514.7 -449.1,-511.7 -451.1,-510.7 -455.1,-497.7 -466.1,-477.7 -468.1,-470.7 -472.1,-466.7 -477.1,-456.7 -477.1,-452.7 -479.1,-451.7 -482.1,-443.7 -485.1,-441.7 -486.1,-437.7 -491.1,-431.7 -491.1,-427.7 -493.1,-426.7 -494.1,-422.7 -498.1,-418.7 -499.1,-414.7 -501.1,-413.7 -505.1,-405.7 -510.1,-400.7 -511.1,-395.7 -513.1,-394.7 -513.1,-392.7 -515.1,-391.7 -515.1,-389.7 -517.1,-388.7 -525.1,-374.7 -528.1,-372.7 -528.1,-370.7 -530.1,-369.7 -538.1,-355.7 -541.1,-353.7 -547.1,-342.7 -550.1,-340.7 -556.1,-329.7 -559.1,-327.7 -559.1,-325.7 -567.1,-315.7 -567.1,-312.7 -570.1,-310.7 -570.1,-308.7 -572.1,-307.7 -580.1,-293.7 -583.1,-291.7 -583.1,-289.7 -595.1,-273.7 -595.1,-270.7 -597.1,-269.7 -599.1,-264.7 -602.1,-263.7 -602.1,-518.7 -596.1,-526.7 -595.1,-531.7 -585.1,-544.7 -586.1,-546.7 -584.1,-547.7 -581.1,-554.7 -575.1,-561.7 -576.1,-563.7 -570.1,-570.7 -569.1,-574.7 -565.1,-577.7 -565.1,-579.7 -559.1,-586.7 -558.1,-590.7 -550.1,-600.7 -549.1,-604.7 -547.1,-605.7 -545.1,-610.7 -543.1,-610.7 -543.1,-612.7 -539.1,-616.7 -538.1,-620.7 -536.1,-621.7 -530.1,-632.7 -527.1,-633.7 -526.1,-637.7 -524.1,-638.7 -516.1,-652.7 -513.1,-653.7 -510.1,-660.7 -508.1,-661.7 -508.1,-663.7 -496.1,-679.7 -496.1,-682.7 -494.1,-683.7 -494.1,-685.7 -482.1,-701.7 -482.1,-704.7ZM948.9,-713.7 1385.9,-713.7 1386.9,-709.7 1391.9,-704.7 1391.9,-701.7 1394.9,-699.7 1394.9,-697.7 1397.9,-697.7 1397.9,203.3 1394.9,200.3 1392.9,200.3 1385.9,192.3 1383.9,192.3 1373.9,181.3 1368.9,179.3 1340.9,150.3 1340.9,148.3 1337.9,147.3 1331.9,141.3 1331.9,139.3 1325.9,134.3 1325.9,132.3 1320.9,128.3 1320.9,126.3 1311.9,118.3 1311.9,115.3 1302.9,105.3 1300.9,100.3 1296.9,98.3 1296.9,96.3 1290.9,89.3 1289.9,84.3 1281.9,75.3 1280.9,71.3 1278.9,70.3 1276.9,64.3 1274.9,63.3 1269.9,53.3 1269.9,50.3 1266.9,48.3 1259.9,34.3 1259.9,31.3 1253.9,20.3 1253.9,17.3 1249.9,10.3 1247.9,1.3 1245.9,-0.7 1239.9,-18.7 1239.9,-25.7 1237.9,-28.7 1237.9,-32.7 1235.9,-35.7 1234.9,-43.7 1232.9,-46.7 1228.9,-62.7 1228.9,-67.7 1223.9,-84.7 1224.9,-89.7 1217.9,-117.7 1218.9,-122.7 1213.9,-141.7 1213.9,-152.7 1208.9,-170.7 1209.9,-175.7 1207.9,-179.7 1204.9,-198.7 1189.9,-258.7 1187.9,-258.7 1186.9,-266.7 1184.9,-269.7 1182.9,-279.7 1180.9,-280.7 1178.9,-286.7 1176.9,-297.7 1174.9,-297.7 1168.9,-318.7 1165.9,-321.7 1162.9,-334.7 1160.9,-336.7 1158.9,-345.7 1156.9,-347.7 1155.9,-353.7 1153.9,-355.7 1153.9,-358.7 1151.9,-360.7 1143.9,-383.7 1140.9,-387.7 1134.9,-404.7 1130.9,-410.7 1128.9,-419.7 1121.9,-431.7 1119.9,-439.7 1096.9,-485.7 1094.9,-486.7 1081.9,-513.7 1078.9,-515.7 1071.9,-530.7 1069.9,-531.7 1061.9,-549.7 1059.9,-550.7 1058.9,-554.7 1056.9,-555.7 1055.9,-559.7 1053.9,-560.7 1052.9,-564.7 1050.9,-565.7 1049.9,-569.7 1044.9,-575.7 1044.9,-579.7 1040.9,-583.7 1039.9,-587.7 1033.9,-594.7 1032.9,-598.7 1030.9,-599.7 1030.9,-601.7 1028.9,-602.7 1028.9,-604.7 1026.9,-605.7 1026.9,-607.7 1024.9,-608.7 1024.9,-610.7 1022.9,-611.7 1022.9,-613.7 1020.9,-614.7 1020.9,-616.7 1018.9,-617.7 1010.9,-631.7 1007.9,-633.7 1007.9,-635.7 1000.9,-643.7 998.9,-648.7 989.9,-658.7 990.9,-660.7 987.9,-662.7 987.9,-664.7 984.9,-665.7 984.9,-667.7 973.9,-679.7 973.9,-681.7 965.9,-688.7 965.9,-691.7 959.9,-696.7 959.9,-698.7 948.9,-708.7ZM1146.9,-634.7 1148.9,-631.7 1154.9,-630.7 1157.9,-634.7 1157.9,-639.7 1155.9,-641.7 1150.9,-641.7 1147.9,-639.7ZM300.9,-355.7 305.9,-354.7 290.9,-350.7 277.9,-344.7 269.9,-343.7 246.9,-332.7 243.9,-332.7 235.9,-327.7 232.9,-327.7 224.9,-322.7 267.9,-328.7 344.9,-327.7 346.9,-325.7 386.9,-321.7 398.9,-317.7 419.9,-314.7 423.9,-311.7 441.9,-308.7 445.9,-305.7 465.9,-300.7 385.9,-303.7 337.9,-303.7 288.9,-299.7 277.9,-300.7 204.9,-290.7 200.9,-289.7 200.9,-287.7 180.9,-284.7 168.9,-280.7 163.9,-280.7 157.9,-277.7 149.9,-276.7 149.9,-274.7 131.9,-269.7 130.9,-267.7 121.9,-263.7 120.9,-261.7 113.9,-258.7 101.9,-249.7 96.9,-248.7 92.9,-244.7 88.9,-243.7 87.9,-241.7 85.9,-241.7 84.9,-239.7 82.9,-239.7 81.9,-237.7 79.9,-237.7 78.9,-235.7 76.9,-235.7 75.9,-233.7 73.9,-233.7 72.9,-231.7 58.9,-223.7 56.9,-220.7 51.9,-218.7 47.9,-213.7 42.9,-211.7 40.9,-208.7 38.9,-208.7 30.9,-201.7 25.9,-199.7 20.9,-193.7 18.9,-193.7 13.9,-188.7 4.9,-183.7 3.9,-180.7 1.9,-180.7 -8.1,-171.7 -13.1,-169.7 -15.1,-166.7 -18.1,-166.7 -20.1,-163.7 -22.1,-163.7 -24.1,-160.7 -26.1,-160.7 -28.1,-157.7 -34.1,-154.7 -37.1,-150.7 -40.1,-150.7 -42.1,-147.7 -48.1,-144.7 -60.1,-133.7 -64.1,-132.7 -67.1,-128.7 -70.1,-128.7 -77.1,-121.7 -79.1,-121.7 -74.1,-126.7 -74.1,-128.7 -72.1,-128.7 -68.1,-133.7 -66.1,-133.7 -48.1,-153.7 -44.1,-154.7 -33.1,-166.7 -27.1,-169.7 -18.1,-180.7 -16.1,-180.7 -1.1,-195.7 0.9,-195.7 5.9,-201.7 7.9,-201.7 11.9,-206.7 13.9,-206.7 16.9,-209.7 16.9,-211.7 23.9,-215.7 23.9,-217.7 26.9,-220.7 28.9,-220.7 31.9,-224.7 33.9,-224.7 35.9,-227.7 37.9,-227.7 39.9,-230.7 45.9,-233.7 46.9,-236.7 49.9,-239.7 51.9,-239.7 55.9,-244.7 57.9,-244.7 60.9,-248.7 62.9,-248.7 64.9,-251.7 66.9,-251.7 68.9,-254.7 73.9,-256.7 75.9,-259.7 77.9,-259.7 90.9,-269.7 108.9,-278.7 109.9,-280.7 144.9,-296.7 147.9,-300.7 155.9,-303.7 156.9,-305.7 168.9,-311.7 171.9,-311.7 177.9,-314.7 179.9,-317.7 191.9,-321.7 195.9,-324.7 198.9,-324.7 215.9,-332.7 251.9,-344.7ZM609.9,-236.7 619.9,-234.7 629.9,-229.7 633.9,-229.7 635.9,-227.7 644.9,-225.7 692.9,-203.7 693.9,-201.7 709.9,-193.7 722.9,-183.7 724.9,-184.7 726.9,-181.7 728.9,-181.7 738.9,-172.7 740.9,-172.7 743.9,-168.7 745.9,-168.7 748.9,-164.7 741.9,-166.7 728.9,-173.7 726.9,-172.7 720.9,-176.7 717.9,-176.7 663.9,-203.7 662.9,-205.7 652.9,-209.7 651.9,-211.7 646.9,-212.7 641.9,-216.7 635.9,-218.7 629.9,-224.7 623.9,-226.7 622.9,-228.7 613.9,-232.7ZM393.9,149.3 423.9,151.3 444.9,157.3 466.9,168.3 467.9,170.3 475.9,174.3 478.9,178.3 480.9,178.3 486.9,185.3 488.9,185.3 489.9,188.3 496.9,194.3 496.9,196.3 503.9,203.3 510.9,217.3 513.9,220.3 513.9,223.3 516.9,227.3 516.9,230.3 520.9,238.3 520.9,246.3 524.9,265.3 524.9,280.3 518.9,299.3 512.9,306.3 512.9,308.3 504.9,316.3 501.9,317.3 501.9,319.3 484.9,328.3 468.9,332.3 445.9,333.3 432.9,331.3 407.9,321.3 405.9,318.3 401.9,317.3 400.9,315.3 398.9,315.3 398.9,313.3 396.9,313.3 388.9,306.3 386.9,306.3 379.9,299.3 376.9,299.3 362.9,286.3 360.9,286.3 358.9,283.3 352.9,280.3 348.9,275.3 342.9,272.3 327.9,271.3 321.9,274.3 317.9,279.3 315.9,279.3 315.9,281.3 313.9,281.3 312.9,278.3 315.9,270.3 320.9,265.3 320.9,263.3 322.9,263.3 328.9,257.3 333.9,255.3 354.9,255.3 374.9,261.3 382.9,266.3 386.9,266.3 389.9,270.3 403.9,276.3 404.9,278.3 421.9,284.3 438.9,284.3 453.9,279.3 454.9,276.3 461.9,270.3 464.9,263.3 465.9,238.3 462.9,226.3 456.9,214.3 449.9,207.3 449.9,204.3 444.9,199.3 442.9,199.3 432.9,190.3 416.9,182.3 404.9,178.3 400.9,179.3 396.9,177.3 375.9,175.3 354.9,178.3 335.9,184.3 321.9,191.3 319.9,194.3 317.9,194.3 314.9,198.3 312.9,198.3 308.9,203.3 306.9,203.3 303.9,206.3 303.9,208.3 296.9,216.3 294.9,222.3 289.9,227.3 283.9,245.3 280.9,278.3 283.9,299.3 285.9,301.3 286.9,307.3 289.9,310.3 293.9,320.3 297.9,324.3 297.9,327.3 302.9,332.3 302.9,334.3 316.9,348.3 318.9,348.3 320.9,351.3 322.9,351.3 330.9,358.3 352.9,368.3 359.9,369.3 363.9,372.3 376.9,374.3 412.9,374.3 415.9,377.3 417.9,377.3 417.9,379.3 419.9,380.3 419.9,388.3 417.9,392.3 408.9,399.3 396.9,402.3 370.9,399.3 353.9,394.3 336.9,386.3 334.9,383.3 327.9,380.3 325.9,377.3 320.9,375.3 315.9,369.3 313.9,369.3 299.9,354.3 299.9,351.3 296.9,349.3 292.9,341.3 286.9,335.3 275.9,308.3 273.9,294.3 270.9,286.3 270.9,264.3 275.9,239.3 282.9,222.3 284.9,222.3 285.9,218.3 287.9,217.3 289.9,211.3 291.9,210.3 295.9,202.3 298.9,199.3 300.9,199.3 300.9,197.3 306.9,191.3 308.9,191.3 308.9,189.3 311.9,186.3 313.9,186.3 315.9,183.3 321.9,180.3 326.9,174.3 328.9,174.3 333.9,169.3 351.9,160.3 355.9,160.3 357.9,159.3 357.9,157.3ZM-181.1,298.3 -180.1,302.3 -177.1,305.3 -174.1,322.3 -172.1,322.3 -169.1,341.3 -167.1,342.3 -164.1,368.3 -162.1,369.3 -160.1,392.3 -161.1,444.3 -163.1,443.3 -163.1,438.3 -165.1,436.3 -165.1,433.3 -167.1,431.3 -168.1,425.3 -172.1,417.3 -179.1,387.3 -180.1,373.3 -182.1,372.3 -182.1,359.3 -184.1,349.3 -184.1,321.3 -182.1,312.3 -183.1,305.3ZM-41.1,693.3 -30.1,704.3 -28.1,704.3 -15.1,718.3 -13.1,718.3 -5.1,727.3 -3.1,727.3 10.9,742.3 12.9,742.3 16.9,747.3 18.9,747.3 34.9,762.3 36.9,762.3 39.9,766.3 41.9,766.3 48.9,773.3 50.9,773.3 52.9,777.3 54.9,777.3 64.9,786.3 70.9,788.3 72.9,791.3 77.9,793.3 79.9,797.3 88.9,801.3 108.9,816.3 112.9,817.3 121.9,824.3 133.9,829.3 134.9,831.3 140.9,833.3 141.9,835.3 149.9,838.3 150.9,840.3 158.9,844.3 162.9,844.3 182.9,854.3 183.9,856.3 188.9,856.3 208.9,866.3 213.9,866.3 225.9,872.3 256.9,882.3 261.9,885.3 223.9,884.3 201.9,881.3 187.9,877.3 178.9,877.3 155.9,869.3 149.9,869.3 128.9,859.3 119.9,857.3 105.9,850.3 104.9,848.3 92.9,843.3 91.9,840.3 87.9,839.3 74.9,829.3 71.9,829.3 69.9,826.3 64.9,824.3 62.9,820.3 60.9,820.3 57.9,816.3 53.9,815.3 50.9,811.3 48.9,811.3 43.9,805.3 41.9,805.3 38.9,802.3 38.9,800.3 29.9,791.3 27.9,791.3 11.9,775.3 9.9,770.3 -2.1,757.3 -2.1,755.3 -5.1,753.3 -5.1,751.3 -8.1,749.3 -8.1,747.3 -11.1,745.3 -11.1,743.3 -23.1,727.3 -24.1,723.3 -26.1,722.3 -30.1,713.3 -32.1,712.3 -34.1,706.3 -36.1,705.3ZM698.9,740.3 700.9,742.3 695.9,747.3 695.9,749.3 692.9,750.3 692.9,752.3 686.9,758.3 685.9,762.3 674.9,772.3 674.9,774.3 669.9,779.3 666.9,780.3 666.9,782.3 659.9,789.3 657.9,789.3 653.9,794.3 643.9,799.3 641.9,802.3 639.9,802.3 632.9,808.3 614.9,817.3 609.9,822.3 606.9,822.3 593.9,829.3 571.9,835.3 571.9,837.3 555.9,841.3 536.9,844.3 499.9,845.3 525.9,832.3 526.9,830.3 530.9,829.3 530.9,827.3 554.9,815.3 554.9,813.3 560.9,811.3 561.9,809.3 569.9,805.3 572.9,805.3 573.9,803.3 583.9,799.3 584.9,797.3 594.9,793.3 595.9,791.3 605.9,787.3 606.9,785.3 620.9,779.3 621.9,777.3 641.9,768.3 646.9,764.3 650.9,764.3 688.9,744.3 695.9,743.3ZM-602.1,815.3 -599.1,815.3 -596.1,822.3 -594.1,823.3 -577.1,857.3 -577.1,862.3 -575.1,864.3 -565.1,898.3 -565.1,909.3 -561.1,930.3 -561.1,942.3 -559.1,947.3 -558.1,986.3 -560.1,1029.3 -565.1,1086.3 -568.1,1096.3 -573.1,1163.3 -577.1,1158.3 -578.1,1154.3 -580.1,1153.3 -580.1,1151.3 -582.1,1150.3 -583.1,1146.3 -585.1,1145.3 -586.1,1141.3 -588.1,1140.3 -589.1,1136.3 -591.1,1135.3 -592.1,1131.3 -596.1,1127.3 -600.1,1118.3 -602.1,1117.3ZM1396.9,1028.3 1396.9,1136.3 1385.9,1148.3 1382.9,1155.3 1366.9,1173.3 1366.9,1176.3 1361.9,1180.3 1361.9,1182.3 1352.9,1191.3 1352.9,1193.3 1346.9,1197.3 1346.9,1199.3 1333.9,1212.3 1333.9,1214.3 1331.9,1214.3 1325.9,1220.3 1325.9,1222.3 1317.9,1229.3 1317.9,1231.3 1315.9,1231.3 1311.9,1236.3 1309.9,1236.3 1305.9,1240.3 1305.9,1242.3 1289.9,1258.3 1287.9,1258.3 1287.9,1260.3 1266.9,1280.3 1266.9,1282.3 1262.9,1284.3 1262.9,1286.3 1066.9,1286.3 1068.9,1280.3 1070.9,1280.3 1073.9,1276.3 1075.9,1276.3 1082.9,1269.3 1084.9,1269.3 1088.9,1264.3 1090.9,1264.3 1105.9,1250.3 1107.9,1250.3 1115.9,1241.3 1119.9,1240.3 1125.9,1233.3 1127.9,1233.3 1133.9,1226.3 1135.9,1226.3 1141.9,1218.3 1143.9,1218.3 1151.9,1209.3 1153.9,1209.3 1161.9,1199.3 1163.9,1199.3 1167.9,1194.3 1169.9,1194.3 1197.9,1166.3 1202.9,1164.3 1221.9,1145.3 1223.9,1145.3 1225.9,1142.3 1228.9,1142.3 1236.9,1133.3 1238.9,1133.3 1244.9,1126.3 1247.9,1126.3 1265.9,1109.3 1268.9,1109.3 1276.9,1101.3 1282.9,1098.3 1282.9,1096.3 1285.9,1093.3 1287.9,1093.3 1300.9,1082.3 1305.9,1080.3 1306.9,1077.3 1308.9,1077.3 1324.9,1065.3 1328.9,1064.3 1329.9,1062.3 1333.9,1061.3 1334.9,1059.3Z"
  ] };

  const FBF_CONTROLS = (over = {}) => [
    { key: "duration", label: "Duration",  type: "range",  min: 900, max: 4500, step: 45, def: 1800, unit: "ms" },
    { key: "ink",      label: "Ink",       type: "select", options: ["tan on purple", "purple on tan"], def: "tan on purple" },
    { key: "fit",      label: "Fit",       type: "select", options: ["extend", "letterbox", "fill (crop)"], def: "extend" },
    { key: "mark",     label: "Mark size", type: "range",  min: 20, max: 60, step: 2, def: 42, unit: "% of frame" },
    { key: "buttons",  label: "Then login buttons", type: "toggle", def: true },
    { key: "reduced",  label: "Reduced-motion fallback", type: "toggle", def: false },
  ].map((c) => ({ ...c, ...(over[c.key] || {}) }));

  // "extend": points on the drawing's left/right/bottom edge are pushed far outside, so the pool and the splash
  // run to the edges of any wider or taller viewport while the drawings themselves are never stretched.
  function extendFrames(F) {
    if (F.wide) return F.wide;
    const X = F.w * 5, Y = F.h * 5;
    return (F.wide = F.frames.map((d, i) => i >= (F.extendUntil ?? F.frames.length) ? d : d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (m, x, y) => {
      x = +x; y = +y;
      if (x <= 0.5) x = -X; else if (x >= F.w - 0.5) x = F.w + X;
      if (y >= F.h - 0.5) y = F.h + Y;
      return `${x},${y}`;
    })));
  }
  function fbfEntry(cfg) {
    const F = cfg.data;
    return {
      id: cfg.id, name: cfg.name, blurb: cfg.blurb,
      controls: FBF_CONTROLS(cfg.defaults || {}),
      rest(A, B, v, dir) {
        A.style.display = "none";
        const [ink, ground] = LOGO_INKS[v.ink], { W, H } = stageSize(B);
        const ms = F.h * v.mark / 100, mx = F.w * F.swirl[0] - ms / 2, my = F.h * F.swirl[1] - ms / 2;
        // extend: a viewBox in the stage's aspect around the drawing; extra width splits evenly, extra height goes 30/70 top/bottom
        const a = W / H, vw = a > F.w / F.h ? F.h * a : F.w, vh = a > F.w / F.h ? F.h : F.w / a;
        const frames = v.fit === "extend" ? extendFrames(F) : F.frames;
        const vb = v.fit === "extend" ? `${((F.w - vw) / 2).toFixed(1)} ${(-(vh - F.h) * 0.3).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}` : `0 0 ${F.w} ${F.h}`;
        this._frames = frames;
        B.style.cssText += `;background:${ground};`;
        B.innerHTML =
          `<svg id="fbf" viewBox="${vb}" preserveAspectRatio="xMidYMid ${v.fit === "fill (crop)" ? "slice" : "meet"}" style="position:absolute;inset:0;width:${W}px;height:${H}px;">
             <path id="fr" fill="${ink}" fill-rule="evenodd" d="${dir === 1 ? frames[0] : ""}"/>
             <g id="mark" opacity="${dir === 1 ? 0 : 1}" transform="translate(${mx} ${my}) scale(${ms / 100})"><path d="${SWIRL_D}" fill="${ink}"/></g>
           </svg>
           <div id="btns" style="position:absolute;left:50%;top:${Math.round(H * 0.74)}px;transform:translateX(-50%);display:flex;gap:10px;opacity:${dir === 1 || !v.buttons ? 0 : 1};">
             <div style="padding:9px 22px;border-radius:999px;background:${ink};color:${ground};font-weight:700;font-size:12px;">Log in</div>
             <div style="padding:9px 22px;border-radius:999px;border:1.5px solid ${ink};color:${ink};font-weight:700;font-size:12px;">Sign up</div>
           </div>`;
      },
      async apply(A, B, dir, v) {
        const run = this._run = Symbol(), alive = () => this._run === run;
        const fr = B.querySelector("#fr"), mark = B.querySelector("#mark"), btns = B.querySelector("#btns");
        const btnIn = () => v.buttons && btns.animate({ opacity: [0, 1], transform: ["translate(-50%, 14px)", "translate(-50%, 0)"] }, { duration: 320, easing: EASINGS["ease-out-quint"], fill: "forwards" });
        if (v.reduced) { mark.animate({ opacity: dir === 1 ? [0, 1] : [1, 0] }, { duration: 350, fill: "forwards" }); if (v.buttons) btns.animate({ opacity: dir === 1 ? [0, 1] : [1, 0] }, { duration: 350, delay: 200, fill: "forwards" }); fr.setAttribute("d", ""); return; }
        const frames = this._frames || F.frames, n = frames.length, hold = v.duration / n;
        // step through the drawings: frame k shows from k·hold to (k+1)·hold, no tweening
        const play = (order) => new Promise((res) => { const t0 = performance.now(); let shown = -1;
          const tick = (now) => { if (!alive()) return res(); const k = Math.min(n - 1, Math.floor((now - t0) / hold));
            if (k !== shown) { shown = k; fr.setAttribute("d", frames[order(k)]); }
            if ((now - t0) < v.duration) requestAnimationFrame(tick); else res(); };
          requestAnimationFrame(tick); });
        if (dir === 1) {
          await play((k) => k); if (!alive()) return;
          fr.setAttribute("d", ""); mark.setAttribute("opacity", 1); btnIn();   // next tick: the mark, then the buttons
        } else {
          if (v.buttons) btns.animate({ opacity: [1, 0] }, { duration: 160, fill: "forwards" });
          mark.setAttribute("opacity", 0);
          await play((k) => n - 1 - k); if (!alive()) return;
          fr.setAttribute("d", "");
        }
      },
      snippet(v) {
        return (
  `// Frame-by-frame splash (${cfg.name}) — ${F.frames.length} drawings, one evenodd <path> each, stepped every ${(v.duration / F.frames.length).toFixed(0)}ms.
  // Nothing is tweened: the drop, the pool, the crown, the inverted drop and the vortex are all separate drawings.
  // Ink: "${v.ink}" → the drawings paint ${LOGO_INKS[v.ink][0]} on a ${LOGO_INKS[v.ink][1]} ground; the final mark is the ink colour.
  // Fit: "${v.fit}" on a ${F.w}×${F.h} drawing box${v.fit === "extend" ? " — edge points pushed far outside so the pool/splash reach any viewport edge; viewBox in the screen's aspect, extra height 30/70 top/bottom" : ""}.
  //
  // Port: ship frames as JSON (string[] of path data, ~${Math.round(F.frames.reduce((s, f) => s + f.length, 0) / 1024)} KB) + this 15-line stepper, or load the same
  // drawings as a Lottie shape layer with hold keyframes. Reduced motion: fade the mark in (350ms), buttons after 200ms.
  const hold = ${(v.duration / F.frames.length).toFixed(1)};
  function play(pathEl, frames, onDone) {
    const t0 = performance.now(); let shown = -1;
    const tick = (now) => { const k = Math.min(frames.length - 1, Math.floor((now - t0) / hold));
      if (k !== shown) { shown = k; pathEl.setAttribute("d", frames[k]); }
      if (k < frames.length - 1) requestAnimationFrame(tick); else onDone(); };
    requestAnimationFrame(tick);
  }
  // Replace the drawings with Jeremy's own (black ink on alpha, 12fps, last frame traced over the Logomark):
  // trace each PNG → evenodd path with the same tool, drop them into \`frames\`, nothing else changes.`
        );
      },
    };
  }

  const FBF = [
    fbfEntry({ id: "fbf-drop-a", name: "Frame-by-frame · Drop A", data: FBF_DROP_A,
      blurb: "Every frame is a separate drawing — 45 of them, traced from the reference and stepped at 40ms, nothing tweened. Tan drop into a rising tan pool on purple; the pool fills the screen and a purple drop comes out; it rises, lands against the ceiling, spins into the reference vortex (its two splash-out frames outpainted to reach any window edge); then the tan mark and the buttons cut in. Swap the ink to see purple on tan." }),
    fbfEntry({ id: "fbf-drop-b", name: "Frame-by-frame · Drop B", data: FBF_DROP_B,
      blurb: "Same 38 drop and pool frames; the vortex is nine of our own drawings in which the tan swirl-e opens as the hole in the purple vortex, so the mark forms through the spin and the final cut lands exactly where the hole was." }),
    fbfEntry({ id: "fbf-drop-a-twos", name: "Frame-by-frame · Drop A, slower", data: FBF_DROP_A,
      blurb: "A's drawings held twice as long (an 80ms step), which reads closer to a 12fps hand-drawn cadence.",
      defaults: { duration: { def: 3600 } } }),
  ];

  /* ── adapter: rest/apply/snippet entries → register() ──────────────────── */
  const { h, wait } = Playground;
  const GROUP_OF = (id) => (id.startsWith("mood-") ? "Mood swipe" : "Logo splash");
  const LEGACY = [...MOOD_ENTRIES, ...MOOD_ENTRIES_2, LOGO_ENTRY, ...LOGO_VARIANTS, ...LOGO_SPLASH, ...COMETS, ...POOLS, ...FBF];
  LEGACY.forEach((e) => register({
    id: e.id, group: GROUP_OF(e.id), name: e.name, blurb: e.blurb, controls: e.controls,
    stage: { height: 340 },
    mount(root, v) {
      const A = h(`<div class="screen screenA"></div>`), B = h(`<div class="screen screenB"></div>`);
      root.appendChild(A); root.appendChild(B);
      const reset = () => { for (const S of [A, B]) { S.style.cssText = ""; S.innerHTML = ""; S.getAnimations().forEach((a) => a.cancel()); } };
      e.rest(A, B, v, 1);
      return {
        play(dir) {
          return new Promise((res) => {
            reset(); e.rest(A, B, v, dir);
            requestAnimationFrame(() => requestAnimationFrame(async () => {
              try { await Promise.all([e.apply(A, B, dir, v), wait((v.duration || 600) + 150)]); } catch (err) { console.error(err); }
              res();
            }));
          });
        },
        destroy() { e._run = Symbol(); },
      };
    },
    snippets: { "framer-motion": (v) => e.snippet(v) },
  }));
})();
