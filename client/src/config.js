/**
 * Sold comps come from a Puppeteer scrape of eBay's completed listings, and
 * eBay is currently serving a bot-check interstitial instead of results
 * (see server/utils/utils.js → ScrapeBlockedError). The section is disabled by
 * default so a deploy ships only the parts that work.
 *
 * Re-enable by setting VITE_SOLD_ENABLED=true in the client environment —
 * locally in client/.env, or as an env var on Render. No code change needed.
 */
export const SOLD_ENABLED = import.meta.env?.VITE_SOLD_ENABLED === 'true';
