(() => {
  const H = location.hostname;
  const PLAT = /instagram\.com$/.test(H) ? "instagram" : /youtube\.com$/.test(H) ? "youtube" : /snapchat\.com$/.test(H) ? "snapchat" : "other";
  const RX = /\/(?:reels?|shorts)\/([\w-]{5,})/;   // /reels/ID, /reel/ID, /shorts/ID
  const MEMES = [["Kyu ni ho rhi padhai?", "Phone rakh. Das minute kaam pehle."], ["Reel khatam, kaam shuru.", "The next reel can wait."],
    ["Beta, scroll baad mein.", "Your work won’t finish itself."], ["Wapas aaja.", "You were in the middle of something."]];
  const DEF = { reelLimit: 10, minutes: { instagram: 45, youtube: 45, snapchat: 20, other: 20 }, task: "" };
  const today = () => new Date().toISOString().slice(0, 10);
  let lastId = null, busy = false;

  async function update(fn) {
    const r = await chrome.storage.local.get(["settings", "stats"]);
    const s = { ...DEF, ...r.settings, minutes: { ...DEF.minutes, ...((r.settings || {}).minutes) } };
    const st = r.stats && r.stats.day === today() ? r.stats : { day: today(), reels: {}, secs: {}, since: 0, limit: null, warnedAt: 0 };
    const out = fn(st, s);
    await chrome.storage.local.set({ stats: st });
    return out;
  }

  function nudge(title, task, onDismiss) {
    if (busy) return; busy = true;
    const m = MEMES[Math.floor(Math.random() * MEMES.length)];
    const host = document.createElement("div"); host.id = "wapas-host";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>.b{position:fixed;inset:0;z-index:2147483647;background:#ffd23f;color:#14173a;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center;font-family:system-ui,sans-serif}
      .t{font-weight:600;opacity:.7}.meme{font-weight:800;font-size:clamp(2.4rem,9vw,6rem);line-height:1;letter-spacing:-.03em}
      p{margin:0;font-size:1.2rem}button{background:#14173a;color:#fff;border:0;border-radius:999px;padding:14px 28px;font-size:1.1rem;font-weight:600;cursor:pointer}</style>
      <div class="b" role="alertdialog"><div class="t"></div><div class="meme"></div><p class="sub"></p><p class="task"></p><button>Okay, back to work</button></div>`;
    root.querySelector(".t").textContent = title;
    root.querySelector(".meme").textContent = m[0];
    root.querySelector(".sub").textContent = m[1];
    root.querySelector(".task").textContent = task ? "You were supposed to be doing: " + task : "";
    document.documentElement.appendChild(host);
    const pause = () => document.querySelectorAll("video").forEach(v => v.pause());
    pause(); const iv = setInterval(pause, 500);
    root.querySelector("button").onclick = () => { clearInterval(iv); host.remove(); busy = false; if (onDismiss) onDismiss(); };
  }

  async function check() {                       // count a reel each time the reel ID in the URL changes
    const m = location.pathname.match(RX), id = m && m[1];
    if (!id || id === lastId) return;
    lastId = id;
    const hit = await update((st, s) => {
      st.reels[PLAT] = (st.reels[PLAT] || 0) + 1; st.since++;
      return st.since >= (st.limit ?? s.reelLimit) ? { title: st.since + " reels in a row", task: s.task } : null;
    });
    if (hit) nudge(hit.title, hit.task, () => update((st, s) => { st.since = 0; st.limit = Math.max(4, (st.limit ?? s.reelLimit) - 2); }));
  }
  setInterval(check, 700);

  setInterval(async () => {                      // count minutes while this tab is visible and focused
    if (document.visibilityState !== "visible" || !document.hasFocus()) return;
    const hit = await update((st, s) => {
      st.secs[PLAT] = (st.secs[PLAT] || 0) + 5;
      const lim = s.minutes[PLAT];
      if (lim > 0 && st.secs[PLAT] / 60 >= lim && Date.now() - st.warnedAt > 600000) { st.warnedAt = Date.now(); return { title: "Your daily " + PLAT + " time is up", task: s.task }; }
      return null;
    });
    if (hit) nudge(hit.title, hit.task);
  }, 5000);
})();
