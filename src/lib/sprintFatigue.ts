/**
 * Sprintmodell med utmattelse (Samling 2).
 *
 * Kellers modell, men framdriftskraften per kilo faller eksponentielt med tiden:
 *
 *   dv/dt = a0 e^{-kt} - v/τ,   a0 = vmax/τ
 *
 * Løsning (verifiseres ved derivasjon):
 *
 *   v(t) = vmax (e^{-kt} - e^{-t/τ}) / (1 - kτ)
 *   x(t) = vmax/(1 - kτ) · [ (1 - e^{-kt})/k - τ (1 - e^{-t/τ}) ]
 *
 * For k = 0 er dette nøyaktig Kellers modell fra Samling 1.
 *
 * Måledata er kumulative tider fra start (reaksjonstiden er trukket fra) ved gitte distanser,
 * og parameterne tilpasses med minste kvadraters metode på tidene.
 */

export interface FatigueParams {
  vmax: number; // m/s
  tau: number; // s
  k: number; // 1/s, 0 = ingen utmattelse
}

export interface Splits {
  distances: number[]; // m, stigende
  times: number[]; // s fra start (reaksjonstid trukket fra)
}

export const BOUNDS = {
  vmax: [5, 16],
  tau: [0.2, 3],
  k: [0, 0.05],
} as const;

const clamp = (x: number, [lo, hi]: readonly [number, number] | readonly number[]) => Math.min(hi, Math.max(lo, x));

/** Fart (m/s) ved tid t (s). */
export function velocityAtTime(t: number, p: FatigueParams): number {
  const d = 1 - p.k * p.tau;
  return (p.vmax * (Math.exp(-p.k * t) - Math.exp(-t / p.tau))) / d;
}

/** Posisjon (m) ved tid t (s). */
export function positionAtTime(t: number, p: FatigueParams): number {
  const d = 1 - p.k * p.tau;
  const a = p.k < 1e-9 ? t : -Math.expm1(-p.k * t) / p.k;
  return (p.vmax / d) * (a - p.tau * -Math.expm1(-t / p.tau));
}

/** Tid (s) fra start til distanse x (m): løser x(t) = x ved halvering. */
export function timeToDistanceF(x: number, p: FatigueParams): number {
  if (x <= 0) return 0;
  let hi = Math.max(1, (2 * x) / p.vmax);
  let guard = 0;
  while (positionAtTime(hi, p) < x && guard++ < 40) hi *= 2;
  if (positionAtTime(hi, p) < x) return Infinity;
  let lo = 0;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (positionAtTime(mid, p) < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Fart (m/s) ved distanse x (m). */
export function speedAtDistance(x: number, p: FatigueParams): number {
  return velocityAtTime(timeToDistanceF(x, p), p);
}

export function modelTimes(distances: number[], p: FatigueParams): number[] {
  return distances.map((d) => timeToDistanceF(d, p));
}

/** Modell minus måling (s) for hvert punkt. */
export function residuals(s: Splits, p: FatigueParams): number[] {
  const m = modelTimes(s.distances, p);
  return m.map((t, i) => t - s.times[i]);
}

export function sseOf(s: Splits, p: FatigueParams): number {
  let sum = 0;
  for (const r of residuals(s, p)) {
    if (!isFinite(r)) return 1e9;
    sum += r * r;
  }
  return sum;
}

export function rmsOf(s: Splits, p: FatigueParams): number {
  return Math.sqrt(sseOf(s, p) / Math.max(1, s.distances.length));
}

/** Gjennomsnittsfart per delstrekning, med første strekning fra 0 m (tid 0). */
export function intervalSpeeds(s: Splits): { from: number; to: number; v: number }[] {
  const out: { from: number; to: number; v: number }[] = [];
  let d0 = 0;
  let t0 = 0;
  for (let i = 0; i < s.distances.length; i++) {
    const dt = s.times[i] - t0;
    if (dt > 0) out.push({ from: d0, to: s.distances[i], v: (s.distances[i] - d0) / dt });
    d0 = s.distances[i];
    t0 = s.times[i];
  }
  return out;
}

export interface FitFree {
  vmax: boolean;
  tau: boolean;
  k: boolean;
}

export interface FatigueFit {
  params: FatigueParams;
  rms: number; // s
  dof: number; // antall punkter minus antall frie parametere
}

function nelderMead(f: (x: number[]) => number, x0: number[], step: number[], iters: number): { x: number[]; v: number } {
  const n = x0.length;
  let pts: number[][] = [x0.slice()];
  for (let i = 0; i < n; i++) {
    const q = x0.slice();
    q[i] += step[i];
    pts.push(q);
  }
  let vals = pts.map(f);
  for (let it = 0; it < iters; it++) {
    const order = vals.map((_, i) => i).sort((a, b) => vals[a] - vals[b]);
    pts = order.map((i) => pts[i]);
    vals = order.map((i) => vals[i]);
    const c = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += pts[i][j] / n;
    const worst = pts[n];
    const xr = c.map((cj, j) => cj + (cj - worst[j]));
    const fr = f(xr);
    if (fr < vals[0]) {
      const xe = c.map((cj, j) => cj + 2 * (cj - worst[j]));
      const fe = f(xe);
      if (fe < fr) {
        pts[n] = xe;
        vals[n] = fe;
      } else {
        pts[n] = xr;
        vals[n] = fr;
      }
    } else if (fr < vals[n - 1]) {
      pts[n] = xr;
      vals[n] = fr;
    } else {
      const xc = c.map((cj, j) => cj + 0.5 * (worst[j] - cj));
      const fc = f(xc);
      if (fc < vals[n]) {
        pts[n] = xc;
        vals[n] = fc;
      } else {
        for (let i = 1; i <= n; i++) {
          pts[i] = pts[0].map((p0, j) => p0 + 0.5 * (pts[i][j] - p0));
          vals[i] = f(pts[i]);
        }
      }
    }
  }
  let b = 0;
  for (let i = 1; i <= n; i++) if (vals[i] < vals[b]) b = i;
  return { x: pts[b], v: vals[b] };
}

/**
 * Minste kvadraters tilpasning av de frie parameterne. Låste parametere beholder verdien i `start`.
 * Returnerer null hvis det ikke er nok data eller ingenting er fritt.
 */
export function fitFatigue(s: Splits, start: FatigueParams, free: FitFree): FatigueFit | null {
  const n = s.distances.length;
  const names = (["vmax", "tau", "k"] as const).filter((nm) => free[nm]);
  if (names.length === 0 || n < 2) return null;

  const build = (x: number[]): FatigueParams => {
    const p = { ...start };
    names.forEach((nm, i) => {
      p[nm] = clamp(x[i], BOUNDS[nm]);
    });
    return p;
  };
  const cost = (x: number[]) => sseOf(s, build(x));

  const iv = intervalSpeeds(s);
  const vLast = iv.length ? iv[iv.length - 1].v : 10;
  const vTop = iv.length ? Math.max(...iv.map((q) => q.v)) : 10;
  const candidates: Record<(typeof names)[number], number[]> = {
    vmax: [clamp(start.vmax, BOUNDS.vmax), clamp(vTop * 1.05, BOUNDS.vmax), clamp(vLast * 1.2, BOUNDS.vmax)],
    tau: [clamp(start.tau, BOUNDS.tau), 1.2],
    k: [clamp(start.k, BOUNDS.k), 0.004, 0.012],
  };
  const stepOf = { vmax: 0.5, tau: 0.15, k: 0.004 };

  let starts: number[][] = [[]];
  for (const nm of names) {
    const next: number[][] = [];
    for (const base of starts) for (const c of candidates[nm]) next.push([...base, c]);
    starts = next;
  }
  // Begrens antall startpunkter for å holde det raskt.
  if (starts.length > 8) starts = starts.filter((_, i) => i % Math.ceil(starts.length / 8) === 0);

  let best: { x: number[]; v: number } | null = null;
  for (const x0 of starts) {
    const r = nelderMead(cost, x0, names.map((nm) => stepOf[nm]), 160);
    if (!best || r.v < best.v) best = r;
  }
  if (!best) return null;
  const refined = nelderMead(cost, best.x, names.map((nm) => stepOf[nm] * 0.2), 160);
  if (refined.v < best.v) best = refined;

  const params = build(best.x);
  if (params.k < 1e-5) params.k = 0;
  return { params, rms: rmsOf(s, params), dof: n - names.length };
}
