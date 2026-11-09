import React, { useState } from 'react';
import { YearRecord, CurrencyUnit } from '../../types/dashboard';
import { formatCurrency, formatPercent } from '../../utils/calculations';
import { Globe, DollarSign, Activity, Users } from 'lucide-react';

interface MacroCorrelationsChartProps {
  currentData: YearRecord[];
  currencyUnit: CurrencyUnit;
}

type MacroView = 'internet_vs_digital' | 'investment_usd_vs_cop' | 'per_capita';

export const MacroCorrelationsChart: React.FC<MacroCorrelationsChartProps> = ({
  currentData,
  currencyUnit,
}) => {
  const [macroView, setMacroView] = useState<MacroView>('internet_vs_digital');

  const width = 1000;
  const height = 340;
  const padding = { top: 30, right: 60, bottom: 40, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    return padding.left + (index / (currentData.length - 1)) * chartWidth;
  };

  // Max values for left and right axes
  const maxDigital = Math.max(...currentData.map((d) => d.digital)) * 1.1;
  const maxTotalUSD = Math.max(...currentData.map((d) => d.totalInv / (d.trm || 4150))) * 1.15;
  const maxTotalCOP = Math.max(...currentData.map((d) => d.totalInv)) * 1.1;
  const maxPerCapitaCOP = Math.max(...currentData.map((d) => (d.totalInv * 1000000) / (d.population || 50000000))) * 1.15;

  const projectionStartIndex = currentData.findIndex((d) => d.year === 2026);
  const projectionStartX = projectionStartIndex !== -1 ? getX(projectionStartIndex - 0.5) : chartWidth;

  const generateLinePath = (data: YearRecord[], accessor: (d: YearRecord) => number, maxVal: number) => {
    let path = '';
    data.forEach((d, i) => {
      const x = getX(i);
      const val = accessor(d);
      const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
      if (i === 0) {
        path += `M ${x.toFixed(1)},${y.toFixed(1)}`;
      } else {
        path += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
      }
    });
    return path;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              Correlaciones Macroeconómicas & Demográficas
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              TRM · Internet · DANE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Impacto de la penetración de internet, la devaluación cambiaria (TRM) y el crecimiento poblacional
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setMacroView('internet_vs_digital')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              macroView === 'internet_vs_digital'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Internet vs Digital
          </button>
          <button
            type="button"
            onClick={() => setMacroView('investment_usd_vs_cop')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              macroView === 'investment_usd_vs_cop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Efecto TRM (USD vs COP)
          </button>
          <button
            type="button"
            onClick={() => setMacroView('per_capita')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              macroView === 'per_capita'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inversión Per Cápita
          </button>
        </div>
      </div>

      {/* SVG Chart with Dual Axis */}
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

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding.top + chartHeight - pct * chartHeight;
            return (
              <line
                key={idx}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeOpacity="0.5"
              />
            );
          })}

          {/* X Axis milestones */}
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
                y={padding.top + chartHeight + 20}
                fill={d.isProjection ? '#818cf8' : '#94a3b8'}
                fontSize="10.5"
                textAnchor="middle"
                className="font-mono"
              >
                {d.year}
              </text>
            );
          })}

          {/* VIEW 1: INTERNET PENETRATION (%) VS DIGITAL SPEND */}
          {macroView === 'internet_vs_digital' && (
            <>
              {/* Internet Penetration Line (% 0 to 100) */}
              <path
                d={generateLinePath(currentData, (d) => d.internetPenetration || 0, 100)}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Digital Inversion Line */}
              <path
                d={generateLinePath(currentData, (d) => d.digital, maxDigital)}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Y Axis Left (Digital Spend) */}
              {[0, 0.5, 1].map((pct) => (
                <text
                  key={pct}
                  x={padding.left - 8}
                  y={padding.top + chartHeight - pct * chartHeight + 4}
                  fill="#0284c7"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono font-medium"
                >
                  {formatCurrency(pct * maxDigital, currencyUnit, 4150)}
                </text>
              ))}

              {/* Y Axis Right (Internet %) */}
              {[0, 25, 50, 75, 100].map((pct) => (
                <text
                  key={pct}
                  x={width - padding.right + 8}
                  y={padding.top + chartHeight - (pct / 100) * chartHeight + 4}
                  fill="#10b981"
                  fontSize="10"
                  textAnchor="start"
                  className="font-mono font-medium"
                >
                  {pct}%
                </text>
              ))}
            </>
          )}

          {/* VIEW 2: FX / TRM EFFECT (COP VS USD) */}
          {macroView === 'investment_usd_vs_cop' && (
            <>
              {/* Inversión en COP */}
              <path
                d={generateLinePath(currentData, (d) => d.totalInv, maxTotalCOP)}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Inversión en USD */}
              <path
                d={generateLinePath(currentData, (d) => d.totalInv / (d.trm || 4150), maxTotalUSD)}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Y Axis Left: COP */}
              {[0, 0.5, 1].map((pct) => (
                <text
                  key={pct}
                  x={padding.left - 8}
                  y={padding.top + chartHeight - pct * chartHeight + 4}
                  fill="#818cf8"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono font-medium"
                >
                  {formatCurrency(pct * maxTotalCOP, currencyUnit, 4150)}
                </text>
              ))}

              {/* Y Axis Right: USD */}
              {[0, 0.5, 1].map((pct) => (
                <text
                  key={pct}
                  x={width - padding.right + 8}
                  y={padding.top + chartHeight - pct * chartHeight + 4}
                  fill="#14b8a6"
                  fontSize="10"
                  textAnchor="start"
                  className="font-mono font-medium"
                >
                  US$ {(pct * maxTotalUSD).toFixed(0)}M
                </text>
              ))}
            </>
          )}

          {/* VIEW 3: INVERSIÓN PER CÁPITA */}
          {macroView === 'per_capita' && (
            <>
              <path
                d={generateLinePath(
                  currentData,
                  (d) => (d.totalInv * 1000000) / (d.population || 50000000),
                  maxPerCapitaCOP
                )}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                <text
                  key={pct}
                  x={padding.left - 8}
                  y={padding.top + chartHeight - pct * chartHeight + 4}
                  fill="#fbbf24"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono font-medium"
                >
                  ${Math.round(pct * maxPerCapitaCOP).toLocaleString('es-CO')} COP
                </text>
              ))}
            </>
          )}
        </svg>
      </div>

      {/* Explanatory takeaway cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 pt-3 border-t border-slate-800 text-xs">
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
          <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Penetración Digital
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            La conectividad creció del <strong>0.1% en 1995 al 82.3% en 2025</strong>. El punto de despegue exponencial ocurrió post-2015 con smartphones 4G y bancarización móvil.
          </p>
        </div>

        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
          <div className="text-teal-400 font-semibold mb-1 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Efecto Devaluación TRM
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Aunque en pesos la pauta batió récord histórico en 2025 ($5.14 Billones), en dólares tocó su pico en 2014 ($1,458M USD con dólar a $2,000) debido a la fuerte devaluación del peso.
          </p>
        </div>

        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
          <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Inversión Per Cápita
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            El gasto publicitario por habitante en Colombia pasó de <strong>$7,030 COP en 1995</strong> a <strong>$96,310 COP en 2025</strong>, reflejando la maduración y dinamismo del consumo interno.
          </p>
        </div>
      </div>
    </div>
  );
};
