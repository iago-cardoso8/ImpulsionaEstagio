const db = require('../database/database');

function parseNotification(notification) {
    if (!notification) return null;
    return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: notification.time,
        created_at: notification.created_at
    };
}

function findAll() {
    const rows = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
    return rows.map(parseNotification);
}

function create(data) {
    const stmt = db.prepare(`
        INSERT INTO notifications (title, message, time)
        VALUES (@title, @message, @time)
    `);

    stmt.run({
        title: data.title || '',
        message: data.message || '',
        time: data.time || ''
    });

    return findAll();
}

module.exports = {
    findAll,
    create
};
