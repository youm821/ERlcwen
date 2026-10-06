const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Files are in the same folder as server.js
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
    res.status(200).send("ER:LC Operations is online!");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`ER:LC Operations running on port ${PORT}`);
});
