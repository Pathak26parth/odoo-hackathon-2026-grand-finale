// components/payroll/SalaryBreakdown.jsx
import React from 'react';
import { formatCurrency } from '../../utils/payrollCalculation';

export const SalaryBreakdown = ({ basic = 0, allowances = 0, gross = 0, deductions = 0, net = 0, lines = [] }) => {
  const earningsRules = lines.filter((l) => l.category === 'Basic' || l.category === 'Allowances');
  const deductionsRules = lines.filter((l) => l.category === 'Deductions');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EARNINGS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Earnings</h3>
            <span className="text-[11px] text-slate-400">Monthly Compensation</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {earningsRules.length > 0 ? (
              earningsRules.map((rule, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{rule.name}</span>
                    <span className="text-[11px] text-slate-400 block">{rule.calculation}</span>
                  </div>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(rule.amount)}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Basic Salary</span>
                  <span className="font-mono font-medium text-slate-900">{formatCurrency(basic)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Allowances</span>
                  <span className="font-mono font-medium text-slate-900">{formatCurrency(allowances)}</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Gross Salary</span>
            <span className="font-mono text-sm text-blue-700">{formatCurrency(gross)}</span>
          </div>
        </div>

        {/* DEDUCTIONS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Deductions</h3>
            <span className="text-[11px] text-slate-400">Statutory & Withholdings</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {deductionsRules.length > 0 ? (
              deductionsRules.map((rule, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{rule.name}</span>
                    <span className="text-[11px] text-slate-400 block">{rule.calculation}</span>
                  </div>
                  <span className="font-mono font-medium text-rose-600">
                    {formatCurrency(rule.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-800">Total Withholdings</span>
                <span className="font-mono font-medium text-rose-600">{formatCurrency(deductions)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Total Deductions</span>
            <span className="font-mono text-sm text-rose-600">{formatCurrency(deductions)}</span>
          </div>
        </div>
      </div>

      {/* NET SALARY PROMINENT CALLOUT */}
      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 block">
            Disbursement Net Pay
          </span>
          <h2 className="text-lg font-bold text-emerald-950">NET SALARY</h2>
          <p className="text-xs text-emerald-700 mt-0.5">
            Gross Salary ({formatCurrency(gross)}) minus Deductions ({formatCurrency(deductions)})
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-700 tracking-tight">
            {formatCurrency(net)}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 inline-block">
            Verified For Electronic Transfer
          </span>
        </div>
      </div>
    </div>
  );
};
