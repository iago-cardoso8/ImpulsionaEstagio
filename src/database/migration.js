const db = require('./database');

function runMigration() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS vagas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            title           TEXT    NOT NULL,
            company         TEXT    NOT NULL,
            location        TEXT    NOT NULL,
            time            TEXT    DEFAULT 'Agora mesmo',
            type            TEXT    DEFAULT 'Estágio',
            salary          TEXT    DEFAULT 'A combinar',
            target          TEXT    NOT NULL,
            desc            TEXT    DEFAULT '',
            requirements    TEXT    DEFAULT '[]',
            benefits        TEXT    DEFAULT '[]',
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS candidatos (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT    NOT NULL,
            email           TEXT    NOT NULL UNIQUE,
            phone           TEXT    NOT NULL,
            location        TEXT    NOT NULL,
            resume          TEXT    DEFAULT '',
            skills          TEXT    DEFAULT '[]',
            experience      TEXT    DEFAULT '',
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS candidaturas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            vaga_id         INTEGER NOT NULL,
            candidato_id    INTEGER NOT NULL,
            status          TEXT    DEFAULT 'Pendente',
            cover_letter    TEXT    DEFAULT '',
            applied_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE,
            FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE
        );
    `);

    console.log('✅ Migration executada: tabelas "vagas", "candidatos" e "candidaturas" prontas.');
}

module.exports = { runMigration };
