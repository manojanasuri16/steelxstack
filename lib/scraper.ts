export interface UrlMetadata {
  title: string;
  description: string;
  image: string;
  favicon: string;
  siteName: string;
  price: string;
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

    // Try to extract price from common patterns
    const priceOg = extractMeta(html, "og:price:amount") || extractMeta(html, "product:price:amount");
    const priceCurrency = extractMeta(html, "og:price:currency") || extractMeta(html, "product:price:currency") || "";
    // Common price patterns in HTML: ₹1,299 / Rs. 1299 / $49.99
    const priceHtml = html.match(/["'>](?:₹|Rs\.?\s*|INR\s*|USD\s*|\$)([\d,]+(?:\.\d{2})?)/)?.[1] || "";
    const priceValue = priceOg || priceHtml;
    const price = priceValue
      ? `${priceCurrency === "INR" || !priceCurrency ? "\u20B9" : priceCurrency + " "}${priceValue}`
      : "";

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
      price,
    };
  } finally {
    clearTimeout(timeout);
  }
}
