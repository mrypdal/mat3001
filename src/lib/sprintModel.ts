/**
 * Kellers kinematiske sprintmodell (J.B. Keller, 1973).
 *
 *   dv/dt = f - v/τ   =>   v(t) = vmax (1 - e^{-t/τ}),   vmax = f τ
 *   x(t)  = vmax ( t - τ (1 - e^{-t/τ}) )
 *
 * En måling er (startM, endM, timeS): tiden en løper bruker fra startM til endM.
 * Alle løp starter stillestående ved 0 m (t = 0), så en måling som 10–20 m er en
 * flyingtid: modellen regner T = t(endM) − t(startM), der t(x) er tiden fra start til x.
 * Estimeringen minimerer sum av kvadrerte tidsavvik over alle målingene.
 */

export interface SprintMeasurement {
  startM: number;
  endM: number;
  timeS: number;
}

export interface KellerFit {
  vmax: number | null; // m/s
  tau: number | null; // s
  a0: number | null; // m/s^2, startakselerasjon vmax/τ
  pmax: number | null; // W/kg, vmax^2/(4τ)
  rms: number | null; // s, RMS-avvik mellom modell og målt tid
  seVmax: number | null; // m/s, standardfeil (kun når antall målinger > 2)
  seTau: number | null; // s, standardfeil (kun når antall målinger > 2)
  dof: number | null; // antall målinger minus 2; 0 betyr eksakt tilpasning uten kontroll
  status: "ok" | "need-more" | "failed";
  warnings: string[];
}

/** Tid fra start til distanse x i Kellers modell (Newton på konveks, voksende funksjon). */
export function timeToDistance(x: number, vmax: number, tau: number): number {
  if (x <= 0) return 0;
  // x/vmax <= t <= x/vmax + τ. Newton fra høyre konvergerer monotont for konveks g.
  let t = x / vmax + tau;
  for (let i = 0; i < 60; i++) {
    const e = Math.exp(-t / tau);
    const g = vmax * (t - tau * (1 - e)) - x;
    const dg = vmax * (1 - e);
    if (dg <= 1e-14) {
      // Nær t=0 (x veldig liten): fall tilbake til x ≈ vmax t²/(2τ)
      return Math.sqrt((2 * tau * x) / vmax);
    }
    const next = t - g / dg;
    if (Math.abs(next - t) < 1e-12) {
      t = next;
      break;
    }
    t = next;
  }
  return t;
}

/** Modellens tid for intervallet fra d1 til d2. */
export function intervalTime(d1: number, d2: number, vmax: number, tau: number): number {
  return timeToDistance(d2, vmax, tau) - timeToDistance(d1, vmax, tau);
}

/** Fart som funksjon av tid. */
export function velocityAt(t: number, vmax: number, tau: number): number {
  return vmax * (1 - Math.exp(-t / tau));
}

const V_MIN = 2;
const V_MAX = 25;
const TAU_MIN = 0.05;
const TAU_MAX = 6;

function sse(ms: SprintMeasurement[], vmax: number, tau: number): number {
  if (!(vmax > V_MIN && vmax < V_MAX && tau > TAU_MIN && tau < TAU_MAX)) return 1e9;
  let s = 0;
  for (const m of ms) {
    const r = intervalTime(m.startM, m.endM, vmax, tau) - m.timeS;
    s += r * r;
  }
  return s;
}

function nelderMead(
  f: (p: [number, number]) => number,
  start: [number, number],
  step: [number, number]
): [number, number] {
  let simplex: [number, number][] = [
    start,
    [start[0] + step[0], start[1]],
    [start[0], start[1] + step[1]],
  ];
  let values = simplex.map(f);
  for (let iter = 0; iter < 400; iter++) {
    const order = [0, 1, 2].sort((a, b) => values[a] - values[b]);
    simplex = order.map((i) => simplex[i]);
    values = order.map((i) => values[i]);
    if (Math.abs(values[2] - values[0]) < 1e-18 && iter > 10) break;
    const cx = (simplex[0][0] + simplex[1][0]) / 2;
    const cy = (simplex[0][1] + simplex[1][1]) / 2;
    const worst = simplex[2];
    const refl: [number, number] = [cx + (cx - worst[0]), cy + (cy - worst[1])];
    const fr = f(refl);
    if (fr < values[0]) {
      const exp: [number, number] = [cx + 2 * (cx - worst[0]), cy + 2 * (cy - worst[1])];
      const fe = f(exp);
      if (fe < fr) {
        simplex[2] = exp;
        values[2] = fe;
      } else {
        simplex[2] = refl;
        values[2] = fr;
      }
    } else if (fr < values[1]) {
      simplex[2] = refl;
      values[2] = fr;
    } else {
      const con: [number, number] = [cx + 0.5 * (worst[0] - cx), cy + 0.5 * (worst[1] - cy)];
      const fc = f(con);
      if (fc < values[2]) {
        simplex[2] = con;
        values[2] = fc;
      } else {
        for (let i = 1; i < 3; i++) {
          simplex[i] = [
            simplex[0][0] + 0.5 * (simplex[i][0] - simplex[0][0]),
            simplex[0][1] + 0.5 * (simplex[i][1] - simplex[0][1]),
          ];
          values[i] = f(simplex[i]);
        }
      }
    }
  }
  const best = values.indexOf(Math.min(...values));
  return simplex[best];
}

/** Betingelsestall for (vmax, τ) basert på Jacobi-matrisen, med kolonner skalert relativt til parameterne. */
function conditionNumber(ms: SprintMeasurement[], vmax: number, tau: number): number {
  const hv = vmax * 1e-4;
  const ht = tau * 1e-4;
  let a = 0, b = 0, c = 0;
  for (const m of ms) {
    const dv =
      (intervalTime(m.startM, m.endM, vmax + hv, tau) - intervalTime(m.startM, m.endM, vmax - hv, tau)) /
      (2 * hv);
    const dt =
      (intervalTime(m.startM, m.endM, vmax, tau + ht) - intervalTime(m.startM, m.endM, vmax, tau - ht)) /
      (2 * ht);
    const sv = dv * vmax;
    const st = dt * tau;
    a += sv * sv;
    b += sv * st;
    c += st * st;
  }
  const tr = a + c;
  const det = a * c - b * b;
  const disc = Math.sqrt(Math.max(tr * tr / 4 - det, 0));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  if (l2 <= 0) return Infinity;
  return Math.sqrt(l1 / l2);
}

/** Standardfeil for (vmax, τ) fra Jacobi-matrisen: Var = σ² (JᵀJ)⁻¹, σ² = SSE/(n−2). Krever n > 2. */
function standardErrors(
  ms: SprintMeasurement[],
  vmax: number,
  tau: number,
  sseValue: number
): { seVmax: number; seTau: number } | null {
  const n = ms.length;
  if (n <= 2) return null;
  const hv = vmax * 1e-4;
  const ht = tau * 1e-4;
  let a = 0, b = 0, c = 0;
  for (const m of ms) {
    const dv =
      (intervalTime(m.startM, m.endM, vmax + hv, tau) - intervalTime(m.startM, m.endM, vmax - hv, tau)) /
      (2 * hv);
    const dt =
      (intervalTime(m.startM, m.endM, vmax, tau + ht) - intervalTime(m.startM, m.endM, vmax, tau - ht)) /
      (2 * ht);
    a += dv * dv;
    b += dv * dt;
    c += dt * dt;
  }
  const det = a * c - b * b;
  if (!(det > 0)) return null;
  const sigma2 = sseValue / (n - 2);
  return { seVmax: Math.sqrt((sigma2 * c) / det), seTau: Math.sqrt((sigma2 * a) / det) };
}

export function fitKeller(measurements: SprintMeasurement[]): KellerFit {
  const empty: KellerFit = {
    vmax: null,
    tau: null,
    a0: null,
    pmax: null,
    rms: null,
    seVmax: null,
    seTau: null,
    dof: null,
    status: "need-more",
    warnings: [],
  };
  const ms = measurements.filter(
    (m) => isFinite(m.startM) && isFinite(m.endM) && isFinite(m.timeS) && m.endM > m.startM && m.timeS > 0
  );
  const distinct = new Set(ms.map((m) => `${m.startM}-${m.endM}`));
  if (distinct.size < 2) {
    return { ...empty, warnings: ["Trenger minst to ulike strekninger."] };
  }

  // Grovt rutenett, så Nelder–Mead.
  let best: [number, number] = [9, 1];
  let bestVal = Infinity;
  for (let v = 4; v <= 16; v += 0.5) {
    for (let t = 0.2; t <= 3; t += 0.1) {
      const val = sse(ms, v, t);
      if (val < bestVal) {
        bestVal = val;
        best = [v, t];
      }
    }
  }
  let [vmax, tau] = nelderMead((p) => sse(ms, p[0], p[1]), best, [0.5, 0.1]);
  // Ett omstart for å unngå at simplekset stopper for tidlig.
  [vmax, tau] = nelderMead((p) => sse(ms, p[0], p[1]), [vmax, tau], [0.05, 0.01]);

  const finalSse = sse(ms, vmax, tau);
  if (finalSse >= 1e8) {
    return { ...empty, status: "failed", warnings: ["Fant ingen fysisk rimelig tilpasning. Sjekk tidene."] };
  }

  const rms = Math.sqrt(finalSse / ms.length);
  const warnings: string[] = [];
  const nearBound =
    vmax < V_MIN * 1.05 || vmax > V_MAX * 0.95 || tau < TAU_MIN * 1.5 || tau > TAU_MAX * 0.95;
  if (nearBound) warnings.push("Tilpasningen ligger ved grensen av tillatt område, så tidene passer dårlig med modellen.");
  if (ms.some((m) => m.endM > 40)) warnings.push("Målinger over 40 m: utmattelse kan gjøre modellen mindre presis.");
  if (vmax < 5 || vmax > 15) warnings.push("Uvanlig vmax (utenfor 5–15 m/s).");
  if (tau < 0.3 || tau > 3.5) warnings.push("Uvanlig τ (utenfor 0,3–3,5 s).");
  // Fotoceller har typisk nøyaktighet rundt 0,01–0,02 s.
  if (rms > 0.03) {
    warnings.push(
      "Tidene passer ikke særlig godt med modellen (RMS > 0,03 s). Sjekk tidene, eller bruk gjennomsnitt av flere forsøk."
    );
  }
  const se = standardErrors(ms, vmax, tau, finalSse);
  if (ms.length === 2) {
    warnings.push(
      "Bare to målinger: modellen treffer begge eksakt (to ligninger, to ukjente), så det finnes ingen kontroll og ingen usikkerhet. Legg inn en tredje strekning."
    );
  }
  if (se && (se.seTau > 0.3 * tau || se.seTau > 0.4)) {
    warnings.push(
      `τ er dårlig bestemt (±${se.seTau.toFixed(2).replace(".", ",")} s). Legg inn en måling fra 0 m, for eksempel 0–10 m eller 0–20 m, for et sikrere estimat.`
    );
  }
  const cond = conditionNumber(ms, vmax, tau);
  if (!se && cond > 200) {
    warnings.push("Dårlig betinget: strekningene skiller seg for lite til å bestemme både vmax og τ sikkert.");
  }

  return {
    vmax,
    tau,
    a0: vmax / tau,
    pmax: (vmax * vmax) / (4 * tau),
    rms,
    seVmax: se ? se.seVmax : null,
    seTau: se ? se.seTau : null,
    dof: ms.length - 2,
    status: "ok",
    warnings,
  };
}
