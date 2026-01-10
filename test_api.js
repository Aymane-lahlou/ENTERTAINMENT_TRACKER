const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function test() {
    try {
        console.log('--- Registering User ---');
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                username: 'tester',
                email: 'tester@test.com',
                password: 'password123'
            });
            console.log('User registered.');
        } catch (e) {
            if (e.response.status === 400 && e.response.data.message === 'User already exists') {
                console.log('User already exists, proceeding...');
            } else {
                throw e;
            }
        }

        console.log('--- Logging In ---');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'tester@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token received.');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('--- Searching Anime ---');
        const searchRes = await axios.get(`${BASE_URL}/search/anime?query=Naruto`, config);
        const anime = searchRes.data[0];
        console.log(`Found anime: ${anime.title} (ID: ${anime.id})`);

        console.log('--- Adding to List ---');
        await axios.post(`${BASE_URL}/list`, {
            type: 'animes',
            status: 'plan_to_watch',
            item: anime
        }, config);
        console.log('Added to plan_to_watch.');

        console.log('--- Getting List ---');
        let listRes = await axios.get(`${BASE_URL}/list`, config);
        let ptw = listRes.data.animes.plan_to_watch;
        console.log('Plan to watch count:', ptw.length);

        console.log('--- Updating Item (Move to Watching) ---');
        await axios.put(`${BASE_URL}/list/animes/${anime.id}`, {
            status: 'watching',
            score: 8
        }, config);
        console.log('Moved to watching.');

        // Verify update
        listRes = await axios.get(`${BASE_URL}/list`, config);
        const watching = listRes.data.animes.watching;
        const found = watching.find(i => i.id == anime.id); // check ID loosely
        if (found) {
            console.log(`Item in watching list with score: ${found.score}`);
        } else {
            console.error('Item NOT found in watching list!');
        }

        console.log('--- Deleting Item ---');
        await axios.delete(`${BASE_URL}/list/animes/${anime.id}`, config);
        console.log('Item deleted.');

        console.log('--- TEST PASSED ---');

    } catch (error) {
        console.error('TEST FAILED:', error.response ? error.response.data : error.message);
    }
}

test();
