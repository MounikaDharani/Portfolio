// ─── Force Google DNS (bypasses system DNS blocking MongoDB Atlas SRV lookup) ─
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // put your HTML/CSS/JS files in a 'public' folder

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/portfolio';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection FAILED');
        console.error('   Reason:', err.message);
        console.error('   Common fixes:');
        console.error('   1. Whitelist your IP in Atlas → Network Access → Allow 0.0.0.0/0');
        console.error('   2. Check your username/password in .env');
        console.error('   3. Add &appName=Cluster0 to your MONGO_URI');
    });

// ─── Message Schema ───────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: 'No Subject' },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/contact  → Save a new message
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
        }

        const newMsg = await Message.create({ name, email, subject, message });
        res.status(201).json({ success: true, message: 'Message saved!', id: newMsg._id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/messages  → View all messages (admin use)
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json({ success: true, count: messages.length, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/messages/:id/read  → Mark message as read
app.patch('/api/messages/:id/read', async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true, message: 'Marked as read.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/messages/:id  → Delete a message
app.delete('/api/messages/:id', async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Message deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
