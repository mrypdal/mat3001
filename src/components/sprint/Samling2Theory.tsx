"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import styles from "./sprint.module.css";
import s2 from "./samling2.module.css";
import LineChart from "./LineChart";
import { raceRow } from "@/lib/sprintSamling2Data";
import {
  fitFatigue,
  intervalSpeeds,
  modelTimes,
  speedAtDistance,
  timeToDistanceF,
  velocityAtTime,
  type FatigueParams,
  type Splits,
} from "@/lib/sprintFatigue";

const M = (s: TemplateStringsArray) => String.raw(s);
const fmt = (n: number, d = 2) => n.toFixed(d).replace(".", ",");

const BLUE = "#2563eb";
const GRAY = "#94a3b8";
const ORANGE = "#ea580c";
const GREEN = "#16a34a";

/** Fraser-Pryce, 100 m VM Berlin 2009: brukes som gjennomgående eksempel. */
function useFraser() {
  return useMemo(() => {
    const r = raceRow("w100_2009", "Fraser");
    const splits: Splits = { distances: r.distances, times: r.gun.map((t) => t - r.rt) };
    const start: FatigueParams = { vmax: 11, tau: 1.2, k: 0 };
    const a = fitFatigue(splits, start, { vmax: true, tau: true, k: false })!;
    const b = fitFatigue(splits, start, { vmax: true, tau: true, k: true })!;
    return { row: r, splits, a, b };
  }, []);
}

function curveV_t(p: FatigueParams, tMax: number, n = 120): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (tMax * i) / n;
    return [t, velocityAtTime(t, p)] as [number, number];
  });
}

function curveV_x(p: FatigueParams, xMax: number, n = 100): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = (xMax * i) / n;
    const t = timeToDistanceF(x, p);
    return [x, isFinite(t) ? speedAtDistance(x, p) : NaN] as [number, number];
  });
}

function Cols({ children }: { children: React.ReactNode }) {
  return <div className={s2.slideCols}>{children}</div>;
}

/* ---------------------------------------------------------------- slides */

function SlideTitle() {
  return (
    <div className={s2.titleSlide}>
      <h1>Fartstap i sprint</h1>
      <p className={s2.titleSub}>Fra 40 m til 100 m og 200 m</p>
      <ol className={s2.agenda}>
        <li><strong>Teori:</strong> utvid modellen med utmattelse, og lær hvordan parametere tilpasses data.</li>
        <li><strong>Tilpass parametere:</strong> splittider fra VM-finaler på 100 m og 200 m.</li>
        <li><strong>Din prediksjon:</strong> hva blir tidene til testpersonene våre på 100 m og 200 m?</li>
      </ol>
    </div>
  );
}

function SlideModel() {
  const p = { vmax: 11, tau: 1.2, k: 0 };
  return (
    <Cols>
      <div>
        <p>Newtons andre lov: akselerasjon er framdrift minus motstand.</p>
        <div className={styles.callout}>
          <BlockMath math={M`\frac{dv}{dt}=a_0\left(1-\frac{v}{v_{\max}}\right)=a_0-\frac{v}{\tau},\qquad a_0=\frac{v_{\max}}{\tau}`} />
          <BlockMath math={M`v(t)=v_{\max}\left(1-e^{-t/\tau}\right)`} />
        </div>
        <ul>
          <li><InlineMath math="a_0" />: akselerasjonen ved start (m/s²)</li>
          <li><InlineMath math="v_{\max}" />: toppfart (m/s)</li>
          <li><InlineMath math="\tau" />: tidskonstant (s)</li>
        </ul>
        <p>Modellen sier at farten nærmer seg <InlineMath math="v_{\max}" /> og blir der.</p>
      </div>
      <LineChart
        xLabel="Tid fra start (s)"
        yLabel="Fart (m/s)"
        xMax={10}
        yMin={0}
        yMax={12}
        series={[
          { id: "vmax", label: "v_max", color: GRAY, dashed: true, width: 1.8, pts: [[0, p.vmax], [10, p.vmax]] },
          { id: "v", label: "v(t)", color: BLUE, pts: curveV_t(p, 10) },
        ]}
      />
    </Cols>
  );
}

function SlideProblem() {
  const { splits, a } = useFraser();
  const steps = intervalSpeeds(splits).map((q) => [q.from, q.to, q.v] as [number, number, number]);
  return (
    <Cols>
      <div>
        <p>
          Fraser-Pryce, 100 m i VM 2009. Strekene viser målt gjennomsnittsfart per 20 m. Kurven er modellen fra
          forrige gang, tilpasset samme løper.
        </p>
        <ul>
          <li>Hva skjer med målingene mot slutten av løpet?</li>
          <li>Hva gjør modellen?</li>
          <li>Hva må vi endre for å fange det som skjer?</li>
        </ul>
      </div>
      <LineChart
        xLabel="Distanse fra start (m)"
        yLabel="Fart (m/s)"
        xMax={100}
        yMin={0}
        steps={[{ id: "d", label: "Målt (per 20 m)", color: "#475569", items: steps }]}
        series={[{ id: "m", label: "Modell uten utmattelse", color: BLUE, pts: curveV_x(a.params, 100) }]}
      />
    </Cols>
  );
}

function SlideIdea() {
  const ks = [0, 0.005, 0.01, 0.02];
  const cols = [GRAY, GREEN, BLUE, ORANGE];
  return (
    <Cols>
      <div>
        <p>
          I modellen er framdriften <InlineMath math="a_0" /> konstant. Når løperen blir sliten, klarer hun ikke lenger
          å skape like mye framdrift. Enkleste idé: framdriften avtar med tiden,
        </p>
        <div className={styles.callout}>
          <BlockMath math={M`a(t)=a_0\,e^{-kt}`} />
        </div>
        <p>
          Funksjonen <InlineMath math="e^{-kt}" /> starter på 1 og synker med <InlineMath math="k" /> ganger seg selv.
          Med <InlineMath math="k=0{,}01\ \text{s}^{-1}" /> mister vi ca. 1 % av framdriften per sekund:
        </p>
        <ul>
          <li>etter 10 s: <InlineMath math="e^{-0{,}1}\approx 0{,}90" />, altså 90 %</li>
          <li>etter 20 s: <InlineMath math="e^{-0{,}2}\approx 0{,}82" />, altså 82 %</li>
          <li><InlineMath math="k=0" /> gir ingen utmattelse, og vi er tilbake til modellen fra forrige gang.</li>
        </ul>
      </div>
      <LineChart
        xLabel="Tid fra start (s)"
        yLabel="Framdrift (% av a₀)"
        xMax={20}
        yMin={0}
        yMax={100}
        series={ks.map((k, i) => ({
          id: `k${k}`,
          label: `k = ${fmt(k, 3)}`,
          color: cols[i],
          pts: Array.from({ length: 81 }, (_, j) => [(20 * j) / 80, 100 * Math.exp((-k * 20 * j) / 80)] as [number, number]),
        }))}
      />
    </Cols>
  );
}

function SlideNewRule() {
  const p: FatigueParams = { vmax: 12, tau: 1.3, k: 0.015 };
  const tMax = 20;
  return (
    <Cols>
      <div>
        <p>Setter vi den avtagende framdriften inn i regelen for akselerasjonen, får vi</p>
        <div className={styles.callout}>
          <BlockMath math={M`\frac{dv}{dt}=a_0e^{-kt}-\frac{v}{\tau}=\frac{v_{\max}e^{-kt}-v}{\tau}`} />
        </div>
        <p>
          Farten prøver hele tiden å nå <InlineMath math="v_{\max}e^{-kt}" />, men det målet flytter seg nedover.
          Først er farten langt under målet og øker. Når den treffer målet, snur den og synker.
        </p>
      </div>
      <LineChart
        xLabel="Tid fra start (s)"
        yLabel="Fart (m/s)"
        xMax={tMax}
        yMin={0}
        yMax={13}
        series={[
          { id: "t", label: "Målet v_max·e^(−kt)", color: ORANGE, dashed: true, pts: Array.from({ length: 81 }, (_, j) => [(tMax * j) / 80, p.vmax * Math.exp((-p.k * tMax * j) / 80)] as [number, number]) },
          { id: "v", label: "v(t)", color: BLUE, pts: curveV_t(p, tMax) },
        ]}
      />
    </Cols>
  );
}

function SlideExplore() {
  const [p, setP] = useState<FatigueParams>({ vmax: 11.5, tau: 1.25, k: 0.01 });
  const p0 = { ...p, k: 0 };
  const stats = useMemo(() => {
    let top = 0;
    let topX = 0;
    for (let x = 0; x <= 200; x += 1) {
      const v = speedAtDistance(x, p);
      if (v > top) {
        top = v;
        topX = x;
      }
    }
    return {
      top,
      topX,
      t100: timeToDistanceF(100, p),
      t100n: timeToDistanceF(100, p0),
      t200: timeToDistanceF(200, p),
      t200n: timeToDistanceF(200, p0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.vmax, p.tau, p.k]);

  const row = (name: "vmax" | "tau" | "k", label: React.ReactNode, min: number, max: number, step: number, d: number, unit: string) => (
    <div className={s2.sliderRow}>
      <div className={s2.sliderHead}>
        <span className={s2.sliderName}>{label}</span>
        <span className={s2.sliderValue}>{fmt(p[name], d)} <span className={styles.unit}>{unit}</span></span>
      </div>
      <input type="range" className={s2.range} min={min} max={max} step={step} value={p[name]} aria-label={name}
        onChange={(e) => setP((q) => ({ ...q, [name]: parseFloat(e.target.value) }))} />
    </div>
  );

  return (
    <Cols>
      <div>
        <p>Utforsk modellen: dra i glidebryterne og se hva som skjer.</p>
        {row("vmax", <InlineMath math="v_{\max}" />, 8, 13, 0.01, 2, "m/s")}
        {row("tau", <InlineMath math="\tau" />, 0.6, 2, 0.01, 2, "s")}
        {row("k", <InlineMath math="k" />, 0, 0.03, 0.0005, 4, "1/s")}
        <table className={`${styles.table} ${s2.cmpTable}`}>
          <thead><tr><th /><th>med k</th><th>k = 0</th></tr></thead>
          <tbody>
            <tr><td>100 m</td><td className={styles.num}><strong>{fmt(stats.t100)} s</strong></td><td className={`${styles.num} ${s2.dimCell}`}>{fmt(stats.t100n)} s</td></tr>
            <tr><td>200 m</td><td className={styles.num}><strong>{fmt(stats.t200)} s</strong></td><td className={`${styles.num} ${s2.dimCell}`}>{fmt(stats.t200n)} s</td></tr>
            <tr><td>Toppfart</td><td className={styles.num}>{fmt(stats.top)} m/s</td><td className={`${styles.num} ${s2.dimCell}`}>{fmt(p.vmax)} m/s</td></tr>
          </tbody>
        </table>
        <p className={styles.sub}>Toppfarten nås etter ca. {Math.round(stats.topX)} m.</p>
      </div>
      <LineChart
        xLabel="Distanse fra start (m)"
        yLabel="Fart (m/s)"
        xMax={200}
        yMin={0}
        yMax={14}
        vlines={[{ x: 100, label: "100 m" }]}
        series={[
          { id: "n", label: "k = 0", color: GRAY, dashed: true, pts: curveV_x(p0, 200) },
          { id: "k", label: "med utmattelse", color: BLUE, pts: curveV_x(p, 200) },
        ]}
      />
    </Cols>
  );
}

function SlideSolution() {
  return (
    <div>
      <p>Vi gjetter en løsning og sjekker at den virker, på samme måte som sist:</p>
      <div className={styles.callout}>
        <BlockMath math={M`v(t)=v_{\max}\,\frac{e^{-kt}-e^{-t/\tau}}{1-k\tau}`} />
      </div>
      <ol className={s2.checks}>
        <li>
          <strong>Starter i ro:</strong> <InlineMath math="v(0)=v_{\max}\dfrac{1-1}{1-k\tau}=0" />.
        </li>
        <li>
          <strong>Uten utmattelse:</strong> for <InlineMath math="k=0" /> blir den <InlineMath math="v_{\max}\left(1-e^{-t/\tau}\right)" />, modellen fra forrige gang.
        </li>
        <li>
          <strong>Deriver:</strong>
          <BlockMath math={M`v'(t)=v_{\max}\,\frac{-k\,e^{-kt}+\frac{1}{\tau}e^{-t/\tau}}{1-k\tau}`} />
        </li>
        <li>
          <strong>Høyresiden i regelen:</strong>
          <BlockMath math={M`\frac{v_{\max}e^{-kt}-v}{\tau}=\frac{v_{\max}}{\tau}\cdot\frac{(1-k\tau)e^{-kt}-e^{-kt}+e^{-t/\tau}}{1-k\tau}=v_{\max}\,\frac{-k\,e^{-kt}+\frac{1}{\tau}e^{-t/\tau}}{1-k\tau}`} />
          Det er det samme som <InlineMath math="v'(t)" />, så løsningen stemmer.
        </li>
      </ol>
    </div>
  );
}

function SlideDistance() {
  return (
    <div>
      <p>Distansen er arealet under fartskurven, altså den antideriverte av farten:</p>
      <div className={styles.callout}>
        <BlockMath math={M`x(t)=\int_0^t v(s)\,ds=\frac{v_{\max}}{1-k\tau}\left[\frac{1-e^{-kt}}{k}-\tau\left(1-e^{-t/\tau}\right)\right]`} />
      </div>
      <p>
        Her bruker vi at <InlineMath math="\displaystyle\int_0^t e^{-ks}\,ds=\frac{1-e^{-kt}}{k}" />. For <InlineMath math="k=0" /> blir
        det <InlineMath math="v_{\max}\left(t-\tau(1-e^{-t/\tau})\right)" />.
      </p>
      <ul>
        <li>
          Vi vil ha <em>tiden</em> <InlineMath math="t(d)" /> løperen bruker på distansen <InlineMath math="d" />. Det finnes
          ingen enkel formel, så datamaskinen løser <InlineMath math="x(t)=d" /> ved å prøve seg fram.
        </li>
        <li>
          Splittid mellom <InlineMath math="d_1" /> og <InlineMath math="d_2" />:{" "}
          <InlineMath math="T=t(d_2)-t(d_1)" />.
        </li>
        <li>
          Tid fra startskuddet: <InlineMath math="t(d)+\text{RT}" />, der RT er reaksjonstiden.
        </li>
      </ul>
    </div>
  );
}

function SlideParams() {
  return (
    <div>
      <p>Modellen har nå tre parametere som må bestemmes fra data:</p>
      <table className={`${styles.table} ${s2.paramTable}`}>
        <thead>
          <tr><th>Parameter</th><th>Betydning</th><th>Enhet</th><th>Størrelsesorden</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><InlineMath math="v_{\max}" /></td>
            <td>Toppfart uten utmattelse</td>
            <td>m/s</td>
            <td>9–13</td>
          </tr>
          <tr>
            <td><InlineMath math="\tau" /></td>
            <td>Hvor raskt løperen kommer opp i fart</td>
            <td>s</td>
            <td>1–1,6</td>
          </tr>
          <tr>
            <td><InlineMath math="k" /></td>
            <td>Hvor raskt framdriften avtar. <InlineMath math="k=0" /> er ingen utmattelse.</td>
            <td>1/s</td>
            <td>0–0,02</td>
          </tr>
        </tbody>
      </table>
      <p>
        Startakselerasjonen er <InlineMath math="a_0=v_{\max}/\tau" />.
      </p>
    </div>
  );
}

function SlideData() {
  const { row, splits } = useFraser();
  const iv = intervalSpeeds(splits);
  return (
    <Cols>
      <div>
        <p>
          Fra VM-rapportene har vi tid fra startskuddet ved hver 20. meter. Modellen starter når løperen starter, så vi
          må trekke fra reaksjonstiden RT:
        </p>
        <div className={styles.callout}>
          <BlockMath math={M`t_{\text{fra start}}=t_{\text{fra skudd}}-\text{RT}`} />
        </div>
        <p>
          Eksemplet er Fraser-Pryce med <InlineMath math="\text{RT}=0{,}146\ \text{s}" />.
        </p>
      </div>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${s2.dataTable}`}>
          <thead>
            <tr><th>Distanse (m)</th><th>Fra skudd (s)</th><th>Fra start (s)</th><th>Fart i strekningen (m/s)</th></tr>
          </thead>
          <tbody>
            {splits.distances.map((d, i) => (
              <tr key={d}>
                <td className={styles.num}>{d}</td>
                <td className={styles.num}>{fmt(row.gun[i])}</td>
                <td className={styles.num}>{fmt(splits.times[i], 3)}</td>
                <td className={styles.num}>{fmt(iv[i]?.v ?? NaN)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cols>
  );
}

function SlideLeastSquares() {
  const { splits, a } = useFraser();
  const t = modelTimes(splits.distances, a.params);
  const res = splits.distances.map((d, i) => [d, (t[i] - splits.times[i]) * 1000] as [number, number]);
  return (
    <Cols>
      <div>
        <p>For hver måling ser vi på avviket mellom modellens tid og den målte tiden:</p>
        <div className={styles.callout}>
          <BlockMath math={M`r_i=t_{\text{modell}}(d_i)-t_i`} />
          <BlockMath math={M`S=\sum_{i=1}^{n}r_i^{\,2},\qquad \text{RMS}=\sqrt{\frac{S}{n}}`} />
        </div>
        <p>
          Minste kvadraters metode: velg parameterne som gir <em>minst mulig</em> <InlineMath math="S" />. Vi kvadrerer
          for at positive og negative avvik ikke skal oppheve hverandre. Dette gjorde dere i Python forrige gang, med to
          parametere. Nå har vi tre.
        </p>
        <p className={styles.sub}>
          Eksemplet viser Fraser-Pryce uten utmattelse: RMS = {fmt(a.rms * 1000, 1)} ms.
        </p>
      </div>
      <LineChart
        xLabel="Distanse fra start (m)"
        yLabel="Avvik (ms)"
        xMax={100}
        zeroLine
        bars={[{ id: "r", label: "Avvik uten utmattelse", color: BLUE, pts: res, barWidth: 3.5 }]}
      />
    </Cols>
  );
}

function SlideNeedK() {
  const { splits, a, b } = useFraser();
  const mk = (p: FatigueParams) => {
    const t = modelTimes(splits.distances, p);
    return splits.distances.map((d, i) => [d, (t[i] - splits.times[i]) * 1000] as [number, number]);
  };
  return (
    <div>
      <div className={s2.twoCharts}>
        <div>
          <h4 className={s2.chartTitle}>Uten utmattelse · RMS {fmt(a.rms * 1000, 1)} ms</h4>
          <LineChart xLabel="Distanse (m)" yLabel="Avvik (ms)" xMax={100} yMin={-30} yMax={30} zeroLine height={260}
            bars={[{ id: "a", color: GRAY, pts: mk(a.params), barWidth: 3.5 }]} />
        </div>
        <div>
          <h4 className={s2.chartTitle}>Med utmattelse · RMS {fmt(b.rms * 1000, 1)} ms</h4>
          <LineChart xLabel="Distanse (m)" yLabel="Avvik (ms)" xMax={100} yMin={-30} yMax={30} zeroLine height={260}
            bars={[{ id: "b", color: BLUE, pts: mk(b.params), barWidth: 3.5 }]} />
        </div>
      </div>
      <p>Før vi legger til <InlineMath math="k" /> for alle løpere, bør vi spørre:</p>
      <ul>
        <li>Er avvikene <em>tilfeldige</em>, eller har de et mønster? Et mønster tyder på at noe mangler i modellen.</li>
        <li>Er RMS allerede nede på målenøyaktigheten (splittene er avrundet til 0,01 s)? Da er ikke <InlineMath math="k" /> berettiget.</li>
        <li>Hvor mange punkter har vi sammenlignet med antall parametere? Med like mange punkter som parametere passer alt perfekt, uten at det betyr noe.</li>
        <li>Parameterne kan kompensere for hverandre: litt høyere <InlineMath math="v_{\max}" /> og litt høyere <InlineMath math="k" /> kan gi nesten samme kurve.</li>
      </ul>
    </div>
  );
}

function SlidePlan() {
  return (
    <div>
      <ol className={s2.agenda}>
        <li>
          <strong>Øvelse 1:</strong> kvinner 100 m, VM 2009. Tilpass med og uten utmattelse, og se på avvikene.
        </li>
        <li>
          <strong>Øvelse 2:</strong> menn 100 m, VM 2017 og 2009. Hvem taper fart, og hvem klarer å bevare den?
        </li>
        <li>
          <strong>Øvelse 3:</strong> fra 100 m til 200 m. Tilpass på 100 m, og test hva modellen sier om 200 m.
        </li>
        <li>
          <strong>Del 3:</strong> bruk <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" /> fra Samling 1 til å tippe
          tidene på 100 m og 200 m. Vi tester tippene på neste samling.
        </li>
      </ol>
    </div>
  );
}

const SLIDES: { title: string; render: () => React.ReactNode }[] = [
  { title: "Samling 2", render: () => <SlideTitle /> },
  { title: "Modellen fra forrige gang", render: () => <SlideModel /> },
  { title: "Hva skjer på 100 m?", render: () => <SlideProblem /> },
  { title: "Idé: framdriften avtar", render: () => <SlideIdea /> },
  { title: "Den nye regelen", render: () => <SlideNewRule /> },
  { title: "Utforsk modellen", render: () => <SlideExplore /> },
  { title: "Løsningen: gjett og sjekk", render: () => <SlideSolution /> },
  { title: "Distanse og tid", render: () => <SlideDistance /> },
  { title: "Tre parametere", render: () => <SlideParams /> },
  { title: "Fra splittider til modell", render: () => <SlideData /> },
  { title: "Tilpasning: minste kvadrater", render: () => <SlideLeastSquares /> },
  { title: "Trenger vi k?", render: () => <SlideNeedK /> },
  { title: "Dagens plan", render: () => <SlidePlan /> },
];

export default function Samling2Theory() {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const n = SLIDES.length;

  const go = useCallback((d: number) => setI((x) => Math.min(n - 1, Math.max(0, x + d))), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
    };
    const onFs = () => setFull(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [go]);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else deckRef.current?.requestFullscreen?.();
  };

  const slide = SLIDES[i];

  return (
    <div ref={deckRef} className={`${s2.deck} ${full ? s2.deckFull : ""}`} id="samling2-theory">
      <div className={s2.deckHead}>
        <span className={s2.deckCount}>{i + 1} / {n}</span>
        <button type="button" className={styles.ghostBtn} onClick={toggleFull} id="deck-fullscreen">
          {full ? "Avslutt fullskjerm" : "Fullskjerm"}
        </button>
      </div>
      <div className={s2.slide} key={i}>
        {i > 0 && <h2 className={s2.slideTitle}>{slide.title}</h2>}
        <div className={s2.slideBody}>{slide.render()}</div>
      </div>
      <div className={s2.deckNav}>
        <button type="button" className={styles.ghostBtn} onClick={() => go(-1)} disabled={i === 0} id="deck-prev">← Forrige</button>
        <div className={s2.dots}>
          {SLIDES.map((s, j) => (
            <button
              key={s.title}
              type="button"
              className={`${s2.dot} ${j === i ? s2.dotActive : ""}`}
              onClick={() => setI(j)}
              aria-label={`Lysbilde ${j + 1}: ${s.title}`}
              title={s.title}
            />
          ))}
        </div>
        <button type="button" className={styles.primaryBtn} onClick={() => go(1)} disabled={i === n - 1} id="deck-next">Neste →</button>
      </div>
    </div>
  );
}
