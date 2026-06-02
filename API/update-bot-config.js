const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { botToken, otpGroupId, ownerChatId, mainChannelLink, numbersChannelLink } = req.body;
    const dbPath = path.join(process.cwd(), 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    db.bot_config = {
        ...db.bot_config,
        botToken,
        otpGroupId,
        ownerChatId,
        mainChannelLink,
        numbersChannelLink
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    res.json({ success: true });
};