import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getData, saveData } from "@/lib/storage";

export async function GET() {
  try {
    const data = await getData();
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/data error:", e);
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const valid = await getSession();
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await saveData(data);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/data error:", e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
