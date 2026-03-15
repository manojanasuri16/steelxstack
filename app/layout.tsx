import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getData } from "@/lib/storage";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  const seo = data.seo || {};
  const faviconUrl = data.creator.favicon;
  const title = seo.title || `${data.creator.name} | ${data.creator.tagline}`;
  const description = seo.description || data.creator.bio;

  return {
    title,
    description,
    keywords: seo.keywords || undefined,
    manifest: "/manifest.json",
    openGraph: {
      title,
      description,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
    ...(faviconUrl
      ? {
          icons: {
            icon: faviconUrl,
            shortcut: faviconUrl,
            apple: faviconUrl,
          },
        }
      : {}),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
