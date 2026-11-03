"use client";

import React from "react";
import styles from "./sprint.module.css";
import s2 from "./samling2.module.css";

export interface ChartSeries {
  id: string;
  label?: string;
  color: string;
  pts: [number, number][];
  dashed?: boolean;
  width?: number;
}

export interface ChartDots {
  id: string;
  label?: string;
  color: string;
  pts: [number, number][];
  r?: number;
  hollow?: boolean;
}

/** Horisontale streker [x1, x2, y], for eksempel gjennomsnittsfart over hver delstrekning. */
export interface ChartSteps {
  id: string;
  label?: string;
  color: string;
  items: [number, number, number][];
}

export interface ChartBars {
  id: string;
  label?: string;
  color: string;
  pts: [number, number][];
  barWidth?: number; // i x-enheter
}

export interface ChartVLine {
  x: number;
  label?: string;
}

interface Props {
  series?: ChartSeries[];
  dots?: ChartDots[];
  steps?: ChartSteps[];
  bars?: ChartBars[];
  vlines?: ChartVLine[];
  xLabel: string;
  yLabel: string;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  width?: number;
  height?: number;
  legend?: boolean;
  zeroLine?: boolean;
  ariaLabel?: string;
}

const fmtTick = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");

function niceStep(range: number, target = 6) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

export default function LineChart({
  series = [],
  dots = [],
  steps = [],
  bars = [],
  vlines = [],
  xLabel,
  yLabel,
  xMax,
  yMin,
  yMax,
  width = 640,
  height = 340,
  legend = true,
  zeroLine = false,
  ariaLabel,
}: Props) {
  const M = { l: 58, r: 20, t: 18, b: 50 };

  const allX: number[] = [
    ...series.flatMap((s) => s.pts.map((p) => p[0])),
    ...dots.flatMap((s) => s.pts.map((p) => p[0])),
    ...steps.flatMap((s) => s.items.flatMap((i) => [i[0], i[1]])),
    ...bars.flatMap((s) => s.pts.map((p) => p[0])),
  ];
  const allY: number[] = [
    ...series.flatMap((s) => s.pts.map((p) => p[1])),
    ...dots.flatMap((s) => s.pts.map((p) => p[1])),
    ...steps.flatMap((s) => s.items.map((i) => i[2])),
    ...bars.flatMap((s) => s.pts.map((p) => p[1])),
  ].filter((v) => isFinite(v));

  const xHi = xMax ?? Math.max(1, ...allX);
  // Søyler ved høyre kant skal ikke kuttes av: gi plass til halve søylebredden.
  const barPad = bars.length ? Math.max(...bars.map((b) => b.barWidth ?? xHi / 30)) / 2 : 0;
  const xDom = xHi + barPad;
  const dataMin = allY.length ? Math.min(...allY) : 0;
  const dataMax = allY.length ? Math.max(...allY) : 1;
  const yLo0 = yMin ?? Math.min(0, dataMin);
  const yHi0 = yMax ?? (dataMax <= yLo0 ? yLo0 + 1 : dataMax);

  const yStep = niceStep(yHi0 - yLo0 || 1);
  const yLo = yMin ?? Math.floor(yLo0 / yStep) * yStep;
  const yHi = yMax ?? Math.ceil((yHi0 + 1e-9) / yStep) * yStep;
  const xStep = niceStep(xHi);

  const sx = (x: number) => M.l + (Math.min(x, xDom) / xDom) * (width - M.l - M.r);
  const sy = (y: number) => height - M.b - ((y - yLo) / (yHi - yLo)) * (height - M.t - M.b);

  const xTicks: number[] = [];
  for (let x = 0; x <= xHi + 1e-9; x += xStep) xTicks.push(x);
  const yTicks: number[] = [];
  for (let y = Math.ceil(yLo / yStep) * yStep; y <= yHi + 1e-9; y += yStep) yTicks.push(Math.round(y / yStep) * yStep);

  const path = (pts: [number, number][]) => {
    let d = "";
    let pen = false;
    for (const [x, y] of pts) {
      if (!isFinite(y) || x > xHi + 1e-9) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)} `;
      pen = true;
    }
    return d;
  };

  const legendItems = [
    ...series.filter((s) => s.label).map((s) => ({ id: `s-${s.id}`, color: s.color, label: s.label!, kind: "line" as const, dashed: s.dashed })),
    ...steps.filter((s) => s.label).map((s) => ({ id: `t-${s.id}`, color: s.color, label: s.label!, kind: "step" as const, dashed: false })),
    ...dots.filter((s) => s.label).map((s) => ({ id: `d-${s.id}`, color: s.color, label: s.label!, kind: "dot" as const, dashed: false })),
    ...bars.filter((s) => s.label).map((s) => ({ id: `b-${s.id}`, color: s.color, label: s.label!, kind: "bar" as const, dashed: false })),
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.plotSvg} role="img" aria-label={ariaLabel ?? yLabel}>
        {yTicks.map((y) => (
          <g key={`y${y}`}>
            <line x1={M.l} x2={width - M.r} y1={sy(y)} y2={sy(y)} className={styles.gridLine} />
            <line x1={M.l - 5} x2={M.l} y1={sy(y)} y2={sy(y)} className={styles.axisLine} />
            <text x={M.l - 9} y={sy(y) + 4} textAnchor="end" className={styles.axisText}>{fmtTick(y)}</text>
          </g>
        ))}
        {xTicks.map((x) => (
          <g key={`x${x}`}>
            <line x1={sx(x)} x2={sx(x)} y1={M.t} y2={height - M.b} className={styles.gridLine} />
            <line x1={sx(x)} x2={sx(x)} y1={height - M.b} y2={height - M.b + 5} className={styles.axisLine} />
            <text x={sx(x)} y={height - M.b + 19} textAnchor="middle" className={styles.axisText}>{fmtTick(x)}</text>
          </g>
        ))}
        <line x1={M.l} x2={M.l} y1={M.t} y2={height - M.b} className={styles.axisLine} />
        <line x1={M.l} x2={width - M.r} y1={height - M.b} y2={height - M.b} className={styles.axisLine} />
        {zeroLine && yLo < 0 && yHi > 0 && (
          <line x1={M.l} x2={width - M.r} y1={sy(0)} y2={sy(0)} className={styles.axisLine} />
        )}
        {vlines.map((v) => (
          <g key={`v${v.x}`}>
            <line x1={sx(v.x)} x2={sx(v.x)} y1={M.t} y2={height - M.b} className={styles.limitLine} />
            {v.label && (
              <text x={sx(v.x) + 4} y={M.t + 12} className={styles.limitText}>{v.label}</text>
            )}
          </g>
        ))}
        {bars.map((b) =>
          b.pts.map(([x, y], i) => {
            const w = ((b.barWidth ?? xHi / 30) / xDom) * (width - M.l - M.r);
            // Faste akser: søyler utenfor området kuttes ved kanten og merkes med verdien.
            const clipped = y > yHi || y < yLo;
            const yc = Math.min(yHi, Math.max(yLo, y));
            const y0 = sy(0);
            const y1 = sy(yc);
            return (
              <g key={`${b.id}${i}`}>
                <rect
                  x={sx(x) - w / 2}
                  y={Math.min(y0, y1)}
                  width={w}
                  height={Math.max(1, Math.abs(y1 - y0))}
                  fill={b.color}
                  opacity={0.85}
                  rx={2}
                />
                {clipped && (
                  <text
                    x={sx(x)}
                    y={y > 0 ? y1 + 13 : y1 - 5}
                    textAnchor="middle"
                    className={styles.axisText}
                    style={{ fill: "#fff", fontWeight: 700, fontSize: 11 }}
                  >
                    {y > 0 ? "▲" : "▼"}
                  </text>
                )}
                {clipped && (
                  <text
                    x={sx(x)}
                    y={y > 0 ? y1 + 28 : y1 - 20}
                    textAnchor="middle"
                    className={styles.axisText}
                    style={{ fill: "#fff", fontWeight: 700, fontSize: 10 }}
                  >
                    {fmtTick(Math.round(y))}
                  </text>
                )}
              </g>
            );
          })
        )}
        {steps.map((st) =>
          st.items.map(([x1, x2, y], i) => (
            <line
              key={`${st.id}${i}`}
              x1={sx(x1) + 1.5}
              x2={sx(x2) - 1.5}
              y1={sy(y)}
              y2={sy(y)}
              stroke={st.color}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.9}
            />
          ))
        )}
        {series.map((s) => (
          <path
            key={s.id}
            d={path(s.pts)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width ?? 2.6}
            strokeDasharray={s.dashed ? "6 5" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {dots.map((d) =>
          d.pts.map(([x, y], i) =>
            isFinite(y) ? (
              <circle
                key={`${d.id}${i}`}
                cx={sx(x)}
                cy={sy(Math.min(yHi, Math.max(yLo, y)))}
                r={d.r ?? 4.5}
                fill={d.hollow ? "var(--surface)" : d.color}
                stroke={d.color}
                strokeWidth={2}
              />
            ) : null
          )
        )}
        <text x={(M.l + width - M.r) / 2} y={height - 8} textAnchor="middle" className={styles.axisLabel}>{xLabel}</text>
        <text transform={`translate(16 ${(M.t + height - M.b) / 2}) rotate(-90)`} textAnchor="middle" className={styles.axisLabel}>{yLabel}</text>
      </svg>
      {legend && legendItems.length > 0 && (
        <div className={s2.legendRow}>
          {legendItems.map((it) => (
            <span key={it.id} className={s2.legendStatic}>
              {it.kind === "dot" ? (
                <span className={s2.legendDot} style={{ background: it.color }} />
              ) : it.kind === "bar" ? (
                <span className={s2.legendBar} style={{ background: it.color }} />
              ) : (
                <span
                  className={s2.legendLine}
                  style={
                    it.dashed
                      ? { backgroundImage: `repeating-linear-gradient(90deg, ${it.color} 0 6px, transparent 6px 10px)` }
                      : { background: it.color }
                  }
                />
              )}
              {it.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
