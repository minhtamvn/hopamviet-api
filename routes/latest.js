const express = require("express");
const router = express.Router();
const getLatest = require("../crawler/latest");

router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const data = await getLatest(page);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
