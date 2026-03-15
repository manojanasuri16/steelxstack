"use client";

import { useState, useRef } from "react";
import ImageEditorModal from "@/components/admin/ImageEditorModal";
import CameraCapture from "@/components/admin/CameraCapture";

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  max?: number;
}

async function optimizeImage(blob: Blob): Promise<Blob> {
  if (blob.type === "image/webp" && blob.size < 500_000) return blob;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > 1200) { h = Math.round(h * (1200 / w)); w = 1200; }
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

function isValidImage(url: string): boolean {
  return !!url && (url.startsWith("http") || url.startsWith("/uploads/") || url.startsWith("blob:"));
}

export default function MultiImageUpload({ images, onChange, label = "Images", max = 5 }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canAdd = images.length < max;

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
      onChange([...images, url]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) openEditor(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCameraCapture = (blob: Blob) => {
    setShowCamera(false);
    openEditor(blob);
  };

  const handleAddUrl = () => {
    if (urlValue.trim() && canAdd) {
      onChange([...images, urlValue.trim()]);
      setUrlValue("");
      setShowUrlInput(false);
    }
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    const arr = [...images];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange(arr);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-1.5">
        {label} ({images.length}/{max})
      </label>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {images.map((img, idx) => (
            <div key={`${img}-${idx}`} className="relative w-16 h-16 rounded-lg overflow-hidden bg-dark-700 group/thumb border border-glass-border">
              {isValidImage(img) ? (
                <img src={img} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
              )}
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx > 0 && (
                  <button onClick={() => moveImage(idx, -1)} className="text-white text-[10px] hover:text-neon p-0.5" title="Move left">&larr;</button>
                )}
                <button onClick={() => removeImage(idx)} className="text-red-400 hover:text-red-300 text-xs p-0.5" title="Remove">&times;</button>
                {idx < images.length - 1 && (
                  <button onClick={() => moveImage(idx, 1)} className="text-white text-[10px] hover:text-neon p-0.5" title="Move right">&rarr;</button>
                )}
              </div>
              {idx === 0 && (
                <div className="absolute top-0 left-0 bg-neon text-dark-900 text-[8px] font-bold px-1 rounded-br">Main</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      {canAdd && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors disabled:opacity-40">
              {uploading ? "Processing..." : "+ Upload"}
            </button>
            <button type="button" onClick={() => setShowCamera(true)} disabled={uploading}
              className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors disabled:opacity-40">
              Capture
            </button>
            <button type="button" onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-3 py-1.5 text-xs font-medium bg-dark-700 border border-glass-border text-gray-300 rounded-lg hover:text-white hover:border-neon/30 transition-colors">
              Paste URL
            </button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <input type="text" value={urlValue} onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                placeholder="https://..."
                className="flex-1 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />
              <button onClick={handleAddUrl} className="px-3 py-2 text-xs font-medium bg-neon text-dark-900 rounded-lg hover:brightness-110">Add</button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <p className="text-[10px] text-gray-600">First image is the main image. Drag to rearrange or hover to remove.</p>
        </div>
      )}

      {editorSrc && (
        <ImageEditorModal imageSrc={editorSrc} open={true} onClose={handleEditorClose} onApply={handleEditorApply} shape="rect" />
      )}
      <CameraCapture open={showCamera} onClose={() => setShowCamera(false)} onCapture={handleCameraCapture} />
    </div>
  );
}
