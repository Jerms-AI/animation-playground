/* ============================================================================
   ANIMATION LIBRARY — framework
   ----------------------------------------------------------------------------
   Each catalog entry is ONE object passed to register():

     register({
       id: 'kebab-id',             // url hash + nav id
       group: 'Navigation',        // sidebar group (see GROUPS)
       name: 'Display Name',
       blurb: 'One or two sentences on what it is and when to use it.',
       source: { label, url },     // optional credit (e.g. the Dribbble shot)
       notes: '<p>…</p>',          // optional "Mechanism" block (HTML)
       reversible: true,           // false hides the Reverse button
       stage: { height: 340, phone: false, bg: '#0a0c10' },  // optional
       controls: [ {key,label,type:'range'|'select'|'toggle', …} ],
       mount(root, v, ctx) {       // build the demo DOM at REST (ready to play)
         …                         // ctx = { W, H, k, phone }
         return {
           play(dir) { … return Promise },  // dir 1 = forward, -1 = reverse
           destroy() { … }                  // optional: kill timers/tweens
         };
       },
       snippets: {                 // one function per flavour; any subset
         'framer-motion': v => '…',
         'CSS / WAAPI':   v => '…',
         'GSAP':          v => '…',
       },
     });

   Demos run on the Web Animations API or GSAP (CDN). Snippets are what you
   paste into a real project — tuned to the slider values.
   ========================================================================== */
const Playground = (() => {
  const GROUPS = ['Navigation', 'Content', 'Micro-interactions', 'Scroll', 'Signature moves'];
  const CATALOG = [];
  const EASINGS = {
    'ease-out-quint': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'ease-out-expo':  'cubic-bezier(0.19, 1, 0.22, 1)',
    'ease-in-out':    'cubic-bezier(0.65, 0, 0.35, 1)',
    'ease-in':        'cubic-bezier(0.4, 0, 1, 1)',
    'spring-ish':     'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'linear':         'linear',
  };
  const $ = s => document.querySelector(s);

  // ── helpers available to catalog entries ──────────────────────────────
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const finished = anims => Promise.all(anims.map(a => a.finished)).catch(() => {});
  const easeArr = name => EASINGS[name].replace('cubic-bezier(', '[').replace(/\)$/, ']');
  const sec = ms => (ms / 1000).toFixed(2);
  const gsapEase = name => ({
    'ease-out-quint': 'power4.out', 'ease-out-expo': 'expo.out', 'ease-in-out': 'power2.inOut',
    'ease-in': 'power2.in', 'spring-ish': 'back.out(1.7)', 'linear': 'none',
  }[name] || 'power3.out');
  const easeCtl = (def = 'ease-out-quint') => ({ key: 'easing', label: 'Easing', type: 'select', options: Object.keys(EASINGS), def });

  // ── state ─────────────────────────────────────────────────────────────
  let current = null, values = {}, ctl = null, looping = false, loopDir = 1, loopTimer = null;
  let flavour = (() => { try { return localStorage.getItem('pg.flavour'); } catch (e) { return null; } })();

  function register(e) { if (!e.reversible && e.reversible !== false) e.reversible = true; CATALOG.push(e); }

  function buildNav() {
    const nav = $('#nav'); nav.innerHTML = '';
    GROUPS.forEach(g => {
      const items = CATALOG.filter(e => e.group === g);
      if (!items.length) return;
      nav.appendChild(h(`<div class="nav-group">${g}</div>`));
      items.forEach(e => {
        const b = h(`<button class="nav-item${e === current ? ' active' : ''}">${e.name}<small>${e.id}</small></button>`);
        b.onclick = () => { location.hash = e.id; $('#sidebar').classList.remove('open'); };
        nav.appendChild(b);
      });
    });
  }

  function buildControls() {
    const wrap = $('#controls'); wrap.innerHTML = ''; values = {};
    (current.controls || []).forEach(c => {
      values[c.key] = c.def;
      const div = h(`<div class="ctrl"></div>`);
      if (c.type === 'range') {
        div.innerHTML = `<label>${c.label} <span class="val" id="v_${c.key}">${c.def}${c.unit || ''}</span></label>
          <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.def}">`;
        const inp = div.querySelector('input');
        inp.oninput = () => { values[c.key] = Number(inp.value); $('#v_' + c.key).textContent = inp.value + (c.unit || ''); refreshCode(); };
        inp.onchange = () => remount();
      } else if (c.type === 'select') {
        div.innerHTML = `<label>${c.label}</label><select>${c.options.map(o => `<option ${o === c.def ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
        div.querySelector('select').onchange = e => { values[c.key] = e.target.value; refreshCode(); remount(); };
      } else if (c.type === 'toggle') {
        div.innerHTML = `<label>${c.label}</label><label class="toggle"><input type="checkbox" ${c.def ? 'checked' : ''}> enabled</label>`;
        div.querySelector('input').onchange = e => { values[c.key] = e.target.checked; refreshCode(); remount(); };
      }
      wrap.appendChild(div);
    });
  }

  function buildTabs() {
    const tabs = $('#tabs'); tabs.innerHTML = '';
    const keys = Object.keys(current.snippets || {});
    if (!keys.includes(flavour)) flavour = keys[0];
    keys.forEach(k => {
      const b = h(`<button class="tab${k === flavour ? ' active' : ''}">${k}</button>`);
      b.onclick = () => { flavour = k; try { localStorage.setItem('pg.flavour', k); } catch (e) {} buildTabs(); refreshCode(); };
      tabs.appendChild(b);
    });
  }

  function refreshCode() {
    const fn = current.snippets && current.snippets[flavour];
    $('#code').textContent = fn ? fn(values) : '// no snippet for this flavour yet';
  }

  function remount() {
    if (ctl && ctl.destroy) { try { ctl.destroy(); } catch (e) {} }
    ctl = null;
    const stage = $('#stage');
    const st = current.stage || {};
    stage.innerHTML = '';
    stage.className = 'stage' + (st.phone ? ' phone-stage' : '');
    stage.style.height = (st.height || (st.phone ? 660 : 340)) + 'px';
    stage.style.background = st.bg || '';
    let root = stage, ctx;
    if (st.phone) {
      root = h(`<div class="phone"></div>`); stage.appendChild(root);
      ctx = { W: root.clientWidth, H: root.clientHeight, k: root.clientWidth / 375, phone: true };
    } else {
      ctx = { W: stage.clientWidth, H: stage.clientHeight, k: 1, phone: false };
    }
    if (st.hint) { stage.appendChild(h(`<span class="hint">${st.hint}</span>`)); stage.addEventListener('pointerdown', () => stage.classList.add('touched'), { once: true }); }
    ctl = current.mount(root, values, ctx) || {};
  }

  function select(id) {
    const e = CATALOG.find(x => x.id === id) || CATALOG[0];
    if (!e) return;
    stopLoop();
    current = e;
    $('#group').textContent = e.group;
    $('#title').textContent = e.name;
    $('#desc').textContent = e.blurb;
    const src = $('#source');
    if (e.source) { src.hidden = false; src.innerHTML = `Source: <a href="${e.source.url}" target="_blank" rel="noopener">${e.source.label}</a>`; } else src.hidden = true;
    const notes = $('#notes');
    if (e.notes) { notes.hidden = false; $('#notesBody').innerHTML = e.notes; } else notes.hidden = true;
    $('#playBack').hidden = e.reversible === false;
    document.title = `${e.name} — Animation Library`;
    buildNav(); buildControls(); buildTabs(); refreshCode(); remount();
    window.scrollTo({ top: 0 });
  }

  async function play(dir) {
    if (!ctl || !ctl.play) return;
    const p = ctl.play(dir);
    return p && p.then ? p : wait(600);
  }

  function stopLoop() { looping = false; clearTimeout(loopTimer); const l = $('#loop'); if (l) l.checked = false; }
  async function loopTick() {
    if (!looping) return;
    await play(loopDir);
    if (current.reversible !== false) loopDir *= -1;
    loopTimer = setTimeout(loopTick, 700);
  }

  function boot() {
    $('#playFwd').onclick = () => play(1);
    $('#playBack').onclick = () => play(-1);
    $('#loop').onchange = e => { looping = e.target.checked; loopDir = 1; if (looping) loopTick(); };
    $('#copyBtn').onclick = () => {
      const fn = current.snippets && current.snippets[flavour];
      if (!fn) return;
      navigator.clipboard.writeText(fn(values));
      $('#copyBtn').textContent = 'Copied'; setTimeout(() => $('#copyBtn').textContent = 'Copy', 1200);
    };
    $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && !/input|select|textarea/i.test(e.target.tagName)) { e.preventDefault(); play(e.shiftKey ? -1 : 1); }
    });
    window.addEventListener('hashchange', () => select(location.hash.slice(1)));
    select(location.hash.slice(1));
  }

  return { register, boot, EASINGS, h, wait, finished, easeArr, sec, gsapEase, easeCtl, CATALOG };
})();
const register = Playground.register;
