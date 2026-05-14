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
    let categoryId = "";
    let categorySlug = "";
    // Extract all JSON-LD script blocks and parse them
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let ldMatch;
    while ((ldMatch = jsonLdRegex.exec(html)) !== null) {
        try {
            const json = JSON.parse(ldMatch[1]);
            if (json["@type"] === "BreadcrumbList" && json.itemListElement) {
                const pos2 = json.itemListElement.find(item => item.position === 2);
                if (pos2) {
                    category = pos2.name || "";
                    const urlMatch = (pos2.item || "").match(/\/category\/(\d+)\/([^\.]+)/);
                    if (urlMatch) {
                        categoryId = urlMatch[1];
                        categorySlug = urlMatch[2];
                    }
                    break;
                }
            }
        } catch(e) {}
    }

    // Điệu (rhythm) - name from label, ID + slug from dropdown links
    let rhythm = $("#currentRhythmLabel").text().trim();
    if (!rhythm || rhythm === "Chọn điệu") {
        rhythm = "";
    }
    let rhythmId = "";
    let rhythmSlug = "";
    if (rhythm) {
        // Parse rhythm dropdown links to find matching ID for current rhythm name
        const rhythmDropdownRegex = /\/chord\/rhythm\/(\d+)\/([^"']+)/g;
        const rhythmMap = {};
        let rm;
        while ((rm = rhythmDropdownRegex.exec(html)) !== null) {
            const parts = rm[0].match(/\/rhythm\/(\d+)\/([^"']+)/);
            if (parts) {
                rhythmMap[parts[2]] = { id: parts[1], slug: parts[2] };
            }
        }
        // Find the rhythm link that matches the current rhythm name
        // The selected rhythm typically appears as a link with the rhythm name as text
        // Map slug to name: bobero->Boléro, ballad->Ballad, etc.
        for (const slug of Object.keys(rhythmMap)) {
            const displayName = slug
                .split("-")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
            if (displayName.toLowerCase() === rhythm.toLowerCase() ||
                slug.toLowerCase() === rhythm.toLowerCase().replace(/\s+/g, "-")) {
                rhythmId = rhythmMap[slug].id;
                rhythmSlug = rhythmMap[slug].slug;
                break;
            }
        }
        // Fallback: try exact match with known mapping
        if (!rhythmId) {
            const knownRhythms = {
                "Boléro": { id: "1", slug: "bobero" },
                "Slow": { id: "2", slug: "slow" },
                "Slow Rock": { id: "3", slug: "slow-rock" },
                "Slow Surf": { id: "4", slug: "slow-surf" },
                "Blues": { id: "5", slug: "blues" },
                "Ballad": { id: "6", slug: "ballad" },
                "Chachacha": { id: "7", slug: "chachacha" },
                "Disco": { id: "8", slug: "disco" },
                "Rhumba": { id: "9", slug: "rhumba" },
                "Tango": { id: "10", slug: "tango" },
                "Boston": { id: "11", slug: "boston" },
                "Fox": { id: "12", slug: "fox" },
                "Rock": { id: "13", slug: "rock" },
                "Valse": { id: "14", slug: "valse" },
                "Bossa Nova": { id: "15", slug: "bossa-nova" },
                "Pop": { id: "16", slug: "pop" },
                "Habanera": { id: "17", slug: "habanera" },
                "Twist": { id: "18", slug: "twist" },
                "March": { id: "19", slug: "march" },
                "Pasodoble": { id: "20", slug: "pasodoble" },
                "Slow Ballad": { id: "21", slug: "slow-ballad" },
                "Rap": { id: "22", slug: "rap" },
                "Samba": { id: "23", slug: "samba" },
                "Pop Ballad": { id: "24", slug: "pop-ballad" },
                "Rock Ballad": { id: "25", slug: "rock-ballad" }
            };
            const known = knownRhythms[rhythm];
            if (known) {
                rhythmId = known.id;
                rhythmSlug = known.slug;
            }
        }
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

    return {
        title, tone, composers,
        category, categoryId, categorySlug,
        rhythm, rhythmId, rhythmSlug,
        lyrics: uniqueLyrics, singerTones
    };
}

module.exports = getSong;
