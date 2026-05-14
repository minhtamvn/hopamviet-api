const express = require("express");

const router = express.Router();

const getSong =
    require("../crawler/song");

router.get("/", async (req, res) => {

    try {

        const url = req.query.url;

        if (!url) {

            return res.status(400).json({
                error: "Missing url"
            });

        }

        const data =
            await getSong(url);

        res.json(data);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;