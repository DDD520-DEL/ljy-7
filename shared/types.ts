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

export interface BottlingRecord {
  id: string;
  totalBottles: number;
  bottleSpec: string;
  capColor: string;
  storageLocation: string;
  traceCode: string;
  bottledAt: string;
  notes?: string;
}

export interface Batch {
  id: string;
  recipeId: string;
  recipeVersion: string;
  recipeName?: string;
  name: string;
  brewDate: string;
  status: 'planning' | 'brewing' | 'fermenting' | 'conditioning' | 'completed' | 'bottled';
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
  equipmentIds: string[];
  brewSteps: BrewStep[];
  traceCode?: string;
  bottlingRecord?: BottlingRecord;
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
  traceCode?: string;
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
  completed: '已完成',
  bottled: '已装瓶'
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

export type EquipmentType = 'mash_tun' | 'boil_kettle' | 'fermenter' | 'cooler' | 'pump' | 'other';

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  mash_tun: '糖化锅',
  boil_kettle: '煮沸锅',
  fermenter: '发酵罐',
  cooler: '冷却器',
  pump: '泵',
  other: '其他',
};

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  capacityLiters: number;
  material: string;
  purchaseDate: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export type BrewStepType =
  | 'milling'
  | 'mashing'
  | 'lautering'
  | 'boiling'
  | 'hop_addition'
  | 'cooling'
  | 'oxygenation'
  | 'pitching';

export const BREW_STEP_TYPE_LABELS: Record<BrewStepType, string> = {
  milling: '磨麦',
  mashing: '糖化',
  lautering: '洗糟',
  boiling: '煮沸',
  hop_addition: '投酒花',
  cooling: '冷却',
  oxygenation: '充氧',
  pitching: '接种酵母',
};

export type BrewStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export const BREW_STEP_STATUS_LABELS: Record<BrewStepStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  skipped: '已跳过',
};

export interface BrewStep {
  id: string;
  type: BrewStepType;
  name: string;
  description: string;
  order: number;
  plannedDurationMinutes: number;
  actualDurationMinutes?: number;
  status: BrewStepStatus;
  startedAt?: string;
  completedAt?: string;
  hopDetail?: {
    hopName: string;
    hopWeight: number;
    alphaAcid: number;
    boilTimeMinutes: number;
  };
  mashDetail?: {
    temperature: number;
  };
  notes?: string;
}

export interface BrewPlan {
  id: string;
  date: string;
  title: string;
  description: string;
  reminderDaysBefore: number;
  reminderText: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface WaterProfile {
  id: string;
  name: string;
  calcium: number;
  magnesium: number;
  sodium: number;
  sulfate: number;
  chloride: number;
  bicarbonate: number;
  ph?: number;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface WaterTargetRange {
  min: number;
  max: number;
  ideal?: number;
}

export interface BeerStyleWaterTarget {
  style: string;
  calcium: WaterTargetRange;
  magnesium: WaterTargetRange;
  sodium: WaterTargetRange;
  sulfate: WaterTargetRange;
  chloride: WaterTargetRange;
  bicarbonate: WaterTargetRange;
  ph: WaterTargetRange;
  description: string;
  tips: string[];
}

export interface MineralCompound {
  name: string;
  formula: string;
  calciumPerGram: number;
  magnesiumPerGram: number;
  sodiumPerGram: number;
  sulfatePerGram: number;
  chloridePerGram: number;
  bicarbonatePerGram: number;
  solubility: number;
  unit: string;
}

export interface MineralAddition {
  mineral: MineralCompound;
  amount: number;
  unit: string;
  contributions: {
    calcium: number;
    magnesium: number;
    sodium: number;
    sulfate: number;
    chloride: number;
    bicarbonate: number;
  };
}

export interface WaterAnalysisResult {
  sourceWater: Omit<WaterProfile, 'id' | 'name' | 'createdAt' | 'createdBy' | 'note'>;
  targetStyle: BeerStyleWaterTarget;
  batchSize: number;
  currentValues: {
    calcium: number;
    magnesium: number;
    sodium: number;
    sulfate: number;
    chloride: number;
    bicarbonate: number;
  };
  targetValues: {
    calcium: number;
    magnesium: number;
    sodium: number;
    sulfate: number;
    chloride: number;
    bicarbonate: number;
  };
  deficits: {
    calcium: number;
    magnesium: number;
    sodium: number;
    sulfate: number;
    chloride: number;
    bicarbonate: number;
  };
  additions: MineralAddition[];
  finalEstimate: {
    calcium: number;
    magnesium: number;
    sodium: number;
    sulfate: number;
    chloride: number;
    bicarbonate: number;
  };
  warnings: string[];
  suggestions: string[];
}

export const MINERAL_COMPOUNDS: MineralCompound[] = [
  {
    name: '石膏（硫酸钙）',
    formula: 'CaSO₄·2H₂O',
    calciumPerGram: 232,
    magnesiumPerGram: 0,
    sodiumPerGram: 0,
    sulfatePerGram: 556,
    chloridePerGram: 0,
    bicarbonatePerGram: 0,
    solubility: 2.4,
    unit: 'g'
  },
  {
    name: '氯化钙',
    formula: 'CaCl₂·2H₂O',
    calciumPerGram: 272,
    magnesiumPerGram: 0,
    sodiumPerGram: 0,
    sulfatePerGram: 0,
    chloridePerGram: 482,
    bicarbonatePerGram: 0,
    solubility: 100,
    unit: 'g'
  },
  {
    name: '硫酸镁（泻盐）',
    formula: 'MgSO₄·7H₂O',
    calciumPerGram: 0,
    magnesiumPerGram: 99,
    sodiumPerGram: 0,
    sulfatePerGram: 397,
    chloridePerGram: 0,
    bicarbonatePerGram: 0,
    solubility: 71,
    unit: 'g'
  },
  {
    name: '氯化钠（食盐）',
    formula: 'NaCl',
    calciumPerGram: 0,
    magnesiumPerGram: 0,
    sodiumPerGram: 393,
    sulfatePerGram: 0,
    chloridePerGram: 607,
    bicarbonatePerGram: 0,
    solubility: 360,
    unit: 'g'
  },
  {
    name: '碳酸氢钠（小苏打）',
    formula: 'NaHCO₃',
    calciumPerGram: 0,
    magnesiumPerGram: 0,
    sodiumPerGram: 274,
    sulfatePerGram: 0,
    chloridePerGram: 0,
    bicarbonatePerGram: 726,
    solubility: 96,
    unit: 'g'
  },
  {
    name: '碳酸钙（白垩）',
    formula: 'CaCO₃',
    calciumPerGram: 400,
    magnesiumPerGram: 0,
    sodiumPerGram: 0,
    sulfatePerGram: 0,
    chloridePerGram: 0,
    bicarbonatePerGram: 0,
    solubility: 0.013,
    unit: 'g'
  },
  {
    name: '乳酸钙',
    formula: 'Ca(C₃H₅O₃)₂',
    calciumPerGram: 130,
    magnesiumPerGram: 0,
    sodiumPerGram: 0,
    sulfatePerGram: 0,
    chloridePerGram: 0,
    bicarbonatePerGram: 0,
    solubility: 50,
    unit: 'g'
  }
];

export const BEER_STYLE_WATER_TARGETS: BeerStyleWaterTarget[] = [
  {
    style: 'IPA',
    calcium: { min: 50, max: 150, ideal: 100 },
    magnesium: { min: 5, max: 30, ideal: 15 },
    sodium: { min: 0, max: 50, ideal: 10 },
    sulfate: { min: 150, max: 350, ideal: 250 },
    chloride: { min: 50, max: 150, ideal: 100 },
    bicarbonate: { min: 0, max: 50, ideal: 0 },
    ph: { min: 5.2, max: 5.6, ideal: 5.4 },
    description: '高硫酸盐高氯化物比例，突出啤酒花的苦味和香气',
    tips: ['硫酸盐与氯化物比例建议2:1到3:1', '高钙有助于酒花苦味表达', '低碳酸氢盐避免苦味粗糙']
  },
  {
    style: 'Double IPA',
    calcium: { min: 80, max: 180, ideal: 120 },
    magnesium: { min: 10, max: 40, ideal: 20 },
    sodium: { min: 0, max: 50, ideal: 10 },
    sulfate: { min: 200, max: 450, ideal: 300 },
    chloride: { min: 50, max: 150, ideal: 80 },
    bicarbonate: { min: 0, max: 30, ideal: 0 },
    ph: { min: 5.2, max: 5.5, ideal: 5.3 },
    description: '更高的矿物质含量，支撑强烈的酒花风味和高酒精度',
    tips: ['硫酸盐可以更高以平衡高酒精度', '控制氯化物避免甜味过重', '确保足够的钙离子']
  },
  {
    style: 'Pale Ale',
    calcium: { min: 50, max: 120, ideal: 80 },
    magnesium: { min: 5, max: 25, ideal: 15 },
    sodium: { min: 0, max: 50, ideal: 15 },
    sulfate: { min: 100, max: 250, ideal: 150 },
    chloride: { min: 50, max: 150, ideal: 100 },
    bicarbonate: { min: 0, max: 50, ideal: 20 },
    ph: { min: 5.3, max: 5.6, ideal: 5.4 },
    description: '平衡的矿物质含量，麦芽和酒花协调',
    tips: ['硫酸盐与氯化物比例1:1到2:1', '适中的碳酸氢盐圆润口感', '镁离子增强麦芽风味']
  },
  {
    style: 'Stout',
    calcium: { min: 50, max: 150, ideal: 80 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 20, max: 100, ideal: 50 },
    sulfate: { min: 50, max: 150, ideal: 80 },
    chloride: { min: 100, max: 250, ideal: 150 },
    bicarbonate: { min: 50, max: 150, ideal: 100 },
    ph: { min: 5.3, max: 5.7, ideal: 5.5 },
    description: '高氯化物高碳酸氢盐，突出烘烤麦芽的圆润甜感',
    tips: ['氯化物增强圆润感和甜味', '碳酸氢盐中和深色麦芽的酸度', '适量钠提升风味复杂度']
  },
  {
    style: 'Imperial Stout',
    calcium: { min: 80, max: 180, ideal: 120 },
    magnesium: { min: 15, max: 40, ideal: 25 },
    sodium: { min: 30, max: 120, ideal: 60 },
    sulfate: { min: 80, max: 200, ideal: 120 },
    chloride: { min: 150, max: 300, ideal: 200 },
    bicarbonate: { min: 100, max: 250, ideal: 150 },
    ph: { min: 5.3, max: 5.7, ideal: 5.5 },
    description: '高矿物质含量支撑厚重酒体和复杂风味',
    tips: ['更高的碳酸氢盐中和大量深色麦芽', '高氯化物增强粘稠感', '适量硫酸盐平衡甜味']
  },
  {
    style: 'Porter',
    calcium: { min: 50, max: 120, ideal: 70 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 20, max: 80, ideal: 40 },
    sulfate: { min: 50, max: 150, ideal: 80 },
    chloride: { min: 80, max: 200, ideal: 120 },
    bicarbonate: { min: 50, max: 120, ideal: 80 },
    ph: { min: 5.3, max: 5.7, ideal: 5.5 },
    description: '平衡的矿物质，麦芽甜感与烘烤风味协调',
    tips: ['氯化物增强麦芽甜感', '适量碳酸氢盐', '钠提升风味层次']
  },
  {
    style: 'Lager',
    calcium: { min: 30, max: 80, ideal: 50 },
    magnesium: { min: 5, max: 20, ideal: 10 },
    sodium: { min: 0, max: 30, ideal: 10 },
    sulfate: { min: 10, max: 80, ideal: 30 },
    chloride: { min: 10, max: 60, ideal: 30 },
    bicarbonate: { min: 20, max: 80, ideal: 50 },
    ph: { min: 5.2, max: 5.5, ideal: 5.3 },
    description: '低矿物质，干净清爽的口感',
    tips: ['矿物质含量要低，保持纯净', '碳酸氢盐不要太高', '避免钠含量过高']
  },
  {
    style: 'Pilsner',
    calcium: { min: 10, max: 50, ideal: 30 },
    magnesium: { min: 5, max: 15, ideal: 8 },
    sodium: { min: 0, max: 20, ideal: 5 },
    sulfate: { min: 5, max: 50, ideal: 15 },
    chloride: { min: 5, max: 40, ideal: 15 },
    bicarbonate: { min: 10, max: 60, ideal: 30 },
    ph: { min: 5.2, max: 5.4, ideal: 5.3 },
    description: '极软水质，突出皮尔森麦芽和萨兹酒花的精致风味',
    tips: ['非常软的水是关键', '避免任何离子过高', '低矿物质让风味更纯净']
  },
  {
    style: 'Wheat Beer',
    calcium: { min: 30, max: 80, ideal: 50 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 10, max: 50, ideal: 25 },
    sulfate: { min: 20, max: 80, ideal: 40 },
    chloride: { min: 30, max: 100, ideal: 60 },
    bicarbonate: { min: 50, max: 150, ideal: 100 },
    ph: { min: 5.3, max: 5.7, ideal: 5.5 },
    description: '适中的矿物质，突出酵母产生的香蕉和丁香风味',
    tips: ['碳酸氢盐中和小麦的酸度', '氯化物增强圆润口感', '避免硫酸盐过高']
  },
  {
    style: 'Hefeweizen',
    calcium: { min: 20, max: 60, ideal: 40 },
    magnesium: { min: 10, max: 25, ideal: 15 },
    sodium: { min: 10, max: 40, ideal: 20 },
    sulfate: { min: 10, max: 60, ideal: 30 },
    chloride: { min: 20, max: 80, ideal: 50 },
    bicarbonate: { min: 80, max: 180, ideal: 120 },
    ph: { min: 5.4, max: 5.8, ideal: 5.6 },
    description: '较高碳酸氢盐，典型的德式小麦酵母风味',
    tips: ['高碳酸氢盐是关键特征', '让酵母风味成为主角', '低硫酸盐避免干扰']
  },
  {
    style: 'Saison',
    calcium: { min: 50, max: 120, ideal: 80 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 10, max: 60, ideal: 30 },
    sulfate: { min: 80, max: 200, ideal: 120 },
    chloride: { min: 50, max: 150, ideal: 80 },
    bicarbonate: { min: 0, max: 50, ideal: 20 },
    ph: { min: 5.2, max: 5.5, ideal: 5.3 },
    description: '平衡偏干的水质，突出赛松酵母的辛辣和果香',
    tips: ['低碳酸氢盐让酒更干', '硫酸盐增加干爽感', '适量镁增强复杂感']
  },
  {
    style: 'Belgian Tripel',
    calcium: { min: 40, max: 100, ideal: 60 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 10, max: 50, ideal: 25 },
    sulfate: { min: 50, max: 150, ideal: 80 },
    chloride: { min: 30, max: 100, ideal: 60 },
    bicarbonate: { min: 30, max: 100, ideal: 60 },
    ph: { min: 5.3, max: 5.6, ideal: 5.4 },
    description: '中等矿物质，支撑高酒精度同时保持优雅',
    tips: ['平衡的阴阳离子', '不突出某种特定风味', '让酵母和麦芽表现']
  },
  {
    style: 'Sour',
    calcium: { min: 30, max: 80, ideal: 50 },
    magnesium: { min: 5, max: 20, ideal: 10 },
    sodium: { min: 0, max: 30, ideal: 10 },
    sulfate: { min: 30, max: 100, ideal: 50 },
    chloride: { min: 20, max: 80, ideal: 40 },
    bicarbonate: { min: 0, max: 30, ideal: 0 },
    ph: { min: 4.5, max: 5.2, ideal: 4.8 },
    description: '低缓冲能力，利于细菌产酸',
    tips: ['极低碳酸氢盐是关键', '让酸度自然发展', '矿物质不要太高']
  },
  {
    style: 'Gose',
    calcium: { min: 20, max: 60, ideal: 40 },
    magnesium: { min: 5, max: 20, ideal: 10 },
    sodium: { min: 100, max: 300, ideal: 200 },
    sulfate: { min: 50, max: 150, ideal: 80 },
    chloride: { min: 150, max: 350, ideal: 250 },
    bicarbonate: { min: 0, max: 30, ideal: 10 },
    ph: { min: 4.5, max: 5.0, ideal: 4.7 },
    description: '高盐高氯，典型的咸酸特征',
    tips: ['高钠和高氯是Gose的标志', '添加食盐达到目标', '低碳酸氢盐利于酸化']
  },
  {
    style: 'Barleywine',
    calcium: { min: 80, max: 150, ideal: 110 },
    magnesium: { min: 15, max: 40, ideal: 25 },
    sodium: { min: 10, max: 60, ideal: 30 },
    sulfate: { min: 100, max: 250, ideal: 150 },
    chloride: { min: 80, max: 200, ideal: 120 },
    bicarbonate: { min: 50, max: 120, ideal: 80 },
    ph: { min: 5.3, max: 5.7, ideal: 5.5 },
    description: '高矿物质支撑高比重和高酒精度',
    tips: ['足够的钙保证酶活性', '平衡的阴阳离子', '碳酸氢盐提供缓冲']
  },
  {
    style: 'Brown Ale',
    calcium: { min: 50, max: 120, ideal: 80 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 20, max: 80, ideal: 40 },
    sulfate: { min: 50, max: 150, ideal: 80 },
    chloride: { min: 80, max: 200, ideal: 120 },
    bicarbonate: { min: 50, max: 120, ideal: 80 },
    ph: { min: 5.3, max: 5.7, ideal: 5.5 },
    description: '平衡偏甜的水质，突出坚果和焦糖麦芽风味',
    tips: ['氯化物增强甜感', '适量碳酸氢盐', '平衡的矿物质']
  },
  {
    style: 'Amber Ale',
    calcium: { min: 50, max: 120, ideal: 80 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 10, max: 60, ideal: 25 },
    sulfate: { min: 80, max: 180, ideal: 120 },
    chloride: { min: 60, max: 150, ideal: 100 },
    bicarbonate: { min: 30, max: 80, ideal: 50 },
    ph: { min: 5.3, max: 5.6, ideal: 5.4 },
    description: '平衡的矿物质，麦芽与酒花均衡',
    tips: ['硫酸盐与氯化物比例约1:1', '适中的碳酸氢盐', '全面的矿物质']
  },
  {
    style: 'Blonde Ale',
    calcium: { min: 30, max: 80, ideal: 50 },
    magnesium: { min: 5, max: 20, ideal: 10 },
    sodium: { min: 10, max: 50, ideal: 25 },
    sulfate: { min: 30, max: 100, ideal: 50 },
    chloride: { min: 30, max: 100, ideal: 60 },
    bicarbonate: { min: 30, max: 80, ideal: 50 },
    ph: { min: 5.3, max: 5.6, ideal: 5.4 },
    description: '中等矿物质，清爽易饮',
    tips: ['平衡易饮为目标', '不要让任何离子突出', '清爽干净']
  },
  {
    style: 'Kölsch',
    calcium: { min: 20, max: 60, ideal: 40 },
    magnesium: { min: 5, max: 20, ideal: 10 },
    sodium: { min: 5, max: 30, ideal: 15 },
    sulfate: { min: 20, max: 80, ideal: 40 },
    chloride: { min: 20, max: 80, ideal: 40 },
    bicarbonate: { min: 20, max: 60, ideal: 40 },
    ph: { min: 5.2, max: 5.5, ideal: 5.3 },
    description: '低到中等矿物质，科隆风格的优雅',
    tips: ['柔和的水质', '平衡的离子', '干净清爽']
  },
  {
    style: 'Bock',
    calcium: { min: 50, max: 120, ideal: 80 },
    magnesium: { min: 10, max: 30, ideal: 15 },
    sodium: { min: 10, max: 50, ideal: 25 },
    sulfate: { min: 30, max: 100, ideal: 60 },
    chloride: { min: 60, max: 150, ideal: 100 },
    bicarbonate: { min: 50, max: 120, ideal: 80 },
    ph: { min: 5.3, max: 5.7, ideal: 5.5 },
    description: '偏甜的水质，突出麦芽的醇厚和甜感',
    tips: ['高氯化物增强麦芽甜感', '适量碳酸氢盐', '矿物质支撑高比重']
  }
];
