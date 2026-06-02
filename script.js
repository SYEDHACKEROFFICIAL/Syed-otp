// ============================================
// SYED SMS PANEL - FULL SCRIPT
// VIP EDITION v3.0
// ============================================

// ============ GLOBAL VARIABLES ============
const API_BASE = window.location.origin;
let currentUser = null;
let botInterval = null;
let otpPollingInterval = null;

// ============ AUTH PAGE INITIALIZATION ============
function initAuthPage() {
    console.log('Auth page initialized');
    
    // Set random security question
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const securityQuestion = document.getElementById('securityQuestion');
    if (securityQuestion) {
        securityQuestion.textContent = `${num1} + ${num2} = ?`;
        securityQuestion.dataset.answer = (num1 + num2).toString();
    }
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const forms = document.querySelectorAll('.auth-form');
            forms.forEach(form => form.classList.remove('active'));
            
            if (tab === 'login') {
                document.getElementById('loginForm').classList.add('active');
            } else {
                document.getElementById('registerForm').classList.add('active');
            }
        });
    });
    
    // Login form submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }
    
    // Register form submit
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleRegister();
        });
    }
}

// ============ LOGIN HANDLER ============
async function handleLogin() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const securityAnswer = document.getElementById('securityAnswer')?.value.trim();
    
    if (!username || !password) {
        showNotification('Please enter username and password', 'error');
        return;
    }
    
    // Get security answer from data attribute
    const securityQuestion = document.getElementById('securityQuestion');
    const correctAnswer = securityQuestion?.dataset.answer;
    
    if (securityAnswer !== correctAnswer) {
        showNotification('Security check failed!', 'error');
        return;
    }
    
    try {
        // Check local users first
        const users = JSON.parse(localStorage.getItem('system_users') || '[]');
        const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
        const allUsers = [...users, ...adminUsers];
        
        const user = allUsers.find(u => u.username === username && u.password === password);
        
        if (!user) {
            showNotification('Invalid username or password!', 'error');
            return;
        }
        
        if (!user.approved && !user.isAdmin) {
            showNotification('Your account is pending admin approval!', 'error');
            return;
        }
        
        // Save current user
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showNotification('Login successful! Redirecting...', 'success');
        
        // Redirect based on user type
        setTimeout(() => {
            if (user.isAdmin) {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/dashboard.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed! Try again.', 'error');
    }
}

// ============ REGISTER HANDLER ============
async function handleRegister() {
    const fullname = document.getElementById('regFullname')?.value.trim();
    const country = document.getElementById('regCountry')?.value;
    const username = document.getElementById('regUsername')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirmPass = document.getElementById('regConfirmPass')?.value;
    
    if (!fullname || !country || !username || !password) {
        showNotification('Please fill all fields!', 'error');
        return;
    }
    
    if (password !== confirmPass) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 4) {
        showNotification('Password must be at least 4 characters!', 'error');
        return;
    }
    
    try {
        // Get existing users
        const users = JSON.parse(localStorage.getItem('system_users') || '[]');
        const pendingUsers = JSON.parse(localStorage.getItem('pending_users') || '[]');
        
        // Check if username exists
        if (users.find(u => u.username === username) || pendingUsers.find(u => u.username === username)) {
            showNotification('Username already exists!', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullname: fullname,
            country: country,
            username: username,
            password: password,
            approved: false,
            isAdmin: false,
            createdAt: new Date().toISOString(),
            botConfig: {
                botToken: '',
                otpGroupId: '',
                ownerChatId: '',
                firstBtnName: '☎️ NUMBERS',
                firstBtnLink: '',
                secondBtnName: '👻 MAIN CHANNEL',
                secondBtnLink: '',
                botRunning: false
            }
        };
        
        // Add to pending
        pendingUsers.push(newUser);
        localStorage.setItem('pending_users', JSON.stringify(pendingUsers));
        
        showNotification('Registration submitted! Wait for admin approval.', 'success');
        
        // Clear form
        document.getElementById('regFullname').value = '';
        document.getElementById('regCountry').value = '';
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPass').value = '';
        
        // Switch to login tab
        document.querySelector('.tab-btn[data-tab="login"]').click();
        
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Registration failed! Try again.', 'error');
    }
}

// ============ DASHBOARD INITIALIZATION ============
async function initDashboard() {
    console.log('Dashboard initializing...');
    
    // Get current user
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = '/index.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    
    if (currentUser.isAdmin) {
        window.location.href = '/admin.html';
        return;
    }
    
    // Set username in sidebar
    const sidebarUsername = document.getElementById('sidebarUsername');
    if (sidebarUsername) {
        sidebarUsername.textContent = currentUser.username || 'User';
    }
    
    // Set user name in top bar
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) {
        userNameDisplay.textContent = currentUser.fullname || currentUser.username;
    }
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const pages = document.querySelectorAll('.page');
            pages.forEach(p => p.classList.remove('active'));
            
            const targetPage = document.getElementById(`${page}Page`);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = page.toUpperCase();
            }
            
            // Load page specific data
            if (page === 'dashboard') {
                loadDashboardStats();
                loadRecentActivity();
            } else if (page === 'numbers') {
                loadAvailableNumbers();
            } else if (page === 'sms') {
                loadTodaySMS();
            } else if (page === 'history') {
                loadSMSHistory();
            } else if (page === 'bots') {
                loadBotConfig();
            } else if (page === 'live') {
                startLiveSMS();
            }
        });
    });
    
    // Load dashboard data
    await loadDashboardStats();
    await loadRecentActivity();
    await loadAvailableNumbers();
    loadBotConfig();
    loadUserSocialLinks();
    
    // Start OTP polling if bot was running
    const botRunning = localStorage.getItem(`bot_running_${currentUser.username}`) === 'true';
    if (botRunning) {
        startBotPolling();
    }
    
    // Update stats periodically
    setInterval(() => {
        if (document.querySelector('.nav-item.active')?.dataset.page === 'dashboard') {
            loadDashboardStats();
        }
    }, 30000);
}

// ============ LOAD DASHBOARD STATS ============
async function loadDashboardStats() {
    const smsHistory = JSON.parse(localStorage.getItem(`sms_history_${currentUser.username}`) || '[]');
    const today = new Date().toDateString();
    const todaySMS = smsHistory.filter(sms => new Date(sms.timestamp).toDateString() === today);
    
    const activeNumbers = document.getElementById('activeNumbers');
    const todaySmsCount = document.getElementById('todaySmsCount');
    const botStatusSpan = document.getElementById('botStatus');
    
    if (activeNumbers) {
        const numbers = JSON.parse(localStorage.getItem('system_numbers') || '[]');
        activeNumbers.textContent = numbers.length;
    }
    
    if (todaySmsCount) {
        todaySmsCount.textContent = todaySMS.length;
    }
    
    if (botStatusSpan) {
        const botRunning = localStorage.getItem(`bot_running_${currentUser.username}`) === 'true';
        botStatusSpan.textContent = botRunning ? '🟢 RUNNING' : '🔴 STOPPED';
        botStatusSpan.style.color = botRunning ? '#2ecc71' : '#e74c3c';
    }
}

// ============ LOAD RECENT ACTIVITY ============
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const smsHistory = JSON.parse(localStorage.getItem(`sms_history_${currentUser.username}`) || '[]');
    const recent = smsHistory.slice(0, 10);
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="no-data">No OTPs received yet</div>';
        return;
    }
    
    container.innerHTML = recent.map(sms => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">${sms.country} - ${sms.service || 'SMS Service'}</div>
                <div class="activity-otp">🔑 ${sms.otp}</div>
                <div class="activity-time">${new Date(sms.timestamp).toLocaleString()}</div>
            </div>
            <button class="copy-otp-btn" onclick="copyToClipboard('${sms.otp}')">
                <i class="fas fa-copy"></i> Copy OTP
            </button>
        </div>
    `).join('');
}

// ============ LOAD AVAILABLE NUMBERS ============
function loadAvailableNumbers() {
    const container = document.getElementById('numbersContainer');
    if (!container) return;
    
    const numbers = JSON.parse(localStorage.getItem('system_numbers') || '[]');
    
    // Group by country
    const grouped = {};
    numbers.forEach(num => {
        if (!grouped[num.country]) grouped[num.country] = [];
        grouped[num.country].push(num);
    });
    
    if (Object.keys(grouped).length === 0) {
        container.innerHTML = '<div class="no-data">No numbers available. Contact admin.</div>';
        return;
    }
    
    container.innerHTML = Object.entries(grouped).map(([country, nums]) => `
        <div class="country-group">
            <div class="country-header">
                <i class="fas fa-flag"></i>
                <h3>${country}</h3>
                <span class="count-badge">${nums.length} numbers</span>
            </div>
            <div class="numbers-grid">
                ${nums.map(num => `
                    <div class="number-card" onclick="copyToClipboard('${num.number}')">
                        <i class="fas fa-mobile-alt"></i>
                        <span>${num.number}</span>
                        <button class="copy-btn-small">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ============ LOAD TODAY'S SMS ============
function loadTodaySMS() {
    const container = document.getElementById('todaySMSList');
    if (!container) return;
    
    const smsHistory = JSON.parse(localStorage.getItem(`sms_history_${currentUser.username}`) || '[]');
    const today = new Date().toDateString();
    const todaySMS = smsHistory.filter(sms => new Date(sms.timestamp).toDateString() === today);
    
    if (todaySMS.length === 0) {
        container.innerHTML = '<div class="no-data">No SMS received today</div>';
        return;
    }
    
    container.innerHTML = todaySMS.map(sms => `
        <div class="sms-card">
            <div class="sms-header">
                <span class="sms-country">${sms.country}</span>
                <span class="sms-time">${new Date(sms.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="sms-service">${sms.service || 'SMS Service'}</div>
            <div class="sms-number">📱 ${sms.maskedNumber || sms.number}</div>
            <div class="sms-otp">🔑 OTP: <strong>${sms.otp}</strong></div>
            <div class="sms-message">💬 ${sms.message || 'No message content'}</div>
            <button class="copy-otp-btn" onclick="copyToClipboard('${sms.otp}')">
                <i class="fas fa-copy"></i> Copy OTP
            </button>
        </div>
    `).join('');
}

// ============ LOAD SMS HISTORY ============
function loadSMSHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    const smsHistory = JSON.parse(localStorage.getItem(`sms_history_${currentUser.username}`) || '[]');
    
    if (smsHistory.length === 0) {
        container.innerHTML = '<div class="no-data">No SMS history found</div>';
        return;
    }
    
    container.innerHTML = smsHistory.map(sms => `
        <div class="sms-card">
            <div class="sms-header">
                <span class="sms-country">${sms.country}</span>
                <span class="sms-time">${new Date(sms.timestamp).toLocaleString()}</span>
            </div>
            <div class="sms-service">${sms.service || 'SMS Service'}</div>
            <div class="sms-number">📱 ${sms.number}</div>
            <div class="sms-otp">🔑 OTP: <strong>${sms.otp}</strong></div>
            <div class="sms-message">💬 ${sms.message || 'No message content'}</div>
            <button class="copy-otp-btn" onclick="copyToClipboard('${sms.otp}')">
                <i class="fas fa-copy"></i> Copy OTP
            </button>
        </div>
    `).join('');
}

// ============ LIVE SMS ============
let liveSocket = null;
let isLiveActive = false;

function startLiveSMS() {
    const container = document.getElementById('liveMessages');
    if (!container) return;
    
    if (!isLiveActive) {
        isLiveActive = true;
        container.innerHTML = '<div class="live-active">🟢 Live mode active - Waiting for OTPs...</div>';
        
        // Start polling for new OTPs
        if (otpPollingInterval) clearInterval(otpPollingInterval);
        
        let lastCount = JSON.parse(localStorage.getItem(`sms_history_${currentUser.username}`) || '[]').length;
        
        otpPollingInterval = setInterval(() => {
            const history = JSON.parse(localStorage.getItem(`sms_history_${currentUser.username}`) || '[]');
            if (history.length > lastCount) {
                const newSMS = history[0];
                const liveMsg = document.createElement('div');
                liveMsg.className = 'live-message';
                liveMsg.innerHTML = `
                    <div class="live-header">
                        <span class="live-country">${newSMS.country}</span>
                        <span class="live-time">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <div class="live-otp">🔑 OTP: ${newSMS.otp}</div>
                    <div class="live-message-text">${newSMS.message || 'No message'}</div>
                    <button onclick="copyToClipboard('${newSMS.otp}')">Copy OTP</button>
                `;
                container.insertBefore(liveMsg, container.firstChild);
                lastCount = history.length;
                
                // Play sound
                playNotificationSound();
            }
        }, 2000);
    }
    
    const stopBtn = document.createElement('button');
    stopBtn.textContent = 'Stop Live Mode';
    stopBtn.className = 'stop-live-btn';
    stopBtn.onclick = () => {
        if (otpPollingInterval) clearInterval(otpPollingInterval);
        isLiveActive = false;
        container.innerHTML = '<div class="live-stopped">Live mode stopped</div>';
        stopBtn.remove();
    };
    container.appendChild(stopBtn);
}

function playNotificationSound() {
    try {
        const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        audio.play().catch(e => console.log('Sound play failed'));
    } catch(e) {}
}

// ============ BOT CONFIGURATION ============
function loadBotConfig() {
    const userConfig = localStorage.getItem(`bot_config_${currentUser.username}`);
    
    const botToken = document.getElementById('botToken');
    const otpGroupId = document.getElementById('otpGroupId');
    const ownerChatId = document.getElementById('ownerChatId');
    const firstBtnName = document.getElementById('firstBtnName');
    const firstBtnLink = document.getElementById('firstBtnLink');
    const secondBtnName = document.getElementById('secondBtnName');
    const secondBtnLink = document.getElementById('secondBtnLink');
    const botStatusSpan = document.getElementById('botRunningStatus');
    
    if (userConfig) {
        const config = JSON.parse(userConfig);
        if (botToken) botToken.value = config.botToken || '';
        if (otpGroupId) otpGroupId.value = config.otpGroupId || '';
        if (ownerChatId) ownerChatId.value = config.ownerChatId || '';
        if (firstBtnName) firstBtnName.value = config.firstBtnName || '☎️ NUMBERS';
        if (firstBtnLink) firstBtnLink.value = config.firstBtnLink || '';
        if (secondBtnName) secondBtnName.value = config.secondBtnName || '👻 MAIN CHANNEL';
        if (secondBtnLink) secondBtnLink.value = config.secondBtnLink || '';
        
        const botRunning = localStorage.getItem(`bot_running_${currentUser.username}`) === 'true';
        if (botStatusSpan) {
            botStatusSpan.innerHTML = botRunning ? '🟢 RUNNING' : '🔴 STOPPED';
            botStatusSpan.style.color = botRunning ? '#2ecc71' : '#e74c3c';
        }
    }
}

function saveBotConfig() {
    const config = {
        botToken: document.getElementById('botToken')?.value || '',
        otpGroupId: document.getElementById('otpGroupId')?.value || '',
        ownerChatId: document.getElementById('ownerChatId')?.value || '',
        firstBtnName: document.getElementById('firstBtnName')?.value || '☎️ NUMBERS',
        firstBtnLink: document.getElementById('firstBtnLink')?.value || '',
        secondBtnName: document.getElementById('secondBtnName')?.value || '👻 MAIN CHANNEL',
        secondBtnLink: document.getElementById('secondBtnLink')?.value || '',
        botRunning: localStorage.getItem(`bot_running_${currentUser.username}`) === 'true'
    };
    
    localStorage.setItem(`bot_config_${currentUser.username}`, JSON.stringify(config));
    showNotification('Bot configuration saved!', 'success');
}

function startBot() {
    const config = JSON.parse(localStorage.getItem(`bot_config_${currentUser.username}`) || '{}');
    
    if (!config.botToken || !config.otpGroupId) {
        showNotification('Please enter Bot Token and OTP Group ID first!', 'error');
        return;
    }
    
    localStorage.setItem(`bot_running_${currentUser.username}`, 'true');
    const botStatusSpan = document.getElementById('botRunningStatus');
    if (botStatusSpan) {
        botStatusSpan.innerHTML = '🟢 RUNNING';
        botStatusSpan.style.color = '#2ecc71';
    }
    
    startBotPolling();
    showNotification('Bot started! OTPs will be forwarded to your Telegram group.', 'success');
}

function stopBot() {
    localStorage.setItem(`bot_running_${currentUser.username}`, 'false');
    const botStatusSpan = document.getElementById('botRunningStatus');
    if (botStatusSpan) {
        botStatusSpan.innerHTML = '🔴 STOPPED';
        botStatusSpan.style.color = '#e74c3c';
    }
    
    if (botPollingInterval) clearInterval(botPollingInterval);
    showNotification('Bot stopped!', 'success');
}

function startBotPolling() {
    if (botPollingInterval) clearInterval(botPollingInterval);
    
    // Poll for new OTPs every 2 seconds
    botPollingInterval = setInterval(async () => {
        const botRunning = localStorage.getItem(`bot_running_${currentUser.username}`) === 'true';
        if (!botRunning) return;
        
        // Fetch OTPs from connected APIs
        await fetchOTPFromAPIs();
    }, 3000);
}

async function fetchOTPFromAPIs() {
    // This function will fetch OTPs from connected API sources
    // For demo, we'll simulate OTP reception
    
    const config = JSON.parse(localStorage.getItem(`bot_config_${currentUser.username}`) || '{}');
    if (!config.botToken || !config.otpGroupId) return;
    
    // Demo: Simulate receiving OTP (Replace with actual API calls)
    // In production, this will fetch from your API endpoints
}

// ============ FORWARD OTP TO TELEGRAM ============
async function forwardOTPToTelegram(otpData) {
    const config = JSON.parse(localStorage.getItem(`bot_config_${currentUser.username}`) || '{}');
    
    if (!config.botToken || !config.otpGroupId) {
        console.log('Bot not configured');
        return false;
    }
    
    const botRunning = localStorage.getItem(`bot_running_${currentUser.username}`) === 'true';
    if (!botRunning) return false;
    
    const formattedTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    const flag = getCountryFlag(otpData.country);
    
    const messageText = `🔥 <b>${otpData.country} <u>${otpData.service || 'SMS Service'}</u> OTP Received! ✨</b>\n\n` +
        `<blockquote>⏰ <b>Time:</b> <code>${formattedTime} IST</code></blockquote>\n` +
        `<blockquote>🛒 <b>Service:</b> <code>${otpData.service || 'SMS Service'}</code></blockquote>\n` +
        `<blockquote>🌍 <b>Country:</b> <code>${otpData.country} ${flag}</code></blockquote>\n` +
        `<blockquote>📱 <b>Number:</b> <code>${otpData.maskedNumber || otpData.number}</code></blockquote>\n` +
        `<blockquote>🔑 <b>OTP:</b> <code>${otpData.otp}</code></blockquote>\n` +
        `<blockquote>✉️ <b>Full Message</b>\n<code>${otpData.message || 'N/A'}</code></blockquote>`;
    
    const inlineKeyboard = {
        inline_keyboard: [
            [
                {
                    text: `${otpData.otp}`,
                    copy_text: { text: otpData.otp }
                }
            ],
            [
                {
                    text: config.firstBtnName || "☎️ NUMBERS",
                    url: config.firstBtnLink || "https://t.me/+placeholder",
                },
                {
                    text: config.secondBtnName || "👻 MAIN CHANNEL",
                    url: config.secondBtnLink || "https://t.me/+placeholder",
                }
            ]
        ]
    };
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.otpGroupId,
                text: messageText,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            // Save to history
            const history = JSON.parse(localStorage.getItem(`sms_history_${currentUser.username}`) || '[]');
            history.unshift({
                ...otpData,
                timestamp: new Date().toISOString()
            });
            if (history.length > 100) history.pop();
            localStorage.setItem(`sms_history_${currentUser.username}`, JSON.stringify(history));
            
            return true;
        }
    } catch (error) {
        console.error('Forward error:', error);
    }
    
    return false;
}

// ============ LOAD USER SOCIAL LINKS ============
function loadUserSocialLinks() {
    const socialLinks = localStorage.getItem(`social_links_${currentUser.username}`);
    if (socialLinks) {
        const links = JSON.parse(socialLinks);
        const whatsappLink = document.getElementById('whatsappLink');
        const telegramLink = document.getElementById('telegramLink');
        
        if (whatsappLink) whatsappLink.href = links.whatsapp || '#';
        if (telegramLink) telegramLink.href = links.telegram || '#';
    }
}

// ============ COPY TO CLIPBOARD ============
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification(`Copied: ${text}`, 'success');
    }).catch(() => {
        alert(`Copy: ${text}`);
    });
}

// ============ SHOW NOTIFICATION ============
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============ GET COUNTRY FLAG ============
function getCountryFlag(country) {
    const flags = {
        'Pakistan': '🇵🇰', 'India': '🇮🇳', 'USA': '🇺🇸', 'UAE': '🇦🇪',
        'UK': '🇬🇧', 'Indonesia': '🇮🇩', 'Zambia': '🇿🇲', 'Mozambique': '🇲🇿',
        'Sudan': '🇸🇩', 'Kyrgyzstan': '🇰🇬', 'Ukraine': '🇺🇦', 'Venezuela': '🇻🇪'
    };
    return flags[country] || '🌍';
}

// ============ LOGOUT ============
function logout() {
    if (botPollingInterval) clearInterval(botPollingInterval);
    if (otpPollingInterval) clearInterval(otpPollingInterval);
    localStorage.removeItem('currentUser');
    window.location.href = '/index.html';
}

// ============ ADMIN PANEL FUNCTIONS ============
function initAdminPanel() {
    const adminStr = localStorage.getItem('currentUser');
    if (!adminStr) {
        window.location.href = '/index.html';
        return;
    }
    
    currentUser = JSON.parse(adminStr);
    
    if (!currentUser.isAdmin) {
        window.location.href = '/dashboard.html';
        return;
    }
    
    // Initialize admin tabs
    const adminNavs = document.querySelectorAll('.admin-nav');
    adminNavs.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = nav.dataset.tab;
            
            adminNavs.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');
            
            const tabs = document.querySelectorAll('.admin-tab');
            tabs.forEach(t => t.classList.remove('active'));
            
            document.getElementById(`${tab}Tab`).classList.add('active');
            
            // Load tab data
            if (tab === 'pending') loadPendingUsers();
            if (tab === 'users') loadAllUsers();
            if (tab === 'numbers') loadNumbersManagement();
        });
    });
    
    // Load initial data
    loadPendingUsers();
    loadAllUsers();
    loadNumbersManagement();
}

function loadPendingUsers() {
    const pendingUsers = JSON.parse(localStorage.getItem('pending_users') || '[]');
    const container = document.getElementById('pendingList');
    
    if (!container) return;
    
    if (pendingUsers.length === 0) {
        container.innerHTML = '<div class="no-data">No pending requests</div>';
        return;
    }
    
    container.innerHTML = pendingUsers.map(user => `
        <div class="user-card">
            <div class="user-info">
                <strong>${user.fullname}</strong>
                <span>@${user.username}</span>
                <span>${user.country}</span>
                <small>${new Date(user.createdAt).toLocaleString()}</small>
            </div>
            <div class="user-actions">
                <button onclick="approveUser('${user.id}')" class="approve-btn">✓ Approve</button>
                <button onclick="rejectUser('${user.id}')" class="reject-btn">✗ Reject</button>
            </div>
        </div>
    `).join('');
}

function approveUser(userId) {
    const pendingUsers = JSON.parse(localStorage.getItem('pending_users') || '[]');
    const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
    
    const userIndex = pendingUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        const user = pendingUsers[userIndex];
        user.approved = true;
        systemUsers.push(user);
        pendingUsers.splice(userIndex, 1);
        
        localStorage.setItem('pending_users', JSON.stringify(pendingUsers));
        localStorage.setItem('system_users', JSON.stringify(systemUsers));
        
        showNotification('User approved successfully!', 'success');
        loadPendingUsers();
        loadAllUsers();
    }
}

function rejectUser(userId) {
    const pendingUsers = JSON.parse(localStorage.getItem('pending_users') || '[]');
    const filtered = pendingUsers.filter(u => u.id !== userId);
    localStorage.setItem('pending_users', JSON.stringify(filtered));
    
    showNotification('User rejected!', 'success');
    loadPendingUsers();
}

function loadAllUsers() {
    const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
    const container = document.getElementById('usersList');
    
    if (!container) return;
    
    if (systemUsers.length === 0) {
        container.innerHTML = '<div class="no-data">No users found</div>';
        return;
    }
    
    container.innerHTML = systemUsers.map(user => `
        <div class="user-card">
            <div class="user-info">
                <strong>${user.fullname}</strong>
                <span>@${user.username}</span>
                <span>${user.country}</span>
                <small>Joined: ${new Date(user.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="user-status approved">✅ Approved</div>
        </div>
    `).join('');
}

function loadNumbersManagement() {
    const numbers = JSON.parse(localStorage.getItem('system_numbers') || '[]');
    const container = document.getElementById('numbersManageList');
    
    if (!container) return;
    
    if (numbers.length === 0) {
        container.innerHTML = '<div class="no-data">No numbers added yet</div>';
        return;
    }
    
    container.innerHTML = numbers.map(num => `
        <div class="number-card">
            <div class="number-info">
                <strong>${num.number}</strong>
                <span>${num.country}</span>
            </div>
            <button onclick="deleteNumber('${num.id}')" class="delete-btn">Delete</button>
        </div>
    `).join('');
}

function addNewNumber() {
    const number = document.getElementById('newNumber')?.value.trim();
    const country = document.getElementById('numberCountry')?.value;
    
    if (!number || !country) {
        showNotification('Please enter number and select country!', 'error');
        return;
    }
    
    const numbers = JSON.parse(localStorage.getItem('system_numbers') || '[]');
    
    const newNumber = {
        id: Date.now().toString(),
        number: number,
        country: country,
        addedBy: currentUser.username,
        addedAt: new Date().toISOString()
    };
    
    numbers.push(newNumber);
    localStorage.setItem('system_numbers', JSON.stringify(numbers));
    
    document.getElementById('newNumber').value = '';
    loadNumbersManagement();
    showNotification('Number added successfully!', 'success');
}

function deleteNumber(numberId) {
    const numbers = JSON.parse(localStorage.getItem('system_numbers') || '[]');
    const filtered = numbers.filter(n => n.id !== numberId);
    localStorage.setItem('system_numbers', JSON.stringify(filtered));
    loadNumbersManagement();
    showNotification('Number deleted!', 'success');
}

function adminLogout() {
    logout();
}

// ============ INITIALIZE SYSTEM DATA ============
function initializeSystemData() {
    // Initialize admin user if not exists
    const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    if (adminUsers.length === 0) {
        adminUsers.push({
            id: 'admin_1',
            fullname: 'Syed Hacker',
            country: 'Pakistan',
            username: 'Syedhacker',
            password: '0345Syeddlr',
            approved: true,
            isAdmin: true,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('admin_users', JSON.stringify(adminUsers));
    }
    
    // Initialize sample numbers if not exists
    const numbers = JSON.parse(localStorage.getItem('system_numbers') || '[]');
    if (numbers.length === 0) {
        const sampleNumbers = [
            { id: '1', number: '+996550961591', country: 'Kyrgyzstan' },
            { id: '2', number: '+996550961652', country: 'Kyrgyzstan' },
            { id: '3', number: '+628123456789', country: 'Indonesia' },
            { id: '4', number: '+260765432109', country: 'Zambia' }
        ];
        localStorage.setItem('system_numbers', JSON.stringify(sampleNumbers));
    }
}

// ============ DOM CONTENT LOADED ============
document.addEventListener('DOMContentLoaded', () => {
    initializeSystemData();
    
    // Check which page we're on
    if (document.querySelector('.auth-page')) {
        initAuthPage();
    }
    else if (document.querySelector('.dashboard-body')) {
        initDashboard();
    }
    else if (document.querySelector('.admin-body')) {
        initAdminPanel();
    }
});