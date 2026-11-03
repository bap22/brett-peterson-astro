// Hero night sky. Every bright star is a real item (post, project, client site, career
// chapter) placed by year on a 2009→now axis; the faint ones are ambient dust.
// Hover: the sky wakes up (faster twinkle, parallax toward the cursor), and the nearest
// item lights up its whole constellation (same category, joined in chronological order).

export type SkyItem = { label: string; year: number; cat: string; href?: string; detail: string };

type Star = SkyItem & { x: number; y: number; r: number; phase: number; bx: number; by: number; ign: number };
type Dust = { x: number; y: number; r: number; z: number; phase: number; speed: number };

const CAT_COLORS: Record<string, string> = {
  'Client sites': '#ffd84d',
  Writing: '#9db8ff',
  'Games & tools': '#8fe3c8',
  Career: '#ffffff',
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export function mountSky(root: HTMLElement, items: SkyItem[], opts: { reduced: boolean }) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-sky]')!;
  const band = root.querySelector<HTMLElement>('[data-sky-band]')!;
  const tip = root.querySelector<HTMLElement>('[data-sky-tip]')!;
  const legend = [...root.querySelectorAll<HTMLButtonElement>('[data-sky-cat]')];
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const START = 2009, END = new Date().getFullYear() + 1;

  let W = 0, H = 0, bandTop = 0, bandH = 0, bandL = 0, bandW = 0;
  let stars: Star[] = [];
  let dust: Dust[] = [];
  let mouse = { x: -1, y: -1, inside: false };
  let wake = 0; // 0 idle → 1 hovered, eased
  let active: Star | null = null;
  let litCat: string | null = null;
  let litProgress = 0; // constellation line draw-in 0→1
  let t0 = performance.now();
  let raf = 0, visible = true;

  // Axis: half linear time, half "how much happened" (CDF of items), so busy years get
  // room and quiet ones compress. Tick labels use the same mapping, so it stays honest.
  const sortedYears = items.map((i) => i.year).sort((a, b) => a - b);
  const cdf = (y: number) => {
    let lo = 0, hi = sortedYears.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (sortedYears[m] < y) lo = m + 1; else hi = m; }
    return lo / sortedYears.length;
  };
  const xFor = (year: number) => {
    const lin = (year - START) / (END - START);
    return bandL + Math.min(1, 0.5 * lin + 0.5 * cdf(year)) * bandW;
  };

  function layout() {
    const r = root.getBoundingClientRect();
    const b = band.getBoundingClientRect();
    W = r.width; H = r.height;
    bandTop = b.top - r.top; bandH = b.height; bandL = b.left - r.left + 8; bandW = b.width - 16;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = items.map((it) => {
      const h1 = hash(it.label), h2 = hash(it.label + '#');
      const x = xFor(it.year + h1 * 0.85);
      const y = bandTop + 18 + h2 * (bandH - 48);
      return { ...it, x, y, bx: x, by: y, r: it.cat === 'Career' ? 3.2 : 2 + h1 * 1.4, phase: h2 * Math.PI * 2, ign: (it.year - START) / (END - START) };
    });
    const n = Math.round((W * H) / 5200);
    dust = Array.from({ length: n }, (_, i) => {
      const a = hash('d' + i), b2 = hash('e' + i), c = hash('f' + i);
      return { x: a * W, y: b2 * H, r: 0.3 + c * 0.9, z: 0.2 + c, phase: a * 6.28, speed: 0.6 + b2 * 1.6 };
    });
  }

  function nearest(x: number, y: number) {
    let best: Star | null = null, bd = 22;
    for (const s of stars) { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  function setLit(cat: string | null, star: Star | null) {
    if (cat !== litCat) { litCat = cat; litProgress = 0; }
    active = star;
    legend.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.skyCat === cat)));
    if (star) {
      tip.innerHTML = `<span style="color:${CAT_COLORS[star.cat]}">${star.cat}, ${Math.floor(star.year)}</span><strong>${star.label.replace(/[<>&]/g, '')}</strong><span>${star.detail.replace(/[<>&]/g, '')}</span>`;
      const left = Math.min(Math.max(star.x + 16, 8), W - 260);
      tip.style.transform = `translate(${left}px, ${Math.max(star.y - 70, 8)}px)`;
      tip.style.opacity = '1';
      canvas.style.cursor = star.href ? 'pointer' : 'default';
    } else {
      tip.style.opacity = '0';
      canvas.style.cursor = 'default';
    }
  }

  function draw(now: number) {
    const t = (now - t0) / 1000;
    const intro = opts.reduced ? 1 : Math.min(1, t / 1.8); // stars ignite left → right
    wake += ((mouse.inside ? 1 : 0) - wake) * 0.06;
    if (litCat) litProgress = Math.min(1, litProgress + 0.045);
    ctx.clearRect(0, 0, W, H);

    // Ambient dust: parallax toward the cursor by depth, twinkle faster when awake.
    const px = mouse.inside ? (mouse.x / W - 0.5) : 0, py = mouse.inside ? (mouse.y / H - 0.5) : 0;
    for (const d of dust) {
      const tw = 0.35 + 0.35 * Math.sin(t * d.speed * (1 + wake * 2.5) + d.phase);
      const x = d.x + px * 26 * d.z * wake, y = d.y + py * 18 * d.z * wake;
      ctx.globalAlpha = Math.max(0.05, tw) * (0.55 + wake * 0.45);
      ctx.fillStyle = '#dfe6f3';
      ctx.fillRect(x, y, d.r, d.r);
    }

    // Year axis.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#9fb0cc';
    ctx.font = '500 11px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.textAlign = 'center';
    const axisY = bandTop + bandH + 4;
    let lastLabel = -1e9;
    for (let y = START; y <= Math.floor(END) - 1; y++) {
      const x = xFor(y);
      ctx.fillRect(x, axisY - 10, 1, 6);
      if (x - lastLabel > (W < 700 ? 52 : 44)) { ctx.fillText(String(y), x, axisY + 10); lastLabel = x; }
    }

    // Constellation lines for the lit category, drawn in chronologically.
    if (litCat) {
      const group = stars.filter((s) => s.cat === litCat).sort((a, b) => a.x - b.x);
      const segs = group.length - 1;
      const upto = litProgress * segs;
      ctx.strokeStyle = CAT_COLORS[litCat];
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      for (let i = 0; i < segs && i < upto; i++) {
        const a = group[i], b = group[i + 1];
        const f = Math.min(1, upto - i);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
      }
      ctx.stroke();
    }

    // Item stars.
    for (const s of stars) {
      const on = intro >= s.ign ? Math.min(1, (intro - s.ign) * 8) : 0;
      if (!on) continue;
      const lit = !litCat || s.cat === litCat;
      // gentle drift away from the cursor
      if (mouse.inside) {
        const dx = s.bx - mouse.x, dy = s.by - mouse.y, d = Math.hypot(dx, dy) || 1;
        const push = Math.max(0, 1 - d / 140) * 10;
        s.x += (s.bx + (dx / d) * push - s.x) * 0.15; s.y += (s.by + (dy / d) * push - s.y) * 0.15;
      } else { s.x += (s.bx - s.x) * 0.1; s.y += (s.by - s.y) * 0.1; }
      const tw = 0.75 + 0.25 * Math.sin(t * (1.2 + wake * 3) + s.phase);
      const isActive = s === active;
      const r = s.r * (isActive ? 2.2 : lit && litCat ? 1.35 : 1);
      ctx.globalAlpha = on * (lit ? tw : 0.18);
      ctx.fillStyle = CAT_COLORS[s.cat];
      // glow
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
      g.addColorStop(0, CAT_COLORS[s.cat]); g.addColorStop(1, 'transparent');
      ctx.globalAlpha *= 0.35;
      ctx.fillStyle = g;
      ctx.fillRect(s.x - r * 5, s.y - r * 5, r * 10, r * 10);
      ctx.globalAlpha = on * (lit ? tw : 0.22);
      ctx.fillStyle = CAT_COLORS[s.cat];
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
      if (isActive) {
        // four-point sparkle
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = CAT_COLORS[s.cat];
        const k = r * 3.2 * (0.8 + 0.2 * Math.sin(t * 6));
        ctx.beginPath(); ctx.moveTo(s.x - k, s.y); ctx.lineTo(s.x + k, s.y); ctx.moveTo(s.x, s.y - k); ctx.lineTo(s.x, s.y + k); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(now: number) {
    draw(now);
    if (visible && !opts.reduced) raf = requestAnimationFrame(loop);
  }

  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true };
    const s = nearest(mouse.x, mouse.y);
    if (s) setLit(s.cat, s);
    else if (active) setLit(litCat, null);
    if (opts.reduced) draw(performance.now());
  };
  const onLeave = () => { mouse.inside = false; setLit(null, null); if (opts.reduced) draw(performance.now()); };
  const onClick = () => { if (active?.href) location.assign(active.href); };

  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);
  legend.forEach((b) => {
    const cat = b.dataset.skyCat!;
    const on = () => setLit(cat, null);
    const off = () => setLit(null, null);
    b.addEventListener('mouseenter', on); b.addEventListener('focus', on);
    b.addEventListener('mouseleave', off); b.addEventListener('blur', off);
    b.addEventListener('click', () => (litCat === cat && b.matches(':focus') ? off() : on()));
  });

  const ro = new ResizeObserver(() => { layout(); if (opts.reduced) draw(performance.now()); });
  ro.observe(root);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !opts.reduced) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  });
  io.observe(root);

  layout();
  t0 = performance.now();
  if (opts.reduced) draw(t0 + 5000); else raf = requestAnimationFrame(loop);

  return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); };
}
