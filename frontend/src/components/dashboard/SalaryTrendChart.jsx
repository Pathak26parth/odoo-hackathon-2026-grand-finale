// components/dashboard/SalaryTrendChart.jsx
import React from 'react';
import { formatCurrency } from '../../utils/payrollCalculation';

export const SalaryTrendChart = ({ monthlyData = [] }) => {
  const points = monthlyData;

  if (!points || points.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Net Salary Trend</h3>
            <p className="text-xs text-slate-500">Historical net payroll disbursement trajectory</p>
          </div>
        </div>
        <div className="py-12 text-center text-xs text-slate-400">
          No validated historical payroll periods to plot trajectory yet. Complete and validate payruns to generate trend curve.
        </div>
      </div>
    );
  }

  const minNet = Math.min(...points.map((p) => p.net)) * 0.95;
  const maxNet = Math.max(...points.map((p) => p.net)) * 1.05;
  const firstNet = points[0]?.net || 1;
  const lastNet = points[points.length - 1]?.net || 0;
  const growthPct = firstNet > 0 ? (((lastNet - firstNet) / firstNet) * 100).toFixed(1) : '0';

  // SVG dimensions
  const svgWidth = 500;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getCoordinates = (index, value) => {
    const x = paddingX + (index / (points.length - 1)) * (svgWidth - 2 * paddingX);
    const y =
      svgHeight -
      paddingY -
      ((value - minNet) / (maxNet - minNet || 1)) * (svgHeight - 2 * paddingY);
    return { x, y };
  };

  const coords = points.map((p, i) => getCoordinates(i, p.net));
  const pathD = coords.reduce(
    (acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
    ''
  );

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight - paddingY} L ${
    coords[0].x
  } ${svgHeight - paddingY} Z`;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Monthly Net Salary Trend</h3>
          <p className="text-xs text-slate-500">Net payroll disbursement trajectory ({points[0]?.month} — {points[points.length - 1]?.month})</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
          Number(growthPct) >= 0 
            ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
            : 'text-rose-600 bg-rose-50 border-rose-200'
        }`}>
          {Number(growthPct) >= 0 ? `+${growthPct}%` : `${growthPct}%`} Trend
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 overflow-visible"
        >
          {/* Subtle horizontal grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgWidth - paddingX}
            y2={paddingY}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={svgHeight / 2}
            x2={svgWidth - paddingX}
            y2={svgHeight / 2}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={svgHeight - paddingY}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY}
            stroke="#cbd5e1"
          />

          {/* Area Gradient */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Filled Area */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Month Labels */}
          {coords.map((c, i) => (
            <g key={i}>
              <circle
                cx={c.x}
                cy={c.y}
                r="4.5"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2"
              />
              <text
                x={c.x}
                y={svgHeight - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
                fontWeight="500"
              >
                {points[i].month}
              </text>
              <text
                x={c.x}
                y={c.y - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#1e293b"
                fontWeight="bold"
              >
                {formatCurrency(points[i].net).replace('₹', '')}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
