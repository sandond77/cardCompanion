import { useState } from 'react';
import SearchForm from './SearchForm';
import Results from './Results';
import Panel from './ui/Panel';
import { AlertIcon, SearchIcon } from './ui/Icons';
import { buildQuery, fetchListings } from './utils/utils';
import { SOLD_ENABLED } from './config';

const EMPTY_RESULTS = {
	auc: [],
	bin: [],
	aucSold: [],
	binSold: []
};

const EMPTY_STATS = {
	auc: null,
	bin: null,
	aucSold: null,
	binSold: null
};

function App() {
	const [searchStatus, setSearchStatus] = useState(false);
	const [queryTerm, setQueryTerm] = useState('');
	const [conditionNote, setConditionNote] = useState('');
	const [listings, setListings] = useState(EMPTY_RESULTS);
	const [stats, setStats] = useState(EMPTY_STATS);
	const [loadingActive, setLoadingActive] = useState(false);
	const [loadingSold, setLoadingSold] = useState(false);
	const [errors, setErrors] = useState({ active: null, sold: null });

	function resetStates() {
		setQueryTerm('');
		setConditionNote('');
		setSearchStatus(false);
		setListings(EMPTY_RESULTS);
		setStats(EMPTY_STATS);
		setErrors({ active: null, sold: null });
	}

	/** Fold one source's buckets into the listings/stats state. */
	function applyResult(result) {
		setListings((prev) => ({
			...prev,
			...Object.fromEntries(
				Object.entries(result).map(([k, v]) => [k, v.listings])
			)
		}));
		setStats((prev) => ({
			...prev,
			...Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.stats]))
		}));
	}

	const handleSubmit = (formData) => {
		resetStates();

		const query = buildQuery(formData);
		setQueryTerm(query);
		setConditionNote(formData.condition || '');
		setSearchStatus(true);

		// Active and sold run independently — active lands first, the scrape is
		// slow, and neither should block the other's panels from rendering.
		const run = (source, setLoading, fallbackMessage) => {
			setLoading(true);
			fetchListings(source, query, formData)
				.then(applyResult)
				.catch((err) => {
					console.error(`${source} fetch failed:`, err);
					setErrors((prev) => ({
						...prev,
						// Prefer the server's explanation over axios's generic
						// "Request failed with status code 500".
						[source]:
							err?.response?.data?.error || err?.message || fallbackMessage
					}));
				})
				.finally(() => setLoading(false));
		};

		run('active', setLoadingActive, 'Could not reach the eBay search API.');
		if (SOLD_ENABLED) {
			run('sold', setLoadingSold, 'The sold-listings scrape failed.');
		}
	};

	const busy = loadingActive || loadingSold;

	const panels = [
		{ key: 'auc', label: 'Active Auction', kind: 'active', loading: loadingActive },
		{ key: 'bin', label: 'Active BIN', kind: 'active', loading: loadingActive },
		...(SOLD_ENABLED
			? [
					{ key: 'aucSold', label: 'Sold Auction', kind: 'sold', loading: loadingSold },
					{ key: 'binSold', label: 'Sold BIN', kind: 'sold', loading: loadingSold }
				]
			: [])
	];

	return (
		<div className="min-h-screen">
			{/* ── Masthead ─────────────────────────────────────────────────── */}
			<header className="sticky top-0 z-20 border-b border-line bg-ground/85 backdrop-blur-md">
				<div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
					<div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 ring-1 ring-accent/30">
						<svg viewBox="0 0 20 20" className="h-4 w-4 text-accent" aria-hidden="true">
							<path
								d="M3 14.5l4-4.5 3.5 3L17 5.5"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
					<h1 className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
						CardCompanion
					</h1>
					<span className="hidden text-xs text-ink-faint sm:block">
						eBay comps for card sellers
					</span>
					{busy && (
						<span className="ml-auto flex items-center gap-2 text-xs text-accent">
							<span className="h-1.5 w-1.5 animate-ping rounded-full bg-accent" />
							{loadingActive && loadingSold
								? 'Fetching listings…'
								: loadingSold
									? 'Scraping sold data…'
									: 'Loading listings…'}
						</span>
					)}
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
				<SearchForm
					handleSubmit={handleSubmit}
					setQueryTerm={setQueryTerm}
					resetStates={resetStates}
					busy={busy}
				/>

				{!searchStatus ? (
					/* ── Empty state ──────────────────────────────────────────── */
					<div className="mt-16 flex flex-col items-center text-center">
						<div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface">
							<SearchIcon className="h-5 w-5 text-ink-faint" />
						</div>
						<p className="mt-4 text-sm font-medium text-ink-dim">
							No search yet
						</p>
						<p className="mt-1.5 max-w-[42ch] text-xs leading-relaxed text-ink-faint">
							Fill in a card name and game above. CardCompanion pulls current
							asking prices from the eBay API
							{SOLD_ENABLED
								? ' and sold comps from completed listings, then breaks both out'
								: ', broken out'}{' '}
							by auction and Buy&nbsp;It&nbsp;Now.
						</p>
					</div>
				) : (
					<>
						{/* ── Resolved query ───────────────────────────────────── */}
						<Panel className="mt-6 px-5 py-4 sm:px-6">
							<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
								<span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
									Query
								</span>
								<code className="tnum text-sm text-accent">{queryTerm}</code>
								{conditionNote && (
									<span className="rounded border border-line-bright bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-dim">
										Condition: {conditionNote}
									</span>
								)}
							</div>
						</Panel>

						{/* ── Fetch failures ───────────────────────────────────── */}
						{(errors.active || errors.sold) && (
							<div className="mt-4 space-y-2">
								{errors.active && (
									<ErrorBanner scope="Active listings" message={errors.active} />
								)}
								{errors.sold && (
									<ErrorBanner scope="Sold listings" message={errors.sold} />
								)}
							</div>
						)}

						{/* ── 2×2 results grid ─────────────────────────────────── */}
						<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
							{panels.map((p) => (
								<Results
									key={p.key}
									label={p.label}
									kind={p.kind}
									listingsArray={listings[p.key]}
									statsObject={stats[p.key]}
									loading={p.loading}
								/>
							))}
						</div>

					</>
				)}
			</main>

			<footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6">
				<p className="text-[11px] text-ink-faint">
					Prices are USD listings pulled from eBay at search time.
					{SOLD_ENABLED &&
						' Sold data is scraped from completed listings and may lag.'}
				</p>
			</footer>
		</div>
	);
}

function ErrorBanner({ scope, message }) {
	return (
		<div
			role="alert"
			className="flex items-start gap-2.5 rounded-lg border border-down/40 bg-down/10 px-4 py-3"
		>
			<AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-down" />
			<p className="text-xs leading-relaxed text-down">
				<strong className="font-semibold">{scope} failed.</strong> {message}
			</p>
		</div>
	);
}

export default App;
