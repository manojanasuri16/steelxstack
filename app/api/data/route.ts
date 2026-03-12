import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getData, saveData } from "@/lib/storage";

export async function GET() {
  const data = await getData();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const valid = await getSession();
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  await saveData(data);
  return NextResponse.json({ success: true });
}
