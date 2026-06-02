const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { username, password, securityAnswer } = req.body;
    const dbPath = path.join(process.cwd(), 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    if (securityAnswer !== '7') {
        return res.json({ success: false, message: 'Security check failed!' });
    }
    
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
};