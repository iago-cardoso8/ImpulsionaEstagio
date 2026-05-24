const express = require('express');
const router = express.Router();
const VagasModel = require('../models/vagasModel');

// ────────────────────────────────────────────────────────────
// VALIDAÇÕES
// ────────────────────────────────────────────────────────────

function validarCamposObrigatorios(data) {
    const camposObrigatorios = ['title', 'company', 'location', 'salary', 'target'];
    const faltantes = camposObrigatorios.filter(campo => !data[campo] || data[campo].toString().trim() === '');
    
    if (faltantes.length > 0) {
        return {
            status: 400,
            erro: 'Campos obrigatórios ausentes',
            camposRequeridos: camposObrigatorios,
            camposFaltantes: faltantes
        };
    }
    return null;
}

function validarId(id) {
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
        return {
            status: 400,
            erro: 'ID inválido. Deve ser um número inteiro positivo'
        };
    }
    return null;
}

// ────────────────────────────────────────────────────────────
// ROTAS - READ (GET)
// ────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    try {
        const vagas = VagasModel.findAll();
        res.status(200).json({
            sucesso: true,
            quantidade: vagas.length,
            dados: vagas
        });
    } catch (erro) {
        console.error('Erro ao listar vagas:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao listar vagas'
        });
    }
});

router.get('/:id', (req, res) => {
    try {
        const erroId = validarId(req.params.id);
        if (erroId) {
            return res.status(erroId.status).json(erroId);
        }

        const vaga = VagasModel.findById(parseInt(req.params.id));

        if (!vaga) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Vaga não encontrada',
                id: parseInt(req.params.id)
            });
        }

        res.status(200).json({
            sucesso: true,
            dados: vaga
        });
    } catch (erro) {
        console.error('Erro ao buscar vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao buscar vaga'
        });
    }
});

// ────────────────────────────────────────────────────────────
// ROTAS - CREATE (POST)
// ────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
    try {
        const erroValidacao = validarCamposObrigatorios(req.body);
        if (erroValidacao) {
            return res.status(erroValidacao.status).json(erroValidacao);
        }

        const novaVaga = VagasModel.create(req.body);
        
        res.status(201).json({
            sucesso: true,
            mensagem: 'Vaga criada com sucesso',
            dados: novaVaga
        });
    } catch (erro) {
        console.error('Erro ao criar vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao criar vaga'
        });
    }
});

// ────────────────────────────────────────────────────────────
// ROTAS - UPDATE (PUT)
// ────────────────────────────────────────────────────────────

router.put('/:id', (req, res) => {
    try {
        const erroId = validarId(req.params.id);
        if (erroId) {
            return res.status(erroId.status).json(erroId);
        }

        const id = parseInt(req.params.id);

        const vagaExistente = VagasModel.findById(id);
        if (!vagaExistente) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Vaga não encontrada',
                id: id
            });
        }

        const vagaAtualizada = VagasModel.update(id, req.body);

        res.status(200).json({
            sucesso: true,
            mensagem: 'Vaga atualizada com sucesso',
            dados: vagaAtualizada
        });
    } catch (erro) {
        console.error('Erro ao atualizar vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao atualizar vaga'
        });
    }
});

// ────────────────────────────────────────────────────────────
// ROTAS - DELETE
// ────────────────────────────────────────────────────────────

router.delete('/:id', (req, res) => {
    try {
        const erroId = validarId(req.params.id);
        if (erroId) {
            return res.status(erroId.status).json(erroId);
        }

        const id = parseInt(req.params.id);

        const vagaRemovida = VagasModel.remove(id);

        if (!vagaRemovida) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Vaga não encontrada',
                id: id
            });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: 'Vaga removida com sucesso',
            dados: vagaRemovida
        });
    } catch (erro) {
        console.error('Erro ao remover vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao remover vaga'
        });
    }
});

module.exports = router;
