import axios from 'axios';
import Fuse from 'fuse.js';

export async function filterResults(unfilteredResults, formData) {
	const { cardName, setName, grade, cardNumber } = formData;

	const searchString = [cardName, setName, grade, cardNumber]
		.filter(Boolean)
		.join(' ');

	const fuse = new Fuse(unfilteredResults, {
		includeScore: true,
		threshold: 0.35, // adjust fuzziness (lower = stricter)
		keys: [
			{ name: 'title', weight: 0.7 },
			{ name: 'seller.username', weight: 0.2 },
			{ name: 'itemId', weight: 0.1 }
		]
	});

	const results = fuse.search(searchString);
	return results.map((r) => r.item);
}

export async function queryEbay(params) {
	try {
		const ebaySearch = await axios.get(
			`http://localhost:3001/api/search?${params}`
		);

		const ebayScrape = await axios.get(
			`http://localhost:3001/api/scrape?${params}`
		);
		// return ebayScrape;
		return { ebaySearch, ebayScrape };
	} catch (error) {
		console.error(error);
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
	arr1.forEach((result) => {
		let title = result.title.toLowerCase();
		title = title.replace(/\s/g, ''); //Removes potential whitespace so query will return PSA10 or PSA 10
		const grade = formData.grade.toLowerCase();
		const cardName = formData.cardName.toLowerCase().replace(/\s/g, '');
		const cardNumber = formData.cardNumber.toLowerCase();
		const setName = formData.setName.toLowerCase().replace(/\s/g, '');
		const additionalDetail = formData.setName.toLowerCase().replace(/\s/g, '');
		// const setNameMatch = setName ? title.includes(setName) : true;
		// const additionalDetailMatch = additionalDetail ? title.includes(additionalDetail) : true;
		//&& (setNameMatch || additionalDetailMatch)

		// console.log(grade, cardName, cardNumber);
		// console.log(
		// 	title.includes(grade),
		// 	title.includes(cardName),
		// 	title.includes(cardNumber)
		// );

		if (
			title.includes(grade) &&
			title.includes(cardName) &&
			title.includes(cardNumber)
		) {
			arr2.push(result);
		}
	});

	console.log(id, arr2);

	let priceArray = [];
	let listingsArray = [];

	//add if check to look for empty array
	arr2.forEach((result) => {
		let { value, currency } = result.price || result.currentBidPrice;
		value = value.replace(/[^0-9.]/g, '');
		if (currency === 'USD') {
			priceArray.push(parseFloat(value));

			const listingDetail = {
				id: result.itemId || '',
				title: result.title || '',
				url: result.itemWebUrl || result.link || '',
				seller: result.seller?.username || '',
				price: parseFloat(parseFloat(value).toFixed(2)),
				date: result.date || ''
			};

			listingsArray.push(listingDetail);
		}
	});

	// sorts most recent first if there is a date; mainly for sold listings
	listingsArray.sort((a, b) => {
		if (a.date && b.date) {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateB - dateA;
		}
	});

	stateListing(listingsArray);

	return {
		Average: calculateAverage(priceArray).toFixed(2),
		Lowest: Math.min(...priceArray).toFixed(2),
		Highest: Math.max(...priceArray).toFixed(2),
		'Data Points': priceArray.length
	};
}
