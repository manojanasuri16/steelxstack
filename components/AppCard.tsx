"use client";

import { motion } from "framer-motion";
import type { App } from "@/data/storefrontData";

interface AppCardProps {
  app: App;
  index: number;
}

export default function AppCard({ app, index }: AppCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-6 flex flex-col min-w-[280px] sm:min-w-0 relative"
    >
      {app.highlight && (
        <span className="absolute -top-3 right-4 bg-neon text-dark-900 text-xs font-bold px-3 py-1 rounded-full">
          Recommended
        </span>
      )}

      <div className="flex items-center gap-4 mb-4">
        {app.logo && (app.logo.startsWith("http") || app.logo.startsWith("/uploads/")) ? (
          <img src={app.logo} alt={app.name} className="w-14 h-14 rounded-xl object-cover bg-dark-700 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center text-2xl font-bold text-neon shrink-0">
            {app.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-white">{app.name}</h3>
        </div>
      </div>

      <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">
        {app.description}
      </p>

      {app.promoCode && (
        <div className="mb-4 bg-dark-700 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Promo Code
          </span>
          <span className="text-neon font-mono font-bold text-sm">
            {app.promoCode}
          </span>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <a
          href={app.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium border border-glass-border text-white hover:bg-white/10 transition-colors"
        >
          View Profile
        </a>
        {app.affiliateUrl && (
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
    </motion.div>
  );
}
