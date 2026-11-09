import React, { useState } from 'react';
import { YearRecord, MediaChannelKey, CurrencyUnit } from '../types/dashboard';
import { CHANNELS } from '../data/advertisingData';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { Edit3, Check, RotateCcw, AlertCircle } from 'lucide-react';

interface ProjectionsEditorTableProps {
  projectionRecords: YearRecord[]; // 2026 to 2030
  baselineRecords: YearRecord[]; // baseline 2026 to 2030
  lastHistoricalRecord: YearRecord; // 2025
  currencyUnit: CurrencyUnit;
  onUpdateProjectionCell: (year: number, channel: MediaChannelKey, newValue: number) => void;
  onResetYear: (year: number) => void;
}

export const ProjectionsEditorTable: React.FC<ProjectionsEditorTableProps> = ({
  projectionRecords,
  baselineRecords,
  lastHistoricalRecord,
  currencyUnit,
  onUpdateProjectionCell,
  onResetYear,
}) => {
  // Editing state: { year, channel } or null
  const [editingCell, setEditingCell] = useState<{ year: number; channel: MediaChannelKey } | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const startEditing = (year: number, channel: MediaChannelKey, currentValue: number) => {
    setEditingCell({ year, channel });
    setInputValue(currentValue.toString());
  };

  const saveEditing = () => {
    if (!editingCell) return;
    const num = parseFloat(inputValue.replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      onUpdateProjectionCell(editingCell.year, editingCell.channel, Number(num.toFixed(1)));
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Edit3 className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold text-white">
              Edición Interactiva de Proyecciones (2026 – 2030)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Haga clic en cualquier celda para modificar la inversión de pauta publicitaria en Millones de COP ($M) y simular el impacto en tiempo real.
          </p>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/40 border border-indigo-400" />
            <span>Celda modificada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700" />
            <span>Valor base</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <th className="py-3 px-3.5 font-semibold sticky left-0 bg-slate-950 z-10 w-28">
                AÑO / MEDIO
              </th>
              {CHANNELS.map((ch) => (
                <th key={ch.key} className="py-3 px-3 text-right font-semibold min-w-[130px]">
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ch.color }}
                    />
                    <span>{ch.shortLabel}</span>
                  </div>
                </th>
              ))}
              <th className="py-3 px-3.5 text-right font-bold text-white bg-slate-900/90 min-w-[140px]">
                TOTAL INVERSIÓN
              </th>
              <th className="py-3 px-3 text-right font-semibold text-slate-400 min-w-[100px]">
                Var. YoY
              </th>
              <th className="py-3 px-3 text-center font-semibold text-slate-400 w-20">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {/* Reference Row: 2025 (Last Real Historical) */}
            <tr className="bg-slate-950/40 text-slate-400 font-mono">
              <td className="py-2.5 px-3.5 font-bold text-slate-300 sticky left-0 bg-slate-950/90 z-10">
                2025 <span className="text-[10px] font-sans text-slate-500 font-normal">(Cierre Real)</span>
              </td>
              {CHANNELS.map((ch) => (
                <td key={ch.key} className="py-2.5 px-3 text-right tabular-nums">
                  {formatCurrency(lastHistoricalRecord[ch.key] as number, currencyUnit, lastHistoricalRecord.trm || 4052)}
                </td>
              ))}
              <td className="py-2.5 px-3.5 text-right font-bold text-slate-200 tabular-nums bg-slate-900/50">
                {formatCurrency(lastHistoricalRecord.totalInv, currencyUnit, lastHistoricalRecord.trm || 4052)}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-500 font-sans">
                Referencia
              </td>
              <td className="py-2.5 px-3 text-center text-slate-600 font-sans">
                -
              </td>
            </tr>

            {/* Editable Projection Rows: 2026 to 2030 */}
            {projectionRecords.map((record, idx) => {
              const baseline = baselineRecords.find((b) => b.year === record.year) || record;
              const prevRecord = idx === 0 ? lastHistoricalRecord : projectionRecords[idx - 1];
              const yoyGrowth = prevRecord.totalInv > 0
                ? ((record.totalInv - prevRecord.totalInv) / prevRecord.totalInv) * 100
                : 0;
              const isYearModified = record.totalInv !== baseline.totalInv;

              return (
                <tr
                  key={record.year}
                  className={`hover:bg-slate-850/60 transition-colors ${
                    isYearModified ? 'bg-indigo-950/15' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 font-bold text-indigo-300 sticky left-0 bg-slate-900 z-10">
                    <div className="flex items-center gap-1.5">
                      <span>{record.year}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-normal">
                        Sim
                      </span>
                    </div>
                  </td>

                  {CHANNELS.map((ch) => {
                    const currentVal = record[ch.key] as number;
                    const baselineVal = baseline[ch.key] as number;
                    const isCellModified = Math.abs(currentVal - baselineVal) > 0.05;
                    const isEditing = editingCell?.year === record.year && editingCell?.channel === ch.key;

                    return (
                      <td
                        key={ch.key}
                        onClick={() => !isEditing && startEditing(record.year, ch.key, currentVal)}
                        className={`py-2 px-2.5 text-right cursor-pointer select-none transition-colors group relative ${
                          isCellModified
                            ? 'bg-indigo-950/40 text-indigo-200 font-semibold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Haga clic para editar este valor"
                      >
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={saveEditing}
                              autoFocus
                              className="w-24 px-1.5 py-0.5 text-right text-xs bg-slate-800 border border-indigo-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 tabular-nums font-mono"
                            />
                            <button
                              type="button"
                              onClick={saveEditing}
                              className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="tabular-nums font-mono">
                              {formatCurrency(currentVal, currencyUnit, record.trm || 4300)}
                            </span>
                            {isCellModified && (
                              <span className="text-[10px] text-indigo-400 font-normal">
                                {currentVal > baselineVal ? '+' : ''}
                                {(((currentVal - baselineVal) / baselineVal) * 100).toFixed(1)}% vs base
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Total Inversión Row */}
                  <td className="py-3 px-3.5 text-right font-bold text-white bg-slate-900/90 tabular-nums font-mono">
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(record.totalInv, currencyUnit, record.trm || 4300)}</span>
                      {isYearModified && (
                        <span
                          className={`text-[10px] font-normal ${
                            record.totalInv >= baseline.totalInv ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {record.totalInv >= baseline.totalInv ? '+' : ''}
                          {(((record.totalInv - baseline.totalInv) / baseline.totalInv) * 100).toFixed(1)}% vs base
                        </span>
                      )}
                    </div>
                  </td>

                  {/* YoY Growth */}
                  <td className="py-3 px-3 text-right tabular-nums font-medium">
                    <span
                      className={`text-xs ${
                        yoyGrowth > 0
                          ? 'text-emerald-400'
                          : yoyGrowth < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatPercent(yoyGrowth)}
                    </span>
                  </td>

                  {/* Reset row button */}
                  <td className="py-3 px-3 text-center">
                    {isYearModified ? (
                      <button
                        type="button"
                        onClick={() => onResetYear(record.year)}
                        className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        title="Restablecer este año a la línea base"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            Las celdas aceptan valores en Millones de Pesos ($M COP). Los cálculos de totales, CAGR y porcentajes de mercado se recalculan al instante.
          </span>
        </div>
        <span className="text-slate-500 shrink-0">
          Tip: Presione <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Enter</kbd> para guardar
        </span>
      </div>
    </div>
  );
};
