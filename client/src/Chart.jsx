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

export default function LineChart({ listings = [] }) {
	const dataPoints = listings
		.map((l) => {
			const parsedDate = l.date ? parseISO(l.date) : null;
			const price = typeof l.price === 'number' ? l.price : parseFloat(l.price);
			return parsedDate && !isNaN(price) ? { x: parsedDate, y: price } : null;
		})
		.filter(Boolean)
		.sort((a, b) => a.x - b.x);

	const prices = dataPoints.map((p) => p.y);
	const minY = Math.min(...prices);
	const maxY = Math.max(...prices);
	const yPadding = (maxY - minY) * 0.2; // ✅ 20% vertical padding for breathing room

	const data = {
		datasets: [
			{
				label: 'Sold Price (USD)',
				data: dataPoints,
				borderColor: 'rgb(53, 162, 235)',
				backgroundColor: 'rgba(53, 162, 235, 0.4)',
				tension: 0.3,
				pointRadius: 4,
				pointHoverRadius: 6,
				fill: true
			}
		]
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
			title: {
				display: true,
				text: 'Sold Listings Trend',
				font: {
					size: 16,
					weight: 'bold'
				},
				padding: { top: 10, bottom: 20 }
			},
			tooltip: {
				mode: 'nearest',
				intersect: false,
				callbacks: {
					label: (ctx) => `$${ctx.parsed.y.toLocaleString()}`
				}
			}
		},
		layout: {
			padding: { left: 20, right: 20, top: 10, bottom: 10 }
		},
		scales: {
			x: {
				type: 'time',
				time: { unit: 'day', tooltipFormat: 'MM/dd/yyyy' },
				title: { display: true, text: 'Date', font: { size: 12 } },
				ticks: {
					autoSkip: true,
					maxTicksLimit: 6,
					font: { size: 11 }
				}
			},
			y: {
				min: 0, // ✅ always start from 0
				max: maxY + yPadding, // ✅ dynamically scale up
				title: {
					display: true,
					text: 'Price (USD)',
					font: { size: 13, weight: 'bold' }
				},
				ticks: {
					callback: (val) => {
						const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
						return `$${rounded.toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 2
						})}`;
					},
					font: { size: 11 }
				},
				beginAtZero: true // ✅ ensures Chart.js starts at 0 visually even if dataset doesn’t
			}
		}
	};

	return (
		<div
			style={{
				width: '100%',
				maxWidth: '100%',
				height: 'clamp(300px, 50vw, 550px)',
				margin: '0 auto',
				padding: '8px',
				overflow: 'hidden', // ✅ prevents chart bleed
				boxSizing: 'border-box'
			}}
		>
			<Line options={options} data={data} />
		</div>
	);
}
