// Inline replacements for the handful of @mui/icons-material glyphs we used.
const stroke = {
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.7,
	strokeLinecap: 'round',
	strokeLinejoin: 'round'
};

function Svg({ children, className = 'h-4 w-4' }) {
	return (
		<svg viewBox="0 0 20 20" className={className} aria-hidden="true">
			{children}
		</svg>
	);
}

export const SearchIcon = (p) => (
	<Svg {...p}>
		<circle cx="9" cy="9" r="5.5" {...stroke} />
		<path d="M13.2 13.2L17 17" {...stroke} />
	</Svg>
);

export const ClearIcon = (p) => (
	<Svg {...p}>
		<path d="M5 5l10 10M15 5L5 15" {...stroke} />
	</Svg>
);

export const TableIcon = (p) => (
	<Svg {...p}>
		<rect x="2.75" y="3.75" width="14.5" height="12.5" rx="1.5" {...stroke} />
		<path d="M2.75 8h14.5M7.75 8v8.25" {...stroke} />
	</Svg>
);

export const ExternalIcon = (p) => (
	<Svg {...p}>
		<path d="M11 3h6v6M17 3l-7.5 7.5" {...stroke} />
		<path d="M15 12.5V16a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 013 16V7a1.5 1.5 0 011.5-1.5H8" {...stroke} />
	</Svg>
);

export const AlertIcon = (p) => (
	<Svg {...p}>
		<circle cx="10" cy="10" r="7.25" {...stroke} />
		<path d="M10 6.25v4.5M10 13.5v.01" {...stroke} />
	</Svg>
);
