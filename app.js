const express = require("express");

const cors = require("cors");

const app = express();

// =========================
// ROUTES
// =========================

const searchRoute = require("./routes/search");
const songRoute = require("./routes/song");
const trendingRoute = require("./routes/trending");
const categoryRoute = require("./routes/category");
const rhythmRoute = require("./routes/rhythm");
const latestRoute = require("./routes/latest");

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
app.use("/api/category", categoryRoute);
app.use("/api/rhythm", rhythmRoute);
app.use("/api/latest", latestRoute);

// =========================
// START
// =========================

const PORT = process.env.PORT || 11123;

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
