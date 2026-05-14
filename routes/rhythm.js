const express = require("express");

const router = express.Router();

const getRhythm = require("../crawler/rhythm");

router.get("/", async (req, res) => {

    try {

        const id = req.query.id;
        const page = parseInt(req.query.page) || 1;

        if (!id) {
            return res.status(400).json({
                error: "Missing rhythm id"
            });
        }

        const data = await getRhythm(id, req.query.slug, page);

        res.json(data);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;
