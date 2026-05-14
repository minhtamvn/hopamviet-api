const express = require("express");

const router = express.Router();

const cheerio = require("cheerio");

const getBrowser =
    require("../utils/browser");

const createPage =
    require("../utils/createPage");

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

        console.log(
            "Updating trending cache..."
        );

        const browser =
            await getBrowser();

        const page =
            await createPage(browser);

        // =========================
        // BLOCK HEAVY RESOURCES
        // =========================

        await page.setRequestInterception(
            true
        );

        page.on(
            "request",
            req => {

                const type =
                    req.resourceType();

                if (

                    type === "image" ||
                    type === "font" ||
                    type === "media"

                ) {

                    req.abort();

                } else {

                    req.continue();

                }

            }
        );

        // =========================
        // LOAD PAGE
        // =========================

        await page.goto(

            "https://hopamviet.vn/chord/hot",

            {

                waitUntil:
                    "domcontentloaded",

                timeout: 60000

            }

        );

        // =========================
        // WAIT SONGS
        // =========================

        await page.waitForSelector(
            "a.song-card",
            {
                timeout: 15000
            }
        );

        const html =
            await page.content();

        await page.close();

        // =========================
        // PARSE
        // =========================

        const $ =
            cheerio.load(html);

        const songs =
            [];

        $("a.song-card")
            .slice(0, 20)
            .each((i, el) => {

                const title =
                    $(el)
                        .find(".font-bold")
                        .first()
                        .text()
                        .replace(/\s+/g, " ")
                        .trim();

                const artist =
                    $(el)
                        .find(".truncate")
                        .eq(1)
                        .text()
                        .replace(/\s+/g, " ")
                        .trim();

                const preview =
                    $(el)
                        .find(".italic")
                        .text()
                        .replace(/^♪/, "")
                        .replace(/\s+/g, " ")
                        .trim();

                const views =
                    $(el)
                        .find(".font-semibold")
                        .last()
                        .text()
                        .trim();

                const href =
                    $(el).attr("href");

                if (
                    !title ||
                    !href
                ) return;

                songs.push({

                    rank:
                        i + 1,

                    title,

                    artist,

                    preview,

                    views,

                    url:
                        href.startsWith("http")
                            ? href
                            : `https://hopamviet.vn${href}`

                });

            });

        // =========================
        // SAVE ONLY IF SUCCESS
        // =========================

        if (songs.length) {

            cacheData =
                songs;

            console.log(
                `Trending updated: ${songs.length}`
            );

        } else {

            console.log(
                "Trending parse failed"
            );

        }

    } catch (err) {

        console.log(err);

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

setInterval(

    updateTrending,

    1000 * 60 * 60

);

// =========================
// API
// =========================

router.get("/", async (req, res) => {

    res.json(cacheData);

});

module.exports =
    router;