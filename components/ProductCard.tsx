"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Product } from "@/data/storefrontData";
import ImageLightbox from "@/components/ImageLightbox";

interface ProductCardProps {
  product: Product;
  index: number;
  currency: string;
}

function formatPrice(price: number, currency: string): string {
  if (currency === "\u20B9" || currency === "INR") {
    return `\u20B9${price.toLocaleString("en-IN")}`;
  }
  if (currency === "$" || currency === "USD") {
    return `$${price.toLocaleString("en-US")}`;
  }
  return `${currency}${price.toLocaleString()}`;
}

function getPlatformColor(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("amazon")) return "bg-orange-500/20 text-orange-400";
  if (p.includes("flipkart")) return "bg-yellow-500/20 text-yellow-400";
  if (p.includes("myntra")) return "bg-pink-500/20 text-pink-400";
  if (p.includes("ajio")) return "bg-purple-500/20 text-purple-400";
  if (p.includes("cult")) return "bg-red-500/20 text-red-400";
  return "bg-blue-500/20 text-blue-400";
}

function isValid(url?: string): boolean {
  return !!url && (url.startsWith("http") || url.startsWith("/uploads/"));
}

export default function ProductCard({ product, index, currency }: ProductCardProps) {
  const [showLinks, setShowLinks] = useState(false);
  const [showWorn, setShowWorn] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Build image arrays for product and worn
  const productImages: string[] = product.images?.filter((u): u is string => isValid(u)) || (isValid(product.image) ? [product.image] : []);
  const wornImages: string[] = product.wornImages?.filter((u): u is string => isValid(u)) || (product.wornImage && isValid(product.wornImage) ? [product.wornImage] : []);

  const activeImages = showWorn && wornImages.length > 0 ? wornImages : productImages;
  const hasProductImage = productImages.length > 0;
  const hasWornImage = wornImages.length > 0;

  // For display, show first image of active set
  const displayImage = activeImages[0];
  const hasDisplayImage = !!displayImage;
  const singleLink = product.buyLinks.length === 1;

  const openLightbox = (idx: number = 0) => {
    if (activeImages.length === 0) return;
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.35, delay: index * 0.06 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="glass rounded-2xl overflow-hidden flex flex-col relative group"
      >
        {product.featured && (
          <div className="absolute top-3 left-3 z-10 bg-neon text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Featured
          </div>
        )}

        {/* Image Toggle Button */}
        {hasProductImage && hasWornImage && (
          <button
            onClick={() => setShowWorn(!showWorn)}
            className="absolute top-3 right-3 z-10 bg-dark-900/70 backdrop-blur-sm text-[10px] font-medium px-2.5 py-1 rounded-full border border-glass-border hover:bg-dark-900/90 transition-colors shadow-sm"
            style={{ color: "#ffffff" }}
          >
            {showWorn ? "Product" : "On Me"}
          </button>
        )}

        {/* Product Image — clickable */}
        <div
          className="aspect-square bg-dark-700 relative overflow-hidden cursor-pointer"
          onClick={() => openLightbox(0)}
        >
          {hasDisplayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-dark-600 group-hover:text-dark-700 transition-colors">
                {product.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Image count indicator */}
          {activeImages.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
              {activeImages.length}
            </div>
          )}

          {/* Tap to preview hint on hover */}
          {hasDisplayImage && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Tap to preview
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight mb-1 line-clamp-2">
            {product.name}
          </h3>

          {/* Platform badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            {product.buyLinks.map((link) => (
              <span
                key={link.platform}
                className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getPlatformColor(link.platform)}`}
              >
                {link.platform}
              </span>
            ))}
          </div>

          {product.note && (
            <p className="text-gray-500 text-[11px] sm:text-xs leading-relaxed mb-2 flex-1 line-clamp-2">
              {product.note}
            </p>
          )}

          {product.price != null && product.price > 0 && (
            <p className="text-neon font-bold text-base sm:text-lg mb-2">
              {formatPrice(product.price, product.currency || currency)}
            </p>
          )}

          {/* Buy Button */}
          {product.buyLinks.length > 0 && (
            <div className="relative mt-auto">
              {singleLink ? (
                <a
                  href={product.buyLinks[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-neon text-dark-900 hover:brightness-110 transition-all"
                >
                  Buy on {product.buyLinks[0].platform}
                </a>
              ) : (
                <>
                  <button
                    onClick={() => setShowLinks(!showLinks)}
                    className="block w-full text-center py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-neon text-dark-900 hover:brightness-110 transition-all"
                  >
                    Buy Now
                  </button>
                  {showLinks && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowLinks(false)} />
                      <div className="absolute bottom-full left-0 right-0 mb-2 z-40 bg-dark-700 border border-glass-border rounded-xl overflow-hidden shadow-2xl">
                        {product.buyLinks.map((link) => (
                          <a
                            key={link.platform}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowLinks(false)}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors border-b border-glass-border last:border-0"
                          >
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`}
                              alt=""
                              className="w-4 h-4 rounded-sm"
                            />
                            <span className="font-medium">{link.platform}</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <ImageLightbox
        images={activeImages}
        initialIndex={lightboxIndex}
        alt={product.name}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
