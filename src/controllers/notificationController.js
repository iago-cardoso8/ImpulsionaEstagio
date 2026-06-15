const express = require('express');
const router = express.Router();
const NotificationModel = require('../models/notificationModel');

function validarNotificacao(data) {
    const camposObrigatorios = ['title', 'message', 'time'];
    const faltantes = camposObrigatorios.filter(campo => !data[campo] || data[campo].toString().trim() === '');
    if (faltantes.length > 0) {
        return { status: 400, erro: 'Campos obrigatórios ausentes', camposFaltantes: faltantes };
    }
    return null;
}

router.get('/', (req, res) => {
    try {
        const notifications = NotificationModel.findAll();
        res.status(200).json({ sucesso: true, quantidade: notifications.length, dados: notifications });
    } catch (erro) {
        console.error('Erro ao buscar notificações:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao buscar notificações' });
    }
});

router.post('/', (req, res) => {
    try {
        const erroValidacao = validarNotificacao(req.body);
        if (erroValidacao) {
            return res.status(erroValidacao.status).json(erroValidacao);
        }

        const notifications = NotificationModel.create(req.body);
        res.status(201).json({ sucesso: true, mensagem: 'Notificação criada com sucesso', quantidade: notifications.length, dados: notifications });
    } catch (erro) {
        console.error('Erro ao criar notificação:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao criar notificação' });
    }
});

module.exports = router;
