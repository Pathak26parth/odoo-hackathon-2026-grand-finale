const { query } = require('../config/db');
const { sendSuccess } = require('../utils/response');

/**
 * Real-Time Dashboard & Analytics Controller
 * Calculates all live metrics and chart series directly from normalized MySQL records
 */
class DashboardController {
  /**
   * Helper: Normalize month name or YYYY-MM to standard 'YYYY-MM'
   */
  normalizePeriod(periodStr) {
    if (!periodStr || periodStr === 'All' || periodStr === 'ALL') return null;
    const str = String(periodStr).trim();
    if (/^\d{4}-\d{2}$/.test(str)) return str;

    // e.g. "September 2026", "August 2026"
    const monthMap = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const parts = str.toLowerCase().split(/\s+/);
    if (parts.length >= 2) {
      const monthPart = parts[0];
      const yearPart = parts[1].replace(/\D/g, '');
      const monthNum = monthMap[monthPart];
      if (monthNum && yearPart.length === 4) {
        return `${yearPart}-${monthNum}`;
      }
    }
    return str;
  }

  /**
   * Helper: Calculate previous month string 'YYYY-MM'
   */
  getPreviousMonth(periodYm) {
    if (!periodYm || !/^\d{4}-\d{2}$/.test(periodYm)) return null;
    const [y, m] = periodYm.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 2, 1));
    const prevY = d.getUTCFullYear();
    const prevM = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${prevY}-${prevM}`;
  }

  /**
   * Get Live Dashboard Insights
   * GET /api/dashboard
   */
  async getDashboardMetrics(req, res, next) {
    try {
      const { period, departmentId, type } = req.query;

      // 1. Resolve Available Filter Options from DB
      const periodsRaw = await query(`
        SELECT DISTINCT DATE_FORMAT(period_start, '%Y-%m') AS period_key, DATE_FORMAT(period_start, '%M %Y') AS period_label, period_start
        FROM payslips
        UNION
        SELECT DISTINCT DATE_FORMAT(period_start, '%Y-%m') AS period_key, DATE_FORMAT(period_start, '%M %Y') AS period_label, period_start
        FROM payruns
        ORDER BY period_start DESC
      `);

      const currentYm = new Date().toISOString().slice(0, 7);
      const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const periodOptions = [{ key: 'All', label: 'All Periods' }];
      const seenPeriods = new Set(['All']);

      for (const p of periodsRaw) {
        if (p.period_key && !seenPeriods.has(p.period_key)) {
          seenPeriods.add(p.period_key);
          periodOptions.push({ key: p.period_key, label: p.period_label });
        }
      }

      if (!seenPeriods.has(currentYm)) {
        periodOptions.splice(1, 0, { key: currentYm, label: `${currentMonthLabel} (Current)` });
      }

      const departmentsRaw = await query('SELECT id, name, code FROM departments ORDER BY name ASC');
      const departmentOptions = [
        { id: 'All', name: 'All Departments' },
        ...departmentsRaw.map(d => ({ id: String(d.id), name: d.name, code: d.code }))
      ];

      const schedulesRaw = await query('SELECT DISTINCT type, name FROM working_schedules ORDER BY name ASC');
      const typeOptions = [
        { id: 'All', name: 'All Types' },
        { id: 'Full-Time', name: 'Full-Time (Standard)' },
        { id: 'Contractor', name: 'Contractor / Part-Time' }
      ];
      for (const s of schedulesRaw) {
        if (s.type && !typeOptions.some(t => t.id === s.type)) {
          typeOptions.push({ id: s.type, name: s.name || s.type });
        }
      }

      // 2. Parse selected filters
      const normPeriod = this.normalizePeriod(period);
      const isAllPeriod = !normPeriod || normPeriod === 'All';

      let deptFilterId = null;
      if (departmentId && departmentId !== 'All') {
        if (/^\d+$/.test(String(departmentId).trim())) {
          deptFilterId = parseInt(departmentId, 10);
        } else {
          const matchedDept = departmentsRaw.find(d =>
            d.name.toLowerCase() === String(departmentId).toLowerCase() ||
            d.code.toLowerCase() === String(departmentId).toLowerCase()
          );
          if (matchedDept) deptFilterId = matchedDept.id;
        }
      }

      const scheduleTypeFilter = type && type !== 'All' ? type : null;

      // 3. KPI Calculations
      // Payroll KPI metrics (Paid / Processed Payslips)
      let payrollSql = `
        SELECT 
          COALESCE(SUM(p.net_amount), 0) AS total_net_paid,
          COUNT(p.id) AS total_payslips,
          COALESCE(AVG(p.net_amount), 0) AS average_salary
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        WHERE 1=1
      `;
      const payParams = [];
      if (!isAllPeriod) {
        payrollSql += ' AND p.period_start LIKE ?';
        payParams.push(`${normPeriod}%`);
      }
      if (deptFilterId) {
        payrollSql += ' AND e.department_id = ?';
        payParams.push(deptFilterId);
      }
      if (scheduleTypeFilter) {
        if (scheduleTypeFilter === 'Full-Time') {
          payrollSql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
        } else if (scheduleTypeFilter === 'Contractor') {
          payrollSql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
        } else {
          payrollSql += ' AND (ws.type = ? OR ws.name = ?)';
          payParams.push(scheduleTypeFilter, scheduleTypeFilter);
        }
      }

      const [payResult] = await query(payrollSql, payParams);
      const currentTotalNet = parseFloat(payResult.total_net_paid) || 0.0;
      const payslipsCount = parseInt(payResult.total_payslips, 10) || 0;
      let averageSalary = parseFloat(payResult.average_salary) || 0.0;

      // If average salary from payslips is 0, compute baseline average from active contracts matching filters
      if (averageSalary === 0) {
        let contractAvgSql = `
          SELECT COALESCE(AVG(c.wage), 0) AS avg_wage
          FROM contracts c
          JOIN employees e ON c.employee_id = e.id
          LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
          WHERE c.status = 'ACTIVE'
        `;
        const contractParams = [];
        if (deptFilterId) {
          contractAvgSql += ' AND e.department_id = ?';
          contractParams.push(deptFilterId);
        }
        if (scheduleTypeFilter) {
          if (scheduleTypeFilter === 'Full-Time') {
            contractAvgSql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
          } else if (scheduleTypeFilter === 'Contractor') {
            contractAvgSql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
          } else {
            contractAvgSql += ' AND (ws.type = ? OR ws.name = ?)';
            contractParams.push(scheduleTypeFilter, scheduleTypeFilter);
          }
        }
        const [contractAvgResult] = await query(contractAvgSql, contractParams);
        averageSalary = parseFloat(contractAvgResult?.avg_wage) || 0.0;
      }

      // Calculate Growth % against previous period
      let salaryGrowth = null;
      let salaryGrowthFormatted = '+0.0%';
      if (!isAllPeriod) {
        const prevMonth = this.getPreviousMonth(normPeriod);
        if (prevMonth) {
          let prevPaySql = `
            SELECT COALESCE(SUM(p.net_amount), 0) AS prev_net_paid
            FROM payslips p
            JOIN employees e ON p.employee_id = e.id
            LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
            WHERE p.period_start LIKE ?
          `;
          const prevParams = [`${prevMonth}%`];
          if (deptFilterId) {
            prevPaySql += ' AND e.department_id = ?';
            prevParams.push(deptFilterId);
          }
          if (scheduleTypeFilter) {
            if (scheduleTypeFilter === 'Full-Time') {
              prevPaySql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
            } else if (scheduleTypeFilter === 'Contractor') {
              prevPaySql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
            } else {
              prevPaySql += ' AND (ws.type = ? OR ws.name = ?)';
              prevParams.push(scheduleTypeFilter, scheduleTypeFilter);
            }
          }
          const [prevResult] = await query(prevPaySql, prevParams);
          const prevNet = parseFloat(prevResult?.prev_net_paid) || 0;
          if (prevNet > 0) {
            const growthVal = ((currentTotalNet - prevNet) / prevNet) * 100;
            salaryGrowth = parseFloat(growthVal.toFixed(1));
            salaryGrowthFormatted = `${growthVal >= 0 ? '+' : ''}${growthVal.toFixed(1)}%`;
          } else if (currentTotalNet > 0) {
            salaryGrowth = 100.0;
            salaryGrowthFormatted = '+100%';
          }
        }
      }

      // Approved Time Off KPI
      let leaveSql = `
        SELECT COALESCE(SUM(r.total_days), 0) AS approved_leave_days
        FROM time_off_requests r
        JOIN employees e ON r.employee_id = e.id
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        WHERE r.status = 'APPROVED'
      `;
      const leaveParams = [];
      if (!isAllPeriod) {
        leaveSql += ' AND r.start_date LIKE ?';
        leaveParams.push(`${normPeriod}%`);
      }
      if (deptFilterId) {
        leaveSql += ' AND e.department_id = ?';
        leaveParams.push(deptFilterId);
      }
      if (scheduleTypeFilter) {
        if (scheduleTypeFilter === 'Full-Time') {
          leaveSql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
        } else if (scheduleTypeFilter === 'Contractor') {
          leaveSql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
        } else {
          leaveSql += ' AND (ws.type = ? OR ws.name = ?)';
          leaveParams.push(scheduleTypeFilter, scheduleTypeFilter);
        }
      }
      const [leaveResult] = await query(leaveSql, leaveParams);
      const approvedLeaveDays = parseFloat(leaveResult.approved_leave_days) || 0.0;

      // Attendance Health % (Present / Overtime vs Late / Absent / Incomplete)
      let attSql = `
        SELECT 
          COUNT(*) AS total_punches,
          SUM(CASE WHEN a.status = 'PRESENT' OR a.status = 'OVERTIME' THEN 1 ELSE 0 END) AS on_time_count,
          SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,
          SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,
          SUM(CASE WHEN a.status = 'HALF_DAY' THEN 1 ELSE 0 END) AS half_day_count,
          SUM(CASE WHEN a.check_out IS NULL AND a.date < CURRENT_DATE THEN 1 ELSE 0 END) AS missing_checkouts,
          SUM(CASE WHEN a.is_manual_correction = TRUE THEN 1 ELSE 0 END) AS manual_edits,
          COALESCE(SUM(a.overtime_hours), 0) AS total_overtime_hours
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        WHERE 1=1
      `;
      const attParams = [];
      if (!isAllPeriod) {
        attSql += ' AND a.date LIKE ?';
        attParams.push(`${normPeriod}%`);
      }
      if (deptFilterId) {
        attSql += ' AND e.department_id = ?';
        attParams.push(deptFilterId);
      }
      if (scheduleTypeFilter) {
        if (scheduleTypeFilter === 'Full-Time') {
          attSql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
        } else if (scheduleTypeFilter === 'Contractor') {
          attSql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
        } else {
          attSql += ' AND (ws.type = ? OR ws.name = ?)';
          attParams.push(scheduleTypeFilter, scheduleTypeFilter);
        }
      }
      const [attResult] = await query(attSql, attParams);

      const totalPunches = parseInt(attResult.total_punches, 10) || 0;
      const onTimePunches = parseInt(attResult.on_time_count, 10) || 0;
      const attendanceHealthScore = totalPunches > 0
        ? parseFloat(((onTimePunches / totalPunches) * 100).toFixed(1))
        : 100.0;
      const attendanceHealthStatus = attendanceHealthScore >= 95 ? 'Healthy' : (attendanceHealthScore >= 80 ? 'Warning' : 'Critical');

      // 4. Payrun Status Counts
      let payrunCountSql = `
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END), 0) AS draft_count,
          COALESCE(SUM(CASE WHEN status = 'COMPUTED' THEN 1 ELSE 0 END), 0) AS computed_count,
          COALESCE(SUM(CASE WHEN status = 'VALIDATED' THEN 1 ELSE 0 END), 0) AS validated_count,
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) AS paid_count
        FROM payruns
        WHERE 1=1
      `;
      const payrunCountParams = [];
      if (!isAllPeriod) {
        payrunCountSql += ' AND period_start LIKE ?';
        payrunCountParams.push(`${normPeriod}%`);
      }
      const [payrunCountResult] = await query(payrunCountSql, payrunCountParams);
      const payrunCounts = {
        draft: parseInt(payrunCountResult.draft_count, 10) || 0,
        computed: parseInt(payrunCountResult.computed_count, 10) || 0,
        validated: parseInt(payrunCountResult.validated_count, 10) || 0,
        paid: parseInt(payrunCountResult.paid_count, 10) || 0
      };

      // 5. Salary Cost by Department (For Bar Chart & Distribution)
      let deptCostSql = `
        SELECT 
          d.id,
          d.name AS department,
          COALESCE(SUM(p.net_amount), 0) AS amount
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'ACTIVE'
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        LEFT JOIN payslips p ON e.id = p.employee_id
          ${!isAllPeriod ? ' AND p.period_start LIKE ?' : ''}
        WHERE 1=1
      `;
      const deptCostParams = !isAllPeriod ? [`${normPeriod}%`] : [];
      if (deptFilterId) {
        deptCostSql += ' AND d.id = ?';
        deptCostParams.push(deptFilterId);
      }
      if (scheduleTypeFilter) {
        if (scheduleTypeFilter === 'Full-Time') {
          deptCostSql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
        } else if (scheduleTypeFilter === 'Contractor') {
          deptCostSql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
        } else {
          deptCostSql += ' AND (ws.type = ? OR ws.name = ?)';
          deptCostParams.push(scheduleTypeFilter, scheduleTypeFilter);
        }
      }
      deptCostSql += ' GROUP BY d.id, d.name ORDER BY amount DESC, d.name ASC';
      const deptCostsRaw = await query(deptCostSql, deptCostParams);

      const totalDeptCostSum = deptCostsRaw.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      const salaryByDepartment = deptCostsRaw.map(d => {
        const amt = parseFloat(d.amount) || 0;
        return {
          id: d.id,
          department: d.department,
          amount: amt,
          percentage: totalDeptCostSum > 0 ? Math.round((amt / totalDeptCostSum) * 100) : 0
        };
      });

      // 6. Monthly Net Salary Trends (Historical trajectory for Chart)
      let trendSql = `
        SELECT 
          DATE_FORMAT(p.period_end, '%Y-%m') AS month_key,
          DATE_FORMAT(p.period_end, '%b %Y') AS month,
          COALESCE(SUM(p.net_amount), 0) AS net,
          COALESCE(SUM(p.gross_amount), 0) AS gross,
          COUNT(p.id) AS payslips_count
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        WHERE 1=1
      `;
      const trendParams = [];
      if (deptFilterId) {
        trendSql += ' AND e.department_id = ?';
        trendParams.push(deptFilterId);
      }
      if (scheduleTypeFilter) {
        if (scheduleTypeFilter === 'Full-Time') {
          trendSql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
        } else if (scheduleTypeFilter === 'Contractor') {
          trendSql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
        } else {
          trendSql += ' AND (ws.type = ? OR ws.name = ?)';
          trendParams.push(scheduleTypeFilter, scheduleTypeFilter);
        }
      }
      trendSql += `
        GROUP BY DATE_FORMAT(p.period_end, '%Y-%m'), DATE_FORMAT(p.period_end, '%b %Y')
        ORDER BY month_key ASC
        LIMIT 12
      `;
      const monthlyTrends = await query(trendSql, trendParams);

      // 7. Department Breakdown Detailed Table
      let deptBreakdownSql = `
        SELECT 
          d.id,
          d.name AS department_name,
          d.code AS department_code,
          COUNT(DISTINCT e.id) AS employee_count,
          COALESCE(SUM(p.net_amount), 0) AS total_salary_cost,
          COALESCE(AVG(p.net_amount), 0) AS average_salary
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'ACTIVE'
        LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
        LEFT JOIN payslips p ON e.id = p.employee_id
          ${!isAllPeriod ? ' AND p.period_start LIKE ?' : ''}
        WHERE 1=1
      `;
      const deptBreakdownParams = !isAllPeriod ? [`${normPeriod}%`] : [];
      if (deptFilterId) {
        deptBreakdownSql += ' AND d.id = ?';
        deptBreakdownParams.push(deptFilterId);
      }
      if (scheduleTypeFilter) {
        if (scheduleTypeFilter === 'Full-Time') {
          deptBreakdownSql += ' AND (ws.type = "STANDARD_40H" OR ws.type = "SHIFT_BASED")';
        } else if (scheduleTypeFilter === 'Contractor') {
          deptBreakdownSql += ' AND (ws.type = "PART_TIME" OR ws.type = "FLEXIBLE" OR e.job_position LIKE "%Contract%")';
        } else {
          deptBreakdownSql += ' AND (ws.type = ? OR ws.name = ?)';
          deptBreakdownParams.push(scheduleTypeFilter, scheduleTypeFilter);
        }
      }
      deptBreakdownSql += ' GROUP BY d.id, d.name, d.code ORDER BY total_salary_cost DESC, d.name ASC';
      const deptBreakdownRaw = await query(deptBreakdownSql, deptBreakdownParams);

      const departmentBreakdown = deptBreakdownRaw.map(d => ({
        id: d.id,
        department_name: d.department_name,
        department_code: d.department_code,
        employee_count: parseInt(d.employee_count, 10) || 0,
        total_salary_cost: parseFloat(d.total_salary_cost) || 0.0,
        average_salary: parseFloat(d.average_salary) || 0.0,
        attendance_pct: attendanceHealthScore
      }));

      // 8. Operational & Compliance Alerts
      const [missingBankCount] = await query(`
        SELECT COUNT(*) AS count
        FROM employees e
        LEFT JOIN employee_bank_details ebd ON e.id = ebd.employee_id AND ebd.is_primary = TRUE
        WHERE e.status = 'ACTIVE' AND (ebd.account_number IS NULL OR ebd.ifsc_code IS NULL)
      `);

      const [missingContractCount] = await query(`
        SELECT COUNT(*) AS count
        FROM employees e
        LEFT JOIN contracts c ON e.id = c.employee_id AND c.status = 'ACTIVE'
        WHERE e.status = 'ACTIVE' AND c.id IS NULL
      `);

      const [pendingLeaveCount] = await query(`
        SELECT COUNT(*) AS count
        FROM time_off_requests
        WHERE status = 'PENDING'
      `);

      // 9. Face check-ins count
      const [faceCheckinResult] = await query('SELECT COUNT(*) AS count FROM face_verification_logs WHERE status = "SUCCESS"');

      // 10. Time off statistics summary
      const [timeOffStats] = await query(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN total_days ELSE 0 END), 0) AS approved_days,
          COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_requests,
          COALESCE(SUM(CASE WHEN status = 'REFUSED' THEN 1 ELSE 0 END), 0) AS refused_requests
        FROM time_off_requests
      `);
      const [leaveBalanceResult] = await query('SELECT COALESCE(SUM(remaining_days), 0) AS total_balance FROM time_off_allocations WHERE status = "APPROVED"');

      return sendSuccess(res, 'Live dashboard metrics calculated', {
        filters: {
          periods: periodOptions,
          departments: departmentOptions,
          types: typeOptions,
          selected: {
            period: normPeriod || 'All',
            departmentId: departmentId || 'All',
            type: type || 'All'
          }
        },
        kpi: {
          totalNetSalaryPaid: currentTotalNet,
          salaryGrowth: salaryGrowthFormatted,
          salaryGrowthValue: salaryGrowth,
          payslipsGenerated: payslipsCount,
          averageSalary: Math.round(averageSalary),
          approvedLeaveDays: approvedLeaveDays,
          attendanceHealthScore: attendanceHealthScore,
          attendanceHealthStatus: attendanceHealthStatus
        },
        payruns: payrunCounts,
        salaryByDepartment,
        monthlyTrends: monthlyTrends.map(m => ({
          month_key: m.month_key,
          month: m.month,
          net: parseFloat(m.net) || 0,
          gross: parseFloat(m.gross) || 0,
          payslips_count: parseInt(m.payslips_count, 10) || 0
        })),
        departmentBreakdown,
        attendanceOverview: {
          totalEntries: totalPunches,
          presentOnTime: onTimePunches,
          lateArrivals: parseInt(attResult.late_count, 10) || 0,
          absentCount: parseInt(attResult.absent_count, 10) || 0,
          halfDays: parseInt(attResult.half_day_count, 10) || 0,
          missingCheckouts: parseInt(attResult.missing_checkouts, 10) || 0,
          manualCorrections: parseInt(attResult.manual_edits, 10) || 0,
          totalOvertimeHours: parseFloat(attResult.total_overtime_hours) || 0.0,
          faceRecognitionCheckins: parseInt(faceCheckinResult?.count, 10) || 0,
          coverage: attendanceHealthScore
        },
        timeOffOverview: {
          approvedDays: parseFloat(timeOffStats.approved_days) || 0,
          pendingRequests: parseInt(timeOffStats.pending_requests, 10) || 0,
          refusedRequests: parseInt(timeOffStats.refused_requests, 10) || 0,
          remainingBalance: parseFloat(leaveBalanceResult.total_balance) || 0
        },
        alerts: {
          missingBankDetails: parseInt(missingBankCount?.count, 10) || 0,
          missingActiveContracts: parseInt(missingContractCount?.count, 10) || 0,
          pendingTimeOffRequests: parseInt(pendingLeaveCount?.count, 10) || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
