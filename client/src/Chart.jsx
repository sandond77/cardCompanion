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
import 'chartjs-adapter-date-fns'; // ✅ adapter for time scale

// Register Chart.js components
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

// Chart options
export const options = {
	responsive: true,
	plugins: {
		legend: {
			position: 'top'
		},
		title: {
			display: true,
			text: 'Listings Price Over Time'
		}
	},
	scales: {
		x: {
			type: 'time', // ✅ X-axis is time
			time: {
				unit: 'day' // could also be "month" or "week"
			},
			title: {
				display: true,
				text: 'Date'
			}
		},
		y: {
			title: {
				display: true,
				text: 'Price (USD)'
			}
		}
	}
};

// Safely parse price values
function parsePrice(priceObj) {
	if (!priceObj || !priceObj.value) return null;
	const val = priceObj.value;
	if (typeof val === 'string') return parseFloat(val.replace(/[$,]/g, ''));
	if (typeof val === 'number') return val;
	return null;
}

// Main chart component
export default function LineChart({ listings }) {
	// Turn listings into {x: date, y: price} points
	const dataPoints = listings
		.map((l) => ({
			x: l.date,
			y: parsePrice(l.price)
		}))
		.filter((p) => p.y !== null);

	// Dataset
	const data = {
		datasets: [
			{
				label: 'Price (USD)',
				data: dataPoints,
				borderColor: 'rgb(53, 162, 235)',
				backgroundColor: 'rgba(53, 162, 235, 0.5)',
				showLine: dataPoints.length > 1 // ✅ only draw line if >1 point
			}
		]
	};

	return <Line options={options} data={data} />;
}
