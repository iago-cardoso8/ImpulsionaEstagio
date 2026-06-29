import db from './database';

function addColumnIfMissing(table: string, column: string, definition: string): void {
    const columns: Array<{ name: string }> = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes(column)) {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`).run();
        console.log(`✅ Coluna adicionada: ${table}.${column}`);
    }
}

function runMigration(): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS vagas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            title           TEXT    NOT NULL,
            company         TEXT    NOT NULL,
            location        TEXT    NOT NULL,
            email           TEXT    NOT NULL DEFAULT '',
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

        CREATE TABLE IF NOT EXISTS perfil (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT    NOT NULL,
            email           TEXT    NOT NULL,
            course          TEXT    NOT NULL,
            campus          TEXT    NOT NULL,
            status          TEXT    DEFAULT '',
            availability    TEXT    DEFAULT '',
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            title           TEXT    NOT NULL,
            message         TEXT    NOT NULL,
            time            TEXT    NOT NULL,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    addColumnIfMissing('vagas', 'email', "TEXT NOT NULL DEFAULT ''");

    console.log('✅ Migration executada: tabelas "vagas", "candidatos", "candidaturas", "perfil" e "notifications" prontas.');
}

export { runMigration };
