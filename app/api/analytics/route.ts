import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { getAnalytics, trackEvent } from "@/lib/storage";

// POST — track an event (public, no auth)
export async function POST(req: Request) {
  try {
    const { event, id } = await req.json();
    const valid = ["pageView", "productClick", "linkClick", "contactSubmission", "newsletterSignup"];
    if (!valid.includes(event)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    await trackEvent(event, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET — fetch analytics (admin only)
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getAnalytics();
  return NextResponse.json(data);
}
