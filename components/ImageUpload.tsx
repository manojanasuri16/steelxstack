"use client";

import { useState, useRef } from "react";
import ImageEditorModal from "@/components/admin/ImageEditorModal";
import CameraCapture from "@/components/admin/CameraCapture";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  shape?: "square" | "circle";
  accept?: "image" | "video" | "file";
}

function getFileType(url: string): "image" | "video" | "pdf" | "text" | "unknown" {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|$)/.test(lower)) return "image";
  if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/.test(lower)) return "video";
  if (/\.(pdf)(\?|$)/.test(lower)) return "pdf";
  if (/\.(txt|md|markdown|text)(\?|$)/.test(lower)) return "text";
  // YouTube URLs
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "video";
  return "unknown";
}

async function optimizeImage(blob: Blob): Promise<Blob> {
  if (blob.type === "image/webp" && blob.size < 500_000) return blob;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > 1200) {
        h = Math.round(h * (1200 / w));
        w = 1200;
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((out) => resolve(out || blob), "image/webp", 0.8);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

async function uploadFile(file: Blob, name: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, name);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (res.ok) {
    const { url } = await res.json();
    return url;
  }
  const err = await res.json().catch(() => ({ error: "Upload failed" }));
  throw new Error(err.error || "Upload failed");
}

const ACCEPT_MAP = {
  image: "image/*",
  video: "image/*,video/*",
  file: "image/*,video/*,.pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown",
};

const HELP_MAP = {
  image: "JPEG, PNG, WebP, SVG, GIF. Max 5MB.",
  video: "Images or videos (MP4, WebM, MOV). Max 50MB. YouTube URLs also work.",
  file: "Images, videos, PDF, text, markdown. Max 50MB.",
};

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  shape = "square",
  accept = "image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openEditor = (source: File | Blob) => {
    const url = URL.createObjectURL(source);
    setEditorSrc(url);
  };

  const uploadDirectly = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, file.name);
      onChange(url);
    } catch {
      // silent fail
    } finally {
      setUploading(false);
    }
  };

  const handleEditorApply = async (blob: Blob) => {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
    setUploading(true);
    try {
      const optimized = await optimizeImage(blob);
      const url = await uploadFile(optimized, `image-${Date.now()}.webp`);
      onChange(url);
    } catch {
      // silent fail
    } finally {
      setUploading(false);
    }
  };

  const handleEditorClose = () => {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
  };

  const handleCameraCapture = (blob: Blob) => {
    setShowCamera(false);
    openEditor(blob);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      openEditor(file);
    } else {
      uploadDirectly(file);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      openEditor(file);
    } else {
      uploadDirectly(file);
    }
  };

  const isValidUrl =
    value &&
    (value.startsWith("http") ||
      value.startsWith("/uploads/") ||
      value.startsWith("blob:"));

  const fileType = value ? getFileType(value) : "unknown";
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  const renderPreview = () => {
    if (!isValidUrl) return null;
    if (fileType === "video") {
      return (
        <div className="w-full h-full bg-dark-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      );
    }
    if (fileType === "pdf") {
      return (
        <div className="w-full h-full bg-red-900/20 flex flex-col items-center justify-center gap-0.5">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <span className="text-red-400 text-[8px] font-bold">PDF</span>
        </div>
      );
    }
    if (fileType === "text") {
      return (
        <div className="w-full h-full bg-blue-900/20 flex flex-col items-center justify-center gap-0.5">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span className="text-blue-400 text-[8px] font-bold">TXT</span>
        </div>
      );
    }
    // Default: image
    return <img src={value} alt="Preview" className="w-full h-full object-cover" />;
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-1.5">
        {label}
      </label>

      <div className="flex gap-3 items-start">
        {/* Preview / Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative w-20 h-20 shrink-0 ${shapeClass} overflow-hidden cursor-pointer border-2 border-dashed transition-colors ${
            dragOver
              ? "border-neon bg-neon/10"
              : "border-glass-border hover:border-neon/50"
          } bg-dark-700 flex items-center justify-center group/img`}
        >
          {uploading ? (
            <div className="text-neon text-xs animate-pulse">
              Processing...
            </div>
          ) : isValidUrl ? (
            <>
              {renderPreview()}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">Edit</span>
              </div>
            </>
          ) : (
            <div className="text-center px-1">
              <svg
                className="w-6 h-6 mx-auto text-gray-500 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 16v-8m-4 4l4-4 4 4m5 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2"
                />
              </svg>
              <span className="text-[9px] text-gray-500">
                Click or drop
              </span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_MAP[accept]}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors"
            >
              Upload
            </button>
            {accept === "image" && (
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors"
              >
                Capture
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors"
            >
              Paste URL
            </button>
            {value && (
              <>
                {fileType === "image" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isValidUrl) setEditorSrc(value);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors"
                  >
                    Replace
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>

          {showUrlInput && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://... or paste URL"
              className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50"
            />
          )}

          <p className="text-[10px] text-gray-600">
            {HELP_MAP[accept]}
          </p>
        </div>
      </div>

      {/* Image Editor Modal */}
      {editorSrc && (
        <ImageEditorModal
          imageSrc={editorSrc}
          open={true}
          onClose={handleEditorClose}
          onApply={handleEditorApply}
          shape={shape === "circle" ? "round" : "rect"}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
