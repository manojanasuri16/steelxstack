"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionWrapperProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionWrapper({
  id,
  title,
  subtitle,
  children,
  className = "",
}: SectionWrapperProps) {
  return (
    <section id={id} className={`py-14 sm:py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {title && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-10 sm:mb-12"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[40px] bg-neon/40" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-gray-400 text-sm sm:text-base max-w-lg leading-relaxed pl-[52px]">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
