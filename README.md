# Wapas website and browser extension

This project contains:
- `index.html`: static landing page and early-access signup form
- `about.html`, `privacy.html`, `terms.html`, `contact.html`: supporting website pages
- `manifest.json`, `content.js`, `popup.html`, `popup.js`: Chrome/Edge browser extension
- `schema.sql`: Supabase signup table and row-level security setup

## Deploy the website to Vercel
1. Import this folder (`social-blocker-main`) as a project in Vercel, or deploy it with the Vercel CLI.
2. No build command is required for this static HTML project. Set the output directory to `.` if Vercel asks.
3. Confirm the deployed homepage and all four supporting pages load correctly.
4. Test the signup form using a test entry and confirm the row appears in the Supabase dashboard.

## Before requesting AdSense review
- Review every page on desktop and mobile.
- Do not place ads on signup, success, demo-only, navigation-only, or other screens that have no meaningful publisher content.
- If Auto ads are enabled, use AdSense controls to exclude pages or ad formats where ads would appear on functional screens.
- The supplied source contains an AdSense account meta tag but no explicit AdSense ad-unit script. Auto ads may be configured from the AdSense account separately.
- Publish a real, monitored contact method on `contact.html`; the supplied source did not include a verified email address.
- Verify the Privacy Policy against your actual Supabase region, retention practices, analytics, cookies, and any other services you use.
- The privacy page flags that the current signup form accepts ages 8–100. Review child privacy requirements and consider removing unnecessary age collection or restricting signup until appropriate safeguards are in place.
- Publish genuinely useful, original material and ensure it accurately reflects the live product. Adding pages alone does not guarantee AdSense approval.

## Supabase
The landing page uses the public Supabase client key in `index.html`. A public/anon key is expected to be visible in browser code; never put a Supabase `service_role` key in the frontend. Run `schema.sql` in Supabase SQL Editor if the table is not already created. Confirm Row Level Security and policies in the dashboard.

## Load the browser extension
1. Open `chrome://extensions` (or the equivalent page in Edge/Brave).
2. Enable Developer mode.
3. Choose **Load unpacked** and select this folder.
4. Open the Wapas extension popup and save your limits.

The extension tracks supported website activity in a desktop browser. It does not track activity inside native mobile apps. Check `manifest.json` permissions and supported host matches before publishing the extension.

## Important
AdSense approval is decided by Google. These changes address content and site-structure gaps visible in the supplied source, but cannot guarantee approval. Replace the contact-page notice with a real contact channel and verify all policy statements against the live implementation before publishing.
