"use client";

import React, { useMemo, useState } from "react";
import { timeToDistance, velocityAt, type KellerFit, type SprintMeasurement } from "@/lib/sprintModel";
import styles from "./sprint.module.css";

export interface SpeedPlotSubject {
  id: string;
  name: string;
  fit: KellerFit;
  measurements: SprintMeasurement[];
}

type Mode = "distance" | "time" | "position";

const W = 820;
const H = 440;
const M = { l: 58, r: 24, t: 24, b: 54 };

const colorFor = (i: number) => `hsl(${Math.round((i * 137.508) % 360)} 72% 48%)`;
const fmtTick = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

function niceStep(range: number, target = 6) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

/** Modellens posisjon (m) som funksjon av tid: x(t) = vmax (t - τ (1 - e^{-t/τ})). */
const positionAt = (t: number, vmax: number, tau: number) => vmax * (t - tau * (1 - Math.exp(-t / tau)));

export default function SpeedPlot({ subjects }: { subjects: SpeedPlotSubject[] }) {
  const [mode, setMode] = useState<Mode>("distance");
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const usable = useMemo(
    () => subjects.filter((s) => s.fit.vmax !== null && s.fit.tau !== null),
    [subjects]
  );

  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const geometry = useMemo(() => {
    const visible = usable.filter((s) => !hidden.has(s.id));
    const shown = visible.length ? visible : usable;
    const maxEnd = Math.max(40, ...usable.flatMap((s) => s.measurements.map((m) => m.endM)));
    const xDistMax = Math.ceil(maxEnd / 10) * 10;
    let xMax = xDistMax;
    if (mode !== "distance") {
      const tMax = Math.max(1, ...shown.map((s) => timeToDistance(xDistMax, s.fit.vmax!, s.fit.tau!)));
      xMax = Math.ceil(tMax * 2) / 2;
    }
    let yMax: number;
    if (mode === "position") {
      yMax = xDistMax;
    } else {
      const vTop = Math.max(8, ...shown.map((s) => s.fit.vmax!));
      yMax = Math.ceil(vTop + 0.5);
    }
    return { xMax, yMax, xDistMax };
  }, [usable, hidden, mode]);

  const { xMax, yMax } = geometry;
  const sx = (x: number) => M.l + (x / xMax) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - (v / yMax) * (H - M.t - M.b);

  const xStep = niceStep(xMax);
  const yStep = niceStep(yMax, 6);
  const xTicks: number[] = [];
  for (let x = 0; x <= xMax + 1e-9; x += xStep) xTicks.push(x);
  const yTicks: number[] = [];
  for (let y = 0; y <= yMax + 1e-9; y += yStep) yTicks.push(y);

  const curve = (s: SpeedPlotSubject) => {
    const { vmax, tau } = s.fit;
    const N = 160;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = (xMax * i) / N;
      let y: number;
      if (mode === "time") y = velocityAt(x, vmax!, tau!);
      else if (mode === "position") y = positionAt(x, vmax!, tau!);
      else y = velocityAt(timeToDistance(x, vmax!, tau!), vmax!, tau!);
      pts.push(`${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  if (usable.length === 0) {
    return (
      <div className={styles.empty}>
        Ingen testpersoner har nok målinger ennå. Legg inn minst to ulike strekninger for en testperson.
      </div>
    );
  }

  const xLabel = mode === "distance" ? "Distanse fra start (m)" : "Tid fra start (s)";
  const yLabel = mode === "position" ? "Distanse fra start (m)" : "Fart (m/s)";

  return (
    <div id="speed-plot">
      <div className={styles.plotControls}>
        <div className={styles.segment} role="group" aria-label="Plottype">
          <button type="button" className={mode === "distance" ? styles.segActive : ""} onClick={() => setMode("distance")}>
            Fart mot distanse
          </button>
          <button type="button" className={mode === "time" ? styles.segActive : ""} onClick={() => setMode("time")}>
            Fart mot tid
          </button>
          <button type="button" className={mode === "position" ? styles.segActive : ""} onClick={() => setMode("position")}>
            Distanse mot tid
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plotSvg} role="img" aria-label="Kurver for testpersonene">
        {/* rutenett og akser */}
        {yTicks.map((y) => (
          <g key={`y${y}`}>
            <line x1={M.l} x2={W - M.r} y1={sy(y)} y2={sy(y)} className={styles.gridLine} />
            <line x1={M.l - 6} x2={M.l} y1={sy(y)} y2={sy(y)} className={styles.axisLine} />
            <text x={M.l - 8} y={sy(y) + 4} textAnchor="end" className={styles.axisText}>
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
          {xLabel}
        </text>
        <text
          transform={`translate(16 ${(M.t + H - M.b) / 2}) rotate(-90)`}
          textAnchor="middle"
          className={styles.axisLabel}
        >
          {yLabel}
        </text>

        {usable.map((s, i) =>
          hidden.has(s.id) ? null : (
            <g key={s.id}>
              <path d={curve(s)} fill="none" stroke={colorFor(i)} strokeWidth={2.5} strokeLinecap="round" />
            </g>
          )
        )}
      </svg>

      <div className={styles.legend}>
        {usable.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`${styles.legendItem} ${hidden.has(s.id) ? styles.legendOff : ""}`}
            onClick={() => toggle(s.id)}
            title="Klikk for å vise/skjule"
          >
            <span className={styles.swatch} style={{ background: colorFor(i) }} />
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
