"use client";

import React, { useState, useEffect } from "react";

interface ShareModalProps {
  documentId: string;
  docType?: string;
  onClose: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Share {
  userId: string;
  name: string;
  email: string;
  permission: string;
}

export default function ShareModal({ documentId, docType, onClose }: ShareModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, sharesRes] = await Promise.all([
          fetch("/api/users"),
          fetch(`/api/documents/${documentId}/share`)
        ]);
        
        if (usersRes.ok && sharesRes.ok) {
          setUsers(await usersRes.json());
          setShares(await sharesRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [documentId]);

  const handlePermissionChange = (userId: string, permission: string) => {
    if (permission === "NONE") {
      setShares(shares.filter(s => s.userId !== userId));
    } else {
      const existing = shares.find(s => s.userId === userId);
      if (existing) {
        setShares(shares.map(s => s.userId === userId ? { ...s, permission } : s));
      } else {
        const user = users.find(u => u.id === userId);
        if (user) {
          setShares([...shares, { userId, name: user.name || "", email: user.email, permission }]);
        }
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shares: shares.map(s => ({ userId: s.userId, permission: s.permission })) })
      });
      if (res.ok) {
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save shares");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving shares");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "500px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <h2 style={{ marginTop: 0 }}>Share Document</h2>
        
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div style={{ flexGrow: 1, overflowY: "auto", margin: "1rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {users.map(user => {
              const currentShare = shares.find(s => s.userId === user.id);
              const currentPermission = currentShare ? currentShare.permission : "NONE";
              
              return (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{user.name || user.email}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{user.role}</div>
                  </div>
                  <select 
                    value={currentPermission} 
                    onChange={e => handlePermissionChange(user.id, e.target.value)}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="NONE">Not Shared</option>
                    <option value="READ">Read Only</option>
                    {!(docType === "ASSIGNMENT" && user.role === "student") && (
                      <>
                        <option value="EDIT">Read & Edit</option>
                        <option value="MANAGE">Manage</option>
                      </>
                    )}
                  </select>
                </div>
              );
            })}
          </div>
        )}
        
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ width: "auto" }}>Cancel</button>
          <button onClick={handleSave} className="btn" disabled={saving || loading} style={{ width: "auto" }}>
            {saving ? "Saving..." : "Save Shares"}
          </button>
        </div>
      </div>
    </div>
  );
}
