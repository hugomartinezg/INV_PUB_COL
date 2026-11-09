export type MediaChannelKey = 
  | 'tvRegLocal'
  | 'revistas'
  | 'pubExterior'
  | 'prensa'
  | 'radio'
  | 'tvNacional'
  | 'digital';

export interface ChannelMeta {
  key: MediaChannelKey;
  label: string;
  shortLabel: string;
  category: 'digital' | 'tradicional';
  color: string;
  hoverColor: string;
  description: string;
}

export interface YearRecord {
  year: number;
  tvRegLocal: number;
  revistas: number;
  pubExterior: number;
  prensa: number;
  radio: number;
  tvNacional: number;
  digital: number;
  totalInv: number;
  ipc: number | null; // %
  trm: number | null; // COP/USD
  internetPenetration: number | null; // %
  population: number | null; // inhabitants
  isProjection: boolean;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  badge?: string;
  channelMultipliers?: Partial<Record<MediaChannelKey, number>>; // e.g. 1.15 for +15%
  macroAdjustments?: {
    trmMultiplier?: number;
    ipcAvg?: number;
  };
}

export type CurrencyUnit = 'COP_M' | 'COP_B' | 'USD_M';

export interface DashboardMetrics {
  total2025: number;
  total2030: number;
  baselineTotal2030: number;
  totalDifference2030: number;
  percentDifference2030: number;
  cagr2025_2030: number;
  baselineCagr2025_2030: number;
  digitalShare2025: number;
  digitalShare2030: number;
  traditionalShare2030: number;
  exteriorGrowth2025_2030: number;
  topGrowingChannel: {
    key: MediaChannelKey;
    label: string;
    growthPercent: number;
  };
}

export type PeriodPresetId =
  | 'all'
  | 'historical'
  | 'post_covid'
  | 'last_10_years'
  | 'digital_era'
  | 'projections'
  | 'custom';

export interface PeriodFilterConfig {
  id: PeriodPresetId;
  label: string;
  badge?: string;
  description: string;
  startYear: number;
  endYear: number;
}

export interface DescriptiveStats {
  key: string;
  label: string;
  shortLabel: string;
  category: 'medios' | 'agregados' | 'macro';
  unit: 'currency' | 'percent' | 'number';
  color: string;
  count: number;
  min: number;
  minYear: number;
  max: number;
  maxYear: number;
  mean: number;
  median: number;
  stdDev: number;
  cv: number; // Coeficiente de variación (%)
  sum: number;
  firstVal: number;
  firstYear: number;
  lastVal: number;
  lastYear: number;
  totalGrowthPct: number;
  cagr: number;
  timeSeries: { year: number; value: number; isProjection: boolean }[];
}

