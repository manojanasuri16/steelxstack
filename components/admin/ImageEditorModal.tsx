"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";

interface ImageEditorModalProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onApply: (blob: Blob) => void;
  shape?: "rect" | "round";
}

const ASPECT_PRESETS = [
  { label: "Free", value: 0 },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "16:9", value: 16 / 9 },
];

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  crop: Area,
  rotation: number
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box of the rotated image
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extract cropped area
  const data = ctx.getImageData(crop.x, crop.y, crop.width, crop.height);

  // Resize to max 1200px wide, maintain aspect
  let outW = crop.width;
  let outH = crop.height;
  if (outW > 1200) {
    outH = Math.round(outH * (1200 / outW));
    outW = 1200;
  }

  canvas.width = outW;
  canvas.height = outH;

  // Use offscreen canvas for resize
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = crop.width;
  tmpCanvas.height = crop.height;
  tmpCanvas.getContext("2d")!.putImageData(data, 0, 0);

  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(tmpCanvas, 0, 0, crop.width, crop.height, 0, 0, outW, outH);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      "image/webp",
      0.8
    );
  });
}

export default function ImageEditorModal({
  imageSrc,
  open,
  onClose,
  onApply,
  shape = "rect",
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [aspectIdx, setAspectIdx] = useState(0);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea, rotation);
      onApply(blob);
    } finally {
      setProcessing(false);
    }
  };

  const currentAspect = ASPECT_PRESETS[aspectIdx].value || undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Crop area */}
            <div className="relative w-full" style={{ height: "min(60vh, 400px)" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={currentAspect}
                cropShape={shape === "round" ? "round" : "rect"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3">
              {/* Aspect presets */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 shrink-0">Aspect:</span>
                <div className="flex gap-1.5">
                  {ASPECT_PRESETS.map((p, i) => (
                    <button
                      key={p.label}
                      onClick={() => setAspectIdx(i)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        aspectIdx === i
                          ? "bg-neon text-dark-900"
                          : "bg-dark-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[#a3e635]"
                />
              </div>

              {/* Rotation */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 shrink-0">Rotate</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-[#a3e635]"
                />
                <span className="text-xs text-gray-500 w-8 text-right">{rotation}°</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-dark-700 text-gray-300 hover:text-white border border-glass-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-neon text-dark-900 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Apply"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
