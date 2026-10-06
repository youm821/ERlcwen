const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "database.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

const defaults = {
  calls: [
    { id: 1001, priority: "HIGH", type: "Traffic Stop", location: "Postal 204", status: "ACTIVE", units: ["1-ADAM-12"] }
  ],
  units: [
    { id: "1-ADAM-12", department: "POLICE", status: "AVAILABLE", location: "Postal 204", x: 50, y: 45 },
    { id: "2-ADAM-14", department: "POLICE", status: "BUSY", location: "Postal 312", x: 58, y: 51 },
    { id: "E-21", department: "FIRE", status: "AVAILABLE", location: "Postal 118", x: 39, y: 36 },
    { id: "MED-4", department: "EMS", status: "EN ROUTE", location: "Postal 441", x: 66, y: 62 }
  ],
  players: [
    { name: "Officer_Riley", department: "POLICE", x: 50, y: 45, vehicle: "Police Charger" },
    { name: "Deputy_Mason", department: "POLICE", x: 58, y: 51, vehicle: "Police SUV" },
    { name: "FireCaptain", department: "FIRE", x: 39, y: 36, vehicle: "Fire Engine" },
    { name: "Medic_04", department: "EMS", x: 66, y: 62, vehicle: "Ambulance" }
  ],
  reports: [],
  bolos: [],
  applications: [],
  roster: [
    { name: "Officer_Riley", rank: "Sergeant", department: "POLICE", status: "ON DUTY" },
    { name: "Deputy_Mason", rank: "Officer", department: "POLICE", status: "ON DUTY" },
    { name: "FireCaptain", rank: "Captain", department: "FIRE", status: "ON DUTY" },
    { name: "Medic_04", rank: "Paramedic", department: "EMS", status: "ON DUTY" }
  ],
  incidents: [],
  settings: { communityName: "Liberty County RP" }
};

function loadDB() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
      return structuredClone(defaults);
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return structuredClone(defaults);
  }
}
let db = loadDB();

function saveDB() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => res.status(200).send("OK"));

app.get("/api/state", (req, res) => {
  res.json(db);
});

app.post("/api/calls", (req, res) => {
  const { type = "911 Call", priority = "MEDIUM", location = "Unknown", notes = "" } = req.body;
  const call = {
    id: Date.now(),
    type, priority, location, notes,
    status: "ACTIVE",
    units: [],
    createdAt: new Date().toISOString()
  };
  db.calls.unshift(call);
  saveDB();
  io.emit("state", db);
  res.status(201).json(call);
});

app.patch("/api/calls/:id", (req, res) => {
  const call = db.calls.find(c => String(c.id) === String(req.params.id));
  if (!call) return res.status(404).json({ error: "Call not found" });
  Object.assign(call, req.body);
  saveDB();
  io.emit("state", db);
  res.json(call);
});

app.post("/api/reports", (req, res) => {
  const report = {
    id: `R-${Date.now()}`,
    author: req.body.author || "Unknown",
    type: req.body.type || "Incident Report",
    subject: req.body.subject || "",
    details: req.body.details || "",
    createdAt: new Date().toISOString()
  };
  db.reports.unshift(report);
  saveDB();
  io.emit("state", db);
  res.status(201).json(report);
});

app.post("/api/bolos", (req, res) => {
  const bolo = {
    id: `B-${Date.now()}`,
    subject: req.body.subject || "",
    description: req.body.description || "",
    active: true,
    createdAt: new Date().toISOString()
  };
  db.bolos.unshift(bolo);
  saveDB();
  io.emit("state", db);
  res.status(201).json(bolo);
});

app.post("/api/applications", (req, res) => {
  const application = {
    id: `A-${Date.now()}`,
    username: req.body.username || "",
    department: req.body.department || "POLICE",
    answers: req.body.answers || "",
    status: "PENDING",
    createdAt: new Date().toISOString()
  };
  db.applications.unshift(application);
  saveDB();
  io.emit("state", db);
  res.status(201).json(application);
});

app.patch("/api/applications/:id", (req, res) => {
  const item = db.applications.find(a => String(a.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: "Application not found" });
  if (req.body.status) item.status = req.body.status;
  saveDB();
  io.emit("state", db);
  res.json(item);
});

app.post("/api/incidents", (req, res) => {
  const incident = {
    id: `I-${Date.now()}`,
    type: req.body.type || "Incident",
    location: req.body.location || "Unknown",
    notes: req.body.notes || "",
    status: "ACTIVE",
    createdAt: new Date().toISOString()
  };
  db.incidents.unshift(incident);
  saveDB();
  io.emit("state", db);
  res.status(201).json(incident);
});

app.patch("/api/units/:id", (req, res) => {
  const unit = db.units.find(u => u.id === req.params.id);
  if (!unit) return res.status(404).json({ error: "Unit not found" });
  Object.assign(unit, req.body);
  saveDB();
  io.emit("state", db);
  res.json(unit);
});

app.post("/api/admin/reset", (req, res) => {
  const password = req.headers["x-admin-password"];
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Admin password not configured or incorrect." });
  }
  db = structuredClone(defaults);
  saveDB();
  io.emit("state", db);
  res.json({ ok: true });
});

io.on("connection", socket => {
  socket.emit("state", db);
});

setInterval(() => {
  // Demo movement. Replace this section with your ER:LC API integration.
  db.players = db.players.map(p => ({
    ...p,
    x: Math.max(8, Math.min(92, p.x + (Math.random() - 0.5) * 1.5)),
    y: Math.max(8, Math.min(92, p.y + (Math.random() - 0.5) * 1.5))
  }));
  io.emit("state", db);
}, 5000);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => {
  console.log(`ER:LC Operations running on port ${PORT}`);
});