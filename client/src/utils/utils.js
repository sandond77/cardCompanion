import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Condition mapping ────────────────────────────────────────────────────────

// eBay TCG condition strings (as returned in the "Ungraded - [detail]" format)
// "Very good" maps to MP in eBay's TCG scale, not LP
const CONDITION_MAP = {
	NM:  ['near mint', 'near mint or better'],
	LP:  ['lightly played'],
	MP:  ['moderately played', 'very good'],
	HP:  ['heavily played', 'acceptable'],
	DMG: ['damaged', 'damaged/broken', 'for parts', 'for parts or not working']
};

// Major graders excluded by name alone (unambiguous abbreviations).
// Smaller/regional graders (ars, ace, tag) still require a number to avoid false positives.
const GRADING_REGEX = /\b(psa|bgs|cgc|sgc|hga)\b|\b(ars|ace|tag)\s*\d/i;

// ── Graded card algorithm ────────────────────────────────────────────────────

function filterGraded(listings, grade) {
	const normalized = grade.toLowerCase().replace(/\s/g, '');
	if (normalized.startsWith('psa')) {
		const num = normalized.replace('psa', '');
		const re = new RegExp(`psa\\s*${num}\\b`, 'i');
		return listings.filter((r) => re.test(r.title));
	}
	return listings;
}

// ── Raw card algorithm ───────────────────────────────────────────────────────

function filterRaw(listings, condition) {
	return listings.filter((r) => {
		// Exclude if title contains grading company + number
		if (GRADING_REGEX.test(r.title)) return false;
		// Exclude if eBay's condition field explicitly says "Graded"
		if ((r.condition || '').toLowerCase() === 'graded') return false;

		if (!condition) return true;

		return matchesRawCondition(r, condition);
	});
}

function matchesRawCondition(result, selectedCondition) {
	const terms = CONDITION_MAP[selectedCondition] || [];
	const conditionField = (result.condition || '').toLowerCase();
	const title = (result.title || '').toLowerCase();

	// eBay provides granular condition as "Ungraded - Moderately played (Very good)"
	// When that detail is present, use it directly for precise matching
	if (conditionField.includes(' - ')) {
		return terms.some((t) => conditionField.includes(t));
	}

	// Title scan: seller put NM/LP/[NM] etc. in the title
	const abbrevRegex = new RegExp(`\\b${selectedCondition}\\b`, 'i');
	if (abbrevRegex.test(title) || terms.some((t) => title.includes(t))) {
		return true;
	}

	// Can't determine condition from either field or title — pass through
	// (relaxed: show the listing, let the user assess from the title)
	return true;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function parseSearchData(parsedFormData, formData, setAucListings, setBinListings, setHasResults) {
	const queryParams = new URLSearchParams({ q: parsedFormData }).toString();
	const res = await axios.get(`${API_BASE_URL}/api/search?${queryParams}`);
	const binResults = res.data.bin ?? [];
	const aucResults = res.data.auction ?? [];

	setHasResults((prev) => ({
		...prev,
		bin: binResults.length > 0,
		auc: aucResults.length > 0
	}));

	const maybeParse = async (arr, type, setListings) => {
		if (arr.length === 0) return undefined;
		return parseResults(arr, [], formData, type, setListings);
	};

	const binStats = await maybeParse(binResults, 'bin', setBinListings);
	const aucStats = await maybeParse(aucResults, 'auc', setAucListings);
	return { bin: binStats, auc: aucStats };
}

export async function parseScrapeData(parsedFormData, formData, setSoldAucListings, setSoldBinListings, setHasResults) {
	const queryParams = new URLSearchParams({ q: parsedFormData }).toString();
	const res = await axios.get(`${API_BASE_URL}/api/scrape?${queryParams}`);
	const soldBinResults = res.data.binSold ?? [];
	const soldAucResults = res.data.aucSold ?? [];

	setHasResults((prev) => ({
		...prev,
		soldBin: soldBinResults.length > 0,
		soldAuc: soldAucResults.length > 0
	}));

	const maybeParse = async (arr, type, setListings) => {
		if (arr.length === 0) return undefined;
		return parseResults(arr, [], formData, type, setListings);
	};

	const binSoldStats = await maybeParse(soldBinResults, 'soldBin', setSoldBinListings);
	const aucSoldStats = await maybeParse(soldAucResults, 'soldAuc', setSoldAucListings);
	return { binSold: binSoldStats, aucSold: aucSoldStats };
}

async function parseResults(arr1, arr2, formData, _id, stateListing) {
	const { grade, condition, cardName, cardNumber, setName } = formData;

	const normalizedCardName   = cardName?.toLowerCase().replace(/\s/g, '') || '';
	const normalizedCardNumber = cardNumber?.toLowerCase() || '';
	const normalizedSetName    = setName?.toLowerCase().replace(/\s/g, '') || '';

	// ── Step 1: Grade / condition pre-filter ──────────────────────────────
	let filtered;
	if (grade) {
		filtered = filterGraded(arr1, grade);
	} else {
		// Raw algorithm handles both "condition selected" and "no condition" cases
		filtered = filterRaw(arr1, condition);
	}

	// ── Step 2: Title match on card attributes ────────────────────────────
	filtered.forEach((result) => {
		const title = result.title.toLowerCase().replace(/\s/g, '');
		if (
			title.includes(normalizedCardName) &&
			title.includes(normalizedCardNumber) &&
			title.includes(normalizedSetName)
		) {
			arr2.push(result);
		}
	});

	// ── Step 3: Deduplicate ───────────────────────────────────────────────
	const seen = new Set();
	const dedupedArr2 = arr2.filter((result) => {
		const id = result.itemId || result.itemWebUrl || result.link;
		if (!id || seen.has(id)) return false;
		seen.add(id);
		return true;
	});

	// ── Step 4: Build listings + price stats ──────────────────────────────
	const priceArray = [];
	const listingsArray = [];

	dedupedArr2.forEach((result) => {
		let { value, currency } = result.price || result.currentBidPrice || {};
		if (!value || currency !== 'USD') return;
		value = value.replace(/[^0-9.]/g, '');
		const num = parseFloat(value);
		if (Number.isNaN(num)) return;

		priceArray.push(num);
		listingsArray.push({
			id: result.itemId || '',
			title: result.title || '',
			url: result.itemWebUrl || result.link || '',
			seller: result.seller?.username || '',
			price: parseFloat(num.toFixed(2)),
			date: result.date || ''
		});
	});

	listingsArray.sort((a, b) =>
		a.date && b.date ? new Date(b.date) - new Date(a.date) : 0
	);

	stateListing(listingsArray);

	const avg =
		priceArray.length > 0
			? priceArray.reduce((a, b) => a + b, 0) / priceArray.length
			: 0;

	return {
		Average: avg.toFixed(2),
		Lowest:  priceArray.length > 0 ? Math.min(...priceArray).toFixed(2) : '0.00',
		Highest: priceArray.length > 0 ? Math.max(...priceArray).toFixed(2) : '0.00',
		'Data Points': priceArray.length
	};
}
