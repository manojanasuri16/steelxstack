"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "@/components/SectionWrapper";
import AppCard from "@/components/AppCard";
import ProductCard from "@/components/ProductCard";
import type { Creator, App, Product, ContactInfo } from "@/data/storefrontData";

function getDomainIcon(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}

function getSocialLabel(url: string): string {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes("instagram")) return "Instagram";
    if (h.includes("twitter") || h.includes("x.com")) return "X / Twitter";
    if (h.includes("youtube")) return "YouTube";
    if (h.includes("facebook")) return "Facebook";
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("tiktok")) return "TikTok";
    if (h.includes("threads")) return "Threads";
    if (h.includes("telegram")) return "Telegram";
    if (h.includes("whatsapp")) return "WhatsApp";
    if (h.includes("strava")) return "Strava";
    if (h.includes("github")) return "GitHub";
    return h.replace("www.", "").split(".")[0];
  } catch {
    return "Link";
  }
}

interface StorefrontPageProps {
  creator: Creator;
  apps: App[];
  products: Product[];
  categories: string[];
  currency: string;
  contacts: ContactInfo;
}

export default function StorefrontPage({
  creator,
  apps,
  products,
  categories,
  currency,
  contacts,
}: StorefrontPageProps) {
  const allCategories = ["All", ...categories];
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const hasContacts =
    contacts.phone || contacts.email || contacts.socials.length > 0;

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-neon/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-neon-cyan/15 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-2xl w-full"
        >
          {creator.profileImage &&
          creator.profileImage !== "/profile.jpg" &&
          (creator.profileImage.startsWith("http") ||
            creator.profileImage.startsWith("/uploads/")) ? (
            <img
              src={creator.profileImage}
              alt={creator.name}
              className="mx-auto mb-5 sm:mb-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-neon/50 neon-glow"
            />
          ) : (
            <div className="mx-auto mb-5 sm:mb-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-dark-700 border-2 border-neon/50 flex items-center justify-center neon-glow">
              <span className="text-3xl sm:text-4xl font-bold text-neon">
                {creator.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight">
            {creator.name}
          </h1>
          <p className="text-neon font-semibold text-xs sm:text-base uppercase tracking-widest mb-3 sm:mb-4">
            {creator.tagline}
          </p>
          <p className="text-gray-400 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto px-2">
            {creator.bio}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
            <a
              href={creator.ctaPrimary.href}
              className="px-8 py-3 sm:py-3.5 rounded-xl font-bold text-dark-900 bg-neon hover:brightness-110 transition-all text-sm sm:text-base neon-glow"
            >
              {creator.ctaPrimary.label}
            </a>
            <a
              href={creator.ctaSecondary.href}
              className="px-8 py-3 sm:py-3.5 rounded-xl font-bold text-white border border-glass-border hover:bg-white/10 transition-colors text-sm sm:text-base"
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
          <div className="sm:hidden flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-3 -mx-4 px-4">
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
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
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
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  currency={currency}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SectionWrapper>
      )}

      {/* CONTACT ME */}
      {hasContacts && (
        <SectionWrapper
          id="contact"
          title="Connect With Me"
          subtitle="Got questions? Want to collaborate? Reach out!"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            {/* Phone & Email */}
            {(contacts.phone || contacts.email) && (
              <div className="glass rounded-2xl p-5 mb-4 space-y-3">
                {contacts.phone && (
                  <a
                    href={`tel:${contacts.phone}`}
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center shrink-0 group-hover:bg-neon/10 transition-colors">
                      <svg className="w-5 h-5 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <span className="text-sm">{contacts.phone}</span>
                  </a>
                )}
                {contacts.email && (
                  <a
                    href={`mailto:${contacts.email}`}
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center shrink-0 group-hover:bg-neon/10 transition-colors">
                      <svg className="w-5 h-5 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <span className="text-sm break-all">{contacts.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Social Links */}
            {contacts.socials.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {contacts.socials.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-white/10 transition-colors group"
                  >
                    <img
                      src={getDomainIcon(social.url)}
                      alt=""
                      className="w-6 h-6 rounded-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {social.label || getSocialLabel(social.url)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        </SectionWrapper>
      )}

      {/* FOOTER */}
      <footer className="py-8 sm:py-10 px-4 text-center border-t border-glass-border">
        <p className="text-gray-500 text-xs sm:text-sm">
          &copy; {new Date().getFullYear()} {creator.name}. All rights
          reserved.
        </p>
      </footer>
    </main>
  );
}
