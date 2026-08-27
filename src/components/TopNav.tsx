"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

interface TopNavProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function TopNav({ onToggleSidebar, isSidebarOpen }: TopNavProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="navbar" style={{ flexShrink: 0, position: "relative" }}>
      <div className="nav-brand">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar} 
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", marginRight: "1rem", fontSize: "1.2rem" }}
            title="Manage"
          >
            ☰
          </button>
        )}
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          MAT3001 - Calculus of Variations
        </Link>
      </div>
      <div className="nav-controls">
        {session ? (
          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="btn btn-secondary" 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", width: "auto" }}
            >
              <span>{session.user?.name || session.user?.email}</span>
              <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "12px", background: "rgba(0,0,0,0.1)", textTransform: "uppercase", fontWeight: "bold" }}>
                {session.user?.role}
              </span>
              <span>▼</span>
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.5rem",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                minWidth: "150px",
                zIndex: 1000,
                overflow: "hidden"
              }}>
                <Link 
                  href="/" 
                  style={{ display: "block", padding: "0.75rem 1rem", textDecoration: "none", color: pathname === "/" ? "#2563eb" : "#334155", backgroundColor: pathname === "/" ? "#f1f5f9" : "transparent" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  Slides
                </Link>
                <Link 
                  href="/writing" 
                  style={{ display: "block", padding: "0.75rem 1rem", textDecoration: "none", color: pathname?.startsWith("/writing") ? "#2563eb" : "#334155", backgroundColor: pathname?.startsWith("/writing") ? "#f1f5f9" : "transparent" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  Writing
                </Link>
                <Link 
                  href="/assignments" 
                  style={{ display: "block", padding: "0.75rem 1rem", textDecoration: "none", color: pathname?.startsWith("/assignments") ? "#2563eb" : "#334155", backgroundColor: pathname?.startsWith("/assignments") ? "#f1f5f9" : "transparent" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  Assignments
                </Link>
                {(session as any)?.user?.role === "admin" && (
                  <Link 
                    href="/admin" 
                    style={{ display: "block", padding: "0.75rem 1rem", textDecoration: "none", color: pathname?.startsWith("/admin") ? "#2563eb" : "#334155", backgroundColor: pathname?.startsWith("/admin") ? "#f1f5f9" : "transparent" }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button 
                  onClick={() => signOut()} 
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "0.75rem 1rem", background: "transparent", border: "none", borderTop: "1px solid #e2e8f0", color: "#ef4444", cursor: "pointer", fontSize: "1rem" }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn" style={{ padding: "0.5rem 1rem", width: "auto" }}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}
