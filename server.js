const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Database helper
const dbPath = path.join(__dirname, 'db.json');

function readDB() {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// API Routes
app.post('/api/register', (req, res) => {
    const { fullname, country, username, password } = req.body;
    const db = readDB();
    
    const existingUser = db.users.find(u => u.username === username);
    if (existingUser) {
        return res.json({ success: false, message: 'Username already exists' });
    }
    
    const newUser = {
        id: Date.now().toString(),
        fullname,
        country,
        username,
        password,
        approved: false,
        isAdmin: false,
        createdAt: new Date().toISOString()
    };
    
    db.pending_users.push(newUser);
    writeDB(db);
    
    res.json({ success: true, message: 'Registration submitted for approval' });
});

app.post('/api/login', (req, res) => {
    const { username, password, securityAnswer } = req.body;
    
    if (securityAnswer !== '7') {
        return res.json({ success: false, message: 'Security check failed!' });
    }
    
    const db = readDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!user.approved && !user.isAdmin) {
        return res.json({ success: false, message: 'Account pending approval' });
    }
    
    res.json({ 
        success: true, 
        user: { 
            username: user.username, 
            isAdmin: user.isAdmin || false,
            fullname: user.fullname 
        } 
    });
});

app.post('/api/approve-user', (req, res) => {
    const { userId, adminUsername } = req.body;
    const db = readDB();
    
    const admin = db.users.find(u => u.username === adminUsername && u.isAdmin);
    if (!admin) {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    const pendingIndex = db.pending_users.findIndex(u => u.id === userId);
    if (pendingIndex === -1) {
        return res.json({ success: false, message: 'User not found' });
    }
    
    const user = db.pending_users[pendingIndex];
    user.approved = true;
    db.users.push(user);
    db.pending_users.splice(pendingIndex, 1);
    writeDB(db);
    
    res.json({ success: true });
});

app.post('/api/reject-user', (req, res) => {
    const { userId, adminUsername } = req.body;
    const db = readDB();
    
    const admin = db.users.find(u => u.username === adminUsername && u.isAdmin);
    if (!admin) {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    db.pending_users = db.pending_users.filter(u => u.id !== userId);
    writeDB(db);
    
    res.json({ success: true });
});

app.get('/api/get-pending', (req, res) => {
    const db = readDB();
    res.json({ pending: db.pending_users });
});

app.get('/api/get-users', (req, res) => {
    const db = readDB();
    res.json({ users: db.users.filter(u => !u.isAdmin) });
});

app.post('/api/add-number', (req, res) => {
    const { number, country, adminUsername } = req.body;
    const db = readDB();
    
    const admin = db.users.find(u => u.username === adminUsername && u.isAdmin);
    if (!admin) {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    const newNumber = {
        id: Date.now().toString(),
        number,
        country,
        available: true,
        createdAt: new Date().toISOString()
    };
    
    db.numbers.push(newNumber);
    writeDB(db);
    
    res.json({ success: true });
});

app.get('/api/get-numbers', (req, res) => {
    const db = readDB();
    res.json({ numbers: db.numbers });
});

app.post('/api/update-bot-config', (req, res) => {
    const { botToken, otpGroupId, ownerChatId, mainChannelLink, numbersChannelLink } = req.body;
    const db = readDB();
    
    db.bot_config = {
        ...db.bot_config,
        botToken,
        otpGroupId,
        ownerChatId,
        mainChannelLink,
        numbersChannelLink
    };
    
    writeDB(db);
    res.json({ success: true });
});

app.get('/api/get-bot-config', (req, res) => {
    const db = readDB();
    res.json({ config: db.bot_config });
});

app.post('/api/forward-otp', async (req, res) => {
    const { country, service, number, otp, message, maskedNumber, flag } = req.body;
    const db = readDB();
    const config = db.bot_config;
    
    // Save to history
    db.sms_history.unshift({
        id: Date.now(),
        country,
        service,
        number,
        otp,
        message,
        maskedNumber,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 messages
    if (db.sms_history.length > 100) db.sms_history = db.sms_history.slice(0, 100);
    writeDB(db);
    
    // Forward to Telegram if bot configured
    if (config.botToken && config.otpGroupId && config.botRunning) {
        const formattedTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
        
        const smsText = `🔥 <b>${country} <u>${service}</u> OTP Received! ✨</b>\n\n` +
            `<blockquote>⏰ <b>Time:</b> <code>${formattedTime} IST</code></blockquote>\n` +
            `<blockquote>🛒 <b>Service:</b> <code>${service}</code></blockquote>\n` +
            `<blockquote>🌍 <b>Country:</b> <code>${country} ${flag || '🌍'}</code></blockquote>\n` +
            `<blockquote>📱 <b>Number:</b> <code>${maskedNumber}</code></blockquote>\n` +
            `<blockquote>🔑 <b>OTP:</b> <code>${otp}</code></blockquote>\n` +
            `<blockquote>✉️ <b>Full Message</b>\n<code>${message || 'N/A'}</code></blockquote>`;
        
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: `${otp}`,
                        copy_text: { text: otp }
                    }
                ],
                [
                    {
                        text: "☎️ NUMBERS",
                        url: config.numbersChannelLink || "https://t.me/syedotpzone2"
                    },
                    {
                        text: "👻 MAIN CHANNEL",
                        url: config.mainChannelLink || "https://t.me/syedhacks"
                    }
                ]
            ]
        };
        
        try {
            await axios.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
                chat_id: config.otpGroupId,
                text: smsText,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard
            });
        } catch (error) {
            console.error('Telegram send error:', error.message);
        }
    }
    
    res.json({ success: true });
});

app.get('/api/fetch-apis', async (req, res) => {
    const db = readDB();
    const results = {};
    
    for (const [name, config] of Object.entries(db.api_configs)) {
        if (config.token) {
            try {
                let response;
                if (config.type === 'api') {
                    response = await axios.get(`${config.api_url}?token=${config.token}`, { timeout: 5000 });
                } else if (config.type === 'purple_api') {
                    response = await axios.post(config.api_url, { token: config.token }, { timeout: 5000 });
                }
                results[name] = { success: true, data: response?.data };
            } catch (error) {
                results[name] = { success: false, error: error.message };
            }
        }
    }
    
    res.json({ results });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});