import React from 'react';

export const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
};
