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
    
    const pendingIndex = db.pending_users.findIndex(u => u.id === userId);
    if (pendingIndex === -1) {
        return res.json({ success: false, message: 'User not found' });
    }
    
    const user = db.pending_users[pendingIndex];
    user.approved = true;
    db.users.push(user);
    db.pending_users.splice(pendingIndex, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    res.json({ success: true });
};