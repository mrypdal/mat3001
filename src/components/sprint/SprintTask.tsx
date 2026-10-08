"use client";

import React from "react";
import { InlineMath } from "react-katex";
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
          stillestående start.
        </li>
        <li>Lag en rangert liste over forventede tider. Hvem tror du vinner?</li>
        <li>
          Oppgi for hver tid hvor sikker du er, for eksempel «5,9 s ± 0,2 s». Begrunn usikkerheten din.
        </li>
        <li>Skriv ned spådommene dine og ta dem med til neste samling.</li>
      </ol>
    </div>
  );
}
