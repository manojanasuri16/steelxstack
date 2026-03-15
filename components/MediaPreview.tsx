"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type MediaType = "image" | "video" | "youtube" | "pdf" | "text" | "unknown";

export function detectMediaType(url: string): MediaType {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  // YouTube
  if (lower.includes("youtube.com/watch") || lower.includes("youtu.be/") || lower.includes("youtube.com/embed") || lower.includes("youtube.com/shorts")) return "youtube";
  // Video files
  if (/\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/.test(lower)) return "video";
  // Images
  if (/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico)(\?|$)/.test(lower)) return "image";
  // PDF
  if (/\.(pdf)(\?|$)/.test(lower)) return "pdf";
  // Text/Markdown
  if (/\.(txt|md|markdown|text)(\?|$)/.test(lower)) return "text";
  // Uploaded files - check content type from URL patterns
  if (lower.includes("/uploads/") || lower.includes("blob.vercel-storage.com")) {
    // Default to image for uploads without clear extension
    return "image";
  }
  return "unknown";
}

export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0];
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
      return u.searchParams.get("v");
    }
  } catch { /* ignore */ }
  return null;
}

interface MediaPreviewProps {
  url: string;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export default function MediaPreview({ url, open, onClose, title }: MediaPreviewProps) {
  const type = detectMediaType(url);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  if (!open || !url) return null;

  const ytId = type === "youtube" ? getYouTubeId(url) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title */}
          {title && (
            <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
              {title}
            </div>
          )}

          {/* Content */}
          <div className="relative w-full max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {type === "image" && (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={url}
                alt={title || "Preview"}
                className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
                draggable={false}
              />
            )}

            {type === "video" && (
              <motion.video
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[85vh] rounded-lg"
              />
            )}

            {type === "youtube" && ytId && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full aspect-video max-h-[85vh]"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                />
              </motion.div>
            )}

            {type === "pdf" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-4xl"
              >
                {typeof window !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
                  <div className="glass rounded-2xl p-8 text-center">
                    <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    <p className="text-white mb-4">{title || "PDF Document"}</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg text-sm font-bold bg-neon text-dark-900 hover:brightness-110">
                      Open PDF
                    </a>
                  </div>
                ) : (
                  <div className="h-[85vh] bg-white rounded-lg overflow-hidden">
                    <iframe src={url} className="w-full h-full" title={title || "PDF Preview"} />
                  </div>
                )}
              </motion.div>
            )}

            {type === "text" && <TextPreview url={url} />}

            {type === "unknown" && (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-white mb-4">Cannot preview this file type inline.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg text-sm font-bold bg-neon text-dark-900 hover:brightness-110">
                  Open File
                </a>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TextPreview({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent("Failed to load file."))
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full max-h-[85vh] bg-dark-800 rounded-lg overflow-auto p-6"
    >
      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading...</p>
      ) : (
        <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">{content}</pre>
      )}
    </motion.div>
  );
}

// ─── Inline File Viewer (embeds directly in page, not overlay) ───
export function InlineFileViewer({ url, className = "" }: { url: string; className?: string }) {
  const type = detectMediaType(url);
  const ytId = type === "youtube" ? getYouTubeId(url) : null;

  if (type === "image") {
    return <img src={url} alt="Preview" className={`rounded-lg object-contain ${className}`} />;
  }
  if (type === "video") {
    return <video src={url} controls playsInline className={`rounded-lg ${className}`} />;
  }
  if (type === "youtube" && ytId) {
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />
      </div>
    );
  }
  if (type === "pdf") {
    const isMobile = typeof window !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      return (
        <div className={`bg-dark-700 rounded-lg p-6 text-center ${className}`}>
          <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <p className="text-gray-300 text-sm mb-3">PDF Preview</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block px-5 py-2 rounded-lg text-sm font-bold bg-neon text-dark-900 hover:brightness-110">
            Open PDF
          </a>
        </div>
      );
    }
    return (
      <div className={`bg-white rounded-lg overflow-hidden ${className}`} style={{ minHeight: 400 }}>
        <iframe src={url} className="w-full h-full" style={{ minHeight: 400 }} title="PDF Preview" />
      </div>
    );
  }
  if (type === "text") {
    return <InlineTextViewer url={url} className={className} />;
  }
  // Unknown - download link
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-neon text-xs hover:underline">
      Download File
    </a>
  );
}

function InlineTextViewer({ url, className }: { url: string; className?: string }) {
  const [content, setContent] = useState<string | null>(null);
  useEffect(() => {
    fetch(url).then((r) => r.text()).then(setContent).catch(() => setContent("Failed to load."));
  }, [url]);
  return (
    <div className={`bg-dark-800 rounded-lg p-4 overflow-auto ${className}`} style={{ maxHeight: 300 }}>
      <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">{content ?? "Loading..."}</pre>
    </div>
  );
}
