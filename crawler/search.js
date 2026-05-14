const cheerio = require("cheerio");

const getBrowser =
    require("../utils/browser");

const createPage =
    require("../utils/createPage");

async function searchSong(keyword) {

    const browser = await getBrowser();

    const page =
        await createPage(browser);

    await page.goto(
        `https://hopamviet.vn/chord/search?song=${encodeURIComponent(keyword)}`,
        {
            waitUntil: "domcontentloaded",
            timeout: 0
        }
    );

    const html = await page.content();

    // DEBUG
    require("fs").writeFileSync(
        "search-debug.html",
        html
    );

    await page.close();

    const $ = cheerio.load(html);

    const results = [];

    $("a[href*='/chord/song/']").each((i, el) => {

        const href = $(el).attr("href");

        if (!href) return;

        const fullUrl =
            href.startsWith("http")
                ? href
                : "https://hopamviet.vn" + href;

        let text = $(el)
            .text()
            .replace(/\s+/g, " ")
            .trim();

        if (!text) return;

        if (text.includes("♪")) {

            text =
                text.split("♪")[0]
                .trim();

        }

        text = text
            .replace(/\d+(\.\d+)?K/g, "")
            .replace(/\s+/g, " ")
            .trim();

        let title = text;

        let artist = "";

        const lines = $(el)
            .text()
            .split("\n")
            .map(v => v.trim())
            .filter(Boolean);

        if (lines.length >= 2) {

            title = lines[0];

            artist = lines[1];

        }

        results.push({

            title,

            artist,

            url: fullUrl

        });

    });

    // remove duplicates

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