import { useCallback, useState } from 'react';
import Modal from './ui/Modal';
import ListingsTable from './ListingsTable.jsx';

export default function ListingsModal({ listings, label, isSold, children }) {
	const [open, setOpen] = useState(false);
	const handleOpen = useCallback(() => setOpen(true), []);
	const handleClose = useCallback(() => setOpen(false), []);

	return (
		<>
			{children(handleOpen)}

			<Modal
				open={open}
				onClose={handleClose}
				title={label}
				subtitle={`${listings.length} ${isSold ? 'sold' : 'active'} listing${
					listings.length === 1 ? '' : 's'
				}`}
			>
				<ListingsTable listings={listings} isSold={isSold} />
			</Modal>
		</>
	);
}
