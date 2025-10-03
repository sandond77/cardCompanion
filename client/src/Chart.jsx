import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { parseISO } from 'date-fns';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale
);

// --- Price parser (scraped data only) ---
function extractPrice(listing) {
	if (
		listing.price &&
		typeof listing.price === 'object' &&
		listing.price.value
	) {
		return parseFloat(String(listing.price.value).replace(/[^0-9.]/g, ''));
	}
	if (typeof listing.price === 'number') {
		return listing.price;
	}
	return null;
}

// --- Date parser (scraped data only) ---
function extractDate(listing) {
	if (listing.date) {
		return parseISO(listing.date);
	}
	return null;
}

export default function SoldListingsChart({ listings = [] }) {
	const soldPoints = listings
		.filter((l) => l.date) // ensure only sold data
		.map((l) => {
			const date = extractDate(l);
			const price = extractPrice(l);
			return date && price ? { x: date, y: price } : null;
		})
		.filter(Boolean)
		.sort((a, b) => a.x - b.x);

	console.log('Sold chart points:', soldPoints);

	const data = {
		datasets: [
			{
				label: 'Sold Listings',
				type: 'line',
				data: soldPoints,
				borderColor: 'rgb(53, 162, 235)',
				backgroundColor: 'rgba(53, 162, 235, 0.5)',
				tension: 0.2
			}
		]
	};

	const options = {
		responsive: true,
		plugins: {
			legend: { position: 'top' },
			title: { display: true, text: 'Sold Listings Price Trend' }
		},
		scales: {
			x: {
				type: 'time',
				time: { unit: 'day', displayFormats: { day: 'MM-dd-yyyy' } },
				title: { display: true, text: 'Date' }
			},
			y: {
				title: { display: true, text: 'Price (USD)' },
				ticks: {
					callback: (value) => `$${Number(value).toLocaleString()}`
				}
			}
		}
	};

	return <Line options={options} data={data} />;
}
