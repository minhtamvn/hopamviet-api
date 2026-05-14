const cheerio = require("cheerio");
const { fetchHtml } = require("../utils/scraper");

const BASE = "https://hopamviet.vn";

const slugMap = {
    "1": "bobero",
    "2": "slow",
    "3": "slow-rock",
    "4": "slow-surf",
    "5": "blues",
    "6": "ballad",
    "7": "chachacha",
    "8": "disco",
    "9": "rhumba",
    "10": "tango",
    "11": "boston",
    "12": "fox",
    "13": "rock",
    "14": "valse",
    "15": "bossa-nova",
    "16": "pop",
    "17": "habanera",
    "18": "twist",
    "19": "march",
    "20": "pasodoble",
    "21": "slow-ballad",
    "22": "rap",
    "23": "samba",
    "24": "pop-ballad",
    "25": "rock-ballad"
};

async function getRhythm(rhythmId, rhythmSlug = "", page = 1) {
    const slug = rhythmSlug || slugMap[String(rhythmId)] || "";
    const url = `${BASE}/chord/rhythm/${rhythmId}/${slug}.html${page > 1 ? `?page=${page}` : ""}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // Rhythm name from title tag: "Tuyển tập các bài hát điệu {Name} kèm..."
    const titleMatch = html.match(/Tuyển tập các bài hát điệu (.+?) kèm/);
    const rhythmName = titleMatch ? titleMatch[1].trim() : "";

    // Total count
    const countMatch = html.match(/(\d[\d,.]*)\s*bài hát/);
    const totalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;

    // Parse song cards - only main content (col-span-8), exclude sidebar trending
    const songs = [];
    $('div[class*="col-span-8"] a.song-card').each((i, el) => {
        const href = $(el).attr("href");
        const title = $(el).find(".font-bold").first().text().replace(/\s+/g, " ").trim();
        const artist = $(el).find(".truncate").eq(1).text().replace(/\s+/g, " ").trim();

        const allText = $(el).text().split("\n").map(v => v.trim()).filter(Boolean);
        let preview = "";
        for (const line of allText) {
            if (line.startsWith("♪") || line.match(/^\d\./)) {
                preview = line.replace(/^♪\s*/, "").replace(/\s+/g, " ").trim();
                break;
            }
        }

        let views = "";
        for (let j = allText.length - 1; j >= 0; j--) {
            if (/^[\d,.]+K?$/.test(allText[j])) {
                views = allText[j];
                break;
            }
        }

        if (!title || !href) return;

        // Extract YouTube ID from thumbnail image
        let youtubeId = "";
        const imgSrc = $(el).find("img").attr("src");
        if (imgSrc) {
            const ytMatch = imgSrc.match(/img\.youtube\.com\/vi\/([^/]+)/);
            if (ytMatch) youtubeId = ytMatch[1];
        }

        songs.push({
            title,
            artist,
            preview,
            views,
            youtubeId,
            url: href.startsWith("http") ? href : `${BASE}${href}`
        });
    });

    return {
        rhythmName,
        totalCount,
        page,
        perPage: songs.length,
        songs
    };
}

module.exports = getRhythm;
