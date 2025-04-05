import express from 'express';
const searchRouter = express.Router();

// Example data to simulate search results
const sampleResults = [
    { title: 'How to Use Express.js', url: 'https://expressjs.com/', snippet: 'Learn about Express.js, a web framework for Node.js.' },
    { title: 'Getting Started with MySQL', url: 'https://dev.mysql.com/doc/', snippet: 'Official MySQL documentation and tutorials.' },
    { title: 'Handlebars.js Guide', url: 'https://handlebarsjs.com/', snippet: 'Comprehensive guide for Handlebars.js, the templating engine.' },
];

searchRouter.get('/search', (req, res) => {
    const query = req.query.query || ''; // Get the search query from the URL parameters

    if (query) {
        // Filter the results based on the query
        const results = sampleResults.filter(result =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.snippet.toLowerCase().includes(query.toLowerCase())
        );

        res.render('results', { title: 'Search Results', query, results, stylesheet: '/css/results.css'});
    } else {
        // Render the search page with no results if no query is provided
        res.render('results', { title: 'Search Results', query, results: [], stylesheet: '/css/results.css' 
        });
    }
});

export default searchRouter;