"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { InlineMath } from "react-katex";
import { fitKeller } from "@/lib/sprintModel";
import { speedAtDistance, timeToDistanceF, type FatigueParams } from "@/lib/sprintFatigue";
import styles from "./sprint.module.css";
import s2 from "./samling2.module.css";
import LineChart from "./LineChart";
import { colorFor } from "./SpeedPlot";

interface SprintResult {
  id: string;
  startM: number;
  endM: number;
  timeS: number;
}
interface SprintSubject {
  id: string;
  name: string;
  results: SprintResult[];
}

const fmt = (n: number, d = 2) => n.toFixed(d).replace(".", ",");

interface Row {
  id: string;
  name: string;
  color: string;
  vmax: number;
  tau: number;
  seVmax: number | null;
  seTau: number | null;
  p: FatigueParams; // med utmattelse
  p0: FatigueParams; // uten utmattelse
}

export default function Samling2Predict() {
  const [subjects, setSubjects] = useState<SprintSubject[] | null>(null);
  const [error, setError] = useState("");
  const [k, setK] = useState(0.008);
  const [showNoFatigue, setShowNoFatigue] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sprint/subjects", { cache: "no-store" });
      if (!res.ok) {
        setError("Kunne ikke hente testpersoner.");
        return;
      }
      setSubjects(await res.json());
      setError("");
    } catch {
      setError("Kunne ikke hente testpersoner.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const rows: Row[] = useMemo(() => {
    if (!subjects) return [];
    const out: Row[] = [];
    subjects.forEach((s) => {
      const f = fitKeller(s.results);
      if (f.vmax === null || f.tau === null) return;
      out.push({
        id: s.id,
        name: s.name,
        color: colorFor(out.length),
        vmax: f.vmax,
        tau: f.tau,
        seVmax: f.seVmax,
        seTau: f.seTau,
        p: { vmax: f.vmax, tau: f.tau, k },
        p0: { vmax: f.vmax, tau: f.tau, k: 0 },
      });
    });
    return out;
  }, [subjects, k]);

  const table = useMemo(() => {
    const t = rows.map((r) => ({
      r,
      t40: timeToDistanceF(40, r.p),
      t100: timeToDistanceF(100, r.p),
      t100n: timeToDistanceF(100, r.p0),
      t200: timeToDistanceF(200, r.p),
      t200n: timeToDistanceF(200, r.p0),
    }));
    const rank = (key: "t100" | "t200") => {
      const order = [...t].sort((a, b) => a[key] - b[key]);
      return new Map(order.map((x, i) => [x.r.id, i + 1]));
    };
    const r100 = rank("t100");
    const r200 = rank("t200");
    return t.map((x) => ({ ...x, rank100: r100.get(x.r.id)!, rank200: r200.get(x.r.id)! }));
  }, [rows]);

  const curves = useMemo(() => {
    const N = 100;
    const mk = (p: FatigueParams): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= N; i++) {
        const x = (200 * i) / N;
        const t = timeToDistanceF(x, p);
        pts.push([x, isFinite(t) ? speedAtDistance(x, p) : NaN]);
      }
      return pts;
    };
    return rows.map((r) => ({ r, withK: mk(r.p), without: mk(r.p0) }));
  }, [rows]);

  return (
    <div id="samling2-predict">
      <div className={s2.exIntro}>
        <p>
          Her er <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" /> fra testpersonene i Samling 1. De ble målt
          på de første 40 m, så utmattelse kan ikke leses ut av disse dataene. Du må velge <InlineMath math="k" /> selv,
          ut fra det du så i Del 2. Tidene er regnet fra løperen starter, uten reaksjonstid.
        </p>
      </div>
      <ol className={s2.tasks}>
        <li>
          Velg <InlineMath math="k" />. Hvordan vil du begrunne verdien? Se tilbake på <InlineMath math="k" /> for løperne i Del 2.
        </li>
        <li>Hvem tror du vinner 100 m? Hvem vinner 200 m? Er det samme person?</li>
        <li>Hvor sikker er du? Hva er det i dataene fra Samling 1 som gjør estimatet usikkert?</li>
        <li>Skriv ned tippetidene dine. Vi tester dem på neste samling.</li>
      </ol>

      <section className={styles.card}>
        <div className={s2.predictHead}>
          <div className={s2.sliderRow} style={{ flex: 1, minWidth: 260 }}>
            <div className={s2.sliderHead}>
              <span className={s2.sliderName}><InlineMath math="k" /> (utmattelse)</span>
              <span className={s2.sliderValue}>
                {fmt(k, 4)} <span className={styles.unit}>1/s</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.03}
              step={0.0005}
              value={k}
              onChange={(e) => setK(parseFloat(e.target.value))}
              className={s2.range}
              aria-label="k"
              id="predict-k"
            />
          </div>
          <button type="button" className={styles.preset} onClick={load}>Oppdater testpersoner</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {!subjects ? (
          <div className={styles.empty}>Laster …</div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>Ingen testpersoner har nok målinger fra Samling 1 ennå.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table} id="predict-table">
              <thead>
                <tr>
                  <th>Testperson</th>
                  <th><InlineMath math="v_{\max}" /></th>
                  <th><InlineMath math="\tau" /></th>
                  <th>40 m</th>
                  <th>100 m, <InlineMath math="k=0" /></th>
                  <th>100 m, med <InlineMath math="k" /></th>
                  <th>Plass</th>
                  <th>200 m, <InlineMath math="k=0" /></th>
                  <th>200 m, med <InlineMath math="k" /></th>
                  <th>Plass</th>
                </tr>
              </thead>
              <tbody>
                {table.map(({ r, t40, t100, t100n, t200, t200n, rank100, rank200 }) => (
                  <tr key={r.id}>
                    <td>
                      <span className={s2.colorDot} style={{ background: r.color }} />
                      <span className={styles.name}>{r.name}</span>
                    </td>
                    <td className={styles.num}>
                      {fmt(r.vmax)}
                      <span className={styles.unit}>m/s</span>
                      {r.seVmax !== null && <div className={styles.sub}>± {fmt(r.seVmax)}</div>}
                    </td>
                    <td className={styles.num}>
                      {fmt(r.tau)}
                      <span className={styles.unit}>s</span>
                      {r.seTau !== null && <div className={styles.sub}>± {fmt(r.seTau)}</div>}
                    </td>
                    <td className={styles.num}>{fmt(t40)} s</td>
                    <td className={`${styles.num} ${s2.dimCell}`}>{fmt(t100n)} s</td>
                    <td className={styles.num}><strong>{fmt(t100)} s</strong></td>
                    <td className={styles.num}>{rank100}</td>
                    <td className={`${styles.num} ${s2.dimCell}`}>{fmt(t200n)} s</td>
                    <td className={styles.num}><strong>{fmt(t200)} s</strong></td>
                    <td className={styles.num}>{rank200}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section className={styles.card} style={{ marginTop: "1.5rem" }}>
          <div className={s2.predictHead}>
            <h2 style={{ margin: 0 }}>Fart mot distanse, 0–200 m</h2>
            <label className={s2.lockBox}>
              <input type="checkbox" checked={showNoFatigue} onChange={(e) => setShowNoFatigue(e.target.checked)} />
              Vis også uten utmattelse (stiplet)
            </label>
          </div>
          <LineChart
            width={960}
            height={420}
            xLabel="Distanse fra start (m)"
            yLabel="Fart (m/s)"
            xMax={200}
            yMin={0}
            vlines={[{ x: 40, label: "40 m" }, { x: 100, label: "100 m" }]}
            series={curves.flatMap(({ r, withK, without }) => [
              { id: r.id, label: r.name, color: r.color, pts: withK },
              ...(showNoFatigue ? [{ id: `${r.id}-n`, color: r.color, pts: without, dashed: true, width: 1.8 }] : []),
            ])}
          />
        </section>
      )}
    </div>
  );
}
