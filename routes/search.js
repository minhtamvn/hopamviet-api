const express = require("express");

const router = express.Router();

const searchSong = require("../crawler/search");

router.get("/", async (req, res) => {

    try {

        const q = req.query.q;

        if (!q) {

            return res.status(400).json({
                error: "Missing query"
            });

        }

        const results = await searchSong(q);

        res.json(results);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;