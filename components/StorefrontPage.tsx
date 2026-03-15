"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import SectionWrapper from "@/components/SectionWrapper";
import AppCard from "@/components/AppCard";
import ProductCard from "@/components/ProductCard";
import type {
  Creator, App, Product, ContactInfo, WorkoutPlan,
  Transformation, TransformationPlan, DiscountCode, FAQItem, Achievement, ScheduleSlot,
  SocialFeedConfig, SEOSettings, ConsultationConfig, TipConfig,
  SectionVisibility,
} from "@/data/storefrontData";

function getDomainIcon(url: string): string {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; }
  catch { return ""; }
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
  } catch { return "Link"; }
}

// ─── Theme Toggle ───
function ThemeToggle({ isDark, onToggle, hasDiscountBanner }: { isDark: boolean; onToggle: () => void; hasDiscountBanner?: boolean }) {
  return (
    <button onClick={onToggle} className={`fixed right-4 z-50 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all group ${hasDiscountBanner ? "top-12" : "top-4"}`} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      {isDark ? (
        <svg className="w-5 h-5 text-yellow-400 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ) : (
        <svg className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      )}
    </button>
  );
}

// ─── Discount Banner ───
function DiscountBanner({ codes }: { codes: DiscountCode[] }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (codes.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % codes.length), 4000);
    return () => clearInterval(timer);
  }, [codes.length]);

  if (codes.length === 0) return null;
  const dc = codes[current];

  return (
    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-neon text-dark-900 text-center py-2 px-4 text-sm font-medium relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={dc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          <span className="font-bold">{dc.code}</span>
          {dc.description && <span className="ml-2">&mdash; {dc.description}</span>}
          {dc.platform && <span className="ml-1 text-dark-900/70">on {dc.platform}</span>}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Achievements Strip ───
function AchievementsStrip({ items }: { items: Achievement[] }) {
  if (items.length === 0) return null;
  return (
    <div className="py-6 overflow-hidden">
      <div className="flex justify-center gap-4 sm:gap-8 flex-wrap px-4">
        {items.map((ach, i) => (
          <AnimatedStat key={ach.id} ach={ach} delay={i * 0.1} />
        ))}
      </div>
    </div>
  );
}

function AnimatedStat({ ach, delay }: { ach: Achievement; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay }} className="text-center min-w-[80px]">
      {ach.icon && <div className="text-2xl mb-1">{ach.icon}</div>}
      <div className="text-2xl sm:text-3xl font-extrabold text-neon">{ach.value}</div>
      <div className="text-gray-400 text-xs sm:text-sm mt-0.5">{ach.label}</div>
    </motion.div>
  );
}

// ─── Transformation Slider ───
function TransformationCard({ tf, currency }: { tf: Transformation; currency: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [mode, setMode] = useState<"image" | "video">("image");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const isValid = (url?: string) => !!url && (url.startsWith("http") || url.startsWith("/uploads/"));
  const hasBeforeImg = isValid(tf.beforeImage);
  const hasAfterImg = isValid(tf.afterImage);
  const hasBeforeVid = isValid(tf.beforeVideo);
  const hasAfterVid = isValid(tf.afterVideo);
  const hasVideo = hasBeforeVid && hasAfterVid;

  if (!hasBeforeImg && !hasBeforeVid) return null;
  if (!hasAfterImg && !hasAfterVid) return null;

  const updatePos = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl overflow-hidden">
      {/* Image/Video toggle */}
      {hasVideo && hasBeforeImg && (
        <div className="flex justify-center gap-2 p-3 pb-0">
          {(["image", "video"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${mode === m ? "bg-neon text-dark-900" : "bg-dark-700 text-gray-400"}`}>{m === "image" ? "Photos" : "Videos"}</button>
          ))}
        </div>
      )}

      {mode === "video" && hasVideo ? (
        <div className="grid grid-cols-2 gap-1 p-1">
          <div className="relative">
            <video src={tf.beforeVideo} controls className="w-full aspect-[4/3] object-cover rounded-lg" playsInline />
            <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">Before</span>
          </div>
          <div className="relative">
            <video src={tf.afterVideo} controls className="w-full aspect-[4/3] object-cover rounded-lg" playsInline />
            <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">After</span>
          </div>
        </div>
      ) : hasBeforeImg && hasAfterImg ? (
        <div ref={containerRef} className="relative aspect-[4/3] select-none cursor-col-resize overflow-hidden"
          onMouseDown={() => { dragging.current = true; }}
          onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
          onTouchStart={() => { dragging.current = true; }}
          onTouchMove={(e) => { if (dragging.current) updatePos(e.touches[0].clientX); }}
          onTouchEnd={() => { dragging.current = false; }}
          onClick={(e) => updatePos(e.clientX)}
        >
          <img src={tf.afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
            <img src={tf.beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }} />
          </div>
          <div className="absolute top-0 bottom-0" style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white -translate-x-1/2" />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
            </div>
          </div>
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">Before</div>
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">After</div>
        </div>
      ) : null}

      <div className="p-4">
        <h3 className="text-white font-semibold text-sm">{tf.title}</h3>
        {tf.duration && <span className="text-neon text-xs font-medium">{tf.duration}</span>}
        {tf.description && <p className="text-gray-400 text-xs mt-1">{tf.description}</p>}

        {/* Transformation Plans */}
        {tf.plans && tf.plans.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Plans</p>
            {tf.plans.map((plan) => {
              const isFree = !plan.price || plan.price <= 0;
              const planCurrency = plan.currency || currency;
              return (
                <div key={plan.id} className="flex items-center justify-between bg-dark-700/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.type === "diet" ? "bg-green-500/20 text-green-400" : plan.type === "workout" ? "bg-purple-500/20 text-purple-400" : "bg-orange-500/20 text-orange-400"}`}>{plan.type}</span>
                    <span className="text-white text-xs font-medium">{plan.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isFree && <span className="text-neon text-xs font-bold">{planCurrency}{plan.price!.toLocaleString()}</span>}
                    {isFree && isValid(plan.fileUrl) ? (
                      <a href={plan.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3 py-1 rounded-full bg-neon text-dark-900 hover:brightness-110">Free Download</a>
                    ) : !isFree && plan.paymentUrl ? (
                      <a href={plan.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3 py-1 rounded-full bg-neon text-dark-900 hover:brightness-110">Get Plan</a>
                    ) : isValid(plan.previewUrl) ? (
                      <a href={plan.previewUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3 py-1 rounded-full bg-dark-600 text-gray-300 hover:bg-dark-500">Preview</a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Contact Form ───
const INQUIRY_TYPES = [
  { value: "general", label: "General Inquiry" },
  { value: "collaboration", label: "Collaboration / Sponsorship" },
  { value: "business", label: "Business Inquiry" },
  { value: "feedback", label: "Feedback" },
];

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", type: "general", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setStatus("sent"); setForm({ name: "", email: "", type: "general", message: "" }); }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
  };

  if (status === "sent") {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-neon/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h4 className="text-white font-semibold mb-1">Message Sent!</h4>
        <p className="text-gray-400 text-sm">Thanks for reaching out. I&apos;ll get back to you soon.</p>
        <button onClick={() => setStatus("idle")} className="mt-4 text-neon text-sm hover:underline">Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-3">
      <h4 className="text-white font-semibold text-sm mb-1">Send Me a Message</h4>
      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your Name" required className="w-full bg-dark-700 border border-glass-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50 transition-colors" />
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your Email" required className="w-full bg-dark-700 border border-glass-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50 transition-colors" />
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-dark-700 border border-glass-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neon/50 transition-colors">
        {INQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Your message..." required rows={4} className="w-full bg-dark-700 border border-glass-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50 transition-colors resize-none" />
      {status === "error" && <p className="text-red-400 text-xs">Something went wrong. Please try again.</p>}
      <button type="submit" disabled={status === "sending"} className="w-full py-2.5 rounded-xl text-sm font-bold bg-neon text-dark-900 hover:brightness-110 transition-all disabled:opacity-50">
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

// ─── Newsletter Signup ───
function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "exists" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (res.ok) { const data = await res.json(); setStatus(data.alreadySubscribed ? "exists" : "done"); setEmail(""); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="glass rounded-2xl p-6 text-center max-w-md mx-auto">
      <h4 className="text-white font-bold mb-1">Stay Updated</h4>
      <p className="text-gray-400 text-xs mb-4">Get workout tips, gear drops, and exclusive content.</p>
      {status === "done" ? (
        <p className="text-neon text-sm font-medium">You&apos;re subscribed!</p>
      ) : status === "exists" ? (
        <p className="text-gray-400 text-sm">You&apos;re already subscribed!</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="flex-1 bg-dark-700 border border-glass-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />
          <button type="submit" disabled={status === "sending"} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-neon text-dark-900 hover:brightness-110 disabled:opacity-50 shrink-0">
            {status === "sending" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && <p className="text-red-400 text-xs mt-2">Something went wrong.</p>}
    </div>
  );
}

// ─── FAQ Accordion ───
function FAQSection({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {items.map((faq) => (
        <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open === faq.id ? null : faq.id)} className="w-full text-left p-4 flex items-center justify-between gap-3">
            <span className="text-white text-sm font-medium">{faq.question}</span>
            <motion.span animate={{ rotate: open === faq.id ? 180 : 0 }} className="text-gray-500 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </motion.span>
          </button>
          <AnimatePresence>
            {open === faq.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <p className="px-4 pb-4 text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Product Comparison ───
function ProductComparison({ products, currency, categories }: { products: Product[]; currency: string; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState(categories[0] || "");
  const [selected, setSelected] = useState<string[]>([]);

  const categoryProducts = products.filter((p) => p.category === activeCategory);
  if (products.length < 2) return null;

  const toggleProduct = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else if (selected.length < 3) setSelected([...selected, id]);
  };

  const switchCategory = (cat: string) => {
    setActiveCategory(cat);
    setSelected([]);
  };

  const compareProducts = categoryProducts.filter((p) => selected.includes(p.id));
  const isValid = (url?: string) => !!url && (url.startsWith("http") || url.startsWith("/uploads/"));

  return (
    <div>
      {/* Category filter */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-1 justify-center">
        {categories.map((cat) => (
          <button key={cat} onClick={() => switchCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeCategory === cat ? "bg-neon text-dark-900" : "glass text-gray-300 hover:text-white"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Product selection as cards */}
      {categoryProducts.length < 2 ? (
        <p className="text-gray-500 text-sm text-center py-4">Not enough products in this category to compare.</p>
      ) : (
        <>
          <p className="text-gray-400 text-xs text-center mb-4">Tap products to compare (max 3)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {categoryProducts.map((p) => (
              <button key={p.id} onClick={() => toggleProduct(p.id)}
                className={`glass rounded-xl overflow-hidden text-left transition-all ${selected.includes(p.id) ? "ring-2 ring-neon" : "hover:bg-white/5"}`}>
                <div className="aspect-square bg-dark-700 relative overflow-hidden">
                  {isValid(p.image) ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-dark-600">{p.name.charAt(0)}</div>
                  )}
                  {selected.includes(p.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-neon flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-white text-xs font-medium line-clamp-1">{p.name}</p>
                  {p.price != null && p.price > 0 && <p className="text-neon text-xs font-bold mt-0.5">{p.currency || currency}{p.price.toLocaleString()}</p>}
                </div>
              </button>
            ))}
          </div>

          {/* Comparison table */}
          <AnimatePresence>
            {compareProducts.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-glass-border">
                        <th className="text-left text-gray-500 font-medium p-3 sm:p-4 w-24 sm:w-28 text-xs">Feature</th>
                        {compareProducts.map((p) => (
                          <th key={p.id} className="text-center p-3 sm:p-4">
                            <div className="flex flex-col items-center gap-2">
                              {isValid(p.image) && <img src={p.image} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover" />}
                              <span className="text-white font-medium text-xs sm:text-sm">{p.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-b border-glass-border/30">
                        <td className="p-3 sm:p-4 text-gray-500 text-xs">Price</td>
                        {compareProducts.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 text-center text-neon font-bold text-sm">
                            {p.price ? `${p.currency || currency}${p.price.toLocaleString()}` : "—"}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-glass-border/30">
                        <td className="p-3 sm:p-4 text-gray-500 text-xs">Rating</td>
                        {compareProducts.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 text-center">
                            {p.rating ? <span className="text-yellow-400 text-sm">{"★".repeat(p.rating)}{"☆".repeat(5 - p.rating)}</span> : <span className="text-gray-600">—</span>}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-glass-border/30">
                        <td className="p-3 sm:p-4 text-gray-500 text-xs">Available On</td>
                        {compareProducts.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 text-center text-xs">{p.buyLinks.map((l) => l.platform).join(", ") || "—"}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 sm:p-4 text-gray-500 text-xs">Note</td>
                        {compareProducts.map((p) => <td key={p.id} className="p-3 sm:p-4 text-center text-xs">{p.note || "—"}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Analytics Tracker + PWA registration (fires on mount) ───
function AnalyticsTracker() {
  useEffect(() => {
    fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "pageView" }) }).catch(() => {});
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

// ─── Main StorefrontPage ───

interface StorefrontPageProps {
  creator: Creator;
  apps: App[];
  products: Product[];
  categories: string[];
  currency: string;
  contacts: ContactInfo;
  workoutPlans: WorkoutPlan[];
  transformations: Transformation[];
  discountCodes: DiscountCode[];
  faq: FAQItem[];
  achievements: Achievement[];
  schedule: ScheduleSlot[];
  socialFeed: SocialFeedConfig;
  seo: SEOSettings;
  consultation: ConsultationConfig;
  tip: TipConfig;
  sectionVisibility: SectionVisibility;
  newsletterEnabled: boolean;
}

const PRODUCTS_PER_PAGE = 8;

export default function StorefrontPage({
  creator, apps, products, categories, currency, contacts, workoutPlans,
  transformations, discountCodes, faq, achievements, schedule,
  socialFeed, consultation, tip, sectionVisibility: sv, newsletterEnabled,
}: StorefrontPageProps) {
  const allCategories = ["All", ...categories];
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sx-theme");
    if (saved === "light") { setIsDark(false); document.body.classList.add("light"); }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) { document.body.classList.remove("light"); localStorage.setItem("sx-theme", "dark"); }
    else { document.body.classList.add("light"); localStorage.setItem("sx-theme", "light"); }
  };

  const filteredProducts = (activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);
  const hasContacts = contacts.phone || contacts.email || contacts.socials.length > 0;

  // Section visibility helpers (visible = not explicitly false AND has content)
  const show = (key: keyof SectionVisibility, hasContent: boolean) => sv[key] !== false && hasContent;

  const showApps = show("apps", apps.length > 0);
  const showGear = show("gear", products.length > 0);
  const showPlans = show("plans", workoutPlans.length > 0);
  const showTransforms = show("transformations", transformations.length > 0);
  const showAchievements = show("achievements", achievements.length > 0);
  const showDiscountBanner = show("discountBanner", discountCodes.length > 0);
  const showFaq = show("faq", faq.length > 0);
  const showSchedule = show("schedule", schedule.length > 0);
  const showSocialFeed = show("socialFeed", !!(socialFeed.instagramUsername || socialFeed.youtubeChannelId));
  const showNewsletter = show("newsletter", newsletterEnabled);
  const showComparison = show("comparison", products.length >= 2);
  const showContact = show("contact", !!(hasContacts || true));
  const showConsultation = show("consultation", !!(consultation.bookingUrl || consultation.title));
  const showTip = show("tip", !!(tip.paymentUrl || tip.upiId || tip.title));

  return (
    <main className="min-h-screen">
      <AnalyticsTracker />

      {/* Discount Banner */}
      {showDiscountBanner && <DiscountBanner codes={discountCodes} />}

      <ThemeToggle isDark={isDark} onToggle={toggleTheme} hasDiscountBanner={showDiscountBanner} />

      {/* HERO */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-neon/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-neon-cyan/15 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 text-center max-w-2xl w-full">
          {creator.profileImage && creator.profileImage !== "/profile.jpg" && (creator.profileImage.startsWith("http") || creator.profileImage.startsWith("/uploads/")) ? (
            <img src={creator.profileImage} alt={creator.name} className="mx-auto mb-5 sm:mb-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-neon/50 neon-glow" />
          ) : (
            <div className="mx-auto mb-5 sm:mb-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-dark-700 border-2 border-neon/50 flex items-center justify-center neon-glow">
              <span className="text-3xl sm:text-4xl font-bold text-neon">{creator.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight">{creator.name}</h1>
          <p className="text-neon font-semibold text-xs sm:text-base uppercase tracking-widest mb-3 sm:mb-4">{creator.tagline}</p>
          <p className="text-gray-400 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto px-2">{creator.bio}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
            <a href={creator.ctaPrimary.href} className="px-8 py-3 sm:py-3.5 rounded-xl font-bold text-dark-900 bg-neon hover:brightness-110 transition-all text-sm sm:text-base neon-glow">{creator.ctaPrimary.label}</a>
            <a href={creator.ctaSecondary.href} className="px-8 py-3 sm:py-3.5 rounded-xl font-bold text-white border border-glass-border hover:bg-white/10 transition-colors text-sm sm:text-base">{creator.ctaSecondary.label}</a>
            {creator.ctaTertiary && (
              <a href={creator.ctaTertiary.href} className="px-8 py-3 sm:py-3.5 rounded-xl font-bold text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/10 transition-colors text-sm sm:text-base">{creator.ctaTertiary.label}</a>
            )}
          </div>
        </motion.div>
      </section>

      {/* Achievements Strip */}
      {showAchievements && <AchievementsStrip items={achievements} />}

      {/* Fitness Apps */}
      {showApps && (
        <SectionWrapper id="apps" title="My Training Apps" subtitle="The apps I use every single day to train, track, and improve.">
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app, i) => <AppCard key={app.id} app={app} index={i} />)}
          </div>
          <div className="sm:hidden flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-3 -mx-4 px-4">
            {apps.map((app, i) => <AppCard key={app.id} app={app} index={i} />)}
          </div>
        </SectionWrapper>
      )}

      {/* Workout Plans */}
      {showPlans && (
        <SectionWrapper id="plans" title="My Workout Plans" subtitle="Follow the exact plans I use. Whether you lift, run, or do both.">
          <div className="grid sm:grid-cols-2 gap-4">
            {workoutPlans.map((plan, i) => {
              const isPaid = plan.price != null && plan.price > 0;
              const isValidUrl = (url?: string) => !!url && (url.startsWith("http") || url.startsWith("/uploads/"));
              const hasPreview = isValidUrl(plan.previewFileUrl);
              const hasPlanFile = isValidUrl(plan.planFileUrl);
              // For paid plans: link to payment URL; for free plans with file: link to file; else link to planUrl
              const mainHref = isPaid ? plan.paymentUrl || "#" : hasPlanFile ? plan.planFileUrl! : plan.planUrl;

              return (
                <motion.div key={plan.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.35, delay: i * 0.08 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass rounded-2xl overflow-hidden flex flex-col relative group">
                  {plan.featured && <div className="absolute top-3 left-3 z-10 bg-neon text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Featured</div>}
                  {isPaid && <div className="absolute top-3 right-3 z-10 bg-neon text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{plan.currency || "₹"}{plan.price!.toLocaleString()}</div>}
                  {!isPaid && <div className="absolute top-3 right-3 z-10 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Free</div>}
                  {plan.image && (plan.image.startsWith("http") || plan.image.startsWith("/uploads/")) ? (
                    <div className="aspect-[16/9] bg-dark-700 overflow-hidden"><img src={plan.image} alt={plan.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                      <span className="text-3xl font-bold text-dark-600">{plan.type === "gym" ? "\u{1F3CB}\uFE0F" : plan.type === "running" ? "\u{1F3C3}" : plan.type === "hybrid" ? "\u26A1" : "\u{1F4CB}"}</span>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      {plan.appIcon && (plan.appIcon.startsWith("http") || plan.appIcon.startsWith("/uploads/")) ? <img src={plan.appIcon} alt="" className="w-5 h-5 rounded-sm" /> : plan.appName ? <img src={`https://www.google.com/s2/favicons?domain=${plan.planUrl ? (() => { try { return new URL(plan.planUrl).hostname; } catch { return ""; } })() : ""}&sz=32`} alt="" className="w-5 h-5 rounded-sm" /> : null}
                      <span className="text-xs text-gray-400 font-medium">{plan.appName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${plan.type === "gym" ? "bg-purple-500/20 text-purple-400" : plan.type === "running" ? "bg-green-500/20 text-green-400" : plan.type === "hybrid" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>{plan.type}</span>
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{plan.title}</h3>
                    {plan.description && <p className="text-gray-500 text-xs leading-relaxed mb-3 flex-1 line-clamp-2">{plan.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
                      {plan.duration && <span>{plan.duration}</span>}
                      {plan.duration && plan.level && <span className="text-dark-600">&middot;</span>}
                      {plan.level && <span>{plan.level}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      {hasPreview && (
                        <a href={plan.previewFileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 rounded-lg text-xs font-bold bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors">Preview</a>
                      )}
                      <a href={mainHref} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 rounded-lg text-xs font-bold bg-neon text-dark-900 hover:brightness-110 transition-all">
                        {isPaid ? "Buy Plan" : "Get Plan"}
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionWrapper>
      )}

      {/* Transformations */}
      {showTransforms && (
        <SectionWrapper id="transformations" title="My Transformation" subtitle="The journey, captured. Drag the slider to compare.">
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {transformations.map((tf) => <TransformationCard key={tf.id} tf={tf} currency={currency} />)}
          </div>
        </SectionWrapper>
      )}

      {/* Shop My Gear */}
      {showGear && (
        <SectionWrapper id="gear" title="Shop My Gear" subtitle="Everything I personally use and recommend. Tried, tested, trusted.">
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setCurrentPage(1); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeCategory === cat ? "bg-neon text-dark-900" : "glass text-gray-300 hover:text-white"}`}>{cat}</button>
            ))}
          </div>
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {paginatedProducts.map((product, i) => <ProductCard key={product.id} product={product} index={i} currency={currency} />)}
            </AnimatePresence>
          </motion.div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-lg text-sm font-medium glass text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">&larr; Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-neon text-dark-900" : "glass text-gray-300 hover:text-white"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg text-sm font-medium glass text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next &rarr;</button>
            </div>
          )}
        </SectionWrapper>
      )}

      {/* Product Comparison */}
      {showComparison && (
        <SectionWrapper id="compare" title="Compare Products" subtitle="Side-by-side comparison to help you choose.">
          <ProductComparison products={products} currency={currency} categories={categories} />
        </SectionWrapper>
      )}

      {/* FAQ */}
      {showFaq && (
        <SectionWrapper id="faq" title="Frequently Asked Questions" subtitle="Common questions answered.">
          <FAQSection items={faq} />
        </SectionWrapper>
      )}

      {/* Schedule / Availability */}
      {showSchedule && (
        <SectionWrapper id="schedule" title="Availability" subtitle="Open for collaborations and coaching.">
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {schedule.map((slot) => (
              <motion.div key={slot.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-xl p-5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${slot.type === "collab" ? "bg-purple-500/20 text-purple-400" : slot.type === "coaching" ? "bg-green-500/20 text-green-400" : slot.type === "content" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>{slot.type}</span>
                <h4 className="text-white font-semibold text-sm mt-2">{slot.title}</h4>
                <p className="text-neon text-xs font-medium mt-1">{slot.availability}</p>
                {slot.description && <p className="text-gray-400 text-xs mt-2">{slot.description}</p>}
              </motion.div>
            ))}
          </div>
        </SectionWrapper>
      )}

      {/* Social Feed */}
      {showSocialFeed && (
        <SectionWrapper id="social" title="Follow My Journey" subtitle="Latest content from my socials.">
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {socialFeed.instagramUsername && (
              <a href={`https://instagram.com/${socialFeed.instagramUsername}`} target="_blank" rel="noopener noreferrer" className="glass rounded-xl p-6 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm group-hover:text-neon transition-colors">@{socialFeed.instagramUsername}</p>
                  <p className="text-gray-400 text-xs">Follow on Instagram</p>
                </div>
              </a>
            )}
            {socialFeed.youtubeChannelId && (
              <a href={`https://youtube.com/${socialFeed.youtubeChannelId.startsWith("@") ? socialFeed.youtubeChannelId : `channel/${socialFeed.youtubeChannelId}`}`} target="_blank" rel="noopener noreferrer" className="glass rounded-xl p-6 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm group-hover:text-red-400 transition-colors">{socialFeed.youtubeChannelId}</p>
                  <p className="text-gray-400 text-xs">Subscribe on YouTube</p>
                </div>
              </a>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Newsletter */}
      {showNewsletter && (
        <SectionWrapper id="newsletter" title="Newsletter" subtitle="">
          <NewsletterSignup />
        </SectionWrapper>
      )}

      {/* Consultation / Booking */}
      {showConsultation && (
        <SectionWrapper id="consultation" title={consultation.title || "Book a Session"} subtitle={consultation.description || "Get personalized guidance."}>
          <div className="max-w-md mx-auto text-center">
            {consultation.price != null && consultation.price > 0 && (
              <p className="text-neon text-2xl font-bold mb-4">{consultation.currency || "₹"}{consultation.price.toLocaleString()}<span className="text-gray-400 text-sm font-normal"> / session</span></p>
            )}
            {consultation.bookingUrl && (
              <a href={consultation.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 rounded-xl font-bold text-dark-900 bg-neon hover:brightness-110 transition-all text-sm neon-glow">
                Book Now
              </a>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Tip / Support */}
      {showTip && (
        <SectionWrapper id="support" title={tip.title || "Support Me"} subtitle={tip.description || ""}>
          <div className="max-w-md mx-auto text-center space-y-4">
            {tip.upiId && (
              <div className="glass rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-2">UPI</p>
                <p className="text-white font-mono text-sm select-all">{tip.upiId}</p>
              </div>
            )}
            {tip.paymentUrl && (
              <a href={tip.paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 rounded-xl font-bold text-dark-900 bg-neon hover:brightness-110 transition-all text-sm neon-glow">
                Support
              </a>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Contact */}
      {showContact && (
        <SectionWrapper id="contact" title="Connect With Me" subtitle="Got questions? Want to collaborate? Reach out!">
          <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <ContactForm />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-4">
              {(contacts.phone || contacts.email) && (
                <div className="glass rounded-2xl p-5 space-y-3">
                  {contacts.phone && (
                    <a href={`tel:${contacts.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center shrink-0 group-hover:bg-neon/10 transition-colors">
                        <svg className="w-5 h-5 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                      </div>
                      <span className="text-sm">{contacts.phone}</span>
                    </a>
                  )}
                  {contacts.email && (
                    <a href={`mailto:${contacts.email}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center shrink-0 group-hover:bg-neon/10 transition-colors">
                        <svg className="w-5 h-5 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                      </div>
                      <span className="text-sm break-all">{contacts.email}</span>
                    </a>
                  )}
                </div>
              )}
              {contacts.socials.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {contacts.socials.map((social) => (
                    <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-white/10 transition-colors group">
                      <img src={social.icon && (social.icon.startsWith("http") || social.icon.startsWith("/uploads/")) ? social.icon : getDomainIcon(social.url)} alt="" className="w-6 h-6 rounded-sm shrink-0" />
                      <div className="min-w-0"><p className="text-white text-sm font-medium truncate">{social.label || getSocialLabel(social.url)}</p></div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </SectionWrapper>
      )}

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 text-center border-t border-glass-border">
        {creator.footerText && <p className="text-gray-500 text-[11px] sm:text-xs leading-relaxed mb-3 max-w-lg mx-auto">{creator.footerText}</p>}
        <p className="text-gray-500 text-xs sm:text-sm">&copy; {new Date().getFullYear()} {creator.name}. All rights reserved.</p>
      </footer>
    </main>
  );
}
