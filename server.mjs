import express from 'express';
import dotenv from 'dotenv';
import { create } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import searchRouter from './src/routes/searchResults.mjs';

// Load environment variables from .env file
dotenv.config();

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // Use PORT from .env or default to 3000

// Set up Handlebars
const hbs = create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));


// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


// Routes
app.use('/', searchRouter);

app.get('/', (req, res) => {
    res.render('home', { siteTitle: 'YouSearch', stylesheet: '/css/main.css'}); // Pass dynamic data
  });

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
