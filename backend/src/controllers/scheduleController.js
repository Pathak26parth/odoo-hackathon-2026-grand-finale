const { query, transaction } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const emailService = require('../services/emailService');

const TYPE_MAP = {
  'FULL-TIME': 'STANDARD_40H',
  'FULL_TIME': 'STANDARD_40H',
  'STANDARD_40H': 'STANDARD_40H',
  'PART-TIME': 'PART_TIME',
  'PART_TIME': 'PART_TIME',
  'FLEXIBLE': 'FLEXIBLE',
  'SHIFT': 'SHIFT_BASED',
  'SHIFT-BASED': 'SHIFT_BASED',
  'SHIFT_BASED': 'SHIFT_BASED'
};

const DISPLAY_TYPE_MAP = {
  'STANDARD_40H': 'Full-Time (40h/week)',
  'PART_TIME': 'Part-Time',
  'SHIFT_BASED': 'Shift-Based',
  'FLEXIBLE': 'Flexible Schedule'
};

function normalizeScheduleType(rawType) {
  if (!rawType) return 'STANDARD_40H';
  const key = String(rawType).trim().toUpperCase().replace(/[\s-]/g, '_');
  return TYPE_MAP[key] || 'STANDARD_40H';
}

function normalizeIsActive(isActive, status) {
  if (isActive !== undefined) return !!isActive;
  if (status !== undefined) return String(status).trim().toUpperCase() === 'ACTIVE';
  return true;
}

function processScheduleDays(days = []) {
  let calculatedWeeklyHours = 0;
  const processedDays = [];

  for (const d of days) {
    if (d.working === false) continue;

    const dayRaw = d.dayOfWeek || d.day || '';
    if (!dayRaw) continue;
    const dayUpper = dayRaw.toUpperCase().trim();

    const start = d.startTime || '09:00';
    const end = d.endTime || '18:00';
    const breakMins = d.breakMinutes !== undefined
      ? (parseInt(d.breakMinutes, 10) || 0)
      : Math.round((parseFloat(d.breakDuration) || 0) * 60);

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const grossMinutes = (eh * 60 + em) - (sh * 60 + sm);
    const netMinutes = Math.max(0, grossMinutes - breakMins);
    const dailyWorkHours = parseFloat((netMinutes / 60).toFixed(2));

    calculatedWeeklyHours += dailyWorkHours;
    processedDays.push({
      dayOfWeek: dayUpper,
      startTime: start.length === 5 ? `${start}:00` : start,
      endTime: end.length === 5 ? `${end}:00` : end,
      breakMinutes: breakMins,
      workHours: dailyWorkHours
    });
  }

  const finalWeeklyHours = parseFloat(calculatedWeeklyHours.toFixed(2));
  return { processedDays, finalWeeklyHours };
}

async function dispatchScheduleNotifications({ scheduleId, scheduleName, normalizedType, isActive, weeklyHours, processedDays }) {
  try {
    const targetStatus = isActive ? 'ACTIVE' : 'INACTIVE';
    const displayType = DISPLAY_TYPE_MAP[normalizedType] || normalizedType;
    const displayStatus = isActive ? 'Active' : 'Inactive';

    // Query employees whose status matches schedule status AND whose schedule type/assignment matches
    let targetEmployees = await query(
      `SELECT e.id, e.first_name, e.last_name, e.email, e.status, e.working_schedule_id, ws.type AS schedule_type, u.id AS user_id
       FROM employees e
       LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
       LEFT JOIN users u ON u.employee_id = e.id
       WHERE e.status = ? 
         AND (e.working_schedule_id = ? OR ws.type = ? OR e.working_schedule_id IS NULL)`,
      [targetStatus, scheduleId, normalizedType]
    );

    // If no employees specifically matched by schedule type, fallback to all employees matching the status
    if (targetEmployees.length === 0) {
      targetEmployees = await query(
        `SELECT e.id, e.first_name, e.last_name, e.email, e.status, e.working_schedule_id, u.id AS user_id
         FROM employees e
         LEFT JOIN users u ON u.employee_id = e.id
         WHERE e.status = ?`,
        [targetStatus]
      );
    }

    console.log(`[Schedule Notification] Dispatching emails to ${targetEmployees.length} employee(s) (Status: ${targetStatus}, Type: ${normalizedType})...`);

    for (const emp of targetEmployees) {
      const fullName = `${emp.first_name} ${emp.last_name}`.trim() || 'Employee';

      if (emp.email) {
        emailService.sendScheduleNotificationEmail({
          employeeEmail: emp.email,
          employeeName: fullName,
          scheduleName,
          scheduleType: displayType,
          scheduleStatus: displayStatus,
          weeklyHours,
          days: processedDays
        }).then(res => {
          console.log(`[Schedule Email] Dispatched to ${emp.email} (${res.simulated ? 'SIMULATED' : 'SENT'})`);
        }).catch(err => {
          console.error(`[Schedule Email Error] ${emp.email}:`, err.message);
        });
      }

      if (emp.user_id) {
        query(
          `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
          [
            emp.user_id,
            `Work Schedule: ${scheduleName}`,
            `New working schedule (${displayType} - ${weeklyHours} hrs/week) configured.`,
            'INFO',
            '/working-schedules'
          ]
        ).catch(err => console.error('[Schedule In-App Notif Error]:', err.message));
      }
    }
  } catch (notifErr) {
    console.error('[Schedule Notification Error]:', notifErr.message);
  }
}

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
      const schedules = await query(`
        SELECT 
          ws.*,
          COUNT(DISTINCT e.id) AS assignedEmployees
        FROM working_schedules ws
        LEFT JOIN employees e ON e.working_schedule_id = ws.id
        GROUP BY ws.id
        ORDER BY ws.id ASC
      `);

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
      const rows = await query(`
        SELECT 
          ws.*,
          COUNT(DISTINCT e.id) AS assignedEmployees
        FROM working_schedules ws
        LEFT JOIN employees e ON e.working_schedule_id = ws.id
        WHERE ws.id = ?
        GROUP BY ws.id
      `, [id]);

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

      if (!name || !name.trim()) {
        return sendError(res, 'Schedule name is required.', 400);
      }

      const normalizedType = normalizeScheduleType(type);
      const isActiveBool = normalizeIsActive(req.body.isActive, req.body.status);
      const { processedDays, finalWeeklyHours } = processScheduleDays(days);
      const totalWeekly = days.length > 0 ? finalWeeklyHours : 40.00;

      const scheduleId = await transaction(async (connection) => {
        const [schedInsert] = await connection.execute(
          'INSERT INTO working_schedules (name, type, weekly_hours, is_active) VALUES (?, ?, ?, ?)',
          [name.trim(), normalizedType, totalWeekly, isActiveBool ? 1 : 0]
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

      // Dispatch automated notification emails asynchronously to matching employees
      dispatchScheduleNotifications({
        scheduleId,
        scheduleName: name.trim(),
        normalizedType,
        isActive: isActiveBool,
        weeklyHours: totalWeekly,
        processedDays
      });

      return sendCreated(res, 'Working schedule created successfully', {
        id: scheduleId,
        name: name.trim(),
        type: normalizedType,
        weeklyHours: totalWeekly,
        isActive: isActiveBool,
        days: processedDays
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
      const { name, type, days } = req.body;

      const normalizedType = type ? normalizeScheduleType(type) : undefined;
      const isActiveBool = (req.body.isActive !== undefined || req.body.status !== undefined)
        ? (normalizeIsActive(req.body.isActive, req.body.status) ? 1 : 0)
        : undefined;

      let processedDays = [];
      let totalWeekly = null;

      if (days && Array.isArray(days) && days.length > 0) {
        const processed = processScheduleDays(days);
        processedDays = processed.processedDays;
        totalWeekly = processed.finalWeeklyHours;
      }

      await transaction(async (connection) => {
        await connection.execute(
          `UPDATE working_schedules 
           SET name = COALESCE(?, name), 
               type = COALESCE(?, type), 
               is_active = COALESCE(?, is_active), 
               weekly_hours = COALESCE(?, weekly_hours),
               updated_at = NOW() 
           WHERE id = ?`,
          [name ? name.trim() : null, normalizedType || null, isActiveBool !== undefined ? isActiveBool : null, totalWeekly, id]
        );

        if (processedDays.length > 0) {
          await connection.execute('DELETE FROM working_schedule_days WHERE schedule_id = ?', [id]);

          for (const pd of processedDays) {
            await connection.execute(
              `INSERT INTO working_schedule_days (schedule_id, day_of_week, start_time, end_time, break_minutes, work_hours)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [id, pd.dayOfWeek, pd.startTime, pd.endTime, pd.breakMinutes, pd.workHours]
            );
          }
        }
      });

      const updatedRows = await query('SELECT * FROM working_schedules WHERE id = ?', [id]);
      if (updatedRows && updatedRows.length > 0) {
        const updated = updatedRows[0];
        dispatchScheduleNotifications({
          scheduleId: id,
          scheduleName: updated.name,
          normalizedType: updated.type,
          isActive: !!updated.is_active,
          weeklyHours: parseFloat(updated.weekly_hours),
          processedDays
        });
      }

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
