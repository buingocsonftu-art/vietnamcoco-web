# VIETNAMCOCO — Website (Astro)

Standalone **Astro** port of the 14-page VIETNAMCOCO site (converted from the Claude Design `.dc` package — no Claude Design runtime). Static output, ready for **Cloudflare Pages**. Forms are wired to a **Lark** group via a Cloudflare Pages Function.

## Quick start

```bash
npm install
npm run dev        # local dev at http://localhost:4321
npm run build      # static build -> dist/
npm run preview    # preview the built site
```

> The project was assembled offline, so `npm install` has not run here. Run it once locally (or let Cloudflare CI run it) to build.

## Deploy to Cloudflare Pages

**Git (recommended):** push this folder to a repo → Cloudflare → Pages → connect repo:
- Framework preset: **Astro** · Build command: `npm run build` · Output dir: `dist`
- Set `NODE_VERSION=20` in env if needed.

**Direct upload:** `npm run build` then `npx wrangler pages deploy dist --project-name vietnamcoco`.

Point `vietnamcoco.vn` at the Pages project.

## Forms → Lark (backend)

Contact, Desiccated request, and Insights newsletter forms POST to `functions/api/lead.js`, which sends each lead into a **Lark group** via a custom-bot incoming webhook.

**Setup:**
1. Lark group → **Settings → Bots → Add Bot → Custom Bot (Incoming Webhook)**. Copy the webhook URL. (Optional: turn on **Signature verification** and copy the secret.)
2. Cloudflare Pages → project → **Settings → Environment variables → Production** (and Preview), add:
   - `LARK_WEBHOOK_URL` — the webhook URL (**required**)
   - `LARK_WEBHOOK_SECRET` — only if signature verification is enabled
   - `LEAD_TO_EMAIL` — `welcome@vietnamcoco.vn` (optional; shown in the card)
3. Redeploy, then submit a test form → the lead card appears in your Lark group.

**Notes:**
- Endpoint `POST /api/lead` (accepts JSON or form-encoded), returns `{ "ok": true }`.
- Spam honeypot field `_hp_website` silently drops bots; basic email validation included.
- Local Functions test: create `.dev.vars` with the env vars, then `npm run build && npx wrangler pages dev dist`.
- Want leads emailed to the welcome@ inbox **as well**? A transactional provider (Resend/Brevo) can be added to the same Function — say the word.

## Project structure

```
functions/api/lead.js    # Cloudflare Pages Function: form -> Lark webhook
src/
  layouts/Base.astro     # <head>, fonts, global CSS, injects i18n + loads site.js
  pages/                 # one route per page (index, about, products/*, ...)
  bodies/*.html          # converted page markup (imported raw, injected via set:html)
  i18n/*.json            # EN + VI dictionary per page  ({ key: { en, vi } })
  scripts/site.js        # framework-free behaviors (nav, i18n, reveal, modal, filter, figures, forms)
  styles/global.css      # base reset + responsive hardening
public/assets/coco/      # real images (jpg)
public/_headers          # cache + security headers
```

## Routes
`/` · `/about` · `/products` · `/products/{kernel,shell,husk,water}` · `/products/desiccated-coconut` · `/trade-finance` · `/fixed-price-contracts` · `/sustainability` · `/insights` · `/insights/post` · `/contact`

## Editing
- **Translations (EN/VI):** edit `src/i18n/<page>.json`. Nav toggle swaps `data-t` / `data-t-ph`; default EN; choice saved in `localStorage` (`vnc_lang`).
- **Images:** drop real photos into `public/assets/coco/` (keep filenames). Missing files render as labelled placeholders.
- **Layout/styles:** per-page markup + scoped `<style>` in `src/bodies/`; shared in `src/styles/global.css`.
- **Behaviors:** all interactivity in `src/scripts/site.js`.

## Notes
- Responsive verified at phone (390px) and tablet (768px) before conversion.
- Capability figures (~200,000 t, 10,000 ha, ~$50M, certifications) are placeholders marked *pending verification* — confirm before launch.
