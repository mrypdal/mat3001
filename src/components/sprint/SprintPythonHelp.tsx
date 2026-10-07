"use client";

import React, { useState } from "react";
import { InlineMath } from "react-katex";
import styles from "./sprint.module.css";

const CODE_DATA = `import numpy as np

# Hver måling er (start, slutt, tid):
# fra "start" meter til "slutt" meter tok det "tid" sekunder.
maalinger = [
    (0, 10, 2.25),
    (10, 20, 1.32),
    (20, 30, 1.23),
]

print(maalinger)`;

const CODE_MODEL = `def posisjon(t, vmax, tau):
    return vmax * (t - tau * (1 - np.exp(-t / tau)))

# Test: hvor langt har løperen kommet etter 2 s, hvis vmax = 8 og tau = 1.5?
print(posisjon(2.0, 8.0, 1.5))`;

const OUT_MODEL = `7.163165657388721`;

const CODE_INVERT = `# 3001 tidspunkter fra 0 til 15 sekunder
t_grid = np.linspace(0, 15, 3001)

def tid_til(d, vmax, tau):
    x_grid = posisjon(t_grid, vmax, tau)   # posisjonen ved alle tidspunktene
    return np.interp(d, x_grid, t_grid)    # les av tiden der posisjonen er d

# Test: hvor lang tid tar det å løpe 10 m (vmax = 8, tau = 1.5)?
print(tid_til(10, 8.0, 1.5))`;

const OUT_INVERT = `2.4587959936782564`;

const CODE_INTERVAL = `def modelltid(d1, d2, vmax, tau):
    return tid_til(d2, vmax, tau) - tid_til(d1, vmax, tau)

# Test: modellens tid på strekningen 10-20 m
print(modelltid(10, 20, 8.0, 1.5))`;

const OUT_INTERVAL = `1.4288739089387095`;

const CODE_ERROR = `def feil(vmax, tau):
    sum_feil = 0
    for d1, d2, t_maalt in maalinger:
        t_modell = modelltid(d1, d2, vmax, tau)
        sum_feil = sum_feil + (t_modell - t_maalt) ** 2
    return sum_feil

print(feil(8.0, 1.5))   # et dårlig gjett
print(feil(8.5, 1.3))   # et bedre gjett`;

const OUT_ERROR = `0.06277676565599925
4.5056049153184774e-05`;

const CODE_SEARCH = `beste_feil = 1e9
beste_vmax = None
beste_tau = None

for vmax in np.arange(5, 12.001, 0.05):
    for tau in np.arange(0.2, 3.001, 0.02):
        f = feil(vmax, tau)
        if f < beste_feil:
            beste_feil = f
            beste_vmax = vmax
            beste_tau = tau

print(f"vmax = {beste_vmax:.2f} m/s, tau = {beste_tau:.2f} s")`;

const OUT_SEARCH = `vmax = 8.50 m/s, tau = 1.30 s`;

const CODE_SCIPY = `from scipy.optimize import minimize

resultat = minimize(
    lambda p: feil(p[0], p[1]),
    x0=[beste_vmax, beste_tau],
    method="Nelder-Mead",
)
vmax, tau = resultat.x

print(f"vmax = {vmax:.2f} m/s, tau = {tau:.2f} s")
print(f"a0 = {vmax / tau:.2f} m/s^2")`;

const OUT_SCIPY = `vmax = 8.51 m/s, tau = 1.31 s
a0 = 6.50 m/s^2`;

const CODE_COMPARE = `for d1, d2, t_maalt in maalinger:
    t_modell = modelltid(d1, d2, vmax, tau)
    print(f"{d1}-{d2} m: målt {t_maalt:.2f} s, modell {t_modell:.2f} s")`;

const OUT_COMPARE = `0-10 m: målt 2.25 s, modell 2.25 s
10-20 m: målt 1.32 s, modell 1.32 s
20-30 m: målt 1.23 s, modell 1.23 s`;

const CODE_PLOT = `import matplotlib.pyplot as plt

t = np.linspace(0, 8, 400)
v = vmax * (1 - np.exp(-t / tau))

plt.plot(t, v)
plt.xlabel("Tid (s)")
plt.ylabel("Fart (m/s)")
plt.grid(True)
plt.show()`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignorer: brukeren kan markere og kopiere manuelt */
    }
  };
  return (
    <div className={styles.codeBlock}>
      <button type="button" className={styles.copyBtn} onClick={copy}>
        {copied ? "Kopiert!" : "Kopier"}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Output({ text }: { text: string }) {
  return (
    <div className={styles.outputBlock}>
      <div className={styles.outputLabel}>Du skal få (omtrent)</div>
      <pre>{text}</pre>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepHead}>
        <span className={styles.stepNum}>{n}</span>
        <h4>{title}</h4>
      </div>
      <div className={styles.stepBody}>{children}</div>
    </div>
  );
}

export default function SprintPythonHelp() {
  return (
    <div className={styles.prose} id="sprint-python-help">
      <p>
        Her lager du steg for steg et Python-program som estimerer <InlineMath math="v_{\max}" /> og{" "}
        <InlineMath math="\tau" /> fra målte tider, omtrent som kalkulatoren på denne siden. Kopier hver kodeblokk inn
        i en ny celle under den forrige, kjør den og sjekk at du får det samme som under «Du skal få». Ta deg tid til å
        forstå hva hver linje gjør før du går videre.
      </p>

      <h3>Før du begynner</h3>
      <ul>
        <li>
          <strong>Hvor skriver jeg koden?</strong> Det enkleste er Google Colab (colab.research.google.com). Du trenger
          bare en Google-konto og ingen installasjon. Velg «Ny notatbok», og trykk «+ Kode» for å lage en ny celle.
          Du kan også bruke Jupyter, Spyder eller VS Code hvis du har det installert.
        </li>
        <li>
          <strong>Hvordan kjører jeg en celle?</strong> Klikk i cellen og trykk <kbd>Shift</kbd> + <kbd>Enter</kbd>.
          Kjør cellene i rekkefølge, ovenfra og ned.
        </li>
        <li>
          Bibliotekene <code>numpy</code>, <code>scipy</code> og <code>matplotlib</code> er allerede installert i Colab.
          På egen maskin installerer du dem med <code>pip install numpy scipy matplotlib</code>.
        </li>
        <li>
          Python bruker <strong>punktum</strong> som desimaltegn: skriv <code>2.25</code>, ikke <code>2,25</code>.
          Innrykket (mellomrommene i starten av linjene) er en del av koden.
        </li>
      </ul>

      <h3>Planen</h3>
      <ol>
        <li>Legge inn de målte tidene.</li>
        <li>Skrive modellens posisjon <InlineMath math="x(t)" /> som en Python-funksjon.</li>
        <li>Snu funksjonen, så vi finner tiden <InlineMath math="t(x)" /> til en gitt posisjon.</li>
        <li>Regne ut modellens tid for en strekning: <InlineMath math="T=t(d_2)-t(d_1)" />.</li>
        <li>Måle hvor godt modellen passer med målingene (summen av kvadrerte feil).</li>
        <li>Prøve mange verdier av <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" /> og velge de beste.</li>
        <li>Finjustere svaret med et ferdig bibliotek.</li>
        <li>Sammenligne med målingene og tegne fartskurven.</li>
      </ol>

      <Step n={1} title="Legg inn dataene">
        <CodeBlock code={CODE_DATA} />
        <ul>
          <li>
            <code>import numpy as np</code> henter inn biblioteket numpy, som har matematikkfunksjoner. Vi kaller det{" "}
            <code>np</code>.
          </li>
          <li>Linjer som begynner med <code>#</code> er kommentarer. Python hopper over dem.</li>
          <li>
            <code>maalinger</code> er en <em>liste</em> med tre <em>tupler</em>. Hver tuppel er (startposisjon, sluttposisjon,
            tid). Dette er eksempeldata, så du kan sjekke at programmet gir riktig svar. Du bytter til dine egne tider til slutt.
          </li>
        </ul>
      </Step>

      <Step n={2} title="Modellen som en funksjon">
        <CodeBlock code={CODE_MODEL} />
        <Output text={OUT_MODEL} />
        <ul>
          <li>
            <code>def</code> lager en funksjon. Alt som er rykket inn under den, hører til funksjonen.{" "}
            <code>return</code> sier hva funksjonen gir tilbake.
          </li>
          <li>
            <code>np.exp(x)</code> er <InlineMath math="e^x" />. Sammenlign linjen med formelen{" "}
            <InlineMath math="x(t)=v_{\max}\bigl(t-\tau(1-e^{-t/\tau})\bigr)" /> fra teoridelen.
          </li>
          <li>Regn ut svaret for hånd. Stemmer det med utskriften?</li>
        </ul>
      </Step>

      <Step n={3} title="Fra posisjon til tid">
        <p>
          Fotocellene gir oss <em>tider</em> ved gitte <em>posisjoner</em>, men modellen gir posisjon som funksjon av
          tid. Vi må derfor finne tiden <InlineMath math="t" /> der <InlineMath math="x(t)=d" />. Det er vanskelig å
          løse med formel, så vi bruker et triks: regn ut posisjonen for veldig mange tidspunkter, og les av hvilken
          tid som hører til posisjonen vi ser etter.
        </p>
        <CodeBlock code={CODE_INVERT} />
        <Output text={OUT_INVERT} />
        <ul>
          <li>
            <code>np.linspace(0, 15, 3001)</code> lager 3001 jevnt fordelte tall fra 0 til 15. Dette er tidspunktene
            våre (hvert 0,005 s).
          </li>
          <li>
            <code>posisjon(t_grid, vmax, tau)</code> regner ut posisjonen for alle tidspunktene på én gang.
          </li>
          <li>
            <code>np.interp(d, x_grid, t_grid)</code> finner hvilken tid i <code>t_grid</code> som hører til
            posisjonen <code>d</code>, ved å trekke rette linjer mellom punktene. Det virker fordi posisjonen alltid
            øker med tiden.
          </li>
          <li>
            Vær oppmerksom på: Hvis løperen ikke rekker distansen <code>d</code> på 15 s, gir{" "}
            <code>np.interp</code> et feil svar uten å varsle. For 40 m er 15 s mer enn nok.
          </li>
        </ul>
      </Step>

      <Step n={4} title="Modellens tid for en strekning">
        <CodeBlock code={CODE_INTERVAL} />
        <Output text={OUT_INTERVAL} />
        <p>
          Løperen starter alltid ved 0 m. Tiden på strekningen <InlineMath math="d_1" />–<InlineMath math="d_2" /> er
          derfor tiden fram til <InlineMath math="d_2" /> minus tiden fram til <InlineMath math="d_1" />. Hva
          blir svaret for en strekning som starter på 0 m?
        </p>
      </Step>

      <Step n={5} title="Hvor godt passer modellen?">
        <p>
          For hvert valg av <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" /> regner vi ut modellens tid
          for hver strekning, tar forskjellen til den målte tiden, kvadrerer den og summerer. Jo mindre tall, jo bedre
          passer modellen.
        </p>
        <CodeBlock code={CODE_ERROR} />
        <Output text={OUT_ERROR} />
        <ul>
          <li>
            <code>for d1, d2, t_maalt in maalinger:</code> går gjennom listen, én måling om gangen, og deler hver
            tuppel i tre variabler.
          </li>
          <li>
            <code>** 2</code> betyr «opphøyd i andre». Hvorfor kvadrerer vi forskjellene i stedet for bare å legge dem
            sammen?
          </li>
        </ul>
      </Step>

      <Step n={6} title="Finn de beste verdiene">
        <p>
          Nå prøver vi mange kombinasjoner av <InlineMath math="v_{\max}" /> (5 til 12 m/s) og{" "}
          <InlineMath math="\tau" /> (0,2 til 3 s), og husker hvilken som ga minst feil. Dette kan ta noen sekunder.
        </p>
        <CodeBlock code={CODE_SEARCH} />
        <Output text={OUT_SEARCH} />
        <ul>
          <li>
            To <code>for</code>-løkker inni hverandre: for hver <code>vmax</code> prøves alle <code>tau</code>.{" "}
            <code>np.arange(5, 12.001, 0.05)</code> lager tallene 5, 5,05, 5,10, … og videre til 12.
          </li>
          <li>
            <code>if f &lt; beste_feil:</code> oppdaterer «beste så langt» hver gang vi finner noe bedre.
          </li>
          <li>
            I utskriften setter <code>{"{beste_vmax:.2f}"}</code> inn verdien av <code>beste_vmax</code> med to
            desimaler.
          </li>
        </ul>
      </Step>

      <Step n={7} title="Finjuster med scipy">
        <p>
          Rutenettsøket gir bare svar i hele steg. Biblioteket <code>scipy</code> kan starte i det beste punktet vi
          fant og gå videre i små steg mot enda mindre feil.
        </p>
        <CodeBlock code={CODE_SCIPY} />
        <Output text={OUT_SCIPY} />
        <ul>
          <li>
            <code>minimize</code> får en funksjon og et startpunkt, og leter etter verdier som gjør funksjonen så liten
            som mulig.
          </li>
          <li>
            <code>lambda p: feil(p[0], p[1])</code> er en liten funksjon som tar en liste <code>p</code> med to tall og
            sender dem videre til <code>feil</code>. Det er den formen <code>minimize</code> krever.
          </li>
        </ul>
        <p>
          Legg inn de samme tre tidene som en testperson i kalkulatoren på denne siden. Får du det samme svaret som i
          Python?
        </p>
      </Step>

      <Step n={8} title="Sammenlign med målingene og tegn fartskurven">
        <CodeBlock code={CODE_COMPARE} />
        <Output text={OUT_COMPARE} />
        <CodeBlock code={CODE_PLOT} />
        <p>
          Den andre kodeblokken bruker <InlineMath math="v(t)=v_{\max}(1-e^{-t/\tau})" /> og tegner fartskurven for
          løperen. Sammenlign med fartsplottet på denne siden.
        </p>
      </Step>

      <h3 className={styles.partTitle}>Bruk dine egne data</h3>
      <p>
        Bytt ut tidene i <code>maalinger</code> (steg 1) med dine egne, og kjør alle cellene på nytt fra steg 1.
      </p>

      <h3>Når det ikke virker</h3>
      <ul>
        <li>
          <code>{"NameError: name '…' is not defined"}</code>: Du har ikke kjørt cellen som lager den. Kjør alle cellene
          ovenfra og ned.
        </li>
        <li>
          <code>IndentationError</code> eller <code>SyntaxError</code>: Sjekk innrykket, kolon på slutten av{" "}
          <code>def</code>, <code>for</code> og <code>if</code>, og at alle parenteser er lukket.
        </li>
        <li>
          <code>ModuleNotFoundError</code>: Biblioteket er ikke installert. Kjør for eksempel{" "}
          <code>pip install scipy</code>.
        </li>
        <li>
          Svaret havner helt i kanten av søkeområdet (for eksempel <code>tau = 3.00</code>): Enten passer tidene dårlig
          med modellen, eller du må utvide området i løkkene.
        </li>
      </ul>

      <h3 className={styles.partTitle}>Utfordringer</h3>
      <ol className={styles.questions}>
        <li>
          Hva skjer med <InlineMath math="\tau" /> når du bare bruker to strekninger, og når du legger til en måling
          fra 0 m?
        </li>
        <li>
          Lag en funksjon <code>tilpass(maalinger)</code> som tar en liste med målinger og gir tilbake{" "}
          <code>vmax</code> og <code>tau</code>. Bruk den på flere personer.
        </li>
        <li>
          Tegn posisjonen <InlineMath math="x(t)" /> ved hjelp av funksjonen <code>posisjon</code>. Legg inn de målte
          tidene fra 0 m som punkter i samme plott.
        </li>
        <li>
          Hvor lang tid bruker løperen på 100 m ifølge modellen? Er det realistisk? Hvorfor, eller hvorfor ikke?
        </li>
        <li>
          Endre én av tidene med 0,02 s. Hvor mye endrer <InlineMath math="v_{\max}" /> og{" "}
          <InlineMath math="\tau" /> seg? Hva forteller det om hvor sikre estimatene er?
        </li>
      </ol>
    </div>
  );
}
