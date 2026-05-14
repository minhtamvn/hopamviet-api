async function createPage(browser) {

    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on("request", (req) => {

        const type = req.resourceType();

        const url = req.url();

        // block tài nguyên nặng
        if (

            type === "image" ||
            type === "media" ||
            type === "font" ||
            type === "stylesheet"

        ) {

            return req.abort();

        }

        // block ads / analytics
        if (

            url.includes("doubleclick") ||
            url.includes("googlesyndication") ||
            url.includes("googleads") ||
            url.includes("analytics") ||
            url.includes("facebook")

        ) {

            return req.abort();

        }

        req.continue();

    });

    return page;
}

module.exports = createPage;