import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchMetadata } from "@/lib/scraper";

export async function POST(req: Request) {
  const valid = await getSession();
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const metadata = await fetchMetadata(url);
    return NextResponse.json(metadata);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch metadata from URL" },
      { status: 422 }
    );
  }
}
