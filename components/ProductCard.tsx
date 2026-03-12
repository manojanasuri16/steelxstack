"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Product } from "@/data/storefrontData";

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

export default function ProductCard({
  product,
  index,
  currency,
}: ProductCardProps) {
  const [showLinks, setShowLinks] = useState(false);
  const [showWorn, setShowWorn] = useState(false);

  const hasImage =
    product.image &&
    (product.image.startsWith("http") ||
      product.image.startsWith("/uploads/"));
  const hasWornImage =
    product.wornImage &&
    (product.wornImage.startsWith("http") ||
      product.wornImage.startsWith("/uploads/"));
  const singleLink = product.buyLinks.length === 1;

  const displayImage = showWorn && hasWornImage ? product.wornImage : product.image;
  const hasDisplayImage = showWorn && hasWornImage ? true : hasImage;

  return (
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
      {hasImage && hasWornImage && (
        <button
          onClick={() => setShowWorn(!showWorn)}
          className="absolute top-3 right-3 z-10 bg-dark-900/70 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full border border-glass-border hover:bg-dark-900/90 transition-colors"
        >
          {showWorn ? "Product" : "On Me"}
        </button>
      )}

      {/* Product Image */}
      <div className="aspect-square bg-dark-700 relative overflow-hidden">
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
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getPlatformColor(
                link.platform
              )}`}
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
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowLinks(false)}
                    />
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
                          <span className="font-medium">
                            {link.platform}
                          </span>
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
  );
}
