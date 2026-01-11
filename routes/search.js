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
                    item.type === 'Novel' || item.type === 'Light Novel' || item.type === 'Novel'
                );
            }

            // Standardize output
            results = rawData.map(item => ({
                id: item.mal_id,
                title: item.title,
                image: item.images.jpg.image_url,
                description: item.synopsis,
                type: type, // anime, manga, novel
                score: item.score,
                media_type: item.type,
                status: item.status,
                year: item.year,
                episodes: item.episodes,
                chapters: item.chapters,
                volumes: item.volumes,
                rating: item.rating,
                members: item.members,
                start_date: item.aired?.from || item.published?.from || null,
                end_date: item.aired?.to || item.published?.to || null
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
                score: item.vote_average,
                release_date: item.release_date,
                first_air_date: item.first_air_date,
                original_language: item.original_language,
                popularity: item.popularity,
                vote_count: item.vote_count
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
                score: item.rating, // or metacritic
                released: item.released,
                metacritic: item.metacritic,
                ratings_count: item.ratings_count,
                genres: item.genres?.map(genre => genre.name) || [],
                platforms: item.platforms?.map(platform => platform.platform?.name).filter(Boolean) || []
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

// Get Details Endpoint
router.get('/details/:type/:id', async (req, res) => {
    const { type, id } = req.params;

    try {
        let result = null;

        if (type === 'anime' || type === 'manga' || type === 'novel') {
            // Jikan API
            const jikanType = type === 'novel' ? 'manga' : type;
            const response = await axios.get(`${JIKAN_URL}/${jikanType}/${id}/full`);
            const item = response.data.data;

            result = {
                id: item.mal_id,
                title: item.title,
                image: item.images.jpg.large_image_url || item.images.jpg.image_url,
                description: item.synopsis,
                type: type,
                score: item.score,
                status: item.status,
                year: item.year,
                episodes: item.episodes,
                chapters: item.chapters,
                volumes: item.volumes,
                rating: item.rating,
                members: item.members,
                start_date: item.aired?.from || item.published?.from,
                end_date: item.aired?.to || item.published?.to,
                genres: item.genres?.map(g => g.name) || [],
                background: item.background
            };

        } else if (type === 'movie' || type === 'series') {
            // TMDB API
            const tmdbType = type === 'series' ? 'tv' : 'movie';
            const config = { params: {} };

            if (TMDB_API_KEY.includes('.')) {
                config.headers = { Authorization: `Bearer ${TMDB_API_KEY}` };
            } else {
                config.params.api_key = TMDB_API_KEY;
            }

            const response = await axios.get(`${TMDB_URL}/${tmdbType}/${id}`, config);
            const item = response.data;

            result = {
                id: item.id,
                title: item.title || item.name,
                image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                description: item.overview,
                type: type,
                score: item.vote_average,
                status: item.status,
                release_date: item.release_date || item.first_air_date,
                runtime: item.runtime || (item.episode_run_time ? item.episode_run_time[0] : null),
                genres: item.genres?.map(g => g.name) || [],
                seasons: item.number_of_seasons,
                episodes: item.number_of_episodes,
                tagline: item.tagline
            };

        } else if (type === 'game') {
            // RAWG API
            const response = await axios.get(`${RAWG_URL}/games/${id}`, {
                params: { key: RAWG_API_KEY }
            });
            const item = response.data;


            result = {
                id: item.id,
                title: item.name,
                image: item.background_image,
                description: item.description_raw || item.description, // RAWG provides HTML in description
                type: 'game',
                score: item.rating,
                released: item.released,
                metacritic: item.metacritic,
                platforms: item.platforms?.map(p => p.platform.name) || [],
                genres: item.genres?.map(g => g.name) || [],
                developers: item.developers?.map(d => d.name) || [],
                website: item.website
            };
        }

        if (!result) return res.status(404).json({ message: 'Item not found' });

        res.json(result);

    } catch (error) {
        console.error('Details API Error:', error.message);
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ message: 'Item not found externally' });
        }
        res.status(500).json({ message: 'External API Error' });
    }
});

// Trending/Popular Endpoint (External APIs)
router.get('/trending/:type', async (req, res) => {
    const { type } = req.params;
    let results = [];

    try {
        if (type === 'movie' || type === 'series') {
            // TMDB Trending
            const tmdbType = type === 'series' ? 'tv' : 'movie';
            const timeWindow = 'week'; // or 'day'

            const config = {};
            if (TMDB_API_KEY.includes('.')) {
                config.headers = { Authorization: `Bearer ${TMDB_API_KEY}` };
            } else {
                config.params = { api_key: TMDB_API_KEY };
            }

            const response = await axios.get(`${TMDB_URL}/trending/${tmdbType}/${timeWindow}`, config);

            results = response.data.results.map(item => ({
                id: item.id,
                title: item.title || item.name,
                image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                description: item.overview,
                type: type,
                score: item.vote_average,
                release_date: item.release_date,
                first_air_date: item.first_air_date,
                original_language: item.original_language,
                popularity: item.popularity,
                vote_count: item.vote_count
            }));

        } else if (type === 'anime') {
            // Jikan Top Anime
            const response = await axios.get(`${JIKAN_URL}/top/anime`);
            results = response.data.data.map(item => ({
                id: item.mal_id,
                title: item.title,
                image: item.images.jpg.image_url,
                description: item.synopsis,
                type: 'anime',
                score: item.score,
                media_type: item.type,
                status: item.status,
                year: item.year,
                episodes: item.episodes,
                rating: item.rating,
                members: item.members,
                start_date: item.aired?.from || null,
                end_date: item.aired?.to || null
            }));

        } else if (type === 'manga' || type === 'novel') {
            // Jikan Top Manga
            let filter = type === 'novel' ? '?type=lightnovel' : '';
            // Note: Jikan v4 /top/manga accepts 'type' query param
            // Correct param for novel might be 'lightnovel' or filter in post-processing if query param not supported perfectly for top

            const config = { params: {} };
            if (type === 'novel') config.params.type = 'lightnovel';

            const response = await axios.get(`${JIKAN_URL}/top/manga`, config);

            results = response.data.data.map(item => ({
                id: item.mal_id,
                title: item.title,
                image: item.images.jpg.image_url,
                description: item.synopsis,
                type: type,
                score: item.score,
                media_type: item.type,
                status: item.status,
                year: item.year,
                chapters: item.chapters,
                volumes: item.volumes,
                members: item.members,
                start_date: item.published?.from || null,
                end_date: item.published?.to || null
            }));

        } else if (type === 'game') {
            // RAWG Top Games
            const response = await axios.get(`${RAWG_URL}/games`, {
                params: {
                    key: RAWG_API_KEY,
                    ordering: '-added', // popular
                    page_size: 20
                }
            });

            results = response.data.results.map(item => ({
                id: item.id,
                title: item.name,
                image: item.background_image,
                description: null,
                type: 'game',
                score: item.rating,
                released: item.released,
                metacritic: item.metacritic,
                ratings_count: item.ratings_count,
                genres: item.genres?.map(genre => genre.name) || [],
                platforms: item.platforms?.map(platform => platform.platform?.name).filter(Boolean) || []
            }));
        }

        res.json(results.slice(0, 20));

    } catch (error) {
        console.error('Trending API Error:', error.message);
        // Fallback or empty
        res.json([]);
    }
});

module.exports = router;
