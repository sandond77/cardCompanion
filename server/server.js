import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 3001;
const app = express();

// Extra production origins come from CLIENT_ORIGIN (comma-separated), so a new
// deploy target only needs an env var rather than a code change.
const allowedOrigins = [
	'http://localhost:3000',
	'http://localhost:3001',
	'http://localhost:5173',
	'https://cardcompanion.onrender.com',
	...(process.env.CLIENT_ORIGIN || '')
		.split(',')
		.map((o) => o.trim())
		.filter(Boolean)
];

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
