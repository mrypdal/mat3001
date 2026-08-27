"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
};

export default function CommentSection({ slideId }: { slideId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [slideId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?slideId=${slideId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId, text: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    }
  };

  return (
    <aside className="comment-section">
      <h3>Discussion</h3>
      <div className="comment-list">
        {loading ? (
          <p>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No comments yet. Be the first to ask a question!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <span className="comment-author">{comment.user.name || comment.user.email}</span>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p>{comment.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="comment-form">
        {session ? (
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="Ask a question or leave a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <button type="submit" className="btn">Post Comment</button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem", backgroundColor: "var(--background)", borderRadius: "8px" }}>
            <p style={{ marginBottom: "1rem" }}>Please log in to participate in the discussion.</p>
            <Link href="/login" className="btn btn-secondary">Sign In</Link>
          </div>
        )}
      </div>
    </aside>
  );
}
