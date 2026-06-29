import express, { Router, Request, Response } from 'express';
import * as ProfileModel from '../models/profileModel';

const router: Router = express.Router();

interface ValidationError {
    status: number;
    erro: string;
    campo?: string;
    camposFaltantes?: string[];
}

function validarEmail(email: string): ValidationError | null {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { status: 400, erro: 'E-mail em formato inválido', campo: 'email' };
    }
    return null;
}

function validarCampos(data: any): ValidationError | null {
    const camposObrigatorios = ['name', 'email', 'course', 'campus'];
    const faltantes = camposObrigatorios.filter(campo => !data[campo] || data[campo].toString().trim() === '');
    if (faltantes.length > 0) {
        return { status: 400, erro: 'Campos obrigatórios ausentes', camposFaltantes: faltantes };
    }
    return null;
}

router.get('/', (req: Request, res: Response): void => {
    try {
        const perfil = ProfileModel.find();
        if (!perfil) {
            res.status(404).json({ sucesso: false, erro: 'Perfil não encontrado' });
            return;
        }
        res.status(200).json({ sucesso: true, dados: perfil });
    } catch (erro: any) {
        console.error('Erro ao buscar perfil:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao buscar perfil' });
    }
});

router.put('/', (req: Request, res: Response): void => {
    try {
        const erroValidacao = validarCampos(req.body) || validarEmail(req.body.email);
        if (erroValidacao) {
            res.status(erroValidacao.status).json(erroValidacao);
            return;
        }

        const perfilAtualizado = ProfileModel.update(req.body);
        if (!perfilAtualizado) {
            res.status(404).json({ sucesso: false, erro: 'Perfil não encontrado' });
            return;
        }

        res.status(200).json({ sucesso: true, mensagem: 'Perfil atualizado com sucesso', dados: perfilAtualizado });
    } catch (erro: any) {
        console.error('Erro ao atualizar perfil:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao atualizar perfil' });
    }
});

export default router;
