import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { addSubscriber, getSubscribers, trackEvent } from "@/lib/storage";

// POST — subscribe (public)
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const added = await addSubscriber(email);
    if (added) await trackEvent("newsletterSignup");
    return NextResponse.json({ ok: true, alreadySubscribed: !added });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET — list subscribers (admin only)
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subs = await getSubscribers();
  return NextResponse.json(subs);
}
