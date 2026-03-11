import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function ListingsTable({ listings }) {
	return (
		<TableContainer component={Paper}>
			<Table sx={{ width: 'min(90vw, 800px)' }} aria-label="simple table">
				<TableHead>
					<TableRow>
						<TableCell>#</TableCell>
						<TableCell>Listing</TableCell>
						<TableCell align="right">Price</TableCell>
						{listings[0].date && <TableCell align="right">Sold Date</TableCell>}
						<TableCell align="right">Seller</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{listings &&
						listings.map((listing, index) => (
							<TableRow
								key={`${listing.id}-${index}`}
								sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
							>
								<TableCell>{index + 1}</TableCell>
								<TableCell component="th" scope="row">
									<a href={listing.url} target="_blank">
										{listing.title}
									</a>
								</TableCell>
								<TableCell align="right">${listing.price}</TableCell>
								{listing.date && (
									<TableCell align="right">{listing.date}</TableCell>
								)}
								<TableCell align="right">{listing.seller}</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
