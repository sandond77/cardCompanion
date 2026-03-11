import {
	Box,
	TextField,
	Grid,
	Button,
	MenuItem,
	Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useState } from 'react';

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'];

export default function SearchForm({
	handleSubmit,
	setQueryTerm,
	resetStates
}) {
	const [formData, setFormData] = useState({
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
	});

	const [conflictError, setConflictError] = useState(false);

	const handleReset = (event) => {
		event.preventDefault();
		setFormData({
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
		});
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

	return (
		<Box component="form" autoComplete="off" onSubmit={submitForm}>
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, md: 2 }}>
					<TextField
						id="grade"
						label="Grade"
						name="grade"
						fullWidth
						value={formData.grade}
						onChange={handleChange}
						error={conflictError}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 2 }}>
					<TextField
						select
						id="condition"
						label="Condition"
						name="condition"
						fullWidth
						value={formData.condition}
						onChange={handleChange}
						error={conflictError}
					>
						<MenuItem value=""><em>None</em></MenuItem>
						{CONDITIONS.map((c) => (
							<MenuItem key={c} value={c}>{c}</MenuItem>
						))}
					</TextField>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<TextField
						required
						id="cardName"
						name="cardName"
						label="Card Name"
						fullWidth
						value={formData.cardName}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 2 }}>
					<TextField
						id="cardNumber"
						name="cardNumber"
						label="Card Number"
						fullWidth
						value={formData.cardNumber}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 2 }}>
					<TextField
						id="cardRarity"
						name="cardRarity"
						label="Card Rarity"
						fullWidth
						value={formData.cardRarity}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 1 }}>
					<TextField
						id="year"
						name="year"
						label="Year"
						fullWidth
						value={formData.year}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<TextField
						required
						id="cardGame"
						name="cardGame"
						label="Card Game"
						fullWidth
						value={formData.cardGame}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<TextField
						id="cardLanguage"
						name="cardLanguage"
						label="Language"
						fullWidth
						value={formData.cardLanguage}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 5 }}>
					<TextField
						id="additionalDetail"
						name="additionalDetail"
						label="Additional Detail"
						fullWidth
						value={formData.additionalDetail}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12 }}>
					<TextField
						id="set"
						name="setName"
						label="Set Name"
						fullWidth
						value={formData.setName}
						onChange={handleChange}
					/>
				</Grid>
				{conflictError && (
					<Grid size={{ xs: 12 }}>
						<Alert severity="error">
							Grade and Condition cannot both be filled — they are mutually exclusive. Please clear one before searching.
						</Alert>
					</Grid>
				)}
			</Grid>
			<Button
				variant="contained"
				type="submit"
				endIcon={<SearchIcon />}
				sx={{ my: 2 }}
			>
				Search
			</Button>
			<Button
				variant="contained"
				endIcon={<ClearIcon />}
				color="error"
				sx={{ m: 2 }}
				onClick={handleReset}
			>
				Reset
			</Button>
		</Box>
	);
}
