import { useState, useEffect } from 'react';
import {
	Container,
	Typography,
	Box,
	createTheme,
	responsiveFontSizes,
	Grid,
	ThemeProvider
} from '@mui/material';
import SearchForm from './SearchForm';
import Results from './Results';
import { parseSearchData, parseScrapeData } from './utils/utils';

function App() {
	const [searchStatus, setSearchStatus] = useState(false);
	const [queryTerm, setQueryTerm] = useState('');
	const [aucStatsData, setAucStatsData] = useState('');
	const [binStatsData, setBinStatsData] = useState('');
	const [aucSoldStatsData, setAucSoldStatsData] = useState('');
	const [binSoldStatsData, setBinSoldStatsData] = useState('');
	const [aucListings, setAucListings] = useState('');
	const [binListings, setBinListings] = useState('');
	const [aucSoldListings, setAucSoldListings] = useState('');
	const [binSoldListings, setBinSoldListings] = useState('');
	const [loadingActive, setLoadingActive] = useState(false);
	const [loadingSold, setLoadingSold] = useState(false);
	const [hasResults, setHasResults] = useState({
		bin: false,
		auc: false,
		soldBin: false,
		soldAuc: false
	});

	let theme = createTheme();
	theme = responsiveFontSizes(theme);

	function resetStates() {
		setQueryTerm('');
		setSearchStatus(false);
		setAucStatsData('');
		setBinStatsData('');
		setAucListings('');
		setBinListings('');
		setBinSoldListings('');
		setAucSoldListings('');
		setAucSoldStatsData('');
		setBinSoldStatsData('');
		setHasResults({ bin: false, auc: false, soldBin: false, soldAuc: false });
	}

	const handleSubmit = async (formData) => {
		resetStates();
		const { grade, condition, cardName, cardNumber, cardRarity, year, cardGame, cardLanguage, additionalDetail, setName } = formData;

		const queryParts = grade
			? [grade, cardName, cardNumber, cardRarity, year, cardGame, cardLanguage, additionalDetail, setName]
			: [cardName, cardNumber, cardRarity, year, cardGame, cardLanguage, additionalDetail, setName];

		const parsedFormData = queryParts.filter(Boolean).join(' ');

		const displayQuery = condition
			? `${parsedFormData}  |  Condition Filter: ${condition}`
			: parsedFormData;

		setQueryTerm(displayQuery);
		setSearchStatus(true);

		// Fire active and sold fetches independently — active results show immediately
		setLoadingActive(true);
		parseSearchData(parsedFormData, formData, setAucListings, setBinListings, setHasResults)
			.then((stats) => {
				if (stats?.bin) setBinStatsData({ Average: `$${stats.bin.Average}`, Low: `$${stats.bin.Lowest}`, High: `$${stats.bin.Highest}`, '# of Listings': stats.bin['Data Points'] });
				if (stats?.auc) setAucStatsData({ Average: `$${stats.auc.Average}`, Low: `$${stats.auc.Lowest}`, High: `$${stats.auc.Highest}`, '# of Listings': stats.auc['Data Points'] });
			})
			.catch((err) => console.error('Search error:', err))
			.finally(() => setLoadingActive(false));

		setLoadingSold(true);
		parseScrapeData(parsedFormData, formData, setAucSoldListings, setBinSoldListings, setHasResults)
			.then((stats) => {
				if (stats?.binSold) setBinSoldStatsData({ Average: `$${stats.binSold.Average}`, Low: `$${stats.binSold.Lowest}`, High: `$${stats.binSold.Highest}`, '# of Listings': stats.binSold['Data Points'] });
				if (stats?.aucSold) setAucSoldStatsData({ Average: `$${stats.aucSold.Average}`, Low: `$${stats.aucSold.Lowest}`, High: `$${stats.aucSold.Highest}`, '# of Listings': stats.aucSold['Data Points'] });
			})
			.catch((err) => console.error('Scrape error:', err))
			.finally(() => setLoadingSold(false));
	};

	// hasResults is still used to conditionally render stats (kept for Results component)
	useEffect(() => {}, [hasResults]);

	return (
		<ThemeProvider theme={theme}>
			<Container>
				<Typography variant="h1" gutterBottom align="center">
					CardCompanion
				</Typography>
				<SearchForm
					handleSubmit={handleSubmit}
					setQueryTerm={setQueryTerm}
					resetStates={resetStates}
				/>
				{searchStatus && (
					<Box sx={{ border: '1px solid', margin: '2', borderRadius: '2px' }}>
						<Typography variant="h4" gutterBottom sx={{ mt: 2, ml: 2 }}>
							Optimal Query String:
						</Typography>
						<Typography
							variant="h5"
							color="primary"
							gutterBottom
							sx={{ textAlign: 'left', ml: 2 }}
						>
							{queryTerm}
						</Typography>
					</Box>
				)}

				{searchStatus && (
					<Box sx={{ border: '1px solid', margin: '2', borderRadius: '2px' }}>
						<Grid
							container
							spacing={2}
							sx={{ textAlign: 'center', ml: 2, mb: 4 }}
						>
							<Grid size={{ xs: 12, md: 6 }}>
								<Results
									boxLabel1={'Active Auction Data'}
									listingsArray={aucListings}
									statsObject={aucStatsData}
									loading={loadingActive}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Results
									boxLabel1={'Active BIN Data'}
									listingsArray={binListings}
									statsObject={binStatsData}
									loading={loadingActive}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Results
									boxLabel1={'Sold Auction Data'}
									listingsArray={aucSoldListings}
									statsObject={aucSoldStatsData}
									loading={loadingSold}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Results
									boxLabel1={'Sold BIN Data'}
									listingsArray={binSoldListings}
									statsObject={binSoldStatsData}
									loading={loadingSold}
								/>
							</Grid>
						</Grid>
					</Box>
				)}
			</Container>
		</ThemeProvider>
	);
}

export default App;
