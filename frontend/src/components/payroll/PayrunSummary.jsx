// components/payroll/PayrunSummary.jsx
import React from 'react';
import { Users, CreditCard, PlusCircle, DollarSign, MinusCircle, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/payrollCalculation';

export const PayrunSummary = ({
  employeeCount = 0,
  basic = 0,
  allowances = 0,
  gross = 0,
  deductions = 0,
  net = 0
}) => {
  const cards = [
    {
      label: 'Total Employees',
      value: employeeCount,
      isCurrency: false,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Total Basic',
      value: basic,
      isCurrency: true,
      icon: CreditCard,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100'
    },
    {
      label: 'Total Allowances',
      value: allowances,
      isCurrency: true,
      icon: PlusCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      label: 'Total Gross',
      value: gross,
      isCurrency: true,
      icon: DollarSign,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Total Deductions',
      value: deductions,
      isCurrency: true,
      icon: MinusCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    {
      label: 'Total Net Salary',
      value: net,
      isCurrency: true,
      icon: Wallet,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      highlight: true
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border bg-white shadow-2xs flex flex-col justify-between ${
              card.highlight ? 'border-emerald-300 ring-1 ring-emerald-500/10' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 truncate">{card.label}</span>
              <div className={`w-6 h-6 rounded-md ${card.bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div className={`text-base font-bold truncate ${card.color}`}>
              {card.isCurrency ? formatCurrency(card.value) : card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
