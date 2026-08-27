"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { useChatContext } from "./ChatContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I am your MAT3001 AI assistant. I have studied all the course slides and the syllabus textbook. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { pageContext } = useChatContext();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, pageContext }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: `**Error:** ${data.error}` }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "**Error:** Could not connect to the server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "3rem", zIndex: 9999 }}>
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
            backgroundColor: "#2563eb",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0
          }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>AI Assistant</h3>
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
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: msg.role === "user" ? "#2563eb" : "white",
                color: msg.role === "user" ? "white" : "#1e293b",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                maxWidth: "95%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
                overflowX: "auto",
                flexShrink: 0
              }}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({node, ...props}) => <p style={{ margin: 0 }} {...props} />
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", backgroundColor: "white", padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid #e2e8f0", color: "#64748b" }}>
                Thinking...
              </div>
            )}
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
              placeholder="Ask a question..."
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
              disabled={loading || !input.trim()}
              style={{
                padding: "0 1rem",
                backgroundColor: loading || !input.trim() ? "#94a3b8" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
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
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
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
