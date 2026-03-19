"use client";

import { useState, useEffect, useCallback } from "react";
import ImageUpload from "@/components/ImageUpload";
import MultiImageUpload from "@/components/admin/MultiImageUpload";
import PriceInput from "@/components/admin/PriceInput";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ───
import type {
  Creator, App, BuyLink, Product, SocialLink, ContactInfo, WorkoutPlan,
  Transformation, TransformationPlan, DiscountCode, FAQItem, Achievement, ScheduleSlot,
  SocialFeedConfig, SEOSettings, ConsultationConfig, TipConfig,
  SectionVisibility,
} from "@/data/storefrontData";

interface StorefrontData {
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

// ─── Toast ───
function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "warning"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, type === "warning" ? 6000 : 3000); return () => clearTimeout(t); }, [onClose, type]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg max-w-sm ${type === "success" ? "bg-green-500/90 text-white" : type === "warning" ? "bg-yellow-500/90 text-dark-900" : "bg-red-500/90 text-white"}`}>
      {message}
    </div>
  );
}

// ─── Login ───
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needTotp, setNeedTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, ...(needTotp ? { totpCode } : {}) }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.requireTotp) {
      setNeedTotp(true);
      return;
    }
    if (res.ok) onLogin();
    else setError(data.error || "Invalid credentials");
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-dark-700 border border-neon/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-neon">SX</span>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">{needTotp ? "Enter your authenticator code" : "Enter your admin password"}</p>
        </div>
        {!needTotp ? (
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="w-full bg-dark-700 border border-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon/50 mb-3" />
        ) : (
          <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" className="w-full bg-dark-700 border border-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon/50 mb-3 text-center text-2xl tracking-[0.5em] font-mono" />
        )}
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold bg-neon text-dark-900 hover:brightness-110 transition-all disabled:opacity-50">
          {loading ? "Verifying..." : needTotp ? "Verify" : "Login"}
        </button>
        {needTotp && (
          <button type="button" onClick={() => { setNeedTotp(false); setTotpCode(""); setError(""); }} className="w-full mt-2 text-gray-400 text-sm hover:text-white transition-colors">
            Back to password
          </button>
        )}
      </form>
    </div>
  );
}

// ─── Helpers ───
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />;
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50 resize-none" />;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={() => onChange(!checked)} className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${checked ? "bg-neon" : "bg-dark-600"}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}

function FetchButton({ url, onFetched }: { url: string; onFetched: (meta: { title: string; description: string; image: string; favicon: string; siteName: string; price: string }) => void }) {
  const [loading, setLoading] = useState(false);
  const handleFetch = async () => {
    if (!url) return;
    setLoading(true);
    try { const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }); if (res.ok) onFetched(await res.json()); } finally { setLoading(false); }
  };
  return (
    <button type="button" onClick={handleFetch} disabled={!url || loading} className="px-3 py-2 text-xs font-medium bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors disabled:opacity-40 whitespace-nowrap">
      {loading ? "Fetching..." : "Auto-Fill"}
    </button>
  );
}

// ─── Creator Tab ───
function CreatorTab({ creator, onChange }: { creator: Creator; onChange: (c: Creator) => void }) {
  const update = (key: keyof Creator, value: unknown) => onChange({ ...creator, [key]: value });
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Creator Profile</h3>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <Field label="Name"><Input value={creator.name} onChange={(v) => update("name", v)} /></Field>
          <Field label="Tagline"><Input value={creator.tagline} onChange={(v) => update("tagline", v)} /></Field>
        </div>
        <Field label="Bio"><TextArea value={creator.bio} onChange={(v) => update("bio", v)} /></Field>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <ImageUpload value={creator.profileImage} onChange={(v) => update("profileImage", v)} label="Profile Image" shape="circle" />
          <ImageUpload value={creator.favicon || ""} onChange={(v) => update("favicon", v || undefined)} label="Site Favicon (32x32 recommended)" shape="square" />
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <Field label="Primary CTA Label"><Input value={creator.ctaPrimary.label} onChange={(v) => update("ctaPrimary", { ...creator.ctaPrimary, label: v })} /></Field>
          <Field label="Primary CTA Link"><Input value={creator.ctaPrimary.href} onChange={(v) => update("ctaPrimary", { ...creator.ctaPrimary, href: v })} /></Field>
          <Field label="Secondary CTA Label"><Input value={creator.ctaSecondary.label} onChange={(v) => update("ctaSecondary", { ...creator.ctaSecondary, label: v })} /></Field>
          <Field label="Secondary CTA Link"><Input value={creator.ctaSecondary.href} onChange={(v) => update("ctaSecondary", { ...creator.ctaSecondary, href: v })} /></Field>
          <Field label="Third CTA Label (optional)"><Input value={creator.ctaTertiary?.label || ""} onChange={(v) => update("ctaTertiary", { label: v, href: creator.ctaTertiary?.href || "#contact" })} placeholder="Connect With Me" /></Field>
          <Field label="Third CTA Link"><Input value={creator.ctaTertiary?.href || ""} onChange={(v) => update("ctaTertiary", { ...creator.ctaTertiary, label: creator.ctaTertiary?.label || "Connect With Me", href: v })} placeholder="#contact" /></Field>
        </div>
      </div>

      {/* Admin Branding */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Admin Panel Branding</h3>
        <p className="text-gray-500 text-xs mb-4">Customize the logo and title shown in the admin panel header bar.</p>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <Field label="Admin Header Title"><Input value={creator.adminTitle || "SX"} onChange={(v) => update("adminTitle", v)} placeholder="SX" /></Field>
          <ImageUpload value={creator.adminLogo || ""} onChange={(v) => update("adminLogo", v || undefined)} label="Admin Header Logo (optional, replaces text)" shape="square" />
        </div>
      </div>

      {/* Footer / Affiliate Disclosure */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Footer Text</h3>
        <p className="text-gray-500 text-xs mb-4">Add an affiliate disclosure or any text to the footer. Leave empty to hide.</p>
        <Field label="Footer Text">
          <TextArea
            value={creator.footerText || ""}
            onChange={(v) => update("footerText", v)}
            placeholder="Some of the links on this page are affiliate links. This means I may earn a small commission at no extra cost to you if you make a purchase through these links."
            rows={3}
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Apps Tab ───
function SortableAppItem({ app, editing, setEditing, updateApp, deleteApp }: {
  app: App; editing: string | null; setEditing: (id: string | null) => void;
  updateApp: (id: string, u: Partial<App>) => void; deleteApp: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : "auto" as const };

  return (
    <div ref={setNodeRef} style={style} className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setEditing(editing === app.id ? null : app.id)}>
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing touch-none shrink-0 p-1 text-gray-500 hover:text-white transition-colors" title="Drag to reorder">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          </div>
          {app.logo && (app.logo.startsWith("http") || app.logo.startsWith("/uploads/")) ? (
            <img src={app.logo} alt="" className="w-10 h-10 rounded-lg object-cover bg-dark-700" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-neon font-bold">{app.name?.charAt(0) || "?"}</div>
          )}
          <div>
            <p className="text-white font-medium">{app.name || "New App"}</p>
            <p className="text-gray-500 text-xs">{app.profileUrl || "No URL set"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {app.highlight && <span className="text-[10px] bg-neon/20 text-neon px-2 py-0.5 rounded-full">Recommended</span>}
          <span className="text-gray-500 text-sm">{editing === app.id ? "\u25B2" : "\u25BC"}</span>
        </div>
      </div>
      {editing === app.id && (
        <div className="p-4 pt-0 border-t border-glass-border">
          <div className="pt-4">
            <div className="flex gap-2 items-end mb-4">
              <div className="flex-1"><Field label="Profile / Website URL"><Input value={app.profileUrl} onChange={(v) => updateApp(app.id, { profileUrl: v })} placeholder="https://..." /></Field></div>
              <div className="mb-4"><FetchButton url={app.profileUrl} onFetched={(m) => updateApp(app.id, { name: m.title || app.name, description: m.description || app.description, logo: m.favicon || m.image || app.logo })} /></div>
            </div>
            <Field label="App Name"><Input value={app.name} onChange={(v) => updateApp(app.id, { name: v })} /></Field>
            <ImageUpload value={app.logo} onChange={(v) => updateApp(app.id, { logo: v })} label="App Logo / Icon" />
            <Field label="Description"><TextArea value={app.description} onChange={(v) => updateApp(app.id, { description: v })} /></Field>
            <div className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Affiliate URL (optional)"><Input value={app.affiliateUrl || ""} onChange={(v) => updateApp(app.id, { affiliateUrl: v || undefined })} /></Field>
              <Field label="Promo Code (optional)"><Input value={app.promoCode || ""} onChange={(v) => updateApp(app.id, { promoCode: v || undefined })} /></Field>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Toggle checked={!!app.highlight} onChange={(v) => updateApp(app.id, { highlight: v })} label="Show as Recommended" />
              <button onClick={() => deleteApp(app.id)} className="text-red-400 text-sm hover:text-red-300">Delete App</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppsTab({ apps, onChange }: { apps: App[]; onChange: (a: App[]) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const updateApp = (id: string, u: Partial<App>) => onChange(apps.map((a) => (a.id === id ? { ...a, ...u } : a)));
  const deleteApp = (id: string) => { onChange(apps.filter((a) => a.id !== id)); setEditing(null); };
  const addApp = () => { const n: App = { id: `app-${Date.now()}`, name: "", logo: "", description: "", profileUrl: "" }; onChange([...apps, n]); setEditing(n.id); };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = apps.findIndex((a) => a.id === active.id);
      const newIndex = apps.findIndex((a) => a.id === over.id);
      onChange(arrayMove(apps, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={apps.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {apps.map((app) => (
            <SortableAppItem key={app.id} app={app} editing={editing} setEditing={setEditing} updateApp={updateApp} deleteApp={deleteApp} />
          ))}
        </SortableContext>
      </DndContext>
      <button onClick={addApp} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add New App</button>
    </div>
  );
}

// ─── Sortable Product Item ───
function SortableProductItem({ product, products, categories, currency, editing, setEditing, updateProduct, deleteProduct, updateBuyLink, addBuyLink, removeBuyLink }: {
  product: Product;
  products: Product[];
  categories: string[];
  currency: string;
  editing: string | null;
  setEditing: (id: string | null) => void;
  updateProduct: (id: string, u: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateBuyLink: (prodId: string, idx: number, field: keyof BuyLink, value: string) => void;
  addBuyLink: (prodId: string) => void;
  removeBuyLink: (prodId: string, idx: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setEditing(editing === product.id ? null : product.id)}>
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing touch-none shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
            title="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </div>
          {product.image && (product.image.startsWith("http") || product.image.startsWith("/uploads/")) ? (
            <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-dark-700" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-gray-600 font-bold text-sm">{product.name?.charAt(0) || "?"}</div>
          )}
          <div>
            <p className="text-white font-medium text-sm">{product.name || "New Product"}</p>
            <p className="text-gray-500 text-xs">{product.category}{product.price ? ` \u00B7 ${product.currency || currency}${product.price.toLocaleString()}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {product.featured && <span className="text-[10px] bg-neon/20 text-neon px-2 py-0.5 rounded-full">Featured</span>}
          <span className="text-gray-500 text-sm">{editing === product.id ? "\u25B2" : "\u25BC"}</span>
        </div>
      </div>

      {editing === product.id && (
        <div className="p-4 pt-0 border-t border-glass-border">
          <div className="pt-4">
            {/* Buy Links */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Buy Links</label>
              {product.buyLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input value={link.platform} onChange={(e) => updateBuyLink(product.id, idx, "platform", e.target.value)} placeholder="Platform (Amazon, Flipkart...)" className="w-1/3 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />
                  <input value={link.url} onChange={(e) => updateBuyLink(product.id, idx, "url", e.target.value)} placeholder="https://..." className="flex-1 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />
                  <FetchButton url={link.url} onFetched={(m) => {
                    const updates: Partial<Product> = {
                      name: m.title || product.name,
                      image: m.image || product.image,
                    };
                    // Auto-fill price from URL only if user hasn't manually set one
                    if (m.price && !product.price) {
                      const parsed = parseFloat(m.price.replace(/[^\d.]/g, ""));
                      if (parsed > 0) updates.price = parsed;
                    }
                    updateProduct(product.id, updates);
                    if (!link.platform && m.siteName) updateBuyLink(product.id, idx, "platform", m.siteName);
                  }} />
                  {product.buyLinks.length > 1 && (
                    <button onClick={() => removeBuyLink(product.id, idx)} className="text-red-400 hover:text-red-300 text-lg px-1">x</button>
                  )}
                </div>
              ))}
              <button onClick={() => addBuyLink(product.id)} className="text-neon-cyan text-xs hover:underline mt-1">+ Add another link</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Product Name"><Input value={product.name} onChange={(v) => updateProduct(product.id, { name: v })} /></Field>
              <PriceInput value={product.price} currency={product.currency || currency} onChange={(v) => updateProduct(product.id, { price: v })} onCurrencyChange={(v) => updateProduct(product.id, { currency: v })} />
            </div>
            <p className="text-gray-500 text-[11px] -mt-2 mb-3">💡 Price is optional — if left empty, it will be auto-fetched from the product URL when you click Auto-Fill. Enter a price manually to override.</p>
            <MultiImageUpload
              images={product.images?.length ? product.images : (product.image ? [product.image] : [])}
              onChange={(imgs) => updateProduct(product.id, { images: imgs, image: imgs[0] || "" })}
              label="Product Images"
              max={5}
            />
            <MultiImageUpload
              images={product.wornImages?.length ? product.wornImages : (product.wornImage ? [product.wornImage] : [])}
              onChange={(imgs) => updateProduct(product.id, { wornImages: imgs, wornImage: imgs[0] || undefined })}
              label="On Me Images"
              max={5}
            />
            <div className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Category">
                <select value={product.category} onChange={(e) => updateProduct(product.id, { category: e.target.value })} className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon/50">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div />
            </div>
            <Field label="Personal Note"><TextArea value={product.note} onChange={(v) => updateProduct(product.id, { note: v })} placeholder="Why do you recommend this?" /></Field>

            {/* Review & Rating */}
            <div className="glass rounded-xl p-4 mb-4">
              <h4 className="text-sm font-bold text-white mb-3">Your Review</h4>
              <Field label="Rating (1-5 stars)">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => updateProduct(product.id, { rating: product.rating === star ? undefined : star })}
                      className={`text-2xl transition-colors ${(product.rating || 0) >= star ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400/50"}`}>
                      ★
                    </button>
                  ))}
                  {product.rating && <span className="text-gray-400 text-sm ml-2 self-center">{product.rating}/5</span>}
                </div>
              </Field>
              <Field label="Review Text (optional)">
                <TextArea value={product.review || ""} onChange={(v) => updateProduct(product.id, { review: v || undefined })} placeholder="Your honest take on this product..." rows={2} />
              </Field>
              <MultiImageUpload
                images={product.reviewMedia || []}
                onChange={(imgs) => updateProduct(product.id, { reviewMedia: imgs })}
                label="Review Photos / Videos (paste video URLs too)"
                max={5}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Toggle checked={!!product.featured} onChange={(v) => updateProduct(product.id, { featured: v })} label="Featured Product" />
              <button onClick={() => deleteProduct(product.id)} className="text-red-400 text-sm hover:text-red-300">Delete Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gear Tab ───
function GearTab({ products, categories, currency, onChangeProducts, onChangeCategories }: {
  products: Product[]; categories: string[]; currency: string;
  onChangeProducts: (p: Product[]) => void; onChangeCategories: (c: string[]) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const updateProduct = (id: string, u: Partial<Product>) => onChangeProducts(products.map((p) => (p.id === id ? { ...p, ...u } : p)));
  const deleteProduct = (id: string) => { onChangeProducts(products.filter((p) => p.id !== id)); setEditing(null); };

  const addProduct = () => {
    const np: Product = { id: `prod-${Date.now()}`, name: "", category: categories[0] || "Other", image: "", buyLinks: [{ platform: "Amazon", url: "" }], note: "" };
    onChangeProducts([...products, np]);
    setEditing(np.id);
  };

  const addCategory = () => { const t = newCat.trim(); if (t && !categories.includes(t)) { onChangeCategories([...categories, t]); setNewCat(""); } };
  const removeCategory = (c: string) => onChangeCategories(categories.filter((x) => x !== c));

  const updateBuyLink = (prodId: string, idx: number, field: keyof BuyLink, value: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const links = [...prod.buyLinks];
    links[idx] = { ...links[idx], [field]: value };
    updateProduct(prodId, { buyLinks: links });
  };
  const addBuyLink = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    updateProduct(prodId, { buyLinks: [...prod.buyLinks, { platform: "", url: "" }] });
  };
  const removeBuyLink = (prodId: string, idx: number) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    updateProduct(prodId, { buyLinks: prod.buyLinks.filter((_, i) => i !== idx) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);
      onChangeProducts(arrayMove(products, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <span key={cat} className="flex items-center gap-1.5 bg-dark-700 text-gray-300 text-sm px-3 py-1.5 rounded-full">
                {cat}
                <button onClick={() => removeCategory(cat)} className="text-gray-500 hover:text-red-400 ml-1">x</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} placeholder="New category..." className="flex-1 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />
            <button onClick={addCategory} className="px-4 py-2 bg-neon text-dark-900 rounded-lg text-sm font-bold hover:brightness-110">Add</button>
          </div>
        </div>
      </div>

      {/* Products — Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {products.map((product) => (
              <SortableProductItem
                key={product.id}
                product={product}
                products={products}
                categories={categories}
                currency={currency}
                editing={editing}
                setEditing={setEditing}
                updateProduct={updateProduct}
                deleteProduct={deleteProduct}
                updateBuyLink={updateBuyLink}
                addBuyLink={addBuyLink}
                removeBuyLink={removeBuyLink}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button onClick={addProduct} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add New Product</button>
    </div>
  );
}

// ─── Contacts Tab ───
function ContactsTab({ contacts, onChange }: { contacts: ContactInfo; onChange: (c: ContactInfo) => void }) {
  const updateSocial = (id: string, u: Partial<SocialLink>) => {
    onChange({ ...contacts, socials: contacts.socials.map((s) => (s.id === id ? { ...s, ...u } : s)) });
  };
  const addSocial = () => {
    onChange({ ...contacts, socials: [...contacts.socials, { id: `social-${Date.now()}`, label: "", url: "" }] });
  };
  const removeSocial = (id: string) => {
    onChange({ ...contacts, socials: contacts.socials.filter((s) => s.id !== id) });
  };

  const detectLabel = (url: string): string => {
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
      return "";
    } catch { return ""; }
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Contact Info</h3>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <Field label="Phone Number"><Input value={contacts.phone || ""} onChange={(v) => onChange({ ...contacts, phone: v || undefined })} placeholder="+91 98765 43210" /></Field>
          <Field label="Email"><Input value={contacts.email || ""} onChange={(v) => onChange({ ...contacts, email: v || undefined })} placeholder="you@email.com" /></Field>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Social Links</h3>
        <p className="text-gray-500 text-xs mb-4">Paste your profile URL and the platform name + icon will be auto-detected.</p>
        {contacts.socials.map((social) => (
          <div key={social.id} className="glass rounded-xl p-4 mb-3">
            <div className="flex gap-2 mb-3 items-center">
              {(social.icon && (social.icon.startsWith("http") || social.icon.startsWith("/uploads/"))) ? (
                <img src={social.icon} alt="" className="w-8 h-8 rounded-sm shrink-0 object-cover" />
              ) : social.url ? (
                <img src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(social.url).hostname; } catch { return ""; }})()}&sz=32`} alt="" className="w-8 h-8 rounded-sm shrink-0" />
              ) : null}
              <input value={social.url} onChange={(e) => {
                const url = e.target.value;
                const autoLabel = detectLabel(url);
                updateSocial(social.id, { url, ...(autoLabel ? { label: autoLabel } : {}) });
              }} placeholder="https://instagram.com/yourhandle" className="flex-1 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />
              <input value={social.label} onChange={(e) => updateSocial(social.id, { label: e.target.value })} placeholder="Label" className="w-28 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon/50" />
              <button onClick={() => removeSocial(social.id)} className="text-red-400 hover:text-red-300 text-lg px-1">x</button>
            </div>
            <ImageUpload value={social.icon || ""} onChange={(v) => updateSocial(social.id, { icon: v || undefined })} label="Custom Icon (optional — auto-detected if empty)" />
          </div>
        ))}
        <button onClick={addSocial} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add Social Link</button>
      </div>
    </div>
  );
}

// ─── Plans Tab ───
const PLAN_TYPES = [
  { value: "gym", label: "Gym" },
  { value: "running", label: "Running" },
  { value: "hybrid", label: "Hybrid" },
  { value: "other", label: "Other" },
];

function PlansTab({ plans, onChange }: { plans: WorkoutPlan[]; onChange: (p: WorkoutPlan[]) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const updatePlan = (id: string, u: Partial<WorkoutPlan>) => onChange(plans.map((p) => (p.id === id ? { ...p, ...u } : p)));
  const deletePlan = (id: string) => { onChange(plans.filter((p) => p.id !== id)); setEditing(null); };
  const addPlan = () => {
    const np: WorkoutPlan = { id: `plan-${Date.now()}`, title: "", description: "", image: "", appName: "", planUrl: "", type: "gym" };
    onChange([...plans, np]);
    setEditing(np.id);
  };
  const movePlan = (id: string, dir: "up" | "down") => {
    const idx = plans.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= plans.length) return;
    const reordered = [...plans];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <div key={plan.id} className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setEditing(editing === plan.id ? null : plan.id)}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => movePlan(plan.id, "up")} disabled={plans.indexOf(plan) === 0} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none p-0.5">&#9650;</button>
                <button onClick={() => movePlan(plan.id, "down")} disabled={plans.indexOf(plan) === plans.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none p-0.5">&#9660;</button>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{plan.title || "New Plan"}</p>
                <p className="text-gray-500 text-xs">{plan.appName || "No app"}{plan.type ? ` · ${plan.type}` : ""}{plan.duration ? ` · ${plan.duration}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {plan.featured && <span className="text-[10px] bg-neon/20 text-neon px-2 py-0.5 rounded-full">Featured</span>}
              <span className="text-gray-500 text-sm">{editing === plan.id ? "\u25B2" : "\u25BC"}</span>
            </div>
          </div>
          {editing === plan.id && (
            <div className="p-4 pt-0 border-t border-glass-border">
              <div className="pt-4">
                <div className="flex gap-2 items-end mb-4">
                  <div className="flex-1"><Field label="Plan URL"><Input value={plan.planUrl} onChange={(v) => updatePlan(plan.id, { planUrl: v })} placeholder="https://lyfta.app/plan/..." /></Field></div>
                  <div className="mb-4"><FetchButton url={plan.planUrl} onFetched={(m) => updatePlan(plan.id, { title: m.title || plan.title, description: m.description || plan.description, image: m.image || plan.image })} /></div>
                </div>
                <Field label="Plan Title"><Input value={plan.title} onChange={(v) => updatePlan(plan.id, { title: v })} /></Field>
                <Field label="Description"><TextArea value={plan.description} onChange={(v) => updatePlan(plan.id, { description: v })} placeholder="What is this plan about?" /></Field>
                <ImageUpload value={plan.image} onChange={(v) => updatePlan(plan.id, { image: v })} label="Cover Image" />
                <div className="grid sm:grid-cols-2 gap-x-6">
                  <Field label="App Name"><Input value={plan.appName} onChange={(v) => updatePlan(plan.id, { appName: v })} placeholder="Lyfta, Runna, Strava..." /></Field>
                  <ImageUpload value={plan.appIcon || ""} onChange={(v) => updatePlan(plan.id, { appIcon: v || undefined })} label="App Icon (optional)" />
                </div>
                <div className="grid sm:grid-cols-3 gap-x-6">
                  <Field label="Type">
                    <select value={plan.type} onChange={(e) => updatePlan(plan.id, { type: e.target.value as WorkoutPlan["type"] })} className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon/50">
                      {PLAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Duration"><Input value={plan.duration || ""} onChange={(v) => updatePlan(plan.id, { duration: v || undefined })} placeholder="6 weeks" /></Field>
                  <Field label="Level"><Input value={plan.level || ""} onChange={(v) => updatePlan(plan.id, { level: v || undefined })} placeholder="Beginner, Intermediate..." /></Field>
                </div>
                {/* Paid Plan */}
                <div className="glass rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-bold text-white mb-3">Pricing (optional — leave empty for free plans)</h4>
                  <div className="grid sm:grid-cols-3 gap-x-6">
                    <PriceInput value={plan.price} currency={plan.currency || "₹"} onChange={(v) => updatePlan(plan.id, { price: v })} onCurrencyChange={(v) => updatePlan(plan.id, { currency: v })} />
                    <Field label="Payment URL"><Input value={plan.paymentUrl || ""} onChange={(v) => updatePlan(plan.id, { paymentUrl: v || undefined })} placeholder="https://razorpay.me/..." /></Field>
                  </div>
                </div>
                {/* Plan Files */}
                <div className="glass rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-bold text-white mb-3">Plan Files</h4>
                  <p className="text-gray-500 text-xs mb-3">Upload plan file (PDF, etc). For paid plans, users cannot access the full file until payment. Preview file is a sample shown to all users.</p>
                  <div className="grid sm:grid-cols-2 gap-x-6">
                    <ImageUpload value={plan.planFileUrl || ""} onChange={(v) => updatePlan(plan.id, { planFileUrl: v || undefined })} label="Full Plan File" accept="file" />
                    <ImageUpload value={plan.previewFileUrl || ""} onChange={(v) => updatePlan(plan.id, { previewFileUrl: v || undefined })} label="Preview / Sample File" accept="file" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Toggle checked={!!plan.featured} onChange={(v) => updatePlan(plan.id, { featured: v })} label="Featured Plan" />
                  <button onClick={() => deletePlan(plan.id)} className="text-red-400 text-sm hover:text-red-300">Delete Plan</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={addPlan} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add Workout Plan</button>
    </div>
  );
}

// ─── Security Tab ───
function SecurityTab({ showToast }: { showToast: (msg: string, type: "success" | "error") => void }) {
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/totp?action=status").then((r) => r.json()).then((d) => setTotpEnabled(d.enabled)).catch(() => {});
  }, []);

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp?action=setup");
      if (res.ok) setSetupData(await res.json());
    } finally { setLoading(false); }
  };

  const enableTotp = async () => {
    if (!setupData || !code) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", secret: setupData.secret, code }),
      });
      if (res.ok) {
        setTotpEnabled(true);
        setSetupData(null);
        setCode("");
        showToast("MFA enabled successfully!", "success");
      } else {
        showToast("Invalid code, try again", "error");
      }
    } finally { setLoading(false); }
  };

  const disableTotp = async () => {
    if (!code) { showToast("Enter your authenticator code to disable", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code }),
      });
      if (res.ok) {
        setTotpEnabled(false);
        setCode("");
        showToast("MFA disabled", "success");
      } else {
        showToast("Invalid code", "error");
      }
    } finally { setLoading(false); }
  };

  if (totpEnabled === null) return <div className="text-gray-500 text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">Two-Factor Authentication (2FA)</h3>
        <p className="text-gray-400 text-sm mb-4">Protect your admin panel with an authenticator app like Google Authenticator, Authy, or 1Password.</p>

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-3 h-3 rounded-full ${totpEnabled ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-white font-medium">{totpEnabled ? "MFA is enabled" : "MFA is not enabled"}</span>
        </div>

        {!totpEnabled && !setupData && (
          <button onClick={startSetup} disabled={loading} className="px-6 py-2.5 rounded-xl font-bold bg-neon text-dark-900 hover:brightness-110 transition-all disabled:opacity-50 text-sm">
            {loading ? "Loading..." : "Set Up Authenticator"}
          </button>
        )}

        {setupData && (
          <div className="space-y-4">
            <div className="bg-dark-700 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-3">Scan this QR code with your authenticator app:</p>
              <img src={setupData.qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg" />
              <p className="text-gray-500 text-xs mt-3">Or enter this key manually:</p>
              <p className="text-neon font-mono text-sm mt-1 break-all select-all">{setupData.secret}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Enter the 6-digit code to verify:</label>
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="flex-1 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-center text-lg font-mono tracking-[0.3em] placeholder-gray-500 focus:outline-none focus:border-neon/50" />
                <button onClick={enableTotp} disabled={code.length !== 6 || loading} className="px-6 py-2 rounded-lg font-bold bg-neon text-dark-900 hover:brightness-110 transition-all disabled:opacity-50 text-sm">
                  {loading ? "..." : "Verify & Enable"}
                </button>
              </div>
            </div>
            <button onClick={() => { setSetupData(null); setCode(""); }} className="text-gray-400 text-sm hover:text-white transition-colors">Cancel</button>
          </div>
        )}

        {totpEnabled && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">To disable MFA, enter your current authenticator code:</p>
            <div className="flex gap-2">
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="flex-1 bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-center text-lg font-mono tracking-[0.3em] placeholder-gray-500 focus:outline-none focus:border-neon/50" />
              <button onClick={disableTotp} disabled={code.length !== 6 || loading} className="px-6 py-2 rounded-lg font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 text-sm">
                {loading ? "..." : "Disable MFA"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Everywhere */}
      <div className="glass rounded-2xl p-6 mt-4">
        <h3 className="text-lg font-bold text-white mb-2">Sessions</h3>
        <p className="text-gray-400 text-sm mb-4">Invalidate all active sessions. You will need to log in again.</p>
        <button
          onClick={async () => {
            const res = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ everywhere: true }) });
            if (res.ok) {
              showToast("All sessions logged out", "success");
              setTimeout(() => window.location.reload(), 1000);
            } else {
              showToast("Failed to logout everywhere", "error");
            }
          }}
          className="px-6 py-2.5 rounded-xl font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm"
        >
          Logout Everywhere
        </button>
      </div>
    </div>
  );
}

// ─── Messages Tab ───
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  general: "General",
  collaboration: "Collaboration",
  business: "Business",
  feedback: "Feedback",
};

const TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-500/20 text-blue-400",
  collaboration: "bg-purple-500/20 text-purple-400",
  business: "bg-orange-500/20 text-orange-400",
  feedback: "bg-green-500/20 text-green-400",
};

function MessagesTab({ showToast }: { showToast: (msg: string, type: "success" | "error" | "warning") => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) setMessages(await res.json());
    } catch {
      showToast("Failed to load messages", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/contact", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        showToast("Message deleted", "success");
      }
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch("/api/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
    } catch {}
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  if (loading) return <div className="text-gray-500 text-center py-8">Loading messages...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Inbox</h3>
          {unreadCount > 0 && <span className="bg-neon text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>}
        </div>
        <p className="text-gray-500 text-xs">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
      </div>

      {messages.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">No messages yet. When someone submits the contact form, their messages will appear here.</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`glass rounded-2xl overflow-hidden ${!msg.read ? "border-l-2 border-l-neon" : ""}`}>
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => {
                setExpanded(expanded === msg.id ? null : msg.id);
                if (!msg.read) handleMarkRead(msg.id);
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center shrink-0">
                  <span className="text-neon font-bold text-sm">{msg.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm truncate ${!msg.read ? "text-white" : "text-gray-300"}`}>{msg.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[msg.type] || TYPE_COLORS.general}`}>{TYPE_LABELS[msg.type] || msg.type}</span>
                  </div>
                  <p className="text-gray-500 text-xs truncate">{msg.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-gray-600 text-[11px] hidden sm:block">{new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <span className="text-gray-500 text-sm">{expanded === msg.id ? "\u25B2" : "\u25BC"}</span>
              </div>
            </div>

            {expanded === msg.id && (
              <div className="p-4 pt-0 border-t border-glass-border">
                <div className="pt-4 space-y-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
                    <span>From: <a href={`mailto:${msg.email}`} className="text-neon-cyan hover:underline">{msg.email}</a></span>
                    <span>Date: {new Date(msg.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  <div className="bg-dark-700 rounded-xl p-4">
                    <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <a href={`mailto:${msg.email}?subject=Re: ${TYPE_LABELS[msg.type] || "Your message"} — SteelX`} className="text-neon-cyan text-xs hover:underline">Reply via email</a>
                    <button onClick={() => handleDelete(msg.id)} className="text-red-400 text-xs hover:text-red-300 ml-auto">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Transformations Tab ───
const TF_PLAN_TYPES = [
  { value: "diet", label: "Diet Plan" },
  { value: "workout", label: "Workout Plan" },
  { value: "running", label: "Running Plan" },
];

function TransformationsTab({ items, onChange }: { items: Transformation[]; onChange: (t: Transformation[]) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const update = (id: string, u: Partial<Transformation>) => onChange(items.map((t) => t.id === id ? { ...t, ...u } : t));
  const remove = (id: string) => { onChange(items.filter((t) => t.id !== id)); setEditing(null); };
  const add = () => { const n: Transformation = { id: `tf-${Date.now()}`, title: "", beforeImage: "", afterImage: "", plans: [] }; onChange([...items, n]); setEditing(n.id); };

  const updatePlan = (tfId: string, planId: string, u: Partial<TransformationPlan>) => {
    const tf = items.find((t) => t.id === tfId);
    if (!tf) return;
    const plans = (tf.plans || []).map((p) => p.id === planId ? { ...p, ...u } : p);
    update(tfId, { plans });
  };
  const addPlan = (tfId: string) => {
    const tf = items.find((t) => t.id === tfId);
    if (!tf) return;
    const np: TransformationPlan = { id: `tfp-${Date.now()}`, title: "", type: "diet" };
    update(tfId, { plans: [...(tf.plans || []), np] });
  };
  const removePlan = (tfId: string, planId: string) => {
    const tf = items.find((t) => t.id === tfId);
    if (!tf) return;
    update(tfId, { plans: (tf.plans || []).filter((p) => p.id !== planId) });
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs">Add your fitness transformation before/after photos and videos. Attach diet/workout plans (free or paid). Empty section is hidden on the public page.</p>
      {items.map((tf) => (
        <div key={tf.id} className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5" onClick={() => setEditing(editing === tf.id ? null : tf.id)}>
            <p className="text-white font-medium text-sm">{tf.title || "New Transformation"}</p>
            <span className="text-gray-500 text-sm">{editing === tf.id ? "\u25B2" : "\u25BC"}</span>
          </div>
          {editing === tf.id && (
            <div className="p-4 pt-0 border-t border-glass-border"><div className="pt-4">
              <Field label="Title"><Input value={tf.title} onChange={(v) => update(tf.id, { title: v })} placeholder="6-Month Transformation" /></Field>
              <Field label="Description"><TextArea value={tf.description || ""} onChange={(v) => update(tf.id, { description: v || undefined })} placeholder="How you achieved this..." rows={2} /></Field>
              <Field label="Duration"><Input value={tf.duration || ""} onChange={(v) => update(tf.id, { duration: v || undefined })} placeholder="6 months" /></Field>
              <div className="grid sm:grid-cols-2 gap-x-6">
                <ImageUpload value={tf.beforeImage} onChange={(v) => update(tf.id, { beforeImage: v })} label="Before Photo" />
                <ImageUpload value={tf.afterImage} onChange={(v) => update(tf.id, { afterImage: v })} label="After Photo" />
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6">
                <ImageUpload value={tf.beforeVideo || ""} onChange={(v) => update(tf.id, { beforeVideo: v || undefined })} label="Before Video (optional — upload or YouTube URL)" accept="video" />
                <ImageUpload value={tf.afterVideo || ""} onChange={(v) => update(tf.id, { afterVideo: v || undefined })} label="After Video (optional — upload or YouTube URL)" accept="video" />
              </div>

              {/* Transformation Plans */}
              <div className="glass rounded-xl p-4 mb-4">
                <h4 className="text-sm font-bold text-white mb-2">Plans (Diet, Workout, Running)</h4>
                <p className="text-gray-500 text-xs mb-3">Attach plans to this transformation. Free plans are downloadable; paid plans require payment.</p>
                <div className="space-y-3">
                  {(tf.plans || []).map((plan) => (
                    <div key={plan.id} className="bg-dark-700/50 rounded-lg p-3 space-y-2">
                      <div className="grid sm:grid-cols-3 gap-x-4">
                        <Field label="Plan Title"><Input value={plan.title} onChange={(v) => updatePlan(tf.id, plan.id, { title: v })} placeholder="My Diet Plan" /></Field>
                        <Field label="Type">
                          <select value={plan.type} onChange={(e) => updatePlan(tf.id, plan.id, { type: e.target.value as TransformationPlan["type"] })} className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon/50">
                            {TF_PLAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </Field>
                        <PriceInput value={plan.price} currency={plan.currency || "₹"} onChange={(v) => updatePlan(tf.id, plan.id, { price: v })} onCurrencyChange={(v) => updatePlan(tf.id, plan.id, { currency: v })} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-x-4">
                        <ImageUpload value={plan.fileUrl || ""} onChange={(v) => updatePlan(tf.id, plan.id, { fileUrl: v || undefined })} label="Plan File" accept="file" />
                        <ImageUpload value={plan.previewUrl || ""} onChange={(v) => updatePlan(tf.id, plan.id, { previewUrl: v || undefined })} label="Preview / Sample" accept="file" />
                      </div>
                      {plan.price != null && plan.price > 0 && (
                        <Field label="Payment URL"><Input value={plan.paymentUrl || ""} onChange={(v) => updatePlan(tf.id, plan.id, { paymentUrl: v || undefined })} placeholder="https://razorpay.me/..." /></Field>
                      )}
                      <button onClick={() => removePlan(tf.id, plan.id)} className="text-red-400 text-xs hover:text-red-300">Remove Plan</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addPlan(tf.id)} className="mt-2 text-neon text-xs hover:underline">+ Add Plan</button>
              </div>

              <button onClick={() => remove(tf.id)} className="text-red-400 text-sm hover:text-red-300 mt-2">Delete</button>
            </div></div>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add Transformation</button>
    </div>
  );
}

// ─── Discount Codes Tab ───
function DiscountsTab({ codes, onChange }: { codes: DiscountCode[]; onChange: (c: DiscountCode[]) => void }) {
  const update = (id: string, u: Partial<DiscountCode>) => onChange(codes.map((c) => c.id === id ? { ...c, ...u } : c));
  const remove = (id: string) => onChange(codes.filter((c) => c.id !== id));
  const add = () => onChange([...codes, { id: `dc-${Date.now()}`, code: "", description: "", active: true }]);

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs">Active discount codes show as a rotating banner on the public page. No active codes = banner hidden.</p>
      {codes.map((dc) => (
        <div key={dc.id} className="glass rounded-2xl p-4">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Field label="Code"><Input value={dc.code} onChange={(v) => update(dc.id, { code: v })} placeholder="STEELX10" /></Field>
            <Field label="Platform (optional)"><Input value={dc.platform || ""} onChange={(v) => update(dc.id, { platform: v || undefined })} placeholder="Lyfta, Myntra..." /></Field>
          </div>
          <Field label="Description"><Input value={dc.description} onChange={(v) => update(dc.id, { description: v })} placeholder="Get 10% off on all plans" /></Field>
          <Field label="Link (optional)"><Input value={dc.link || ""} onChange={(v) => update(dc.id, { link: v || undefined })} placeholder="https://lyfta.app/steelx" /></Field>
          <Field label="Expires (optional)"><Input value={dc.expiresAt || ""} onChange={(v) => update(dc.id, { expiresAt: v || undefined })} placeholder="2026-04-30" type="date" /></Field>
          <div className="flex items-center justify-between">
            <Toggle checked={dc.active} onChange={(v) => update(dc.id, { active: v })} label="Active" />
            <button onClick={() => remove(dc.id)} className="text-red-400 text-sm hover:text-red-300">Delete</button>
          </div>
        </div>
      ))}
      <button onClick={add} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add Discount Code</button>
    </div>
  );
}

// ─── FAQ Tab ───
function FAQTab({ items, onChange }: { items: FAQItem[]; onChange: (f: FAQItem[]) => void }) {
  const update = (id: string, u: Partial<FAQItem>) => onChange(items.map((f) => f.id === id ? { ...f, ...u } : f));
  const remove = (id: string) => onChange(items.filter((f) => f.id !== id));
  const add = () => onChange([...items, { id: `faq-${Date.now()}`, question: "", answer: "" }]);

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs">Common questions visitors might ask. Empty = hidden on public page.</p>
      {items.map((faq, idx) => (
        <div key={faq.id} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-neon font-bold text-sm">Q{idx + 1}</span>
            <button onClick={() => remove(faq.id)} className="text-red-400 text-xs hover:text-red-300 ml-auto">Delete</button>
          </div>
          <Field label="Question"><Input value={faq.question} onChange={(v) => update(faq.id, { question: v })} placeholder="What protein do you use?" /></Field>
          <Field label="Answer"><TextArea value={faq.answer} onChange={(v) => update(faq.id, { answer: v })} placeholder="I use Optimum Nutrition Gold Standard..." rows={3} /></Field>
        </div>
      ))}
      <button onClick={add} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add FAQ</button>
    </div>
  );
}

// ─── Achievements Tab ───
function AchievementsTab({ items, onChange }: { items: Achievement[]; onChange: (a: Achievement[]) => void }) {
  const update = (id: string, u: Partial<Achievement>) => onChange(items.map((a) => a.id === id ? { ...a, ...u } : a));
  const remove = (id: string) => onChange(items.filter((a) => a.id !== id));
  const add = () => onChange([...items, { id: `ach-${Date.now()}`, label: "", value: "", icon: "" }]);

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs">Stats that show in an animated strip on the public page. E.g., &quot;3+ Years Lifting&quot;, &quot;2 Half Marathons&quot;.</p>
      {items.map((ach) => (
        <div key={ach.id} className="glass rounded-2xl p-4">
          <div className="grid sm:grid-cols-3 gap-x-6">
            <Field label="Icon (emoji)"><Input value={ach.icon || ""} onChange={(v) => update(ach.id, { icon: v || undefined })} placeholder="💪" /></Field>
            <Field label="Value"><Input value={ach.value} onChange={(v) => update(ach.id, { value: v })} placeholder="3+" /></Field>
            <Field label="Label"><Input value={ach.label} onChange={(v) => update(ach.id, { label: v })} placeholder="Years Lifting" /></Field>
          </div>
          <button onClick={() => remove(ach.id)} className="text-red-400 text-xs hover:text-red-300 mt-1">Delete</button>
        </div>
      ))}
      <button onClick={add} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add Achievement</button>
    </div>
  );
}

// ─── Schedule Tab ───
const SCHEDULE_TYPES = [
  { value: "collab", label: "Collaboration" },
  { value: "coaching", label: "Coaching" },
  { value: "content", label: "Content Creation" },
  { value: "other", label: "Other" },
];

function ScheduleTab({ items, onChange }: { items: ScheduleSlot[]; onChange: (s: ScheduleSlot[]) => void }) {
  const update = (id: string, u: Partial<ScheduleSlot>) => onChange(items.map((s) => s.id === id ? { ...s, ...u } : s));
  const remove = (id: string) => onChange(items.filter((s) => s.id !== id));
  const add = () => onChange([...items, { id: `sch-${Date.now()}`, title: "", availability: "", type: "collab" }]);

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs">Show your availability for collabs, coaching, etc. Empty = hidden.</p>
      {items.map((slot) => (
        <div key={slot.id} className="glass rounded-2xl p-4">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Field label="Title"><Input value={slot.title} onChange={(v) => update(slot.id, { title: v })} placeholder="Brand Collaborations" /></Field>
            <Field label="Type">
              <select value={slot.type} onChange={(e) => update(slot.id, { type: e.target.value as ScheduleSlot["type"] })} className="w-full bg-dark-700 border border-glass-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon/50">
                {SCHEDULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Availability"><Input value={slot.availability} onChange={(v) => update(slot.id, { availability: v })} placeholder="Mon-Fri 10am-6pm IST" /></Field>
          <Field label="Description (optional)"><TextArea value={slot.description || ""} onChange={(v) => update(slot.id, { description: v || undefined })} placeholder="What this includes..." rows={2} /></Field>
          <button onClick={() => remove(slot.id)} className="text-red-400 text-xs hover:text-red-300 mt-1">Delete</button>
        </div>
      ))}
      <button onClick={add} className="w-full py-3 rounded-xl border-2 border-dashed border-glass-border text-gray-400 hover:text-neon hover:border-neon/30 transition-colors text-sm font-medium">+ Add Schedule Slot</button>
    </div>
  );
}

// ─── Social Feed Tab ───
function SocialFeedTab({ config, onChange, newsletterEnabled, onNewsletterChange }: {
  config: SocialFeedConfig; onChange: (c: SocialFeedConfig) => void;
  newsletterEnabled: boolean; onNewsletterChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">Social Feed</h3>
        <p className="text-gray-500 text-xs mb-4">Enter your usernames to show your latest content. Leave empty to hide the section.</p>
        <Field label="Instagram Username"><Input value={config.instagramUsername || ""} onChange={(v) => onChange({ ...config, instagramUsername: v || undefined })} placeholder="steelx_fitness" /></Field>
        <Field label="YouTube Channel ID or Username"><Input value={config.youtubeChannelId || ""} onChange={(v) => onChange({ ...config, youtubeChannelId: v || undefined })} placeholder="@SteelXFitness or UCxxxxxxx" /></Field>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">Newsletter</h3>
        <p className="text-gray-500 text-xs mb-4">Show email signup form on the public page. Subscribers are stored and viewable in the Analytics tab.</p>
        <Toggle checked={newsletterEnabled} onChange={onNewsletterChange} label="Enable Newsletter Signup" />
      </div>
    </div>
  );
}

// ─── SEO Tab ───
function SEOTab({ seo, onChange, consultation, onConsultationChange, tip, onTipChange }: {
  seo: SEOSettings; onChange: (s: SEOSettings) => void;
  consultation: ConsultationConfig; onConsultationChange: (c: ConsultationConfig) => void;
  tip: TipConfig; onTipChange: (t: TipConfig) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">SEO Settings</h3>
        <p className="text-gray-500 text-xs mb-4">Customize how your page appears in Google and social media previews.</p>
        <Field label="Page Title"><Input value={seo.title || ""} onChange={(v) => onChange({ ...seo, title: v || undefined })} placeholder="SteelX — Hybrid Athlete" /></Field>
        <Field label="Meta Description"><TextArea value={seo.description || ""} onChange={(v) => onChange({ ...seo, description: v || undefined })} placeholder="Follow my fitness journey..." rows={2} /></Field>
        <Field label="Keywords (comma-separated)"><Input value={seo.keywords || ""} onChange={(v) => onChange({ ...seo, keywords: v || undefined })} placeholder="fitness, hybrid athlete, gym, running" /></Field>
        <ImageUpload value={seo.ogImage || ""} onChange={(v) => onChange({ ...seo, ogImage: v || undefined })} label="Social Preview Image (OG Image)" />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">Consultation / Booking</h3>
        <p className="text-gray-500 text-xs mb-4">Add a booking section for 1-on-1 coaching. Leave empty to hide.</p>
        <Field label="Section Title"><Input value={consultation.title || ""} onChange={(v) => onConsultationChange({ ...consultation, title: v || undefined })} placeholder="Book a 1-on-1 Session" /></Field>
        <Field label="Description"><TextArea value={consultation.description || ""} onChange={(v) => onConsultationChange({ ...consultation, description: v || undefined })} placeholder="Get personalized coaching..." rows={2} /></Field>
        <Field label="Booking URL (Calendly, Cal.com, etc.)"><Input value={consultation.bookingUrl || ""} onChange={(v) => onConsultationChange({ ...consultation, bookingUrl: v || undefined })} placeholder="https://calendly.com/steelx" /></Field>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <PriceInput value={consultation.price} currency={consultation.currency || "₹"} onChange={(v) => onConsultationChange({ ...consultation, price: v })} onCurrencyChange={(v) => onConsultationChange({ ...consultation, currency: v })} />
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">Tip / Support Me</h3>
        <p className="text-gray-500 text-xs mb-4">Let visitors support you. Leave empty to hide.</p>
        <Field label="Section Title"><Input value={tip.title || ""} onChange={(v) => onTipChange({ ...tip, title: v || undefined })} placeholder="Support My Journey" /></Field>
        <Field label="Description"><TextArea value={tip.description || ""} onChange={(v) => onTipChange({ ...tip, description: v || undefined })} placeholder="If my content helps you..." rows={2} /></Field>
        <Field label="UPI ID (optional)"><Input value={tip.upiId || ""} onChange={(v) => onTipChange({ ...tip, upiId: v || undefined })} placeholder="steelx@upi" /></Field>
        <Field label="Payment Link (Buy Me a Coffee, Ko-fi, etc.)"><Input value={tip.paymentUrl || ""} onChange={(v) => onTipChange({ ...tip, paymentUrl: v || undefined })} placeholder="https://buymeacoffee.com/steelx" /></Field>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-2">Custom Domain</h3>
        <p className="text-gray-500 text-xs mb-4">To use a custom domain:</p>
        <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
          <li>Go to your Vercel project → Settings → Domains</li>
          <li>Add your domain (e.g., steelx.fit)</li>
          <li>Update DNS: Add a CNAME record pointing to <code className="text-neon-cyan bg-dark-700 px-1.5 py-0.5 rounded">cname.vercel-dns.com</code></li>
          <li>Wait for SSL certificate (automatic, usually &lt;5 min)</li>
          <li>Your site is now live at your custom domain!</li>
        </ol>
      </div>
    </div>
  );
}

// ─── Section Visibility Tab ───
const SECTION_KEYS: { key: keyof SectionVisibility; label: string; description: string }[] = [
  { key: "apps", label: "Training Apps", description: "Your recommended fitness apps" },
  { key: "gear", label: "Shop My Gear", description: "Product recommendations" },
  { key: "plans", label: "Workout Plans", description: "Your training programs" },
  { key: "transformations", label: "Transformations", description: "Before/after photos" },
  { key: "achievements", label: "Achievements", description: "Stats strip" },
  { key: "discountBanner", label: "Discount Banner", description: "Rotating promo codes" },
  { key: "faq", label: "FAQ", description: "Frequently asked questions" },
  { key: "schedule", label: "Schedule / Availability", description: "Your availability" },
  { key: "socialFeed", label: "Social Feed", description: "Instagram/YouTube embed" },
  { key: "newsletter", label: "Newsletter", description: "Email signup form" },
  { key: "comparison", label: "Product Comparison", description: "Compare products side-by-side" },
  { key: "contact", label: "Connect With Me", description: "Contact form + socials" },
  { key: "consultation", label: "Consultation / Booking", description: "1-on-1 coaching" },
  { key: "tip", label: "Tip / Support", description: "Support/donation section" },
];

function VisibilityTab({ visibility, onChange }: { visibility: SectionVisibility; onChange: (v: SectionVisibility) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs">Control which sections appear on the public page. Sections with no content are auto-hidden regardless of this setting.</p>
      <div className="glass rounded-2xl p-6 space-y-4">
        {SECTION_KEYS.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{label}</p>
              <p className="text-gray-500 text-[11px]">{description}</p>
            </div>
            <Toggle checked={visibility[key] !== false} onChange={(v) => onChange({ ...visibility, [key]: v })} label="" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics Tab ───
interface AnalyticsData {
  pageViews: number;
  productClicks: Record<string, number>;
  linkClicks: Record<string, number>;
  contactSubmissions: number;
  newsletterSignups: number;
  dailyViews: Record<string, number>;
}

interface NewsletterSub { email: string; subscribedAt: string; }

function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [subs, setSubs] = useState<NewsletterSub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/newsletter", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
    ]).then(([a, s]) => {
      setData(a);
      setSubs(Array.isArray(s) ? s : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-center py-8">Loading analytics...</div>;
  if (!data) return <div className="text-gray-500 text-center py-8">No analytics data yet.</div>;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const maxViews = Math.max(...last7.map((d) => data.dailyViews[d] || 0), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Page Views", value: data.pageViews, color: "text-neon" },
          { label: "Product Clicks", value: Object.values(data.productClicks).reduce((a, b) => a + b, 0), color: "text-orange-400" },
          { label: "Messages", value: data.contactSubmissions, color: "text-purple-400" },
          { label: "Subscribers", value: data.newsletterSignups, color: "text-cyan-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 7-Day Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Page Views — Last 7 Days</h3>
        <div className="flex items-end gap-1 h-32">
          {last7.map((day) => {
            const views = data.dailyViews[day] || 0;
            const height = Math.max((views / maxViews) * 100, 4);
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{views}</span>
                <div className="w-full bg-neon/80 rounded-t" style={{ height: `${height}%` }} />
                <span className="text-[9px] text-gray-500">{day.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products */}
      {Object.keys(data.productClicks).length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-3">Top Product Clicks</h3>
          <div className="space-y-2">
            {Object.entries(data.productClicks).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, clicks]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate">{name}</span>
                <span className="text-neon font-medium">{clicks}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Subscribers */}
      {subs.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-3">Newsletter Subscribers ({subs.length})</h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {subs.map((sub) => (
              <div key={sub.email} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{sub.email}</span>
                <span className="text-gray-500 text-xs">{new Date(sub.subscribedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ───
const TABS = [
  { id: "creator", label: "Profile" },
  { id: "apps", label: "Apps" },
  { id: "gear", label: "Gear" },
  { id: "plans", label: "Plans" },
  { id: "transformations", label: "Transforms" },
  { id: "achievements", label: "Stats" },
  { id: "discounts", label: "Discounts" },
  { id: "faq", label: "FAQ" },
  { id: "schedule", label: "Schedule" },
  { id: "contacts", label: "Contact" },
  { id: "social", label: "Social" },
  { id: "seo", label: "SEO & More" },
  { id: "visibility", label: "Sections" },
  { id: "messages", label: "Messages" },
  { id: "analytics", label: "Analytics" },
  { id: "security", label: "Security" },
] as const;

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<StorefrontData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("creator");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "warning") => setToast({ message, type }), []);

  useEffect(() => {
    fetch("/api/auth/check").then((r) => r.json()).then((d) => { setAuthenticated(d.authenticated); setChecking(false); }).catch(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/data").then((r) => r.json()).then(setData).catch(() => showToast("Failed to load data", "error"));
  }, [authenticated, showToast]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) {
        // Check for products with buy links but no price
        const noPriceProducts = data.products.filter((p) => p.buyLinks.some((l) => l.url) && !p.price);
        if (noPriceProducts.length > 0) {
          const names = noPriceProducts.map((p) => p.name || "Untitled").join(", ");
          showToast(`Saved! But no price for: ${names}. Try Auto-Fill or enter manually.`, "warning");
        } else {
          showToast("Changes saved!", "success");
        }
      } else {
        showToast("Failed to save", "error");
      }
    } catch { showToast("Network error", "error"); } finally { setSaving(false); }
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setAuthenticated(false); setData(null); };

  if (checking) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>;
  if (!authenticated) return <LoginForm onLogin={() => setAuthenticated(true)} />;
  if (!data) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="text-gray-500">Loading data...</div></div>;

  const adminTitle = data.creator.adminTitle || "SX";
  const adminLogo = data.creator.adminLogo;

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="sticky top-0 z-40 bg-dark-900 border-b border-glass-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {adminLogo && (adminLogo.startsWith("http") || adminLogo.startsWith("/uploads/")) ? (
              <img src={adminLogo} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-neon flex items-center justify-center">
                <span className="text-dark-900 font-bold text-xs">{adminTitle.slice(0, 3)}</span>
              </div>
            )}
            <h1 className="text-white font-bold text-sm sm:text-base">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5">View Site</a>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm transition-colors px-3 py-1.5">Logout</button>
          </div>
        </div>
      </header>

      <div className="sticky top-[57px] z-30 bg-dark-900 border-b border-glass-border">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id ? "text-neon" : "text-gray-400 hover:text-white"}`}>
              {tab.label}
              {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "creator" && <CreatorTab creator={data.creator} onChange={(creator) => setData({ ...data, creator })} />}
        {activeTab === "apps" && <AppsTab apps={data.apps} onChange={(apps) => setData({ ...data, apps })} />}
        {activeTab === "gear" && (
          <GearTab
            products={data.products}
            categories={data.categories}
            currency={data.currency}
            onChangeProducts={(products) => setData({ ...data, products })}
            onChangeCategories={(categories) => setData({ ...data, categories })}
          />
        )}
        {activeTab === "plans" && <PlansTab plans={data.workoutPlans || []} onChange={(workoutPlans) => setData({ ...data, workoutPlans })} />}
        {activeTab === "transformations" && <TransformationsTab items={data.transformations || []} onChange={(transformations) => setData({ ...data, transformations })} />}
        {activeTab === "achievements" && <AchievementsTab items={data.achievements || []} onChange={(achievements) => setData({ ...data, achievements })} />}
        {activeTab === "discounts" && <DiscountsTab codes={data.discountCodes || []} onChange={(discountCodes) => setData({ ...data, discountCodes })} />}
        {activeTab === "faq" && <FAQTab items={data.faq || []} onChange={(faq) => setData({ ...data, faq })} />}
        {activeTab === "schedule" && <ScheduleTab items={data.schedule || []} onChange={(schedule) => setData({ ...data, schedule })} />}
        {activeTab === "contacts" && <ContactsTab contacts={data.contacts} onChange={(contacts) => setData({ ...data, contacts })} />}
        {activeTab === "social" && <SocialFeedTab config={data.socialFeed || {}} onChange={(socialFeed) => setData({ ...data, socialFeed })} newsletterEnabled={data.newsletterEnabled ?? false} onNewsletterChange={(newsletterEnabled) => setData({ ...data, newsletterEnabled })} />}
        {activeTab === "seo" && <SEOTab seo={data.seo || {}} onChange={(seo) => setData({ ...data, seo })} consultation={data.consultation || {}} onConsultationChange={(consultation) => setData({ ...data, consultation })} tip={data.tip || {}} onTipChange={(tip) => setData({ ...data, tip })} />}
        {activeTab === "visibility" && <VisibilityTab visibility={data.sectionVisibility || {}} onChange={(sectionVisibility) => setData({ ...data, sectionVisibility })} />}

        {activeTab === "messages" && <MessagesTab showToast={showToast} />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "security" && <SecurityTab showToast={showToast} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-glass-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 rounded-xl font-bold bg-neon text-dark-900 hover:brightness-110 transition-all disabled:opacity-50 text-sm">
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
