import axios from 'axios';

// Optional chaining so the module can also be imported outside a Vite bundle.
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

// ── Domain constants ─────────────────────────────────────────────────────────

// eBay TCG condition strings, as returned in the "Ungraded - [detail]" format.
// "Very good" maps to MP on eBay's TCG scale, not LP.
const CONDITION_MAP = {
	NM: ['near mint', 'near mint or better'],
	LP: ['lightly played'],
	MP: ['moderately played', 'very good'],
	HP: ['heavily played', 'acceptable'],
	DMG: ['damaged', 'damaged/broken', 'for parts', 'for parts or not working']
};

// Grading companies we can recognize in a listing title. `alias` covers the
// other names sellers write for the same grader.
//
// `strict: true` means the abbreviation is unambiguous enough to identify a
// graded card on its own. The rest are ordinary English words ("ace", "tag")
// and need a number beside them before we treat them as a grade.
const GRADERS = [
	{ key: 'PSA', alias: ['psa'], strict: true },
	{ key: 'BGS', alias: ['bgs', 'beckett'], strict: true },
	{ key: 'CGC', alias: ['cgc'], strict: true },
	{ key: 'SGC', alias: ['sgc'], strict: true },
	{ key: 'HGA', alias: ['hga'], strict: true },
	{ key: 'ARS', alias: ['ars'], strict: false },
	{ key: 'ACE', alias: ['ace'], strict: false },
	{ key: 'TAG', alias: ['tag'], strict: false }
];

const namesOf = (strict) =>
	GRADERS.filter((g) => g.strict === strict)
		.flatMap((g) => g.alias)
		.join('|');

// Used by the raw path to exclude anything that looks graded.
const GRADING_REGEX = new RegExp(
	`\\b(${namesOf(true)})\\b|\\b(${namesOf(false)})\\s*\\d`,
	'i'
);

// Fields that contribute to the eBay query string, in the order they appear.
// `condition` is deliberately absent — it filters results, it is not searched.
const QUERY_FIELDS = [
	'cardName',
	'cardNumber',
	'cardRarity',
	'year',
	'cardGame',
	'cardLanguage',
	'additionalDetail',
	'setName'
];

// The two data sources differ only by route and by the keys the server returns.
const SOURCES = {
	active: { path: '/api/search', buckets: { auc: 'auction', bin: 'bin' } },
	sold: { path: '/api/scrape', buckets: { aucSold: 'aucSold', binSold: 'binSold' } }
};

// ── Query building ───────────────────────────────────────────────────────────

/** Collapse the form into the single search string sent to eBay. */
export function buildQuery(formData) {
	const parts = formData.grade ? [formData.grade] : [];
	for (const field of QUERY_FIELDS) parts.push(formData[field]);
	return parts.filter(Boolean).join(' ');
}

// ── Matching ─────────────────────────────────────────────────────────────────

const squash = (s) => (s || '').toLowerCase().replace(/\s/g, '');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Split a typed grade ("PSA 10", "bgs9.5", "Beckett 9.5", "CGC") into the
 * grader it names and the number beside it. Returns null when the text names no
 * grader we know — the caller then declines to filter rather than guessing.
 */
function parseGrade(grade) {
	const match = (grade || '').trim().toLowerCase().match(/^([a-z]+)\s*([\d.]*)$/);
	if (!match) return null;

	const [, name, number] = match;
	const grader = GRADERS.find((g) => g.alias.includes(name));
	return grader ? { grader, number } : null;
}

/**
 * Graded path: keep only listings whose title carries the requested grade.
 *
 * Matching is deliberately tight on the number. A search for "PSA 9" must not
 * pull in "PSA 9.5" or "PSA 95", so the digits are followed by a lookahead
 * rejecting any further digit or decimal.
 */
function matchesGrade(result, grade) {
	const parsed = parseGrade(grade);
	// Unrecognized grader — let eBay's own relevance ranking decide instead of
	// filtering every result away.
	if (!parsed) return true;

	const { grader, number } = parsed;
	const names = grader.alias.join('|');

	const pattern = number
		? `\\b(?:${names})[\\s-]*${escapeRegex(number)}(?!\\d|\\.\\d)`
		: `\\b(?:${names})\\b`;

	return new RegExp(pattern, 'i').test(result.title);
}

/** Raw path: drop anything graded, then match the requested condition. */
function matchesRaw(result, condition) {
	if (GRADING_REGEX.test(result.title)) return false;
	if ((result.condition || '').toLowerCase() === 'graded') return false;
	if (!condition) return true;

	const terms = CONDITION_MAP[condition] || [];
	const conditionField = (result.condition || '').toLowerCase();

	// eBay gives granular condition as "Ungraded - Moderately played (Very good)".
	// When that detail is present it is authoritative.
	if (conditionField.includes(' - ')) {
		return terms.some((t) => conditionField.includes(t));
	}

	// Otherwise scan the title for a seller-written abbreviation or full term.
	const title = (result.title || '').toLowerCase();
	if (new RegExp(`\\b${condition}\\b`, 'i').test(title)) return true;
	if (terms.some((t) => title.includes(t))) return true;

	// Condition is undeterminable from either field — show it and let the user
	// judge from the title rather than silently dropping a real comp.
	return true;
}

/** Every listing takes exactly one of the two condition paths. */
function matchesConditionPath(result, grade, condition) {
	return grade ? matchesGrade(result, grade) : matchesRaw(result, condition);
}

/** eBay search is fuzzy; re-check the card's identifying attributes ourselves. */
function matchesCardIdentity(result, targets) {
	const title = squash(result.title);
	return targets.every((t) => title.includes(t));
}

// ── Normalization ────────────────────────────────────────────────────────────

/** Shape a raw eBay result into the listing the UI renders, or null if unusable. */
function toListing(result) {
	const { value, currency } = result.price || result.currentBidPrice || {};
	if (!value || currency !== 'USD') return null;

	// Scraped prices arrive as display text ("$73.41"); API prices as strings.
	const price = parseFloat(String(value).replace(/[^0-9.]/g, ''));
	if (!Number.isFinite(price)) return null;

	return {
		id: result.itemId || '',
		title: result.title || '',
		url: result.itemWebUrl || result.link || '',
		seller: result.seller?.username || '',
		price: Math.round(price * 100) / 100,
		date: result.date || ''
	};
}

/** Newest first; undated listings (active ones) sort after dated ones. */
function byNewestFirst(a, b) {
	if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
	return new Date(b.date) - new Date(a.date);
}

/**
 * Filter, deduplicate, and normalize raw eBay results in a single pass.
 * Pure — no network, no state.
 */
export function selectMatching(rawResults, formData) {
	const { grade, condition } = formData;
	const targets = [formData.cardName, formData.cardNumber, formData.setName]
		.map(squash)
		.filter(Boolean);

	const seen = new Set();
	const listings = [];

	for (const result of rawResults) {
		if (!result?.title) continue;
		if (!matchesConditionPath(result, grade, condition)) continue;
		if (!matchesCardIdentity(result, targets)) continue;

		const id = result.itemId || result.itemWebUrl || result.link;
		if (!id || seen.has(id)) continue;

		const listing = toListing(result);
		if (!listing) continue;

		seen.add(id);
		listings.push(listing);
	}

	return listings.sort(byNewestFirst);
}

// ── Statistics ───────────────────────────────────────────────────────────────

/** Price summary for a set of listings, or null when there is nothing to sum. */
export function summarize(listings) {
	if (listings.length === 0) return null;

	let total = 0;
	let low = Infinity;
	let high = -Infinity;

	for (const { price } of listings) {
		total += price;
		if (price < low) low = price;
		if (price > high) high = price;
	}

	return { average: total / listings.length, low, high, count: listings.length };
}

/**
 * Average of the n most recent dated sales. Listings arrive newest-first, so
 * this is the front of the list — the number a seller actually prices against.
 */
export function recentAverage(listings, n = 5) {
	const prices = [];

	for (const listing of listings) {
		if (prices.length === n) break;
		if (!listing.date || Number.isNaN(Date.parse(listing.date))) continue;
		if (Number.isFinite(listing.price)) prices.push(listing.price);
	}

	if (prices.length === 0) return null;
	const total = prices.reduce((sum, p) => sum + p, 0);
	return { average: total / prices.length, count: prices.length };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch one source ('active' | 'sold') and return each bucket already filtered,
 * deduplicated, sorted, and summarized:
 *   { auc: { listings, stats }, bin: { listings, stats } }
 */
export async function fetchListings(source, query, formData) {
	const { path, buckets } = SOURCES[source];
	const { data } = await axios.get(`${API_BASE_URL}${path}`, {
		params: { q: query }
	});

	return Object.fromEntries(
		Object.entries(buckets).map(([bucket, field]) => {
			const listings = selectMatching(data[field] ?? [], formData);
			return [bucket, { listings, stats: summarize(listings) }];
		})
	);
}
