/* UI wiring for the interactive laboratory. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var S = {
    W: 0.014,      // m/s
    k: 0.011,      // m^2/s
    a: 0.080,      // m
    y0: 0.005,     // m
    z0: 0.040,     // m
    running: true,
    speed: 1,
    t: 0,
    st: new Float64Array(4),
    trail: [],
    pts: [],
    lyap: null,
    lyapT: 0,
    maxR: 0.01,
    lam: 0,
    escaped: false
  };

  var cvScene = $("cvScene"), cvPhase = $("cvPhase"), cvChart = $("cvChart");
  var P = Disk.params(S.W, S.k, S.a);

  /* ---------------------------------------------------------------- */
  function resetState() {
    S.st[0] = S.y0; S.st[1] = S.z0; S.st[2] = 0; S.st[3] = 0;
    S.t = 0; S.trail = []; S.pts = []; S.lam = 0; S.lyapT = 0;
    S.maxR = 0.01; S.acc = 0;
    S.escaped = false;
    S.lyap = new Disk.Lyapunov(S.st, 1e-6);
    $("warn").classList.remove("on");
    $("btnPlay").textContent = S.running ? "暂停" : "开始";
    renderReadout();
  }

  function applyParams() {
    P = Disk.params(S.W, S.k, S.a);
    S.lyap = new Disk.Lyapunov(S.st, 1e-6);
    S.lyapT = 0; S.lam = 0;
    Render.chart(cvChart, window.DISK_DATA, S.W);
  }

  /* ---------------------------------------------------------------- */
  function advance(dt) {
    if (!S.running || S.escaped) return;
    var n = Math.max(1, Math.ceil(dt / (1 / 480)));
    var h = dt / n;
    for (var i = 0; i < n; i++) {
      Disk.step(S.st, P, h);
      S.lyap.advance(P, h);
      S.lyapT += h;
      if (S.lyapT >= 0.5) {
        S.lyap.renorm(0.5);
        S.lam = S.lyap.value();
        S.lyapT -= 0.5;
      }
    }
    S.t += dt;


    S.trail.push([S.st[0], S.st[1]]);
    if (S.trail.length > 1400) S.trail.shift();
    S.acc = (S.acc || 0) + dt;
    if (S.acc > 0.006) {
      S.acc = 0;
      if (S.pts.length < 60000) S.pts.push([S.st[0], S.st[1]]);
      var rr = Math.hypot(S.st[0], S.st[1]);
      S.maxR = Math.max(rr, S.maxR * 0.9965, 0.018);
    }

    if (Disk.radius(S.st) > P.a * 1.05) {
      S.escaped = true;
      S.running = false;
      $("warn").classList.add("on");
      $("btnPlay").textContent = "开始";
    }
  }

  /* ---------------------------------------------------------------- */
  var lastT = 0, acc = 0, uiT = 0;

  function loop(ts) {
    if (!lastT) lastT = ts;
    var dt = Math.min(0.05, (ts - lastT) / 1000) * S.speed;
    lastT = ts;
    advance(dt);
    Render.scene(cvScene, P, S.st, S.trail);
    Render.phase(cvPhase, P, S.pts, S.st, S.maxR * 1.28);
    uiT += 1;
    if (uiT % 6 === 0) renderReadout();
    requestAnimationFrame(loop);
  }

  function renderReadout() {
    var r = Disk.radius(S.st) * 100;
    var th = Math.atan2(S.st[0], S.st[1]) * 180 / Math.PI;
    $("vT").textContent = S.t.toFixed(1) + " s";
    $("vR").textContent = r.toFixed(2) + " cm";
    $("vTh").textContent = th.toFixed(0) + "°";
    $("vOm").textContent = S.st[2].toFixed(2);
    var lamEl = $("vLam");
    lamEl.textContent = S.lam.toFixed(2);
    lamEl.className = S.lam > 0.15 ? "hot" : (S.lam < 0.05 ? "cold" : "");
  }

  /* ---------------------------------------------------------------- */
  function bindRange(id, key, scale, fmt) {
    var el = $(id), out = $(id + "Out");
    function sync() {
      S[key] = parseFloat(el.value) * scale;
      out.textContent = fmt(S[key]);
      applyParams();
    }
    el.addEventListener("input", sync);
    sync();
  }

  bindRange("rW", "W", 0.001, function (v) { return (v * 100).toFixed(1) + " cm/s"; });
  bindRange("rk", "k", 1, function (v) { return v.toFixed(3); });
  bindRange("ra", "a", 0.001, function (v) { return (v * 100).toFixed(1) + " cm"; });
  bindRange("ry0", "y0", 0.001, function (v) { return (v * 1000).toFixed(1) + " mm"; });

  $("btnPlay").addEventListener("click", function () {
    if (S.escaped) resetState();
    S.running = !S.running;
    this.textContent = S.running ? "暂停" : "开始";
  });

  $("btnReset").addEventListener("click", function () {
    resetState();
  });

  $("btnClear").addEventListener("click", function () {
    S.pts = []; S.trail = [];
  });

  var presets = [
    ["混沌 1.4", 0.0014 * 10, 1],
    ["混沌 3.9", 0.0039 * 10, 1],
    ["周期 5.5", 0.0055 * 10, 1],
    ["规则 7.1", 0.0071 * 10, 1]
  ];
  document.querySelectorAll("[data-west]").forEach(function (b) {
    b.addEventListener("click", function () {
      var w = parseFloat(b.dataset.west) / 100;   // cm/s -> m/s
      $("rW").value = String(w * 1000);
      S.W = w; $("rWOut").textContent = (w * 100).toFixed(1) + " cm/s";
      applyParams();
      resetState();
      S.running = true;
      $("btnPlay").textContent = "暂停";
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      $("btnPlay").click();
    }
  });

  window.addEventListener("resize", function () {
    Render.chart(cvChart, window.DISK_DATA, S.W);
  });

  /* ---------------------------------------------------------------- */
  resetState();
  Render.chart(cvChart, window.DISK_DATA, S.W);

  if (window.__SHOT__) {
    // static mode for layout screenshots: pre-roll, draw one frame, stop
    for (var i = 0; i < 900; i++) advance(1 / 60);
    Render.scene(cvScene, P, S.st, S.trail);
    Render.phase(cvPhase, P, S.pts, S.st, S.maxR * 1.28);
    renderReadout();
  } else {
    requestAnimationFrame(loop);
  }
})();
