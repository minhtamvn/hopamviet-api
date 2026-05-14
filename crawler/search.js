const cheerio = require("cheerio");
const { fetchHtml } = require("../utils/scraper");

const BASE = "https://hopamviet.vn";

async function searchSong(keyword) {

    const html = await fetchHtml(
        `${BASE}/chord/search?song=${encodeURIComponent(keyword)}`
    );

    const $ = cheerio.load(html);
    const results = [];

    $('a[href*="/chord/song/"]').each((i, el) => {
        const href = $(el).attr("href");
        if (!href) return;

        const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        const rawText = $(el).text();

        // Extract views before cleaning (look for number patterns with optional K)
        let views = "";
        const viewMatch = rawText.match(/(\d[\d,.]*K?)\s*$/m);
        if (viewMatch) views = viewMatch[1].trim();

        let text = rawText.replace(/\s+/g, " ").trim();
        if (!text) return;

        if (text.includes("♪")) {
            text = text.split("♪")[0].trim();
        }

        text = text.replace(/\d+(\.\d+)?K/g, "").replace(/\s+/g, " ").trim();

        let title = text;
        let artist = "";

        const lines = rawText.split("\n").map(v => v.trim()).filter(Boolean);
        if (lines.length >= 2) {
            title = lines[0];
            artist = lines[1];
        }

        results.push({ title, artist, views, url: fullUrl });
    });

    const unique = [];
    const map = new Set();
    for (const item of results) {
        if (!map.has(item.url)) {
            map.add(item.url);
            unique.push(item);
        }
    }

    return unique;
}

module.exports = searchSong;
