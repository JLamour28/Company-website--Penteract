/* ─── CTA BAND — Interactive Gosset Dots ─── */
(function () {
  const canvas  = document.getElementById('ctaBandCanvas');
  const section = document.getElementById('ctaBandSection');
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  let W, H, cx, cy, maxR;

  // Light-bg palette — matches logo on white/light green
  const NODE_RGB   = '220, 38, 38';   // vivid red
  const EDGE_RGB   = '0, 0, 0';       // dark lines

  // Same ring structure as penteract symbol (centre + inner hex + middle 12)
  const ringConfig = [
    { frac: 0,         count: 1  },
    { frac: 110 / 420, count: 6  },
    { frac: 210 / 420, count: 12 },
  ];
  const CONNECT_FRAC = 240 / 420;

  let baseVerts = [];   // { ox, oy, ringIdx }
  let edges     = [];
  let glows     = [];   // per-node glow value [0..1]

  // Mouse position relative to canvas (in CSS pixels)
  let mouseX = -9999, mouseY = -9999;
  const HOVER_RADIUS = 90;  // px (CSS)

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
    // Scale to section height so the structure fills the full section vertically
    maxR = H * 0.90;
    buildGraph();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    const rotation = t * 0.00010;  // half speed — calm background feel
    const cosA = Math.cos(rotation);
    const sinA = Math.sin(rotation);

    // Rotated screen positions
    const pts = baseVerts.map(v => ({
      x: cx + v.ox * cosA - v.oy * sinA,
      y: cy + v.ox * sinA + v.oy * cosA,
      ringIdx: v.ringIdx,
    }));

    // Update glow per node based on mouse proximity
    const mxDpr = mouseX * devicePixelRatio;
    const myDpr = mouseY * devicePixelRatio;
    const rDpr  = HOVER_RADIUS * devicePixelRatio;

    glows = glows.map((g, i) => {
      const dx   = pts[i].x - mxDpr;
      const dy   = pts[i].y - myDpr;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const target = dist < rDpr ? 1 - dist / rDpr : 0;
      // fast approach, slow decay
      return g + (target > g ? 0.14 : 0.06) * (target - g);
    });

    const MAX_RING = ringConfig.length - 1;

    // ── Edges ──
    edges.forEach(([i, j]) => {
      const edgeGlow = (glows[i] + glows[j]) / 2;
      const baseAlpha = 0.08 + (1 - (((pts[i].ringIdx + pts[j].ringIdx) / 2) / MAX_RING) * 0.4) * 0.10;
      const alpha = baseAlpha + edgeGlow * 0.55;
      const lineW = (0.8 + edgeGlow * 1.4) * devicePixelRatio;

      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
      ctx.strokeStyle = `rgba(${EDGE_RGB}, ${alpha})`;
      ctx.lineWidth   = lineW;
      ctx.stroke();
    });

    // ── Nodes ──
    pts.forEach((p, i) => {
      const g     = glows[i];
      const depth = 1 - (p.ringIdx / MAX_RING) * 0.3;
      const r     = (3.0 + depth * 2.0 + g * 4.0) * devicePixelRatio;
      const alpha = 0.30 + depth * 0.20 + g * 0.50;

      // Glow halo — only visible when mouse nearby
      if (g > 0.01) {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
        grd.addColorStop(0, `rgba(${NODE_RGB}, ${g * 0.28})`);
        grd.addColorStop(1, `rgba(${NODE_RGB}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
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
      ctx.strokeStyle = `rgba(0,0,0, ${0.45 + g * 0.35})`;
      ctx.lineWidth   = (0.8 + g * 0.6) * devicePixelRatio;
      ctx.stroke();
    });
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  // Track mouse position relative to the section
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
