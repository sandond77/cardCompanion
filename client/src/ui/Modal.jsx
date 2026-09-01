import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
	'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, subtitle, children }) {
	const panelRef = useRef(null);
	const restoreRef = useRef(null);
	const titleId = useId();

	useEffect(() => {
		if (!open) return;

		restoreRef.current = document.activeElement;
		const { overflow } = document.body.style;
		document.body.style.overflow = 'hidden';
		panelRef.current?.focus();

		const onKeyDown = (e) => {
			if (e.key === 'Escape') {
				onClose();
				return;
			}
			// Keep tabbing inside the dialog
			if (e.key !== 'Tab') return;
			const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
			if (!nodes?.length) return;
			const first = nodes[0];
			const last = nodes[nodes.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		};

		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.body.style.overflow = overflow;
			restoreRef.current?.focus?.();
		};
	}, [open, onClose]);

	if (!open) return null;

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="absolute inset-0 bg-ground/80 backdrop-blur-sm" />

			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				tabIndex={-1}
				className="animate-scale-in relative flex max-h-[85vh] w-full max-w-4xl flex-col
					overflow-hidden rounded-xl border border-line-bright bg-surface
					shadow-2xl shadow-black/60 focus:outline-none"
			>
				<header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
					<div className="min-w-0">
						<h2
							id={titleId}
							className="text-sm font-semibold uppercase tracking-[0.1em] text-ink"
						>
							{title}
						</h2>
						{subtitle && (
							<p className="mt-0.5 truncate text-xs text-ink-faint">{subtitle}</p>
						)}
					</div>
					<button
						onClick={onClose}
						aria-label="Close"
						className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-ink-faint
							transition-colors hover:bg-surface-2 hover:text-ink"
					>
						<svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
							<path
								d="M5 5l10 10M15 5L5 15"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.6"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-auto">{children}</div>
			</div>
		</div>,
		document.body
	);
}
