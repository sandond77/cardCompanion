import axios from 'axios';
import puppeteer from 'puppeteer';

//current listing utils
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

//sold listing utils
export async function scrapeSoldListings(query, sortOrder = 12, maxPages = 3) {
	const browser = await puppeteer.launch({
		headless: true, // false to see browser
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-blink-features=AutomationControlled',
			'--disable-web-security',
			'--window-size=1920,1080'
		]
	});
	// const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();

	// This makes headless Chrome look like a normal Chrome
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'webdriver', { get: () => false });
	});

	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
			'(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
	);

	await page.setViewport({ width: 1920, height: 1080 });

	let url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(
		query
	)}&LH_Sold=1&LH_Complete=1&_sop=${sortOrder}`;

	const urlAuction = url + '&LH_Auction=1';
	const urlBin = url + '&LH_BIN=1';

	let aucResults = await scrape(page, urlAuction, maxPages);
	let binResults = await scrape(page, urlBin, maxPages);

	await page.close(); // close the page
	await browser.close(); // close the browser

	return { aucResults, binResults };
}

async function scrape(page, url, maxPages) {
	await page.goto(url, { waitUntil: 'networkidle2' });
	await page.waitForSelector('.srp-results, .su-card-container', {
		visible: true,
		timeout: 15000
	});

	let results = [];
	try {
		let currentPage = 1;
		while (currentPage <= maxPages) {
			const pageListings = await page.$$eval(
				'.s-item, .su-card-container',
				(items) =>
					items
						.map((item) => {
							const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
							const get = (sel) =>
								clean(item.querySelector(sel)?.textContent || '');
							const getAttr = (sel, attr) =>
								item.querySelector(sel)?.getAttribute(attr) || '';

							// Title
							const title =
								get('.s-item__title') ||
								get('.s-card__title') ||
								get('[role="heading"] span');

							// Price
							const priceText =
								get('.s-item__price') || get('.s-card__price') || '';
							const price = { value: priceText, currency: 'USD' };

							// Sold Date
							const soldDate =
								get('.s-item__ended-date') ||
								get('.s-item__title--tagblock span') ||
								get('.su-styled-text.positive.default') ||
								get('.s-card__caption .su-styled-text') ||
								'';

							let date = '';
							let match = soldDate.match(
								/([A-Za-z]+ \d{1,2}, \d{4})|(\d{4}\/\d{1,2}\/\d{1,2})/
							);
							if (match) {
								const d = new Date(match[0]);
								if (!isNaN(+d)) {
									date = d.toISOString().split('T')[0];
								}
							}

							// Link & ID
							let link =
								getAttr('.s-item__link', 'href') ||
								getAttr('a.su-link[href*="/itm/"]', 'href');
							const matchID = link?.match(/\/itm\/(\d+)/);
							const numericId = matchID ? matchID[1] : '';
							const itemId = numericId ? `v1|${numericId}|0` : '';
							link = numericId ? `https://www.ebay.com/itm/${numericId}` : '';

							// Seller
							let sellerUsername =
								get(
									'.s-item__detail.s-item__detail--secondary .s-item__etrs-text span.PRIMARY'
								) ||
								get(
									'.su-card-container__attributes__secondary .su-styled-text.primary.large'
								) ||
								'';
							const seller = { username: sellerUsername };

							return { itemId, title, price, date, link, seller };
						})
						.filter(
							(item) =>
								item.title &&
								!item.title.toLowerCase().includes('shop on ebay') &&
								item.price &&
								item.link
						)
			);

			results = results.concat(pageListings);

			const nextLink = await page.$('a.pagination__next');
			if (nextLink && currentPage < maxPages) {
				await Promise.all([
					nextLink.click(),
					page.waitForSelector('.s-item, .su-card-container', { visible: true })
				]);
				currentPage++;
			} else {
				break;
			}
		}
	} catch (e) {
		console.error('error', e);
	} finally {
		return results;
	}
}
