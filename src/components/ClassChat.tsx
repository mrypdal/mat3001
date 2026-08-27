"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useSession } from "next-auth/react";

interface ClassMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    role: string;
  };
}

export default function ClassChat() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/class-chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to fetch class chat messages", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || !session) return;

    setLoading(true);

    try {
      const res = await fetch("/api/class-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setInput("");
      } else {
        console.error("Failed to post message");
      }
    } catch (err) {
      console.error("Error connecting to server", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "7.5rem", zIndex: 9998 }}>
      {isOpen && (
        <div style={{
          width: "50vw",
          minWidth: "400px",
          maxWidth: "800px",
          height: "75vh",
          minHeight: "500px",
          maxHeight: "800px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          marginBottom: "1rem",
          border: "1px solid #e2e8f0",
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem",
            backgroundColor: "#10b981", // Emerald Green
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0
          }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Class Forum</h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem", padding: "0 0.5rem" }}
            >
              ×
            </button>
          </div>

          {/* Chat Window */}
          <div style={{
            flexGrow: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            backgroundColor: "#f8fafc"
          }}>
            {/* Welcome message */}
            <div style={{
              alignSelf: "flex-start",
              backgroundColor: "white",
              color: "#1e293b",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              maxWidth: "95%",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              border: "1px solid #10b981",
              overflowX: "auto",
              flexShrink: 0
            }}>
              <p style={{ margin: 0 }}><strong>Welcome to the Class Forum!</strong><br />This is a shared space to discuss the curriculum with your teachers and fellow students. Everyone can see these messages.</p>
            </div>

            {messages.map((msg) => {
              const isMine = session?.user?.email === msg.user.email;
              return (
                <div key={msg.id} style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  backgroundColor: isMine ? "#10b981" : "white",
                  color: isMine ? "white" : "#1e293b",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  maxWidth: "95%",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  border: isMine ? "none" : "1px solid #e2e8f0",
                  overflowX: "auto",
                  flexShrink: 0
                }}>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    marginBottom: "0.25rem", 
                    opacity: 0.8,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem"
                  }}>
                    <span>{msg.user.name || msg.user.email}</span>
                    <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>{msg.user.role}</span>
                  </div>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({node, ...props}) => <p style={{ margin: 0 }} {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} style={{
            padding: "1rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: "0.5rem",
            backgroundColor: "white",
            flexShrink: 0
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={session ? "Discuss with the class..." : "Sign in to post..."}
              disabled={!session}
              style={{
                flexGrow: 1,
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "1rem"
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim() || !session}
              style={{
                padding: "0 1rem",
                backgroundColor: loading || !input.trim() || !session ? "#94a3b8" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !input.trim() || !session ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "1.5rem"
          }}
        >
          💬
        </button>
      )}
    </div>
  );
}
