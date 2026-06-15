const express = require('express');
const router = express.Router();
const ProfileModel = require('../models/profileModel');

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { status: 400, erro: 'E-mail em formato inválido', campo: 'email' };
    }
    return null;
}

function validarCampos(data) {
    const camposObrigatorios = ['name', 'email', 'course', 'campus'];
    const faltantes = camposObrigatorios.filter(campo => !data[campo] || data[campo].toString().trim() === '');
    if (faltantes.length > 0) {
        return { status: 400, erro: 'Campos obrigatórios ausentes', camposFaltantes: faltantes };
    }
    return null;
}

router.get('/', (req, res) => {
    try {
        const perfil = ProfileModel.find();
        if (!perfil) {
            return res.status(404).json({ sucesso: false, erro: 'Perfil não encontrado' });
        }
        res.status(200).json({ sucesso: true, dados: perfil });
    } catch (erro) {
        console.error('Erro ao buscar perfil:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao buscar perfil' });
    }
});

router.put('/', (req, res) => {
    try {
        const erroValidacao = validarCampos(req.body) || validarEmail(req.body.email);
        if (erroValidacao) {
            return res.status(erroValidacao.status).json(erroValidacao);
        }

        const perfilAtualizado = ProfileModel.update(req.body);
        if (!perfilAtualizado) {
            return res.status(404).json({ sucesso: false, erro: 'Perfil não encontrado' });
        }

        res.status(200).json({ sucesso: true, mensagem: 'Perfil atualizado com sucesso', dados: perfilAtualizado });
    } catch (erro) {
        console.error('Erro ao atualizar perfil:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao atualizar perfil' });
    }
});

module.exports = router;
