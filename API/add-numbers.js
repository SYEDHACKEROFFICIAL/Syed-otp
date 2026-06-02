const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { number, country, adminUsername } = req.body;
    const dbPath = path.join(process.cwd(), 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
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
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    res.json({ success: true });
};
