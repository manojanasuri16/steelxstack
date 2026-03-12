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

export async function getData(): Promise<StorefrontData> {
  const redis = getRedis();

  if (redis) {
    try {
      const data = await redis.get<StorefrontData>("storefront-data");
      if (data) return data;
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
    return JSON.parse(raw);
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
