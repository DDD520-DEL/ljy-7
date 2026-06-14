export interface MaltItem {
  id: string;
  name: string;
  weight: number;
  color: string;
  percentage: number;
  pricePerKg?: number;
}

export interface HopAddition {
  id: string;
  name: string;
  weight: number;
  alphaAcid: number;
  time: number;
  stage: 'boil' | 'whirlpool' | 'dryhop';
  pricePerKg?: number;
}

export interface Yeast {
  id: string;
  strain: string;
  brand: string;
  attenuation: number;
  temperature: [number, number];
  price?: number;
}

export interface MashStep {
  id: string;
  temperature: number;
  duration: number;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  style: string;
  description: string;
  batchSize: number;
  originalGravity: number;
  finalGravity: number;
  abv: number;
  ibu: number;
  srm: number;
  malts: MaltItem[];
  hops: HopAddition[];
  yeast: Yeast;
  mashSteps: MashStep[];
  version: string;
  parentVersion?: string;
  parentId?: string;
  branchName?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  forkCount?: number;
  rating?: number;
  commentCount?: number;
}

export interface FermentationReading {
  id: string;
  date: string;
  specificGravity: number;
  temperature: number;
  ph: number;
  notes: string;
}

export interface ParameterDeviation {
  parameter: string;
  expected: number;
  actual: number;
  unit: string;
}

export interface CostSnapshot {
  maltCost: number;
  hopCost: number;
  yeastCost: number;
  totalCost: number;
  malts: Array<{ name: string; weight: number; pricePerKg: number; cost: number }>;
  hops: Array<{ name: string; weight: number; pricePerKg: number; cost: number }>;
  yeast: { strain: string; brand: string; price: number };
}

export interface Batch {
  id: string;
  recipeId: string;
  recipeVersion: string;
  recipeName?: string;
  name: string;
  brewDate: string;
  status: 'planning' | 'brewing' | 'fermenting' | 'conditioning' | 'completed';
  originalGravityActual?: number;
  finalGravityActual?: number;
  volumeActual?: number;
  deviations: ParameterDeviation[];
  readings: FermentationReading[];
  notes: string;
  photos: BrewPhoto[];
  createdAt: string;
  createdBy: string;
  costSnapshot?: CostSnapshot;
  actualCost?: number;
}

export interface Tasting {
  id: string;
  batchId: string;
  recipeId: string;
  name: string;
  date: string;
  appearance: {
    score: number;
    clarity: string;
    color: string;
    headRetention: string;
  };
  aroma: {
    score: number;
    intensity: string;
    notes: string[];
  };
  flavor: {
    score: number;
    sweetness: number;
    bitterness: number;
    acidity: number;
    notes: string[];
  };
  mouthfeel: {
    score: number;
    body: string;
    carbonation: string;
    warmth: string;
  };
  overall: {
    score: number;
    impressions: string;
  };
  totalScore: number;
  notes: string;
  recipeName?: string;
  batchName?: string;
}

export interface RecipeComparison {
  field: string;
  versionA: string | number | unknown[];
  versionB: string | number | unknown[];
  isDifferent: boolean;
}

export interface TastingComparison {
  id: string;
  name: string;
  batchName?: string;
  recipeName?: string;
  totalScore: number;
  appearance: number;
  aroma: number;
  flavor: number;
  mouthfeel: number;
  overall: number;
}

export type BatchStatus = Batch['status'];

export type BrewStage = 'mashing' | 'boiling' | 'fermentation' | 'bottling';

export const BREW_STAGE_LABELS: Record<BrewStage, string> = {
  mashing: '糖化',
  boiling: '煮沸',
  fermentation: '发酵',
  bottling: '装瓶',
};

export interface BrewPhoto {
  id: string;
  url: string;
  stage: BrewStage;
  caption: string;
  createdAt: string;
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  planning: '计划中',
  brewing: '酿造中',
  fermenting: '发酵中',
  conditioning: '熟成中',
  completed: '已完成'
};

export const HOP_STAGE_LABELS: Record<HopAddition['stage'], string> = {
  boil: '煮沸',
  whirlpool: '旋沉',
  dryhop: '干投'
};

export const BEER_STYLES = [
  'IPA',
  'Double IPA',
  'Pale Ale',
  'Stout',
  'Imperial Stout',
  'Porter',
  'Lager',
  'Pilsner',
  'Wheat Beer',
  'Hefeweizen',
  'Saison',
  'Belgian Tripel',
  'Sour',
  'Gose',
  'Barleywine',
  'Brown Ale',
  'Amber Ale',
  'Blonde Ale',
  'Kölsch',
  'Bock'
];

export interface StyleDistribution {
  style: string;
  count: number;
  percentage: number;
}

export interface ScoreTrendItem {
  date: string;
  score: number;
  recipeName?: string;
}

export interface UserBrewStats {
  totalBatches: number;
  totalVolume: number;
  completedBatches: number;
  averageVolume: number;
  styleDistribution: StyleDistribution[];
  scoreTrend: ScoreTrendItem[];
  averageScore: number;
  tastingCount: number;
  topStyle: string;
}

export interface RecipeComment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  hasBrewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type IngredientType = 'malt' | 'hop' | 'yeast';

export const INGREDIENT_TYPE_LABELS: Record<IngredientType, string> = {
  malt: '麦芽',
  hop: '酒花',
  yeast: '酵母',
};

export const INGREDIENT_UNIT_LABELS: Record<IngredientType, string> = {
  malt: 'kg',
  hop: 'g',
  yeast: '份',
};

export interface InventoryItem {
  id: string;
  type: IngredientType;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  updatedAt: string;
  note?: string;
}

export interface IngredientShortage {
  type: IngredientType;
  name: string;
  required: number;
  available: number;
  missing: number;
  unit: string;
}

export interface InventoryCheckResult {
  sufficient: boolean;
  shortages: IngredientShortage[];
  warnings: Array<{
    type: IngredientType;
    name: string;
    current: number;
    minStock: number;
    unit: string;
  }>;
}
