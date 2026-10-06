const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your website files are in the ROOT directory
app.use(express.static(__dirname));

// Health check
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

// Main website
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Socket connection
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`ER:LC Operations running on port ${PORT}`);
});
