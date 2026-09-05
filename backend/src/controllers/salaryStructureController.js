const { query, transaction } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');

/**
 * Salary Structures Controller
 */
class SalaryStructureController {
  /**
   * Get all structures
   * GET /api/salary-structures
   */
  async getStructures(req, res, next) {
    try {
      const structures = await query(`
        SELECT ss.*, 
               COUNT(DISTINCT ssr.salary_rule_id) AS rules_count,
               COUNT(DISTINCT c.id) AS active_employees_count
        FROM salary_structures ss
        LEFT JOIN salary_structure_rules ssr ON ss.id = ssr.salary_structure_id
        LEFT JOIN contracts c ON ss.id = c.salary_structure_id AND c.status = 'ACTIVE'
        GROUP BY ss.id
        ORDER BY ss.id ASC
      `);

      for (const s of structures) {
        const rules = await query(
          `SELECT sr.*, ssr.sequence AS structure_sequence
           FROM salary_rules sr
           JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
           WHERE ssr.salary_structure_id = ?
           ORDER BY ssr.sequence ASC, sr.sequence ASC`,
          [s.id]
        );
        s.rules = rules;
      }

      return sendSuccess(res, 'Salary structures retrieved', structures);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get structure by ID
   * GET /api/salary-structures/:id
   */
  async getStructureById(req, res, next) {
    try {
      const { id } = req.params;
      const rows = await query('SELECT * FROM salary_structures WHERE id = ?', [id]);

      if (rows.length === 0) {
        return sendError(res, 'Salary structure not found.', 404);
      }

      const structure = rows[0];
      const rules = await query(
        `SELECT sr.*, ssr.sequence AS structure_sequence
         FROM salary_rules sr
         JOIN salary_structure_rules ssr ON sr.id = ssr.salary_rule_id
         WHERE ssr.salary_structure_id = ?
         ORDER BY ssr.sequence ASC, sr.sequence ASC`,
        [id]
      );
      structure.rules = rules;

      return sendSuccess(res, 'Salary structure details retrieved', structure);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Salary Structure
   * POST /api/salary-structures
   */
  async createStructure(req, res, next) {
    try {
      const { name, code, description, rules = [] } = req.body;

      if (!name || !code) {
        return sendError(res, 'Structure name and code are required.', 400);
      }

      const structureId = await transaction(async (connection) => {
        const [insert] = await connection.execute(
          'INSERT INTO salary_structures (name, code, description) VALUES (?, ?, ?)',
          [name, code.toUpperCase().trim(), description || null]
        );

        const sId = insert.insertId;

        // Insert rules with sequence
        for (let i = 0; i < rules.length; i++) {
          const ruleId = typeof rules[i] === 'object' ? rules[i].ruleId : rules[i];
          const seq = typeof rules[i] === 'object' ? rules[i].sequence || (i + 1) * 10 : (i + 1) * 10;

          await connection.execute(
            'INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES (?, ?, ?)',
            [sId, ruleId, seq]
          );
        }

        return sId;
      });

      return sendCreated(res, 'Salary structure created successfully', { id: structureId, name, code });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Salary Structure & Rules Sequence
   * PUT /api/salary-structures/:id
   */
  async updateStructure(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, status, rules } = req.body;

      await transaction(async (connection) => {
        await connection.execute(
          `UPDATE salary_structures 
           SET name = COALESCE(?, name), description = COALESCE(?, description), 
               status = COALESCE(?, status), updated_at = NOW()
           WHERE id = ?`,
          [name, description, status, id]
        );

        if (rules && Array.isArray(rules)) {
          await connection.execute('DELETE FROM salary_structure_rules WHERE salary_structure_id = ?', [id]);

          for (let i = 0; i < rules.length; i++) {
            const ruleId = typeof rules[i] === 'object' ? rules[i].ruleId : rules[i];
            const seq = typeof rules[i] === 'object' ? rules[i].sequence || (i + 1) * 10 : (i + 1) * 10;

            await connection.execute(
              'INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES (?, ?, ?)',
              [id, ruleId, seq]
            );
          }
        }
      });

      return sendSuccess(res, 'Salary structure updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Salary Structure
   * DELETE /api/salary-structures/:id
   */
  async deleteStructure(req, res, next) {
    try {
      const { id } = req.params;
      await query('DELETE FROM salary_structures WHERE id = ?', [id]);
      return sendSuccess(res, 'Salary structure deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalaryStructureController();
