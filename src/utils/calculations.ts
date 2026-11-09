import { YearRecord, DashboardMetrics, CurrencyUnit, MediaChannelKey, PeriodPresetId, DescriptiveStats } from '../types/dashboard';
import { CHANNELS } from '../data/advertisingData';

export function calculateTotalInv(record: Partial<YearRecord>): number {
  const sum = 
    (record.tvRegLocal || 0) +
    (record.revistas || 0) +
    (record.pubExterior || 0) +
    (record.prensa || 0) +
    (record.radio || 0) +
    (record.tvNacional || 0) +
    (record.digital || 0);
  return Number(sum.toFixed(1));
}

export function calculateTraditionalTotal(record: YearRecord): number {
  return Number((
    record.tvRegLocal +
    record.revistas +
    record.pubExterior +
    record.prensa +
    record.radio +
    record.tvNacional
  ).toFixed(1));
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

export function computeDashboardMetrics(
  currentData: YearRecord[],
  baselineData: YearRecord[]
): DashboardMetrics {
  const record2025 = currentData.find(d => d.year === 2025) || currentData[30];
  const record2030 = currentData.find(d => d.year === 2030) || currentData[currentData.length - 1];
  const baseline2030 = baselineData.find(d => d.year === 2030) || baselineData[baselineData.length - 1];

  const total2025 = record2025.totalInv;
  const total2030 = record2030.totalInv;
  const baselineTotal2030 = baseline2030.totalInv;

  const totalDifference2030 = total2030 - baselineTotal2030;
  const percentDifference2030 = baselineTotal2030 > 0 ? (totalDifference2030 / baselineTotal2030) * 100 : 0;

  const cagr2025_2030 = calculateCAGR(total2025, total2030, 5);
  const baselineCagr2025_2030 = calculateCAGR(total2025, baselineTotal2030, 5);

  const digitalShare2025 = (record2025.digital / total2025) * 100;
  const digitalShare2030 = (record2030.digital / total2030) * 100;
  const traditionalShare2030 = 100 - digitalShare2030;

  const exteriorGrowth2025_2030 = record2025.pubExterior > 0 
    ? ((record2030.pubExterior - record2025.pubExterior) / record2025.pubExterior) * 100 
    : 0;

  // Find channel with highest relative growth from 2025 to 2030
  let topGrowingKey: MediaChannelKey = 'digital';
  let maxGrowth = -Infinity;

  for (const ch of CHANNELS) {
    const val2025 = record2025[ch.key] as number;
    const val2030 = record2030[ch.key] as number;
    if (val2025 > 0) {
      const g = ((val2030 - val2025) / val2025) * 100;
      if (g > maxGrowth) {
        maxGrowth = g;
        topGrowingKey = ch.key;
      }
    }
  }

  const topChannelMeta = CHANNELS.find(c => c.key === topGrowingKey) || CHANNELS[0];

  return {
    total2025,
    total2030,
    baselineTotal2030,
    totalDifference2030,
    percentDifference2030,
    cagr2025_2030,
    baselineCagr2025_2030,
    digitalShare2025,
    digitalShare2030,
    traditionalShare2030,
    exteriorGrowth2025_2030,
    topGrowingChannel: {
      key: topGrowingKey,
      label: topChannelMeta.label,
      growthPercent: maxGrowth,
    },
  };
}

export function formatCurrency(
  amountInMillionsCOP: number,
  unit: CurrencyUnit = 'COP_M',
  trm: number = 4150
): string {
  if (isNaN(amountInMillionsCOP) || amountInMillionsCOP === null) return '-';

  if (unit === 'COP_B') {
    // 1 Billon COP = 1,000,000 Millones COP
    const billions = amountInMillionsCOP / 1000000;
    return `$${billions.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`;
  }

  if (unit === 'USD_M') {
    const usdMillions = amountInMillionsCOP / (trm || 4150);
    return `US$${usdMillions.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
  }

  // Default: Millones COP ($M)
  return `$${amountInMillionsCOP.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} M`;
}

export function formatCompact(val: number): string {
  if (val >= 1000000) {
    return `$${(val / 1000000).toFixed(2)}B`;
  }
  if (val >= 1000) {
    return `$${(val / 1000).toFixed(0)}k M`;
  }
  return `$${val.toFixed(0)} M`;
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value) || value === null) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export const PERIOD_PRESETS: { id: PeriodPresetId; label: string; badge?: string; description: string; startYear: number; endYear: number }[] = [
  {
    id: 'all',
    label: 'Total de la Base (1995 – 2030)',
    badge: 'Serie Completa',
    description: '36 años de trayectoria: 31 años históricos consolidados más 5 años de proyección y simulación.',
    startYear: 1995,
    endYear: 2030,
  },
  {
    id: 'historical',
    label: 'Histórico Total (1995 – 2025)',
    badge: '31 Años Reales',
    description: 'Toda la serie histórica auditada previa al horizonte de proyecciones.',
    startYear: 1995,
    endYear: 2025,
  },
  {
    id: 'post_covid',
    label: 'Post-Pandemia (2021 – 2030)',
    badge: 'Era Post-COVID',
    description: 'Aceleración digital, consolidación del e-commerce y recuperación económica tras el confinamiento de 2020.',
    startYear: 2021,
    endYear: 2030,
  },
  {
    id: 'last_10_years',
    label: 'Últimos 10 Años (2016 – 2025)',
    badge: 'Década Reciente',
    description: 'Últimos 10 años de datos consolidados, capturando el cambio de guardia de medios tradicionales a digitales.',
    startYear: 2016,
    endYear: 2025,
  },
  {
    id: 'digital_era',
    label: 'Era Digital (2008 – 2030)',
    badge: '2008+',
    description: 'Desde la primera medición oficial de pauta digital en Colombia ($40.6k M) hasta su consolidación.',
    startYear: 2008,
    endYear: 2030,
  },
  {
    id: 'projections',
    label: 'Proyecciones (2026 – 2030)',
    badge: 'Horizonte Futuro',
    description: 'Los 5 años de estimaciones y simulaciones interactivas.',
    startYear: 2026,
    endYear: 2030,
  },
];

export interface VariableConfig {
  key: string;
  label: string;
  shortLabel: string;
  category: 'medios' | 'agregados' | 'macro';
  unit: 'currency' | 'percent' | 'number';
  color: string;
  getValue: (d: YearRecord) => number | null;
}

export const VARIABLE_CONFIGS: VariableConfig[] = [
  // Medios de pauta
  {
    key: 'digital',
    label: 'Digital / Internet',
    shortLabel: 'Digital',
    category: 'medios',
    unit: 'currency',
    color: '#0284c7',
    getValue: (d) => d.digital,
  },
  {
    key: 'pubExterior',
    label: 'Publicidad Exterior (OOH)',
    shortLabel: 'Exterior (OOH)',
    category: 'medios',
    unit: 'currency',
    color: '#059669',
    getValue: (d) => d.pubExterior,
  },
  {
    key: 'tvNacional',
    label: 'Televisión Nacional',
    shortLabel: 'TV Nacional',
    category: 'medios',
    unit: 'currency',
    color: '#6366f1',
    getValue: (d) => d.tvNacional,
  },
  {
    key: 'radio',
    label: 'Radio',
    shortLabel: 'Radio',
    category: 'medios',
    unit: 'currency',
    color: '#d97706',
    getValue: (d) => d.radio,
  },
  {
    key: 'prensa',
    label: 'Prensa Escrita',
    shortLabel: 'Prensa',
    category: 'medios',
    unit: 'currency',
    color: '#e11d48',
    getValue: (d) => d.prensa,
  },
  {
    key: 'tvRegLocal',
    label: 'TV Regional y Local',
    shortLabel: 'TV Regional',
    category: 'medios',
    unit: 'currency',
    color: '#8b5cf6',
    getValue: (d) => d.tvRegLocal,
  },
  {
    key: 'revistas',
    label: 'Revistas',
    shortLabel: 'Revistas',
    category: 'medios',
    unit: 'currency',
    color: '#94a3b8',
    getValue: (d) => d.revistas,
  },
  // Agregados
  {
    key: 'totalInv',
    label: 'Total Inversión Publicitaria',
    shortLabel: 'Inversión Total',
    category: 'agregados',
    unit: 'currency',
    color: '#38bdf8',
    getValue: (d) => d.totalInv,
  },
  {
    key: 'traditionalTotal',
    label: 'Inversión Medios Tradicionales',
    shortLabel: 'Tradicionales',
    category: 'agregados',
    unit: 'currency',
    color: '#f59e0b',
    getValue: (d) => calculateTraditionalTotal(d),
  },
  {
    key: 'digitalShare',
    label: 'Participación Digital (% Share)',
    shortLabel: 'Share Digital (%)',
    category: 'agregados',
    unit: 'percent',
    color: '#0ea5e9',
    getValue: (d) => (d.totalInv > 0 ? (d.digital / d.totalInv) * 100 : 0),
  },
  // Macroeconómicos
  {
    key: 'trm',
    label: 'TRM Promedio (COP / USD)',
    shortLabel: 'TRM Promedio',
    category: 'macro',
    unit: 'number',
    color: '#14b8a6',
    getValue: (d) => d.trm,
  },
  {
    key: 'ipc',
    label: 'Inflación Anual IPC (%)',
    shortLabel: 'Inflación IPC',
    category: 'macro',
    unit: 'percent',
    color: '#f43f5e',
    getValue: (d) => d.ipc,
  },
  {
    key: 'internetPenetration',
    label: 'Penetración de Internet (%)',
    shortLabel: 'Penetración Internet',
    category: 'macro',
    unit: 'percent',
    color: '#10b981',
    getValue: (d) => d.internetPenetration,
  },
  {
    key: 'perCapita',
    label: 'Inversión Per Cápita (COP / Hab)',
    shortLabel: 'Gasto Per Cápita',
    category: 'macro',
    unit: 'currency',
    color: '#eab308',
    getValue: (d) => (d.population ? (d.totalInv * 1000000) / d.population : null),
  },
];

export function computeDescriptiveStats(
  data: YearRecord[],
  startYear: number,
  endYear: number
): DescriptiveStats[] {
  const filteredRecords = data.filter((d) => d.year >= startYear && d.year <= endYear);

  return VARIABLE_CONFIGS.map((config) => {
    // Collect all valid data points for this variable
    const rawPoints = filteredRecords
      .map((d) => ({
        year: d.year,
        value: config.getValue(d),
        isProjection: d.isProjection,
      }))
      .filter((p): p is { year: number; value: number; isProjection: boolean } => p.value !== null);

    // If no data points in this period
    if (rawPoints.length === 0) {
      return {
        key: config.key,
        label: config.label,
        shortLabel: config.shortLabel,
        category: config.category,
        unit: config.unit,
        color: config.color,
        count: 0,
        min: 0,
        minYear: startYear,
        max: 0,
        maxYear: endYear,
        mean: 0,
        median: 0,
        stdDev: 0,
        cv: 0,
        sum: 0,
        firstVal: 0,
        firstYear: startYear,
        lastVal: 0,
        lastYear: endYear,
        totalGrowthPct: 0,
        cagr: 0,
        timeSeries: [],
      };
    }

    const values = rawPoints.map((p) => p.value);
    const count = values.length;

    // Min & Max with corresponding years
    let min = values[0];
    let minYear = rawPoints[0].year;
    let max = values[0];
    let maxYear = rawPoints[0].year;
    let sum = 0;

    rawPoints.forEach((p) => {
      sum += p.value;
      if (p.value < min) {
        min = p.value;
        minYear = p.year;
      }
      if (p.value > max) {
        max = p.value;
        maxYear = p.year;
      }
    });

    const mean = sum / count;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Standard Deviation & Coefficient of Variation
    const variance =
      count > 1
        ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count - 1)
        : 0;
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

    // Growth and CAGR over the selected period
    const firstPoint = rawPoints[0];
    const lastPoint = rawPoints[rawPoints.length - 1];
    const yearsDiff = lastPoint.year - firstPoint.year;

    const totalGrowthPct =
      firstPoint.value > 0 ? ((lastPoint.value - firstPoint.value) / firstPoint.value) * 100 : 0;
    const cagr =
      yearsDiff > 0 && firstPoint.value > 0 && lastPoint.value > 0
        ? calculateCAGR(firstPoint.value, lastPoint.value, yearsDiff)
        : 0;

    return {
      key: config.key,
      label: config.label,
      shortLabel: config.shortLabel,
      category: config.category,
      unit: config.unit,
      color: config.color,
      count,
      min: Number(min.toFixed(2)),
      minYear,
      max: Number(max.toFixed(2)),
      maxYear,
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      cv: Number(cv.toFixed(2)),
      sum: Number(sum.toFixed(1)),
      firstVal: Number(firstPoint.value.toFixed(2)),
      firstYear: firstPoint.year,
      lastVal: Number(lastPoint.value.toFixed(2)),
      lastYear: lastPoint.year,
      totalGrowthPct: Number(totalGrowthPct.toFixed(1)),
      cagr: Number(cagr.toFixed(2)),
      timeSeries: rawPoints,
    };
  });
}

export function downloadCSV(data: YearRecord[], filename = 'inversion_publicitaria_colombia_simulacion.csv') {
  const headers = [
    'AÑO',
    'TV REG Y LOCAL',
    'REVISTAS',
    'PUB EXTERIOR',
    'PRENSA',
    'RADIO',
    'TV NACIONAL',
    'DIGITAL',
    'TOTAL_INV',
    'TIPO_DATO',
    'IPC (%)',
    'TRM Promedio',
    'Penetración Internet (%)',
    'Poblacion DANE',
  ];

  const rows = data.map(d => [
    d.year,
    d.tvRegLocal.toFixed(1).replace('.', ','),
    d.revistas.toFixed(1).replace('.', ','),
    d.pubExterior.toFixed(1).replace('.', ','),
    d.prensa.toFixed(1).replace('.', ','),
    d.radio.toFixed(1).replace('.', ','),
    d.tvNacional.toFixed(1).replace('.', ','),
    d.digital.toFixed(1).replace('.', ','),
    d.totalInv.toFixed(1).replace('.', ','),
    d.isProjection ? 'PROYECCIÓN_SIMULADA' : 'HISTÓRICO_REAL',
    d.ipc !== null ? `${d.ipc.toString().replace('.', ',')}%` : '',
    d.trm !== null ? d.trm.toFixed(2).replace('.', ',') : '',
    d.internetPenetration !== null ? `${d.internetPenetration.toString().replace('.', ',')}%` : '',
    d.population !== null ? d.population.toLocaleString('es-CO') : '',
  ]);

  const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

