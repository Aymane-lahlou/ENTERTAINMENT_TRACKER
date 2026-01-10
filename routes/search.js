const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const RAWG_API_KEY = process.env.RAWG_API_KEY;

// Base URLs
const JIKAN_URL = 'https://api.jikan.moe/v4';
const TMDB_URL = 'https://api.themoviedb.org/3';
const RAWG_URL = 'https://api.rawg.io/api';

// Search Endpoint
router.get('/:type', async (req, res) => {
    const { type } = req.params;
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        let results = [];

        if (type === 'anime' || type === 'manga' || type === 'novel') {
            // Jikan API
            const jikanType = type === 'novel' ? 'manga' : type;

            // For novel, we search manga endpoint but will filter later
            const params = { q: query, limit: 25 }; // Increase limit to allow for filtering

            const response = await axios.get(`${JIKAN_URL}/${jikanType}`, { params });

            let rawData = response.data.data;

            // MIX: Filter for Novel and Light Novel if searching for 'novel'
            if (type === 'novel') {
                rawData = rawData.filter(item =>
                    item.type === 'Novel' || item.type === 'Light Novel'
                );
            }

            // Standardize output
            results = rawData.map(item => ({
                id: item.mal_id,
                title: item.title,
                image: item.images.jpg.image_url,
                description: item.synopsis,
                type: type, // anime, manga, novel
                score: item.score
            }));


        } else if (type === 'movie' || type === 'series') {
            // TMDB API
            // 'series' -> 'tv' in TMDB
            const tmdbType = type === 'series' ? 'tv' : 'movie';

            const config = {
                params: { query: query }
            };
            if (TMDB_API_KEY.includes('.')) {
                config.headers = { Authorization: `Bearer ${TMDB_API_KEY}` };
            } else {
                config.params.api_key = TMDB_API_KEY;
            }

            const response = await axios.get(`${TMDB_URL}/search/${tmdbType}`, config);

            results = response.data.results.map(item => ({
                id: item.id,
                title: item.title || item.name,
                image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                description: item.overview,
                type: type,
                score: item.vote_average
            }));

        } else if (type === 'game') {
            // RAWG API
            const response = await axios.get(`${RAWG_URL}/games`, {
                params: {
                    key: RAWG_API_KEY,
                    search: query
                }
            });

            results = response.data.results.map(item => ({
                id: item.id,
                title: item.name,
                image: item.background_image,
                description: null, // RAWG search listing often lacks description, need details call for that
                type: 'game',
                score: item.rating // or metacritic
            }));
        } else {
            return res.status(400).json({ message: 'Invalid type' });
        }

        res.json(results);

    } catch (error) {
        console.error('Search Error:', error.message);
        res.status(500).json({ message: 'External API Error' });
    }
});

// Get Details Endpoint (Optional but good for full info)
// ...

// Trending/Popular Endpoint (Local Aggegation from user.json)
router.get('/trending/:type', async (req, res) => {
    const { type } = req.params;
    const fs = require('fs');
    const path = require('path');
    const USE_FILE = path.join(__dirname, '../storage/user.json');

    try {
        // Read local user data
        if (!fs.existsSync(USE_FILE)) {
            return res.json([]);
        }
        const data = JSON.parse(fs.readFileSync(USE_FILE, 'utf8'));
        const users = data.users || [];

        // Aggregate items
        const itemMap = new Map();

        users.forEach(user => {
            if (user.lists && user.lists[type]) { // e.g., user.lists['movies']
                const statusKeys = Object.keys(user.lists[type]); // watching, completed, etc.
                statusKeys.forEach(status => {
                    const items = user.lists[type][status] || [];
                    items.forEach(item => {
                        if (!itemMap.has(item.id)) {
                            // Initialize withitem data and count specific logic if needed
                            // We use the item data as stored by the user
                            itemMap.set(item.id, {
                                ...item,
                                _count: 0
                            });
                        }
                        itemMap.get(item.id)._count++;
                    });
                });
            }
            // Also check favorites if desired, but sticking to lists for now
        });

        // Convert to array and sort by count
        let results = Array.from(itemMap.values());
        results.sort((a, b) => b._count - a._count);

        // Remove the internal _count property before sending (optional but cleaner)
        // results.forEach(r => delete r._count);

        // Limit to top 20
        res.json(results.slice(0, 20));

    } catch (error) {
        console.error('Trending Error:', error.message);
        res.json([]);
    }
});

module.exports = router;

