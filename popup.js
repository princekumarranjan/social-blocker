const P = ["instagram", "youtube", "snapchat", "other"], $ = id => document.getElementById(id);
const DEF = { reelLimit: 10, minutes: { instagram: 45, youtube: 45, snapchat: 20, other: 20 }, task: "" };
chrome.storage.local.get(["settings", "stats"]).then(r => {
  const s = { ...DEF, ...r.settings, minutes: { ...DEF.minutes, ...((r.settings || {}).minutes) } };
  const st = r.stats && r.stats.day === new Date().toISOString().slice(0, 10) ? r.stats : { reels: {}, secs: {} };
  $("reelLimit").value = s.reelLimit; $("task").value = s.task; P.forEach(p => $(p).value = s.minutes[p]);
  $("today").textContent = "";
  P.forEach(p => { const d = document.createElement("div"); d.className = "row";
    d.textContent = p[0].toUpperCase() + p.slice(1) + ": " + (st.reels[p] || 0) + " reels, " + Math.round((st.secs[p] || 0) / 60) + " min"; $("today").appendChild(d); });
});
$("save").onclick = async () => {
  const n = (id, a, b, d) => { const v = parseInt($(id).value, 10); return Number.isInteger(v) ? Math.min(b, Math.max(a, v)) : d; };
  const minutes = {}; P.forEach(p => minutes[p] = n(p, 0, 600, DEF.minutes[p]));
  await chrome.storage.local.set({ settings: { reelLimit: n("reelLimit", 3, 50, 10), minutes, task: $("task").value.trim().slice(0, 80) } });
  $("ok").textContent = "Saved";
};
