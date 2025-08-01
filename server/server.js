import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //allows express to parse json)

app.use('/api', apiRoutes);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
