import db from '../database/database';

export interface Profile {
    id: number;
    name: string;
    email: string;
    course: string;
    campus: string;
    status: string;
    availability: string;
    updated_at?: string;
}

function parseProfile(row: any): Profile | null {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        course: row.course,
        campus: row.campus,
        status: row.status,
        availability: row.availability,
        updated_at: row.updated_at
    };
}

function find(): Profile | null {
    const row: any = db.prepare('SELECT * FROM perfil ORDER BY id LIMIT 1').get();
    return parseProfile(row);
}

function create(data: Partial<Profile>): Profile | null {
    const stmt = db.prepare(`
        INSERT INTO perfil (name, email, course, campus, status, availability)
        VALUES (@name, @email, @course, @campus, @status, @availability)
    `);

    stmt.run({
        name: data.name || '',
        email: data.email || '',
        course: data.course || '',
        campus: data.campus || '',
        status: data.status || '',
        availability: data.availability || ''
    });

    return find();
}

function update(data: Partial<Profile>): Profile | null {
    const current = find();
    if (!current) return null;

    const merged = {
        name: data.name ?? current.name,
        email: data.email ?? current.email,
        course: data.course ?? current.course,
        campus: data.campus ?? current.campus,
        status: data.status ?? current.status,
        availability: data.availability ?? current.availability,
        id: current.id
    };

    db.prepare(`
        UPDATE perfil SET
            name=@name,
            email=@email,
            course=@course,
            campus=@campus,
            status=@status,
            availability=@availability,
            updated_at = CURRENT_TIMESTAMP
        WHERE id=@id
    `).run(merged);

    return find();
}

export { find, create, update };
