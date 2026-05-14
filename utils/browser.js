const puppeteer = require("puppeteer-extra");

const StealthPlugin =
    require("puppeteer-extra-plugin-stealth");

const fs = require("fs");

const path = require("path");

puppeteer.use(StealthPlugin());

let browser = null;

async function findChrome() {

    const candidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
    ].filter(Boolean);

    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return undefined;
}

async function getBrowser() {

    if (browser) {
        return browser;
    }

    const executablePath = await findChrome();

    const launchOpts = {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage"
        ]
    };

    if (executablePath) {
        launchOpts.executablePath = executablePath;
        console.log(`Using Chrome at: ${executablePath}`);
    } else {
        console.log("No system Chrome found, using bundled Chromium");
    }

    browser = await puppeteer.launch(launchOpts);

    console.log("Browser launched");

    return browser;
}

module.exports = getBrowser;