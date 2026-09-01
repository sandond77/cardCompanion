import { useState } from 'react';
import ListingsModal from './ListingsModal';
import LineChart from './Chart';
import Panel from './ui/Panel';
import Button from './ui/Button';
import StatsSkeleton from './ui/Skeleton';
import { TableIcon } from './ui/Icons';
import { recentAverage } from './utils/utils';

const money = (n) =>
	`$${Number(n).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;

function StatRow({ label, value, tone = 'default' }) {
	const tones = {
		default: 'text-ink',
		up: 'text-up',
		down: 'text-down',
		dim: 'text-ink-dim'
	};
	return (
		<div className="flex items-baseline justify-between gap-4 border-b border-line/60 py-2 last:border-0">
			<dt className="text-xs uppercase tracking-[0.08em] text-ink-faint">
				{label}
			</dt>
			<dd className={`tnum text-sm font-medium ${tones[tone]}`}>{value}</dd>
		</div>
	);
}

export default function Results({ label, kind, listingsArray, statsObject, loading }) {
	const [chartOpen, setChartOpen] = useState(true);

	const listings = Array.isArray(listingsArray) ? listingsArray : [];
	const isSold = kind === 'sold';
	const hasDates = listings.some((item) => item.date);
	const recent = recentAverage(listings);

	// Where the recent run sits against the whole-window average — the number a
	// seller actually acts on.
	const avg = statsObject?.average ?? null;
	const drift = recent && avg ? ((recent.average - avg) / avg) * 100 : null;

	return (
		<Panel className="animate-fade-up flex h-full flex-col">
			{/* Header */}
			<header className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
				<span
					className={`h-1.5 w-1.5 rounded-full ${
						isSold ? 'bg-up' : 'bg-accent'
					}`}
					aria-hidden="true"
				/>
				<h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">
					{label}
				</h3>
				<span
					className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
						isSold
							? 'bg-up/10 text-up'
							: 'bg-accent/10 text-accent'
					}`}
				>
					{isSold ? 'Sold' : 'Asking'}
				</span>
			</header>

			<div className="flex flex-1 flex-col px-5 py-4">
				{loading ? (
					<StatsSkeleton />
				) : listings.length === 0 || !statsObject ? (
					<div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
						<p className="text-sm font-medium text-ink-dim">No results</p>
						<p className="mt-1 max-w-[26ch] text-xs leading-relaxed text-ink-faint">
							Nothing matched this query. Try loosening the set name or rarity.
						</p>
					</div>
				) : (
					<>
						{/* Headline: the average, given the weight it deserves */}
						<div className="mb-3">
							<div className="flex items-baseline gap-2">
								<span className="tnum text-3xl font-bold leading-none tracking-tight text-ink">
									{money(statsObject.average)}
								</span>
								{drift !== null && Math.abs(drift) >= 1 && (
									<span
										className={`tnum text-xs font-semibold ${
											drift > 0 ? 'text-up' : 'text-down'
										}`}
										title={`Recent ${recent.count} sales vs. window average`}
									>
										{drift > 0 ? '▲' : '▼'} {Math.abs(drift).toFixed(1)}%
									</span>
								)}
							</div>
							<p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-ink-faint">
								Average · {statsObject.count} listing
								{statsObject.count === 1 ? '' : 's'}
							</p>
						</div>

						<dl className="mb-4">
							<StatRow label="Low" value={money(statsObject.low)} tone="dim" />
							<StatRow label="High" value={money(statsObject.high)} tone="dim" />
							{hasDates &&
								(recent ? (
									<StatRow
										label={`Last ${recent.count} sales`}
										value={money(recent.average)}
										tone={drift !== null && drift < 0 ? 'down' : 'up'}
									/>
								) : (
									<StatRow label="Recent sales" value="—" tone="dim" />
								))}
						</dl>

						<div className="mt-auto flex flex-wrap items-center gap-2">
							<ListingsModal listings={listings} label={label} isSold={isSold}>
								{(open) => (
									<Button variant="ghost" size="sm" onClick={open}>
										<TableIcon />
										View {listings.length} listing
										{listings.length === 1 ? '' : 's'}
									</Button>
								)}
							</ListingsModal>

							{hasDates && (
								<Button
									variant="ghost"
									size="sm"
									aria-expanded={chartOpen}
									onClick={() => setChartOpen((v) => !v)}
								>
									{chartOpen ? 'Hide chart' : 'Show chart'}
								</Button>
							)}
						</div>

						{hasDates && chartOpen && (
							<div className="-mx-1 mt-4 border-t border-line pt-4">
								<LineChart listings={listings} />
							</div>
						)}
					</>
				)}
			</div>
		</Panel>
	);
}
