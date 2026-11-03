"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PyStatus = "idle" | "loading" | "ready" | "error";

export interface RunResult {
  ok: boolean;
  stdout: string;
  error?: string;
}

const TIMEOUT_MS = 45000;

/**
 * Python i nettleseren (Pyodide i en Web Worker). Workeren startes først når den trengs.
 * Kjører den for lenge, stoppes den og startes på nytt, og tidligere vellykkede celler kjøres om igjen
 * slik at funksjoner fra tidligere steg fortsatt finnes.
 */
export function usePyodide() {
  const workerRef = useRef<Worker | null>(null);
  const startRef = useRef<Promise<void> | null>(null);
  const pending = useRef(new Map<number, (r: RunResult) => void>());
  const nextId = useRef(1);
  const history = useRef(new Map<number, string>());
  const [status, setStatus] = useState<PyStatus>("idle");
  const [statusText, setStatusText] = useState("Python er ikke startet");

  const kill = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    startRef.current = null;
    pending.current.clear();
  }, []);

  const start = useCallback((): Promise<void> => {
    if (startRef.current) return startRef.current;
    setStatus("loading");
    setStatusText("Starter Python …");
    const p = new Promise<void>((resolve, reject) => {
      const w = new Worker("/pyodide-worker.js");
      workerRef.current = w;
      const fail = (message: string) => {
        setStatus("error");
        setStatusText(`Kunne ikke starte Python: ${message}`);
        kill();
        reject(new Error(message));
      };
      w.onmessage = (e: MessageEvent) => {
        const m = e.data;
        if (m.type === "status") setStatusText(m.text);
        else if (m.type === "ready") {
          setStatus("ready");
          setStatusText("Python er klar");
          resolve();
        } else if (m.type === "initError") fail(m.message);
        else if (m.type === "result") {
          const cb = pending.current.get(m.id);
          pending.current.delete(m.id);
          cb?.(m);
        }
      };
      w.onerror = () => fail("Fikk ikke lastet Python. Sjekk nettforbindelsen.");
      w.postMessage({ type: "init" });
    });
    p.catch(() => {});
    startRef.current = p;
    return p;
  }, [kill]);

  const runRaw = useCallback(
    (code: string) =>
      new Promise<RunResult>((resolve) => {
        const id = nextId.current++;
        pending.current.set(id, resolve);
        workerRef.current?.postMessage({ type: "run", id, code });
      }),
    []
  );

  /** Kjører kode som del av steg `step`. */
  const run = useCallback(
    async (step: number, code: string): Promise<RunResult> => {
      try {
        await start();
      } catch (e) {
        return { ok: false, stdout: "", error: (e as Error).message };
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<"timeout">((res) => {
        timer = setTimeout(() => res("timeout"), TIMEOUT_MS);
      });
      const result = await Promise.race([runRaw(code), timeout]);
      clearTimeout(timer);
      if (result === "timeout") {
        kill();
        setStatus("idle");
        setStatusText("Python ble stoppet og startes på nytt ved neste kjøring");
        try {
          await start();
          for (const [s, c] of [...history.current.entries()].sort((a, b) => a[0] - b[0])) {
            if (s < step) await runRaw(c);
          }
        } catch {
          /* statusen viser feilen */
        }
        return {
          ok: false,
          stdout: "",
          error: "Koden brukte over 45 sekunder og ble stoppet. Sjekk for en løkke som aldri slutter.",
        };
      }
      if (result.ok) history.current.set(step, code);
      return result;
    },
    [start, runRaw, kill]
  );

  /** Tøm alt Python har lært og start på nytt. */
  const restart = useCallback(() => {
    kill();
    history.current.clear();
    setStatus("idle");
    setStatusText("Python er ikke startet");
  }, [kill]);

  useEffect(() => () => kill(), [kill]);

  return { status, statusText, start, run, restart };
}
