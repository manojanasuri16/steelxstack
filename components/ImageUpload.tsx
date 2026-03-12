"use client";

import { useState, useRef } from "react";
import ImageEditorModal from "@/components/admin/ImageEditorModal";
import CameraCapture from "@/components/admin/CameraCapture";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  shape?: "square" | "circle";
}

async function optimizeImage(blob: Blob): Promise<Blob> {
  // If already webp from editor/camera, just check size
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

async function uploadBlob(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, `image-${Date.now()}.webp`);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (res.ok) {
    const { url } = await res.json();
    return url;
  }
  throw new Error("Upload failed");
}

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  shape = "square",
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

  const handleEditorApply = async (blob: Blob) => {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
    setUploading(true);
    try {
      const optimized = await optimizeImage(blob);
      const url = await uploadBlob(optimized);
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
    if (file && file.type.startsWith("image/")) openEditor(file);
    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) openEditor(file);
  };

  const isValidImage =
    value &&
    (value.startsWith("http") ||
      value.startsWith("/uploads/") ||
      value.startsWith("blob:"));

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

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
          ) : isValidImage ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {/* Hover overlay */}
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
            accept="image/*"
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
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors"
            >
              📸 Capture
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors"
            >
              Paste URL
            </button>
            {value && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    // Re-edit current image
                    if (isValidImage) setEditorSrc(value);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors"
                >
                  Replace
                </button>
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
              placeholder="https://... or paste image URL"
              className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50"
            />
          )}

          <p className="text-[10px] text-gray-600">
            JPEG, PNG, WebP, SVG, GIF. Max 5MB. Auto-converts to WebP.
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
