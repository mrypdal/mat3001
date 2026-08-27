"use client";

import React, { useState, useEffect } from "react";
import TopNav from "@/components/TopNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && (session as any)?.user?.role !== "admin")) {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && (session as any)?.user?.role === "admin") {
      fetchUsers();
    }
  }, [status, session]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });
      if (res.ok) {
        setName("");
        setEmail("");
        setPassword("");
        setRole("student");
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating user");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? All their documents will be permanently deleted.")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting user");
    }
  };

  if (status === "loading" || loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Admin Dashboard...</div>;
  if (status === "unauthenticated" || (session as any)?.user?.role !== "admin") return null;

  return (
    <div className="app-layout" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopNav />
      
      <main className="main-content" style={{ flexGrow: 1, overflowY: "auto", padding: "3rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>
          
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "3rem", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginTop: 0 }}>Create New User</h2>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="submit" className="btn" disabled={creating} style={{ width: "auto", padding: "0.75rem 2rem" }}>
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>

          <h2 style={{ marginTop: 0 }}>Manage Users</h2>
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Role</th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Joined</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "1rem" }}>{user.name || "-"}</td>
                    <td style={{ padding: "1rem" }}>{user.email}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "9999px", 
                        fontSize: "0.75rem", 
                        fontWeight: "bold",
                        backgroundColor: user.role === "admin" ? "#fef2f2" : user.role === "teacher" ? "#eff6ff" : "#f1f5f9",
                        color: user.role === "admin" ? "#ef4444" : user.role === "teacher" ? "#3b82f6" : "#64748b"
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.9rem" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {(session as any)?.user?.email !== user.email && (
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "bold" }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
