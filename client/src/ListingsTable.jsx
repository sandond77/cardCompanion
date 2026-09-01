import { useMemo, useState } from 'react';
import { ExternalIcon } from './ui/Icons';

const money = (n) =>
	`$${Number(n).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;

const th = `sticky top-0 z-10 bg-surface-2 px-3 py-2.5 text-[11px] font-semibold
	uppercase tracking-[0.1em] text-ink-faint`;

// How each sortable column compares two listings, ascending.
const COMPARATORS = {
	price: (a, b) => a.price - b.price,
	date: (a, b) => new Date(a.date) - new Date(b.date),
	seller: (a, b) => (a.seller || '').localeCompare(b.seller || '')
};

function SortHeader({ column, label, sort, onSort, className = '' }) {
	const active = sort.key === column;
	return (
		<th className={`${th} ${className}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
			<button
				type="button"
				onClick={() => onSort(column)}
				className={`inline-flex items-center gap-1 uppercase tracking-[0.1em] transition-colors
					hover:text-ink ${active ? 'text-accent' : ''}`}
			>
				{label}
				<span aria-hidden="true" className={active ? 'opacity-100' : 'opacity-30'}>
					{active && sort.dir === 'asc' ? '▲' : '▼'}
				</span>
			</button>
		</th>
	);
}

export default function ListingsTable({ listings, isSold }) {
	// null key = the order the pipeline produced (sold: newest first)
	const [sort, setSort] = useState({ key: null, dir: 'desc' });

	const handleSort = (key) =>
		setSort((prev) =>
			prev.key === key
				? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
				: // Prices open low→high; dates open newest first.
					{ key, dir: key === 'price' ? 'asc' : 'desc' }
		);

	const rows = useMemo(() => {
		if (!sort.key) return listings;
		const compare = COMPARATORS[sort.key];
		const sorted = [...listings].sort(compare);
		return sort.dir === 'asc' ? sorted : sorted.reverse();
	}, [listings, sort]);

	// Colour each price against the set's median so outliers read at a glance
	const median = useMemo(() => {
		if (listings.length === 0) return 0;
		const prices = listings.map((l) => Number(l.price)).sort((a, b) => a - b);
		return prices[Math.floor(prices.length / 2)];
	}, [listings]);

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[36rem] border-collapse text-left">
				<thead>
					<tr className="border-b border-line">
						<th className={`${th} w-10 text-right`}>#</th>
						<th className={th}>Listing</th>
						<SortHeader
							column="price"
							label="Price"
							sort={sort}
							onSort={handleSort}
							className="text-right [&>button]:justify-end [&>button]:w-full"
						/>
						{isSold && (
							<SortHeader
								column="date"
								label="Sold"
								sort={sort}
								onSort={handleSort}
								className="text-right [&>button]:justify-end [&>button]:w-full"
							/>
						)}
						<SortHeader
							column="seller"
							label="Seller"
							sort={sort}
							onSort={handleSort}
							className="text-right [&>button]:justify-end [&>button]:w-full"
						/>
					</tr>
				</thead>
				<tbody>
					{rows.map((listing, index) => {
						const price = Number(listing.price);
						const tone =
							price > median * 1.25
								? 'text-down'
								: price < median * 0.75
									? 'text-up'
									: 'text-ink';

						return (
							<tr
								key={`${listing.id || listing.url}-${index}`}
								className="border-b border-line/50 transition-colors last:border-0 hover:bg-surface-2/60"
							>
								<td className="tnum px-3 py-2.5 text-right text-xs text-ink-faint">
									{index + 1}
								</td>
								<td className="px-3 py-2.5">
									<a
										href={listing.url}
										target="_blank"
										rel="noopener noreferrer"
										className="group inline-flex items-start gap-1.5 text-sm leading-snug
											text-ink-dim transition-colors hover:text-accent"
									>
										<span className="line-clamp-2">{listing.title}</span>
										<ExternalIcon className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
									</a>
								</td>
								<td className={`tnum whitespace-nowrap px-3 py-2.5 text-right text-sm font-medium ${tone}`}>
									{money(price)}
								</td>
								{isSold && (
									<td className="tnum whitespace-nowrap px-3 py-2.5 text-right text-xs text-ink-faint">
										{listing.date || '—'}
									</td>
								)}
								<td className="max-w-[10rem] truncate px-3 py-2.5 text-right text-xs text-ink-faint">
									{listing.seller || '—'}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
