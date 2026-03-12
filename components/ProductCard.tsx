"use client";

import { motion } from "framer-motion";
import type { Product } from "@/data/storefrontData";

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
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

      {/* Product Image */}
      <div className="aspect-square bg-dark-700 relative overflow-hidden">
        {product.image && (product.image.startsWith("http") || product.image.startsWith("/uploads/")) ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
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

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-white leading-tight">
            {product.name}
          </h3>
          <span
            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              product.platform === "Amazon"
                ? "bg-orange-500/20 text-orange-400"
                : "bg-pink-500/20 text-pink-400"
            }`}
          >
            {product.platform}
          </span>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed mb-2 flex-1">
          {product.note}
        </p>

        {product.price && (
          <p className="text-neon font-bold text-lg mb-2">{product.price}</p>
        )}

        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-neon text-dark-900 hover:brightness-110 transition-all"
        >
          Buy Now
        </a>
      </div>
    </motion.div>
  );
}
