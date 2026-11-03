"use client";

import React, { useMemo, useState } from "react";
import { InlineMath } from "react-katex";
import styles from "./sprint.module.css";
import s2 from "./samling2.module.css";
import LineChart from "./LineChart";
import Samling2Python from "./Samling2Python";
import { RACE_SETS, raceRow, type RaceRow } from "@/lib/sprintSamling2Data";
import {
  BOUNDS,
  fitFatigue,
  intervalSpeeds,
  modelTimes,
  speedAtDistance,
  timeToDistanceF,
  rmsOf,
  type FatigueFit,
  type FatigueParams,
  type FitFree,
  type Splits,
} from "@/lib/sprintFatigue";

const fmt = (n: number, d = 2) => n.toFixed(d).replace(".", ",");
const parseNum = (s: string) => parseFloat(s.trim().replace(",", "."));
const ms = (s: number) => fmt(s * 1000, 1);

interface Entry {
  key: string;
  label: string;
  group: string;
  stages: Record<string, RaceRow | null>; // null = egne tall
}

interface StageDef {
  id: string;
  label: string;
  defaultDistances: number[];
}

interface Row {
  d: string;
  t: string;
}
interface Table {
  rt: string;
  rows: Row[];
}

interface Exercise {
  id: 1 | 2 | 3;
  title: string;
  intro: React.ReactNode;
  tasks: React.ReactNode[];
  stages: StageDef[];
  entries: Entry[];
}

const STAGE_100: StageDef = { id: "100", label: "100 m", defaultDistances: [20, 40, 60, 80, 100] };
const STAGE_200: StageDef = { id: "200", label: "200 m", defaultDistances: [50, 100, 150, 200] };
const STAGE_MAIN: StageDef = { id: "main", label: "", defaultDistances: [20, 40, 60, 80, 100] };

const CUSTOM_GROUP = "Egne tall";

function setEntries(setId: string, group: string, order?: (a: string, b: string) => number): Entry[] {
  const names = RACE_SETS[setId].athletes.map((a) => a.name);
  if (order) names.sort(order);
  return names.map((name) => ({
    key: `${setId}:${name}`,
    label: name,
    group,
    stages: { main: raceRow(setId, name) },
  }));
}

function customEntry(stages: StageDef[]): Entry {
  return {
    key: "custom",
    label: "Egne tall",
    group: CUSTOM_GROUP,
    stages: Object.fromEntries(stages.map((s) => [s.id, null])),
  };
}

const boltLast = (a: string, b: string) => (a === "Bolt" ? 1 : b === "Bolt" ? -1 : 0);

const PAIRS: { name: string; s100: string; s200: string }[] = [
  { name: "Bolt", s100: "m100_2009", s200: "m200_2009" },
  { name: "Campbell-Brown", s100: "w100_2009", s200: "w200_2009" },
  { name: "Ferguson-McKenzie", s100: "w100_2009", s200: "w200_2009" },
];

function buildExercises(): Exercise[] {
  const ex1: Exercise = {
    id: 1,
    title: "Øvelse 1 · Kvinner 100 m",
    intro: (
      <p>
        Splittider fra finalen i 100 m for kvinner, VM 2009 i Berlin. Tidene er målt fra startskuddet, og
        reaksjonstiden RT trekkes fra automatisk.
      </p>
    ),
    tasks: [
      <>Velg en løper. Prøv å treffe tidene med glidebryterne mens <InlineMath math="k=0" />. Trykk så «Tilpass uten utmattelse» og se på avvikene: hvor på banen er de størst?</>,
      <>Trykk «Tilpass med utmattelse». Hva blir <InlineMath math="k" />, og hvor mye synker RMS?</>,
      <>Gjør det samme for flere løpere. Hvem har størst <InlineMath math="k" />? Kan forskjellen skyldes noe annet enn utmattelse?</>,
    ],
    stages: [STAGE_MAIN],
    entries: [...setEntries("w100_2009", "VM Berlin 2009 · 20 m-splitter"), customEntry([STAGE_MAIN])],
  };

  const ex2: Exercise = {
    id: 2,
    title: "Øvelse 2 · Menn 100 m",
    intro: (
      <p>
        Finalen i 100 m for menn i London 2017 (10 m-splitter), og til slutt Berlin 2009 (20 m-splitter) der
        Bolt er med.
      </p>
    ),
    tasks: [
      <>Tilpass alle åtte fra London med og uten utmattelse, og lag en liste over <InlineMath math="k" /> for hver løper.</>,
      <>Hvilke løpere har tydelig nytte av <InlineMath math="k" />, og hvilke ikke? Hva ser du i avvikene som skiller dem?</>,
      <>Gjør det samme for Berlin 2009. Bolt ligger sist i listen.</>,
      <>Hva sier tallene om hvor viktig det er å bevare farten på 100 m?</>,
    ],
    stages: [STAGE_MAIN],
    entries: [
      ...setEntries("m100_2017", "VM London 2017 · 10 m-splitter"),
      ...setEntries("m100_2009", "VM Berlin 2009 · 20 m-splitter", boltLast),
      customEntry([STAGE_MAIN]),
    ],
  };

  const ex3: Exercise = {
    id: 3,
    title: "Øvelse 3 · Fra 100 m til 200 m",
    intro: (
      <p>
        Tre løpere som løp både 100 m og 200 m i Berlin 2009. Du tilpasser først på 100 m og tester så hva
        modellen sier om 200 m. På 200 m er splittene bare 50 m-intervaller, så få parametere kan bestemmes.
      </p>
    ),
    tasks: [
      <>Velg en løper og tilpass <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" /> til 100 m (med eller uten <InlineMath math="k" />).</>,
      <>Bytt til 200 m. Parameterne følger med og er låst. Hva sier modellen om 200 m-tiden når <InlineMath math="k" /> er som på 100 m? Se på avvikene.</>,
      <>Tilpass bare <InlineMath math="k" /> til 200 m. Hva blir den, og hvordan står den seg mot <InlineMath math="k" /> fra 100 m?</>,
      <>Lås opp <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" /> og tilpass alle tre. Hva endres, og hva kan forklare det?</>,
    ],
    stages: [STAGE_100, STAGE_200],
    entries: [
      ...PAIRS.map((p) => ({
        key: `pair:${p.name}`,
        label: p.name,
        group: "VM Berlin 2009",
        stages: { "100": raceRow(p.s100, p.name), "200": raceRow(p.s200, p.name) } as Record<string, RaceRow | null>,
      })),
      customEntry([STAGE_100, STAGE_200]),
    ],
  };

  return [ex1, ex2, ex3];
}

const EXERCISES = buildExercises();

function defaultTable(row: RaceRow | null, stage: StageDef): Table {
  if (!row) {
    return { rt: "0", rows: stage.defaultDistances.map((d) => ({ d: String(d), t: "" })) };
  }
  return {
    rt: fmt(row.rt, 3),
    rows: row.distances.map((d, i) => ({ d: String(d), t: fmt(row.gun[i], 2) })),
  };
}

function toSplits(table: Table): Splits {
  const rt = parseNum(table.rt);
  const r = isFinite(rt) ? rt : 0;
  const pts = table.rows
    .map((row) => ({ d: parseNum(row.d), t: parseNum(row.t) - r }))
    .filter((p) => isFinite(p.d) && isFinite(p.t) && p.d > 0 && p.t > 0)
    .sort((a, b) => a.d - b.d);
  return { distances: pts.map((p) => p.d), times: pts.map((p) => p.t) };
}

const START: FatigueParams = { vmax: 11, tau: 1.2, k: 0 };

/** Fast y-akse (±ms) for avviksdiagrammet: de beste tilpasningene ligger innenfor ca. 40 ms, uten utmattelse på 200 m går de langt utenfor. */
const RES_RANGE = 60;

interface Stored {
  sig: string;
  fit: FatigueFit;
}

function FitPanel({ ex }: { ex: Exercise }) {
  const [entryKey, setEntryKey] = useState(ex.entries[0].key);
  const [stageId, setStageId] = useState(ex.stages[0].id);
  const [tables, setTables] = useState<Record<string, Table>>({});
  const [params, setParams] = useState<FatigueParams>(START);
  const [lock, setLock] = useState({ vmax: false, tau: false });
  const [fits, setFits] = useState<{ a: Stored | null; b: Stored | null }>({ a: null, b: null });

  const entry = ex.entries.find((e) => e.key === entryKey) ?? ex.entries[0];
  const stage = ex.stages.find((s) => s.id === stageId) ?? ex.stages[0];
  const row = entry.stages[stage.id] ?? null;
  const tableKey = `${entry.key}|${stage.id}`;
  const table = tables[tableKey] ?? defaultTable(row, stage);
  const isCustom = entry.key === "custom";
  const multi = ex.stages.length > 1;

  const splits = useMemo(() => toSplits(table), [table]);
  const sig = `${entry.key}|${stage.id}|${JSON.stringify(splits)}`;
  const enough = splits.distances.length >= 2;

  const setTable = (fn: (t: Table) => Table) =>
    setTables((prev) => ({ ...prev, [tableKey]: fn(prev[tableKey] ?? defaultTable(row, stage)) }));

  const groups = useMemo(() => {
    const g: { name: string; items: Entry[] }[] = [];
    for (const e of ex.entries) {
      const found = g.find((x) => x.name === e.group);
      if (found) found.items.push(e);
      else g.push({ name: e.group, items: [e] });
    }
    return g;
  }, [ex.entries]);

  const choose = (key: string) => {
    setEntryKey(key);
    setStageId(ex.stages[0].id);
    setLock({ vmax: false, tau: false });
    setParams(START);
    setFits({ a: null, b: null });
  };

  const chooseStage = (id: string) => {
    setStageId(id);
    setLock(id === ex.stages[0].id ? { vmax: false, tau: false } : { vmax: true, tau: true });
  };

  const free = (withK: boolean): FitFree => ({ vmax: !lock.vmax, tau: !lock.tau, k: withK });
  const canFitA = enough && (free(false).vmax || free(false).tau);
  const canFitB = enough;

  const runFit = (withK: boolean) => {
    const start = { ...params, k: withK ? params.k : 0 };
    const fit = fitFatigue(splits, start, free(withK));
    if (!fit) return;
    setParams(fit.params);
    setFits((prev) => (withK ? { ...prev, b: { sig, fit } } : { ...prev, a: { sig, fit } }));
  };

  const fitA = fits.a && fits.a.sig === sig ? fits.a.fit : null;
  const fitB = fits.b && fits.b.sig === sig ? fits.b.fit : null;

  const modelT = useMemo(() => modelTimes(splits.distances, params), [splits, params]);
  const rmsNow = enough ? rmsOf(splits, params) : NaN;

  const xMax = splits.distances.length ? Math.max(...splits.distances) : stage.defaultDistances[stage.defaultDistances.length - 1];

  const curveOf = (p: FatigueParams): [number, number][] => {
    const pts: [number, number][] = [];
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const x = (xMax * i) / N;
      const t = timeToDistanceF(x, p);
      pts.push([x, isFinite(t) ? speedAtDistance(x, p) : NaN]);
    }
    return pts;
  };

  const curveNow = useMemo(() => curveOf(params), [params, xMax]); // eslint-disable-line react-hooks/exhaustive-deps
  const curveA = useMemo(() => (fitA ? curveOf(fitA.params) : null), [fitA, xMax]); // eslint-disable-line react-hooks/exhaustive-deps

  const speedSteps = useMemo(
    () => intervalSpeeds(splits).map((q) => [q.from, q.to, q.v] as [number, number, number]),
    [splits]
  );

  const resBars = splits.distances.map((d, i) => [d, (modelT[i] - splits.times[i]) * 1000] as [number, number]);
  const resA = fitA
    ? (() => {
        const t = modelTimes(splits.distances, fitA.params);
        return splits.distances.map((d, i) => [d, (t[i] - splits.times[i]) * 1000] as [number, number]);
      })()
    : null;

  const slider = (name: "vmax" | "tau" | "k", label: React.ReactNode, min: number, max: number, step: number, digits: number, unit: string) => {
    const locked = name !== "k" && lock[name];
    return (
      <div className={s2.sliderRow}>
        <div className={s2.sliderHead}>
          <span className={s2.sliderName}>{label}</span>
          <span className={s2.sliderValue}>
            {fmt(params[name], digits)} <span className={styles.unit}>{unit}</span>
          </span>
          {name !== "k" && multi && (
            <label className={s2.lockBox}>
              <input type="checkbox" checked={lock[name]} onChange={(e) => setLock((l) => ({ ...l, [name]: e.target.checked }))} /> lås
            </label>
          )}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, params[name]))}
          disabled={locked}
          onChange={(e) => setParams((p) => ({ ...p, [name]: parseFloat(e.target.value) }))}
          className={s2.range}
          aria-label={name}
        />
      </div>
    );
  };

  return (
    <div>
      <div className={s2.exIntro}>{ex.intro}</div>
      <ol className={s2.tasks}>
        {ex.tasks.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ol>

      <div className={s2.labGrid}>
        {/* Data */}
        <section className={styles.card}>
          <h2>Data</h2>
          <div className={s2.controlRow}>
            <div className={styles.field} style={{ minWidth: 200 }}>
              <label htmlFor={`entry-${ex.id}`}>Løper</label>
              <select id={`entry-${ex.id}`} className={styles.input} value={entry.key} onChange={(e) => choose(e.target.value)}>
                {groups.map((g) => (
                  <optgroup key={g.name} label={g.name}>
                    {g.items.map((e) => (
                      <option key={e.key} value={e.key}>{e.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {multi && (
              <div className={styles.segment} role="group" aria-label="Distanse">
                {ex.stages.map((s) => (
                  <button key={s.id} type="button" className={s.id === stage.id ? styles.segActive : ""} onClick={() => chooseStage(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={s2.rtRow}>
            <label htmlFor={`rt-${ex.id}`}>Reaksjonstid RT (s)</label>
            <input
              id={`rt-${ex.id}`}
              className={`${styles.input} ${s2.rtInput}`}
              inputMode="decimal"
              value={table.rt}
              onChange={(e) => setTable((t) => ({ ...t, rt: e.target.value }))}
            />
          </div>

          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${s2.dataTable}`}>
              <thead>
                <tr>
                  <th>Distanse (m)</th>
                  <th>Tid fra skudd (s)</th>
                  <th>Tid fra start (s)</th>
                  <th>Modell (s)</th>
                  <th>Avvik (ms)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => {
                  const d = parseNum(r.d);
                  const t = parseNum(r.t) - (isFinite(parseNum(table.rt)) ? parseNum(table.rt) : 0);
                  const idx = splits.distances.findIndex((x, j) => x === d && Math.abs(splits.times[j] - t) < 1e-9);
                  const mt = idx >= 0 ? modelT[idx] : NaN;
                  const dev = idx >= 0 ? (mt - splits.times[idx]) * 1000 : NaN;
                  return (
                    <tr key={i}>
                      <td>
                        <input className={`${styles.input} ${s2.cell}`} inputMode="decimal" value={r.d}
                          onChange={(e) => setTable((tb) => ({ ...tb, rows: tb.rows.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)) }))} />
                      </td>
                      <td>
                        <input className={`${styles.input} ${s2.cell}`} inputMode="decimal" value={r.t} placeholder="–"
                          onChange={(e) => setTable((tb) => ({ ...tb, rows: tb.rows.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)) }))} />
                      </td>
                      <td className={styles.num}>{idx >= 0 ? fmt(splits.times[idx], 3) : "–"}</td>
                      <td className={styles.num}>{isFinite(mt) ? fmt(mt, 3) : "–"}</td>
                      <td className={`${styles.num} ${isFinite(dev) && Math.abs(dev) > 15 ? s2.devBig : ""}`}>
                        {isFinite(dev) ? `${dev > 0 ? "+" : ""}${fmt(dev, 1)}` : "–"}
                      </td>
                      <td>
                        <button type="button" className={styles.delBtn} title="Fjern rad" onClick={() => setTable((tb) => ({ ...tb, rows: tb.rows.filter((_, j) => j !== i) }))}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={s2.tableActions}>
            <button type="button" className={styles.preset} onClick={() => setTable((tb) => ({ ...tb, rows: [...tb.rows, { d: "", t: "" }] }))}>+ Legg til rad</button>
            {!isCustom && (
              <button
                type="button"
                className={styles.preset}
                onClick={() => {
                  setTables((prev) => {
                    const next = { ...prev };
                    delete next[tableKey];
                    return next;
                  });
                  setFits({ a: null, b: null });
                }}
              >
                Tilbakestill til rapportdata
              </button>
            )}
          </div>
          {row && <div className={s2.source}>{row.source}</div>}
          {isCustom && <div className={s2.source}>Skriv inn egne distanser og tider fra startskuddet. Trenger minst to punkter.</div>}
        </section>

        {/* Parametere */}
        <section className={styles.card}>
          <h2>Parametere</h2>
          {slider("vmax", <InlineMath math="v_{\max}" />, BOUNDS.vmax[0], BOUNDS.vmax[1], 0.01, 2, "m/s")}
          {slider("tau", <InlineMath math="\tau" />, BOUNDS.tau[0], BOUNDS.tau[1], 0.01, 2, "s")}
          {slider("k", <InlineMath math="k" />, 0, 0.03, 0.0005, 4, "1/s")}

          <div className={s2.fitButtons}>
            <button type="button" className={styles.primaryBtn} disabled={!canFitA} onClick={() => runFit(false)} id={`fit-no-${ex.id}`}>
              Tilpass uten utmattelse (k = 0)
            </button>
            <button type="button" className={styles.primaryBtn} disabled={!canFitB} onClick={() => runFit(true)} id={`fit-yes-${ex.id}`}>
              Tilpass med utmattelse
            </button>
          </div>

          <div className={s2.rmsNow}>
            RMS nå: <strong>{isFinite(rmsNow) ? `${ms(rmsNow)} ms` : "–"}</strong>
            {enough && <span className={styles.sub}> · {splits.distances.length} punkter</span>}
          </div>

          {(fitA || fitB) && (
            <table className={`${styles.table} ${s2.cmpTable}`}>
              <thead>
                <tr>
                  <th />
                  <th><InlineMath math="v_{\max}" /></th>
                  <th><InlineMath math="\tau" /></th>
                  <th><InlineMath math="k" /></th>
                  <th>RMS (ms)</th>
                  <th>Fri</th>
                </tr>
              </thead>
              <tbody>
                {fitA && (
                  <tr>
                    <td>Uten utmattelse</td>
                    <td className={styles.num}>{fmt(fitA.params.vmax)}</td>
                    <td className={styles.num}>{fmt(fitA.params.tau)}</td>
                    <td className={styles.num}>0</td>
                    <td className={styles.num}>{ms(fitA.rms)}</td>
                    <td className={styles.num}>{fitA.dof}</td>
                  </tr>
                )}
                {fitB && (
                  <tr>
                    <td>Med utmattelse</td>
                    <td className={styles.num}>{fmt(fitB.params.vmax)}</td>
                    <td className={styles.num}>{fmt(fitB.params.tau)}</td>
                    <td className={styles.num}>{fmt(fitB.params.k, 4)}</td>
                    <td className={styles.num}>{ms(fitB.rms)}</td>
                    <td className={styles.num}>{fitB.dof}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {(fitA || fitB) && (
            <div className={s2.source}>«Fri» er antall punkter minus antall parametere som ble tilpasset. Splittene er avrundet til 0,01 s.</div>
          )}
        </section>
      </div>

      <div className={s2.chartGrid}>
        <section className={styles.card}>
          <h2>Fart mot distanse</h2>
          {enough ? (
            <LineChart
              xLabel="Distanse fra start (m)"
              yLabel="Fart (m/s)"
              xMax={xMax}
              yMin={0}
              steps={[{ id: "data", label: "Målt gjennomsnittsfart per strekning", color: "#475569", items: speedSteps }]}
              series={[
                ...(curveA ? [{ id: "a", label: "Uten utmattelse (tilpasset)", color: "#94a3b8", pts: curveA, dashed: true }] : []),
                { id: "now", label: "Modell med nåværende parametere", color: "#2563eb", pts: curveNow },
              ]}
            />
          ) : (
            <div className={styles.empty}>Legg inn minst to punkter med distanse og tid.</div>
          )}
        </section>
        <section className={styles.card}>
          <h2>Avvik: modell − måling</h2>
          {enough ? (
            <LineChart
              xLabel="Distanse fra start (m)"
              yLabel="Avvik (ms)"
              xMax={xMax}
              yMin={-RES_RANGE}
              yMax={RES_RANGE}
              zeroLine
              bars={[{ id: "res", label: "Nåværende parametere", color: "#2563eb", pts: resBars, barWidth: xMax / 28 }]}
              dots={resA ? [{ id: "resA", label: "Uten utmattelse (tilpasset)", color: "#64748b", pts: resA, hollow: true }] : []}
            />
          ) : (
            <div className={styles.empty}>Legg inn minst to punkter.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Samling2Lab() {
  const [exId, setExId] = useState<1 | 2 | 3 | 4>(1);
  const ex = EXERCISES.find((e) => e.id === exId);
  return (
    <div id="samling2-lab">
      <div className={s2.exTabs} role="tablist" aria-label="Øvelser">
        {EXERCISES.map((e) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={e.id === exId}
            className={`${s2.exTab} ${e.id === exId ? s2.exTabActive : ""}`}
            onClick={() => setExId(e.id)}
            id={`ex-tab-${e.id}`}
          >
            {e.title}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={exId === 4}
          className={`${s2.exTab} ${exId === 4 ? s2.exTabActive : ""}`}
          onClick={() => setExId(4)}
          id="ex-tab-4"
        >
          Øvelse 4 · Python (valgfri)
        </button>
      </div>
      {ex ? <FitPanel key={ex.id} ex={ex} /> : <Samling2Python />}
    </div>
  );
}
