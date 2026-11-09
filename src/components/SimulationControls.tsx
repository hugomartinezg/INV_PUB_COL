import React from 'react';
import { SCENARIO_PRESETS, CHANNELS } from '../data/advertisingData';
import { MediaChannelKey, ScenarioPreset } from '../types/dashboard';
import { Sliders, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface SimulationControlsProps {
  activeScenarioId: string;
  onSelectScenario: (preset: ScenarioPreset) => void;
  channelAdjustments: Record<MediaChannelKey, number>; // e.g. 0 for 0%, 20 for +20%, -10 for -10%
  onChannelAdjustmentChange: (channel: MediaChannelKey, deltaPercent: number) => void;
  onResetToBaseline: () => void;
  isModified: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  activeScenarioId,
  onSelectScenario,
  channelAdjustments,
  onChannelAdjustmentChange,
  onResetToBaseline,
  isModified,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sliders className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-white">
              Motor de Simulación de Proyecciones (2026 - 2030)
            </h2>
            <p className="text-xs text-slate-400">
              Seleccione un escenario macroeconómico o ajuste las palancas de crecimiento por canal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isModified && (
            <button
              type="button"
              onClick={onResetToBaseline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restablecer Valores Base
            </button>
          )}
        </div>
      </div>

      {/* Preset Scenarios Buttons */}
      <div className="mt-4">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
          Escenarios Ejecutivos Preconfigurados:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = activeScenarioId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectScenario(preset)}
                className={`p-3 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/80 ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {preset.name}
                  </span>
                  {preset.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {preset.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Adjuster Levers */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Ajuste Porcentual Acumulado por Medio sobre la Proyección Oficial (2026-2030):
          </span>
          <span className="text-xs text-slate-500">
            Haga clic o arrastre para simular shocks de demanda publicitaria
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {CHANNELS.map((ch) => {
            const currentDelta = channelAdjustments[ch.key] || 0;
            const isAdjusted = currentDelta !== 0;

            return (
              <div
                key={ch.key}
                className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-300 truncate" title={ch.label}>
                    {ch.shortLabel}
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      currentDelta > 0
                        ? 'text-emerald-400'
                        : currentDelta < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {currentDelta > 0 ? `+${currentDelta}%` : `${currentDelta}%`}
                  </span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="-40"
                  max="50"
                  step="5"
                  value={currentDelta}
                  onChange={(e) => onChannelAdjustmentChange(ch.key, Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                {/* Quick increment/decrement buttons */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/40 text-[10px]">
                  <button
                    type="button"
                    onClick={() => onChannelAdjustmentChange(ch.key, Math.max(-40, currentDelta - 5))}
                    className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                  >
                    -5%
                  </button>
                  {isAdjusted ? (
                    <button
                      type="button"
                      onClick={() => onChannelAdjustmentChange(ch.key, 0)}
                      className="text-slate-400 hover:text-white"
                      title="Volver a 0%"
                    >
                      Base
                    </button>
                  ) : (
                    <span className="text-slate-500">0%</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onChannelAdjustmentChange(ch.key, Math.min(50, currentDelta + 5))}
                    className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                  >
                    +5%
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
