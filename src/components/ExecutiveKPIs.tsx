import React from 'react';
import { DashboardMetrics, CurrencyUnit, YearRecord } from '../types/dashboard';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { TrendingUp, PieChart, Monitor, MapPin, Users, DollarSign } from 'lucide-react';

interface ExecutiveKPIsProps {
  metrics: DashboardMetrics;
  currencyUnit: CurrencyUnit;
  current2030Record: YearRecord;
  current2025Record: YearRecord;
}

export const ExecutiveKPIs: React.FC<ExecutiveKPIsProps> = ({
  metrics,
  currencyUnit,
  current2030Record,
  current2025Record,
}) => {
  const trm2030 = current2030Record.trm || 4400;
  const pop2030 = current2030Record.population || 55900000;
  const perCapitaCOP = (metrics.total2030 * 1000000) / pop2030;
  const perCapitaUSD = perCapitaCOP / trm2030;

  const deltaCOP = metrics.totalDifference2030;
  const deltaPct = metrics.percentDifference2030;
  const isDeltaPositive = deltaCOP > 0;
  const isDeltaNegative = deltaCOP < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Inversión Total 2030 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Inversión Total 2030</span>
            <span className="p-1 rounded bg-slate-800 text-slate-300">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
            {formatCurrency(metrics.total2030, currencyUnit, trm2030)}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">vs Línea Base:</span>
          {deltaCOP === 0 ? (
            <span className="text-slate-400 font-medium tabular-nums">Sin variación</span>
          ) : (
            <span
              className={`font-semibold tabular-nums ${
                isDeltaPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isDeltaPositive ? '+' : ''}
              {formatCurrency(deltaCOP, currencyUnit, trm2030)} ({formatPercent(deltaPct)})
            </span>
          )}
        </div>
      </div>

      {/* KPI 2: CAGR Proyectado 2025-2030 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>CAGR 2025 - 2030</span>
            <span className="p-1 rounded bg-slate-800 text-indigo-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-400 tabular-nums">
            {formatPercent(metrics.cagr2025_2030, 2)}
            <span className="text-xs text-slate-400 font-normal ml-1.5">anual</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Base oficial:</span>
          <span className="text-slate-300 font-medium tabular-nums">
            {formatPercent(metrics.baselineCagr2025_2030, 2)}
          </span>
        </div>
      </div>

      {/* KPI 3: Dominancia Digital 2030 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Cuota Digital 2030</span>
            <span className="p-1 rounded bg-slate-800 text-sky-400">
              <Monitor className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-sky-400 tabular-nums">
            {metrics.digitalShare2030.toFixed(1)}%
            <span className="text-xs text-slate-400 font-normal ml-1.5">del pastel</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">En 2025:</span>
          <span className="text-slate-300 font-medium tabular-nums">
            {metrics.digitalShare2025.toFixed(1)}% ({formatCurrency(current2025Record.digital, currencyUnit, 4052)})
          </span>
        </div>
      </div>

      {/* KPI 4: Exterior OOH / DOOH */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Publicidad Exterior (OOH)</span>
            <span className="p-1 rounded bg-slate-800 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
            {formatCurrency(current2030Record.pubExterior, currencyUnit, trm2030)}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Crecimiento 2025-30:</span>
          <span className="text-emerald-400 font-semibold tabular-nums">
            {formatPercent(metrics.exteriorGrowth2025_2030)}
          </span>
        </div>
      </div>
    </div>
  );
};
