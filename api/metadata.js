import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const response = await fetch(url, { timeout: 8000 });
    const html = await response.text();
    const $ = cheerio.load(html);

    const metadata = {
      title:
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        null,
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        null,
      image:
        $('meta[property="og:image"]').attr("content") ||
        $('link[rel="icon"]').attr("href") ||
        null,
      url,
    };

    res.status(200).json(metadata);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch metadata", details: error.message });
  }
}
