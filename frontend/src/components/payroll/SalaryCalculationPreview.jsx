import React, { useState } from 'react';
import { ArrowDown, Calculator, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { calculateSalaryBreakdown } from '../../data/salaryRules';
import { SalaryCategoryBadge } from './SalaryCategoryBadge';

export const SalaryCalculationPreview = ({ baseSalary = 50000 }) => {
  const [currentBase, setCurrentBase] = useState(baseSalary);
  const steps = calculateSalaryBreakdown(currentBase);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Salary Calculation Breakdown</h3>
            <p className="text-[11px] text-slate-500">Step-by-step rule evaluation preview</p>
          </div>
        </div>

        {/* Input base simulation */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-xs">Test Base Pay:</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">₹</span>
            <input
              type="number"
              step="1000"
              value={currentBase}
              onChange={(e) => setCurrentBase(Number(e.target.value) || 0)}
              className="w-28 pl-6 pr-2 py-1 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Vertical Step-by-Step Flow */}
      <div className="space-y-2 max-w-lg mx-auto py-2">
        {steps.map((item, idx) => {
          const isGross = item.code === 'GROSS';
          const isNet = item.code === 'NET';
          const isDeduction = item.type === 'deduct';
          const isAddition = item.type === 'add';

          return (
            <React.Fragment key={item.step}>
              {/* Card */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isNet
                    ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                    : isGross
                    ? 'bg-purple-50/60 border-purple-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center border border-slate-200">
                      {item.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                        <SalaryCategoryBadge category={item.category} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.calcText}</p>
                    </div>
                  </div>

                  {/* Amount Display */}
                  <div className="text-right">
                    <span
                      className={`font-mono text-sm font-bold block ${
                        isNet
                          ? 'text-blue-700 text-base'
                          : isGross
                          ? 'text-purple-700 font-extrabold'
                          : isDeduction
                          ? 'text-rose-600'
                          : isAddition
                          ? 'text-emerald-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {isDeduction ? '-' : isAddition ? '+' : ''}₹{item.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isNet ? 'Take Home Pay' : isGross ? 'Pre-tax Earnings' : 'Monthly'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Down Arrow separator */}
              {idx < steps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          * Rules execute sequentially based on their designated sequence orders. Gross and Net formulas automatically bind preceding allowance and deduction outputs.
        </p>
      </div>
    </div>
  );
};
