const { query, transaction } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');

/**
 * Working Schedules & Day Patterns Controller
 */
class ScheduleController {
  /**
   * Get all schedules
   * GET /api/schedules
   */
  async getSchedules(req, res, next) {
    try {
      const schedules = await query('SELECT * FROM working_schedules ORDER BY id ASC');

      for (const s of schedules) {
        const days = await query(
          'SELECT * FROM working_schedule_days WHERE schedule_id = ? ORDER BY FIELD(day_of_week, "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY")',
          [s.id]
        );
        s.days = days;
      }

      return sendSuccess(res, 'Working schedules retrieved', schedules);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get schedule by ID
   * GET /api/schedules/:id
   */
  async getScheduleById(req, res, next) {
    try {
      const { id } = req.params;
      const rows = await query('SELECT * FROM working_schedules WHERE id = ?', [id]);

      if (rows.length === 0) {
        return sendError(res, 'Schedule not found.', 404);
      }

      const schedule = rows[0];
      const days = await query(
        'SELECT * FROM working_schedule_days WHERE schedule_id = ? ORDER BY FIELD(day_of_week, "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY")',
        [id]
      );
      schedule.days = days;

      return sendSuccess(res, 'Schedule details retrieved', schedule);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Schedule (Calculates total weekly hours automatically)
   * POST /api/schedules
   */
  async createSchedule(req, res, next) {
    try {
      const { name, type = 'STANDARD_40H', days = [] } = req.body;

      if (!name) {
        return sendError(res, 'Schedule name is required.', 400);
      }

      // Calculate weekly hours automatically from day patterns
      let calculatedWeeklyHours = 0;
      const processedDays = [];

      for (const d of days) {
        const start = d.startTime; // e.g. "09:00"
        const end = d.endTime;     // e.g. "18:00"
        const breakMins = parseInt(d.breakMinutes, 10) || 60;

        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const grossMinutes = (eh * 60 + em) - (sh * 60 + sm);
        const netMinutes = Math.max(0, grossMinutes - breakMins);
        const dailyWorkHours = parseFloat((netMinutes / 60).toFixed(2));

        calculatedWeeklyHours += dailyWorkHours;
        processedDays.push({
          dayOfWeek: d.dayOfWeek.toUpperCase(),
          startTime: start,
          endTime: end,
          breakMinutes: breakMins,
          workHours: dailyWorkHours
        });
      }

      const finalWeeklyHours = days.length > 0 ? calculatedWeeklyHours : 40.00;

      const scheduleId = await transaction(async (connection) => {
        const [schedInsert] = await connection.execute(
          'INSERT INTO working_schedules (name, type, weekly_hours) VALUES (?, ?, ?)',
          [name, type, finalWeeklyHours]
        );

        const sId = schedInsert.insertId;

        for (const pd of processedDays) {
          await connection.execute(
            `INSERT INTO working_schedule_days (schedule_id, day_of_week, start_time, end_time, break_minutes, work_hours)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sId, pd.dayOfWeek, pd.startTime, pd.endTime, pd.breakMinutes, pd.workHours]
          );
        }

        return sId;
      });

      return sendCreated(res, 'Working schedule created successfully', {
        id: scheduleId,
        name,
        weeklyHours: finalWeeklyHours
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Schedule
   * PUT /api/schedules/:id
   */
  async updateSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { name, type, isActive, days } = req.body;

      await transaction(async (connection) => {
        await connection.execute(
          `UPDATE working_schedules 
           SET name = COALESCE(?, name), type = COALESCE(?, type), is_active = COALESCE(?, is_active), updated_at = NOW() 
           WHERE id = ?`,
          [name, type, isActive, id]
        );

        if (days && Array.isArray(days) && days.length > 0) {
          await connection.execute('DELETE FROM working_schedule_days WHERE schedule_id = ?', [id]);
          let totalWeekly = 0;

          for (const d of days) {
            const [sh, sm] = d.startTime.split(':').map(Number);
            const [eh, em] = d.endTime.split(':').map(Number);
            const breakMins = parseInt(d.breakMinutes, 10) || 60;
            const netMins = (eh * 60 + em) - (sh * 60 + sm) - breakMins;
            const workHours = parseFloat((netMins / 60).toFixed(2));
            totalWeekly += workHours;

            await connection.execute(
              `INSERT INTO working_schedule_days (schedule_id, day_of_week, start_time, end_time, break_minutes, work_hours)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [id, d.dayOfWeek.toUpperCase(), d.startTime, d.endTime, breakMins, workHours]
            );
          }

          await connection.execute('UPDATE working_schedules SET weekly_hours = ? WHERE id = ?', [totalWeekly, id]);
        }
      });

      return sendSuccess(res, 'Working schedule updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Schedule
   * DELETE /api/schedules/:id
   */
  async deleteSchedule(req, res, next) {
    try {
      const { id } = req.params;
      await query('DELETE FROM working_schedules WHERE id = ?', [id]);
      return sendSuccess(res, 'Working schedule deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScheduleController();
