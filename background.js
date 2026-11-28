const SUPABASE_URL = "https://cbfgrvagzlxekszhjkrg.supabase.co";
const SUPABASE_KEY = "sb_publishable_PzGfAciP0L_8ghOojEKpdg_Y_2TAvv1";
const WEBSITE_URL = "https://social-blocker.vercel.app/connect.html";
const WEBSITE_ORIGIN = "https://social-blocker.vercel.app";

async function redeemCode(code) {
  if (typeof code !== "string" || !/^[a-f0-9]{32}$/.test(code)) {
    throw new Error("That connection code is not valid.");
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/redeem_extension_pair_code`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ p_code: code })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.session_token) {
    throw new Error(result.message || result.msg || "The code expired or was already used. Create a new code on the Wapas website.");
  }
  await chrome.storage.local.set({ wapasAuth: {
    sessionToken: result.session_token,
    userId: result.user_id,
    connectedAt: Date.now()
  }});
  return { ok: true };
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (sender.url !== WEBSITE_ORIGIN + "/connect.html" && !sender.url?.startsWith(WEBSITE_ORIGIN + "/connect.html?")) {
    sendResponse({ ok: false, error: "Untrusted website." });
    return;
  }
  if (message?.type !== "WAPAS_PAIR") return;
  redeemCode(message.code).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "WAPAS_REDEEM") return;
  redeemCode(message.code).then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === "install") chrome.tabs.create({ url: WEBSITE_URL });
});
