const express = require("express");

const router = express.Router();

const axios = require("axios");

const cheerio = require("cheerio");

const BASE = "https://hopamviet.vn";

const agent = axios.create({
    timeout: 30000,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
});

// =========================
// CACHE
// =========================

let cacheData = [];

let isUpdating = false;

// =========================
// UPDATE CACHE
// =========================

async function updateTrending() {

    if (isUpdating) return;

    try {

        isUpdating = true;

        console.log("Updating trending cache...");

        const { data: html } = await agent.get(`${BASE}/chord/hot`);

        const $ = cheerio.load(html);

        const songs = [];

        $("a.song-card")
            .slice(0, 20)
            .each((i, el) => {

                const title = $(el)
                    .find(".font-bold")
                    .first()
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

                const artist = $(el)
                    .find(".truncate")
                    .eq(1)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

                const preview = $(el)
                    .find(".italic")
                    .text()
                    .replace(/^♪/, "")
                    .replace(/\s+/g, " ")
                    .trim();

                const views = $(el)
                    .find(".font-semibold")
                    .last()
                    .text()
                    .trim();

                const href = $(el).attr("href");

                if (!title || !href) return;

                songs.push({
                    rank: i + 1,
                    title,
                    artist,
                    preview,
                    views,
                    url: href.startsWith("http")
                        ? href
                        : `${BASE}${href}`
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

// =========================
// FIRST LOAD
// =========================

updateTrending();

// =========================
// AUTO UPDATE
// =========================

// 60 phút

setInterval(updateTrending, 1000 * 60 * 60);

// =========================
// API
// =========================

router.get("/", async (req, res) => {
    res.json(cacheData);
});

module.exports = router;
