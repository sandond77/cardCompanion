import express from 'express';
import { browseAPI, scrapeSoldListings } from '../utils/utils.js';

const router = express.Router();

router.get('/search', async (req, res) => {
	const query = req.query.q;

	try {
		const [binResults, aucResults] = await Promise.all([
			browseAPI(query, 'FIXED_PRICE'),
			browseAPI(query, 'AUCTION')
		]);

		const bin = binResults.data.itemSummaries ?? [];
		const auction = aucResults.data.itemSummaries ?? [];
		res.json({ bin, auction });
	} catch (err) {
		console.error(err.response?.data || err.message);
		res.status(500).json({ error: 'eBay API call failed' });
	}
});

router.get('/scrape', async (req, res) => {
	const query = req.query.q;

	try {
		const scrapeResults = await scrapeSoldListings(query, 12, 3);
		res.json({
			binSold: scrapeResults.binResults,
			aucSold: scrapeResults.aucResults
		});
	} catch (err) {
		if (err.code === 'EBAY_BLOCKED') {
			console.warn('Scrape blocked by eBay bot check:', req.query.q);
			return res.status(503).json({
				error:
					'eBay is currently serving a bot check instead of sold listings. ' +
					'Active listings are unaffected — try sold data again in a few minutes.'
			});
		}
		console.error(err.response?.data || err.message);
		res.status(500).json({ error: 'Scrape failed' });
	}
});

export default router;
