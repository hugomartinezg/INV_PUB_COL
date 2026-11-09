import React, { useState, useMemo } from 'react';
import { YearRecord, CurrencyUnit, PeriodPresetId, DescriptiveStats } from '../../types/dashboard';
import { PERIOD_PRESETS, computeDescriptiveStats, formatCurrency, formatPercent } from '../../utils/calculations';
import { 
  BarChart2, 
  Calendar, 
  SlidersHorizontal, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface DescriptiveStatsViewProps {
  currentData: YearRecord[];
  baselineData: YearRecord[];
  currencyUnit: CurrencyUnit;
}

export const DescriptiveStatsView: React.FC<DescriptiveStatsViewProps> = ({
  currentData,
  baselineData,
  currencyUnit,
}) => {
  // Period filter state
  const [selectedPreset, setSelectedPreset] = useState<PeriodPresetId>('all');
  const [customStartYear, setCustomStartYear] = useState<number>(1995);
  const [customEndYear, setCustomEndYear] = useState<number>(2030);

  // Selected variable for the deep-dive Min-Max chart
  const [selectedVarKey, setSelectedVarKey] = useState<string>('digital');

  // Table category filter
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'medios' | 'agregados' | 'macro'>('all');

  // Chart display mode for deep-dive
  const [chartScaleMode, setChartScaleMode] = useState<'absolute' | 'normalized'>('absolute');

  // Hover state on deep dive chart
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Determine active start and end years
  const { startYear, endYear, activePresetConfig } = useMemo(() => {
    if (selectedPreset === 'custom') {
      return {
        startYear: Math.min(customStartYear, customEndYear),
        endYear: Math.max(customStartYear, customEndYear),
        activePresetConfig: null,
      };
    }
    const preset = PERIOD_PRESETS.find((p) => p.id === selectedPreset) || PERIOD_PRESETS[0];
    return {
      startYear: preset.startYear,
      endYear: preset.endYear,
      activePresetConfig: preset,
    };
  }, [selectedPreset, customStartYear, customEndYear]);

  // Compute stats dynamically for current period
  const statsList = useMemo(() => {
    return computeDescriptiveStats(currentData, startYear, endYear);
  }, [currentData, startYear, endYear]);

  // Baseline stats for the same period (to observe simulation impact if period touches 2026-2030)
  const baselineStatsList = useMemo(() => {
    return computeDescriptiveStats(baselineData, startYear, endYear);
  }, [baselineData, startYear, endYear]);

  // Currently selected variable stat
  const activeStat = useMemo(() => {
    return statsList.find((s) => s.key === selectedVarKey) || statsList[0];
  }, [statsList, selectedVarKey]);

  // Filtered stats for table
  const tableStats = useMemo(() => {
    if (categoryFilter === 'all') return statsList;
    return statsList.filter((s) => s.category === categoryFilter);
  }, [statsList, categoryFilter]);

  // Helper to format values according to variable unit and currencyUnit
  const formatStatValue = (val: number, stat: DescriptiveStats) => {
    if (stat.unit === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    if (stat.key === 'trm') {
      return `$${val.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    }
    if (stat.key === 'perCapita') {
      return `$${Math.round(val).toLocaleString('es-CO')} COP`;
    }
    // Currency unit (in Millions of COP in data)
    return formatCurrency(val, currencyUnit, 4200);
  };

  // SVG Chart Dimensions for the Min-Max Deep-Dive
  const chartWidth = 960;
  const chartHeight = 360;
  const padding = { top: 40, right: 40, bottom: 50, left: 80 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Min and Max strictly from the analyzed period
  const { periodMin, periodMax, timeSeries } = useMemo(() => {
    const series = activeStat.timeSeries;
    if (series.length === 0) {
      return { periodMin: 0, periodMax: 100, timeSeries: [] };
    }
    const vals = series.map((s: { year: number; value: number; isProjection: boolean }) => s.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    // If all values are identical, add a small delta
    const span = maxVal - minVal;
    const safeMin = span === 0 ? minVal * 0.9 : minVal;
    const safeMax = span === 0 ? maxVal * 1.1 : maxVal;
    return { periodMin: safeMin, periodMax: safeMax, timeSeries: series };
  }, [activeStat]);

  // Scale functions
  const getX = (index: number) => {
    if (timeSeries.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (timeSeries.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const range = periodMax - periodMin;
    if (range <= 0) return padding.top + plotHeight / 2;
    // Strictly anchored to [periodMin, periodMax]
    const clamped = Math.max(periodMin, Math.min(periodMax, val));
    const normalized = (clamped - periodMin) / range;
    return padding.top + plotHeight - normalized * plotHeight;
  };

  // Build SVG path
  const curvePath = useMemo(() => {
    if (timeSeries.length === 0) return '';
    return timeSeries.reduce((acc: string, pt: { year: number; value: number; isProjection: boolean }, idx: number) => {
      const x = getX(idx);
      const y = getY(pt.value);
      return idx === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
    }, '');
  }, [timeSeries, periodMin, periodMax]);

  // Area under the curve
  const areaPath = useMemo(() => {
    if (timeSeries.length === 0) return '';
    const bottomY = padding.top + plotHeight;
    const firstX = getX(0);
    const lastX = getX(timeSeries.length - 1);
    return `${curvePath} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;
  }, [curvePath, timeSeries]);

  const meanY = getY(activeStat.mean);
  const medianY = getY(activeStat.median);

  const hoveredPoint = hoveredPointIndex !== null ? timeSeries[hoveredPointIndex] : null;

  return (
    <div className="space-y-6">
      {/* 1. Header & Period Selector Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <BarChart2 className="w-4 h-4" />
              </span>
              <h2 className="text-base font-semibold text-white">
                Estadísticas Descriptivas Dinámicas por Año Base
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-medium">
                {startYear} – {endYear} ({endYear - startYear + 1} Años)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ajuste el período de análisis para contrastar la etapa Post-Pandemia, la última década o el total de la base.
              Todos los límites gráficos, medias, volatilidades y desviaciones se recalculan dinámicamente.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {endYear >= 2026 && (
              <span className="text-[11px] px-2 py-1 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Incluye Proyecciones / Simulación
              </span>
            )}
          </div>
        </div>

        {/* Period Selector Preset Buttons */}
        <div className="mt-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Seleccione Período de Análisis:</span>
            {activePresetConfig && (
              <span className="text-slate-400 text-[11px] normal-case">
                {activePresetConfig.description}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {PERIOD_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setCustomStartYear(preset.startYear);
                    setCustomEndYear(preset.endYear);
                  }}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-1 ring-indigo-400/50'
                      : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold truncate">{preset.label.split('(')[0]}</span>
                  </div>
                  <div className={`text-[11px] font-mono tabular-nums ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {preset.startYear} – {preset.endYear}
                  </div>
                </button>
              );
            })}

            {/* Custom Range Button */}
            <button
              type="button"
              onClick={() => setSelectedPreset('custom')}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                selectedPreset === 'custom'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-1 ring-indigo-400/50'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700/70 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-semibold">Personalizado</span>
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              </div>
              <div className={`text-[11px] font-mono tabular-nums ${selectedPreset === 'custom' ? 'text-indigo-100' : 'text-slate-400'}`}>
                {customStartYear} – {customEndYear}
              </div>
            </button>
          </div>
        </div>

        {/* Custom Range Inputs (if 'custom' selected) */}
        {selectedPreset === 'custom' && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-6 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-300">Año Inicial (Base):</span>
              <select
                value={customStartYear}
                onChange={(e) => setCustomStartYear(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
              >
                {Array.from({ length: 36 }, (_, i) => 1995 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} {yr >= 2026 ? '(Sim)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-300">Año Final:</span>
              <select
                value={customEndYear}
                onChange={(e) => setCustomEndYear(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
              >
                {Array.from({ length: 36 }, (_, i) => 1995 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} {yr >= 2026 ? '(Sim)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-indigo-400">
              Ventana activa: {Math.abs(customEndYear - customStartYear) + 1} años seleccionados
            </span>
          </div>
        )}
      </div>

      {/* 2. Min-Max Bounded Chart Deep-Dive Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <Maximize2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-white">
                Análisis Gráfico con Límites [Mínimo – Máximo] del Período
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              La escala vertical se ajusta exactamente al rango <span className="font-mono text-slate-300">[{formatStatValue(periodMin, activeStat)} – {formatStatValue(periodMax, activeStat)}]</span> observado en {startYear}–{endYear}.
            </p>
          </div>

          {/* Variable Picker Dropdown / Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Variable:</span>
            <select
              value={selectedVarKey}
              onChange={(e) => setSelectedVarKey(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <optgroup label="Medios de Pauta">
                {statsList
                  .filter((s) => s.category === 'medios')
                  .map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Agregados Publicitarios">
                {statsList
                  .filter((s) => s.category === 'agregados')
                  .map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Macroeconómicos">
                {statsList
                  .filter((s) => s.category === 'macro')
                  .map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Variable Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {/* Mínimo */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Mínimo del Período</span>
              <span className="text-[10px] text-rose-400 font-mono">Año {activeStat.minYear}</span>
            </div>
            <div className="text-sm font-bold text-rose-400 tabular-nums font-mono mt-1">
              {formatStatValue(activeStat.min, activeStat)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Límite inferior (0%)</div>
          </div>

          {/* Máximo */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Máximo del Período</span>
              <span className="text-[10px] text-emerald-400 font-mono">Año {activeStat.maxYear}</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 tabular-nums font-mono mt-1">
              {formatStatValue(activeStat.max, activeStat)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Límite superior (100%)</div>
          </div>

          {/* Media / Promedio */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] font-medium text-slate-400">Media (Promedio)</div>
            <div className="text-sm font-bold text-indigo-300 tabular-nums font-mono mt-1">
              {formatStatValue(activeStat.mean, activeStat)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">μ en {activeStat.count} observaciones</div>
          </div>

          {/* Mediana (P50) */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] font-medium text-slate-400">Mediana (P50)</div>
            <div className="text-sm font-bold text-white tabular-nums font-mono mt-1">
              {formatStatValue(activeStat.median, activeStat)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Punto medio de la distribución</div>
          </div>

          {/* Desviación Estándar & CV */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Desv. Estándar (σ)</span>
              <span className="text-[10px] text-amber-400 font-mono">CV: {activeStat.cv.toFixed(1)}%</span>
            </div>
            <div className="text-sm font-bold text-amber-300 tabular-nums font-mono mt-1">
              {activeStat.unit === 'percent'
                ? `±${activeStat.stdDev.toFixed(1)}%`
                : formatStatValue(activeStat.stdDev, activeStat)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Dispersión / Volatilidad</div>
          </div>

          {/* Crecimiento / CAGR */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>CAGR en Período</span>
              <span className="text-[10px] text-slate-400 font-mono">{activeStat.totalGrowthPct > 0 ? '+' : ''}{activeStat.totalGrowthPct.toFixed(1)}% Tot</span>
            </div>
            <div
              className={`text-sm font-bold tabular-nums font-mono mt-1 ${
                activeStat.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeStat.cagr > 0 ? '+' : ''}{activeStat.cagr.toFixed(2)}%
              <span className="text-[10px] text-slate-400 font-normal ml-1">anual</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{startYear} vs {endYear}</div>
          </div>
        </div>

        {/* SVG Min-Max Bounded Chart */}
        <div className="relative mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[700px] select-none"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            <defs>
              <linearGradient id={`grad-${activeStat.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeStat.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={activeStat.color} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Shaded Area of the Chart */}
            <path d={areaPath} fill={`url(#grad-${activeStat.key})`} />

            {/* Max Limit Line (100% Upper Bound) */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={chartWidth - padding.right}
              y2={padding.top}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={chartWidth - padding.right}
              y={padding.top - 8}
              fill="#34d399"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
              className="font-mono"
            >
              LÍMITE MÁXIMO DEL PERÍODO: {formatStatValue(periodMax, activeStat)} (Año {activeStat.maxYear})
            </text>

            {/* Min Limit Line (0% Lower Bound) */}
            <line
              x1={padding.left}
              y1={padding.top + plotHeight}
              x2={chartWidth - padding.right}
              y2={padding.top + plotHeight}
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={chartWidth - padding.right}
              y={padding.top + plotHeight + 16}
              fill="#fb7185"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
              className="font-mono"
            >
              LÍMITE MÍNIMO DEL PERÍODO: {formatStatValue(periodMin, activeStat)} (Año {activeStat.minYear})
            </text>

            {/* Mean Reference Line */}
            <line
              x1={padding.left}
              y1={meanY}
              x2={chartWidth - padding.right}
              y2={meanY}
              stroke="#818cf8"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            <text
              x={padding.left + 8}
              y={meanY - 5}
              fill="#a5b4fc"
              fontSize="9.5"
              fontWeight="500"
              className="font-mono"
            >
              Media (Promedio): {formatStatValue(activeStat.mean, activeStat)}
            </text>

            {/* Median Reference Line */}
            {Math.abs(medianY - meanY) > 12 && (
              <>
                <line
                  x1={padding.left}
                  y1={medianY}
                  x2={chartWidth - padding.right}
                  y2={medianY}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
                <text
                  x={padding.left + 8}
                  y={medianY + 11}
                  fill="#94a3b8"
                  fontSize="9.5"
                  className="font-mono"
                >
                  Mediana: {formatStatValue(activeStat.median, activeStat)}
                </text>
              </>
            )}

            {/* Intermediate Horizontal Grid ticks */}
            {[0.25, 0.5, 0.75].map((fraction) => {
              const val = periodMin + fraction * (periodMax - periodMin);
              const y = getY(val);
              return (
                <g key={fraction}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="2 3"
                    strokeOpacity="0.4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    fill="#64748b"
                    fontSize="9.5"
                    textAnchor="end"
                    className="font-mono"
                  >
                    {formatStatValue(val, activeStat)}
                  </text>
                </g>
              );
            })}

            {/* Primary Data Curve */}
            <path
              d={curvePath}
              fill="none"
              stroke={activeStat.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points on the Curve */}
            {timeSeries.map((pt: { year: number; value: number; isProjection: boolean }, idx: number) => {
              const x = getX(idx);
              const y = getY(pt.value);
              const isMin = pt.value === activeStat.min;
              const isMax = pt.value === activeStat.max;
              const isHovered = hoveredPointIndex === idx;

              return (
                <g key={pt.year} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(idx)}>
                  {/* Invisible hit rectangle */}
                  <rect
                    x={x - plotWidth / (timeSeries.length * 2)}
                    y={padding.top}
                    width={plotWidth / timeSeries.length}
                    height={plotHeight}
                    fill="transparent"
                  />

                  {/* Marker Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : isMin || isMax ? 5 : 3}
                    fill={isMax ? '#10b981' : isMin ? '#f43f5e' : activeStat.color}
                    stroke="#0f172a"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />

                  {/* Min / Max Callout Badges */}
                  {(isMax || isMin) && (
                    <g transform={`translate(${x}, ${isMax ? y - 12 : y + 16})`}>
                      <text
                        x="0"
                        y="0"
                        fill={isMax ? '#34d399' : '#fb7185'}
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {isMax ? 'MÁX' : 'MÍN'} ({pt.year})
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* X-Axis Year Labels */}
            {timeSeries.map((pt: { year: number; value: number; isProjection: boolean }, idx: number) => {
              const showLabel =
                timeSeries.length <= 15 ||
                idx === 0 ||
                idx === timeSeries.length - 1 ||
                pt.year % 5 === 0;

              if (!showLabel) return null;
              const x = getX(idx);
              return (
                <g key={pt.year}>
                  <line
                    x1={x}
                    y1={padding.top + plotHeight}
                    x2={x}
                    y2={padding.top + plotHeight + 5}
                    stroke="#475569"
                  />
                  <text
                    x={x}
                    y={padding.top + plotHeight + 18}
                    fill={pt.isProjection ? '#818cf8' : '#94a3b8'}
                    fontSize="10"
                    fontWeight={pt.year === startYear || pt.year === endYear ? 'bold' : 'normal'}
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {pt.year}
                  </text>
                </g>
              );
            })}

            {/* Hover Crosshair */}
            {hoveredPointIndex !== null && (
              <line
                x1={getX(hoveredPointIndex)}
                y1={padding.top}
                x2={getX(hoveredPointIndex)}
                y2={padding.top + plotHeight}
                stroke="#e2e8f0"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            )}
          </svg>

          {/* Hover Floating Card */}
          {hoveredPoint && hoveredPointIndex !== null && (
            <div
              className="absolute top-2 pointer-events-none bg-slate-950/95 border border-slate-700/80 p-3 rounded-lg shadow-xl backdrop-blur-md z-30 text-xs min-w-[200px]"
              style={{
                left: `${Math.min(Math.max(10, (getX(hoveredPointIndex) / chartWidth) * 100), 75)}%`,
              }}
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                <span className="font-bold text-white text-sm">Año {hoveredPoint.year}</span>
                {hoveredPoint.isProjection && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300">
                    Simulación
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-white font-mono">
                <span className="text-slate-400 font-sans text-xs">Valor:</span>
                <span>{formatStatValue(hoveredPoint.value, activeStat)}</span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                <span>Posición en rango:</span>
                <span className="font-mono font-medium text-indigo-300">
                  {periodMax > periodMin
                    ? `${(((hoveredPoint.value - periodMin) / (periodMax - periodMin)) * 100).toFixed(1)}% del [Mín-Máx]`
                    : '100%'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend / Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Máximo ({activeStat.maxYear})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Mínimo ({activeStat.minYear})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t border-dashed border-indigo-400" />
              <span>Media ({formatStatValue(activeStat.mean, activeStat)})</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Escala normalizada al intervalo [{formatStatValue(periodMin, activeStat)} – {formatStatValue(periodMax, activeStat)}]
          </span>
        </div>
      </div>

      {/* 3. Small Multiples: Grid of Min-Max Bounded Sparklines for All 7 Media Channels */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">
              Trayectoria Min-Max Comparativa por Canal de Medios ({startYear} – {endYear})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada gráfico está escalado individualmente a su propio [Mínimo, Máximo] del período para comparar dirección y aceleración
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {statsList
            .filter((s) => s.category === 'medios' || s.key === 'totalInv')
            .map((stat) => {
              const series = stat.timeSeries;
              const isSelected = stat.key === selectedVarKey;
              const minVal = stat.min;
              const maxVal = stat.max;
              const range = maxVal - minVal;

              // Generate micro path
              const microWidth = 240;
              const microHeight = 70;
              const microPad = 6;
              const path = series.reduce((acc: string, pt: { year: number; value: number; isProjection: boolean }, idx: number) => {
                const x = microPad + (idx / Math.max(1, series.length - 1)) * (microWidth - microPad * 2);
                const norm = range > 0 ? (pt.value - minVal) / range : 0.5;
                const y = microPad + (1 - norm) * (microHeight - microPad * 2);
                return idx === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
              }, '');

              return (
                <div
                  key={stat.key}
                  onClick={() => setSelectedVarKey(stat.key)}
                  className={`bg-slate-800/40 border rounded-xl p-3.5 cursor-pointer transition-all hover:bg-slate-800/80 ${
                    isSelected
                      ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-800/90'
                      : 'border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                      <span className="text-xs font-semibold text-white truncate" title={stat.label}>
                        {stat.shortLabel}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        stat.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {stat.cagr > 0 ? '+' : ''}{stat.cagr.toFixed(1)}% a.c.
                    </span>
                  </div>

                  {/* Micro Min-Max Sparkline */}
                  <div className="my-2 bg-slate-950/60 rounded p-1 border border-slate-800">
                    <svg viewBox={`0 0 ${microWidth} ${microHeight}`} className="w-full h-12">
                      <path
                        d={path}
                        fill="none"
                        stroke={stat.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Min and Max bounds labels */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-700/50">
                    <span className="text-rose-400/90">
                      Mín: {formatStatValue(stat.min, stat)}
                    </span>
                    <span className="text-emerald-400/90">
                      Máx: {formatStatValue(stat.max, stat)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 4. Complete Descriptive Statistics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90">
          <div>
            <h3 className="text-base font-semibold text-white">
              Tabla Ejecutiva de Estadísticas Descriptivas ({startYear} – {endYear})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Métricas computadas dinámicamente: Media, Mediana, Mínimo, Máximo, Desviación Estándar y Coeficiente de Variación
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                categoryFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas (14)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('medios')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                categoryFilter === 'medios' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Medios (7)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('agregados')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                categoryFilter === 'agregados' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Agregados (3)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('macro')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                categoryFilter === 'macro' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Macro (4)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-sans">
              <tr>
                <th className="py-3 px-3.5 font-semibold sticky left-0 bg-slate-950 z-10">VARIABLE</th>
                <th className="py-3 px-2.5 text-center font-semibold">N AÑOS</th>
                <th className="py-3 px-3 text-right font-semibold text-rose-400">MÍNIMO (AÑO)</th>
                <th className="py-3 px-3 text-right font-semibold text-emerald-400">MÁXIMO (AÑO)</th>
                <th className="py-3 px-3 text-right font-semibold text-indigo-300">MEDIA (μ)</th>
                <th className="py-3 px-3 text-right font-semibold text-white">MEDIANA (P50)</th>
                <th className="py-3 px-3 text-right font-semibold text-amber-300">DESV. EST (σ)</th>
                <th className="py-3 px-2.5 text-right font-semibold text-amber-400" title="Coeficiente de Variación (σ / μ * 100%)">
                  CV (%)
                </th>
                <th className="py-3 px-3 text-right font-semibold text-slate-300">CAGR PERÍODO</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-300">VAR TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {tableStats.map((stat) => {
                const isSelected = stat.key === selectedVarKey;

                return (
                  <tr
                    key={stat.key}
                    onClick={() => setSelectedVarKey(stat.key)}
                    className={`hover:bg-slate-850/70 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-950/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3.5 sticky left-0 bg-slate-900/90 z-10 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                        <span className="text-white font-medium truncate max-w-[170px]" title={stat.label}>
                          {stat.label}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2.5 text-center text-slate-400 tabular-nums">
                      {stat.count}
                    </td>

                    {/* Mínimo (Año) */}
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-400">
                      <div>{formatStatValue(stat.min, stat)}</div>
                      <div className="text-[10px] text-slate-500 font-sans">({stat.minYear})</div>
                    </td>

                    {/* Máximo (Año) */}
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400">
                      <div>{formatStatValue(stat.max, stat)}</div>
                      <div className="text-[10px] text-slate-500 font-sans">({stat.maxYear})</div>
                    </td>

                    {/* Media */}
                    <td className="py-2.5 px-3 text-right tabular-nums text-indigo-300 font-semibold">
                      {formatStatValue(stat.mean, stat)}
                    </td>

                    {/* Mediana */}
                    <td className="py-2.5 px-3 text-right tabular-nums text-white">
                      {formatStatValue(stat.median, stat)}
                    </td>

                    {/* Desviación Estándar */}
                    <td className="py-2.5 px-3 text-right tabular-nums text-amber-300">
                      {stat.unit === 'percent'
                        ? `±${stat.stdDev.toFixed(1)}%`
                        : formatStatValue(stat.stdDev, stat)}
                    </td>

                    {/* Coeficiente de Variación */}
                    <td className="py-2.5 px-2.5 text-right tabular-nums text-amber-400 font-semibold">
                      {stat.cv.toFixed(1)}%
                    </td>

                    {/* CAGR */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span className={stat.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {stat.cagr > 0 ? '+' : ''}{stat.cagr.toFixed(2)}%
                      </span>
                    </td>

                    {/* Total Growth */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span className={stat.totalGrowthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {stat.totalGrowthPct > 0 ? '+' : ''}{stat.totalGrowthPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Haga clic en cualquier fila para visualizar su gráfico normalizado en la sección superior</span>
          <span className="text-slate-500">
            Período analizado: {startYear} al {endYear} · Base de cálculo dinámica
          </span>
        </div>
      </div>
    </div>
  );
};
