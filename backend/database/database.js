const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sistema_ponto.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas
db.serialize(() => {
  // Tabela de usuários
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    cargo TEXT,
    departamento TEXT,
    salario REAL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT 1
  )`);

  // Tabela de registros de ponto
  db.run(`CREATE TABLE IF NOT EXISTS registros_ponto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    data DATE,
    entrada TEXT,
    saida_almoco TEXT,
    volta_almoco TEXT,
    saida TEXT,
    horas_trabalhadas REAL,
    horas_extras REAL,
    observacoes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  )`);

  // Tabela de escalas de trabalho
  db.run(`CREATE TABLE IF NOT EXISTS escalas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    usuario_id INTEGER,
    tipo TEXT,
    carga_horaria_semanal INTEGER,
    dias_trabalho TEXT,
    ativo BOOLEAN DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  )`);

  // Criar usuário admin padrão
  const bcrypt = require('bcryptjs');
  const senhaHash = bcrypt.hashSync('admin123', 10);
  
  db.run(`INSERT OR IGNORE INTO usuarios (nome, email, senha, cargo)
          VALUES ('Administrador', 'admin@chitko.com', ?, 'Admin')`, [senhaHash]);
});

module.exports = db;