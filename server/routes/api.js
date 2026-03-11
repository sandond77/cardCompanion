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

		res.json({
			bin: binResults.data.itemSummaries,
			auction: aucResults.data.itemSummaries
		});
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
		console.error(err.response?.data || err.message);
		res.status(500).json({ error: 'Scrape failed' });
	}
});

export default router;
