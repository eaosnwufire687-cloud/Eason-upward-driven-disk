/* Canvas rendering for the upward-driven disk site. */
(function (global) {
  "use strict";

  var C = {
    ink: "#12263a",
    blue: "#1f4e79",
    blueSoft: "rgba(31,78,121,0.55)",
    gold: "#c87a14",
    red: "#c0392b",
    grid: "#e6ecf2",
    muted: "#7b8794",
    paper: "#eef3f8"
  };

  function fit(cv) {
    var dpr = window.devicePixelRatio || 1;
    var r = cv.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  function mapper(w, h, halfWorld) {
    var s = Math.min(w, h) / (2 * halfWorld);
    return {
      s: s,
      X: function (y) { return w / 2 + y * s; },
      Y: function (z) { return h / 2 - z * s; }
    };
  }

  /* ------------------------------------------------------------------ */
  /* the apparatus view                                                  */
  /* ------------------------------------------------------------------ */
  function scene(cv, p, st, trail) {
    var f = fit(cv), ctx = f.ctx;
    var half = Math.max(0.105, p.a * 1.34);
    var m = mapper(f.w, f.h, half);

    ctx.fillStyle = "#fbfcfe";
    ctx.fillRect(0, 0, f.w, f.h);

    // axes
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, m.Y(0)); ctx.lineTo(f.w, m.Y(0));
    ctx.moveTo(m.X(0), 0); ctx.lineTo(m.X(0), f.h);
    ctx.stroke();

    // locus of the contact point (|OC| = a)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(192,57,43,0.30)";
    ctx.beginPath();
    ctx.arc(m.X(0), m.Y(0), p.a * m.s, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    var cy = st[0], cz = st[1], beta = Math.atan2(st[0], st[1]) + st[3];
    var cx = m.X(cy), cyy = m.Y(cz);

    // the disk itself
    var grad = ctx.createRadialGradient(cx, cyy, p.a * m.s * 0.2,
                                        cx, cyy, p.a * m.s);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#e3ecf5");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cyy, p.a * m.s, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // trail of C, drawn on top so it stays readable over the disk face
    if (trail && trail.length > 1) {
      ctx.strokeStyle = "rgba(192,57,43,0.50)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(m.X(trail[0][0]), m.Y(trail[0][1]));
      for (var i = 1; i < trail.length; i++)
        ctx.lineTo(m.X(trail[i][0]), m.Y(trail[i][1]));
      ctx.stroke();
    }

    // radius line to the mark M -> shows the spin
    var mx = cx + p.a * m.s * Math.sin(beta);
    var my = cyy - p.a * m.s * Math.cos(beta);
    ctx.strokeStyle = "rgba(200,122,20,0.85)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cyy);
    ctx.lineTo(mx, my);
    ctx.stroke();

    ctx.fillStyle = C.gold;
    ctx.fillRect(mx - 4, my - 4, 8, 8);

    // centre of mass
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(cx, cyy, 3.4, 0, 2 * Math.PI);
    ctx.fill();

    // pivot O
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(m.X(0), m.Y(0), 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.muted;
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("O", m.X(0) + 8, m.Y(0) - 8);
  }

  /* ------------------------------------------------------------------ */
  /* the (Y,Z) phase portrait                                            */
  /* ------------------------------------------------------------------ */
  function phase(cv, p, pts, st, halfHint) {
    var f = fit(cv), ctx = f.ctx;
    var half = Math.min(p.a * 1.16, Math.max(0.012, halfHint || p.a * 0.35));
    var m = mapper(f.w, f.h, half);

    ctx.fillStyle = "#fbfcfe";
    ctx.fillRect(0, 0, f.w, f.h);

    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, m.Y(0)); ctx.lineTo(f.w, m.Y(0));
    ctx.moveTo(m.X(0), 0); ctx.lineTo(m.X(0), f.h);
    ctx.stroke();

    if (p.a <= half * 1.02) {
      ctx.strokeStyle = "rgba(31,78,121,0.16)";
      ctx.beginPath();
      ctx.arc(m.X(0), m.Y(0), p.a * m.s, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(2, 2, f.w - 4, f.h - 4);
    ctx.clip();
    ctx.fillStyle = "rgba(31,78,121,0.30)";
    var n = pts.length;
    for (var i = 0; i < n; i++) ctx.fillRect(m.X(pts[i][0]), m.Y(pts[i][1]), 1.4, 1.4);
    ctx.restore();

    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(m.X(st[0]), m.Y(st[1]), 3.2, 0, 2 * Math.PI);
    ctx.fill();
  }

  /* ------------------------------------------------------------------ */
  /* lambda_max(W) chart                                                 */
  /* ------------------------------------------------------------------ */
  function chart(cv, data, Wnow) {
    var f = fit(cv), ctx = f.ctx;
    var pad = { l: 46, r: 14, t: 16, b: 46 };
    var w = f.w - pad.l - pad.r, h = f.h - pad.t - pad.b;

    ctx.fillStyle = "#fbfcfe";
    ctx.fillRect(0, 0, f.w, f.h);

    var x0 = 0.4, x1 = 10.0, y1 = 1.1;
    function X(Wc) { return pad.l + (Wc - x0) / (x1 - x0) * w; }
    function Y(v) { return pad.t + h - v / y1 * h; }

    // chaotic band
    ctx.fillStyle = "rgba(31,78,121,0.07)";
    ctx.fillRect(X(x0), pad.t, X(4.6) - X(x0), h);

    // grid
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var v = 0; v <= 1.0; v += 0.2) {
      ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + w, Y(v));
    }
    ctx.stroke();

    // axis
    ctx.strokeStyle = "#c9d3dd";
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + h);
    ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + w, Y(0));
    ctx.stroke();

    // curve
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (var i = 0; i < data.W.length; i++) {
      var px = X(data.W[i] * 100), py = Y(data.lam[i]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = C.blue;
    for (i = 0; i < data.W.length; i++)
      ctx.fillRect(X(data.W[i] * 100) - 1.5, Y(data.lam[i]) - 1.5, 3, 3);

    // current operating point
    if (isFinite(Wnow)) {
      var cx = X(Wnow * 100);
      ctx.strokeStyle = C.gold;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, pad.t); ctx.lineTo(cx, pad.t + h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // labels
    ctx.fillStyle = C.muted;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    for (var t = 2; t <= 10; t += 2) ctx.fillText(String(t), X(t), pad.t + h + 16);
    ctx.fillText("W  (cm/s)", pad.l + w / 2, pad.t + h + 34);
    ctx.textAlign = "right";
    ctx.fillText("0", pad.l - 6, Y(0) + 4);
    ctx.fillText("0.5", pad.l - 6, Y(0.5) + 4);
    ctx.fillText("1.0", pad.l - 6, Y(1.0) + 4);
    ctx.textAlign = "left";
    ctx.fillText("λmax (1/s)", pad.l - 6, pad.t - 2);
  }

  global.Render = { scene: scene, phase: phase, chart: chart, colors: C };
})(window);
