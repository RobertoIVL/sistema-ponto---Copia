const express = require('express');
const Escala = require('../models/Escala');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Criar escala
router.post('/', verificarToken, async (req, res) => {
  try {
    const escala = await Escala.criar(req.body);
    res.status(201).json(escala);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao criar escala' });
  }
});

// Listar escalas
router.get('/', verificarToken, async (req, res) => {
  try {
    const escalas = await Escala.listarTodas();
    res.json(escalas);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar escalas' });
  }
});

// Atualizar escala
router.put('/:id', verificarToken, async (req, res) => {
    try {
      const escala = await Escala.atualizar(req.params.id, req.body);
      res.json(escala);
    } catch (error) {
      res.status(400).json({ erro: 'Erro ao atualizar escala' });
    }
  });
  
  // Deletar escala
  router.delete('/:id', verificarToken, async (req, res) => {
    try {
      await Escala.deletar(req.params.id);
      res.json({ message: 'Escala deletada com sucesso' });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao deletar escala' });
    }
  });

module.exports = router;