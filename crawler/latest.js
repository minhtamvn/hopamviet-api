const cheerio = require("cheerio");
const { fetchHtml } = require("../utils/scraper");

const BASE = "https://hopamviet.vn";

const slugMap = {
    "1": "nhac-vang",
    "2": "nhac-tru-tinh",
    "3": "nhac-tre",
    "4": "nhac-que-huong",
    "5": "nhac-ngoai-loi-viet",
    "6": "nhac-do",
    "7": "nhac-dan-ca",
    "8": "nhac-quoc-te",
    "9": "nhac-hoc-tro",
    "10": "nhac-thieu-nhi",
    "11": "nhac-thanh-ca",
    "12": "nhac-phat-giao",
    "13": "nhac-che-vui"
};

async function getLatest(page = 1) {
    const url = `${BASE}/chord/latest.html${page > 1 ? `?page=${page}` : ""}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // Title
    const titleMatch = html.match(/<title>(.+?) \|/);
    const pageTitle = titleMatch ? titleMatch[1].trim() : "Bài hát mới cập nhật";

    // Total count
    const countMatch = html.match(/(\d[\d,.]*)\s*bài hát/);
    const totalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;

    const songs = [];
    $("a.song-card").each((i, el) => {
        const href = $(el).attr("href");
        const title = $(el).find(".font-bold").first().text().replace(/\s+/g, " ").trim();
        const artist = $(el).find(".truncate").eq(1).text().replace(/\s+/g, " ").trim();

        // Views
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
