import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const valid = await getSession();
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "text/plain",
    "text/markdown",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Supported: images, videos, PDF, text, markdown." },
      { status: 400 }
    );
  }

  // Max 50MB for video, 10MB for PDF, 5MB for images/text
  const isVideo = file.type.startsWith("video/");
  const isPdf = file.type === "application/pdf";
  const maxSize = isVideo ? 50 * 1024 * 1024 : isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max ${isVideo ? "50MB" : isPdf ? "10MB" : "5MB"}.` },
      { status: 400 }
    );
  }

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  // Try Vercel Blob first (production)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`steelx/${filename}`, file, {
        access: "public",
      });
      return NextResponse.json({ url: blob.url });
    } catch (e) {
      console.error("Blob upload failed:", e);
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );
    }
  }

  // Local fallback (development)
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error("Local upload failed:", e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
