const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = async (req, res) => {
    const dbPath = path.join(process.cwd(), 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
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
};