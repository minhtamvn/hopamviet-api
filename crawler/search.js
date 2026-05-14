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

        let text = $(el).text().replace(/\s+/g, " ").trim();
        if (!text) return;

        if (text.includes("♪")) {
            text = text.split("♪")[0].trim();
        }

        text = text.replace(/\d+(\.\d+)?K/g, "").replace(/\s+/g, " ").trim();

        let title = text;
        let artist = "";

        const lines = $(el).text().split("\n").map(v => v.trim()).filter(Boolean);
        if (lines.length >= 2) {
            title = lines[0];
            artist = lines[1];
        }

        results.push({ title, artist, url: fullUrl });
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
