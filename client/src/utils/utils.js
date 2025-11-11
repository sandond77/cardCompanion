import axios from 'axios';
import Fuse from 'fuse.js';

export function fuzzyFilterListings(listings, formData) {
	// Normalize and combine the search terms
	const { cardName, setName, grade, cardNumber } = formData;
	const searchString = [cardName, setName, grade, cardNumber]
		.filter(Boolean)
		.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')) // normalize
		.join(' ');

	const cleanedListings = listings.map((l) => ({
		...l,
		title: l.title?.toLowerCase().replace(/\s+/g, ' ').trim()
	}));

	// Fuse options — tuned for titles
	const options = {
		includeScore: true,
		threshold: 0.32, // tighter tolerance for similar titles
		ignoreLocation: true, // match anywhere in string
		minMatchCharLength: 2,
		distance: 100, // allows some separation in tokens
		keys: [
			{
				name: 'title',
				weight: 1.0 // only match against title
			}
		]
	};

	const fuse = new Fuse(cleanedListings, options);
	const results = fuse.search(searchString);

	return results.map((r) => r.item);
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export async function queryEbay(params) {
	try {
		const ebaySearch = await axios.get(`${API_BASE_URL}/api/search?${params}`);

		return { ebaySearch };

		// const ebaySearch = await axios.get(`${API_BASE_URL}/api/search?${params}`);
		// const ebayScrape = await axios.get(`${API_BASE_URL}/api/scrape?${params}`);

		// return { ebaySearch, ebayScrape };
	} catch (error) {
		console.error('Error querying eBay API:', error);
		throw error;
	}
}

//helper function to detect empty object returns
export function isEmpty(obj) {
	for (const prop in obj) {
		if (Object.hasOwn(obj, prop)) {
			return false;
		}
	}
	return true;
}

//helper function to calculate average array value
export function calculateAverage(arr) {
	if (!Array.isArray(arr) || arr.length === 0) {
		return 0; // Handle empty or non-array inputs
	}

	const sum = arr.reduce(
		(accumulator, currentValue) => accumulator + currentValue,
		0
	);
	return sum / arr.length;
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
	const queryParams = new URLSearchParams({ q: parsedFormData }).toString(); //using a const declared value instead of state value due to delays in state update

	const unfilteredResults = await queryEbay(queryParams);
	const filteredBinResults = unfilteredResults?.ebaySearch?.data?.bin ?? [];
	const filteredAucResults = unfilteredResults?.ebaySearch?.data?.auction ?? [];
	const filteredSoldBinResults =
		unfilteredResults?.ebayScrape?.data?.binSold ?? [];
	const filteredSoldAucResults =
		unfilteredResults?.ebayScrape?.data?.aucSold ?? [];
	console.log('look here ----- ');
	console.log(unfilteredResults.ebaySearch);
	console.log(unfilteredResults.ebayScrape);

	//check for results
	setHasResults({
		bin: filteredBinResults.length > 0,
		auc: filteredAucResults.length > 0,
		soldBin: filteredSoldBinResults.length > 0,
		soldAuc: filteredSoldAucResults.length > 0
	});

	// If everything is empty, stop early
	let checkAllEmpty =
		filteredBinResults.length === 0 &&
		filteredAucResults.length === 0 &&
		filteredSoldBinResults.length === 0 &&
		filteredSoldAucResults.length === 0;

	if (checkAllEmpty) return;

	const maybeParse = async (arr, type, setListings) => {
		if (arr.length === 0) return undefined;
		const out = [];
		return await parseResults(
			arr,
			out,
			formData,
			type,
			setListings,
			setHasResults
		);
	};

	const binStats = await maybeParse(filteredBinResults, 'bin', setBinListings);
	const aucStats = await maybeParse(filteredAucResults, 'auc', setAucListings);
	const binSoldStats = await maybeParse(
		filteredSoldBinResults,
		'soldBin',
		setSoldBinListings
	);
	const aucSoldStats = await maybeParse(
		filteredSoldAucResults,
		'soldAuc',
		setSoldAucListings
	);

	console.log('done');

	return {
		bin: binStats,
		auc: aucStats,
		binSold: binSoldStats,
		aucSold: aucSoldStats
	};
}

async function parseResults(arr1, arr2, formData, id, stateListing) {
	const { grade, cardName, cardNumber, setName } = formData;

	// Normalize inputs
	const normalizedGrade = grade?.toLowerCase().replace(/\s/g, '') || '';
	const normalizedCardName = cardName?.toLowerCase().replace(/\s/g, '') || '';
	const normalizedCardNumber = cardNumber?.toLowerCase() || '';
	const normalizedSetName = setName?.toLowerCase().replace(/\s/g, '') || '';

	// --- PSA-specific regex (exact-ish) ---
	let psaFiltered = arr1;
	if (normalizedGrade.startsWith('psa')) {
		const psaNum = normalizedGrade.replace('psa', '');
		const psaRegex = new RegExp(`psa\\s*${psaNum}\\b`, 'i'); // PSA7, PSA 7
		psaFiltered = arr1.filter((r) => psaRegex.test(r.title));
	}

	// --- Loose matching for the rest of the fields ---
	psaFiltered.forEach((result) => {
		let title = result.title.toLowerCase().replace(/\s/g, '');
		if (
			title.includes(normalizedCardName) &&
			title.includes(normalizedCardNumber) &&
			title.includes(normalizedSetName)
		) {
			arr2.push(result);
		}
	});

	console.log(id, arr2);

	// --- Build arrays for price & listings ---
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

	// --- Sort sold listings ---
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
		Highest:
			priceArray.length > 0 ? Math.max(...priceArray).toFixed(2) : '0.00',
		'Data Points': priceArray.length
	};
}

//original code before fuse
// async function parseResults(arr1, arr2, formData, id, stateListing) {
// 	arr1.forEach((result) => {
// 		let title = result.title.toLowerCase();
// 		title = title.replace(/\s/g, ''); //Removes potential whitespace so query will return PSA10 or PSA 10
// 		const grade = formData.grade.toLowerCase();
// 		const cardName = formData.cardName.toLowerCase().replace(/\s/g, '');
// 		const cardNumber = formData.cardNumber.toLowerCase();
// 		const setName = formData.setName.toLowerCase().replace(/\s/g, '');
// 		const additionalDetail = formData.setName.toLowerCase().replace(/\s/g, '');
// 		// const setNameMatch = setName ? title.includes(setName) : true;
// 		// const additionalDetailMatch = additionalDetail ? title.includes(additionalDetail) : true;
// 		//&& (setNameMatch || additionalDetailMatch)

// 		// console.log(grade, cardName, cardNumber);
// 		// console.log(
// 		// 	title.includes(grade),
// 		// 	title.includes(cardName),
// 		// 	title.includes(cardNumber)
// 		// );

// 		if (
// 			title.includes(grade) &&
// 			title.includes(cardName) &&
// 			title.includes(cardNumber)
// 		) {
// 			arr2.push(result);
// 		}
// 	});

// 	console.log(id, arr2);

// 	let priceArray = [];
// 	let listingsArray = [];

// 	//add if check to look for empty array
// 	arr2.forEach((result) => {
// 		let { value, currency } = result.price || result.currentBidPrice;
// 		value = value.replace(/[^0-9.]/g, '');
// 		if (currency === 'USD') {
// 			priceArray.push(parseFloat(value));

// 			const listingDetail = {
// 				id: result.itemId || '',
// 				title: result.title || '',
// 				url: result.itemWebUrl || result.link || '',
// 				seller: result.seller?.username || '',
// 				price: parseFloat(parseFloat(value).toFixed(2)),
// 				date: result.date || ''
// 			};

// 			listingsArray.push(listingDetail);
// 		}
// 	});

// 	// sorts most recent first if there is a date; mainly for sold listings
// 	listingsArray.sort((a, b) => {
// 		if (a.date && b.date) {
// 			const dateA = new Date(a.date);
// 			const dateB = new Date(b.date);
// 			return dateB - dateA;
// 		}
// 	});

// 	stateListing(listingsArray);

// 	return {
// 		Average: calculateAverage(priceArray).toFixed(2),
// 		Lowest: Math.min(...priceArray).toFixed(2),
// 		Highest: Math.max(...priceArray).toFixed(2),
// 		'Data Points': priceArray.length
// 	};
// }
