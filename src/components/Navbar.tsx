import React from 'react';
import { CurrencyUnit } from '../types/dashboard';
import { Download, RotateCcw, TrendingUp } from 'lucide-react';

interface NavbarProps {
  currencyUnit: CurrencyUnit;
  onCurrencyChange: (unit: CurrencyUnit) => void;
  onExportCSV: () => void;
  onResetSimulation: () => void;
  isModified: boolean;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currencyUnit,
  onCurrencyChange,
  onExportCSV,
  onResetSimulation,
  isModified,
  activeTab,
  onTabChange,
}) => {
  const navItems = [
    { id: 'resumen', label: 'Resumen Ejecutivo' },
    { id: 'estadisticas', label: 'Estadísticas Descriptivas' },
    { id: 'simulador', label: 'Simulador 2026-2030' },
    { id: 'tendencias', label: 'Evolución y Medios' },
    { id: 'participacion', label: 'Mix de Mercado' },
    { id: 'datos', label: 'Matriz Histórica' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              PubData Colombia
            </span>
          </div>

          {/* Zone 2: Navigation Links (Single-line, concise) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === item.id
                    ? 'text-white border-b-2 border-indigo-500 font-semibold'
                    : 'hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Currency Unit Selector */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
              <button
                type="button"
                onClick={() => onCurrencyChange('COP_B')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  currencyUnit === 'COP_B'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Billones de Pesos Colombianos ($ COP Billones)"
              >
                Billones
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('COP_M')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  currencyUnit === 'COP_M'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Millones de Pesos Colombianos ($ COP M)"
              >
                $M COP
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('USD_M')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  currencyUnit === 'USD_M'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dólares Estadounidenses (US$ M TRM)"
              >
                US$ M
              </button>
            </div>

            {/* Reset Simulation Button */}
            {isModified && (
              <button
                type="button"
                onClick={onResetSimulation}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 rounded-lg transition-colors whitespace-nowrap"
                title="Restablecer proyecciones a la línea base oficial"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            )}

            {/* Export CSV CTA */}
            <button
              type="button"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
              title="Descargar matriz en formato CSV para Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span> CSV
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
