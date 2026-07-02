"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { replyKonsultasi, getThreadMessagesAction } from "../../actions";

export default function ThreadClient({ parentMessage, thread, user }: { parentMessage: any, thread: any[], user: any }) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [messages, setMessages] = useState<any[]>(thread);
  const prevCountRef = useRef(0);

  const fetchMessages = async () => {
    try {
      const res = await getThreadMessagesAction(parentMessage.id);
      if (res.success && res.messages) {
        if (res.messages.length !== messages.length || JSON.stringify(res.messages) !== JSON.stringify(messages)) {
          setMessages(res.messages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch new messages:", err);
    }
  };

  useEffect(() => {
    // Poll every 3 seconds for new messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [messages, parentMessage.id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const shouldScroll = prevCountRef.current === 0 || messages.length > prevCountRef.current;
      if (shouldScroll) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo]);

  const handleReply = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await replyKonsultasi(formData);
    if (res.success) {
      e.target.reset();
      // Immediately fetch messages to show the new message instantly
      await fetchMessages();
    } else {
      setAlertInfo({ type: 'danger', message: "Gagal membalas: " + res.message });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="content-header mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <Link href="/dashboard/konsultasi" className="text-decoration-none text-muted">
              <i className="bi bi-arrow-left"></i> Kembali ke Daftar Konsultasi
            </Link>
            <h4 className="mb-1 mt-2">
              <i className="bi bi-chat-dots-fill text-primary me-2"></i> {parentMessage.subjek}
            </h4>
            <p className="text-muted mb-0">
              UMKM: <strong>{parentMessage.nama_umkm || "Unknown"}</strong>
            </p>
          </div>
        </div>
      </div>

      {alertInfo && (
        <div className={`alert alert-${alertInfo.type} alert-dismissible fade show rounded-4 mb-4`} role="alert">
          <i className={`bi ${alertInfo.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {alertInfo.message}
          <button type="button" className="btn-close" onClick={() => setAlertInfo(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Chat Thread */}
      <div className="panel">
        <div
          className="panel-body"
          style={{ maxHeight: "500px", overflowY: "auto" }}
          id="chatContainer"
          ref={chatContainerRef}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`d-flex mb-3 ${msg.pengirim_role === user.role ? "justify-content-end" : "justify-content-start"}`}
            >
              <div
                className={`card border-0 shadow-sm ${
                  msg.pengirim_role === user.role ? "bg-primary text-white" : "bg-light"
                }`}
                style={{ maxWidth: "75%", borderRadius: "16px" }}
              >
                <div className="card-body py-2 px-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="fw-bold me-2">
                      {msg.pengirim_role === "Mitra" && (
                        <>
                          <i className="bi bi-shop"></i> {msg.nama_umkm || "Mitra"}
                        </>
                      )}
                      {msg.pengirim_role === "Staff" && (
                        <>
                          <i className="bi bi-person-badge"></i> Staff
                        </>
                      )}
                      {msg.pengirim_role === "Admin" && (
                        <>
                          <i className="bi bi-shield-check"></i> Admin
                        </>
                      )}
                    </small>
                    <small
                      className={msg.pengirim_role === user.role ? "text-white-50" : "text-muted"}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {formatDate(msg.created_at)}
                    </small>
                  </div>
                  <p className="mb-0" style={{ whiteSpace: "pre-line" }}>{msg.pesan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Balas */}
      <div className="panel mt-3">
        <div className="panel-body">
          <form onSubmit={handleReply}>
            <input type="hidden" name="parent_id" value={parentMessage.id} />
            <div className="d-flex gap-2">
              <textarea
                name="pesan"
                className="form-control"
                rows={2}
                required
                placeholder="Tulis balasan..."
              ></textarea>
              <button type="submit" className="btn btn-primary align-self-end rounded-pill px-4">
                <i className="bi bi-send-fill"></i> Kirim
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
