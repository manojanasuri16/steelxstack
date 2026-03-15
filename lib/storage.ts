import { Redis } from "@upstash/redis";
import {
  creator as defaultCreator,
  apps as defaultApps,
  products as defaultProducts,
  contacts as defaultContacts,
  workoutPlans as defaultWorkoutPlans,
} from "@/data/storefrontData";
import type {
  Creator, App, Product, ContactInfo, WorkoutPlan, ContactMessage,
  Transformation, DiscountCode, FAQItem, Achievement, ScheduleSlot,
  SocialFeedConfig, SEOSettings, ConsultationConfig, TipConfig,
  SectionVisibility, LanguageConfig,
} from "@/data/storefrontData";

export interface StorefrontData {
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
  language: LanguageConfig;
  newsletterEnabled: boolean;
}

const DEFAULT_DATA: StorefrontData = {
  creator: defaultCreator,
  apps: defaultApps,
  products: defaultProducts,
  categories: ["Shoes", "Gym Wear", "Accessories", "Watches", "Supplements", "Essentials"],
  currency: "\u20B9",
  contacts: defaultContacts,
  workoutPlans: defaultWorkoutPlans,
  transformations: [],
  discountCodes: [],
  faq: [],
  achievements: [],
  schedule: [],
  socialFeed: {},
  seo: {},
  consultation: {},
  tip: {},
  sectionVisibility: {},
  language: { defaultLang: "en", available: ["en"], translations: {} },
  newsletterEnabled: false,
};

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

// Migrate old data format to new format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateData(raw: any): StorefrontData {
  const data = { ...DEFAULT_DATA, ...raw };

  // Migrate products: old affiliateUrl+platform → new buyLinks[], string price → number
  if (data.products) {
    data.products = data.products.map((p: Record<string, unknown>) => {
      const m = { ...p };
      if (!m.buyLinks && (m.affiliateUrl || m.platform)) {
        m.buyLinks = m.affiliateUrl
          ? [{ platform: (m.platform as string) || "Link", url: m.affiliateUrl as string }]
          : [];
      }
      if (typeof m.price === "string") {
        m.price = parseFloat((m.price as string).replace(/[^\d.]/g, "")) || undefined;
      }
      // Migrate single image to images array
      if (!m.images && m.image) m.images = [m.image as string];
      if (!m.wornImages && m.wornImage) m.wornImages = [m.wornImage as string];
      return m;
    });
  }

  // Ensure contacts exists
  if (!data.contacts) data.contacts = DEFAULT_DATA.contacts;
  if (!data.contacts.socials) data.contacts.socials = [];

  // Ensure currency exists
  if (!data.currency) data.currency = DEFAULT_DATA.currency;

  // Ensure creator has new fields
  if (!data.creator.adminTitle) data.creator.adminTitle = "SX";
  if (data.creator.footerText === undefined) data.creator.footerText = "";

  // Ensure workoutPlans exists
  if (!data.workoutPlans) data.workoutPlans = DEFAULT_DATA.workoutPlans;

  // Migrate workout plans: ensure new file fields
  if (data.workoutPlans) {
    data.workoutPlans = data.workoutPlans.map((p: Record<string, unknown>) => ({
      ...p,
      previewFileUrl: p.previewFileUrl || undefined,
      planFileUrl: p.planFileUrl || undefined,
    }));
  }

  // Ensure new collections exist
  if (!data.transformations) data.transformations = [];
  // Migrate transformations: ensure video + plans fields
  data.transformations = data.transformations.map((t: Record<string, unknown>) => ({
    ...t,
    beforeVideo: t.beforeVideo || undefined,
    afterVideo: t.afterVideo || undefined,
    plans: t.plans || [],
  }));
  if (!data.discountCodes) data.discountCodes = [];
  if (!data.faq) data.faq = [];
  if (!data.achievements) data.achievements = [];
  if (!data.schedule) data.schedule = [];
  if (!data.socialFeed) data.socialFeed = {};
  if (!data.seo) data.seo = {};
  if (!data.consultation) data.consultation = {};
  if (!data.tip) data.tip = {};
  if (!data.sectionVisibility) data.sectionVisibility = {};
  if (!data.language) data.language = { defaultLang: "en", available: ["en"], translations: {} };
  if (data.newsletterEnabled === undefined) data.newsletterEnabled = false;

  return data as StorefrontData;
}

export async function getData(): Promise<StorefrontData> {
  const redis = getRedis();

  if (redis) {
    try {
      const raw = await redis.get("storefront-data");
      if (raw) return migrateData(raw);
      // Seed Redis with default data on first access
      await redis.set("storefront-data", DEFAULT_DATA);
      return DEFAULT_DATA;
    } catch (e) {
      console.error("Redis GET failed:", e);
      return DEFAULT_DATA;
    }
  }

  // Local file fallback for development
  try {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", "local-data.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return migrateData(JSON.parse(raw));
  } catch {
    return DEFAULT_DATA;
  }
}

export async function saveData(data: StorefrontData): Promise<void> {
  const redis = getRedis();

  if (redis) {
    await redis.set("storefront-data", data);
    return;
  }

  // Local file fallback
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "data", "local-data.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Contact Messages ───

export async function getMessages(): Promise<ContactMessage[]> {
  const redis = getRedis();
  if (redis) {
    try {
      const msgs = await redis.get<ContactMessage[]>("contact-messages");
      return msgs || [];
    } catch {
      return [];
    }
  }
  try {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", "messages.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveMessage(msg: ContactMessage): Promise<void> {
  const messages = await getMessages();
  messages.unshift(msg);
  const redis = getRedis();
  if (redis) {
    await redis.set("contact-messages", messages);
    return;
  }
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "data", "messages.json");
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
}

export async function deleteMessage(id: string): Promise<void> {
  const messages = await getMessages();
  const filtered = messages.filter((m) => m.id !== id);
  const redis = getRedis();
  if (redis) {
    await redis.set("contact-messages", filtered);
    return;
  }
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "data", "messages.json");
  fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
}

export async function markMessageRead(id: string): Promise<void> {
  const messages = await getMessages();
  const updated = messages.map((m) => m.id === id ? { ...m, read: true } : m);
  const redis = getRedis();
  if (redis) {
    await redis.set("contact-messages", updated);
    return;
  }
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "data", "messages.json");
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
}

// ─── Newsletter Subscribers ───

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}

export async function getSubscribers(): Promise<NewsletterSubscriber[]> {
  const redis = getRedis();
  if (redis) {
    try {
      const subs = await redis.get<NewsletterSubscriber[]>("newsletter-subscribers");
      return subs || [];
    } catch { return []; }
  }
  try {
    const fs = await import("fs");
    const path = await import("path");
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "subscribers.json"), "utf-8");
    return JSON.parse(raw);
  } catch { return []; }
}

export async function addSubscriber(email: string): Promise<boolean> {
  const subs = await getSubscribers();
  if (subs.some((s) => s.email.toLowerCase() === email.toLowerCase())) return false;
  subs.push({ email, subscribedAt: new Date().toISOString() });
  const redis = getRedis();
  if (redis) { await redis.set("newsletter-subscribers", subs); return true; }
  const fs = await import("fs");
  const path = await import("path");
  fs.writeFileSync(path.join(process.cwd(), "data", "subscribers.json"), JSON.stringify(subs, null, 2));
  return true;
}

// ─── Analytics ───

export interface AnalyticsData {
  pageViews: number;
  productClicks: Record<string, number>;
  linkClicks: Record<string, number>;
  contactSubmissions: number;
  newsletterSignups: number;
  dailyViews: Record<string, number>; // date string → count
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  pageViews: 0,
  productClicks: {},
  linkClicks: {},
  contactSubmissions: 0,
  newsletterSignups: 0,
  dailyViews: {},
};

export async function getAnalytics(): Promise<AnalyticsData> {
  const redis = getRedis();
  if (redis) {
    try {
      const data = await redis.get<AnalyticsData>("analytics");
      return data ? { ...DEFAULT_ANALYTICS, ...data } : DEFAULT_ANALYTICS;
    } catch { return DEFAULT_ANALYTICS; }
  }
  try {
    const fs = await import("fs");
    const path = await import("path");
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "analytics.json"), "utf-8");
    return { ...DEFAULT_ANALYTICS, ...JSON.parse(raw) };
  } catch { return DEFAULT_ANALYTICS; }
}

export async function trackEvent(event: "pageView" | "productClick" | "linkClick" | "contactSubmission" | "newsletterSignup", id?: string): Promise<void> {
  const analytics = await getAnalytics();
  const today = new Date().toISOString().slice(0, 10);

  if (event === "pageView") {
    analytics.pageViews++;
    analytics.dailyViews[today] = (analytics.dailyViews[today] || 0) + 1;
  } else if (event === "productClick" && id) {
    analytics.productClicks[id] = (analytics.productClicks[id] || 0) + 1;
  } else if (event === "linkClick" && id) {
    analytics.linkClicks[id] = (analytics.linkClicks[id] || 0) + 1;
  } else if (event === "contactSubmission") {
    analytics.contactSubmissions++;
  } else if (event === "newsletterSignup") {
    analytics.newsletterSignups++;
  }

  const redis = getRedis();
  if (redis) { await redis.set("analytics", analytics); return; }
  const fs = await import("fs");
  const path = await import("path");
  fs.writeFileSync(path.join(process.cwd(), "data", "analytics.json"), JSON.stringify(analytics, null, 2));
}
