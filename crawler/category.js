const cheerio = require("cheerio");
const { fetchHtml } = require("../utils/scraper");

const BASE = "https://hopamviet.vn";

async function getCategory(categoryId, categorySlug = "", page = 1) {
    // Slug mapping for known categories (fallback if slug not provided)
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
    const slug = categorySlug || slugMap[String(categoryId)] || "";
    const url = `${BASE}/chord/category/${categoryId}/${slug}.html${page > 1 ? `?page=${page}` : ""}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // Category name from title tag
    const titleMatch = html.match(/<title>Tuyển tập hợp âm guitar các bài hát (.+?) \|/);
    const categoryName = titleMatch ? titleMatch[1].trim() : "";

    // Total count from sidebar
    const countMatch = html.match(/(\d[\d,.]*)\s*bài hát/);
    const totalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;

    // Parse song cards
    const songs = [];
    $("a.song-card").each((i, el) => {
        const href = $(el).attr("href");
        const title = $(el).find(".font-bold").first().text().replace(/\s+/g, " ").trim();
        const artist = $(el).find(".truncate").eq(1).text().replace(/\s+/g, " ").trim();

        // Preview: text starting with ♪ or "1."
        const allText = $(el).text().split("\n").map(v => v.trim()).filter(Boolean);
        let preview = "";
        for (const line of allText) {
            if (line.startsWith("♪") || line.match(/^\d\./)) {
                preview = line.replace(/^♪\s*/, "").replace(/\s+/g, " ").trim();
                break;
            }
        }

        // Views: last item that's a number (may have K suffix)
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
            preview,
            views,
            url: href.startsWith("http") ? href : `${BASE}${href}`
        });
    });

    return {
        categoryName,
        totalCount,
        page,
        perPage: songs.length,
        songs
    };
}

module.exports = getCategory;
