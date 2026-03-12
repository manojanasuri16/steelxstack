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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-5 sm:p-6 flex flex-col min-w-[260px] sm:min-w-0 relative mt-3"
    >
      {app.highlight && (
        <span className="absolute -top-2.5 right-3 bg-neon text-dark-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10 whitespace-nowrap shadow-lg">
          Recommended
        </span>
      )}

      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        {app.logo &&
        (app.logo.startsWith("http") || app.logo.startsWith("/uploads/")) ? (
          <img
            src={app.logo}
            alt={app.name}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-dark-700 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-dark-700 flex items-center justify-center text-xl sm:text-2xl font-bold text-neon shrink-0">
            {app.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white truncate">
            {app.name}
          </h3>
        </div>
      </div>

      {app.description && (
        <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">
          {app.description}
        </p>
      )}

      {hasPromo && (
        <div className="mb-4 bg-dark-700 rounded-lg px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Promo Code
          </span>
          <span className="text-neon font-mono font-bold text-sm">
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
              className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium border border-glass-border text-white hover:bg-white/10 transition-colors"
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
