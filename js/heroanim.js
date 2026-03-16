/* ─── HERO — Interactive Gosset Background (full-section) ─── */
(function () {
  const canvas  = document.getElementById('heroCanvas');
  const section = document.getElementById('heroSection');
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  let W, H, cx, cy, maxR;

  // Same palette as logo / CTA band — red nodes, dark edges
  const NODE_RGB = '220, 38, 38';
  const EDGE_RGB = '35, 33, 33';

  // Identical ring config to penteract.js / ctaband.js
  const ringConfig = [
    { frac: 0,         count: 1  },
    { frac: 110 / 420, count: 6  },
    { frac: 210 / 420, count: 12 },
  ];
  const CONNECT_FRAC = 240 / 420;

  let baseVerts = [];
  let edges     = [];
  let glows     = [];

  let mouseX = -9999, mouseY = -9999;
  const HOVER_RADIUS = 110; // px (CSS)

  function buildGraph() {
    baseVerts = [];
    ringConfig.forEach((ring, ringIdx) => {
      const r = ring.frac * maxR;
      for (let i = 0; i < ring.count; i++) {
        const a = (i * 2 * Math.PI) / ring.count - Math.PI / 2;
        baseVerts.push({ ox: r * Math.cos(a), oy: r * Math.sin(a), ringIdx });
      }
    });

    edges = [];
    const thresh = maxR * CONNECT_FRAC;
    for (let i = 0; i < baseVerts.length; i++) {
      for (let j = i + 1; j < baseVerts.length; j++) {
        const dx = baseVerts[i].ox - baseVerts[j].ox;
        const dy = baseVerts[i].oy - baseVerts[j].oy;
        if (Math.sqrt(dx * dx + dy * dy) < thresh) edges.push([i, j]);
      }
    }

    glows = new Array(baseVerts.length).fill(0);
  }

  function resize() {
    const rect = section.getBoundingClientRect();
    W = canvas.width  = rect.width  * devicePixelRatio;
    H = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    cx = W / 2;
    cy = H / 2;
    // Fill ~90% of the section height — same proportion as ctaband.js
    maxR = H * 0.90;
    buildGraph();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Slightly slower than CTA band for a calm hero feel
    const rotation = t * 0.000075;
    const cosA = Math.cos(rotation);
    const sinA = Math.sin(rotation);

    const pts = baseVerts.map(v => ({
      x: cx + v.ox * cosA - v.oy * sinA,
      y: cy + v.ox * sinA + v.oy * cosA,
      ringIdx: v.ringIdx,
    }));

    const mxDpr = mouseX * devicePixelRatio;
    const myDpr = mouseY * devicePixelRatio;
    const rDpr  = HOVER_RADIUS * devicePixelRatio;

    // Update glow per node
    glows = glows.map((g, i) => {
      const dx   = pts[i].x - mxDpr;
      const dy   = pts[i].y - myDpr;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const target = dist < rDpr ? 1 - dist / rDpr : 0;
      return g + (target > g ? 0.14 : 0.05) * (target - g);
    });

    const MAX_RING = ringConfig.length - 1;

    // Edges — very faint on light background, brighten near cursor
    edges.forEach(([i, j]) => {
      const edgeGlow  = (glows[i] + glows[j]) / 2;
      const ringDepth = ((pts[i].ringIdx + pts[j].ringIdx) / 2) / MAX_RING;
      const baseAlpha = 0.035 + (1 - ringDepth * 0.4) * 0.035;
      const alpha     = baseAlpha + edgeGlow * 0.42;
      const lineW     = (0.55 + edgeGlow * 1.3) * devicePixelRatio;

      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
      ctx.strokeStyle = `rgba(${EDGE_RGB}, ${alpha})`;
      ctx.lineWidth   = lineW;
      ctx.stroke();
    });

    // Nodes — subtle at rest, vivid near cursor
    pts.forEach((p, i) => {
      const g     = glows[i];
      const depth = 1 - (p.ringIdx / MAX_RING) * 0.3;
      const r     = (1.8 + depth * 1.5 + g * 3.8) * devicePixelRatio;
      const alpha = 0.16 + depth * 0.10 + g * 0.48;

      // Glow halo
      if (g > 0.01) {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5.5);
        grd.addColorStop(0, `rgba(${NODE_RGB}, ${g * 0.22})`);
        grd.addColorStop(1, `rgba(${NODE_RGB}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 5.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Red fill
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${NODE_RGB}, ${alpha})`;
      ctx.fill();

      // Dark outline
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,0,0, ${0.22 + g * 0.28})`;
      ctx.lineWidth   = (0.55 + g * 0.5) * devicePixelRatio;
      ctx.stroke();
    });
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  section.addEventListener('mousemove', e => {
    const rect = section.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, { passive: true });

  section.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  }, { passive: true });

  resize();
  window.addEventListener('resize', resize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(section);
  }

  requestAnimationFrame(loop);
})();
