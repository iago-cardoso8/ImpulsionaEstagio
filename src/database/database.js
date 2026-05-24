const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

// Habilita WAL para melhor performance
db.pragma('journal_mode = WAL');

module.exports = db;
