const socket = io();
let state = {};
let mapFilter = "ALL";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

socket.on("state", data => { state = data; renderAll(); });
$("refreshBtn").onclick = () => fetchState();

async function fetchState() {
  const r = await fetch("/api/state");
  state = await r.json();
  renderAll();
}
fetchState();

document.querySelectorAll(".nav").forEach(btn => btn.onclick = () => {
  document.querySelectorAll(".nav").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
  $("page-" + btn.dataset.page).classList.add("active");
  $("pageTitle").textContent = btn.querySelector("span").textContent;
});

document.querySelectorAll(".filter").forEach(btn => btn.onclick = () => {
  document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  mapFilter = btn.dataset.filter;
  renderMap();
});

function renderAll() {
  $("statPlayers").textContent = state.players?.length || 0;
  $("statUnits").textContent = state.units?.length || 0;
  $("statCalls").textContent = (state.calls || []).filter(x => x.status === "ACTIVE").length;
  $("statIncidents").textContent = (state.incidents || []).filter(x => x.status === "ACTIVE").length;
  $("callBadge").textContent = $("statCalls").textContent;
  $("statRoster").textContent = state.roster?.length || 0;
  $("statApps").textContent = (state.applications || []).filter(x => x.status === "PENDING").length;
  $("statReports").textContent = state.reports?.length || 0;
  $("statBolos").textContent = state.bolos?.filter(x => x.active).length || 0;
  renderMap(); renderUnits(); renderCalls(); renderDispatch(); renderMDT(); renderCommunity(); renderCommand();
}

function renderMap() {
  const markers = $("markers");
  markers.innerHTML = "";
  const players = (state.players || []).filter(p => mapFilter === "ALL" || p.department === mapFilter);
  players.forEach(p => {
    const el = document.createElement("div");
    el.className = `marker ${p.department}`;
    el.style.left = p.x + "%"; el.style.top = p.y + "%";
    el.title = `${p.name} • ${p.department}`;
    el.innerHTML = `<span class="marker-label">${esc(p.name)}</span>`;
    markers.appendChild(el);
  });
}

function renderUnits() {
  $("unitList").innerHTML = (state.units || []).map(u => `
    <div class="row">
      <div><div class="row-title">${esc(u.id)}</div><div class="row-sub">${esc(u.department)} • ${esc(u.location)}</div></div>
      <span class="badge ${u.status === "AVAILABLE" ? "green" : u.status === "BUSY" ? "red" : "yellow"}">${esc(u.status)}</span>
    </div>`).join("") || empty("No units");
}

function renderCalls() {
  $("callList").innerHTML = (state.calls || []).map(c => `
    <div class="row">
      <div><div class="row-title">#${c.id} • ${esc(c.type)}</div><div class="row-sub">${esc(c.location)} ${c.notes ? "• " + esc(c.notes) : ""}</div></div>
      <div><span class="badge ${c.priority === "HIGH" ? "red" : "yellow"}">${esc(c.priority)}</span><br><button class="tiny" onclick="closeCall('${c.id}')">${c.status === "ACTIVE" ? "Close" : "Closed"}</button></div>
    </div>`).join("") || empty("No calls");
}

function renderDispatch() {
  $("dispatchList").innerHTML = (state.units || []).map(u => `
    <div class="row"><div><div class="row-title">${esc(u.id)}</div><div class="row-sub">${esc(u.department)} • ${esc(u.location)}</div></div>
    <select onchange="setUnit('${esc(u.id)}',this.value)" class="status-select">
      ${["AVAILABLE","BUSY","EN ROUTE","ON SCENE","OFF DUTY"].map(s => `<option ${u.status===s?"selected":""}>${s}</option>`).join("")}
    </select></div>`).join("");
}

function renderMDT() {
  const people = state.players || [];
  $("mdtResults").innerHTML = people.map(p => `
    <div class="row"><div><div class="row-title">${esc(p.name)}</div><div class="row-sub">${esc(p.department)} • ${esc(p.vehicle)} • Postal ${Math.round(p.x*5)}</div></div><span class="badge blue">PLAYER</span></div>`).join("") +
    (state.bolos || []).slice(0,5).map(b => `<div class="row"><div><div class="row-title">🚨 ${esc(b.subject)}</div><div class="row-sub">${esc(b.description)}</div></div><span class="badge red">BOLO</span></div>`).join("");
}

function renderCommunity() {
  $("rosterList").innerHTML = (state.roster || []).map(r => `<div class="row"><div><div class="row-title">${esc(r.name)}</div><div class="row-sub">${esc(r.rank)} • ${esc(r.department)}</div></div><span class="badge green">${esc(r.status)}</span></div>`).join("");
  $("applicationList").innerHTML = (state.applications || []).slice(0,20).map(a => `<div class="row"><div><div class="row-title">${esc(a.username)}</div><div class="row-sub">${esc(a.department)} • ${esc(a.status)}</div></div>${a.status==="PENDING"?`<button class="tiny" onclick="reviewApp('${a.id}','ACCEPTED')">Accept</button>`:""}</div>`).join("") || empty("No applications");
}

function renderCommand() {
  const count = d => (state.roster || []).filter(x => x.department === d).length;
  $("cmdPolice").textContent = count("POLICE"); $("cmdFire").textContent = count("FIRE"); $("cmdEms").textContent = count("EMS");
  $("cmdIncidents").textContent = (state.incidents || []).filter(x => x.status === "ACTIVE").length;
  const events = [
    ...(state.calls||[]).slice(0,5).map(x => `Call #${x.id} — ${x.type}`),
    ...(state.reports||[]).slice(0,5).map(x => `Report ${x.id} — ${x.type}`),
    ...(state.bolos||[]).slice(0,5).map(x => `BOLO ${x.id} — ${x.subject}`)
  ];
  $("activityList").innerHTML = events.slice(0,10).map(x => `<div class="row"><div class="row-title">${esc(x)}</div><span class="badge blue">RECENT</span></div>`).join("") || empty("No activity");
  $("departmentList").innerHTML = ["POLICE","FIRE","EMS","DOT"].map(d => `<div class="row"><div class="row-title">${d}</div><span class="badge blue">${count(d)} MEMBERS</span></div>`).join("");
}

function empty(t){return `<div class="row"><div class="row-sub">${t}</div></div>`}

async function api(url, options={}) {
  const r = await fetch(url,{headers:{"Content-Type":"application/json"},...options});
  if(!r.ok){const e=await r.json().catch(()=>({error:"Request failed"}));alert(e.error||"Request failed");return null}
  return r.json();
}
window.closeCall = async id => api(`/api/calls/${id}`,{method:"PATCH",body:JSON.stringify({status:"CLOSED"})});
window.setUnit = async (id,status) => api(`/api/units/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({status})});
window.reviewApp = async (id,status) => api(`/api/applications/${id}`,{method:"PATCH",body:JSON.stringify({status})});

function modal(title, body) {
  $("modalContent").innerHTML = `<h2>${title}</h2>${body}`;
  $("modal").classList.remove("hidden");
}
$("closeModal").onclick=()=> $("modal").classList.add("hidden");
$("modal").onclick=e=>{if(e.target.id==="modal")$("modal").classList.add("hidden")};

$("newCallBtn").onclick=()=>modal("Create 911 Call",`<form class="form" id="callForm">
<label>Call Type</label><input name="type" value="911 Call">
<label>Priority</label><select name="priority"><option>LOW</option><option selected>MEDIUM</option><option>HIGH</option></select>
<label>Location / Postal</label><input name="location" placeholder="Postal 204">
<label>Notes</label><textarea name="notes"></textarea><button>Create Call</button></form>`);
$("newIncidentBtn").onclick=()=>modal("Create Incident",`<form class="form" id="incidentForm">
<label>Type</label><input name="type" value="Incident">
<label>Location</label><input name="location" placeholder="Postal / street">
<label>Notes</label><textarea name="notes"></textarea><button>Create Incident</button></form>`);

$("reportBtn").onclick=()=>modal("Create Incident Report",`<form class="form" id="reportForm">
<label>Author</label><input name="author" value="Officer">
<label>Type</label><input name="type" value="Incident Report">
<label>Subject</label><input name="subject">
<label>Details</label><textarea name="details"></textarea><button>Submit Report</button></form>`);

$("boloBtn").onclick=()=>modal("Create BOLO",`<form class="form" id="boloForm">
<label>Subject</label><input name="subject" placeholder="Vehicle / person">
<label>Description</label><textarea name="description"></textarea><button>Publish BOLO</button></form>`);

$("vehicleBtn").onclick=()=>modal("Vehicle Lookup",`<form class="form" id="vehicleForm"><label>Plate</label><input name="plate" placeholder="ABC-123"><button>Lookup</button></form><div id="vehicleResult"></div>`);

document.addEventListener("submit",async e=>{
  if(!e.target.classList.contains("form"))return;
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target).entries());
  let endpoint="";
  if(e.target.id==="callForm")endpoint="/api/calls";
  if(e.target.id==="incidentForm")endpoint="/api/incidents";
  if(e.target.id==="reportForm")endpoint="/api/reports";
  if(e.target.id==="boloForm")endpoint="/api/bolos";
  if(endpoint){await api(endpoint,{method:"POST",body:JSON.stringify(data)});$("modal").classList.add("hidden");}
  if(e.target.id==="vehicleForm"){
    const q=data.plate.toLowerCase();
    const found=(state.players||[]).filter(p=>(p.vehicle||"").toLowerCase().includes(q)||(p.name||"").toLowerCase().includes(q));
    $("vehicleResult").innerHTML=found.length?found.map(p=>`<div class="row"><div><b>${esc(p.name)}</b><div class="row-sub">${esc(p.vehicle)} • ${esc(p.department)}</div></div></div>`).join(""):"<p>No matching vehicle/player in current live data.</p>";
  }
});

$("mdtSearchBtn").onclick=()=>{
  const q=$("mdtSearch").value.toLowerCase().trim();
  if(!q){renderMDT();return}
  const results=(state.players||[]).filter(p=>JSON.stringify(p).toLowerCase().includes(q));
  $("mdtResults").innerHTML=results.map(p=>`<div class="row"><div><div class="row-title">${esc(p.name)}</div><div class="row-sub">${esc(p.department)} • ${esc(p.vehicle)}</div></div><span class="badge blue">MATCH</span></div>`).join("")||empty("No matches");
};
