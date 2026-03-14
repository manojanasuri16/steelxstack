import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveMessage, getMessages, deleteMessage, markMessageRead } from "@/lib/storage";
import type { ContactMessage } from "@/data/storefrontData";

// POST — public: submit a contact message
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, type, message } = body;

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }
    if (!["general", "collaboration", "business", "feedback"].includes(type)) {
      return NextResponse.json({ error: "Invalid inquiry type" }, { status: 400 });
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const msg: ContactMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      email: email.trim(),
      type,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    await saveMessage(msg);

    // Send email notification via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFICATION_EMAIL;
    if (resendKey && notifyEmail) {
      try {
        const typeLabels: Record<string, string> = {
          general: "General Inquiry",
          collaboration: "Collaboration / Sponsorship",
          business: "Business Inquiry",
          feedback: "Feedback",
        };
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "SteelX <onboarding@resend.dev>",
            to: notifyEmail,
            subject: `New ${typeLabels[type] || type} from ${msg.name}`,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
                <h2 style="color:#333;">New Contact Message</h2>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#666;width:80px;"><strong>Name</strong></td><td style="padding:8px 0;">${msg.name}</td></tr>
                  <tr><td style="padding:8px 0;color:#666;"><strong>Email</strong></td><td style="padding:8px 0;"><a href="mailto:${msg.email}">${msg.email}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#666;"><strong>Type</strong></td><td style="padding:8px 0;">${typeLabels[type] || type}</td></tr>
                </table>
                <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">
                  <p style="margin:0;color:#333;white-space:pre-wrap;">${msg.message}</p>
                </div>
                <p style="margin-top:16px;color:#999;font-size:12px;">Sent from your SteelX storefront</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr);
        // Don't fail the request — message is already saved in Redis
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/contact error:", e);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}

// GET — admin: fetch all messages
export async function GET() {
  try {
    const valid = await getSession();
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (e) {
    console.error("GET /api/contact error:", e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// DELETE — admin: delete a message
export async function DELETE(req: Request) {
  try {
    const valid = await getSession();
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteMessage(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/contact error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// PATCH — admin: mark message as read
export async function PATCH(req: Request) {
  try {
    const valid = await getSession();
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await markMessageRead(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/contact error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
