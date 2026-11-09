import React, { useState } from 'react';
import { YearRecord, CurrencyUnit } from '../../types/dashboard';
import { CHANNELS } from '../../data/advertisingData';
import { formatCurrency } from '../../utils/calculations';
import { PieChart, TrendingUp, Info } from 'lucide-react';

interface MarketShareMixChartProps {
  currentData: YearRecord[];
  currencyUnit: CurrencyUnit;
}

export const MarketShareMixChart: React.FC<MarketShareMixChartProps> = ({
  currentData,
  currencyUnit,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2030);

  // Focus years for comparison cards: 1995, 2005, 2015, 2020, 2025, 2030
  const milestoneYears = [1995, 2005, 2015, 2020, 2025, 2030];

  const selectedRecord = currentData.find((d) => d.year === selectedYear) || currentData[currentData.length - 1];

  // SVG Stacked 100% chart dimensions
  const width = 1000;
  const height = 340;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate percentage mix for each year
  const sharesByYear = currentData.map((d) => {
    const total = d.totalInv || 1;
    return {
      year: d.year,
      isProjection: d.isProjection,
      shares: CHANNELS.map((ch) => ({
        key: ch.key,
        color: ch.color,
        label: ch.shortLabel,
        val: d[ch.key] as number,
        pct: ((d[ch.key] as number) / total) * 100,
      })),
    };
  });

  const getX = (index: number) => {
    return padding.left + (index / (currentData.length - 1)) * chartWidth;
  };

  const getY = (pct: number) => {
    return padding.top + chartHeight - (pct / 100) * chartHeight;
  };

  // Stacked areas calculation
  // For each channel, calculate bottom and top cumulative pct
  const layers = CHANNELS.map((ch, chIdx) => {
    const points: { x: number; y0: number; y1: number }[] = [];

    sharesByYear.forEach((row, yearIdx) => {
      let cumulativeBefore = 0;
      for (let i = 0; i < chIdx; i++) {
        cumulativeBefore += row.shares[i].pct;
      }
      const cumulativeWithThis = cumulativeBefore + row.shares[chIdx].pct;

      points.push({
        x: getX(yearIdx),
        y0: getY(cumulativeBefore),
        y1: getY(cumulativeWithThis),
      });
    });

    // Build SVG path
    let topPath = '';
    let bottomPath = '';

    points.forEach((p, i) => {
      if (i === 0) {
        topPath += `M ${p.x.toFixed(1)},${p.y1.toFixed(1)}`;
      } else {
        topPath += ` L ${p.x.toFixed(1)},${p.y1.toFixed(1)}`;
      }
    });

    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      bottomPath += ` L ${p.x.toFixed(1)},${p.y0.toFixed(1)}`;
    }

    return {
      channel: ch,
      path: `${topPath} ${bottomPath} Z`,
    };
  });

  const projectionStartIndex = currentData.findIndex((d) => d.year === 2026);
  const projectionStartX = projectionStartIndex !== -1 ? getX(projectionStartIndex - 0.5) : chartWidth;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              Mix de Participación de Mercado (100% Share of Wallet)
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Evolución Estructural
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transición desde la era hegemónica de la TV Abierta e Impresos hasta el dominio de Digital y DOOH en 2030
          </p>
        </div>

        {/* Selected Year Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 overflow-x-auto">
          {milestoneYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedYear === yr
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {yr} {yr >= 2026 ? '(Sim)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* 100% Stacked Area SVG Chart */}
      <div className="relative mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px] select-none">
          {/* Shaded projection zone */}
          <rect
            x={projectionStartX}
            y={padding.top}
            width={width - padding.right - projectionStartX}
            height={chartHeight}
            fill="#312e81"
            fillOpacity="0.12"
          />

          <line
            x1={projectionStartX}
            y1={padding.top}
            x2={projectionStartX}
            y2={padding.top + chartHeight}
            stroke="#818cf8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Layers */}
          {layers.map(({ channel, path }) => (
            <path
              key={channel.key}
              d={path}
              fill={channel.color}
              fillOpacity="0.85"
              stroke="#0f172a"
              strokeWidth="0.75"
            />
          ))}

          {/* Horizontal lines for 25%, 50%, 75%, 100% */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = getY(pct);
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeOpacity="0.5"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* X axis milestone labels */}
          {currentData.map((d, idx) => {
            const isMilestone =
              d.year === 1995 ||
              d.year === 2000 ||
              d.year === 2005 ||
              d.year === 2010 ||
              d.year === 2015 ||
              d.year === 2020 ||
              d.year === 2025 ||
              d.year === 2030;
            if (!isMilestone) return null;
            const x = getX(idx);
            return (
              <text
                key={d.year}
                x={x}
                y={padding.top + chartHeight + 18}
                fill={d.isProjection ? '#818cf8' : '#94a3b8'}
                fontSize="10.5"
                fontWeight={d.year === selectedYear ? 'bold' : 'normal'}
                textAnchor="middle"
                className="font-mono"
              >
                {d.year}
              </text>
            );
          })}

          {/* Selected Year Vertical Line */}
          {selectedRecord && (
            <line
              x1={getX(currentData.findIndex((d) => d.year === selectedRecord.year))}
              y1={padding.top}
              x2={getX(currentData.findIndex((d) => d.year === selectedRecord.year))}
              y2={padding.top + chartHeight}
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* Breakdown Cards for the Selected Milestone Year */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span>Desglose de Participación en el Año {selectedRecord.year}:</span>
            <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
              Total: {formatCurrency(selectedRecord.totalInv, currencyUnit, selectedRecord.trm || 4300)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {selectedRecord.isProjection ? 'Datos Simulación' : 'Dato Histórico Consolidado'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {CHANNELS.map((ch) => {
            const val = selectedRecord[ch.key] as number;
            const pct = selectedRecord.totalInv > 0 ? (val / selectedRecord.totalInv) * 100 : 0;

            return (
              <div
                key={ch.key}
                className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                    <span className="text-xs font-medium text-slate-300 truncate" title={ch.label}>
                      {ch.shortLabel}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white tabular-nums font-mono">
                    {pct.toFixed(1)}%
                  </div>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-700/40 text-[10px] text-slate-400 tabular-nums font-mono truncate">
                  {formatCurrency(val, currencyUnit, selectedRecord.trm || 4300)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
