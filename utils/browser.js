const puppeteer = require("puppeteer-extra");

const StealthPlugin =
    require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

let browser = null;

async function getBrowser() {

    if (browser) {
        return browser;
    }

    browser = await puppeteer.launch({

        headless: true,

        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]

    });

    console.log("Browser launched");

    return browser;
}

module.exports = getBrowser;