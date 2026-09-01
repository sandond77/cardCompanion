import { useState } from 'react';
import { TextField, SelectField } from './ui/Field';
import Button from './ui/Button';
import Panel, { Eyebrow } from './ui/Panel';
import { SearchIcon, ClearIcon, AlertIcon } from './ui/Icons';

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'];

const EMPTY = {
	grade: '',
	condition: '',
	cardName: '',
	cardNumber: '',
	cardRarity: '',
	cardGame: '',
	cardLanguage: '',
	year: '',
	additionalDetail: '',
	setName: ''
};

export default function SearchForm({
	handleSubmit,
	setQueryTerm,
	resetStates,
	busy
}) {
	const [formData, setFormData] = useState(EMPTY);
	const [conflictError, setConflictError] = useState(false);

	const handleReset = (event) => {
		event.preventDefault();
		setFormData(EMPTY);
		setConflictError(false);
		resetStates();
	};

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prevData) => {
			const updated = { ...prevData, [name]: value };
			setConflictError(!!updated.grade && !!updated.condition);
			return updated;
		});
	};

	const submitForm = (event) => {
		event.preventDefault();
		if (formData.grade && formData.condition) {
			setConflictError(true);
			return;
		}
		setQueryTerm('');
		handleSubmit(formData);
	};

	const field = (name, label, extra = {}) => ({
		id: name,
		name,
		label,
		value: formData[name],
		onChange: handleChange,
		...extra
	});

	return (
		<Panel className="overflow-hidden">
			<form autoComplete="off" onSubmit={submitForm}>
				{/* ── Condition: the two mutually exclusive paths ──────────────── */}
				<div className="border-b border-line px-5 py-4 sm:px-6">
					<Eyebrow className="mb-3">Condition — pick one path</Eyebrow>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
						<TextField
							{...field('grade', 'Graded', { placeholder: 'e.g. PSA 10' })}
							invalid={conflictError}
						/>
						<div className="flex items-center justify-center pb-1 sm:pt-6">
							<span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
								or
							</span>
						</div>
						<SelectField
							{...field('condition', 'Raw')}
							options={CONDITIONS}
							invalid={conflictError}
							placeholder="Any condition"
						/>
					</div>

					{conflictError && (
						<div
							role="alert"
							className="mt-3 flex items-start gap-2.5 rounded-md border border-down/40
								bg-down/10 px-3 py-2.5 text-xs leading-relaxed text-down"
						>
							<AlertIcon className="mt-px h-4 w-4 shrink-0" />
							<span>
								<strong className="font-semibold">Grade and Condition are mutually exclusive.</strong>{' '}
								A card is either professionally graded or raw — clear one before
								searching.
							</span>
						</div>
					)}
				</div>

				{/* ── Card identity ────────────────────────────────────────────── */}
				<div className="border-b border-line px-5 py-4 sm:px-6">
					<Eyebrow className="mb-3">Card</Eyebrow>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-12">
						<TextField
							{...field('cardName', 'Card Name', { required: true })}
							className="col-span-2 sm:col-span-5"
						/>
						<TextField
							{...field('cardNumber', 'Number', { placeholder: '074' })}
							className="sm:col-span-2"
						/>
						<TextField
							{...field('cardRarity', 'Rarity', { placeholder: 'CHR' })}
							className="sm:col-span-3"
						/>
						<TextField {...field('year', 'Year')} className="sm:col-span-2" />
					</div>
				</div>

				{/* ── Set & printing ───────────────────────────────────────────── */}
				<div className="px-5 py-4 sm:px-6">
					<Eyebrow className="mb-3">Set &amp; printing</Eyebrow>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-12">
						<TextField
							{...field('cardGame', 'Game', { required: true, placeholder: 'Pokemon' })}
							className="col-span-2 sm:col-span-4"
						/>
						<TextField
							{...field('cardLanguage', 'Language', { placeholder: 'Japanese' })}
							className="sm:col-span-4"
						/>
						<TextField
							{...field('setName', 'Set Name')}
							className="sm:col-span-4"
						/>
						<TextField
							{...field('additionalDetail', 'Additional Detail', {
								placeholder: 'holo, 1st edition, promo…'
							})}
							className="col-span-2 sm:col-span-12"
						/>
					</div>
				</div>

				{/* ── Actions ──────────────────────────────────────────────────── */}
				<div className="flex items-center gap-3 border-t border-line bg-surface-2/40 px-5 py-3.5 sm:px-6">
					<Button type="submit" disabled={busy}>
						<SearchIcon />
						{busy ? 'Searching…' : 'Search'}
					</Button>
					<Button type="button" variant="danger" onClick={handleReset}>
						<ClearIcon />
						Reset
					</Button>
					<p className="ml-auto hidden text-xs text-ink-faint sm:block">
						<span className="text-accent">*</span> required
					</p>
				</div>
			</form>
		</Panel>
	);
}
