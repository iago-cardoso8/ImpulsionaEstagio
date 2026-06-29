import db from '../database/database';

export interface Vaga {
    id?: number;
    title: string;
    company: string;
    location: string;
    email: string;
    time?: string;
    type?: string;
    salary: string;
    target: string;
    desc?: string;
    requirements: string[];
    benefits: string[];
    created_at?: string;
}

function parseVaga(vaga: any): Vaga | null {
    if (!vaga) return null;
    return {
        ...vaga,
        requirements: JSON.parse(vaga.requirements || '[]'),
        benefits: JSON.parse(vaga.benefits || '[]')
    };
}

function findAll(): Vaga[] {
    const rows: any[] = db.prepare('SELECT * FROM vagas').all() as any[];
    return rows.map(parseVaga).filter((v): v is Vaga => v !== null);
}

function findById(id: number): Vaga | null {
    const row: any = db.prepare('SELECT * FROM vagas WHERE id = ?').get(id);
    return parseVaga(row);
}

function create(data: Partial<Vaga>): Vaga | null {
    const stmt = db.prepare(`
        INSERT INTO vagas (title, company, location, email, time, type, salary, target, desc, requirements, benefits)
        VALUES (@title, @company, @location, @email, @time, @type, @salary, @target, @desc, @requirements, @benefits)
    `);

    const result = stmt.run({
        title:        data.title        || '',
        company:      data.company      || '',
        location:     data.location     || '',
        email:        data.email        || '',
        time:         data.time         || 'Agora mesmo',
        type:         data.type         || 'Estágio',
        salary:       data.salary       || 'A combinar',
        target:       data.target       || '',
        desc:         data.desc         || '',
        requirements: JSON.stringify(data.requirements || []),
        benefits:     JSON.stringify(data.benefits     || [])
    });

    return findById(result.lastInsertRowid as number);
}

function update(id: number, data: Partial<Vaga>): Vaga | null {
    const current: any = db.prepare('SELECT * FROM vagas WHERE id = ?').get(id);
    if (!current) return null;

    const merged = {
        title:        data.title        ?? current.title,
        company:      data.company      ?? current.company,
        location:     data.location     ?? current.location,
        email:        data.email        ?? current.email,
        time:         data.time         ?? current.time,
        type:         data.type         ?? current.type,
        salary:       data.salary       ?? current.salary,
        target:       data.target       ?? current.target,
        desc:         data.desc         ?? current.desc,
        requirements: data.requirements !== undefined ? JSON.stringify(data.requirements) : current.requirements,
        benefits:     data.benefits     !== undefined ? JSON.stringify(data.benefits)     : current.benefits
    };

    db.prepare(`
        UPDATE vagas SET
            title=@title, company=@company, location=@location, email=@email, time=@time,
            type=@type, salary=@salary, target=@target, desc=@desc,
            requirements=@requirements, benefits=@benefits
        WHERE id=@id
    `).run({ ...merged, id });

    return findById(id);
}

function remove(id: number): Vaga | null {
    const vaga = findById(id);
    if (!vaga) return null;
    db.prepare('DELETE FROM vagas WHERE id = ?').run(id);
    return vaga;
}

export { findAll, findById, create, update, remove };
