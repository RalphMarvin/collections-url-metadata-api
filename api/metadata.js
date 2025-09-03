// import fetch from "node-fetch";
// import * as cheerio from "cheerio";

// export default async function handler(req, res) {
//   // Add CORS headers for all responses
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//   // Handle preflight OPTIONS request
//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }

//   const { url } = req.query;

//   if (!url) {
//     return res.status(400).json({ error: "Missing url parameter" });
//   }

//   try {
//     const response = await fetch(url, { timeout: 8000 });
//     const html = await response.text();
//     const $ = cheerio.load(html);

//     // Helper to resolve relative URLs
//     const resolveUrl = (link) => {
//       if (!link) return null;
//       try {
//         return new URL(link, url).href; // if it's relative, make it absolute
//       } catch {
//         return null;
//       }
//     };

//     // Try multiple favicon options
//     const favicon =
//       $('link[rel="icon"]').attr("href") ||
//       $('link[rel="shortcut icon"]').attr("href") ||
//       $('link[rel="apple-touch-icon"]').attr("href") ||
//       "/favicon.ico"; // fallback

//     const metadata = {
//       title:
//         $('meta[property="og:title"]').attr("content") ||
//         $("title").text() ||
//         null,
//       description:
//         $('meta[property="og:description"]').attr("content") ||
//         $('meta[name="description"]').attr("content") ||
//         null,
//       image: resolveUrl($('meta[property="og:image"]').attr("content")),
//       favicon: resolveUrl(favicon),
//       url,
//     };

//     res.status(200).json(metadata);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch metadata", details: error.message });
//   }
// }






import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // Add CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
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

    // First try OpenGraph
    let title =
      $('meta[property="og:title"]').attr("content") || $("title").text() || null;
    let description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      null;
    let image =
      resolveUrl($('meta[property="og:image"]').attr("content")) || null;

    // Fallback to Twitter tags
    if (!title)
      title = $('meta[name="twitter:title"]').attr("content") || null;
    if (!description)
      description = $('meta[name="twitter:description"]').attr("content") || null;
    if (!image)
      image = resolveUrl($('meta[name="twitter:image"]').attr("content")) || null;

    // Extra fallback: try YouTube JSON-LD (structured data)
    if ((!title || !image) && url.includes("youtube.com")) {
      const jsonLd = $('script[type="application/ld+json"]').html();
      if (jsonLd) {
        try {
          const parsed = JSON.parse(jsonLd);
          if (parsed["@type"] === "VideoObject") {
            title = title || parsed.name;
            description = description || parsed.description;
            image = image || parsed.thumbnailUrl?.[0];
          }
        } catch {
          // ignore JSON parse errors
        }
      }
    }

    const metadata = {
      title,
      description,
      image,
      favicon: resolveUrl(favicon),
      url,
    };

    res.status(200).json(metadata);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch metadata",
      details: error.message,
    });
  }
}
