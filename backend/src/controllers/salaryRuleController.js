const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');

/**
 * Salary Rules Controller
 */
class SalaryRuleController {
  /**
   * Get all rules
   * GET /api/salary-rules
   */
  async getRules(req, res, next) {
    try {
      const { category, status } = req.query;
      let sql = 'SELECT * FROM salary_rules WHERE 1=1';
      const params = [];

      if (category) {
        sql += ' AND category = ?';
        params.push(category.toUpperCase());
      }
      if (status) {
        sql += ' AND status = ?';
        params.push(status.toUpperCase());
      }

      sql += ' ORDER BY sequence ASC';
      const rules = await query(sql, params);
      return sendSuccess(res, 'Salary rules retrieved', rules);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rule by ID
   * GET /api/salary-rules/:id
   */
  async getRuleById(req, res, next) {
    try {
      const { id } = req.params;
      const rows = await query('SELECT * FROM salary_rules WHERE id = ?', [id]);

      if (rows.length === 0) {
        return sendError(res, 'Salary rule not found.', 404);
      }

      return sendSuccess(res, 'Salary rule retrieved', rows[0]);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Salary Rule
   * POST /api/salary-rules
   */
  async createRule(req, res, next) {
    try {
      const { name, code, category, sequence = 10, computationType = 'FIXED', value = 0.00, formula, status = 'ACTIVE' } = req.body;

      if (!name || !code || !category) {
        return sendError(res, 'Name, code, and category are required.', 400);
      }

      const result = await query(
        `INSERT INTO salary_rules (name, code, category, sequence, computation_type, value, formula, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, code.toUpperCase().trim(), category.toUpperCase(), sequence, computationType.toUpperCase(), value, formula || null, status]
      );

      return sendCreated(res, 'Salary rule created successfully', { id: result.insertId, name, code });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Salary Rule
   * PUT /api/salary-rules/:id
   */
  async updateRule(req, res, next) {
    try {
      const { id } = req.params;
      const { name, category, sequence, computationType, value, formula, status } = req.body;

      await query(
        `UPDATE salary_rules SET
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          sequence = COALESCE(?, sequence),
          computation_type = COALESCE(?, computation_type),
          value = COALESCE(?, value),
          formula = COALESCE(?, formula),
          status = COALESCE(?, status),
          updated_at = NOW()
        WHERE id = ?`,
        [name, category, sequence, computationType, value, formula, status, id]
      );

      return sendSuccess(res, 'Salary rule updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Salary Rule
   * DELETE /api/salary-rules/:id
   */
  async deleteRule(req, res, next) {
    try {
      const { id } = req.params;
      await query('DELETE FROM salary_rules WHERE id = ?', [id]);
      return sendSuccess(res, 'Salary rule deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalaryRuleController();
