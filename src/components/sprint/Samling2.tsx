"use client";

import React, { useState } from "react";
import styles from "./sprint.module.css";
import s2 from "./samling2.module.css";
import SprintNav from "./SprintNav";
import { useSprintAccess } from "./useSprintAccess";
import Samling2Theory from "./Samling2Theory";
import Samling2Lab from "./Samling2Lab";
import Samling2Predict from "./Samling2Predict";

const PARTS = [
  { id: 1, label: "Del 1", title: "Teori" },
  { id: 2, label: "Del 2", title: "Tilpass parametere" },
  { id: 3, label: "Del 3", title: "Din prediksjon" },
] as const;

type PartId = (typeof PARTS)[number]["id"];

function partFromHash(): PartId {
  if (typeof window === "undefined") return 1;
  const m = /^#del-(\d)$/.exec(window.location.hash);
  const n = m ? Number(m[1]) : 1;
  return (n === 2 || n === 3 ? n : 1) as PartId;
}

export default function Samling2() {
  const { user, ready } = useSprintAccess();
  const [part, setPart] = useState<PartId>(partFromHash);

  const choose = (id: PartId) => {
    setPart(id);
    window.history.replaceState(null, "", `#del-${id}`);
  };

  if (!ready) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Laster …</div>;
  }

  return (
    <div className={styles.page}>
      <SprintNav
        subtitle="Samling 2 · Fartstap"
        back={{ href: "/sprint", label: "← Samlinger" }}
        userLabel={user?.name || user?.email}
      />
      <main className={styles.main}>
        <div className={s2.partTabs} role="tablist" aria-label="Deler av samlingen">
          {PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={part === p.id}
              id={`part-tab-${p.id}`}
              className={`${s2.partTab} ${part === p.id ? s2.partTabActive : ""}`}
              onClick={() => choose(p.id)}
            >
              <span className={s2.partTabLabel}>{p.label}</span>
              <span className={s2.partTabTitle}>{p.title}</span>
            </button>
          ))}
        </div>

        {part === 1 && <Samling2Theory />}
        {part === 2 && <Samling2Lab />}
        {part === 3 && <Samling2Predict />}
      </main>
    </div>
  );
}
