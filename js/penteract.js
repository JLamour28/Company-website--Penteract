/* ─── PENTERACT SYMBOL — Animated 5D Hypercube ─── */
(function () {
  const canvas = document.getElementById('penteractCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, cx, cy, scale;
  let angle = 0;

  // Penteract has 2^5 = 32 vertices, all ±1 in 5 dimensions
  function buildVertices() {
    const verts = [];
    for (let i = 0; i < 32; i++) {
      verts.push([
        (i >> 0 & 1) * 2 - 1,
        (i >> 1 & 1) * 2 - 1,
        (i >> 2 & 1) * 2 - 1,
        (i >> 3 & 1) * 2 - 1,
        (i >> 4 & 1) * 2 - 1,
      ]);
    }
    return verts;
  }

  // Edges: connect vertices that differ by exactly one bit
  function buildEdges(verts) {
    const edges = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        let diff = 0;
        for (let d = 0; d < 5; d++) {
          if (verts[i][d] !== verts[j][d]) diff++;
        }
        if (diff === 1) edges.push([i, j]);
      }
    }
    return edges;
  }

  // Rotate in a 2D plane (dimensions a and b) by angle θ
  function rotate(v, a, b, theta) {
    const r = v.slice();
    r[a] = v[a] * Math.cos(theta) - v[b] * Math.sin(theta);
    r[b] = v[a] * Math.sin(theta) + v[b] * Math.cos(theta);
    return r;
  }

  // Project 5D → 2D via perspective projection on each dimension
  function project(v) {
    // Sequential perspective projection: 5D→4D→3D→2D
    const d = 2.8; // perspective distance
    let p = v.slice();

    // 5D → 4D
    const w5 = d / (d - p[4]);
    p = [p[0] * w5, p[1] * w5, p[2] * w5, p[3] * w5];

    // 4D → 3D
    const w4 = d / (d - p[3]);
    p = [p[0] * w4, p[1] * w4, p[2] * w4];

    // 3D → 2D
    const w3 = d / (d - p[2]);
    return [p[0] * w3, p[1] * w3];
  }

  const vertices = buildVertices();
  const edges    = buildEdges(vertices);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W  = canvas.width  = rect.width  * devicePixelRatio;
    H  = canvas.height = rect.height * devicePixelRatio;
    cx = W / 2;
    cy = H / 2;
    scale = Math.min(W, H) * 0.22;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Composite slow rotations across multiple planes
    const a = t * 0.00028;
    const b = t * 0.00019;
    const c = t * 0.00013;
    const d = t * 0.00023;
    const e = t * 0.00017;

    // Transform all vertices
    const transformed = vertices.map(v => {
      let r = v.slice();
      r = rotate(r, 0, 1, a);
      r = rotate(r, 2, 3, b);
      r = rotate(r, 0, 2, c);
      r = rotate(r, 1, 4, d);
      r = rotate(r, 3, 4, e);
      return r;
    });

    // Project to 2D screen coords
    const pts = transformed.map(v => {
      const [px, py] = project(v);
      return [cx + px * scale, cy + py * scale];
    });

    // Depth value for each vertex (use z after rotation for shading)
    const depths = transformed.map(v => v[2]);
    const minD = Math.min(...depths);
    const maxD = Math.max(...depths);
    const depthNorm = v => (v - minD) / (maxD - minD); // 0 = back, 1 = front

    // Draw edges
    edges.forEach(([i, j]) => {
      const dAvg = (depthNorm(depths[i]) + depthNorm(depths[j])) / 2;
      const alpha = 0.12 + dAvg * 0.42;
      const lineW = 0.5 + dAvg * 1.2;

      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.strokeStyle = `rgba(10, 173, 173, ${alpha})`;
      ctx.lineWidth = lineW;
      ctx.stroke();
    });

    // Draw nodes
    pts.forEach((p, i) => {
      const dn = depthNorm(depths[i]);
      const r = 1.8 + dn * 3.2;
      const alpha = 0.35 + dn * 0.65;

      // Outer glow
      const grd = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3.5);
      grd.addColorStop(0, `rgba(10, 173, 173, ${alpha * 0.35})`);
      grd.addColorStop(1, 'rgba(10, 173, 173, 0)');
      ctx.beginPath();
      ctx.arc(p[0], p[1], r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Node
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10, 173, 173, ${alpha})`;
      ctx.fill();
    });
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  // Init
  resize();
  window.addEventListener('resize', () => {
    resize();
  }, { passive: true });

  // Use ResizeObserver for canvas parent size changes
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(canvas);
  }

  requestAnimationFrame(loop);
})();
