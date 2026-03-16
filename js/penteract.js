/* ─── PENTERACT SYMBOL — Gosset 4_21 Polytope Style Animation ─── */
(function () {
  const canvas = document.getElementById('penteractCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, cx, cy, maxR;

  // Colors matching the logo: red nodes, dark edges
  const NODE_COLOR   = '220, 38, 38';    // #DC2626 — vivid red
  const EDGE_COLOR   = '255, 255, 255';  // white lines (visible on dark bg)
  const STROKE_COLOR = '0, 0, 0';        // node outline

  // Central node + inner hexagon + middle layer only
  const ringConfig = [
    { frac: 0,         count: 1  },  // Central node
    { frac: 110 / 420, count: 6  },  // Inner hexagon
    { frac: 210 / 420, count: 12 },  // Middle layer (now the boundary)
  ];

  // Mirrors template's 240/420 connection threshold
  const CONNECT_FRAC = 240 / 420;

  let baseVertices = [];
  let edges = [];

  function buildGraph() {
    baseVertices = [];
    ringConfig.forEach((ring, ringIdx) => {
      const r = ring.frac * maxR;
      for (let i = 0; i < ring.count; i++) {
        const angle = (i * 2 * Math.PI) / ring.count - Math.PI / 2;
        baseVertices.push({
          ox: r * Math.cos(angle),
          oy: r * Math.sin(angle),
          ringIdx,
        });
      }
    });

    edges = [];
    const threshold = maxR * CONNECT_FRAC;
    for (let i = 0; i < baseVertices.length; i++) {
      for (let j = i + 1; j < baseVertices.length; j++) {
        const dx = baseVertices[i].ox - baseVertices[j].ox;
        const dy = baseVertices[i].oy - baseVertices[j].oy;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          edges.push([i, j]);
        }
      }
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W  = canvas.width  = rect.width  * devicePixelRatio;
    H  = canvas.height = rect.height * devicePixelRatio;
    cx = W / 2;
    cy = H / 2;
    // Outermost ring is at frac 210/420 — scale so it fills 80% of the container (radius = 40%)
    maxR = Math.min(W, H) * 0.40 * (420 / 210);
    buildGraph();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    const rotation = t * 0.00020;
    const cosA = Math.cos(rotation);
    const sinA = Math.sin(rotation);

    // Rotate all vertices
    const pts = baseVertices.map(v => ({
      x: cx + v.ox * cosA - v.oy * sinA,
      y: cy + v.ox * sinA + v.oy * cosA,
      ringIdx: v.ringIdx,
    }));

    const MAX_RING = ringConfig.length - 1;

    // ── Edges — thin, charcoal-white lines like the logo ──
    edges.forEach(([i, j]) => {
      // Edges near center are slightly brighter
      const avgRing = (pts[i].ringIdx + pts[j].ringIdx) / 2;
      const depth   = 1 - (avgRing / MAX_RING) * 0.5;
      const alpha   = 0.12 + depth * 0.18;  // subtle, like logo's dark lines on white

      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
      ctx.strokeStyle = `rgba(${EDGE_COLOR}, ${alpha})`;
      ctx.lineWidth   = 1.0 * devicePixelRatio;
      ctx.stroke();
    });

    // ── Nodes — red fill with dark stroke, matching the logo exactly ──
    pts.forEach(p => {
      // Outer nodes slightly smaller to match logo's uniform-but-layered look
      const depth = 1 - (p.ringIdx / MAX_RING) * 0.35;
      const r     = (3.2 + depth * 2.8) * devicePixelRatio;

      // Soft red glow (logo has a sharp red, we add a subtle halo for depth on dark bg)
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4.5);
      grd.addColorStop(0, `rgba(${NODE_COLOR}, 0.22)`);
      grd.addColorStop(1, `rgba(${NODE_COLOR}, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Red fill — logo color
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${NODE_COLOR})`;
      ctx.fill();

      // Black stroke outline — matches logo's node style
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${STROKE_COLOR}, 0.70)`;
      ctx.lineWidth   = 1.0 * devicePixelRatio;
      ctx.stroke();
    });
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(canvas);
  }

  requestAnimationFrame(loop);
})();
