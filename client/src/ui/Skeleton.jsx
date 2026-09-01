/** Placeholder rows shaped like the stats they replace, so the panel doesn't
 *  jump when real numbers land. */
export default function StatsSkeleton() {
	return (
		<div className="animate-pulse space-y-3" aria-hidden="true">
			<div className="h-9 w-32 rounded bg-surface-2" />
			<div className="space-y-2 pt-1">
				{[0, 1, 2].map((i) => (
					<div key={i} className="flex items-center justify-between gap-4">
						<div className="h-3 w-20 rounded bg-surface-2" />
						<div className="h-3 w-16 rounded bg-surface-2" />
					</div>
				))}
			</div>
		</div>
	);
}
