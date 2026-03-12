import axios from 'axios';
import puppeteer from 'puppeteer';

export async function browseAPI(query, listingType) {
	const token = await getEbayAccessToken();

	let ebayUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(
		query
	)}`;

	if (listingType === 'AUCTION' || listingType === 'FIXED_PRICE') {
		ebayUrl += `&filter=buyingOptions:{${listingType}}`;
	}
	return await axios.get(ebayUrl, {
		headers: {
			Authorization: `Bearer ${token}`,
			'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
		}
	});
}

export async function getEbayAccessToken() {
	const credentials = Buffer.from(
		`${process.env.EBAY_PROD_CLIENT_ID}:${process.env.EBAY_PROD_CLIENT_SECRET}`
	).toString('base64');

	const tokenRes = await axios.post(
		'https://api.ebay.com/identity/v1/oauth2/token',
		'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
		{
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${credentials}`
			}
		}
	);
	return tokenRes.data.access_token;
}

export async function scrapeSoldListings(query, sortOrder = 12, maxPages = 3) {
	const browser = await puppeteer.launch({
		headless: 'new',
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-gpu',
			'--no-zygote',
			'--single-process',
			'--window-size=1920,1080'
		]
	});

	const page = await browser.newPage();

	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'webdriver', { get: () => false });
	});

	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
			'(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
	);

	await page.setViewport({ width: 1920, height: 1080 });

	const baseUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sop=${sortOrder}`;

	const aucResults = await scrape(page, baseUrl + '&LH_Auction=1', maxPages);
	const binResults = await scrape(page, baseUrl + '&LH_BIN=1', maxPages);

	await page.close();
	await browser.close();

	return { aucResults, binResults };
}

async function scrape(page, url, maxPages) {
	await page.goto(url, { waitUntil: 'load' });
	await new Promise(r => setTimeout(r, 5000)); // allow post-load JS to settle
	await page.waitForSelector('.s-card', { visible: true, timeout: 15000 });

	let results = [];

	function cleanTitle(raw) {
		if (!raw) return '';
		return raw
			.replace(/New Listing/gi, '')
			.replace(/Opens in a new window or tab/gi, '')
			.replace(/Shop on eBay/gi, '')
			.trim();
	}

	try {
		let currentPage = 1;
		while (currentPage <= maxPages) {
			const rawListings = await page.$$eval('.s-card', (items) =>
				items.map((item) => {
					const get = (sel) =>
						item.querySelector(sel)?.textContent?.trim() || '';
					const getAttr = (sel, attr) =>
						item.querySelector(sel)?.getAttribute(attr) || '';

					const rawTitle = get('.s-card__title') || '';

					const priceText = get('.s-card__price') || '';

					// Scan all spans/divs once, reuse for date and condition
					const allSpans = Array.from(item.querySelectorAll('span, div'))
						.map((el) => el.textContent?.trim() || '');

					const allText = allSpans.find((t) => /sold\s+\w+\s+\d/i.test(t)) || '';

					const soldDate =
						get('.s-card__caption') ||
						get('.s-card__subtitle') ||
						allText ||
						'';

					// Scan for condition text (Near Mint, Lightly Played, etc.)
					const conditionText = allSpans.find((t) =>
						/^(near mint|lightly played|moderately played|heavily played|damaged)/i.test(t)
					) || '';

					const link =
						getAttr('.s-card__link', 'href') ||
						getAttr('a[href*="/itm/"]', 'href') ||
						'';

					const sellerRaw =
						get('.su-card-container__attributes__secondary') || '';
					// Strip shipping notice, then grab username (before feedback %)
					const seller = sellerRaw
						.replace(/Customs services and international tracking provided/gi, '')
						.split(/\s+\d+\.?\d*%/)[0]
						.trim();

					return { rawTitle, priceText, soldDate, conditionText, link, seller };
				})
			);

			const pageListings = rawListings
				.map((r) => {
					const title = cleanTitle(r.rawTitle);

					let date = '';
					const match = r.soldDate.match(
						/([A-Za-z]+ \d{1,2}, \d{4})|(\d{4}\/\d{1,2}\/\d{1,2})|(\d{1,2}\/\d{1,2}\/\d{4})/
					);
					if (match) {
						const d = new Date(match[0]);
						if (!isNaN(+d)) {
							date = d.toISOString().split('T')[0];
						}
					}

					const matchID = r.link?.match(/\/itm\/(\d+)/);
					const numericId = matchID ? matchID[1] : '';
					const itemId = numericId ? `v1|${numericId}|0` : '';
					const fixedLink = numericId
						? `https://www.ebay.com/itm/${numericId}`
						: '';

					return {
						itemId,
						title,
						price: { value: r.priceText, currency: 'USD' },
						condition: r.conditionText,
						date,
						link: fixedLink,
						seller: { username: r.seller }
					};
				})
				.filter(
					(item) =>
						item.title &&
						!item.title.toLowerCase().includes('shop on ebay') &&
						item.price.value &&
						item.link
				);

			results = results.concat(pageListings);

			const nextLink = await page.$('a.pagination__next');
			if (nextLink && currentPage < maxPages) {
				await Promise.all([
					page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }),
					nextLink.click()
				]);
				await new Promise(r => setTimeout(r, 3000));
				await page.waitForSelector('.s-card', { timeout: 15000 });
				currentPage++;
			} else {
				break;
			}
		}
	} catch (e) {
		console.error('Scrape error:', e);
	} finally {
		return results;
	}
}
