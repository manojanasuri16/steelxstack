import {
  creator as defaultCreator,
  apps as defaultApps,
  products as defaultProducts,
} from "@/data/storefrontData";
import type { Creator, App, Product } from "@/data/storefrontData";
import fs from "fs";
import path from "path";

export interface StorefrontData {
  creator: Creator;
  apps: App[];
  products: Product[];
  categories: string[];
}

const DEFAULT_DATA: StorefrontData = {
  creator: defaultCreator,
  apps: defaultApps,
  products: defaultProducts,
  categories: ["Shoes", "Gym Wear", "Accessories", "Watches", "Essentials"],
};

const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "local-data.json");

function getRedis() {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Dynamic import to avoid errors when not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

export async function getData(): Promise<StorefrontData> {
  const redis = getRedis();

  if (redis) {
    const data = await redis.get("storefront-data");
    if (data) return data as StorefrontData;
    // Seed Redis with default data on first access
    await redis.set("storefront-data", DEFAULT_DATA);
    return DEFAULT_DATA;
  }

  // Local file fallback for development
  try {
    const raw = fs.readFileSync(LOCAL_DATA_PATH, "utf-8");
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
  fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(data, null, 2));
}
