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
```

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
