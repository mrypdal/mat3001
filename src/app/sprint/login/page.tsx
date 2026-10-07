"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SprintLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Feil e-post eller passord");
      return;
    }
    const session = await getSession();
    router.push(session?.user?.course === "sprint" || session?.user?.role === "admin" ? "/sprint" : "/");
    router.refresh();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sprintmodellen</h1>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "-1rem", marginBottom: "2rem" }}>
          Logg inn for å registrere sprinttester
        </p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passord</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn">Logg inn</button>
        </form>
        <div className="auth-footer">
          <p>Ingen konto? <Link href="/sprint/register">Registrer deg her</Link></p>
        </div>
      </div>
    </div>
  );
}
