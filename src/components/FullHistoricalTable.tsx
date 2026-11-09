import React, { useState, useMemo } from 'react';
import { YearRecord, CurrencyUnit } from '../types/dashboard';
import { CHANNELS } from '../data/advertisingData';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { Search, ArrowUpDown, Filter, Download } from 'lucide-react';

interface FullHistoricalTableProps {
  currentData: YearRecord[];
  currencyUnit: CurrencyUnit;
  onExportCSV: () => void;
}

type PeriodFilter = 'all' | 'historical' | 'projections' | 'recent_decade';
type SortField = 'year' | 'totalInv' | 'digital' | 'pubExterior' | 'tvNacional';
type SortOrder = 'asc' | 'desc';

export const FullHistoricalTable: React.FC<FullHistoricalTableProps> = ({
  currentData,
  currencyUnit,
  onExportCSV,
}) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('year');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedData = useMemo(() => {
    let result = [...currentData];

    // Period filter
    if (periodFilter === 'historical') {
      result = result.filter((d) => !d.isProjection);
    } else if (periodFilter === 'projections') {
      result = result.filter((d) => d.isProjection);
    } else if (periodFilter === 'recent_decade') {
      result = result.filter((d) => d.year >= 2020);
    }

    // Search query (year search)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => d.year.toString().includes(q));
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return result;
  }, [currentData, periodFilter, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90">
        <div>
          <h3 className="text-base font-semibold text-white">
            Matriz Completa de Inversión Publicitaria (1995 – 2030)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Datos históricos consolidados en Colombia y serie simulada 2026-2030 con indicadores macroeconómicos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Buttons */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                periodFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos (36)
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('recent_decade')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                periodFilter === 'recent_decade'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2020-2030
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('projections')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                periodFilter === 'projections'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Proyecciones
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('historical')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                periodFilter === 'historical'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Histórico
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar año..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28 sm:w-32"
            />
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={onExportCSV}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Exportar a CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* High Density Table */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="sticky top-0 bg-slate-950 z-20 text-slate-400 shadow-sm border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('year')}
                className="py-2.5 px-3.5 font-semibold cursor-pointer hover:text-white sticky left-0 bg-slate-950 z-30"
              >
                <div className="flex items-center gap-1">
                  <span>AÑO</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-right font-semibold">TV REG</th>
              <th className="py-2.5 px-2.5 text-right font-semibold">REVISTAS</th>
              <th
                onClick={() => handleSort('pubExterior')}
                className="py-2.5 px-2.5 text-right font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>EXTERIOR</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-right font-semibold">PRENSA</th>
              <th className="py-2.5 px-2.5 text-right font-semibold">RADIO</th>
              <th
                onClick={() => handleSort('tvNacional')}
                className="py-2.5 px-2.5 text-right font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>TV NAC</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('digital')}
                className="py-2.5 px-2.5 text-right font-semibold text-sky-400 cursor-pointer hover:text-sky-300"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>DIGITAL</span>
                  <ArrowUpDown className="w-3 h-3 text-sky-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalInv')}
                className="py-2.5 px-3.5 text-right font-bold text-white bg-slate-900/90 cursor-pointer hover:text-indigo-300"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>TOTAL INV</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-right font-semibold text-slate-400">IPC (%)</th>
              <th className="py-2.5 px-2.5 text-right font-semibold text-slate-400">TRM</th>
              <th className="py-2.5 px-2.5 text-right font-semibold text-slate-400">INTERNET</th>
              <th className="py-2.5 px-3 text-right font-semibold text-slate-400">POBLACIÓN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {filteredAndSortedData.map((d) => {
              const trm = d.trm || 4150;
              const isProj = d.isProjection;

              return (
                <tr
                  key={d.year}
                  className={`hover:bg-slate-850/70 transition-colors ${
                    isProj ? 'bg-indigo-950/20 text-indigo-100' : 'text-slate-300'
                  }`}
                >
                  <td
                    className={`py-2 px-3.5 font-bold sticky left-0 z-10 ${
                      isProj ? 'bg-slate-900 text-indigo-300' : 'bg-slate-950 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-sans">
                      <span>{d.year}</span>
                      {isProj && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-900/80 text-indigo-200">
                          Sim
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {d.tvRegLocal > 0 ? formatCurrency(d.tvRegLocal, currencyUnit, trm) : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {d.revistas > 0 ? formatCurrency(d.revistas, currencyUnit, trm) : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {d.pubExterior > 0 ? formatCurrency(d.pubExterior, currencyUnit, trm) : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {d.prensa > 0 ? formatCurrency(d.prensa, currencyUnit, trm) : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {d.radio > 0 ? formatCurrency(d.radio, currencyUnit, trm) : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {d.tvNacional > 0 ? formatCurrency(d.tvNacional, currencyUnit, trm) : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-sky-400 font-semibold">
                    {d.digital > 0 ? formatCurrency(d.digital, currencyUnit, trm) : '-'}
                  </td>
                  <td className="py-2 px-3.5 text-right font-bold text-white bg-slate-900/70 tabular-nums">
                    {formatCurrency(d.totalInv, currencyUnit, trm)}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-slate-400">
                    {d.ipc !== null ? `${d.ipc.toFixed(1)}%` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-slate-400">
                    {d.trm !== null ? `$${d.trm.toLocaleString('es-CO')}` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-slate-400">
                    {d.internetPenetration !== null ? `${d.internetPenetration.toFixed(1)}%` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-400 font-sans">
                    {d.population !== null ? `${(d.population / 1000000).toFixed(1)}M` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Mostrando {filteredAndSortedData.length} de {currentData.length} registros</span>
        <span className="text-slate-500">Unidad monetaria: {currencyUnit === 'COP_B' ? 'Billones COP' : currencyUnit === 'USD_M' ? 'Millones USD' : 'Millones COP'}</span>
      </div>
    </div>
  );
};
