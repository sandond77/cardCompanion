import { Typography, CircularProgress, Box } from '@mui/material';
import ListingsModal from './ListingsModal';
import LineChart from './Chart';

export default function Results({
	boxLabel1,
	listingsArray,
	statsObject,
	loading
}) {
	function averageRecentNFromArray(arr, n = 5) {
		if (!Array.isArray(arr) || arr.length === 0) return 0;

		const valid = [];

		for (const item of arr) {
			if (valid.length === n) break;

			if (
				item &&
				typeof item.price !== 'undefined' &&
				item.date &&
				!Number.isNaN(Date.parse(item.date))
			) {
				const price =
					typeof item.price === 'number' ? item.price : Number(item.price);
				if (!Number.isNaN(price)) valid.push(price);
			}
		}

		if (valid.length === 0) return;

		const total = valid.reduce((sum, p) => sum + p, 0);
		return { average: (total / valid.length).toFixed(2), count: valid.length };
	}

	// ✅ Filter only sold listings (with a date)
	const soldListings = listingsArray.filter((item) => item.date);

	let recentSalesAverage = averageRecentNFromArray(soldListings);

	return (
		<>
			<Typography
				variant="h4"
				color="success"
				gutterBottom
				sx={{ marginTop: 4 }}
			>
				{boxLabel1}
			</Typography>
			<>
				{loading ? (
					<Box>
						<CircularProgress />
					</Box>
				) : listingsArray.length === 0 ? (
					<Typography variant="h5" color="warning" gutterBottom sx={{ mt: 4 }}>
						No Results
					</Typography>
				) : (
					<>
						{Object.entries(statsObject).map(([key, value]) => (
							<Typography key={key} variant="h5">
								{key}: {value}
							</Typography>
						))}

						<div>
							{recentSalesAverage && recentSalesAverage.count > 0 ? (
								<Typography variant="h5">
									Last {recentSalesAverage.count} Sales: $
									{recentSalesAverage.average}
								</Typography>
							) : (
								<Typography variant="h5" color="warning">
									No sales data
								</Typography>
							)}
						</div>
					</>
				)}
			</>
			{/* Only show modal if there are listings */}
			{listingsArray.length > 0 && <ListingsModal listings={listingsArray} />}
			{/* ✅ Only pass sold listings to the chart */}
			{soldListings.length > 0 && <LineChart listings={soldListings} />}
		</>
	);
}
