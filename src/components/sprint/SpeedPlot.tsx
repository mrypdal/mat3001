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

type Mode = "time" | "distance";

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
    const maxEnd = Math.max(40, ...usable.flatMap((s) => s.measurements.map((m) => m.endM)));
    const xDistMax = Math.ceil(maxEnd / 10) * 10;
    let xMax = xDistMax;
    if (mode === "time") {
      const tMax = Math.max(
        1,
        ...(visible.length ? visible : usable).map((s) => timeToDistance(xDistMax, s.fit.vmax!, s.fit.tau!))
      );
      xMax = Math.ceil(tMax * 2) / 2;
    }
    const vTop = Math.max(8, ...(visible.length ? visible : usable).map((s) => s.fit.vmax!));
    const yMax = Math.ceil(vTop + 0.5);
    return { xMax, yMax, xDistMax };
  }, [usable, hidden, mode]);

  const { xMax, yMax, xDistMax } = geometry;
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
      let v: number;
      if (mode === "time") v = velocityAt(x, vmax!, tau!);
      else v = velocityAt(timeToDistance(x, vmax!, tau!), vmax!, tau!);
      pts.push(`${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(v).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  // Målt snittfart per strekning: d/T, plottet midt i strekningen.
  const dots = (s: SpeedPlotSubject) =>
    s.measurements
      .filter((m) => m.endM > m.startM && m.timeS > 0)
      .map((m) => {
        const v = (m.endM - m.startM) / m.timeS;
        let x: number;
        if (mode === "distance") x = (m.startM + m.endM) / 2;
        else x = (timeToDistance(m.startM, s.fit.vmax!, s.fit.tau!) + timeToDistance(m.endM, s.fit.vmax!, s.fit.tau!)) / 2;
        return { x, v, label: `${m.startM}–${m.endM} m` };
      });

  if (usable.length === 0) {
    return (
      <div className={styles.empty}>
        Ingen testpersoner har nok målinger ennå. Legg inn minst to ulike strekninger for en testperson.
      </div>
    );
  }

  return (
    <div id="speed-plot">
      <div className={styles.plotControls}>
        <div className={styles.segment} role="group" aria-label="Akse">
          <button type="button" className={mode === "distance" ? styles.segActive : ""} onClick={() => setMode("distance")}>
            Fart mot distanse
          </button>
          <button type="button" className={mode === "time" ? styles.segActive : ""} onClick={() => setMode("time")}>
            Fart mot tid
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plotSvg} role="img" aria-label="Fartskurver for testpersonene">
        {/* rutenett og akser */}
        {yTicks.map((y) => (
          <g key={`y${y}`}>
            <line x1={M.l} x2={W - M.r} y1={sy(y)} y2={sy(y)} className={styles.gridLine} />
            <text x={M.l - 8} y={sy(y) + 4} textAnchor="end" className={styles.axisText}>
              {fmtTick(y)}
            </text>
          </g>
        ))}
        {xTicks.map((x) => (
          <g key={`x${x}`}>
            <line x1={sx(x)} x2={sx(x)} y1={M.t} y2={H - M.b} className={styles.gridLine} />
            <text x={sx(x)} y={H - M.b + 20} textAnchor="middle" className={styles.axisText}>
              {fmtTick(x)}
            </text>
          </g>
        ))}
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className={styles.axisLine} />
        <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} className={styles.axisLine} />
        <text x={(M.l + W - M.r) / 2} y={H - 10} textAnchor="middle" className={styles.axisLabel}>
          {mode === "distance" ? "Distanse fra start (m)" : "Tid fra start (s)"}
        </text>
        <text
          transform={`translate(16 ${(M.t + H - M.b) / 2}) rotate(-90)`}
          textAnchor="middle"
          className={styles.axisLabel}
        >
          Fart (m/s)
        </text>

        {/* 40 m-markering i distansemodus */}
        {mode === "distance" && xDistMax >= 40 && (
          <g>
            <line x1={sx(40)} x2={sx(40)} y1={M.t} y2={H - M.b} className={styles.limitLine} />
            <text x={sx(40) - 6} y={M.t + 12} textAnchor="end" className={styles.limitText}>
              modellens gyldighet ~40 m
            </text>
          </g>
        )}

        {usable.map((s, i) =>
          hidden.has(s.id) ? null : (
            <g key={s.id}>
              <path d={curve(s)} fill="none" stroke={colorFor(i)} strokeWidth={2.5} strokeLinecap="round" />
              {dots(s).map((d, j) => (
                <circle key={j} cx={sx(d.x)} cy={sy(d.v)} r={4.5} fill={colorFor(i)} stroke="var(--surface)" strokeWidth={1.5}>
                  <title>{`${s.name}, ${d.label}: ${fmtTick(d.v)} m/s (målt snittfart)`}</title>
                </circle>
              ))}
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
            <span className={styles.legendSub}>
              v<sub>max</sub> {fmtTick(s.fit.vmax!)} m/s · τ {fmtTick(s.fit.tau!)} s
            </span>
          </button>
        ))}
      </div>
      <p className={styles.plotNote}>
        Kurvene er modellen v(t) = v<sub>max</sub>(1 − e<sup>−t/τ</sup>). Prikkene er målt gjennomsnittsfart på hver
        strekning (lengde / tid), plottet midt i strekningen.
      </p>
    </div>
  );
}
