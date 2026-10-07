"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { fitKeller } from "@/lib/sprintModel";
import styles from "./sprint.module.css";
import SpeedPlot from "./SpeedPlot";
import ProfilePlot from "./ProfilePlot";
import SprintTheory from "./SprintTheory";

interface Person {
  name: string | null;
  email: string;
}

interface SprintResult {
  id: string;
  startM: number;
  endM: number;
  timeS: number;
  createdBy: Person;
}

interface SprintSubject {
  id: string;
  name: string;
  createdBy: Person;
  results: SprintResult[];
}

const PRESETS: [number, number][] = [
  [0, 10],
  [0, 20],
  [0, 30],
  [10, 20],
  [20, 30],
  [30, 40],
];

const fmt = (n: number, d = 2) => n.toFixed(d).replace(".", ",");
const parseNum = (s: string) => parseFloat(s.trim().replace(",", "."));
const G_ACC = 9.81; // m/s², til visning av akselerasjon i g

type SpeedUnit = "ms" | "kmh";
type AccUnit = "ms2" | "g";

export default function SprintDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [subjects, setSubjects] = useState<SprintSubject[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [subjectError, setSubjectError] = useState("");

  const [subjectId, setSubjectId] = useState("");
  const [startM, setStartM] = useState("0");
  const [endM, setEndM] = useState("30");
  const [timeS, setTimeS] = useState("");
  const [resultError, setResultError] = useState("");
  const [saving, setSaving] = useState(false);
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("ms");
  const [accUnit, setAccUnit] = useState<AccUnit>("ms2");
  const [showPlot, setShowPlot] = useState(false);
  const plotRef = useRef<HTMLElement>(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLElement>(null);
  const [showTheory, setShowTheory] = useState(false);
  const theoryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (showPlot) plotRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showPlot]);

  useEffect(() => {
    if (showProfile) profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showProfile]);

  useEffect(() => {
    if (showTheory) theoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showTheory]);

  const user = session?.user;
  const isStaff = user?.role === "admin" || user?.role === "teacher";
  const hasAccess = !!user && (user.course === "sprint" || user.role === "admin");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/sprint/login");
    else if (status === "authenticated" && !hasAccess) router.replace("/");
  }, [status, hasAccess, router]);

  // Laster testpersoner. Brukes både ved første lasting, etter egne endringer og ved automatisk oppdatering.
  const requestCounter = useRef(0);
  const knownResults = useRef<Map<string, number> | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());

  const load = async () => {
    const myRequest = ++requestCounter.current;
    try {
      const res = await fetch("/api/sprint/subjects", { cache: "no-store" });
      if (!res.ok) return;
      const data: SprintSubject[] = await res.json();
      // Ignorer svar som er forbigått av en nyere forespørsel (unngår at gamle data overskriver nye).
      if (myRequest !== requestCounter.current) return;

      // Marker rader som er nye eller har fått flere resultater siden forrige henting.
      const prev = knownResults.current;
      const next = new Map(data.map((d) => [d.id, d.results.length] as [string, number]));
      if (prev) {
        const changed = data.filter((d) => prev.get(d.id) !== d.results.length).map((d) => d.id);
        if (changed.length > 0) {
          setFlash(new Set(changed));
          setTimeout(() => setFlash(new Set()), 3000);
        }
      }
      knownResults.current = next;
      setSubjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Første lasting, og automatisk oppdatering hvert 5. sekund så lenge fanen er synlig.
  useEffect(() => {
    if (!hasAccess) return;
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => clearInterval(id);
  }, [hasAccess]);

  const fits = useMemo(
    () => subjects.map((s) => ({ subject: s, fit: fitKeller(s.results) })),
    [subjects]
  );

  const canDelete = (p: Person) => isStaff || p.email === user?.email;

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError("");
    const res = await fetch("/api/sprint/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubjectError(data.error || "Noe gikk galt");
      return;
    }
    setNewName("");
    setSubjects((prev) => [...prev, data]);
    setSubjectId(data.id);
  };

  const addResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultError("");
    if (!subjectId) {
      setResultError("Velg en testperson først.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sprint/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          startM: parseNum(startM),
          endM: parseNum(endM),
          timeS: parseNum(timeS),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultError(data.error || "Noe gikk galt");
        return;
      }
      setTimeS("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deleteResult = async (id: string) => {
    const res = await fetch(`/api/sprint/results/${id}`, { method: "DELETE" });
    if (res.ok) await load();
    else alert((await res.json()).error || "Kunne ikke slette");
  };

  const deleteSubject = async (s: SprintSubject) => {
    if (!confirm(`Slette ${s.name} og alle resultatene?`)) return;
    const res = await fetch(`/api/sprint/subjects/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      if (subjectId === s.id) setSubjectId("");
      await load();
    } else alert((await res.json()).error || "Kunne ikke slette");
  };

  if (status === "loading" || !hasAccess) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Laster …</div>;
  }

  const personLabel = (p: Person) => p.name || p.email;

  const speedLabel = speedUnit === "kmh" ? "km/t" : "m/s";
  const showSpeed = (v: number) => fmt(speedUnit === "kmh" ? v * 3.6 : v, speedUnit === "kmh" ? 1 : 2);
  const accLabel = accUnit === "g" ? "g" : "m/s²";
  const showAcc = (a: number) => fmt(accUnit === "g" ? a / G_ACC : a);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          Sprintmodellen<small>Keller (1973)</small>
        </div>
        <div className={styles.navRight}>
          <span>{user?.name || user?.email}</span>
          <button className={styles.ghostBtn} onClick={() => signOut({ callbackUrl: "/sprint/login" })}>
            Logg ut
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.formGrid}>
          <form className={styles.card} onSubmit={addSubject}>
            <h2>Ny testperson</h2>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="new-name">Navn</label>
                <input
                  id="new-name"
                  className={styles.input}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Fornavn (eller fullt navn)"
                  maxLength={80}
                  required
                />
              </div>
              <button type="submit" className={styles.primaryBtn} id="add-subject-btn">Legg til</button>
            </div>
            {subjectError && <div className={styles.error}>{subjectError}</div>}
          </form>

          <form className={styles.card} onSubmit={addResult}>
            <h2>Nytt resultat</h2>
            <div className={styles.row}>
              <div className={styles.field} style={{ flex: 2 }}>
                <label htmlFor="subject-select">Testperson</label>
                <select
                  id="subject-select"
                  className={styles.input}
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  <option value="">Velg …</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="start-m">Fra (m)</label>
                <input id="start-m" className={styles.input} inputMode="decimal" value={startM} onChange={(e) => setStartM(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label htmlFor="end-m">Til (m)</label>
                <input id="end-m" className={styles.input} inputMode="decimal" value={endM} onChange={(e) => setEndM(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label htmlFor="time-s">Tid (s)</label>
                <input id="time-s" className={styles.input} inputMode="decimal" value={timeS} onChange={(e) => setTimeS(e.target.value)} placeholder="f.eks. 4,12" required />
              </div>
              <button type="submit" className={styles.primaryBtn} disabled={saving} id="add-result-btn">Lagre</button>
            </div>
            <div className={styles.presets}>
              {PRESETS.map(([a, b]) => {
                const active = parseNum(startM) === a && parseNum(endM) === b;
                return (
                  <button
                    key={`${a}-${b}`}
                    type="button"
                    className={`${styles.preset} ${active ? styles.presetActive : ""}`}
                    onClick={() => {
                      setStartM(String(a));
                      setEndM(String(b));
                    }}
                  >
                    {a}–{b} m
                  </button>
                );
              })}
            </div>
            {resultError && <div className={styles.error}>{resultError}</div>}
          </form>
        </section>

        <section className={styles.card}>
          <div className={styles.tableHead}>
            <h2>
              Testpersoner og estimater
              <span className={styles.live} title="Tabellen oppdateres automatisk hvert 5. sekund">
                <span className={styles.liveDot} />
                Live
              </span>
            </h2>
            <div className={styles.unitToggles}>
              <div className={styles.segment} role="group" aria-label="Enhet for fart">
                <button type="button" className={speedUnit === "ms" ? styles.segActive : ""} onClick={() => setSpeedUnit("ms")}>
                  m/s
                </button>
                <button type="button" className={speedUnit === "kmh" ? styles.segActive : ""} onClick={() => setSpeedUnit("kmh")}>
                  km/t
                </button>
              </div>
              <div className={styles.segment} role="group" aria-label="Enhet for akselerasjon">
                <button type="button" className={accUnit === "ms2" ? styles.segActive : ""} onClick={() => setAccUnit("ms2")}>
                  m/s²
                </button>
                <button type="button" className={accUnit === "g" ? styles.segActive : ""} onClick={() => setAccUnit("g")}>
                  g
                </button>
              </div>
            </div>
          </div>
          {loading ? (
            <div className={styles.empty}>Laster …</div>
          ) : fits.length === 0 ? (
            <div className={styles.empty}>Ingen testpersoner ennå. Legg til den første ovenfor.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table} id="sprint-table">
                <thead>
                  <tr>
                    <th>Testperson</th>
                    <th>Målinger</th>
                    <th>v<sub>max</sub></th>
                    <th>τ</th>
                    <th>a<sub>0</sub> = v<sub>max</sub>/τ</th>
                    <th>Avvik (RMS)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fits.map(({ subject, fit }) => (
                    <tr key={subject.id} className={flash.has(subject.id) ? styles.flashRow : undefined}>
                      <td>
                        <div className={styles.name}>{subject.name}</div>
                        <div className={styles.sub}>lagt inn av {personLabel(subject.createdBy)}</div>
                      </td>
                      <td>
                        {subject.results.length === 0 ? (
                          <span className={styles.dash}>–</span>
                        ) : (
                          <div className={styles.chips}>
                            {subject.results.map((r) => (
                              <span key={r.id} className={`${styles.chip} ${canDelete(r.createdBy) ? "" : styles.chipNoDel}`} title={`Lagt inn av ${personLabel(r.createdBy)}`}>
                                {r.startM}–{r.endM} m · {fmt(r.timeS)} s
                                {canDelete(r.createdBy) && (
                                  <button className={styles.chipX} onClick={() => deleteResult(r.id)} aria-label="Slett måling">×</button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={styles.num}>
                        {fit.vmax !== null ? <><span className={styles.big}>{showSpeed(fit.vmax)}</span><span className={styles.unit}>{speedLabel}</span>{fit.seVmax !== null && <div className={styles.sub}>± {showSpeed(fit.seVmax)}</div>}</> : <span className={styles.dash}>–</span>}
                      </td>
                      <td className={styles.num}>
                        {fit.tau !== null ? <><span className={styles.big}>{fmt(fit.tau)}</span><span className={styles.unit}>s</span>{fit.seTau !== null && <div className={styles.sub}>± {fmt(fit.seTau)}</div>}</> : <span className={styles.dash}>–</span>}
                      </td>
                      <td className={styles.num}>
                        {fit.a0 !== null ? <>{showAcc(fit.a0)}<span className={styles.unit}>{accLabel}</span></> : <span className={styles.dash}>–</span>}
                      </td>
                      <td className={styles.num}>
                        {fit.rms !== null && (fit.dof ?? 0) > 0 ? <>{fmt(fit.rms, 3)}<span className={styles.unit}>s</span></> : <span className={styles.dash} title={fit.rms !== null ? "Eksakt tilpasning: to målinger gir ingen kontroll av modellen" : undefined}>–</span>}
                      </td>
                      <td>
                        {canDelete(subject.createdBy) && (
                          <button className={styles.delBtn} onClick={() => deleteSubject(subject)} title="Slett testperson">Slett</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className={styles.plotBar}>
          <button
            type="button"
            id="toggle-plot-btn"
            className={styles.primaryBtn}
            onClick={() => setShowPlot((v) => !v)}
          >
            {showPlot ? "Skjul fartsplott" : "Lag fartsplott"}
          </button>
          <button
            type="button"
            id="toggle-profile-btn"
            className={styles.primaryBtn}
            onClick={() => setShowProfile((v) => !v)}
          >
            {showProfile ? "Skjul profilplott" : "Lag profilplott"}
          </button>
          <button
            type="button"
            id="toggle-theory-btn"
            className={styles.primaryBtn}
            onClick={() => setShowTheory((v) => !v)}
          >
            {showTheory ? "Skjul teori" : "Vis teori"}
          </button>
        </div>

        {showPlot && (
          <section className={styles.card} style={{ marginTop: "1.5rem" }} ref={plotRef}>
            <h2>Fartskurver</h2>
            <SpeedPlot
              subjects={fits.map(({ subject, fit }) => ({
                id: subject.id,
                name: subject.name,
                fit,
                measurements: subject.results,
              }))}
            />
          </section>
        )}

        {showProfile && (
          <section className={styles.card} style={{ marginTop: "1.5rem" }} ref={profileRef}>
            <h2>Profilplott</h2>
            <ProfilePlot
              subjects={fits.map(({ subject, fit }) => ({
                id: subject.id,
                name: subject.name,
                fit,
                measurements: subject.results,
              }))}
            />
          </section>
        )}

        {showTheory && (
          <section className={styles.card} style={{ marginTop: "1.5rem" }} ref={theoryRef}>
            <h2>Teori: Kellers sprintmodell</h2>
            <SprintTheory />
          </section>
        )}
      </main>
    </div>
  );
}
