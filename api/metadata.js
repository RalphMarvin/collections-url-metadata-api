import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // ✅ Add CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const response = await fetch(url, { timeout: 8000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Helper to resolve relative URLs
    const resolveUrl = (link) => {
      if (!link) return null;
      try {
        return new URL(link, url).href; // if it's relative, make it absolute
      } catch {
        return null;
      }
    };

    // Try multiple favicon options
    const favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      "/favicon.ico"; // fallback

    const metadata = {
      title:
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        null,
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        null,
      image: resolveUrl($('meta[property="og:image"]').attr("content")),
      favicon: resolveUrl(favicon),
      url,
    };

    res.status(200).json(metadata);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch metadata", details: error.message });
  }
}
