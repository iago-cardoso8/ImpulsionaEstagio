const db = require('./database');
const seedData = require('./seeders.json');

function runSeeders() {
    const count = db.prepare('SELECT COUNT(*) as total FROM vagas').get();

    if (count.total > 0) {
        console.log('⚠️  Seeders ignorados: banco já possui dados.');
        return;
    }

    const insert = db.prepare(`
        INSERT INTO vagas (title, company, location, email, time, type, salary, target, desc, requirements, benefits)
        VALUES (@title, @company, @location, @email, @time, @type, @salary, @target, @desc, @requirements, @benefits)
    `);

    const insertMany = db.transaction((vagas) => {
        for (const vaga of vagas) {
            insert.run({
                ...vaga,
                email: vaga.email || 'contato@empresa.com',
                requirements: JSON.stringify(vaga.requirements || []),
                benefits: JSON.stringify(vaga.benefits || [])
            });
        }
    });

    insertMany(seedData);
    console.log(`✅ Seeders executados: ${seedData.length} vagas inseridas.`);
}

module.exports = { runSeeders };
