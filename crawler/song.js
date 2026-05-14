const cheerio = require("cheerio");
const { fetchHtml } = require("../utils/scraper");

async function getSong(url) {

    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    $("script").remove();
    $("style").remove();
    $("noscript").remove();

    const title = $("h1").first().text().replace(/\s+/g, " ").trim();

    let tone = $("#song-tone").text().replace("[", "").replace("]", "").trim();

    // Sáng tác (composer) - extract from all /chord/composer/ links
    const composers = [];
    const composerSet = new Set();
    const composerRegex = /\/chord\/composer\/\d+\/[^"]*"[^>]*>([^<]+)<\/a>/g;
    let match;
    while ((match = composerRegex.exec(html)) !== null) {
        const name = match[1].trim();
        if (name && !composerSet.has(name)) {
            composerSet.add(name);
            composers.push(name);
        }
    }

    // Thể loại (category) - from JSON-LD BreadcrumbList position 2
    let category = "";
    const breadcrumbRegex = /"@type":\s*"BreadcrumbList"[\s\S]*?"itemListElement":\s*\[([\s\S]*?)\]/g;
    while ((match = breadcrumbRegex.exec(html)) !== null) {
        const items = match[1];
        const pos2Match = items.match(/"position":\s*2[\s\S]*?"name":\s*"([^"]+)"/);
        if (pos2Match) {
            category = pos2Match[1];
            break;
        }
    }

    // Điệu (rhythm)
    let rhythm = $("#currentRhythmLabel").text().trim();
    if (!rhythm || rhythm === "Chọn điệu") {
        rhythm = "";
    }

    let lyricText = "";
    for (const selector of ["#lyricBox", "#song-content-wrapper", ".lyric-block", ".song-content"]) {
        const el = $(selector);
        if (el.length && el.text().includes("[")) {
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
            if (!line.includes("[")) return false;
            if (line.includes("function") || line.includes("var ") || line.includes("songSources")) return false;
            return true;
        });

    const uniqueLyrics = [...new Set(lyrics)];

    const videoSources = [];
    const videoRegex = /songSources\[(\d+)\]\s*=\s*\{[\s\S]*?"music_id":"(.*?)"/g;
    while ((match = videoRegex.exec(html)) !== null) {
        videoSources.push({
            index: parseInt(match[1]),
            youtubeId: match[2],
            embedUrl: `https://www.youtube.com/embed/${match[2]}`,
            thumbnail: `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`
        });
    }

    const singerTones = [];
    $("#inline-singer-tones button").each((i, el) => {
        const spans = $(el).find("span");
        const singer = $(spans[0]).text().replace(":", "").trim();
        const tone = $(spans[1]).text().trim();
        const video = videoSources[i] || null;
        singerTones.push({
            singer, tone,
            youtubeId: video?.youtubeId || "",
            embedUrl: video?.embedUrl || "",
            thumbnail: video?.thumbnail || ""
        });
    });

    return { title, tone, composers, category, rhythm, lyrics: uniqueLyrics, singerTones };
}

module.exports = getSong;
