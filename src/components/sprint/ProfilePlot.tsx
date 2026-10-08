"use client";

import React, { useMemo } from "react";
import { colorFor, type SpeedPlotSubject } from "./SpeedPlot";
import styles from "./sprint.module.css";

const W = 820;
const H = 440;
const M = { l: 58, r: 24, t: 24, b: 54 };
const R = 6; // punktradius

const fmtTick = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

function niceStep(range: number, target = 6) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

/** Aksegrenser med litt luft rundt datapunktene, avrundet til pene tick-verdier. */
function domain(values: number[]): { lo: number; hi: number; step: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = span > 1e-9 ? span * 0.25 : Math.max(max * 0.15, 0.2);
  let lo = Math.max(0, min - pad);
  let hi = max + pad;
  const step = niceStep(hi - lo);
  lo = Math.floor(lo / step + 1e-9) * step;
  hi = Math.ceil(hi / step - 1e-9) * step;
  return { lo, hi, step };
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface Placed {
  id: string;
  name: string;
  color: string;
  px: number;
  py: number;
  ex: number; // endepunkt for utstikkeren
  ey: number;
  tx: number; // tekstposisjon
  ty: number;
  anchor: "start" | "middle" | "end";
}

export default function ProfilePlot({ subjects }: { subjects: SpeedPlotSubject[] }) {
  // Samme rekkefølge og farger som i fartsplottet.
  const usable = useMemo(
    () => subjects.filter((s) => s.fit.vmax !== null && s.fit.a0 !== null),
    [subjects]
  );

  const layout = useMemo(() => {
    if (usable.length === 0) return null;
    const dx = domain(usable.map((s) => s.fit.a0!));
    const dy = domain(usable.map((s) => s.fit.vmax!));
    const sx = (x: number) => M.l + ((x - dx.lo) / (dx.hi - dx.lo)) * (W - M.l - M.r);
    const sy = (y: number) => H - M.b - ((y - dy.lo) / (dy.hi - dy.lo)) * (H - M.t - M.b);

    const points = usable.map((s, i) => ({
      id: s.id,
      name: s.name,
      color: colorFor(i),
      px: sx(s.fit.a0!),
      py: sy(s.fit.vmax!),
    }));

    // Plasser navnelapper med utstikker; unngå overlapp med andre lapper og punkter.
    const dirs: [number, number][] = [
      [1, -1], [1, 1], [-1, -1], [-1, 1], [1, 0], [-1, 0], [0, -1], [0, 1],
    ];
    const dists = [28, 44, 62, 82];
    const boxes: Box[] = [];
    const placed: Placed[] = [];
    const overlap = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

    for (const p of points) {
      const w = p.name.length * 7.4 + 6;
      let result: Placed | null = null;
      let resultBox: Box | null = null;

      const candidate = (ux: number, uy: number, d: number): { pl: Placed; box: Box } => {
        const len = Math.hypot(ux, uy);
        const ex = p.px + (ux / len) * d;
        const ey = p.py + (uy / len) * d;
        if (ux > 0) {
          return { pl: { ...p, ex, ey, tx: ex + 4, ty: ey + 4.5, anchor: "start" }, box: { x0: ex + 2, x1: ex + 4 + w, y0: ey - 10, y1: ey + 10 } };
        }
        if (ux < 0) {
          return { pl: { ...p, ex, ey, tx: ex - 4, ty: ey + 4.5, anchor: "end" }, box: { x0: ex - 4 - w, x1: ex - 2, y0: ey - 10, y1: ey + 10 } };
        }
        // rett opp eller ned: sentrert tekst
        const ty = uy < 0 ? ey - 6 : ey + 16;
        return {
          pl: { ...p, ex, ey, tx: ex, ty, anchor: "middle" },
          box: { x0: ex - w / 2, x1: ex + w / 2, y0: uy < 0 ? ey - 20 : ey, y1: uy < 0 ? ey : ey + 20 },
        };
      };

      outer: for (const d of dists) {
        for (const [ux, uy] of dirs) {
          const { pl, box } = candidate(ux, uy, d);
          const inside = box.x0 >= M.l && box.x1 <= W - M.r && box.y0 >= M.t && box.y1 <= H - M.b;
          if (!inside) continue;
          if (boxes.some((b) => overlap(b, box))) continue;
          const hitsPoint = points.some(
            (q) => q.px > box.x0 - R - 2 && q.px < box.x1 + R + 2 && q.py > box.y0 - R - 2 && q.py < box.y1 + R + 2
          );
          if (hitsPoint) continue;
          result = pl;
          resultBox = box;
          break outer;
        }
      }
      if (!result) {
        const c = candidate(1, -1, 28);
        result = c.pl;
        resultBox = c.box;
      }
      boxes.push(resultBox!);
      placed.push(result);
    }

    const xTicks: number[] = [];
    for (let x = dx.lo; x <= dx.hi + 1e-9; x += dx.step) xTicks.push(x);
    const yTicks: number[] = [];
    for (let y = dy.lo; y <= dy.hi + 1e-9; y += dy.step) yTicks.push(y);

    return { sx, sy, xTicks, yTicks, placed };
  }, [usable]);

  if (!layout) {
    return (
      <div className={styles.empty}>
        Ingen testpersoner har nok målinger ennå. Legg inn minst to ulike strekninger for en testperson.
      </div>
    );
  }

  const { sx, sy, xTicks, yTicks, placed } = layout;

  return (
    <div id="profile-plot">
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plotSvg} role="img" aria-label="Profilplott: v_max mot a_0 for hver testperson">
        {yTicks.map((y) => (
          <g key={`y${y}`}>
            <line x1={M.l} x2={W - M.r} y1={sy(y)} y2={sy(y)} className={styles.gridLine} />
            <line x1={M.l - 6} x2={M.l} y1={sy(y)} y2={sy(y)} className={styles.axisLine} />
            <text x={M.l - 10} y={sy(y) + 4} textAnchor="end" className={styles.axisText}>
              {fmtTick(y)}
            </text>
          </g>
        ))}
        {xTicks.map((x) => (
          <g key={`x${x}`}>
            <line x1={sx(x)} x2={sx(x)} y1={M.t} y2={H - M.b} className={styles.gridLine} />
            <line x1={sx(x)} x2={sx(x)} y1={H - M.b} y2={H - M.b + 6} className={styles.axisLine} />
            <text x={sx(x)} y={H - M.b + 24} textAnchor="middle" className={styles.axisText}>
              {fmtTick(x)}
            </text>
          </g>
        ))}
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className={styles.axisLine} />
        <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} className={styles.axisLine} />
        <text x={(M.l + W - M.r) / 2} y={H - 10} textAnchor="middle" className={styles.axisLabel}>
          a<tspan baselineShift="sub" fontSize="10">0</tspan> (m/s²)
        </text>
        <text
          transform={`translate(16 ${(M.t + H - M.b) / 2}) rotate(-90)`}
          textAnchor="middle"
          className={styles.axisLabel}
        >
          v<tspan baselineShift="sub" fontSize="10">max</tspan> (m/s)
        </text>

        {placed.map((p) => {
          const dxl = p.ex - p.px;
          const dyl = p.ey - p.py;
          const len = Math.hypot(dxl, dyl) || 1;
          const x1 = p.px + (dxl / len) * R;
          const y1 = p.py + (dyl / len) * R;
          return (
            <g key={p.id}>
              <line x1={x1} y1={y1} x2={p.ex} y2={p.ey} stroke={p.color} strokeWidth={1.4} />
              <circle cx={p.px} cy={p.py} r={R} fill={p.color} stroke="var(--surface)" strokeWidth={1.5} />
              <text x={p.tx} y={p.ty} textAnchor={p.anchor} className={styles.pointLabel} fill={p.color}>
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
