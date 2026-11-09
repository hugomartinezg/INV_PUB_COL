import React from 'react';
import { YearRecord, CurrencyUnit } from '../../types/dashboard';
import { CHANNELS } from '../../data/advertisingData';
import { formatCurrency, formatPercent } from '../../utils/calculations';
import { GitCompare, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ScenarioComparisonChartProps {
  currentData: YearRecord[];
  baselineData: YearRecord[];
  currencyUnit: CurrencyUnit;
}

export const ScenarioComparisonChart: React.FC<ScenarioComparisonChartProps> = ({
  currentData,
  baselineData,
  currencyUnit,
}) => {
  const projectionYears = [2026, 2027, 2028, 2029, 2030];
  const record2025 = currentData.find((d) => d.year === 2025) || currentData[30];
  const record2030Sim = currentData.find((d) => d.year === 2030) || currentData[currentData.length - 1];
  const record2030Base = baselineData.find((d) => d.year === 2030) || baselineData[baselineData.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <GitCompare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">
              Análisis Comparativo: Simulación vs Línea Base (2026 – 2030)
            </h3>
            <p className="text-xs text-slate-400">
              Evaluación del desvío financiero y variación esperada en pauta para los próximos 5 años
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-slate-700" />
            <span>Línea Base Oficial</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-400">
            <span className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span>Simulación Actual</span>
          </div>
        </div>
      </div>

      {/* Year by Year Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
        {projectionYears.map((yr) => {
          const sim = currentData.find((d) => d.year === yr) || record2030Sim;
          const base = baselineData.find((d) => d.year === yr) || record2030Base;
          const diff = sim.totalInv - base.totalInv;
          const diffPct = base.totalInv > 0 ? (diff / base.totalInv) * 100 : 0;
          const isPositive = diff > 0;
          const isZero = Math.abs(diff) < 0.1;

          // Height ratio relative to base
          const maxVal = Math.max(sim.totalInv, base.totalInv) * 1.05;
          const baseHeightPct = (base.totalInv / maxVal) * 100;
          const simHeightPct = (sim.totalInv / maxVal) * 100;

          return (
            <div
              key={yr}
              className="bg-slate-800/40 border border-slate-700/70 rounded-xl p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                <span className="text-sm font-bold text-white">{yr}</span>
                <span
                  className={`text-xs font-semibold tabular-nums flex items-center gap-0.5 ${
                    isZero ? 'text-slate-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {!isZero && (isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                  {isZero ? 'Sin desvío' : `${isPositive ? '+' : ''}${formatCurrency(diff, currencyUnit, sim.trm || 4300)}`}
                </span>
              </div>

              {/* Vertical Bars Graphic */}
              <div className="h-28 flex items-end justify-center gap-3 my-3 px-2">
                {/* Base bar */}
                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-slate-700 hover:bg-slate-650 rounded-t-md transition-all"
                    style={{ height: `${baseHeightPct}%` }}
                    title={`Base: ${formatCurrency(base.totalInv, currencyUnit, base.trm || 4300)}`}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Base</span>
                </div>

                {/* Sim bar */}
                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isZero
                        ? 'bg-indigo-600'
                        : isPositive
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ height: `${simHeightPct}%` }}
                    title={`Sim: ${formatCurrency(sim.totalInv, currencyUnit, sim.trm || 4300)}`}
                  />
                  <span className="text-[10px] text-indigo-300 font-mono">Sim</span>
                </div>
              </div>

              {/* Detailed Numbers */}
              <div className="pt-2 border-t border-slate-700/50 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Simulado:</span>
                  <span className="font-semibold text-white font-mono tabular-nums">
                    {formatCurrency(sim.totalInv, currencyUnit, sim.trm || 4300)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Línea Base:</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {formatCurrency(base.totalInv, currencyUnit, base.trm || 4300)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-[11px]">
                  <span className="text-slate-400">Diferencia:</span>
                  <span
                    className={`font-semibold tabular-nums font-mono ${
                      isZero ? 'text-slate-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatPercent(diffPct)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel Level Impact in 2030 */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Variación por Canal en el Horizonte 2030 (Simulado vs Línea Base):
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {CHANNELS.map((ch) => {
            const simVal = record2030Sim[ch.key] as number;
            const baseVal = record2030Base[ch.key] as number;
            const diff = simVal - baseVal;
            const diffPct = baseVal > 0 ? (diff / baseVal) * 100 : 0;
            const isPos = diff > 0;
            const isZero = Math.abs(diff) < 0.1;

            return (
              <div
                key={ch.key}
                className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                  <span className="text-xs font-medium text-slate-300 truncate" title={ch.label}>
                    {ch.shortLabel}
                  </span>
                </div>

                <div className="text-sm font-bold text-white font-mono tabular-nums">
                  {formatCurrency(simVal, currencyUnit, record2030Sim.trm || 4400)}
                </div>

                <div className="mt-1.5 pt-1 border-t border-slate-700/40 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Gap:</span>
                  <span
                    className={`font-semibold tabular-nums font-mono ${
                      isZero ? 'text-slate-400' : isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isZero ? '0.0%' : `${isPos ? '+' : ''}${diffPct.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
