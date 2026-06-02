const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { fullname, country, username, password } = req.body;
    const dbPath = path.join(process.cwd(), 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
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
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    res.json({ success: true, message: 'Registration submitted for approval' });
};