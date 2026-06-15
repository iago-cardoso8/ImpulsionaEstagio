const db = require('./database');
const seedData = require('./seeders.json');

function runSeeders() {
    const countVagas = db.prepare('SELECT COUNT(*) as total FROM vagas').get();
    const countPerfil = db.prepare('SELECT COUNT(*) as total FROM perfil').get();
    const countNotifications = db.prepare('SELECT COUNT(*) as total FROM notifications').get();

    if (countVagas.total === 0) {
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
    } else {
        console.log('⚠️  Seeders de vagas ignorados: banco já possui dados.');
    }

    if (countPerfil.total === 0) {
        db.prepare(`
            INSERT INTO perfil (name, email, course, campus, status, availability)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            'Ana Silva',
            'ana.silva@ifpb.edu.br',
            'Informática',
            'João Pessoa',
            'Em busca de estágio',
            'Período Integral'
        );
        console.log('✅ Perfil inicial inserido.');
    } else {
        console.log('⚠️  Seeders de perfil ignorados: perfil já existe.');
    }

    if (countNotifications.total === 0) {
        const insertNotification = db.prepare(`
            INSERT INTO notifications (title, message, time)
            VALUES (@title, @message, @time)
        `);

        const notifications = [
            {
                title: 'Nova vaga recomendada',
                message: 'Uma oportunidade em Informática acaba de ser publicada.',
                time: 'Há 1 hora'
            },
            {
                title: 'Recado do campus',
                message: 'Atualize seu perfil para receber vagas mais relevantes.',
                time: 'Ontem'
            },
            {
                title: 'Alerta de inscrição',
                message: 'Prazo final para inscrição em vaga de Mecânica: amanhã.',
                time: 'Há 2 dias'
            }
        ];

        const insertManyNotifications = db.transaction((items) => {
            for (const item of items) {
                insertNotification.run(item);
            }
        });

        insertManyNotifications(notifications);
        console.log('✅ Notificações iniciais inseridas.');
    } else {
        console.log('⚠️  Seeders de notificações ignorados: notificações já existem.');
    }
}

module.exports = { runSeeders };
