const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const dbPath = path.join(process.cwd(), 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    res.json({ numbers: db.numbers });
};