import express from 'express';
import { returnResults } from '../controllers/fetchResults.mjs';
const searchRouter = express.Router();
let useDb = false;

// Example data to simulate search results
const sampleResults = [
    { title: 'How to Use Express.js', url: 'https://expressjs.com/', snippet: 'Learn about Express.js, a web framework for Node.js.' },
    { title: 'Getting Started with MySQL', url: 'https://dev.mysql.com/doc/', snippet: 'Official MySQL documentation and tutorials.' },
    { title: 'Handlebars.js Guide', url: 'https://handlebarsjs.com/', snippet: 'Comprehensive guide for Handlebars.js, the templating engine.' },
];

searchRouter.get('/search', async (req, res) => {
    let query = req.query.query?.trim().toLowerCase() || ''; // Get and sanitize the query

    if (!query) {
        return res.render('results', { title: 'Search Results', query, results: [], stylesheet: '/css/results.css' });
    }

    try {
        const returned = await returnResults(query);
        const toRet = returned.map(ele => ({
            title: ele.title ? ele.title : ele.url,
            url: ele.url,
            snippet: ele.description ? ele.description : ele.url
        }));

        res.render('results', { title: 'Search Results', query, results: toRet, stylesheet: '/css/results.css' });

    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).render('results', { title: 'Search Results', query, results: [], stylesheet: '/css/results.css' });
    }
});

export default searchRouter;