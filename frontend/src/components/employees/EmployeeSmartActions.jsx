import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CalendarCheck, PieChart } from 'lucide-react';

export const EmployeeSmartActions = ({ employee }) => {
  const navigate = useNavigate();
  if (!employee) return null;

  const buttons = [
    {
      label: 'Contracts',
      count: employee.contractsCount ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      onClick: () => navigate(`/contracts?employee=${employee.id}`)
    },
    {
      label: 'Attendance',
      count: employee.attendanceCount ?? 0,
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      onClick: () => navigate(`/attendance?employee=${employee.id}`)
    },
    {
      label: 'Time Off',
      count: employee.timeOffCount ?? 0,
      icon: CalendarCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      onClick: () => navigate(`/time-off/requests?employee=${employee.id}`)
    },
    {
      label: 'Allocations',
      count: employee.allocationsCount ?? 0,
      icon: PieChart,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      onClick: () => navigate(`/time-off/allocations?employee=${employee.id}`)
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.label}
            type="button"
            onClick={btn.onClick}
            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition-all text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${btn.bgColor} ${btn.color} border ${btn.borderColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {btn.label}
                </p>
                <p className="text-lg font-bold text-slate-900 group-hover:text-blue-600 leading-tight">
                  {btn.count}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
