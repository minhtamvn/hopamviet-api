const cheerio = require("cheerio");
const { fetchHtml } = require("../utils/scraper");

const BASE = "https://hopamviet.vn";

async function getLatest(page = 1) {
    const url = `${BASE}/chord/latest.html${page > 1 ? `?page=${page}` : ""}`;
    const html = await fetchHtml(url, 20000);
    const $ = cheerio.load(html);

    // Check if Cloudflare blocked
    if (html.includes("Cloudflare") || html.includes("blocked")) {
        throw new Error("Cloudflare blocked");
    }

    // Total count from sidebar
    const countMatch = html.match(/(\d[\d,.]*)\s*bài hát/);
    const totalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;

    const songs = [];
    $("a.song-card").each((i, el) => {
        const href = $(el).attr("href");
        const title = $(el).find(".font-bold").first().text().replace(/\s+/g, " ").trim();
        const artist = $(el).find(".truncate").eq(1).text().replace(/\s+/g, " ").trim();

        const allText = $(el).text().split("\n").map(v => v.trim()).filter(Boolean);
        let views = "";
        for (let j = allText.length - 1; j >= 0; j--) {
            if (/^[\d,.]+K?$/.test(allText[j])) {
                views = allText[j];
                break;
            }
        }

        if (!title || !href) return;

        songs.push({
            title,
            artist,
            views,
            url: href.startsWith("http") ? href : `${BASE}${href}`
        });
    });

    return {
        totalCount,
        page,
        perPage: songs.length,
        songs
    };
}

module.exports = getLatest;
