const cheerio = require("cheerio");

const getBrowser =
    require("../utils/browser");

const createPage =
    require("../utils/createPage");

async function getSong(url) {

    const browser = await getBrowser();

    const page =
        await createPage(browser);

    await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 0
    });

    const html = await page.content();

    require("fs").writeFileSync(
        "song-debug.html",
        html
    );

    await page.close();

    const $ = cheerio.load(html);

    $("script").remove();

    $("style").remove();

    $("noscript").remove();

    // ====================================
    // TITLE
    // ====================================

    const title = $("h1")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

    // ====================================
    // CURRENT TONE
    // ====================================

    let tone = $("#song-tone")
        .text()
        .replace("[", "")
        .replace("]", "")
        .trim();

    // ====================================
    // LYRIC
    // ====================================

    let lyricText = "";

    const possibleSelectors = [

        "#lyricBox",

        "#song-content-wrapper",

        ".lyric-block",

        ".song-content"

    ];

    for (const selector of possibleSelectors) {

        const el = $(selector);

        if (
            el.length &&
            el.text().includes("[")
        ) {

            lyricText = el.text();

            break;

        }

    }

    lyricText = lyricText

        .replace(/\r/g, "")

        .replace(/\(adsbygoogle[\s\S]*?\);?/g, "")

        .replace(/b\s+\[[^\]]+\]\s+#.*?A\+/g, "")

        .replace(/Sao chép lời/gi, "")

        .replace(/Nhân đôi lời hát/gi, "")

        .replace(/Xuất PDF \/ In tờ nhạc/gi, "")

        .replace(/Nghe bài hát[\s\S]*/g, "")

        .replace(/\t/g, " ")

        .replace(/[ ]{2,}/g, " ")

        .trim();

    const lyrics = lyricText

        .split("\n")

        .map(line => line.trim())

        .filter(line => {

            if (!line) return false;

            if (!line.includes("[")) {
                return false;
            }

            if (
                line.includes("function") ||
                line.includes("var ") ||
                line.includes("songSources")
            ) {
                return false;
            }

            return true;

        });

    const uniqueLyrics =
        [...new Set(lyrics)];

    // ====================================
    // VIDEO SOURCES
    // ====================================

    const videoSources = [];

    const regex =
        /songSources\[(\d+)\]\s*=\s*\{[\s\S]*?"music_id":"(.*?)"/g;

    let match;

    while (
        (match = regex.exec(html)) !== null
    ) {

        videoSources.push({

            index: parseInt(match[1]),

            youtubeId: match[2],

            embedUrl:
                `https://www.youtube.com/embed/${match[2]}`,

            thumbnail:
                `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`

        });

    }

    // ====================================
    // SINGER TONES
    // ====================================

    const singerTones = [];

    $("#inline-singer-tones button").each((i, el) => {

        const spans = $(el).find("span");

        const singer =
            $(spans[0])
            .text()
            .replace(":", "")
            .trim();

        const tone =
            $(spans[1])
            .text()
            .trim();

        const video =
            videoSources[i] || null;

        singerTones.push({

            singer,

            tone,

            youtubeId:
                video?.youtubeId || "",

            embedUrl:
                video?.embedUrl || "",

            thumbnail:
                video?.thumbnail || ""

        });

    });

    return {

        title,

        tone,

        lyrics: uniqueLyrics,

        singerTones

    };

}

module.exports = getSong;