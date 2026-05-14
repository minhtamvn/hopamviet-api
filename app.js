const express = require("express");

const cors = require("cors");

const path = require("path");

const app = express();

// =========================
// ROUTES
// =========================

const searchRoute =
    require("./routes/search");

const songRoute =
    require("./routes/song");

const trendingRoute =
    require("./routes/trending");

// =========================
// MIDDLEWARE
// =========================

app.use(cors());

// =========================
// API
// =========================

app.use("/api/search", searchRoute);

app.use("/api/song", songRoute);

app.use("/api/trending", trendingRoute);

// =========================
// STATIC FRONTEND
// =========================

const clientPath =
    path.join(__dirname, "../client");

app.use(express.static(clientPath));

// =========================
// PAGES
// =========================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            clientPath,
            "index.html"
        )
    );

});

app.get("/song.html", (req, res) => {

    res.sendFile(
        path.join(
            clientPath,
            "song.html"
        )
    );

});

// =========================
// START
// =========================

app.listen(11123, () => {

    console.log(
        "Server running at port 11123"
    );

});