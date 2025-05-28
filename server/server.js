const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

// In-memory user storage (replace with database in production)
const users = new Map();

// Добавляем тестового пользователя с дополнительными данными
users.set('nevagn0', {
    password: '$2b$10$YourHashedPasswordHere', // Это хэш пароля
    profile: {
        fullName: 'Иван Иванов',
        email: 'ivan@example.com',
        joinDate: '2024-03-20',
        lastLogin: new Date().toISOString(),
        preferences: {
            theme: 'light',
            notifications: true
        }
    }
});

// Cache implementation
const cache = {
    data: null,
    timestamp: null,
    TTL: 60000, // 1 minute in milliseconds

    isValid() {
        return this.data && this.timestamp && (Date.now() - this.timestamp < this.TTL);
    },

    set(data) {
        this.data = data;
        this.timestamp = Date.now();
    },

    get() {
        return this.isValid() ? this.data : null;
    }
};

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (users.has(username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        users.set(username, { password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = users.get(username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = username;
        res.json({ message: 'Logged in successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error during login' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

app.get('/profile', requireAuth, (req, res) => {
    const user = users.get(req.session.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        username: req.session.userId,
        profile: user.profile || {
            fullName: 'Новый пользователь',
            email: 'email@example.com',
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true
            }
        }
    });
});

app.get('/data', requireAuth, (req, res) => {
    const cachedData = cache.get();
    if (cachedData) {
        return res.json(cachedData);
    }

    // Generate new data
    const newData = {
        timestamp: new Date().toISOString(),
        message: 'This is cached data',
        random: Math.random()
    };

    cache.set(newData);
    res.json(newData);
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

// API endpoints
app.get('/api/profile', requireAuth, (req, res) => {
    const user = users.get(req.session.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        username: req.session.userId,
        profile: user.profile || {
            fullName: 'Новый пользователь',
            email: 'email@example.com',
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 