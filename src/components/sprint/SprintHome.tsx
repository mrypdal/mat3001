"use client";

import Link from "next/link";
import styles from "./sprint.module.css";
import s2 from "./samling2.module.css";
import SprintNav from "./SprintNav";
import { useSprintAccess } from "./useSprintAccess";

export default function SprintHome() {
  const { user, ready } = useSprintAccess();

  if (!ready) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Laster …</div>;
  }

  return (
    <div className={styles.page}>
      <SprintNav userLabel={user?.name || user?.email} />
      <main className={styles.main}>
        <h1 className={s2.homeTitle}>Velg samling</h1>
        <div className={s2.homeGrid}>
          <Link href="/sprint/samling-2" className={s2.homeCard} id="home-samling-2">
            <span className={s2.homeBadge}>Samling 2</span>
            <h2>Fartstap i sprint</h2>
            <p>
              Vi utvider modellen med utmattelse, tilpasser parametere til splittider fra VM og
              estimerer tidene dine på 100 m og 200 m.
            </p>
            <span className={s2.homeGo}>Åpne →</span>
          </Link>
          <Link href="/sprint/samling-1" className={s2.homeCard} id="home-samling-1">
            <span className={s2.homeBadge}>Samling 1 · arkiv</span>
            <h2>Kellers modell og 40 m</h2>
            <p>
              Testpersoner, målinger og estimater av v<sub>max</sub> og τ, med teori, Pythonhjelp og oppgaven om 40 m.
            </p>
            <span className={s2.homeGo}>Åpne →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
