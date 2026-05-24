const db = require('./database');

function runMigration() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS vagas (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            company     TEXT    NOT NULL,
            location    TEXT    NOT NULL,
            time        TEXT    DEFAULT 'Agora mesmo',
            type        TEXT    DEFAULT 'Estágio',
            salary      TEXT    DEFAULT 'A combinar',
            target      TEXT    NOT NULL,
            desc        TEXT    DEFAULT '',
            requirements TEXT   DEFAULT '[]',
            benefits    TEXT    DEFAULT '[]'
        )
    `);

    console.log('✅ Migration executada: tabela "vagas" pronta.');
}

module.exports = { runMigration };
