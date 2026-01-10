const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const USE_FILE = path.join(__dirname, '../storage/user.json');

const getUsers = () => {
    try {
        const data = fs.readFileSync(USE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [] };
    }
};

const saveUsers = (data) => {
    fs.writeFileSync(USE_FILE, JSON.stringify(data, null, 2));
};

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get User List
router.get('/', (req, res) => {
    const data = getUsers();
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.lists);
});

// Add Item to List
router.post('/', (req, res) => {
    const { type, status, item } = req.body;
    // item should contain { id, title, image, etc. }

    if (!type || !status || !item || !item.id) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const data = getUsers();
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.lists[type]) {
        return res.status(400).json({ message: 'Invalid type' });
    }
    if (!user.lists[type][status]) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    // Check if already exists in any status for this type
    const statuses = Object.keys(user.lists[type]);
    let exists = false;
    for (const s of statuses) {
        if (user.lists[type][s].find(i => i.id === item.id)) {
            exists = true;
            break;
        }
    }

    if (exists) {
        return res.status(400).json({ message: 'Item already in list' });
    }

    // Add item with added_at timestamp
    const newItem = { ...item, added_at: new Date().toISOString() };
    user.lists[type][status].push(newItem);

    saveUsers(data);
    res.status(201).json({ message: 'Item added to list', item: newItem });
});

// Update Item (Move status or update details)
router.put('/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const { status: newStatus, score, progress } = req.body;

    // Note: To find the item, we need to search all statuses because we don't strictly require oldStatus if we search.
    // However, it's efficient if we know it. Let's search.

    const data = getUsers();
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.lists[type]) return res.status(400).json({ message: 'Invalid type' });

    let item = null;
    let oldStatus = null;
    let itemIndex = -1;

    const statuses = Object.keys(user.lists[type]);
    for (const s of statuses) {
        itemIndex = user.lists[type][s].findIndex(i => i.id == id); // loose equality for string/number id mismatch
        if (itemIndex !== -1) {
            item = user.lists[type][s][itemIndex];
            oldStatus = s;
            break;
        }
    }

    if (!item) return res.status(404).json({ message: 'Item not found in list' });

    // Update fields
    if (score !== undefined) item.score = score;
    if (progress !== undefined) item.progress = progress;

    // Handle Status Change
    if (newStatus && newStatus !== oldStatus) {
        if (!user.lists[type][newStatus]) return res.status(400).json({ message: 'Invalid new status' });

        // Remove from old
        user.lists[type][oldStatus].splice(itemIndex, 1);
        // Add to new
        user.lists[type][newStatus].push(item);
    }

    saveUsers(data);
    res.json({ message: 'Item updated', item });
});

// Delete Item
router.delete('/:type/:id', (req, res) => {
    const { type, id } = req.params;

    const data = getUsers();
    const user = data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.lists[type]) return res.status(400).json({ message: 'Invalid type' });

    let deleted = false;
    const statuses = Object.keys(user.lists[type]);
    for (const s of statuses) {
        const index = user.lists[type][s].findIndex(i => i.id == id);
        if (index !== -1) {
            user.lists[type][s].splice(index, 1);
            deleted = true;
            break;
        }
    }

    if (!deleted) return res.status(404).json({ message: 'Item not found' });

    saveUsers(data);
    res.json({ message: 'Item removed from list' });
});

module.exports = router;
