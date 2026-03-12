import { NextResponse } from "next/server";
import { login, COOKIE_NAME } from "@/lib/auth";

async function getTOTPSecret(): Promise<string | null> {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && redisToken) {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url, token: redisToken });
      return await redis.get<string>("admin-totp-secret");
    }
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", "totp-secret.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return data.secret || null;
    }
  } catch { /* ignore */ }
  return null;
}

export async function POST(req: Request) {
  const { password, totpCode } = await req.json();
  const token = await login(password);

  if (!token) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Check if TOTP is enabled
  const totpSecret = await getTOTPSecret();
  if (totpSecret) {
    if (!totpCode) {
      return NextResponse.json({ requireTotp: true });
    }
    const { verifyCode } = await import("@/lib/totp");
    if (!verifyCode(totpSecret, totpCode)) {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
