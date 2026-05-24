const db = require('../database/database');

// Converte os campos JSON (requirements/benefits) de string para array
function parseVaga(vaga) {
    if (!vaga) return null;
    return {
        ...vaga,
        requirements: JSON.parse(vaga.requirements || '[]'),
        benefits: JSON.parse(vaga.benefits || '[]')
    };
}

function findAll() {
    const rows = db.prepare('SELECT * FROM vagas').all();
    return rows.map(parseVaga);
}

function findById(id) {
    const row = db.prepare('SELECT * FROM vagas WHERE id = ?').get(id);
    return parseVaga(row);
}

function create(data) {
    const stmt = db.prepare(`
        INSERT INTO vagas (title, company, location, time, type, salary, target, desc, requirements, benefits)
        VALUES (@title, @company, @location, @time, @type, @salary, @target, @desc, @requirements, @benefits)
    `);

    const result = stmt.run({
        title:        data.title        || '',
        company:      data.company      || '',
        location:     data.location     || '',
        time:         data.time         || 'Agora mesmo',
        type:         data.type         || 'Estágio',
        salary:       data.salary       || 'A combinar',
        target:       data.target       || '',
        desc:         data.desc         || '',
        requirements: JSON.stringify(data.requirements || []),
        benefits:     JSON.stringify(data.benefits     || [])
    });

    return findById(result.lastInsertRowid);
}

function update(id, data) {
    const current = db.prepare('SELECT * FROM vagas WHERE id = ?').get(id);
    if (!current) return null;

    const merged = {
        title:        data.title        ?? current.title,
        company:      data.company      ?? current.company,
        location:     data.location     ?? current.location,
        time:         data.time         ?? current.time,
        type:         data.type         ?? current.type,
        salary:       data.salary       ?? current.salary,
        target:       data.target       ?? current.target,
        desc:         data.desc         ?? current.desc,
        requirements: data.requirements ? JSON.stringify(data.requirements) : current.requirements,
        benefits:     data.benefits     ? JSON.stringify(data.benefits)     : current.benefits
    };

    db.prepare(`
        UPDATE vagas SET
            title=@title, company=@company, location=@location, time=@time,
            type=@type, salary=@salary, target=@target, desc=@desc,
            requirements=@requirements, benefits=@benefits
        WHERE id=@id
    `).run({ ...merged, id });

    return findById(id);
}

function remove(id) {
    const vaga = findById(id);
    if (!vaga) return null;
    db.prepare('DELETE FROM vagas WHERE id = ?').run(id);
    return vaga;
}

module.exports = { findAll, findById, create, update, remove };
