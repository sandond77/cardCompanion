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
import { parseApiData } from './utils/utils';

function App() {
	const [searchStatus, setSearchStatus] = useState(false);
	const [statistics, setStatistics] = useState('');
	const [queryTerm, setQueryTerm] = useState('');
	const [aucStatsData, setAucStatsData] = useState('');
	const [binStatsData, setBinStatsData] = useState('');
	const [aucSoldStatsData, setAucSoldStatsData] = useState('');
	const [binSoldStatsData, setBinSoldStatsData] = useState('');
	const [aucListings, setAucListings] = useState('');
	const [binListings, setBinListings] = useState('');
	const [aucSoldListings, setAucSoldListings] = useState('');
	const [binSoldListings, setBinSoldListings] = useState('');
	const [loading, setLoading] = useState(false);
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

		// Graded: Grade leads the query. Raw: start from Card Name (condition filtered client-side).
		const queryParts = grade
			? [grade, cardName, cardNumber, cardRarity, year, cardGame, cardLanguage, additionalDetail, setName]
			: [cardName, cardNumber, cardRarity, year, cardGame, cardLanguage, additionalDetail, setName];

		const parsedFormData = queryParts.filter(Boolean).join(' ');

		// Display query: raw cards append condition as a label (not sent to eBay)
		const displayQuery = condition
			? `${parsedFormData}  |  Condition Filter: ${condition}`
			: parsedFormData;

		setQueryTerm(displayQuery);
		setSearchStatus(true);
		try {
			setLoading(true);
			setStatistics(
				await parseApiData(
					parsedFormData,
					formData,
					setAucListings,
					setBinListings,
					setAucSoldListings,
					setBinSoldListings,
					setHasResults
				)
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!searchStatus) return;

		if (hasResults.bin) {
			setBinStatsData({
				Average: `$${statistics.bin.Average}`,
				Low: `$${statistics.bin.Lowest}`,
				High: `$${statistics.bin.Highest}`,
				'# of Listings': statistics.bin['Data Points']
			});
		}
		if (hasResults.auc) {
			setAucStatsData({
				Average: `$${statistics.auc.Average}`,
				Low: `$${statistics.auc.Lowest}`,
				High: `$${statistics.auc.Highest}`,
				'# of Listings': statistics.auc['Data Points']
			});
		}
		if (hasResults.soldAuc) {
			setAucSoldStatsData({
				Average: `$${statistics.aucSold.Average}`,
				Low: `$${statistics.aucSold.Lowest}`,
				High: `$${statistics.aucSold.Highest}`,
				'# of Listings': statistics.aucSold['Data Points']
			});
		}
		if (hasResults.soldBin) {
			setBinSoldStatsData({
				Average: `$${statistics.binSold.Average}`,
				Low: `$${statistics.binSold.Lowest}`,
				High: `$${statistics.binSold.Highest}`,
				'# of Listings': statistics.binSold['Data Points']
			});
		}
	}, [statistics, hasResults]);

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
									loading={loading}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Results
									boxLabel1={'Active BIN Data'}
									listingsArray={binListings}
									statsObject={binStatsData}
									loading={loading}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Results
									boxLabel1={'Sold Auction Data'}
									listingsArray={aucSoldListings}
									statsObject={aucSoldStatsData}
									loading={loading}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Results
									boxLabel1={'Sold BIN Data'}
									listingsArray={binSoldListings}
									statsObject={binSoldStatsData}
									loading={loading}
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
