import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function queryEbay(params) {
	try {
		const [ebaySearch, ebayScrape] = await Promise.all([
			axios.get(`${API_BASE_URL}/api/search?${params}`),
			axios.get(`${API_BASE_URL}/api/scrape?${params}`)
		]);
		return { ebaySearch, ebayScrape };
	} catch (error) {
		console.error('Error querying eBay API:', error);
		throw error;
	}
}

export async function parseApiData(
	parsedFormData,
	formData,
	setAucListings,
	setBinListings,
	setSoldAucListings,
	setSoldBinListings,
	setHasResults
) {
	const queryParams = new URLSearchParams({ q: parsedFormData }).toString();

	const unfilteredResults = await queryEbay(queryParams);
	const filteredBinResults = unfilteredResults?.ebaySearch?.data?.bin ?? [];
	const filteredAucResults = unfilteredResults?.ebaySearch?.data?.auction ?? [];
	const filteredSoldBinResults = unfilteredResults?.ebayScrape?.data?.binSold ?? [];
	const filteredSoldAucResults = unfilteredResults?.ebayScrape?.data?.aucSold ?? [];

	setHasResults({
		bin: filteredBinResults.length > 0,
		auc: filteredAucResults.length > 0,
		soldBin: filteredSoldBinResults.length > 0,
		soldAuc: filteredSoldAucResults.length > 0
	});

	const allEmpty =
		filteredBinResults.length === 0 &&
		filteredAucResults.length === 0 &&
		filteredSoldBinResults.length === 0 &&
		filteredSoldAucResults.length === 0;

	if (allEmpty) return;

	const maybeParse = async (arr, type, setListings) => {
		if (arr.length === 0) return undefined;
		const out = [];
		return await parseResults(arr, out, formData, type, setListings);
	};

	const binStats = await maybeParse(filteredBinResults, 'bin', setBinListings);
	const aucStats = await maybeParse(filteredAucResults, 'auc', setAucListings);
	const binSoldStats = await maybeParse(filteredSoldBinResults, 'soldBin', setSoldBinListings);
	const aucSoldStats = await maybeParse(filteredSoldAucResults, 'soldAuc', setSoldAucListings);

	return {
		bin: binStats,
		auc: aucStats,
		binSold: binSoldStats,
		aucSold: aucSoldStats
	};
}

async function parseResults(arr1, arr2, formData, _id, stateListing) {
	const { grade, cardName, cardNumber, setName } = formData;

	const normalizedGrade = grade?.toLowerCase().replace(/\s/g, '') || '';
	const normalizedCardName = cardName?.toLowerCase().replace(/\s/g, '') || '';
	const normalizedCardNumber = cardNumber?.toLowerCase() || '';
	const normalizedSetName = setName?.toLowerCase().replace(/\s/g, '') || '';

	// PSA-specific regex (PSA7, PSA 7, etc.)
	let psaFiltered = arr1;
	if (normalizedGrade.startsWith('psa')) {
		const psaNum = normalizedGrade.replace('psa', '');
		const psaRegex = new RegExp(`psa\\s*${psaNum}\\b`, 'i');
		psaFiltered = arr1.filter((r) => psaRegex.test(r.title));
	}

	psaFiltered.forEach((result) => {
		const title = result.title.toLowerCase().replace(/\s/g, '');
		if (
			title.includes(normalizedCardName) &&
			title.includes(normalizedCardNumber) &&
			title.includes(normalizedSetName)
		) {
			arr2.push(result);
		}
	});

	const priceArray = [];
	const listingsArray = [];

	arr2.forEach((result) => {
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

	// Sort most recent first (primarily for sold listings)
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
		Lowest: priceArray.length > 0 ? Math.min(...priceArray).toFixed(2) : '0.00',
		Highest: priceArray.length > 0 ? Math.max(...priceArray).toFixed(2) : '0.00',
		'Data Points': priceArray.length
	};
}
