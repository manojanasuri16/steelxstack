"use client";

import { motion } from "framer-motion";
import type { App } from "@/data/storefrontData";

interface AppCardProps {
  app: App;
  index: number;
}

export default function AppCard({ app, index }: AppCardProps) {
  const hasProfile = !!app.profileUrl;
  const hasAffiliate = !!app.affiliateUrl;
  const hasPromo = !!app.promoCode;
  const hasButtons = hasProfile || hasAffiliate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col min-w-[260px] sm:min-w-0 relative mt-3"
    >
      {app.highlight && (
        <span className="absolute -top-2.5 right-3 bg-neon text-dark-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10 whitespace-nowrap shadow-lg tracking-wide uppercase">
          Recommended
        </span>
      )}

      <div className="flex items-center gap-3 sm:gap-4 mb-4">
        {app.logo &&
        (app.logo.startsWith("http") || app.logo.startsWith("/uploads/")) ? (
          <img
            src={app.logo}
            alt={app.name}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover bg-dark-700 shrink-0 ring-1 ring-white/5"
          />
        ) : (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-dark-700 flex items-center justify-center text-lg sm:text-xl font-bold text-neon shrink-0 ring-1 ring-white/5">
            {app.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-white truncate leading-tight">
            {app.name}
          </h3>
        </div>
      </div>

      {app.description && (
        <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
          {app.description}
        </p>
      )}

      {hasPromo && (
        <div className="mb-4 bg-dark-700/60 rounded-lg px-3 sm:px-4 py-2.5 flex items-center justify-between border border-neon/10">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
            Code
          </span>
          <span className="text-neon font-mono font-bold text-sm tracking-wide">
            {app.promoCode}
          </span>
        </div>
      )}

      {hasButtons && (
        <div className="flex gap-2 mt-auto">
          {hasProfile && (
            <a
              href={app.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium border border-glass-border text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              View Profile
            </a>
          )}
          {hasAffiliate && (
            <a
              href={app.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold bg-neon text-dark-900 hover:brightness-110 transition-all"
            >
              Try It Free
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
