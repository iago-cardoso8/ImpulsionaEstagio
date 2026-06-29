import db from './database';
import seedData from './seedData.json';

interface Vaga {
    title: string;
    company: string;
    location: string;
    email?: string;
    time?: string;
    type?: string;
    salary?: string;
    target: string;
    desc?: string;
    requirements?: string[];
    benefits?: string[];
}

interface Notification {
    title: string;
    message: string;
    time: string;
}

interface CountResult {
    total: number;
}

function runSeeders(): void {
    const countVagas: CountResult = db.prepare('SELECT COUNT(*) as total FROM vagas').get() as CountResult;
    const countPerfil: CountResult = db.prepare('SELECT COUNT(*) as total FROM perfil').get() as CountResult;
    const countNotifications: CountResult = db.prepare('SELECT COUNT(*) as total FROM notifications').get() as CountResult;

    if (countVagas.total === 0) {
        const insert = db.prepare(`
            INSERT INTO vagas (title, company, location, email, time, type, salary, target, desc, requirements, benefits)
            VALUES (@title, @company, @location, @email, @time, @type, @salary, @target, @desc, @requirements, @benefits)
        `);

        const insertMany = db.transaction((vagas: Vaga[]) => {
            for (const vaga of vagas) {
                insert.run({
                    ...vaga,
                    email: vaga.email || 'contato@empresa.com',
                    requirements: JSON.stringify(vaga.requirements || []),
                    benefits: JSON.stringify(vaga.benefits || [])
                });
            }
        });

        insertMany(seedData as Vaga[]);
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

        const notifications: Notification[] = [
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

        const insertManyNotifications = db.transaction((items: Notification[]) => {
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

export { runSeeders };
