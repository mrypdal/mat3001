"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import TopNav from "./TopNav";

interface SlideData {
  id: string; // from db this is actually originalId we will map it
  originalId: string;
  title: string;
  content: string;
  order: number;
}

export default function SlideViewer() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [originalSlides, setOriginalSlides] = useState<SlideData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchSlides = async () => {
    try {
      const res = await fetch('/api/slides');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOriginalSlides(data);
      } else {
        console.error("API returned non-array:", data);
        setOriginalSlides([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const slides = React.useMemo(() => {
    const newSlides = [];
    for (const slide of originalSlides) {
      const content = slide.content.trim();
      const blocks = content.split(/\n\s*\n/);
      
      let currentChunk: string[] = [];
      let linesInChunk = 0;
      let slideIndex = 1;

      for (const block of blocks) {
        let blockCost = block.split('\n').length;
        if (block.includes('$$')) blockCost += 4;
        if (block.includes('![')) blockCost += 10;
        
        if (linesInChunk + blockCost > 18 && currentChunk.length > 0) {
          const titleSuffix = slideIndex > 1 ? ` (cont.)` : '';
          newSlides.push({
            id: slide.originalId + (slideIndex > 1 ? `-part-${slideIndex}` : ''),
            title: slide.title + titleSuffix,
            content: currentChunk.join('\n\n'),
            originalId: slide.originalId
          });
          
          currentChunk = [];
          linesInChunk = 0;
          slideIndex++;
        }
        
        currentChunk.push(block);
        linesInChunk += blockCost;
      }
      
      if (currentChunk.length > 0) {
        const titleSuffix = slideIndex > 1 ? ` (cont.)` : '';
        newSlides.push({
          id: slide.originalId + (slideIndex > 1 ? `-part-${slideIndex}` : ''),
          title: slide.title + titleSuffix,
          content: currentChunk.join('\n\n'),
          originalId: slide.originalId
        });
      }
    }
    return newSlides;
  }, [originalSlides]);

  const currentSlide = slides[currentSlideIndex];
  
  const handleEditClick = () => {
    const original = originalSlides.find(s => s.originalId === currentSlide.originalId);
    if (original) {
      setEditTitle(original.title);
      setEditContent(original.content);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!currentSlide) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/slides/${currentSlide.originalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent
        })
      });
      if (res.ok) {
        setIsEditing(false);
        await fetchSlides();
      } else {
        alert("Failed to save slide.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving slide.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlide = async () => {
    if (!currentSlide) return;
    
    // Find the original slide we are currently on to know where to insert
    const original = originalSlides.find(s => s.originalId === currentSlide.originalId);
    const newOrder = original ? original.order + 1 : 0;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: newOrder,
          title: "New Slide",
          content: "Edit me..."
        })
      });
      
      if (res.ok) {
        await fetchSlides();
        setIsSidebarOpen(true);
      }
    } catch (e) {
      console.error(e);
      alert("Error adding slide.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (originalId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    try {
      const res = await fetch(`/api/slides/${originalId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // If we deleted the current slide, we should maybe go to previous, but just fetching is fine
        // since we might be on a different chunk of it or it disappears and index handles it.
        // Actually, if we delete the last slide and we are on it, currentSlideIndex will be out of bounds.
        // Let's go to index 0 safely
        setCurrentSlideIndex(0);
        await fetchSlides();
      } else {
        alert("Failed to delete slide.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting slide.");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(originalSlides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setOriginalSlides(updatedItems);
    
    try {
      await fetch('/api/slides/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: updatedItems.map(item => ({ id: item.id, order: item.order }))
        })
      });
    } catch (e) {
      console.error("Failed to reorder", e);
      fetchSlides();
    }
  };

  const goNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setIsEditing(false);
    }
  };

  const goPrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setIsEditing(false);
    }
  };

  const canEdit = session?.user?.role === 'admin' || session?.user?.role === 'teacher';

  if (status === "loading" || status === "unauthenticated" || loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading slides...</div>;
  if (slides.length === 0) {
    return (
      <div className="app-layout" style={{ display: "flex", flexDirection: "row", height: "100vh", overflow: "hidden" }}>
        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
          <TopNav onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
          
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#666" }}>
            <h2>No slides found.</h2>
            <p style={{ marginBottom: "2rem" }}>Use the menu to navigate to Writing or Admin, or create a slide below.</p>
            {canEdit && (
              <button 
                onClick={handleAddSlide} 
                className="btn" 
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span className="material-icons">add</span> Create First Slide
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout" style={{ display: "flex", flexDirection: "row", height: "100vh", overflow: "hidden" }}>
      
      {/* Sidebar for rearranging slides */}
      {canEdit && isSidebarOpen && (
        <div style={{ width: "300px", borderRight: "1px solid #e2e8f0", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white" }}>
            <h3 style={{ margin: 0 }}>Slide Order</h3>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
          </div>
          <div style={{ flexGrow: 1, overflowY: "auto", padding: "1rem" }}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="slides">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {originalSlides.map((slide, index) => (
                      <Draggable key={slide.id} draggableId={slide.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              userSelect: "none",
                              padding: "0.75rem",
                              margin: "0 0 0.5rem 0",
                              backgroundColor: snapshot.isDragging ? "#e2e8f0" : "white",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              boxShadow: snapshot.isDragging ? "0 4px 12px rgba(0,0,0,0.1)" : "0 1px 2px rgba(0,0,0,0.05)",
                              ...provided.draggableProps.style
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {index + 1}. {slide.title}
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteSlide(slide.originalId); }} 
                                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
                                title="Delete slide"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      )}

      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopNav 
          onToggleSidebar={canEdit ? () => setIsSidebarOpen(!isSidebarOpen) : undefined}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="main-content" style={{ flexGrow: 1, overflowY: "auto" }}>
          <div className="slide-viewer" style={{ maxWidth: "100%", margin: "0 auto" }}>
            <div className="slide" style={{ position: "relative", minHeight: "60vh", flexShrink: 0 }}>
              
              {canEdit && !isEditing && (
                <div style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={handleAddSlide}
                    className="btn btn-secondary" 
                    style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                    disabled={saving}
                  >
                    Add Slide
                  </button>
                  <button 
                    onClick={handleEditClick}
                    className="btn btn-secondary" 
                    style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                  >
                    Edit Slide
                  </button>
                </div>
              )}

              <div className="slide-content">
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", height: "100%" }}>
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      style={{ fontSize: "2rem", padding: "0.5rem", fontWeight: "bold", width: "100%", border: "1px solid #ccc", borderRadius: "8px" }}
                    />
                    <textarea 
                      value={editContent} 
                      onChange={e => setEditContent(e.target.value)}
                      style={{ flexGrow: 1, minHeight: "400px", padding: "1rem", fontSize: "1.1rem", fontFamily: "monospace", border: "1px solid #ccc", borderRadius: "8px", resize: "vertical" }}
                    />
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                      <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                      <button onClick={handleSave} className="btn" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1>{currentSlide.title}</h1>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {currentSlide.content}
                    </ReactMarkdown>
                  </>
                )}
              </div>
              
              {!isEditing && (
                <div className="slide-controls">
                  <button
                    className="btn btn-secondary"
                    onClick={goPrev}
                    disabled={currentSlideIndex === 0}
                  >
                    Previous
                  </button>
                  <span>{currentSlideIndex + 1} / {slides.length}</span>
                  <button
                    className="btn"
                    style={{ width: "auto" }}
                    onClick={goNext}
                    disabled={currentSlideIndex === slides.length - 1}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
