# Animation Library

A live, tunable catalog of UI motion. Every entry is a running demo with
sliders for its parameters and copy-paste code that reflects the current
slider values, in up to three flavours: **framer-motion**, **CSS / WAAPI**
and **GSAP**. Design the move here, copy the snippet for whatever stack the
project uses.

**Live:** https://cybercanvascollective.art/animation/
**Companion:** [Motion Demos](https://cybercanvascollective.art/motion/) — the
frame-by-frame reverse-engineering experiments the *Signature moves* are
ported from.

No build, no install: open `index.html`. GSAP loads from a CDN; everything
else is plain files.

## Catalog

| Group | Entries |
|---|---|
| **Navigation** | Page Slide · Fade Through · Parallax Push · Bottom Sheet · Side Drawer |
| **Content** | Staggered List · Card Morph · Accordion Expand · Skeleton → Content · FLIP Reorder · View Transition |
| **Micro-interactions** | Button Press · Toast · Tab Indicator · Toggle Switch · Number Counter |
| **Scroll** | Scroll Reveal · Header Collapse · Parallax Layers |
| **Signature moves** | Liquid Swipe · Goo FAB · Shared-Anchor Accordion · Feed → Detail · Icon Loops |
| **Mood swipe** | 12 takes on the whole page changing mood in one move: wipes, blob reveals, hero morphs, depth |
| **Logo splash** | Logo Blob-In · Logo Morph (5) · Splash (5) · Comet (10) · Pool (4) · Frame-by-frame (A / B / A slower) |

Signature moves keep the *mechanism* from the original experiment (the
Gaussian clip-path, the goo filter + custom pop ease, the single shared icon
anchor, the measured ECHO choreography, the SVG part timelines) and expose
the measured constants as sliders. Each links back to the full source.

## Layout

```
index.html          shell: sidebar, stage, controls, snippet tabs
css/playground.css
js/framework.js     registry, controls, stage mounting, loop, hash routing
catalog/
  navigation.js     one file per group; each entry calls register({...})
  content.js
  micro.js
  scroll.js
  signature.js
  liquid.js         Mood swipe + Logo splash families and their rAF engines
tools/              tracer, outpaint and vortex-drawing scripts behind the frame-by-frame entries
```

## Mood swipe & Logo splash families

- **Mood Swipe family (six)** — the whole page changes mood in one move:
  ground, ink, accent, hero, shapes and copy swap together so each screen
  feels like a different place. Shared palette blend + "fast in, slow out"
  controls (in/out easing, colour shift %, travel, stagger); each entry
  decides how the swap moves:
  - *Colour Field* — full-bleed ground cross-tween, content lifts out slow,
    cascades in fast.
  - *Blob Reveal* — liquid-swipe: next mood pours in from an edge as a
    growing clip-path circle; optional **drag to pull** (touch-and-pull).
  - *Hue Drift* — the subtle one: same lightness, hue drifts (tan → pale
    blue), hero crossfades and breathes, copy crossfades with a tiny lift.
  - *Shape Drift* — each mood owns a shape layout; the circles travel to
    the next layout, squashing and stretching on the way, as they recolour.
  - *Hero Morph* — shared-element: the hero card grows into a full-bleed
    banner while everything else swaps (layoutId pattern).
  - *Depth Zoom* — old page recedes (scale up, blur, fade), new mood lands
    from below scale. Cinematic; chapter breaks.
  - *Blob + Hero Morph* — Blob Reveal with the hero lifted above both pages,
    morphing card → banner as the new mood pours in under it.
  - *Blob from Hero* — the reveal circle grows out of the hero card or the
    button: tap → flood.
  - *Triple Blob* — three circles pour in from three places at staggered
    moments and merge into one flood.
  - *Liquid Edge* — the clip is a 40-point polygon whose rim ripples as it
    grows; wobble fades as it fills.
  - *Depth Tilt* — perspective: the old page tilts away around the edge it
    leaves from; the new one swings in and squares up.
  - *Pass Through* — the camera moves INTO the old page (zooms past, dissolves)
    while the new mood sharpens from a blur behind it.
- **Logo Blob-In** — cold-start splash: pieces of a logomark start at the
  screen edges and flow inward through an SVG gooey filter, fusing into a
  mass that resolves into the crisp vector. Blob targets are sampled along
  the real path. Reduced-motion fallback = plain fade.
- **Logo Morph family (five)** — real shape morphing on a small rAF engine:
  the mark is sampled into points and cut into N wedges from its centroid;
  each blob is a circle polygon with the same point count, so the circles
  literally BECOME the logo (JS easings: elastic / bounce / back). Gooey
  filter fuses the seams; the crisp path crossfades in over the last 160 ms.
  - *Logo Morph · Edges* — circles fly in radially from the screen edges.
  - *Logo Drop* — one drop falls (bounce), squashes, inflates into the mark.
  - *Logo Chakra* — seven chakra-coloured blobs rise up the spine, stack,
    then flow out into the wedges as colours settle to ink (or keep them).
  - *Logo Ink Bloom* — no travel: dots bloom in place with overshoot, fuse.
  - *Logo Spiral* — a ring orbits inward 1.5 turns, matching the swirl.
- **Splash family (five)** — cold-start splash screens after the Scribble /
  Behance / "Nice" cel-liquid references: a liquid mass arrives, the GROUND
  FLIPS colour as a liquid flood passes (ripple from the impact, or a wave
  rising from the bottom), droplets fly, the mass morphs into the mark in the
  inverted colour, then the login buttons cascade in. Droplet system + rAF.
  - *Splash · Drop & Flip* — a drop falls, squashes, the ripple flips the ground.
  - *Splash · Swoosh (Behance)* — wave flips the ground first, then the mass
    arcs in from the top-left shedding droplets, lands, splashes.
  - *Splash · Burst & Gather* — a dot bursts into a ring of droplets, the flood
    follows, the droplets are pulled back and gather into the mark.
  - *Logo Write-On (Scribble)* — a tapered hand-drawn liquid stroke draws a
    spiral with a bulb at the tip shedding droplets and a frame-by-frame boil.
  - *Splash · From the Heavens* — ether = the heavens: the ground deepens to
    night, stars twinkle in, drift into a constellation of the mark, it glows.
- **Comet family (ten)** — the Scribble/Behance liquid treatment as one
  vector blob: a bigger head in front, a long pointy tail built from its own
  path history, ink squirts shed off the tail, and a per-frame outline wobble
  (hand-drawn boil, re-seeded at a drawn-twos cadence) so it never reads as
  plotted. Flies a Catmull-Rom spline, lands, splashes, morphs into the mark.
  Ground flips before (Behance wave) or at impact (ripple) or never; both
  ink/ground pairings (purple on tan, tan on purple). Variants: Behance Loop,
  Behance Loop swapped, Straight Drop, Straight Drop tan-on-purple, S-Curve
  (flips mid-flight), Spiral-In, Whip, Rise, Loop sketchy (heavy boil, no
  goo), Tan loop flip-at-impact.
- **Pool family (four)** — the frame-by-frame "drop into water" idea as
  three colour flips: an ink drop falls into a rising ink pool on the ground
  colour; the pool fills the screen and a ground-coloured drop comes out
  underneath; that drop lands, spins up into the swirl and splashes out past
  every edge, so the screen is the ground colour again with the ink mark left
  at the centre. Crown beads at impact, cavity and bulge in the surface,
  beads trailing the sinking drop. Controls: drop head, spin-up turns, pool
  level at impact. Variants: Three Flips, swapped inks, Slow two turns, Quick
  half turn.
- **Frame-by-frame family (two)** — every frame is its own drawing. The
  ink region of each reference frame was traced to a closed evenodd path
  (pixel-edge loops, Douglas-Peucker simplified) and playback steps through
  them: nothing is tweened, scaled or rotated. Ink and ground swap; fit is
  letterbox or crop; the mark and buttons cut in on the frame after the last
  drawing. Kept as versions: **A** = all 45 frames traced from the
  reference, its two splash-out frames outpainted past the 4:3 box (every
  outside pixel takes the value just inside the box edge along its ray, with
  a spiral twist, taper and roughness). **B** = the same 38 drop/pool frames,
  then nine vortex frames of our own on a 2000px canvas:
  a ragged purple vortex with spiral arms and arcs of thrown chunks, the tan
  swirl-e opening inside it as the hole (ragged disc reveal from the eye
  outward) so the mark forms through the spin, arms reaching every edge,
  then a cover frame; each frame has its own seed and hand wobble. The
  final crisp mark cuts in exactly where the hole was. Drop-in your own
  drawings (black ink on alpha) by tracing them the same way. Variants:
  Drop A, Drop B, Drop A slower (80ms step).

## Adding an entry

Append to the relevant `catalog/*.js`:

```js
register({
  id: 'my-move', group: 'Content', name: 'My Move',
  blurb: 'What it does and when to use it.',
  controls: [
    { key: 'duration', label: 'Duration', type: 'range', min: 150, max: 900, step: 10, def: 400, unit: 'ms' },
    Playground.easeCtl(),                       // the shared easing select
    { key: 'fade', label: 'Fade', type: 'toggle', def: true },
  ],
  stage: { height: 340 },                       // or { phone: true } for a 300×600 device frame
  mount(root, v, ctx) {                         // build the demo at REST, ready to play
    const el = Playground.h(`<div class="screen screenA">…</div>`);
    root.appendChild(el);
    return {
      play(dir) {                               // 1 = forward, -1 = reverse; return a Promise
        return Playground.finished([el.animate({ opacity: [0, 1] }, { duration: v.duration, fill: 'forwards' })]);
      },
      destroy() {},                             // optional: kill timers / tweens
    };
  },
  snippets: {                                   // any subset; tabs appear for what's present
    'framer-motion': v => `…`,
    'CSS / WAAPI':   v => `…`,
    'GSAP':          v => `…`,
  },
});
```

Helpers on `Playground`: `h(html)`, `wait(ms)`, `finished(anims)`,
`EASINGS`, `easeArr(name)` (→ framer array), `gsapEase(name)`, `sec(ms)`,
`easeCtl(default)`. Entries that can't meaningfully reverse set
`reversible: false`. Set `stage.hint` for a one-line interaction prompt.

## Keyboard

`space` plays, `shift+space` reverses, `#id` in the URL deep-links an entry.
