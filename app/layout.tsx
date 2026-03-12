import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getData } from "@/lib/storage";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  const faviconUrl = data.creator.favicon;

  return {
    title: `${data.creator.name} | ${data.creator.tagline}`,
    description: data.creator.bio,
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
