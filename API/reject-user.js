const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { userId, adminUsername } = req.body;
    const dbPath = path.join(process.cwd(), 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const admin = db.users.find(u => u.username === adminUsername && u.isAdmin);
    if (!admin) {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    db.pending_users = db.pending_users.filter(u => u.id !== userId);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    res.json({ success: true });
};