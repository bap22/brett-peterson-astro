import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { mountSky, type SkyItem } from './starfield';

gsap.registerPlugin(ScrollTrigger);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

let lenis: Lenis | null = null;
let pageCtx: gsap.Context | null = null;
let booted = false;

/* ---------------- once per session ---------------- */
function once() {
  if (!reduced()) {
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Global keys: palette, x-ray, konami.
  const konami = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let keys: string[] = [];
  addEventListener('keydown', (e) => {
    const typing = (e.target as HTMLElement)?.closest('input, textarea, [contenteditable]');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (typing) return;
    if (e.key === '/' ) { e.preventDefault(); openPalette(); return; }
    keys = [...keys, e.key.toLowerCase()].slice(-konami.length);
    if (keys.join() === konami.join()) { keys = []; gameday(); return; }
    if (e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey && !e.altKey) toggleXray();
  });

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-palette-open]')) openPalette();
    if (t.closest('[data-xray-toggle]')) toggleXray();
    const copy = t.closest<HTMLElement>('[data-copy]');
    if (copy) copyText(copy.dataset.copy!, copy);
  });

  setupPalette();
  document.addEventListener('astro:before-swap', () => { pageCtx?.revert(); pageCtx = null; });
}

/* ---------------- every page ---------------- */
export function boot() {
  const run = () => {
    if (!booted) { once(); booted = true; }
    lenis?.scrollTo(0, { immediate: true });
    pageCtx = gsap.context(() => {
      hero();
      timeline();
      workPreview();
    });
    perfLine();
    if (document.documentElement.classList.contains('xray')) renderXrayPanel();
    ScrollTrigger.refresh();
  };
  document.addEventListener('astro:page-load', run);
}

/* ---------------- hero: source compiles into type ---------------- */
function hero() {
  const root = $('[data-hero]');
  if (!root) return;
  const glyphs = $$('.glyph', root);
  const src = $$('[data-src-char]', root);
  const rest = $$('[data-hero-rest]', root);
  const caret = $('[data-caret]', root);
  const BASE = 720;

  const skyData = $('[data-sky-items]', root);
  if (skyData) {
    const stop = mountSky(root, JSON.parse(skyData.textContent || '[]') as SkyItem[], { reduced: reduced() });
    document.addEventListener('astro:before-swap', stop, { once: true });
  }

  if (reduced()) { gsap.set(glyphs, { '--w': BASE }); return; }

  const seen = sessionStorage.getItem('bp-hero');
  const speed = seen ? 2.2 : 1; // repeat visits get the short version
  sessionStorage.setItem('bp-hero', '1');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } }).timeScale(speed);
  tl.set(src, { opacity: 0 })
    .set(glyphs, { yPercent: 105, '--w': 100 })
    .set(rest, { opacity: 0, y: 14 })
    .to(src, { opacity: 1, duration: 0.01, stagger: 0.028, ease: 'none' })
    .to(caret, { opacity: 0, repeat: 3, yoyo: true, duration: 0.12, ease: 'steps(1)' }, '<')
    .to(src, { opacity: 0.32, duration: 0.4 }, '+=0.15')
    .to(glyphs, { yPercent: 0, duration: 0.9, stagger: 0.035, ease: 'expo.out' }, '<')
    .to(glyphs, { '--w': BASE, duration: 1.1, stagger: 0.035, ease: 'power2.inOut' }, '<0.1')
    .to(rest, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.6');

  // Letters gain weight near the cursor.
  if (!finePointer()) return;
  const h1 = $('h1', root)!;
  let frame = 0;
  let px = -9999, py = -9999;
  const onMove = (e: PointerEvent) => {
    px = e.clientX; py = e.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const g of glyphs) {
        const r = g.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const t = Math.max(0, 1 - d / 320);
        // Far letters thin out, near letters go heavy: 420 → 900.
        gsap.to(g, { '--w': 420 + 480 * t * t, duration: 0.5, overwrite: 'auto' });
      }
    });
  };
  const onLeave = () => gsap.to(glyphs, { '--w': BASE, duration: 0.8, overwrite: 'auto' });
  tl.eventCallback('onComplete', () => {
    h1.addEventListener('pointermove', onMove);
    h1.addEventListener('pointerleave', onLeave);
  });
}

/* ---------------- pinned horizontal timeline ---------------- */
function timeline() {
  const section = $('[data-timeline]');
  const track = section && $('[data-track]', section);
  if (!section || !track) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const dist = () => track.scrollWidth - section.clientWidth;
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
    });
    const bar = $('[data-progress]', section);
    if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${dist()}`, scrub: true } });
  });
}

/* ---------------- work list: cursor-following detail card ---------------- */
function workPreview() {
  const list = $('[data-work-list]');
  const card = $('[data-work-card]');
  if (!list || !card || !finePointer()) return;
  const xTo = gsap.quickTo(card, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(card, 'y', { duration: 0.45, ease: 'power3' });
  const body = $('[data-work-card-body]', card)!;
  list.addEventListener('pointermove', (e) => { xTo(e.clientX + 24); yTo(e.clientY - 40); });
  for (const row of $$('[data-work-row]', list)) {
    row.addEventListener('pointerenter', () => {
      body.innerHTML = $('template', row)!.innerHTML;
      gsap.to(card, { autoAlpha: 1, scale: 1, duration: 0.25, overwrite: 'auto' });
    });
    row.addEventListener('pointerleave', () => gsap.to(card, { autoAlpha: 0, scale: 0.96, duration: 0.2, overwrite: 'auto' }));
  }
}

/* ---------------- command palette ---------------- */
type Item = { label: string; href?: string; action?: string; value?: string; group: string; hint?: string };
let items: Item[] = [];
let active = 0;
let filtered: Item[] = [];

function setupPalette() {
  const dlg = $<HTMLDialogElement>('#palette');
  if (!dlg) return;
  const input = $<HTMLInputElement>('#palette-q', dlg)!;
  input.addEventListener('input', () => { active = 0; renderPalette(input.value); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); renderPalette(input.value, true); }
    if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); renderPalette(input.value, true); }
    if (e.key === 'Enter') { e.preventDefault(); runItem(filtered[active]); }
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (li) runItem(filtered[+li.dataset.i!]);
  });
}

function openPalette() {
  const dlg = $<HTMLDialogElement>('#palette');
  if (!dlg || dlg.open) return;
  items = JSON.parse($('#palette-data')!.textContent || '[]');
  const input = $<HTMLInputElement>('#palette-q', dlg)!;
  input.value = ''; active = 0;
  renderPalette('');
  dlg.showModal();
  if (!reduced()) gsap.fromTo(dlg, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' });
  input.focus();
}

function score(label: string, q: string) {
  const l = label.toLowerCase();
  if (!q) return 1;
  if (l.startsWith(q)) return 3;
  if (l.includes(q)) return 2;
  let i = 0; for (const c of l) if (c === q[i]) i++;
  return i === q.length ? 1 : 0;
}

function renderPalette(q: string, keepScroll = false) {
  const list = $('#palette-list')!;
  const query = q.trim().toLowerCase();
  filtered = items.map((it) => [it, score(it.label, query)] as const).filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]).map(([it]) => it).slice(0, query ? 12 : 10);
  if (!filtered.length) {
    list.innerHTML = `<li class="px-5 py-3 text-slate">Nothing matches “${q.replace(/[<>&]/g, '')}”. Try a post title or “x-ray”.</li>`;
    return;
  }
  list.innerHTML = filtered.map((it, i) => `
    <li role="option" aria-selected="${i === active}" data-i="${i}"
      class="flex cursor-pointer items-center justify-between gap-4 px-5 py-2 ${i === active ? 'bg-ink text-snow' : ''}">
      <span>${it.label.replace(/[<>&]/g, '')}</span><span class="text-[12px] opacity-60">${it.hint ?? it.group}</span>
    </li>`).join('');
  if (keepScroll) list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
}

async function runItem(it?: Item) {
  if (!it) return;
  $<HTMLDialogElement>('#palette')!.close();
  if (it.action === 'xray') toggleXray();
  else if (it.action === 'copy-email') copyText(it.value!);
  else if (it.href?.startsWith('http')) open(it.href, '_blank', 'noopener');
  else if (it.href) {
    const { navigate } = await import('astro:transitions/client');
    navigate(it.href);
  }
}

/* ---------------- x-ray mode ---------------- */
function toggleXray() {
  const on = document.documentElement.classList.toggle('xray');
  $$('[data-xray-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(on)));
  const panel = $('#xray-panel')!;
  panel.hidden = !on;
  if (on) renderXrayPanel();
  toast(on ? 'X-ray on. Press X to turn it off.' : 'X-ray off.');
}

function bytes() {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const size = (e: PerformanceResourceTiming) => e.transferSize || e.encodedBodySize || 0;
  const sum = (re: RegExp) => res.filter((r) => re.test(r.name.split('?')[0])).reduce((a, r) => a + size(r), 0);
  const total = (nav ? size(nav) : 0) + res.reduce((a, r) => a + size(r), 0);
  return { nav, total, js: sum(/\.m?js$/), css: sum(/\.css$/), fonts: sum(/\.woff2?$/) };
}
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

function renderXrayPanel() {
  const panel = $('#xray-panel')!;
  const b = bytes();
  const rows: [string, string][] = [
    ['DOM nodes', String(document.getElementsByTagName('*').length)],
    ['Over the wire', kb(b.total)],
    ['JavaScript', kb(b.js)],
    ['CSS', kb(b.css)],
    ['Fonts', kb(b.fonts)],
    ['Interactive', b.nav ? `${Math.round(b.nav.domInteractive)} ms` : 'n/a'],
    ['Rendering', 'prerendered'],
  ];
  panel.innerHTML = `<p class="mb-2 text-hi">view-source:${location.pathname}</p>` +
    rows.map(([k, v]) => `<div class="flex justify-between gap-3"><span class="opacity-70">${k}</span><span>${v}</span></div>`).join('');
}

function perfLine() {
  const el = $('#perf-line');
  if (!el) return;
  const show = () => {
    const b = bytes();
    if (!b.nav || !b.total) return;
    el.textContent = `This page: ${kb(b.total)} over the wire, interactive in ${Math.round(b.nav.domInteractive)} ms. Built with Astro.`;
  };
  if (document.readyState === 'complete') setTimeout(show, 50); else addEventListener('load', () => setTimeout(show, 50), { once: true });
}

/* ---------------- small things ---------------- */
async function copyText(text: string, el?: HTMLElement) {
  try { await navigator.clipboard.writeText(text); toast(`Copied ${text}`); }
  catch { toast(`Couldn't reach the clipboard. Email ${text} directly.`); }
  const label = el && $('[data-copy-label]', el);
  if (label) { label.textContent = 'Copied'; setTimeout(() => (label.textContent = 'Click to copy'), 1800); }
}

let toastTimer = 0;
function toast(msg: string) {
  const t = $('#toast')!;
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.style.opacity = '0'), 2200);
}

function gameday() {
  const on = document.documentElement.classList.toggle('gameday');
  toast(on ? 'Rise and shout. Gameday mode on.' : 'Gameday mode off.');
  if (!on || reduced()) return;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.className = 'pointer-events-none fixed inset-0 z-50 overflow-hidden';
  document.body.append(layer);
  for (let i = 0; i < 40; i++) {
    const y = document.createElement('span');
    y.textContent = 'Y';
    y.className = 'absolute font-display font-black text-white';
    y.style.cssText = `left:${Math.random() * 100}%;top:-10%;font-size:${16 + Math.random() * 48}px`;
    layer.append(y);
    gsap.to(y, { y: innerHeight * 1.25, rotation: gsap.utils.random(-180, 180), duration: gsap.utils.random(1.6, 3.2), delay: Math.random() * 0.8, ease: 'power1.in' });
  }
  setTimeout(() => layer.remove(), 4500);
}
