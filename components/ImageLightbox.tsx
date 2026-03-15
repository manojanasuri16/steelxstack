"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageLightboxProps {
  images: string[];
  wornImages?: string[];
  initialIndex?: number;
  initialMode?: "product" | "onme";
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ images, wornImages = [], initialIndex = 0, initialMode = "product", alt = "Image", open, onClose }: ImageLightboxProps) {
  const [mode, setMode] = useState<"product" | "onme">(initialMode);
  const [current, setCurrent] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchMoved = useRef(false);

  const activeImages = mode === "onme" && wornImages.length > 0 ? wornImages : images;
  const hasWorn = wornImages.length > 0;
  const hasProduct = images.length > 0;
  const showTabs = hasProduct && hasWorn;

  useEffect(() => {
    if (open) {
      setCurrent(initialIndex);
      setMode(initialMode);
    }
  }, [open, initialIndex, initialMode]);

  // Reset to first image when switching modes
  const switchMode = (m: "product" | "onme") => {
    if (m === mode) return;
    setMode(m);
    setCurrent(0);
    setDirection(0);
  };

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const goPrev = useCallback(() => {
    if (current > 0) goTo(current - 1, -1);
  }, [current, goTo]);

  const goNext = useCallback(() => {
    if (current < activeImages.length - 1) goTo(current + 1, 1);
  }, [current, activeImages.length, goTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, goPrev, goNext]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchMoved.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 10) touchMoved.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
  };

  if (!open || activeImages.length === 0) return null;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !touchMoved.current) onClose();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
            {/* Left: counter */}
            <div className="text-white/70 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
              {activeImages.length > 1 ? `${current + 1} / ${activeImages.length}` : alt}
            </div>

            {/* Center: Product / On Me tabs */}
            {showTabs && (
              <div className="flex bg-white/10 backdrop-blur-sm rounded-full p-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); switchMode("product"); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    mode === "product" ? "bg-white text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  Product
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); switchMode("onme"); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    mode === "onme" ? "bg-white text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  On Me
                </button>
              </div>
            )}

            {/* Right: close */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Previous button */}
          {current > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full flex items-center justify-center px-12 sm:px-16 py-16"
            onClick={(e) => { if (e.target === e.currentTarget && !touchMoved.current) onClose(); }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.img
                key={`${mode}-${current}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                src={activeImages[current]}
                alt={`${alt} ${mode === "onme" ? "On Me" : "Product"} ${current + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg select-none"
                draggable={false}
              />
            </AnimatePresence>
          </div>

          {/* Next button */}
          {current < activeImages.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Dot indicators */}
          {activeImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {activeImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); goTo(idx, idx > current ? 1 : -1); }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === current ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
