const VARIANTS = {
	primary:
		'bg-accent text-ground hover:bg-sky-300 active:bg-sky-400 border-transparent font-semibold',
	ghost:
		'bg-transparent text-ink-dim hover:text-ink hover:bg-surface-2 border-line hover:border-line-bright',
	danger:
		'bg-transparent text-down/90 hover:text-down hover:bg-down/10 border-down/30 hover:border-down/60'
};

const SIZES = {
	sm: 'h-8 px-3 text-xs gap-1.5',
	md: 'h-10 px-4 text-sm gap-2'
};

export default function Button({
	variant = 'primary',
	size = 'md',
	className = '',
	children,
	...props
}) {
	return (
		<button
			className={`inline-flex items-center justify-center rounded-md border tracking-wide
				transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40
				${VARIANTS[variant]} ${SIZES[size]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
