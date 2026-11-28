const SUPABASE_URL = "https://cbfgrvagzlxekszhjkrg.supabase.co";
const SUPABASE_KEY = "sb_publishable_PzGfAciP0L_8ghOojEKpdg_Y_2TAvv1";
const WEBSITE_CONNECT = "https://social-blocker.vercel.app/connect.html";
const P = ["instagram", "youtube", "snapchat", "other"], $ = id => document.getElementById(id);
const DEF = { reelLimit: 10, minutes: { instagram: 45, youtube: 45, snapchat: 20, other: 20 }, task: "" };

async function rpc(name, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY }, body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Could not verify your Wapas account.");
  return result;
}

async function validateSession() {
  const { wapasAuth } = await chrome.storage.local.get("wapasAuth");
  if (!wapasAuth?.sessionToken) return false;
  try {
    const result = await rpc("validate_extension_session", { p_token: wapasAuth.sessionToken });
    if (result.valid) return true;
  } catch (_) {}
  await chrome.storage.local.remove("wapasAuth");
  return false;
}

function showGate(message) {
  $("authGate").hidden = false; $("app").hidden = true;
  if (message) $("authMessage").textContent = message;
}

async function showApp() {
  $("authGate").hidden = true; $("app").hidden = false;
  const { wapasAuth } = await chrome.storage.local.get("wapasAuth");
  $("accountLabel").textContent = wapasAuth?.userId ? "Wapas account connected" : "Connected";
  const r = await chrome.storage.local.get(["settings", "stats"]);
  const s = { ...DEF, ...r.settings, minutes: { ...DEF.minutes, ...((r.settings || {}).minutes) } };
  const st = r.stats && r.stats.day === new Date().toISOString().slice(0, 10) ? r.stats : { reels: {}, secs: {} };
  $("reelLimit").value = s.reelLimit; $("task").value = s.task;
  P.forEach(p => $(p).value = s.minutes[p]);
  $("today").textContent = "";
  P.forEach(p => { const d = document.createElement("div"); d.className = "row";
    d.textContent = p[0].toUpperCase() + p.slice(1) + ": " + (st.reels[p] || 0) + " reels, " + Math.round((st.secs[p] || 0) / 60) + " min"; $("today").appendChild(d); });
}

$("openWebsite").onclick = () => chrome.tabs.create({ url: WEBSITE_CONNECT });
$("connectCode").onclick = async () => {
  const code = $("pairCode").value.trim().toLowerCase();
  $("authError").textContent = "Connecting…";
  chrome.runtime.sendMessage({ type: "WAPAS_REDEEM", code }, async response => {
    const lastError = chrome.runtime.lastError;
    if (lastError || !response?.ok) { $("authError").textContent = response?.error || "Could not connect. Create a fresh code on the Wapas website."; return; }
    $("authError").textContent = "Connected successfully.";
    await showApp();
  });
};
$("logout").onclick = async () => {
  const { wapasAuth } = await chrome.storage.local.get("wapasAuth");
  if (wapasAuth?.sessionToken) { try { await rpc("revoke_extension_session", { p_token: wapasAuth.sessionToken }); } catch (_) {} }
  await chrome.storage.local.remove("wapasAuth");
  showGate("You have been logged out. Log in on the Wapas website to reconnect.");
};

$("save").onclick = async () => {
  const n = (id, a, b, d) => { const v = parseInt($(id).value, 10); return Number.isInteger(v) ? Math.min(b, Math.max(a, v)) : d; };
  const minutes = {}; P.forEach(p => minutes[p] = n(p, 0, 600, DEF.minutes[p]));
  await chrome.storage.local.set({ settings: { reelLimit: n("reelLimit", 3, 50, 10), minutes, task: $("task").value.trim().slice(0, 80) } });
  $("ok").textContent = "Saved";
};

(async () => { if (await validateSession()) await showApp(); else showGate(); })();
