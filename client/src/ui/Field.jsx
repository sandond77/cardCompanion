const base = `w-full h-10 rounded-md bg-surface-2 border px-3 text-sm text-ink
	placeholder:text-ink-faint transition-colors duration-150
	hover:border-line-bright focus:border-accent focus:outline-none
	focus:ring-2 focus:ring-accent/25`;

function Label({ htmlFor, children, required }) {
	return (
		<label
			htmlFor={htmlFor}
			className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint"
		>
			{children}
			{required && <span className="ml-1 text-accent">*</span>}
		</label>
	);
}

export function TextField({
	id,
	label,
	required,
	invalid,
	className = '',
	...props
}) {
	return (
		<div className={className}>
			<Label htmlFor={id} required={required}>
				{label}
			</Label>
			<input
				id={id}
				required={required}
				aria-invalid={invalid || undefined}
				className={`${base} ${
					invalid ? 'border-down focus:border-down focus:ring-down/25' : 'border-line'
				}`}
				{...props}
			/>
		</div>
	);
}

export function SelectField({
	id,
	label,
	options,
	invalid,
	placeholder = 'Any',
	className = '',
	...props
}) {
	return (
		<div className={className}>
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<select
					id={id}
					aria-invalid={invalid || undefined}
					className={`${base} cursor-pointer appearance-none pr-9 ${
						invalid
							? 'border-down focus:border-down focus:ring-down/25'
							: 'border-line'
					} ${props.value ? 'text-ink' : 'text-ink-faint'}`}
					{...props}
				>
					<option value="">{placeholder}</option>
					{options.map((o) => (
						<option key={o} value={o} className="bg-surface-2 text-ink">
							{o}
						</option>
					))}
				</select>
				<svg
					viewBox="0 0 20 20"
					aria-hidden="true"
					className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
				>
					<path
						d="M6 8l4 4 4-4"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.6"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>
		</div>
	);
}
