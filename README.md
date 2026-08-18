# Animation Playground

A single-file, zero-dependency catalog of UI transitions. Open `index.html`
in any browser — no build, no install.

Each transition is a live, tunable demo (Web Animations API) paired with a
copy-paste **framer-motion / Motion** snippet that reflects the current
slider values. Design the move here, copy the snippet, drop it into a real
project.

## Current catalog

- **Page Slide** — the classic push/pop nav transition, both screens travel
  in unison; tunable duration, travel, easing, fade.
- **Staggered List** — rows cascade in/out with per-row delay.
- **Card Morph** — shared-element morph: list card grows into a detail
  header while content cascades in beneath (layoutId pattern, including the
  gotcha notes for combining it with page slides).

## Adding a transition

Append one object to the `TRANSITIONS` array in `index.html`:

```js
{
  id: "my-move",
  name: "My Move",
  blurb: "What it does and when to use it.",
  controls: [ /* range | select | toggle definitions */ ],
  rest(A, B, v, dir)  { /* set the stage's starting state */ },
  apply(A, B, dir, v) { /* run the demo via element.animate() */ },
  snippet(v)          { /* return the framer-motion code string */ },
}
```

The framework (nav, controls, play/reverse/loop, code panel, copy button)
picks it up automatically.

## Projects using this catalog

Transitions designed here are consumed as named **motion presets** in app
code — a registry maps semantic names (`nav.push`, `sheet.present`,
`card.morph`) to variant/transition objects, so an app can swap its entire
motion character by switching preset packs. Every move an app ships should
have its entry here first.
