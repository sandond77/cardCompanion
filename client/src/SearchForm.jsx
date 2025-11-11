import { FormControl, Box, TextField, Grid, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import React, { useState } from 'react';

export default function SearchForm({
	handleSubmit,
	setQueryTerm,
	resetStates
}) {
	const [formData, setFormData] = useState({
		grade: '',
		cardName: '',
		cardNumber: '',
		cardRarity: '',
		cardGame: '',
		cardLanguage: '',
		setName: '',
		additionalDetail: ''
	});

	const handleReset = (event) => {
		event.preventDefault();
		// console.log('reset hit');
		setFormData({
			grade: '',
			cardName: '',
			cardNumber: '',
			cardRarity: '',
			cardGame: '',
			cardLanguage: '',
			setName: '',
			additionalDetail: ''
		});
		resetStates();
	};

	const handleChange = (event) => {
		setFormData((prevData) => ({
			...prevData,
			[event.target.name]: event.target.value
		}));
	};

	const submitForm = (event) => {
		event.preventDefault();
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
					/>
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
				<Grid size={{ xs: 12, md: 4 }}>
					<TextField
						id="cardRarity"
						name="cardRarity"
						label="Card Rarity"
						fullWidth
						value={formData.cardRarity}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
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
				<Grid size={{ xs: 12, md: 4 }}>
					<TextField
						id="cardLanguage"
						name="cardLanguage"
						label="Language"
						fullWidth
						value={formData.cardLanguage}
						onChange={handleChange}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
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
