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
			if (valid.length === n) break; // stop once we have n items

			if (
				item &&
				typeof item.price !== 'undefined' &&
				item.date &&
				!Number.isNaN(Date.parse(item.date)) // must be a valid date
			) {
				const price =
					typeof item.price === 'number' ? item.price : Number(item.price);
				if (!Number.isNaN(price)) valid.push(price);
			}
		}

		if (valid.length === 0) return; // no valid sales at all

		const total = valid.reduce((sum, p) => sum + p, 0);
		return { average: (total / valid.length).toFixed(2), count: valid.length }; // average based on however many valid items we got
	}

	let recentSalesAverage = averageRecentNFromArray(listingsArray);

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
							{listingsArray.some((item) => item.date) &&
								(recentSalesAverage && recentSalesAverage.count > 0 ? (
									<Typography variant="h5">
										Last {recentSalesAverage.count} Sales: $
										{recentSalesAverage.average}
									</Typography>
								) : (
									<Typography variant="h5" color="warning">
										No sales data
									</Typography>
								))}
						</div>
					</>
				)}
			</>
			{/* Render a modal only if there are listings */}
			{listingsArray.length > 0 && <ListingsModal listings={listingsArray} />}
			{listingsArray.length > 0 && listingsArray.some((item) => item.date) && (
				<LineChart listings={listingsArray} />
			)}
		</>
	);
}
