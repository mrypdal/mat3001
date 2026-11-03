"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./sprint.module.css";

export default function SprintNav({
  subtitle,
  back,
  userLabel,
}: {
  subtitle?: string;
  back?: { href: string; label: string };
  userLabel?: string | null;
}) {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <Link href="/sprint" style={{ color: "inherit", textDecoration: "none" }}>Sprintmodellen</Link>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <div className={styles.navRight}>
        {back && (
          <Link href={back.href} className={styles.ghostBtn} style={{ textDecoration: "none" }}>
            {back.label}
          </Link>
        )}
        <span>{userLabel}</span>
        <button className={styles.ghostBtn} onClick={() => signOut({ callbackUrl: "/sprint/login" })}>
          Logg ut
        </button>
      </div>
    </nav>
  );
}
