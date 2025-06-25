const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Inicializar banco de dados
require('./database/database');

// Importar rotas
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const pontoRoutes = require('./routes/pontos');
const escalaRoutes = require('./routes/escalas');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pontos', pontoRoutes);
app.use('/api/escalas', escalaRoutes);

// Servir frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

