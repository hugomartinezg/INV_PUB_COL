import React, { useState, useMemo } from 'react';
import { YearRecord, MediaChannelKey, CurrencyUnit } from '../../types/dashboard';
import { CHANNELS } from '../../data/advertisingData';
import { formatCurrency, formatPercent } from '../../utils/calculations';
import { Layers, Eye, EyeOff } from 'lucide-react';

interface HistoricalAndProjectionChartProps {
  currentData: YearRecord[];
  baselineData: YearRecord[];
  currencyUnit: CurrencyUnit;
}

type ViewMode = 'total_vs_baseline' | 'channels' | 'digital_vs_traditional';

export const HistoricalAndProjectionChart: React.FC<HistoricalAndProjectionChartProps> = ({
  currentData,
  baselineData,
  currencyUnit,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('channels');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [visibleChannels, setVisibleChannels] = useState<Record<MediaChannelKey, boolean>>({
    digital: true,
    pubExterior: true,
    tvNacional: true,
    radio: true,
    prensa: true,
    tvRegLocal: true,
    revistas: true,
  });

  const toggleChannel = (key: MediaChannelKey) => {
    setVisibleChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // SVG dimensions
  const width = 1000;
  const height = 400;
  const padding = { top: 30, right: 30, bottom: 50, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max value calculation across all series and years
  const maxValue = useMemo(() => {
    let max = 0;
    currentData.forEach((d) => {
      if (viewMode === 'total_vs_baseline') {
        max = Math.max(max, d.totalInv);
      } else if (viewMode === 'digital_vs_traditional') {
        const trad = d.tvRegLocal + d.revistas + d.pubExterior + d.prensa + d.radio + d.tvNacional;
        max = Math.max(max, d.digital, trad);
      } else {
        // Individual channels
        CHANNELS.forEach((ch) => {
          if (visibleChannels[ch.key]) {
            max = Math.max(max, d[ch.key] as number);
          }
        });
      }
    });
    // Add 10% ceiling headroom
    return Math.max(max * 1.12, 100000);
  }, [currentData, viewMode, visibleChannels]);

  // X and Y scales
  const getX = (index: number) => {
    return padding.left + (index / (currentData.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, val);
    return padding.top + chartHeight - (clamped / maxValue) * chartHeight;
  };

  // 2025 index is index 30 (1995 is 0)
  const projectionStartIndex = currentData.findIndex((d) => d.year === 2026);
  const projectionStartX = projectionStartIndex !== -1 ? getX(projectionStartIndex - 0.5) : chartWidth;

  // Generate path string for a numeric accessor
  const generatePath = (
    data: YearRecord[],
    accessor: (d: YearRecord) => number,
    startIndex = 0,
    endIndex = data.length - 1
  ) => {
    let path = '';
    for (let i = startIndex; i <= endIndex; i++) {
      const x = getX(i);
      const y = getY(accessor(data[i]));
      if (i === startIndex) {
        path += `M ${x.toFixed(1)},${y.toFixed(1)}`;
      } else {
        path += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
      }
    }
    return path;
  };

  // Y-axis grid ticks (5 steps)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => pct * maxValue);

  const hoveredRecord = hoveredIndex !== null ? currentData[hoveredIndex] : null;
  const hoveredBaseline = hoveredIndex !== null ? baselineData[hoveredIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              Evolución Histórica (1995-2025) y Simulación (2026-2030)
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              36 Años de Serie
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualice el desplazamiento del presupuesto hacia medios digitales y simule la trayectoria hasta 2030
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('channels')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'channels'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Por Medios
          </button>
          <button
            type="button"
            onClick={() => setViewMode('digital_vs_traditional')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'digital_vs_traditional'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Digital vs Tradicional
          </button>
          <button
            type="button"
            onClick={() => setViewMode('total_vs_baseline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'total_vs_baseline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Total vs Línea Base
          </button>
        </div>
      </div>

      {/* Channel Toggles (when in 'channels' view) */}
      {viewMode === 'channels' && (
        <div className="flex flex-wrap items-center gap-2 my-3 pt-1">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Canales activos:</span>
          {CHANNELS.map((ch) => {
            const isVisible = visibleChannels[ch.key];
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => toggleChannel(ch.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  isVisible
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isVisible ? ch.color : '#475569' }}
                />
                <span>{ch.shortLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* SVG Chart */}
      <div className="relative mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[700px] select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Shaded Background for Projection Zone (2026-2030) */}
          <rect
            x={projectionStartX}
            y={padding.top}
            width={width - padding.right - projectionStartX}
            height={chartHeight}
            fill="#312e81"
            fillOpacity="0.12"
          />

          {/* Dividing dashed line between Historical and Projection */}
          <line
            x1={projectionStartX}
            y1={padding.top}
            x2={projectionStartX}
            y2={padding.top + chartHeight}
            stroke="#818cf8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={projectionStartX + 8}
            y={padding.top + 14}
            fill="#a5b4fc"
            fontSize="10"
            fontWeight="600"
            letterSpacing="0.05em"
          >
            ZONA DE PROYECCIÓN & SIMULACIÓN (2026 - 2030)
          </text>
          <text
            x={projectionStartX - 8}
            y={padding.top + 14}
            fill="#64748b"
            fontSize="10"
            fontWeight="500"
            textAnchor="end"
          >
            HISTÓRICO REAL (1995-2025)
          </text>

          {/* Horizontal Y-Grid lines */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono"
                >
                  {formatCurrency(val, currencyUnit, 4150)}
                </text>
              </g>
            );
          })}

          {/* X-Axis Years Labels */}
          {currentData.map((d, idx) => {
            // Show every 3-5 years or key milestone years
            const isMilestone =
              idx === 0 ||
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
              <g key={d.year}>
                <line
                  x1={x}
                  y1={padding.top + chartHeight}
                  x2={x}
                  y2={padding.top + chartHeight + 6}
                  stroke="#475569"
                />
                <text
                  x={x}
                  y={padding.top + chartHeight + 20}
                  fill={d.isProjection ? '#818cf8' : '#94a3b8'}
                  fontSize="10.5"
                  fontWeight={d.year === 2025 || d.year === 2030 ? 'bold' : 'normal'}
                  textAnchor="middle"
                  className="font-mono"
                >
                  {d.year}
                </text>
              </g>
            );
          })}

          {/* VIEW MODE 1: CHANNELS */}
          {viewMode === 'channels' &&
            CHANNELS.map((ch) => {
              if (!visibleChannels[ch.key]) return null;

              // Historical segment (0 to 30)
              const histPath = generatePath(currentData, (d) => d[ch.key] as number, 0, 30);
              // Projection segment (30 to 35)
              const projPath = generatePath(currentData, (d) => d[ch.key] as number, 30, currentData.length - 1);

              return (
                <g key={ch.key}>
                  {/* Historical Solid Line */}
                  <path
                    d={histPath}
                    fill="none"
                    stroke={ch.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Projection Dashed Line */}
                  <path
                    d={projPath}
                    fill="none"
                    stroke={ch.color}
                    strokeWidth="2.5"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

          {/* VIEW MODE 2: DIGITAL VS TRADITIONAL */}
          {viewMode === 'digital_vs_traditional' && (
            <>
              {/* Digital Line */}
              <path
                d={generatePath(currentData, (d) => d.digital, 0, 30)}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={generatePath(currentData, (d) => d.digital, 30, currentData.length - 1)}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />

              {/* Traditional Line */}
              <path
                d={generatePath(
                  currentData,
                  (d) => d.tvRegLocal + d.revistas + d.pubExterior + d.prensa + d.radio + d.tvNacional,
                  0,
                  30
                )}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={generatePath(
                  currentData,
                  (d) => d.tvRegLocal + d.revistas + d.pubExterior + d.prensa + d.radio + d.tvNacional,
                  30,
                  currentData.length - 1
                )}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            </>
          )}

          {/* VIEW MODE 3: TOTAL VS BASELINE */}
          {viewMode === 'total_vs_baseline' && (
            <>
              {/* Baseline Total Line (Dotted Slate) */}
              <path
                d={generatePath(baselineData, (d) => d.totalInv, 0, baselineData.length - 1)}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Current Simulated Total Line (Solid Indigo up to 2025, dashed beyond) */}
              <path
                d={generatePath(currentData, (d) => d.totalInv, 0, 30)}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d={generatePath(currentData, (d) => d.totalInv, 30, currentData.length - 1)}
                fill="none"
                stroke="#818cf8"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Hover Crosshair Column Detectors */}
          {currentData.map((d, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={d.year}
                onMouseEnter={() => setHoveredIndex(idx)}
                className="cursor-pointer"
              >
                {/* Transparent hit area */}
                <rect
                  x={x - chartWidth / (currentData.length * 2)}
                  y={padding.top}
                  width={chartWidth / currentData.length}
                  height={chartHeight}
                  fill="transparent"
                />

                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + chartHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={x}
                      cy={getY(d.totalInv)}
                      r="4"
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredRecord && hoveredIndex !== null && (
          <div
            className="absolute top-4 pointer-events-none bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md z-30 min-w-[240px] text-xs transition-all"
            style={{
              left: `${Math.min(Math.max(10, (getX(hoveredIndex) / width) * 100), 72)}%`,
            }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                <span>{hoveredRecord.year}</span>
                {hoveredRecord.isProjection ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-normal">
                    Simulación
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                    Real
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-bold text-white tabular-nums font-mono">
                  {formatCurrency(hoveredRecord.totalInv, currencyUnit, hoveredRecord.trm || 4150)}
                </span>
              </div>
            </div>

            {/* Inversión Breakdown by Channels */}
            <div className="space-y-1.5">
              {CHANNELS.map((ch) => {
                const val = hoveredRecord[ch.key] as number;
                const share = hoveredRecord.totalInv > 0 ? (val / hoveredRecord.totalInv) * 100 : 0;
                return (
                  <div key={ch.key} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[130px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                      <span className="truncate">{ch.shortLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums font-mono">
                      <span className="text-white font-medium">
                        {formatCurrency(val, currencyUnit, hoveredRecord.trm || 4150)}
                      </span>
                      <span className="text-slate-400 text-[10px] w-9 text-right font-sans">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Macro Stats for that Year */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 grid grid-cols-2 gap-1.5">
              <div>
                TRM: <span className="text-slate-200 font-mono font-medium">${hoveredRecord.trm?.toLocaleString('es-CO') || 'N/D'}</span>
              </div>
              <div>
                Pen. Internet: <span className="text-slate-200 font-mono font-medium">{hoveredRecord.internetPenetration}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Instructions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-slate-400 inline-block" />
            <span>Línea Continua: Cierre Histórico Real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-indigo-400 inline-block" />
            <span>Línea Punteada: Proyección / Simulación Activa</span>
          </div>
        </div>
        <div className="text-slate-500 text-[11px]">
          Pase el cursor sobre cualquier punto del gráfico para ver detalles
        </div>
      </div>
    </div>
  );
};
