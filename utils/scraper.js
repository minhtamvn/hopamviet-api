let gotScraping = null;

async function getGotScraping() {
    if (!gotScraping) {
        const mod = await import("got-scraping");
        gotScraping = mod.gotScraping;
    }
    return gotScraping;
}

async function fetchHtml(url, timeout = 15000) {
    const gs = await getGotScraping();
    const { body } = await gs({
        url,
        timeout: { request: timeout },
        headers: {
            'Referer': 'https://hopamviet.vn/',
        }
    });
    return body;
}

module.exports = { fetchHtml };
