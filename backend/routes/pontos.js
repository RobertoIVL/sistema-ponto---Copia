const express = require('express');
const RegistroPonto = require('../models/RegistroPonto');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Registrar ponto
router.post('/registrar', verificarToken, async (req, res) => {
  try {
    const { tipo } = req.body;
    const horario = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    
    const registro = await RegistroPonto.registrarPonto(req.usuario.id, tipo, horario);
    res.json(registro);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao registrar ponto' });
  }
});

// Obter registros do dia
router.get('/hoje', verificarToken, async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const registros = await RegistroPonto.obterRegistrosDia(req.usuario.id, hoje);
    res.json(registros || {});
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar registros' });
  }
});

// Obter registros por período
router.get('/periodo', verificarToken, async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const registros = await RegistroPonto.obterRegistrosPeriodo(
      req.usuario.id, 
      dataInicio, 
      dataFim
    );
    res.json(registros);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar registros' });
  }
});

module.exports = router;