import Database from 'better-sqlite3';
import path from 'path';

const dbPath: string = path.join(__dirname, 'db.sqlite');
const db: Database.Database = new Database(dbPath);

// Habilita WAL para melhor performance
db.pragma('journal_mode = WAL');

export default db;
