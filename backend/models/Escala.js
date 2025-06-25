const db = require('../database/database');

class Escala {
  static async criar(dadosEscala) {
    const { nome, usuario_id, tipo, carga_horaria_semanal, dias_trabalho } = dadosEscala;
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO escalas (nome, usuario_id, tipo, carga_horaria_semanal, dias_trabalho) 
                   VALUES (?, ?, ?, ?, ?)`;
      db.run(sql, [nome, usuario_id, tipo, carga_horaria_semanal, JSON.stringify(dias_trabalho)], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...dadosEscala });
      });
    });
  }

  static async listarTodas() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT e.*, u.nome as usuario_nome 
                   FROM escalas e 
                   LEFT JOIN usuarios u ON e.usuario_id = u.id`;
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else {
          rows.forEach(row => {
            if (row.dias_trabalho) row.dias_trabalho = JSON.parse(row.dias_trabalho);
          });
          resolve(rows);
        }
      });
    });
  }

  static async atualizar(id, dadosEscala) {
    const { nome, usuario_id, tipo, carga_horaria_semanal, dias_trabalho, ativo } = dadosEscala;
    return new Promise((resolve, reject) => {
      const sql = `UPDATE escalas 
                   SET nome = ?, usuario_id = ?, tipo = ?, carga_horaria_semanal = ?, dias_trabalho = ?, ativo = ?
                   WHERE id = ?`;
      db.run(sql, [nome, usuario_id, tipo, carga_horaria_semanal, JSON.stringify(dias_trabalho), ativo, id], function(err) {
        if (err) reject(err);
        else resolve({ id, ...dadosEscala });
      });
    });
  }

  static async deletar(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM escalas WHERE id = ?`;
      db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve({ message: 'Escala deletada com sucesso' });
      });
    });
  }
}

module.exports = Escala;