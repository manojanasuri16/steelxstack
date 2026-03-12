export interface UrlMetadata {
  title: string;
  description: string;
  image: string;
  favicon: string;
  siteName: string;
}

function extractMeta(html: string, property: string): string {
  // Match: <meta property="og:title" content="...">
  const r1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  // Match: <meta content="..." property="og:title">
  const r2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  return r1.exec(html)?.[1] || r2.exec(html)?.[1] || "";
}

function resolveUrl(href: string, baseOrigin: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `${baseOrigin}${href}`;
  return `${baseOrigin}/${href}`;
}

export async function fetchMetadata(url: string): Promise<UrlMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    const html = await res.text();
    const baseUrl = new URL(url);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    // Favicon: look for link rel="icon" or rel="shortcut icon"
    const faviconMatch = html.match(
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i
    );
    const altFavicon = html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i
    );
    const faviconHref =
      faviconMatch?.[1] || altFavicon?.[1] || "/favicon.ico";

    return {
      title:
        extractMeta(html, "og:title") || titleMatch?.[1]?.trim() || "",
      description:
        extractMeta(html, "og:description") ||
        extractMeta(html, "description") ||
        "",
      image: resolveUrl(extractMeta(html, "og:image"), baseUrl.origin),
      favicon: resolveUrl(faviconHref, baseUrl.origin),
      siteName:
        extractMeta(html, "og:site_name") ||
        baseUrl.hostname.replace("www.", ""),
    };
  } finally {
    clearTimeout(timeout);
  }
}
