import React from 'react';
import { DashboardMetrics, CurrencyUnit, YearRecord } from '../types/dashboard';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { Award, Target, Compass, Zap, CheckCircle2 } from 'lucide-react';

interface ExecutiveSummaryProps {
  metrics: DashboardMetrics;
  currencyUnit: CurrencyUnit;
  current2030Record: YearRecord;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  metrics,
  currencyUnit,
  current2030Record,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
        <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
          <Compass className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-white">
            Conclusiones Estratégicas & Lineamientos para Comité Directivo
          </h3>
          <p className="text-xs text-slate-400">
            Síntesis cuantitativa del mercado publicitario colombiano (1995-2025) y proyección 2030
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Finding 1 */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-sky-400">01. Hegemonía Digital Absoluta</span>
              <span className="text-[11px] font-mono text-slate-400">{metrics.digitalShare2030.toFixed(1)}% Share</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              El canal digital consolidó su liderazgo tras superar a la TV Nacional en el año 2020. Para 2030 capturará cerca de <strong>7 de cada 10 pesos</strong> invertidos en pauta en Colombia, impulsado por programática, retail media, redes sociales y video online.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-700/40 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Prioridad: Asignación óptima en CTV y Search</span>
          </div>
        </div>

        {/* Finding 2 */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400">02. El Auge de Publicidad Exterior (DOOH)</span>
              <span className="text-[11px] font-mono text-slate-400">+{metrics.exteriorGrowth2025_2030.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              La Publicidad Exterior es el <strong>único medio no digital que exhibe crecimiento sostenido</strong> positivo en el país, proyectando alcanzar <strong>{formatCurrency(current2030Record.pubExterior, currencyUnit, 4400)}</strong> en 2030 gracias a la digitalización de circuitos urbanos, centros comerciales y aeropuertos.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-700/40 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sinergia: Campañas mixtas Mobile + Pantallas Urbanas</span>
          </div>
        </div>

        {/* Finding 3 */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400">03. Reposicionamiento Tradicional</span>
              <span className="text-[11px] font-mono text-slate-400">TV & Radio</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              La Televisión Nacional ({formatCurrency(current2030Record.tvNacional, currencyUnit, 4400)}) y la Radio ({formatCurrency(current2030Record.radio, currencyUnit, 4400)}) retienen un rol insustituible para <strong>construcción masiva de marca inmediata</strong>, cobertura en directo (deportes/noticias) y confianza institucional.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-700/40 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Enfoque: Patrocinios de alto impacto vs pauta de frecuencia</span>
          </div>
        </div>
      </div>
    </div>
  );
};
