const express = require("express");
const router = express.Router();
const getLatest = require("../crawler/latest");

let cacheData = null;
let isUpdating = false;

async function updateLatest() {
    if (isUpdating) return;
    try {
        isUpdating = true;
        console.log("Updating latest cache...");
        const data = await getLatest(1);
        if (data.songs && data.songs.length > 0) {
            cacheData = data;
            console.log(`Latest updated: ${data.songs.length} songs`);
        } else {
            console.log("Latest parse returned empty");
        }
    } catch (err) {
        console.log("Latest update error:", err.message);
    }
    isUpdating = false;
}

updateLatest();
setInterval(updateLatest, 1000 * 60 * 30); // update every 30 min

router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        if (page === 1 && cacheData) {
            return res.json(cacheData);
        }
        const data = await getLatest(page);
        if (page === 1) cacheData = data;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
