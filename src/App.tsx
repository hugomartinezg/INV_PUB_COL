import React, { useState, useMemo } from 'react';
import { YearRecord, CurrencyUnit, MediaChannelKey, ScenarioPreset } from './types/dashboard';
import { INITIAL_DATASET, SCENARIO_PRESETS, CHANNELS } from './data/advertisingData';
import { computeDashboardMetrics, calculateTotalInv, downloadCSV, formatCurrency } from './utils/calculations';
import { Navbar } from './components/Navbar';
import { ExecutiveKPIs } from './components/ExecutiveKPIs';
import { SimulationControls } from './components/SimulationControls';
import { ProjectionsEditorTable } from './components/ProjectionsEditorTable';
import { HistoricalAndProjectionChart } from './components/Charts/HistoricalAndProjectionChart';
import { MarketShareMixChart } from './components/Charts/MarketShareMixChart';
import { ScenarioComparisonChart } from './components/Charts/ScenarioComparisonChart';
import { MacroCorrelationsChart } from './components/Charts/MacroCorrelationsChart';
import { FullHistoricalTable } from './components/FullHistoricalTable';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { DescriptiveStatsView } from './components/DescriptiveStats/DescriptiveStatsView';
import { Sparkles, Sliders, BarChart3, PieChart, Table, AlertCircle } from 'lucide-react';

export default function App() {
  // Main data state: 36 years (1995-2030)
  const [data, setData] = useState<YearRecord[]>(INITIAL_DATASET);
  const baselineData = useMemo(() => INITIAL_DATASET, []);

  // UI state
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('COP_B');
  const [activeTab, setActiveTab] = useState<string>('resumen');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('baseline');

  // Percentage levers applied over baseline for 2026-2030 (-40% to +50%)
  const [channelAdjustments, setChannelAdjustments] = useState<Record<MediaChannelKey, number>>({
    digital: 0,
    pubExterior: 0,
    tvNacional: 0,
    radio: 0,
    prensa: 0,
    tvRegLocal: 0,
    revistas: 0,
  });

  // Check if current data deviates from baseline
  const isModified = useMemo(() => {
    return data.some((d, idx) => {
      if (!d.isProjection) return false;
      const base = baselineData[idx];
      return Math.abs(d.totalInv - base.totalInv) > 0.1;
    });
  }, [data, baselineData]);

  // Handle direct cell update in projection rows (2026-2030)
  const handleUpdateProjectionCell = (year: number, channel: MediaChannelKey, newValue: number) => {
    setData((prevData) => {
      return prevData.map((record) => {
        if (record.year !== year) return record;
        const updated = {
          ...record,
          [channel]: newValue,
        };
        updated.totalInv = calculateTotalInv(updated);
        return updated;
      });
    });
    setActiveScenarioId('custom');
  };

  // Reset a specific year to baseline
  const handleResetYear = (year: number) => {
    const baseRecord = baselineData.find((b) => b.year === year);
    if (!baseRecord) return;
    setData((prevData) => {
      return prevData.map((record) => {
        if (record.year !== year) return record;
        return { ...baseRecord };
      });
    });
  };

  // Select predefined scenario
  const handleSelectScenario = (preset: ScenarioPreset) => {
    setActiveScenarioId(preset.id);

    if (preset.id === 'baseline' || !preset.channelMultipliers) {
      // Restore baseline
      setData(INITIAL_DATASET);
      setChannelAdjustments({
        digital: 0,
        pubExterior: 0,
        tvNacional: 0,
        radio: 0,
        prensa: 0,
        tvRegLocal: 0,
        revistas: 0,
      });
      return;
    }

    // Apply multipliers from preset
    const newAdjustments: Record<MediaChannelKey, number> = {
      digital: 0,
      pubExterior: 0,
      tvNacional: 0,
      radio: 0,
      prensa: 0,
      tvRegLocal: 0,
      revistas: 0,
    };

    CHANNELS.forEach((ch) => {
      const mult = preset.channelMultipliers?.[ch.key] ?? 1;
      newAdjustments[ch.key] = Math.round((mult - 1) * 100);
    });
    setChannelAdjustments(newAdjustments);

    // Recalculate 2026-2030 records from baseline
    setData((prevData) => {
      return prevData.map((record) => {
        if (!record.isProjection) return record;
        const base = baselineData.find((b) => b.year === record.year) || record;
        const updated: YearRecord = { ...base };

        CHANNELS.forEach((ch) => {
          const mult = preset.channelMultipliers?.[ch.key] ?? 1;
          const original = base[ch.key] as number;
          updated[ch.key] = Number((original * mult).toFixed(1));
        });

        updated.totalInv = calculateTotalInv(updated);
        return updated;
      });
    });
  };

  // Channel adjustment slider change
  const handleChannelAdjustmentChange = (channel: MediaChannelKey, deltaPercent: number) => {
    setChannelAdjustments((prev) => ({
      ...prev,
      [channel]: deltaPercent,
    }));
    setActiveScenarioId('custom');

    const multiplier = 1 + deltaPercent / 100;

    setData((prevData) => {
      return prevData.map((record) => {
        if (!record.isProjection) return record;
        const base = baselineData.find((b) => b.year === record.year) || record;
        const baseVal = base[channel] as number;
        const updatedVal = Number((baseVal * multiplier).toFixed(1));

        const updated = {
          ...record,
          [channel]: updatedVal,
        };
        updated.totalInv = calculateTotalInv(updated);
        return updated;
      });
    });
  };

  // Reset everything to baseline
  const handleResetToBaseline = () => {
    setData(INITIAL_DATASET);
    setActiveScenarioId('baseline');
    setChannelAdjustments({
      digital: 0,
      pubExterior: 0,
      tvNacional: 0,
      radio: 0,
      prensa: 0,
      tvRegLocal: 0,
      revistas: 0,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    downloadCSV(data, `inversion_publicitaria_colombia_${activeScenarioId}_2030.csv`);
  };

  // Dashboard calculations
  const metrics = useMemo(() => computeDashboardMetrics(data, baselineData), [data, baselineData]);
  const current2025Record = useMemo(() => data.find((d) => d.year === 2025) || data[30], [data]);
  const current2030Record = useMemo(() => data.find((d) => d.year === 2030) || data[data.length - 1], [data]);

  const projectionRecords = useMemo(() => data.filter((d) => d.isProjection), [data]);
  const baselineProjectionRecords = useMemo(() => baselineData.filter((d) => d.isProjection), [baselineData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currencyUnit={currencyUnit}
        onCurrencyChange={setCurrencyUnit}
        onExportCSV={handleExportCSV}
        onResetSimulation={handleResetToBaseline}
        isModified={isModified}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Simulation Notification Banner */}
        {isModified && (
          <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-200">
              <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong>Simulación Activa:</strong> Las proyecciones 2026-2030 reflejan ajustes manuales o de escenario.
                Desvío acumulado en 2030:{' '}
                <strong className={metrics.totalDifference2030 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {metrics.totalDifference2030 >= 0 ? '+' : ''}
                  {formatCurrency(metrics.totalDifference2030, currencyUnit, 4400)} ({metrics.percentDifference2030.toFixed(1)}%)
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetToBaseline}
              className="text-xs font-semibold text-indigo-300 hover:text-white underline self-start sm:self-auto"
            >
              Restablecer valores originales
            </button>
          </div>
        )}

        {/* Executive KPI Strip */}
        <section aria-label="KPIs Ejecutivos">
          <ExecutiveKPIs
            metrics={metrics}
            currencyUnit={currencyUnit}
            current2030Record={current2030Record}
            current2025Record={current2025Record}
          />
        </section>

        {/* TAB NAVIGATION VIEWS */}

        {/* 1. RESUMEN EJECUTIVO TAB */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            {/* Simulation Levers Quick Bar */}
            <SimulationControls
              activeScenarioId={activeScenarioId}
              onSelectScenario={handleSelectScenario}
              channelAdjustments={channelAdjustments}
              onChannelAdjustmentChange={handleChannelAdjustmentChange}
              onResetToBaseline={handleResetToBaseline}
              isModified={isModified}
            />

            {/* Main Interactive Historical + Projection Chart */}
            <HistoricalAndProjectionChart
              currentData={data}
              baselineData={baselineData}
              currencyUnit={currencyUnit}
            />

            {/* Strategic Executive Takeaways */}
            <ExecutiveSummary
              metrics={metrics}
              currencyUnit={currencyUnit}
              current2030Record={current2030Record}
            />

            {/* Scenario Comparison Grid */}
            <ScenarioComparisonChart
              currentData={data}
              baselineData={baselineData}
              currencyUnit={currencyUnit}
            />
          </div>
        )}

        {/* 2. ESTADÍSTICAS DESCRIPTIVAS & ANÁLISIS MIN-MAX TAB */}
        {activeTab === 'estadisticas' && (
          <DescriptiveStatsView
            currentData={data}
            baselineData={baselineData}
            currencyUnit={currencyUnit}
          />
        )}

        {/* 3. SIMULADOR 2026-2030 TAB */}
        {activeTab === 'simulador' && (
          <div className="space-y-6">
            <SimulationControls
              activeScenarioId={activeScenarioId}
              onSelectScenario={handleSelectScenario}
              channelAdjustments={channelAdjustments}
              onChannelAdjustmentChange={handleChannelAdjustmentChange}
              onResetToBaseline={handleResetToBaseline}
              isModified={isModified}
            />

            {/* Interactive Inline Projections Editor */}
            <ProjectionsEditorTable
              projectionRecords={projectionRecords}
              baselineRecords={baselineProjectionRecords}
              lastHistoricalRecord={current2025Record}
              currencyUnit={currencyUnit}
              onUpdateProjectionCell={handleUpdateProjectionCell}
              onResetYear={handleResetYear}
            />

            {/* Scenario Comparison Chart */}
            <ScenarioComparisonChart
              currentData={data}
              baselineData={baselineData}
              currencyUnit={currencyUnit}
            />
          </div>
        )}

        {/* 3. EVOLUCIÓN HISTÓRICA & MEDIOS TAB */}
        {activeTab === 'tendencias' && (
          <div className="space-y-6">
            <HistoricalAndProjectionChart
              currentData={data}
              baselineData={baselineData}
              currencyUnit={currencyUnit}
            />

            <MacroCorrelationsChart
              currentData={data}
              currencyUnit={currencyUnit}
            />
          </div>
        )}

        {/* 4. MIX DE MERCADO TAB */}
        {activeTab === 'participacion' && (
          <div className="space-y-6">
            <MarketShareMixChart
              currentData={data}
              currencyUnit={currencyUnit}
            />

            <ExecutiveSummary
              metrics={metrics}
              currencyUnit={currencyUnit}
              current2030Record={current2030Record}
            />
          </div>
        )}

        {/* 5. MATRIZ DE DATOS TAB */}
        {activeTab === 'datos' && (
          <div className="space-y-6">
            <FullHistoricalTable
              currentData={data}
              currencyUnit={currencyUnit}
              onExportCSV={handleExportCSV}
            />

            {/* Editable projections below for quick tweaking */}
            <ProjectionsEditorTable
              projectionRecords={projectionRecords}
              baselineRecords={baselineProjectionRecords}
              lastHistoricalRecord={current2025Record}
              currencyUnit={currencyUnit}
              onUpdateProjectionCell={handleUpdateProjectionCell}
              onResetYear={handleResetYear}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-5 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>PubData Colombia</span>
            <span>·</span>
            <span>Análisis Anual del Mercado Publicitario (1995-2025) y Modelo de Simulación Ejecutiva (2026-2030)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Fuente: Asomedios / DANE / Banco de la República</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
