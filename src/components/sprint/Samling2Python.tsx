"use client";

import React, { useEffect, useRef, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import { useSession } from "next-auth/react";
import styles from "./sprint.module.css";
import s2 from "./samling2.module.css";
import { usePyodide } from "./usePyodide";

const M = (s: TemplateStringsArray) => String.raw(s);

type Py = ReturnType<typeof usePyodide>;

interface PyStep {
  id: string;
  title: string;
  mode: "copy" | "fill" | "free";
  intro: React.ReactNode;
  think?: React.ReactNode;
  hint?: React.ReactNode;
  /** Fasit. Ved «copy» vises den som oppskrift som skal skrives av. */
  listing: string;
  /** Det som står i editoren når steget åpnes. */
  template: string;
  /** Forventet utskrift; sammenlignes tallvis. Uten dette teller en vellykket kjøring. */
  expected?: string;
  tolRel?: number;
  tolAbs?: number;
}

const STEPS: PyStep[] = [
  {
    id: "data",
    title: "Data",
    mode: "copy",
    intro: (
      <>
        <p>
          Vi bruker Fraser-Pryce (100 m, Berlin 2009) fra øvelse 1. Skriv av koden under. <code>np.array</code> gjør
          lister om til tabeller vi kan regne på, og <code>t_skudd - rt</code> trekker reaksjonstiden fra alle tidene
          på én gang. Modellen starter jo når løperen starter.
        </p>
      </>
    ),
    think: "Hva tror du tiden fra start til 20 m blir?",
    listing: `import numpy as np
from scipy.optimize import brentq, minimize

d = np.array([20, 40, 60, 80, 100])                  # distanser (m)
t_skudd = np.array([3.03, 4.98, 6.88, 8.77, 10.73])  # tid fra startskuddet (s)
rt = 0.146                                           # reaksjonstid (s)

t = t_skudd - rt                                     # tid fra start (s)
print(np.round(t, 3))
`,
    template: "",
    expected: "[ 2.884  4.834  6.734  8.624 10.584]",
    tolRel: 0.001,
    tolAbs: 0.0006,
  },
  {
    id: "keller",
    title: "Modellen uten utmattelse",
    mode: "fill",
    intro: (
      <>
        <p>
          Posisjonen i Kellers modell er <InlineMath math="x(t)=v_{\max}\left(t-\tau\left(1-e^{-t/\tau}\right)\right)" />.
          I Python er <InlineMath math="e^{u}" /> skrevet <code>np.exp(u)</code>. Fyll inn det som mangler der det står{" "}
          <code>___</code>.
        </p>
      </>
    ),
    think: "Etter 10 s med vmax = 11 m/s: blir strekket mer eller mindre enn 110 m? Hvorfor?",
    hint: <>Eksponenten er <InlineMath math="-t/\tau" />, altså <code>-tid / tau</code>.</>,
    listing: `def posisjon0(tid, vmax, tau):
    # x(t) = vmax * (t - tau * (1 - e^(-t/tau)))
    return vmax * (tid - tau * (1 - np.exp(-tid / tau)))

print(round(posisjon0(10, 11, 1.2), 2), "m")
`,
    template: `def posisjon0(tid, vmax, tau):
    # x(t) = vmax * (t - tau * (1 - e^(-t/tau)))
    return vmax * (tid - tau * (1 - np.exp(___)))

print(round(posisjon0(10, 11, 1.2), 2), "m")
`,
    expected: "96.8 m",
    tolRel: 0.001,
    tolAbs: 0.05,
  },
  {
    id: "fatigue",
    title: "Utmattelse",
    mode: "fill",
    intro: (
      <>
        <p>Med utmattelse blir posisjonen</p>
        <BlockMath math={M`x(t)=\frac{v_{\max}}{1-k\tau}\left[\frac{1-e^{-kt}}{k}-\tau\left(1-e^{-t/\tau}\right)\right]`} />
        <p>
          Her deler vi på <InlineMath math="k" />, så <InlineMath math="k=0" /> går ikke. Da bruker vi den gamle
          funksjonen i stedet: det gjør <code>if</code>-linjen. Fyll inn <code>___</code>.
        </p>
      </>
    ),
    think: "Skal 10 s med k = 0,01 gi lengre eller kortere strekk enn forrige steg?",
    hint: <>Nevneren er <InlineMath math="1-k\tau" />. Tegnet for «ganger» i Python er <code>*</code>.</>,
    listing: `def posisjon(tid, vmax, tau, k):
    if k < 1e-9:                      # ingen utmattelse: Kellers modell
        return posisjon0(tid, vmax, tau)
    nevner = 1 - k * tau
    return vmax / nevner * ((1 - np.exp(-k * tid)) / k - tau * (1 - np.exp(-tid / tau)))

print(round(posisjon(10, 11, 1.2, 0.01), 2), "m")
`,
    template: `def posisjon(tid, vmax, tau, k):
    if k < 1e-9:                      # ingen utmattelse: Kellers modell
        return posisjon0(tid, vmax, tau)
    nevner = 1 - ___ * tau
    return vmax / nevner * ((1 - np.exp(-k * tid)) / k - tau * (1 - np.exp(-tid / tau)))

print(round(posisjon(10, 11, 1.2, 0.01), 2), "m")
`,
    expected: "92.59 m",
    tolRel: 0.001,
    tolAbs: 0.02,
  },
  {
    id: "tid",
    title: "Tid ved en distanse",
    mode: "fill",
    intro: (
      <>
        <p>
          Målingene våre er tider, men modellen gir posisjon som funksjon av tid. Vi må snu den: finn tiden der{" "}
          <code>posisjon(tid) - distanse</code> er null. <code>brentq</code> finner nullpunktet til en funksjon mellom to
          grenser (som halvering, bare smartere). <code>lambda tid: …</code> lager en liten funksjon uten navn.
        </p>
      </>
    ),
    think: "Hvor lang tid bruker modellen på 100 m med vmax = 11, tau = 1,2 og k = 0?",
    hint: <>Bruk funksjonen fra forrige steg: <code>posisjon(tid, vmax, tau, k)</code>.</>,
    listing: `def tid_ved(distanse, vmax, tau, k):
    # finn tiden der posisjon(tid) = distanse
    return brentq(lambda tid: posisjon(tid, vmax, tau, k) - distanse, 0, 60)

print(round(tid_ved(100, 11, 1.2, 0), 3), "s")
`,
    template: `def tid_ved(distanse, vmax, tau, k):
    # finn tiden der posisjon(tid) = distanse
    return brentq(lambda tid: ___ - distanse, 0, 60)

print(round(tid_ved(100, 11, 1.2, 0), 3), "s")
`,
    expected: "10.291 s",
    tolRel: 0.001,
    tolAbs: 0.002,
  },
  {
    id: "rms",
    title: "Avvik og RMS",
    mode: "fill",
    intro: (
      <>
        <p>
          For hver måling regner vi ut modellens tid og trekker fra den målte tiden. RMS er kvadratroten av
          gjennomsnittet av avvikene i andre:
        </p>
        <BlockMath math={M`\text{RMS}=\sqrt{\frac{1}{n}\sum_{i=1}^{n}\left(t_{\text{modell}}(d_i)-t_i\right)^2}`} />
        <p>
          Linjen med <code>[… for x in d]</code> regner ut modellens tid for hver distanse i <code>d</code>. Fyll inn de to
          stedene med <code>___</code>.
        </p>
      </>
    ),
    think: "Parameterne her er litt dårlige for Fraser-Pryce. Tror du RMS blir over eller under 50 ms?",
    hint: <>Avviket er <code>modell - t</code>, og RMS tar <code>np.mean</code> av <code>avvik**2</code>.</>,
    listing: `def rms(p):
    vmax, tau, k = p
    modell = np.array([tid_ved(x, vmax, tau, k) for x in d])
    avvik = modell - t
    return np.sqrt(np.mean(avvik**2))

print(round(rms([11, 1.2, 0]) * 1000, 1), "ms")
`,
    template: `def rms(p):
    vmax, tau, k = p
    modell = np.array([tid_ved(x, vmax, tau, k) for x in d])
    avvik = ___ - t
    return np.sqrt(np.mean(___))

print(round(rms([11, 1.2, 0]) * 1000, 1), "ms")
`,
    expected: "153.3 ms",
    tolRel: 0.002,
    tolAbs: 0.3,
  },
  {
    id: "gjett",
    title: "Gjett selv",
    mode: "copy",
    intro: (
      <p>
        Dette er det du gjorde med glidebryterne. Skriv av løkken, kjør den, og prøv så egne parametersett ved å
        endre tallene i listen. Hva skal til for å få RMS ned?
      </p>
    ),
    listing: `for p in [(10.5, 1.0, 0), (10.5, 1.2, 0), (11.0, 1.2, 0), (11.0, 1.2, 0.01)]:
    print(p, round(rms(p) * 1000, 1), "ms")
`,
    template: "",
  },
  {
    id: "optimer",
    title: "La datamaskinen optimere",
    mode: "fill",
    intro: (
      <>
        <p>
          <code>minimize</code> prøver parametere og leter etter dem som gir minst mulig RMS, med samme metode som i
          Samling 1 (Nelder–Mead). <code>x0</code> er startgjetningen, og <code>bounds</code> holder parameterne innenfor
          fornuftige grenser. Teksten med <code>f&quot;…&quot;</code> setter tall inn i en setning.
        </p>
        <p>
          Først tilpasser vi uten utmattelse (da holder vi <InlineMath math="k" /> fast på 0), så med. Fyll inn metoden begge
          steder.
        </p>
      </>
    ),
    think: "Hva tror du RMS synker til når k får være med?",
    hint: <>Metoden heter <code>&quot;Nelder-Mead&quot;</code>, med anførselstegn.</>,
    listing: `grenser = [(5, 16), (0.2, 3), (0, 0.05)]

# uten utmattelse: k holdes fast på 0
res0 = minimize(lambda q: rms([q[0], q[1], 0]), x0=[11, 1.2], bounds=grenser[:2], method="Nelder-Mead")
print(f"uten k: vmax={res0.x[0]:.2f}, tau={res0.x[1]:.2f}, rms={res0.fun * 1000:.1f} ms")

# med utmattelse
res1 = minimize(rms, x0=[11, 1.2, 0.005], bounds=grenser, method="Nelder-Mead")
print(f"med k:  vmax={res1.x[0]:.2f}, tau={res1.x[1]:.2f}, k={res1.x[2]:.4f}, rms={res1.fun * 1000:.1f} ms")
`,
    template: `grenser = [(5, 16), (0.2, 3), (0, 0.05)]

# uten utmattelse: k holdes fast på 0
res0 = minimize(lambda q: rms([q[0], q[1], 0]), x0=[11, 1.2], bounds=grenser[:2], method=___)
print(f"uten k: vmax={res0.x[0]:.2f}, tau={res0.x[1]:.2f}, rms={res0.fun * 1000:.1f} ms")

# med utmattelse
res1 = minimize(rms, x0=[11, 1.2, 0.005], bounds=grenser, method=___)
print(f"med k:  vmax={res1.x[0]:.2f}, tau={res1.x[1]:.2f}, k={res1.x[2]:.4f}, rms={res1.fun * 1000:.1f} ms")
`,
    expected: `uten k: vmax=10.49, tau=1.03, rms=18.6 ms
med k:  vmax=10.97, tau=1.15, k=0.0073, rms=9.5 ms`,
    tolRel: 0.05,
    tolAbs: 0.0006,
  },
  {
    id: "utfordringer",
    title: "Utfordringer",
    mode: "free",
    intro: (
      <>
        <p>Nå har du en kalkulator du kan gjenbruke. Funksjonen <code>rms</code> bruker listene <code>d</code> og <code>t</code>, så for å bytte løper endrer du bare dem og kjører <code>minimize</code> på nytt.</p>
        <ol>
          <li>Bytt til en annen løper fra øvelse 1 eller 2. Sammenlign <InlineMath math="k" /> med det du fant med glidebryterne.</li>
          <li>
            200 m for Bolt: <code>d = np.array([50, 100, 150, 200])</code>, tider fra skudd{" "}
            <code>[5.60, 9.92, 14.44, 19.19]</code>, <code>rt = 0.133</code>. Tilpass først <InlineMath math="v_{\max}" /> og{" "}
            <InlineMath math="\tau" /> til Bolts 100 m (Berlin 2009), og hold dem så fast mens du tilpasser bare{" "}
            <InlineMath math="k" /> til 200 m. Tips: <code>minimize(lambda q: rms([vm, ta, q[0]]), x0=[0.005], …)</code>.
          </li>
          <li>Prøv ulike startgjetninger <code>x0</code>. Gir de samme svar? Hva sier det om hvor sikkert resultatet er?</li>
        </ol>
      </>
    ),
    listing: "",
    template: `# Skriv egen kode her. Alt du har laget over finnes fortsatt.
`,
  },
];

function numbersIn(s: string): number[] {
  return (s.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi) ?? []).map(Number);
}

function matches(actual: string, expected: string, tolRel: number, tolAbs: number): boolean {
  const a = numbersIn(actual);
  const b = numbersIn(expected);
  if (a.length !== b.length) return false;
  return a.every((x, i) => Math.abs(x - b[i]) <= Math.max(tolAbs, tolRel * Math.abs(b[i])));
}

/** Siste linjene av en Python-feilmelding er de som er nyttige for en nybegynner. */
function shortError(msg: string): string {
  const lines = msg.split("\n").filter((l) => l.trim());
  return lines.slice(-4).join("\n");
}

function CodeEditor({
  value,
  onChange,
  onRun,
  blockPaste,
  onBlocked,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  blockPaste: boolean;
  onBlocked: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = ref.current;
    if (!ta || !blockPaste) return;
    const onBefore = (e: Event) => {
      const t = (e as InputEvent).inputType || "";
      if (/^insertFrom(Paste|Drop|Yank)/.test(t) || t === "insertFromPasteAsQuotation") {
        e.preventDefault();
        onBlocked();
      }
    };
    ta.addEventListener("beforeinput", onBefore);
    return () => ta.removeEventListener("beforeinput", onBefore);
  }, [blockPaste, onBlocked]);

  const insert = (ta: HTMLTextAreaElement, text: string) => {
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    onChange(ta.value.slice(0, s) + text + ta.value.slice(e));
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = s + text.length;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
    } else if (e.key === "Tab") {
      e.preventDefault();
      insert(ta, "    ");
    }
  };

  const rows = Math.max(3, value.split("\n").length + 1);

  return (
    <textarea
      ref={ref}
      className={s2.codeEditor}
      value={value}
      rows={rows}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={(e) => {
        if (blockPaste) {
          e.preventDefault();
          onBlocked();
        }
      }}
      onDrop={(e) => {
        if (blockPaste) {
          e.preventDefault();
          onBlocked();
        }
      }}
      onDragOver={(e) => blockPaste && e.preventDefault()}
      aria-label="Python-kode"
    />
  );
}

function StepCard({
  step,
  index,
  py,
  blockPaste,
  done,
  onDone,
}: {
  step: PyStep;
  index: number;
  py: Py;
  blockPaste: boolean;
  done: boolean;
  onDone: (i: number) => void;
}) {
  const [code, setCode] = useState(step.template);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; stdout: string; error?: string } | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [msg, setMsg] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  const blocked = () => setMsg("Lim inn er slått av. Skriv koden selv, så sitter den bedre.");

  const run = async () => {
    if (running) return;
    if (code.includes("___")) {
      setMsg("Du har ikke fylt inn alle ___ ennå.");
      return;
    }
    if (!code.trim()) {
      setMsg("Skriv koden først.");
      return;
    }
    setMsg("");
    setMismatch(false);
    setRunning(true);
    const res = await py.run(index, code);
    setRunning(false);
    setResult(res);
    if (!res.ok) return;
    if (step.expected) {
      const ok = matches(res.stdout, step.expected, step.tolRel ?? 0.01, step.tolAbs ?? 0.01);
      setMismatch(!ok);
      if (ok) onDone(index);
    } else {
      onDone(index);
    }
  };

  const noCopy = blockPaste
    ? {
        onCopy: (e: React.ClipboardEvent) => e.preventDefault(),
        onCut: (e: React.ClipboardEvent) => e.preventDefault(),
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        onDragStart: (e: React.DragEvent) => e.preventDefault(),
      }
    : {};

  const listingBlock = (label: string) => (
    <div className={s2.listing}>
      <div className={s2.listingLabel}>{label}</div>
      <pre className={blockPaste ? s2.noCopy : undefined} {...noCopy}>
        <code>{step.listing}</code>
      </pre>
    </div>
  );

  return (
    <section className={`${styles.card} ${s2.pyStep}`} id={`py-step-${step.id}`}>
      <div className={s2.pyStepHead}>
        <span className={`${styles.stepNum} ${done ? s2.stepDone : ""}`}>{done ? "✓" : index + 1}</span>
        <h3>{step.title}</h3>
      </div>
      <div className={s2.pyIntro}>{step.intro}</div>
      {step.think && (
        <div className={s2.think}>
          <strong>Tenk først:</strong> {step.think}
        </div>
      )}

      {step.mode === "copy" && listingBlock("Skriv av denne koden")}

      <CodeEditor
        value={code}
        onChange={setCode}
        onRun={run}
        blockPaste={blockPaste}
        onBlocked={blocked}
        placeholder={step.mode === "copy" ? "Skriv koden her" : undefined}
      />

      <div className={s2.pyActions}>
        <button type="button" className={styles.primaryBtn} onClick={run} disabled={running} id={`py-run-${step.id}`}>
          {running ? "Kjører …" : "Kjør (Ctrl/Cmd + Enter)"}
        </button>
        {step.mode === "fill" && (
          <button type="button" className={styles.preset} onClick={() => setShowSolution((v) => !v)}>
            {showSolution ? "Skjul fasit" : "Vis fasit"}
          </button>
        )}
        {step.mode === "fill" && step.template && (
          <button type="button" className={styles.preset} onClick={() => setCode(step.template)}>
            Tilbakestill
          </button>
        )}
      </div>

      {step.hint && (
        <details className={s2.hint}>
          <summary>Hint</summary>
          <div>{step.hint}</div>
        </details>
      )}
      {showSolution && step.mode === "fill" && listingBlock("Fasit (skriv den inn selv)")}

      {msg && <div className={s2.pyMsg}>{msg}</div>}
      {result && (
        <div className={`${styles.outputBlock} ${result.ok ? "" : s2.outputError}`}>
          <div className={styles.outputLabel}>{result.ok ? "Utskrift" : "Feil"}</div>
          <pre>{result.ok ? result.stdout || "(ingen utskrift)" : `${result.stdout ? result.stdout + "\n" : ""}${shortError(result.error ?? "")}`}</pre>
        </div>
      )}
      {mismatch && step.expected && (
        <div className={s2.pyMsg}>
          Ikke helt. Du skal få omtrent:
          <pre className={s2.expectedPre}>{step.expected}</pre>
        </div>
      )}
      {done && step.expected && !mismatch && <div className={s2.pyOk}>Riktig!</div>}
    </section>
  );
}

export default function Samling2Python() {
  const py = usePyodide();
  const { data: session } = useSession();
  const isStaff = session?.user?.role === "admin" || session?.user?.role === "teacher";
  const [blockPaste, setBlockPaste] = useState(!isStaff);
  const [done, setDone] = useState<boolean[]>(() => STEPS.map(() => false));
  const [epoch, setEpoch] = useState(0);

  const markDone = (i: number) => setDone((d) => (d[i] ? d : d.map((x, j) => (j === i ? true : x))));
  const firstOpen = done.findIndex((d) => !d);
  const visible = firstOpen === -1 ? STEPS.length : firstOpen + 1;

  const statusClass =
    py.status === "ready" ? s2.pyReady : py.status === "error" ? s2.pyErr : py.status === "loading" ? s2.pyLoading : "";

  return (
    <div id="samling2-python">
      <div className={s2.exIntro}>
        <p>
          <strong>Valgfri øvelse.</strong> Her bygger du en liten kalkulator som gjør samme jobb som glidebryterne og
          tilpasningsknappene i øvelse 1–3. Koden kjøres i nettleseren din, så du trenger ikke installere noe. Første gang
          lastes Python og bibliotekene (ca. 30 MB).
        </p>
        <p>
          Du skriver koden selv: <strong>lim inn er slått av</strong>. Noen steder skriver du av, andre steder fyller du
          inn <code>___</code>. Tab-tasten setter inn fire mellomrom, og Ctrl/Cmd + Enter kjører cellen. Hvert steg åpnes
          når forrige steg gir riktig utskrift.
        </p>
      </div>

      <div className={`${s2.pyStatus} ${statusClass}`}>
        <span className={s2.pyDot} />
        <span>{py.statusText}</span>
        {py.status === "idle" && (
          <button type="button" className={styles.preset} onClick={() => py.start().catch(() => {})} id="py-start">
            Start Python nå
          </button>
        )}
        {py.status === "error" && (
          <button type="button" className={styles.preset} onClick={() => { py.restart(); py.start().catch(() => {}); }}>
            Prøv igjen
          </button>
        )}
        <span style={{ flex: 1 }} />
        {isStaff && (
          <label className={s2.lockBox} style={{ marginLeft: 0 }}>
            <input type="checkbox" checked={blockPaste} onChange={(e) => setBlockPaste(e.target.checked)} /> Sperr lim inn (elevvisning)
          </label>
        )}
        <button
          type="button"
          className={styles.preset}
          onClick={() => {
            py.restart();
            setDone(STEPS.map(() => false));
            setEpoch((n) => n + 1);
          }}
        >
          Start øvelsen på nytt
        </button>
      </div>

      <div className={s2.pySteps}>
        {STEPS.slice(0, visible).map((step, i) => (
          <StepCard
            key={`${epoch}-${step.id}`}
            step={step}
            index={i}
            py={py}
            blockPaste={blockPaste}
            done={done[i]}
            onDone={markDone}
          />
        ))}
      </div>
    </div>
  );
}
