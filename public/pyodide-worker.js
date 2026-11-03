/* Web Worker som kjører Python (Pyodide) for Øvelse 4 i Samling 2.
 * Kjøres i en egen tråd slik at en uendelig løkke ikke fryser siden: hovedtråden kan stoppe workeren. */
importScripts("https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js");

let pyodide = null;
let ns = null;

async function init() {
  postMessage({ type: "status", text: "Laster Python …" });
  pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/" });
  postMessage({ type: "status", text: "Laster numpy og scipy …" });
  await pyodide.loadPackage(["numpy", "scipy"]);
  ns = pyodide.globals.get("dict")();
}

onmessage = async (e) => {
  const m = e.data;
  if (m.type === "init") {
    try {
      await init();
      postMessage({ type: "ready" });
    } catch (err) {
      postMessage({ type: "initError", message: String((err && err.message) || err) });
    }
  } else if (m.type === "run") {
    const out = [];
    pyodide.setStdout({ batched: (s) => out.push(s) });
    pyodide.setStderr({ batched: (s) => out.push(s) });
    try {
      await pyodide.runPythonAsync(m.code, { globals: ns });
      postMessage({ type: "result", id: m.id, ok: true, stdout: out.join("\n") });
    } catch (err) {
      postMessage({
        type: "result",
        id: m.id,
        ok: false,
        stdout: out.join("\n"),
        error: String((err && err.message) || err),
      });
    }
  }
};
