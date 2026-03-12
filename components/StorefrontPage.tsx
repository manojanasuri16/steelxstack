"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "@/components/SectionWrapper";
import AppCard from "@/components/AppCard";
import ProductCard from "@/components/ProductCard";
import type { Creator, App, Product } from "@/data/storefrontData";

interface StorefrontPageProps {
  creator: Creator;
  apps: App[];
  products: Product[];
  categories: string[];
}

export default function StorefrontPage({
  creator,
  apps,
  products,
  categories,
}: StorefrontPageProps) {
  const allCategories = ["All", ...categories];
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/15 rounded-full blur-[100px] animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-2xl"
        >
          {creator.profileImage && creator.profileImage !== "/profile.jpg" ? (
            <img
              src={creator.profileImage}
              alt={creator.name}
              className="mx-auto mb-6 w-28 h-28 rounded-full object-cover border-2 border-neon/50 neon-glow"
            />
          ) : (
            <div className="mx-auto mb-6 w-28 h-28 rounded-full bg-dark-700 border-2 border-neon/50 flex items-center justify-center neon-glow">
              <span className="text-4xl font-bold text-neon">
                {creator.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-3 tracking-tight">
            {creator.name}
          </h1>
          <p className="text-neon font-semibold text-sm sm:text-base uppercase tracking-widest mb-4">
            {creator.tagline}
          </p>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            {creator.bio}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={creator.ctaPrimary.href}
              className="px-8 py-3.5 rounded-xl font-bold text-dark-900 bg-neon hover:brightness-110 transition-all text-sm sm:text-base neon-glow"
            >
              {creator.ctaPrimary.label}
            </a>
            <a
              href={creator.ctaSecondary.href}
              className="px-8 py-3.5 rounded-xl font-bold text-white border border-glass-border hover:bg-white/10 transition-colors text-sm sm:text-base"
            >
              {creator.ctaSecondary.label}
            </a>
          </div>
        </motion.div>
      </section>

      {/* FITNESS APPS */}
      {apps.length > 0 && (
        <SectionWrapper
          id="apps"
          title="My Training Apps"
          subtitle="The apps I use every single day to train, track, and improve."
        >
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app, i) => (
              <AppCard key={app.id} app={app} index={i} />
            ))}
          </div>
          <div className="sm:hidden flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
            {apps.map((app, i) => (
              <AppCard key={app.id} app={app} index={i} />
            ))}
          </div>
        </SectionWrapper>
      )}

      {/* SHOP MY GEAR */}
      {products.length > 0 && (
        <SectionWrapper
          id="gear"
          title="Shop My Gear"
          subtitle="Everything I personally use and recommend. Tried, tested, trusted."
        >
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-neon text-dark-900"
                    : "glass text-gray-300 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SectionWrapper>
      )}

      {/* FOOTER */}
      <footer className="py-10 px-4 text-center border-t border-glass-border">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} {creator.name}. All rights
          reserved.
        </p>
      </footer>
    </main>
  );
}
