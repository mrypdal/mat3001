"use client";

import React, { useState, useEffect, useRef } from "react";
import TopNav from "@/components/TopNav";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import ShareModal from "@/components/ShareModal";
import { useSession } from "next-auth/react";

interface Doc {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  docType?: string;
  owner?: { name: string; email: string };
  permission?: string;
}

interface DocumentDashboardProps {
  docType: "WRITING" | "ASSIGNMENT";
}

export default function DocumentDashboard({ docType }: DocumentDashboardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [ownedDocs, setOwnedDocs] = useState<Doc[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [shareModalDoc, setShareModalDoc] = useState<Doc | null>(null);

  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewContent, setReviewContent] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSource = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const imageMarkdown = `\n![Image](${data.url})\n`;
        setEditContent(prev => prev + imageMarkdown);
      } else {
        alert("Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    }
  };

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/api/documents?type=${docType}`);
      if (res.ok) {
        const data = await res.json();
        setOwnedDocs(data.owned || []);
        setSharedDocs(data.shared || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [docType]);

  const handleCreateNew = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: "", type: docType })
      });
      if (res.ok) {
        const newDoc = await res.json();
        setOwnedDocs([newDoc, ...ownedDocs]);
        openDoc(newDoc);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openDoc = (doc: Doc) => {
    setActiveDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setIsEditing(false);
  };

  const closeDoc = () => {
    setActiveDoc(null);
    setIsEditing(false);
  };

  const canEditActive = activeDoc && (
    activeDoc.ownerId === (session as any)?.user?.id || // Wait, session.user might not have id, checking email below
    !activeDoc.permission || 
    activeDoc.permission === 'EDIT' || 
    activeDoc.permission === 'MANAGE'
  );

  const canManageActive = activeDoc && (
    !activeDoc.permission || 
    activeDoc.permission === 'MANAGE'
  );

  const handleSave = async () => {
    if (!activeDoc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${activeDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveDoc(updated);
        setIsEditing(false);
        fetchDocs();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeDoc) return;
    if (!confirm("Delete this document?")) return;
    
    try {
      const res = await fetch(`/api/documents/${activeDoc.id}`, { method: "DELETE" });
      if (res.ok) {
        setActiveDoc(null);
        fetchDocs();
      } else {
        alert("Failed to delete");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReview = async () => {
    if (!activeDoc) return;
    setShowReviewModal(true);
    setReviewLoading(true);
    setReviewContent(null);
    try {
      const res = await fetch('/api/review', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: activeDoc.title, content: activeDoc.content })
      });
      if (res.ok) {
        const data = await res.json();
        setReviewContent(data.review);
      } else {
        setReviewContent("Failed to generate review. Please try again later.");
      }
    } catch (e) {
      console.error(e);
      setReviewContent("An error occurred during the review process.");
    } finally {
      setReviewLoading(false);
    }
  };

  const canCreate = !(docType === "ASSIGNMENT" && (session as any)?.user?.role === "student");

  if (status === "loading" || status === "unauthenticated" || loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading documents...</div>;

  return (
    <div className="app-layout" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopNav />
      
      <main className="main-content" style={{ flexGrow: 1, overflowY: "auto", display: "flex" }}>
        {!activeDoc ? (
          // DASHBOARD VIEW
          <div style={{ padding: "3rem", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h1 style={{ margin: 0, whiteSpace: "nowrap" }}>{docType === "ASSIGNMENT" ? "Assignments" : "My Documents"}</h1>
              {canCreate && (
                <button onClick={handleCreateNew} className="btn" style={{ width: "auto", padding: "0.5rem 1.5rem" }}>+ Create New</button>
              )}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {ownedDocs.map(doc => (
                <div key={doc.id} onClick={() => openDoc(doc)} style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>{doc.title}</h3>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Owner: You</div>
                  <div style={{ marginTop: "1rem" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShareModalDoc(doc); }}
                      className="btn btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem", width: "auto" }}
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ marginTop: "3rem", marginBottom: "1.5rem" }}>Shared with me</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {sharedDocs.length === 0 && <p style={{ color: "#64748b" }}>No documents shared with you.</p>}
              {sharedDocs.map(doc => (
                <div key={doc.id} onClick={() => openDoc(doc)} style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>{doc.title}</h3>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Owner: {doc.owner?.name || doc.owner?.email}</div>
                  <div style={{ marginTop: "1rem", fontSize: "0.85rem", fontWeight: "bold", color: "#3b82f6" }}>
                    Permission: {doc.permission}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // EDITOR VIEW
          <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={closeDoc} className="btn btn-secondary" style={{ width: "auto", padding: "0.5rem 1rem" }}>← Back</button>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {!isEditing && (
                  <>
                    <button onClick={handleDownloadSource} className="btn btn-secondary" style={{ width: "auto", padding: "0.5rem 1rem" }}>Download Source</button>
                    <button onClick={handleExportPDF} className="btn btn-secondary" style={{ width: "auto", padding: "0.5rem 1rem" }}>Export PDF</button>
                    <button onClick={handleReview} className="btn btn-secondary" style={{ width: "auto", padding: "0.5rem 1rem", borderColor: "#8b5cf6", color: "#8b5cf6" }}>
                      ✨ AI Review
                    </button>
                  </>
                )}
                {canManageActive && (
                  <button onClick={handleDelete} className="btn btn-secondary" style={{ color: "#ef4444", borderColor: "#ef4444", width: "auto", padding: "0.5rem 1rem" }}>Delete</button>
                )}
                {canEditActive && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className="btn" style={{ width: "auto", padding: "0.5rem 1rem" }}>Edit</button>
                )}
              </div>
            </div>

            <div className="slide-viewer" style={{ flexGrow: 1, padding: "2rem", overflowY: "auto", border: "none" }}>
              <div className="slide" style={{ minHeight: "auto", padding: "3rem", flexShrink: 0 }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      disabled={!canManageActive}
                      style={{ fontSize: "2rem", padding: "0.5rem", fontWeight: "bold", width: "100%", border: "1px solid #ccc", borderRadius: "8px", opacity: canManageActive ? 1 : 0.7 }}
                    />
                    {!canManageActive && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>You do not have permission to change the title.</div>}
                    
                    <textarea 
                      value={editContent} 
                      onChange={e => setEditContent(e.target.value)}
                      style={{ flexGrow: 1, minHeight: "400px", padding: "1rem", fontSize: "1.1rem", fontFamily: "monospace", border: "1px solid #ccc", borderRadius: "8px", resize: "vertical" }}
                    />
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
                      <div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                        <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ width: "auto" }}>+ Insert Image</button>
                      </div>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={() => { setIsEditing(false); setEditTitle(activeDoc.title); setEditContent(activeDoc.content); }} className="btn btn-secondary" style={{ width: "auto" }}>Cancel</button>
                        <button onClick={handleSave} className="btn" disabled={saving} style={{ width: "auto" }}>{saving ? "Saving..." : "Save"}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="slide-content">
                    <h1>{activeDoc.title}</h1>
                    <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "-1.5rem", marginBottom: "2rem" }}>
                      {activeDoc.owner ? `Owner: ${activeDoc.owner.name || activeDoc.owner.email}` : "Owner: You"}
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {activeDoc.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {shareModalDoc && (
        <ShareModal 
          documentId={shareModalDoc.id} 
          docType={docType}
          onClose={() => setShareModalDoc(null)} 
        />
      )}

      {showReviewModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "700px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>✨</span> AI Review
            </h2>
            
            <div style={{ flexGrow: 1, overflowY: "auto", padding: "1rem 0", fontSize: "1rem", lineHeight: 1.6 }}>
              {reviewLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                  <div style={{ fontSize: "2rem", animation: "spin 2s linear infinite", marginBottom: "1rem" }}>⏳</div>
                  The AI is reading your document...
                </div>
              ) : (
                <div className="slide-content" style={{ marginTop: 0 }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {reviewContent || ""}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
              <button onClick={() => setShowReviewModal(false)} className="btn" style={{ width: "auto" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
