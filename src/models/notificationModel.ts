import db from '../database/database';

export interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    created_at?: string;
}

function parseNotification(notification: any): Notification | null {
    if (!notification) return null;
    return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: notification.time,
        created_at: notification.created_at
    };
}

function findAll(): Notification[] {
    const rows: any[] = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all() as any[];
    return rows.map(parseNotification).filter((n): n is Notification => n !== null);
}

function create(data: Partial<Notification>): Notification[] {
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

export { findAll, create };
