const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const USE_FILE = path.join(__dirname, '../storage/user.json');

// Helper to read users
const getUsers = () => {
    try {
        const data = fs.readFileSync(USE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [] };
    }
};

// Helper to write users
const saveUsers = (data) => {
    fs.writeFileSync(USE_FILE, JSON.stringify(data, null, 2));
};

// Signup
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const data = getUsers();

    // Ensure users array exists
    if (!data.users) data.users = [];

    const userExists = data.users.find(u => u.email === email || u.username === username);
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now(),
        username,
        email,
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
        profile_picture: "/assets/default_profile.png", // Default image
        lists: {
            movies: { watching: [], completed: [], on_hold: [], dropped: [], plan_to_watch: [] },
            series: { watching: [], completed: [], on_hold: [], dropped: [], plan_to_watch: [] },
            animes: { watching: [], completed: [], on_hold: [], dropped: [], plan_to_watch: [] },
            manga: { reading: [], completed: [], on_hold: [], dropped: [], plan_to_read: [] },
            novels: { reading: [], completed: [], on_hold: [], dropped: [], plan_to_read: [] },
            games: { playing: [], completed: [], on_hold: [], dropped: [], plan_to_play: [] }
        },
        favorites: { movies: [], series: [], animes: [], manga: [], novels: [], games: [] },
        progress: { movies: {}, series: {}, animes: {}, manga: {}, novels: {}, games: {} }
    };

    data.users.push(newUser);
    saveUsers(data);

    res.status(201).json({ message: 'User created successfully' });
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const data = getUsers();

    const user = data.users?.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

module.exports = router;
