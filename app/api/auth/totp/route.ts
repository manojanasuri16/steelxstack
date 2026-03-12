import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateSecret, verifyCode, getOTPAuthURI } from "@/lib/totp";
import QRCode from "qrcode";

// Helper to get/set TOTP secret in storage
async function getTOTPSecret(): Promise<string | null> {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url, token });
      return await redis.get<string>("admin-totp-secret");
    }
    // Local fallback
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

async function setTOTPSecret(secret: string | null): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    if (secret) {
      await redis.set("admin-totp-secret", secret);
    } else {
      await redis.del("admin-totp-secret");
    }
    return;
  }
  // Local fallback
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "totp-secret.json");
  if (secret) {
    fs.writeFileSync(filePath, JSON.stringify({ secret }));
  } else if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// GET — check TOTP status + generate setup QR if authenticated
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Public: check if TOTP is enabled (needed by login form)
  if (action === "status") {
    const secret = await getTOTPSecret();
    return NextResponse.json({ enabled: !!secret });
  }

  // Authenticated: generate new setup
  const authenticated = await getSession();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "setup") {
    const secret = generateSecret();
    const uri = getOTPAuthURI(secret);
    const qrDataUrl = await QRCode.toDataURL(uri, { width: 256, margin: 2 });
    return NextResponse.json({ secret, uri, qrDataUrl });
  }

  const existing = await getTOTPSecret();
  return NextResponse.json({ enabled: !!existing });
}

// POST — enable, verify, or disable TOTP
export async function POST(req: Request) {
  const body = await req.json();
  const { action, secret, code } = body;

  if (action === "verify") {
    // Used during login — verify code against stored secret
    const storedSecret = await getTOTPSecret();
    if (!storedSecret) {
      return NextResponse.json({ valid: true }); // TOTP not enabled
    }
    const valid = verifyCode(storedSecret, code || "");
    return NextResponse.json({ valid });
  }

  // All other actions require auth
  const authenticated = await getSession();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "enable") {
    // Verify the code first, then save the secret
    if (!secret || !code) {
      return NextResponse.json({ error: "Secret and code required" }, { status: 400 });
    }
    const valid = verifyCode(secret, code);
    if (!valid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    await setTOTPSecret(secret);
    return NextResponse.json({ success: true });
  }

  if (action === "disable") {
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }
    const storedSecret = await getTOTPSecret();
    if (storedSecret && !verifyCode(storedSecret, code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    await setTOTPSecret(null);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
