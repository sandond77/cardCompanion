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

// Register Chart.js modules
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

// Helper to parse price strings safely
function parsePrice(priceObj) {
	if (!priceObj || !priceObj.value) return null;
	const val = priceObj.value;
	if (typeof val === 'string') {
		const match = val.match(/-?\d[\d,]*(?:\.\d+)?/);
		if (!match) return null;
		return parseFloat(match[0].replace(/,/g, ''));
	}
	if (typeof val === 'number') return val;
	return null;
}

// ✅ React component
export default function LineChart({ listings = [] }) {
	const dataPoints = listings
		.map((l) => ({
			x: l.date, // e.g. "2025-09-27"
			y: parsePrice(l.price) // e.g. 55.99
		}))
		.filter((p) => p.y !== null && p.x)
		.sort((a, b) => new Date(a.x) - new Date(b.x));

	// Chart.js dataset
	const data = {
		datasets: [
			{
				label: 'Price (USD)',
				data: dataPoints,
				borderColor: 'rgb(53, 162, 235)',
				backgroundColor: 'rgba(53, 162, 235, 0.5)',
				showLine: dataPoints.length > 1, // avoid flat line with single point
				tension: 0.2
			}
		]
	};

	// Chart.js options (kept inside the component file)
	const options = {
		responsive: true,
		plugins: {
			legend: { position: 'top' },
			title: { display: true, text: 'Listings Price Over Time' },
			tooltip: {
				callbacks: {
					label: (ctx) =>
						typeof ctx.parsed.y === 'number'
							? `Price: $${ctx.parsed.y.toLocaleString()}`
							: 'Price: —'
				}
			}
		},
		scales: {
			x: {
				type: 'time',
				time: {
					unit: 'day',
					displayFormats: { day: 'yyyy-MM-dd' } // ✅ correct format
				},
				ticks: {
					source: 'data', // ✅ use your listing dates for tick marks
					autoSkip: false, // skip if too many
					maxRotation: 45, // tilt labels for readability
					minRotation: 0
				},
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
