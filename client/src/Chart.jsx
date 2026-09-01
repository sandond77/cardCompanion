import { useMemo } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale,
	Filler
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
	TimeScale,
	Filler
);

// Kept in sync with the tokens in index.css
const INK_FAINT = '#5f7186';
const LINE = '#22303f';
const ACCENT = '#38bdf8';
const SURFACE = '#16202e';
const INK = '#e6edf5';

ChartJS.defaults.font.family =
	"'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif";
ChartJS.defaults.color = INK_FAINT;

export default function LineChart({ listings = [] }) {
	const dataPoints = useMemo(
		() =>
			listings
				.map((l) => {
					const parsedDate = l.date ? parseISO(l.date) : null;
					const price =
						typeof l.price === 'number' ? l.price : parseFloat(l.price);
					return parsedDate && !isNaN(parsedDate) && !isNaN(price)
						? { x: parsedDate, y: price }
						: null;
				})
				.filter(Boolean)
				.sort((a, b) => a.x - b.x),
		[listings]
	);

	const { data, options } = useMemo(() => {
		const prices = dataPoints.map((p) => p.y);
		const minY = prices.length ? Math.min(...prices) : 0;
		const maxY = prices.length ? Math.max(...prices) : 0;
		// Frame the actual trading range instead of anchoring to zero — a flat
		// band of empty space below the data hides the movement that matters.
		const pad = Math.max((maxY - minY) * 0.15, maxY * 0.05, 1);

		const data = {
			datasets: [
				{
					label: 'Sold price',
					data: dataPoints,
					borderColor: ACCENT,
					borderWidth: 2,
					pointRadius: dataPoints.length > 60 ? 0 : 2.5,
					pointHoverRadius: 5,
					pointBackgroundColor: ACCENT,
					pointBorderColor: SURFACE,
					pointBorderWidth: 1.5,
					tension: 0.25,
					fill: true,
					backgroundColor: (ctx) => {
						const { chart } = ctx;
						const { ctx: c, chartArea } = chart;
						if (!chartArea) return 'rgba(56, 189, 248, 0.12)';
						const g = c.createLinearGradient(
							0,
							chartArea.top,
							0,
							chartArea.bottom
						);
						g.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
						g.addColorStop(1, 'rgba(56, 189, 248, 0.01)');
						return g;
					}
				}
			]
		};

		const options = {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'nearest', axis: 'x', intersect: false },
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: '#0a0e14',
					borderColor: LINE,
					borderWidth: 1,
					titleColor: INK_FAINT,
					titleFont: { size: 11, weight: '500' },
					bodyColor: INK,
					bodyFont: { size: 13, weight: '600' },
					padding: 10,
					displayColors: false,
					callbacks: {
						label: (ctx) =>
							`$${ctx.parsed.y.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}`
					}
				}
			},
			scales: {
				x: {
					type: 'time',
					time: { unit: 'day', tooltipFormat: 'MMM d, yyyy' },
					grid: { display: false },
					border: { color: LINE },
					ticks: {
						autoSkip: true,
						maxTicksLimit: 5,
						maxRotation: 0,
						font: { size: 10 },
						color: INK_FAINT
					}
				},
				y: {
					min: Math.max(0, minY - pad),
					max: maxY + pad,
					grid: { color: LINE, drawTicks: false },
					border: { display: false, dash: [3, 3] },
					ticks: {
						maxTicksLimit: 5,
						padding: 8,
						font: { size: 10 },
						color: INK_FAINT,
						callback: (val) =>
							`$${Math.round(val).toLocaleString()}`
					}
				}
			}
		};

		return { data, options };
	}, [dataPoints]);

	if (dataPoints.length === 0) return null;

	return (
		<div className="h-52 w-full">
			<Line options={options} data={data} />
		</div>
	);
}
