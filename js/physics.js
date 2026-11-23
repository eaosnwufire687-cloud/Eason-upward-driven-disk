/* Upward-driven disk — browser physics core.
 * Equation set (per unit mass), Maas, Am. J. Phys. 93, 620 (2025):
 *   Y' = Z*Om
 *   Z' = W - Y*Om
 *   Om' = (gY - k*Om - W*Z*Om) / (Y^2 + Z^2 + IC)
 * plus phi' = W*Y/(Y^2+Z^2), the spin of the disk about its own centre.
 */
(function (global) {
  "use strict";

  var G = 9.81;

  function params(W, k, a) {
    return { W: W, k: k, a: a, g: G, IC: 0.5 * a * a };
  }

  function deriv(s, p, out) {
    var Y = s[0], Z = s[1], Om = s[2];
    var r2 = Y * Y + Z * Z;
    out[0] = Z * Om;
    out[1] = p.W - Y * Om;
    out[2] = (p.g * Y - p.k * Om - p.W * Z * Om) / (r2 + p.IC);
    out[3] = p.W * Y / (r2 + 1e-18);
  }

  var b1 = new Float64Array(4), b2 = new Float64Array(4),
      b3 = new Float64Array(4), b4 = new Float64Array(4), tmp = new Float64Array(4);

  /** One classical RK4 step, in place. */
  function step(s, p, h) {
    deriv(s, p, b1);
    for (var i = 0; i < 4; i++) tmp[i] = s[i] + 0.5 * h * b1[i];
    deriv(tmp, p, b2);
    for (i = 0; i < 4; i++) tmp[i] = s[i] + 0.5 * h * b2[i];
    deriv(tmp, p, b3);
    for (i = 0; i < 4; i++) tmp[i] = s[i] + h * b3[i];
    deriv(tmp, p, b4);
    for (i = 0; i < 4; i++)
      s[i] += (h / 6) * (b1[i] + 2 * b2[i] + 2 * b3[i] + b4[i]);
  }

  function radius(s) { return Math.hypot(s[0], s[1]); }
  function theta(s) { return Math.atan2(s[0], s[1]); }

  /** Two-trajectory Lyapunov estimator (Benettin), norm over (Y, Z, Om). */
  function Lyapunov(s0, d0) {
    this.d0 = d0;
    this.a = Float64Array.from(s0);
    this.b = Float64Array.from(s0);
    this.b[0] += d0;
    this.sum = 0;
    this.t = 0;
  }

  Lyapunov.prototype.advance = function (p, h) {
    step(this.a, p, h);
    step(this.b, p, h);
  };

  Lyapunov.prototype.renorm = function (dt) {
    var dx = this.b[0] - this.a[0], dy = this.b[1] - this.a[1],
        dz = this.b[2] - this.a[2];
    var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!isFinite(d) || d < 1e-14) { this.reset(this.a); return; }
    this.sum += Math.log(d / this.d0);
    this.t += dt;
    var s = this.d0 / d;
    this.b[0] = this.a[0] + dx * s;
    this.b[1] = this.a[1] + dy * s;
    this.b[2] = this.a[2] + dz * s;
    this.b[3] = this.a[3];
  };

  Lyapunov.prototype.reset = function (s0) {
    this.a = Float64Array.from(s0);
    this.b = Float64Array.from(s0);
    this.b[0] += this.d0;
    this.sum = 0;
    this.t = 0;
  };

  Lyapunov.prototype.value = function () {
    return this.t > 1 ? this.sum / this.t : 0;
  };

  global.Disk = {
    G: G,
    params: params,
    deriv: deriv,
    step: step,
    radius: radius,
    theta: theta,
    Lyapunov: Lyapunov
  };
})(window);
