# CardCompanion

A pricing guide for trading card sellers on eBay.

You describe a card through a structured form — name, number, rarity, set, grade or raw condition — and CardCompanion assembles those fields into an optimized eBay search string. It then queries eBay for **current listings** to show what the market is asking right now, and scrapes eBay for **sold listings** to show what the card has actually been selling for.

Both sides are broken out by auction and Buy It Now, because the two behave differently: BIN asking prices skew high, auction closes track real demand.

**Live:** https://cardcompanion.onrender.com

---

## Screenshots

> **To Be Updated**

---

## How it works

**1. The form builds the query.** Rather than making you guess at eBay search syntax, each field contributes a term. `PSA 10` + `Gengar` + `074` + `CHR` + `Pokemon` + `Japanese` + `Dark Phantasma` becomes a single query string, which is shown back to you above the results so you can see exactly what was searched.

**2. Two data sources run in parallel.** Active listings come from the eBay Browse API and land almost immediately. Sold listings require a headless-browser scrape and take longer, so they load independently — you see asking prices while the sold comps are still coming in.

**3. Results are filtered client-side.** eBay's search is fuzzy and returns near-matches. Every result is re-checked against your card name, number, and set name, and against your grade or condition, before it counts toward the statistics.

---

> ### ⚠️ Sold listings are currently disabled
>
> eBay is serving a bot-check interstitial (`ebay.com/splashui/challenge`)
> instead of completed-listings results, so the scrape cannot run. The two sold
> panels and the price-history charts are switched off; only current asking
> prices are shown.
>
> Re-enable by setting `VITE_SOLD_ENABLED=true` in the client environment — see
> `client/src/config.js`. No code change required.

---

## Features

Four panels, each showing average, low, high, and listing count:

| Panel | Source | Answers |
|---|---|---|
| **Active Auction** | Browse API | What are open auctions currently bid to? |
| **Active BIN** | Browse API | What are sellers asking? |
| **Sold Auction** | Scraper | What have auctions actually closed at? |
| **Sold BIN** | Scraper | What have buyers actually paid outright? |

The sold panels additionally show a **price-over-time chart**, a **"last 5 sales" average**, and the percentage drift of those recent sales against the full-window average — the number that tells you whether the card is currently trending up or down.

Every panel opens a table of the underlying listings, each linking back to the eBay item.

---

## Search Fields

| Field | Required | Description |
|---|---|---|
| Grade | — | `PSA 10`, `BGS 9.5`, `CGC 10`, etc. |
| Condition | — | Raw card condition: `NM`, `LP`, `MP`, `HP`, `DMG` |
| Card Name | ✓ | e.g. Charizard, Gengar |
| Card Number | — | e.g. `074`, `4/102` |
| Card Rarity | — | `CHR`, `SAR`, Alt Art, Holo, etc. |
| Year | — | e.g. `1999` |
| Card Game | ✓ | Pokemon, MTG, etc. |
| Language | — | Japanese, English, etc. |
| Set Name | — | e.g. Dark Phantasma, Base Set |
| Additional Detail | — | Any extra search terms |

**Grade and Condition are mutually exclusive.** A card is either professionally graded or it's raw — filling both is rejected before the search runs.

- With a **grade** set, results must carry that grading label in the title. PSA, BGS (also written *Beckett*), CGC, SGC, HGA, ARS, ACE, and TAG are recognized, and separators are flexible — `PSA 10`, `PSA10`, and `PSA-10` all match. The number is matched exactly, so a search for `PSA 9` will not return `PSA 9.5` or `PSA 95`. A grade naming no recognized company is left unfiltered rather than dropping every result.
- With a **condition** set, graded cards are excluded entirely, then eBay's granular condition field (`Ungraded - Moderately played (Very good)`) is matched where present, falling back to a title scan for seller-written abbreviations like `NM` or `LP`.

---

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS v4, Chart.js
- **Backend:** Node.js, Express 5
- **Active listings:** eBay Browse API
- **Sold listings:** Puppeteer (headless Chrome scraper)
- **Hosting:** Render

The client has no component-library dependency — form controls, modal, table, and panels are built directly against Tailwind tokens defined in `client/src/index.css`.

---

## API

The server exposes two routes, both taking a `?q=` search string:

| Route | Returns |
|---|---|
| `GET /api/search` | `{ bin, auction }` — active listings from the Browse API |
| `GET /api/scrape` | `{ binSold, aucSold }` — sold listings from the scraper |

---

## Local Development

**Requirements:** Node.js 18+

```bash
# Install root dependencies
npm install

# Install client and server dependencies
npm install --prefix client
npm install --prefix server
```

Create a `.env` file in `/server`:

```
EBAY_PROD_CLIENT_ID=your_client_id
EBAY_PROD_CLIENT_SECRET=your_client_secret
```

```bash
# Run both client and server concurrently
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

---

## Deploying to Railway

The repo is an isolated monorepo: `client/` and `server/` share nothing, so they
deploy as **two Railway services pointed at the same GitHub repo**, each with its
own Root Directory.

Deploy the **server first** — the client needs its URL baked in at build time.

### 1. Server service

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Start Command | `npm start` |

Variables:

```
EBAY_PROD_CLIENT_ID=your_client_id
EBAY_PROD_CLIENT_SECRET=your_client_secret
```

`PORT` is injected by Railway and already read in `server.js`. Generate a public
domain under **Settings → Networking** and copy it.

> **Skip the Chrome download while sold listings are off.** `server/package.json`
> has a `postinstall` that pulls ~150 MB of Chromium for Puppeteer. With the sold
> section disabled nothing launches it, so set `PUPPETEER_SKIP_DOWNLOAD=true` to
> cut build time and image size. Remove that variable when re-enabling sold data.

### 2. Client service

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Build Command | `npm run build` |

Variables:

```
RAILPACK_SPA_OUTPUT_DIR=dist
VITE_API_URL=https://<your-server-service>.up.railway.app
```

`RAILPACK_SPA_OUTPUT_DIR` tells Railway to serve the built SPA as a static site.

> **`VITE_API_URL` is inlined at build time, not read at runtime.** Vite bakes it
> into the bundle, so it must be set *before* the build, and changing it requires
> a redeploy — not just a restart. This is the most common cause of a deployed
> client still calling `localhost:3001`.

### 3. Point the server back at the client

Generate a domain for the client service, then add it to the **server**:

```
CLIENT_ORIGIN=https://<your-client-service>.up.railway.app
```

Comma-separate multiple origins. Without this the browser blocks every API call
with a CORS error, while the server logs look completely healthy.

### 4. Verify

- `https://<server>/api/search?q=charizard` returns JSON
- The client loads and a search populates the Active Auction / Active BIN panels
- No CORS errors in the browser console

---

## Notes

- Sold listings are scraped from eBay's completed-listings pages. eBay migrated from a `.s-item` layout to `.s-card` / `.su-card-container`; if the layout shifts again, the selectors in `server/utils/utils.js` need updating.
- The eBay Browse API does not expose sold listing data at the standard access tier, and its `soldItems` filter is rejected as invalid. The Finding API, which did provide this, is not available on current credentials. Scraping is the workaround.
- Scrapes are slower than API calls by design — the scraper waits for eBay's client-side rendering to settle before reading the page.
