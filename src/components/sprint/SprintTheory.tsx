"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import styles from "./sprint.module.css";

const M = (s: TemplateStringsArray) => String.raw(s);

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

export default function SprintTheory() {
  return (
    <div className={styles.prose} id="sprint-theory">
      {/* DEL 1 */}
      <h3>Del 1: Modellen</h3>
      <p>
        Sprinteren starter i ro ved 0 m. Kellers modell beskriver farten <InlineMath math="v" /> og posisjonen{" "}
        <InlineMath math="x" /> som funksjon av tiden <InlineMath math="t" /> (sekunder etter start):
      </p>
      <div className={styles.callout}>
        <BlockMath math={M`v(t)=v_{\max}\left(1-e^{-t/\tau}\right)`} />
        <BlockMath math={M`x(t)=v_{\max}\left(t-\tau\left(1-e^{-t/\tau}\right)\right)`} />
      </div>
      <p>Her er <InlineMath math="e\approx 2{,}718" /> Eulers tall, og modellen har to parametere:</p>
      <ul>
        <li>
          <InlineMath math="v_{\max}" />: maksimal fart (m/s).
        </li>
        <li>
          <InlineMath math="\tau" /> (tau): en tidskonstant (s). Den bestemmer hvor raskt sprinteren nærmer seg{" "}
          <InlineMath math="v_{\max}" />.
        </li>
      </ul>

      <h3>Fra modell til målte tider</h3>
      <p>
        Fotocellene måler hvor lang tid sprinteren bruker mellom to posisjoner <InlineMath math="d_1" /> og{" "}
        <InlineMath math="d_2" />, for eksempel 10–20 m. Alle løp starter i ro ved 0 m, så dette er en{" "}
        <em>flyingtid</em>. Hvis <InlineMath math="t(x)" /> er tiden sprinteren trenger fra start til posisjon{" "}
        <InlineMath math="x" />, er modellens tid for strekningen
      </p>
      <BlockMath math={M`T = t(d_2) - t(d_1).`} />
      <p>
        Vi finner <InlineMath math="t(x)" /> ved å løse ligningen <InlineMath math="x(t)=x" />. Den kan ikke løses med en
        enkel formel, så kalkulatoren prøver mange verdier av <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" />{" "}
        og velger de som gjør summen av kvadratene til avvikene mellom modelltid og målt tid minst mulig
        (<em>minste kvadraters metode</em>). Siden vi har to ukjente, trenger vi minst to ulike strekninger.
      </p>

      <h3>Forutsetninger i modellen</h3>
      <ul>
        <li>Sprinteren starter i ro.</li>
        <li>
          Vi ser på gjennomsnittet over hele skritt, ikke på svingningene i fart og kraft innenfor hvert enkelt skritt.
        </li>
        <li>
          Løperens evne til å skape netto horisontal kraft avtar <em>lineært</em> med farten: den er størst ved start
          og er null ved <InlineMath math="v_{\max}" />.
        </li>
        <li>Det tas ikke hensyn til utmattelse.</li>
      </ul>

      {/* DEL 2 */}
      <h3 className={styles.partTitle}>Del 2: Utledning</h3>
      <p>
        Du trenger Newtons andre lov, derivasjon (blant annet at <InlineMath math="e^{kt}" /> har den deriverte{" "}
        <InlineMath math="k\,e^{kt}" />) og å vite at distanse er arealet under fartskurven.
      </p>

      <Step n={1} title="Newtons andre lov og kraften i et skritt">
        <p>
          Newtons andre lov for løperen sier at summen av de horisontale kreftene gir akselerasjonen:{" "}
          <InlineMath math="F_{\text{netto}}=ma" />. Deler vi på massen <InlineMath math="m" />, får vi kraft{" "}
          <em>per kilo</em> (enhet N/kg = m/s²):
        </p>
        <BlockMath math={M`a=\frac{F_{\text{netto}}}{m}.`} />
        <p>
          Kraften fra bakken varierer gjennom et skritt. Grovt sett er det to faser:
        </p>
        <ul>
          <li>
            <strong>Bremsefase (negativ):</strong> foten treffer bakken foran tyngdepunktet, og den horisontale kraften
            på løperen peker bakover.
          </li>
          <li>
            <strong>Framdriftsfase (positiv):</strong> foten er under og bak tyngdepunktet, og den horisontale kraften
            peker framover.
          </li>
        </ul>
        <p>
          Det er <em>nettoen</em> over skrittet, framdrift minus bremsing, som bestemmer den gjennomsnittlige
          akselerasjonen. Siden akselerasjonen er den deriverte av farten, <InlineMath math="a=\dfrac{dv}{dt}" />, kan
          vi skrive <InlineMath math="\dfrac{dv}{dt}=\dfrac{F_{\text{netto}}}{m}" />.
        </p>
      </Step>

      <Step n={2} title="Netto kraft avtar lineært med farten">
        <p>
          Hvor stor netto kraft løperen klarer å skape, avhenger av farten. Modellen antar at den avtar{" "}
          <em>lineært</em>: den er <InlineMath math="f_0" /> (per kilo) ved <InlineMath math="v=0" /> og null ved{" "}
          <InlineMath math="v=v_{\max}" />. Grafen av kraft mot fart er en rett linje mellom disse to punktene:
        </p>
        <BlockMath math={M`\frac{F_{\text{netto}}}{m}=f_0\left(1-\frac{v}{v_{\max}}\right).`} />
        <p>
          Da er <InlineMath math="f_0" /> akselerasjonen ved start, og når <InlineMath math="v=v_{\max}" /> er
          akselerasjonen null, slik at farten ikke øker mer. Setter vi dette inn i ligningen fra steg 1, får vi
        </p>
        <BlockMath math={M`\frac{dv}{dt}=f_0\left(1-\frac{v}{v_{\max}}\right).`} />
        <p>
          For å forenkle innfører vi en konstant <InlineMath math="\tau=\dfrac{v_{\max}}{f_0}" />. Den har enhet
          sekund. Da er <InlineMath math="f_0=v_{\max}/\tau" />, og
        </p>
        <BlockMath math={M`\frac{dv}{dt}=\frac{v_{\max}}{\tau}\left(1-\frac{v}{v_{\max}}\right)=\frac{v_{\max}-v}{\tau}.`} />
        <p>Akselerasjonen er altså proporsjonal med hvor langt farten er fra <InlineMath math="v_{\max}" />.</p>
      </Step>

      <Step n={3} title="Et skifte av variabel">
        <p>
          Vi innfører «fartsunderskuddet» <InlineMath math="u=v_{\max}-v" />, altså hvor mye fart som mangler. Siden{" "}
          <InlineMath math="v_{\max}" /> er en konstant, er <InlineMath math="\dfrac{du}{dt}=-\dfrac{dv}{dt}" />, og
        </p>
        <BlockMath math={M`\frac{du}{dt}=-\frac{v_{\max}-v}{\tau}=-\frac{u}{\tau}.`} />
        <p>
          Vi leter nå etter en funksjon <InlineMath math="u(t)" /> hvis deriverte er <InlineMath math="-\tfrac{1}{\tau}" />{" "}
          ganger funksjonen selv.
        </p>
      </Step>

      <Step n={4} title="Løsning for farten">
        <p>
          Vi vet at <InlineMath math="e^{kt}" /> har den deriverte <InlineMath math="k\,e^{kt}" />. Det passer med{" "}
          <InlineMath math="k=-1/\tau" />. Vi prøver derfor
        </p>
        <BlockMath math={M`u(t)=C\,e^{-t/\tau},`} />
        <p>der <InlineMath math="C" /> er en konstant. Vi sjekker med kjerneregelen:</p>
        <BlockMath math={M`u'(t)=C\cdot\left(-\frac{1}{\tau}\right)e^{-t/\tau}=-\frac{1}{\tau}\,u(t).\ \checkmark`} />
        <p>
          Funksjonen oppfyller ligningen. (Man kan vise at alle løsninger har denne formen. Det lærer du mer om når du
          jobber med differensialligninger.)
        </p>
        <p>
          Sprinteren starter i ro: <InlineMath math="v(0)=0" />, så <InlineMath math="u(0)=v_{\max}" />. Siden{" "}
          <InlineMath math="e^0=1" />, gir det <InlineMath math="C=v_{\max}" />. Da er{" "}
          <InlineMath math="v=v_{\max}-u" />:
        </p>
        <BlockMath math={M`v(t)=v_{\max}-v_{\max}e^{-t/\tau}=v_{\max}\left(1-e^{-t/\tau}\right).`} />
      </Step>

      <Step n={5} title="Posisjonen">
        <p>
          Farten er den deriverte av posisjonen, <InlineMath math="x'(t)=v(t)" />. Vi må altså finne en antiderivert av
          farten. Geometrisk er posisjonen arealet under fartskurven fra 0 til <InlineMath math="t" />:{" "}
          <InlineMath math="x(t)=\displaystyle\int_0^t v(s)\,ds" />.
        </p>
        <BlockMath math={M`x'(t)=v_{\max}-v_{\max}e^{-t/\tau}.`} />
        <ul>
          <li>
            Det første leddet, <InlineMath math="v_{\max}" />, har antiderivert <InlineMath math="v_{\max}\,t" />.
          </li>
          <li>
            For det andre leddet prøver vi <InlineMath math="v_{\max}\tau\,e^{-t/\tau}" />. Vi sjekker:
            <BlockMath math={M`\frac{d}{dt}\left(v_{\max}\tau\,e^{-t/\tau}\right)=v_{\max}\tau\cdot\left(-\frac{1}{\tau}\right)e^{-t/\tau}=-v_{\max}e^{-t/\tau}.\ \checkmark`} />
          </li>
        </ul>
        <p>Dermed er</p>
        <BlockMath math={M`x(t)=v_{\max}\,t+v_{\max}\tau\,e^{-t/\tau}+K,`} />
        <p>
          der <InlineMath math="K" /> er en konstant. Sprinteren starter ved 0 m, så <InlineMath math="x(0)=0" />:
        </p>
        <BlockMath math={M`0=0+v_{\max}\tau+K\quad\Rightarrow\quad K=-v_{\max}\tau.`} />
        <p>Setter vi inn og trekker sammen, får vi</p>
        <BlockMath math={M`x(t)=v_{\max}\,t+v_{\max}\tau\,e^{-t/\tau}-v_{\max}\tau=v_{\max}\left(t-\tau\left(1-e^{-t/\tau}\right)\right).`} />
        <p>Dette er modellen fra del 1.</p>
      </Step>

      {/* TENK SELV */}
      <h3 className={styles.partTitle}>Tenk selv</h3>
      <ol className={styles.questions}>
        <li>
          Hva er <InlineMath math="v(t)" /> når <InlineMath math="t=0" />, og hva skjer når <InlineMath math="t" /> er
          veldig stor?
        </li>
        <li>
          Regn ut <InlineMath math="v(\tau)/v_{\max}" />. Hva forteller det om hva <InlineMath math="\tau" /> betyr?
        </li>
        <li>
          Deriver <InlineMath math="v(t)" /> og sett inn <InlineMath math="t=0" />. Hva blir akselerasjonen ved start,
          uttrykt med <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" />?
        </li>
        <li>
          Når <InlineMath math="t" /> er mye større enn <InlineMath math="\tau" />, er <InlineMath math="e^{-t/\tau}" />{" "}
          nesten null. Hva blir <InlineMath math="x(t)" /> da, og hvordan er det sammenlignet med en løper som holder
          farten <InlineMath math="v_{\max}" /> hele veien?
        </li>
        <li>Hvorfor trenger vi minst to ulike strekninger for å finne både <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" />?</li>
      </ol>
    </div>
  );
}
