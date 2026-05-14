const express = require("express");
const router = express.Router();
const cheerio = require("cheerio");
const { fetchHtml } = require("../utils/scraper");

const BASE = "https://hopamviet.vn";

let cacheData = [];
let isUpdating = false;

async function updateTrending() {
    if (isUpdating) return;

    try {
        isUpdating = true;
        console.log("Updating trending cache...");

        const html = await fetchHtml(`${BASE}/chord/hot`, 30000);
        const $ = cheerio.load(html);
        const songs = [];

        $("a.song-card").slice(0, 20).each((i, el) => {
            const title = $(el).find(".font-bold").first().text().replace(/\s+/g, " ").trim();
            const artist = $(el).find(".truncate").eq(1).text().replace(/\s+/g, " ").trim();
            const preview = $(el).find(".italic").text().replace(/^♪/, "").replace(/\s+/g, " ").trim();
            const views = $(el).find(".font-semibold").last().text().trim();
            const href = $(el).attr("href");
            if (!title || !href) return;

            songs.push({
                rank: i + 1,
                title, artist, preview, views,
                url: href.startsWith("http") ? href : `${BASE}${href}`
            });
        });

        if (songs.length) {
            cacheData = songs;
            console.log(`Trending updated: ${songs.length}`);
        } else {
            console.log("Trending parse failed");
        }
    } catch (err) {
        console.log("Trending error:", err.message);
    }

    isUpdating = false;
}

updateTrending();
setInterval(updateTrending, 1000 * 60 * 60);

router.get("/", (req, res) => {
    res.json(cacheData);
});

module.exports = router;
