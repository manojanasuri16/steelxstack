import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || "steelx-change-this-secret-in-env"
);

const COOKIE_NAME = "sx-admin-token";

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

// Always read from Redis — no in-memory cache (serverless instances are ephemeral)
async function getSessionVersion(): Promise<number> {
  try {
    const redis = await getRedis();
    if (redis) {
      const v = await redis.get<number>("admin-session-version");
      return v ?? 1;
    }
  } catch {}
  return 1;
}

export async function rotateSessionVersion(): Promise<void> {
  try {
    const redis = await getRedis();
    if (redis) {
      const current = await redis.get<number>("admin-session-version") ?? 1;
      await redis.set("admin-session-version", current + 1);
    }
  } catch {}
}

export async function login(password: string): Promise<string | null> {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (password !== adminPassword) return null;

  const sv = await getSessionVersion();
  const token = await new SignJWT({ role: "admin", sv })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    // Always check session version — tokens without sv are invalid once version > 1
    const sv = await getSessionVersion();
    if (sv > 1 && payload.sv !== sv) return false;
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export { COOKIE_NAME };
