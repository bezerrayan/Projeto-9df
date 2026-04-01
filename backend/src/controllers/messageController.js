const fs = require('fs');
const db = require('../config/database');
const config = require('../config/env');

async function sendContactMessage(req, res, next) {
    try {
        const { name, email, subject, message } = req.body || {};
        if (!name || !email || !message) {
            return res.status(400).json({ ok: false, error: "missing_fields" });
        }

        const msg = {
            id: "msg-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: String(name).trim().slice(0, 200),
            email: String(email).trim().slice(0, 200),
            subject: String(subject || "Contato pelo site").trim().slice(0, 200),
            message: String(message).trim().slice(0, 5000),
            date: new Date().toISOString(),
            is_read: false,
        };

        if (config.DB_MODE === "mysql") {
            await db.getPool().query(
                "INSERT INTO contact_messages (id, name, email, subject, message, is_read) VALUES (?, ?, ?, ?, ?, 0)",
                [msg.id, msg.name, msg.email, msg.subject, msg.message]
            );
        } else {
            const data = fs.existsSync(db.paths.messages) ? JSON.parse(fs.readFileSync(db.paths.messages, 'utf8')) : { messages: [] };
            if (!Array.isArray(data.messages)) data.messages = [];
            data.messages.push(msg);
            fs.writeFileSync(db.paths.messages, JSON.stringify(data, null, 2));
        }

        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
}

async function getMessages(req, res, next) {
    try {
        if (config.DB_MODE === "mysql") {
            const [rows] = await db.getPool().query("SELECT * FROM contact_messages ORDER BY date DESC");
            return res.json({ messages: rows });
        }
        const data = fs.existsSync(db.paths.messages) ? JSON.parse(fs.readFileSync(db.paths.messages, 'utf8')) : { messages: [] };
        const msgs = Array.isArray(data.messages) ? data.messages : [];
        msgs.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
        res.json({ messages: msgs });
    } catch (error) {
        next(error);
    }
}

async function markAsRead(req, res, next) {
    try {
        const { id } = req.params;
        if (config.DB_MODE === "mysql") {
            await db.getPool().query("UPDATE contact_messages SET is_read = 1 WHERE id = ?", [id]);
        } else {
            const data = fs.existsSync(db.paths.messages) ? JSON.parse(fs.readFileSync(db.paths.messages, 'utf8')) : { messages: [] };
            const msg = (data.messages || []).find(m => m.id === id);
            if (msg) msg.is_read = true;
            fs.writeFileSync(db.paths.messages, JSON.stringify(data, null, 2));
        }
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
}

async function deleteMessage(req, res, next) {
    try {
        const { id } = req.params;
        if (config.DB_MODE === "mysql") {
            await db.getPool().query("DELETE FROM contact_messages WHERE id = ?", [id]);
        } else {
            const data = fs.existsSync(db.paths.messages) ? JSON.parse(fs.readFileSync(db.paths.messages, 'utf8')) : { messages: [] };
            data.messages = (data.messages || []).filter(m => m.id !== id);
            fs.writeFileSync(db.paths.messages, JSON.stringify(data, null, 2));
        }
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
}

module.exports = {
  sendContactMessage,
  getMessages,
  markAsRead,
  deleteMessage
};
