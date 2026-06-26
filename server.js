const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

// 🔴 YAHAN APNA SECRET PASSWORD SET HAI (PHP me yahi use hoga)
const SECRET_KEY = "RatanMasala@2026"; 

let qrCodeData = "";
let isConnected = false;

// WhatsApp Client Setup (Cloud Hosting ke liye special settings)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// 1. QR Code Generate Karna
client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        qrCodeData = url;
        isConnected = false;
        console.log("QR Code Ready! Waiting for Scan...");
    });
});

// 2. WhatsApp Connect Ho Gaya
client.on('ready', () => {
    console.log('WhatsApp Engine is Ready & Connected!');
    isConnected = true;
    qrCodeData = ""; // QR Code hata do kyunki connect ho gaya
});

// 3. WhatsApp Disconnect Ho Gaya (Phone off ya Logout)
client.on('disconnected', (reason) => {
    console.log('WhatsApp Disconnected:', reason);
    isConnected = false;
});

client.initialize();

// ==========================================
// 🛡️ SECURITY CHECK (Only PHP Brain Allowed)
// ==========================================
const checkAuth = (req, res, next) => {
    const token = req.headers['x-api-key'] || req.query.key;
    if (token !== SECRET_KEY) {
        return res.status(401).json({ error: "Access Denied! Galat Password." });
    }
    next();
};

// ==========================================
// 📡 API ENDPOINTS (PHP inko call karega)
// ==========================================

// API 1: Status aur QR Code check karna
app.get('/status', checkAuth, (req, res) => {
    if (isConnected) {
        res.json({ status: "connected", message: "WhatsApp is Live 🟢" });
    } else if (qrCodeData) {
        res.json({ status: "qr", qrCode: qrCodeData, message: "Scan this QR Code" });
    } else {
        res.json({ status: "starting", message: "Engine starting, please wait..." });
    }
});

// API 2: Message Send Karna
app.post('/send', checkAuth, async (req, res) => {
    if (!isConnected) {
        return res.status(400).json({ error: "WhatsApp is not connected." });
    }

    const { phone, message } = req.body;
    // Format: 919876543210@c.us
    const formattedPhone = phone + "@c.us"; 

    try {
        await client.sendMessage(formattedPhone, message);
        res.json({ success: true, message: "Message Sent Successfully! 🚀" });
    } catch (error) {
        res.status(500).json({ error: "Failed to send message", details: error.message });
    }
});

// API 3: Logout Karna
app.post('/logout', checkAuth, async (req, res) => {
    if (isConnected) {
        await client.logout();
        isConnected = false;
        res.json({ success: true, message: "Logged out successfully! 🔴" });
    } else {
        res.json({ success: true, message: "Already logged out." });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Engine is running on port ${PORT}`);
});
