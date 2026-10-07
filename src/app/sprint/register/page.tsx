"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SprintRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, course: "sprint", joinCode }),
    });
    if (res.ok) {
      router.push("/sprint/login");
    } else {
      const data = await res.json();
      setError(data.message === "User already exists" ? "E-posten er allerede registrert" : data.message || "Registrering feilet");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Opprett konto</h1>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "-1rem", marginBottom: "2rem" }}>
          Sprintmodellen – bruk tilgangskoden fra læreren
        </p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Navn</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fornavn Etternavn" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passord</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label htmlFor="joinCode">Tilgangskode</label>
            <input id="joinCode" type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required autoComplete="off" />
          </div>
          <button type="submit" className="btn">Registrer</button>
        </form>
        <div className="auth-footer">
          <p>Har du allerede konto? <Link href="/sprint/login">Logg inn her</Link></p>
        </div>
      </div>
    </div>
  );
}
