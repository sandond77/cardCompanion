export default function Panel({ className = '', children, ...props }) {
	return (
		<section
			className={`rounded-xl border border-line bg-surface/85 backdrop-blur-[2px] ${className}`}
			{...props}
		>
			{children}
		</section>
	);
}

/** Small uppercase eyebrow used above panels and field groups. */
export function Eyebrow({ children, className = '' }) {
	return (
		<h2
			className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint ${className}`}
		>
			{children}
		</h2>
	);
}
