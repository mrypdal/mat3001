"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import styles from "./sprint.module.css";

export default function SprintTask() {
  return (
    <div className={styles.prose} id="sprint-task">
      <div className={styles.callout}>
        <p style={{ margin: "0.5rem 0", fontWeight: 600, fontSize: "1.1rem" }}>
          Hvem i klassen vinner et 40 m-løp, og hva blir tiden?
        </p>
        <p style={{ margin: "0.5rem 0" }}>
          Bruk modellen til å tippe resultatet for hver testperson <em>før</em> vi tester det på neste samling.
        </p>
      </div>

      <h3>Bakgrunn</h3>
      <p>
        Dere har målt tider på ulike strekninger og estimert <InlineMath math="v_{\max}" /> og{" "}
        <InlineMath math="\tau" /> for hver testperson. På neste samling løper vi 40 m fra stillestående start, og
        sammenligner de målte tidene med deres spådommer. Modellen er mest presis akkurat for de første 30–40 m, så
        dette er en rettferdig test.
      </p>
      <div className={styles.callout}>
        <p style={{ margin: "0.5rem 0" }}>
          <strong>Viktig:</strong> Ikke legg inn en måling fra 0 m til 40 m i tabellen før testen er gjennomført.
          Da ville dere ikke lenger spå, men tilpasse modellen til fasiten.
        </p>
      </div>

      <h3>Oppgave</h3>
      <ol>
        <li>
          For hver testperson: Bruk de estimerte verdiene av <InlineMath math="v_{\max}" /> og{" "}
          <InlineMath math="\tau" /> til å beregne tiden <InlineMath math="T_{40}" /> det tar å løpe 40 m fra
          stillestående start. Tiden er løsningen av
          <BlockMath math={String.raw`v_{\max}\left(T-\tau\left(1-e^{-T/\tau}\right)\right)=40.`} />
        </li>
        <li>Lag en rangert liste over forventede tider. Hvem tror du vinner?</li>
        <li>
          Oppgi for hver tid hvor sikker du er, for eksempel «5,9 s ± 0,2 s». Begrunn usikkerheten din.
        </li>
        <li>Skriv ned spådommene dine og ta dem med til neste samling.</li>
      </ol>

      <h3>Tre måter å finne <InlineMath math="T_{40}" /></h3>
      <ul>
        <li>
          <strong>Fra grafen.</strong> Åpne «Lag fartsplott» og velg «Distanse mot tid». Les av tiden der kurven til
          testpersonen krysser 40 m.
        </li>
        <li>
          <strong>Med din egen Python-kalkulator.</strong> Bruk funksjonen <code>modelltid(0, 40, vmax, tau)</code>.
          Se «Vis Pythonhjelp».
        </li>
        <li>
          <strong>Ved regning.</strong> Ligningen over kan ikke løses med en enkel formel, men du kan prøve deg fram,
          eller starte med tilnærmingen <InlineMath math="T\approx\dfrac{40}{v_{\max}}+\tau" />. Hva antar du om{" "}
          <InlineMath math="e^{-T/\tau}" /> da? Sjekk selv hvor godt tilnærmingen passer, for eksempel mot grafen,
          særlig når <InlineMath math="\tau" /> er stor.
        </li>
      </ul>

      <h3>Tenk deg om</h3>
      <ul>
        <li>
          Hvilke målinger av en testperson sier mest om hvordan <em>starten</em> er? Hvilke testpersoner har du mest
          tillit til prediksjonen for, og hvorfor? (Se på hvilke strekninger som er målt, og på usikkerheten (±) i
          tabellen.)
        </li>
        <li>
          Hvor stort avvik mellom spådd og målt tid forventer du? Skal det være like stort for alle testpersonene?
        </li>
        <li>
          Hvilke forhold i selve løpet (start, underlag, utmattelse, tidtaking) kan gjøre at målt tid avviker fra
          modellen?
        </li>
      </ul>

      <h3 className={styles.partTitle}>På neste samling</h3>
      <ol className={styles.questions}>
        <li>Mål 40 m-tiden til testpersonene, fra stillestående start og med samme starttidtaking for alle.</li>
        <li>Regn ut avviket (målt − spådd) for hver person. Hvem var best på å spå?</li>
        <li>Er avvikene tilfeldige, eller er de systematiske (for eksempel alltid at målt tid er lengre)? Hva kan forklare det?</li>
        <li>
          Legg inn 0–40 m i tabellen. Hvordan endres <InlineMath math="v_{\max}" /> og <InlineMath math="\tau" />, og
          hvordan endres usikkerheten?
        </li>
      </ol>
    </div>
  );
}
