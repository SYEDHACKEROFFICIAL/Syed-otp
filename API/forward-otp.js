const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { country, service, number, otp, message, maskedNumber, flag, username } = req.body;
    const dbPath = path.join(process.cwd(), 'db.json');
    let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    // Get user's specific bot config (not global)
    let userConfig = db.bot_config;
    
    // If username is provided, check if user has their own config
    if (username) {
        const user = db.users.find(u => u.username === username);
        if (user && user.botConfig) {
            userConfig = user.botConfig;
        }
    }
    
    // Save to user's SMS history
    if (!db.sms_history) db.sms_history = [];
    if (!db.sms_history[username]) db.sms_history[username] = [];
    
    db.sms_history[username] = db.sms_history[username] || [];
    db.sms_history[username].unshift({
        id: Date.now(),
        country,
        service,
        number,
        otp,
        message,
        maskedNumber,
        timestamp: new Date().toISOString()
    });
    
    if (db.sms_history[username].length > 100) db.sms_history[username] = db.sms_history[username].slice(0, 100);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    // Forward to Telegram if bot configured for this user
    if (userConfig && userConfig.botToken && userConfig.otpGroupId && userConfig.botRunning) {
        const formattedTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
        
        const smsText = `🔥 <b>${country} <u>${service}</u> OTP Received! ✨</b>\n\n` +
            `<blockquote>⏰ <b>Time:</b> <code>${formattedTime} IST</code></blockquote>\n` +
            `<blockquote>🛒 <b>Service:</b> <code>${service}</code></blockquote>\n` +
            `<blockquote>🌍 <b>Country:</b> <code>${country} ${flag || '🌍'}</code></blockquote>\n` +
            `<blockquote>📱 <b>Number:</b> <code>${maskedNumber}</code></blockquote>\n` +
            `<blockquote>🔑 <b>OTP:</b> <code>${otp}</code></blockquote>\n` +
            `<blockquote>✉️ <b>Full Message</b>\n<code>${message || 'N/A'}</code></blockquote>`;
        
        // Get user's custom links or use defaults
        const mainChannelLink = userConfig.mainChannelLink || "https://t.me/+PLACEHOLDER";
        const numbersChannelLink = userConfig.numbersChannelLink || "https://t.me/+PLACEHOLDER";
        
        // Get custom button names from user config
        const firstBtnName = userConfig.firstBtnName || "☎️ NUMBERS";
        const secondBtnName = userConfig.secondBtnName || "👻 MAIN CHANNEL";
        
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: `${otp}`,
                        copy_text: { text: otp },
                        style: "primary"
                    }
                ],
                [
                    {
                        text: firstBtnName,
                        url: numbersChannelLink,
                        style: "danger"
                    },
                    {
                        text: secondBtnName,
                        url: mainChannelLink,
                        style: "success"
                    }
                ]
            ]
        };
        
        try {
            await axios.post(`https://api.telegram.org/bot${userConfig.botToken}/sendMessage`, {
                chat_id: userConfig.otpGroupId,
                text: smsText,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard
            });
        } catch (error) {
            console.error('Telegram send error:', error.message);
        }
    }
    
    res.json({ success: true });
};