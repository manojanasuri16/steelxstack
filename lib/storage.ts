import { Redis } from "@upstash/redis";
import {
  creator as defaultCreator,
  apps as defaultApps,
  products as defaultProducts,
  contacts as defaultContacts,
} from "@/data/storefrontData";
import type { Creator, App, Product, ContactInfo } from "@/data/storefrontData";

export interface StorefrontData {
  creator: Creator;
  apps: App[];
  products: Product[];
  categories: string[];
  currency: string;
  contacts: ContactInfo;
}

const DEFAULT_DATA: StorefrontData = {
  creator: defaultCreator,
  apps: defaultApps,
  products: defaultProducts,
  categories: ["Shoes", "Gym Wear", "Accessories", "Watches", "Supplements", "Essentials"],
  currency: "\u20B9",
  contacts: defaultContacts,
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
      // Old products without per-product currency → undefined (uses global)
      return m;
    });
  }

  // Ensure contacts exists
  if (!data.contacts) {
    data.contacts = DEFAULT_DATA.contacts;
  }
  if (!data.contacts.socials) {
    data.contacts.socials = [];
  }

  // Ensure currency exists
  if (!data.currency) {
    data.currency = DEFAULT_DATA.currency;
  }

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
