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

export interface ProcurementRecord {
  id: string;
  supplierName: string;
  ingredientType: IngredientType;
  ingredientName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
  inventoryItemId?: string;
  createdAt: string;
  note?: string;
}

export interface ProcurementPriceTrend {
  date: string;
  unitPrice: number;
  supplierName: string;
  ingredientName: string;
}

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

export interface BJCPStyleRange {
  min: number;
  max: number;
}

export interface BJCPStyleGuide {
  style: string;
  category: string;
  srm: BJCPStyleRange;
  ibu: BJCPStyleRange;
  abv: BJCPStyleRange;
  og: BJCPStyleRange;
  fg: BJCPStyleRange;
  description: string;
  aroma: string;
  appearance: string;
  flavor: string;
  mouthfeel: string;
  comments: string;
}

export type BJCPDeviationLevel = 'compliant' | 'warning' | 'error';

export interface BJCPParameterCheck {
  parameter: 'srm' | 'ibu' | 'abv' | 'og' | 'fg';
  parameterName: string;
  actual: number;
  min: number;
  max: number;
  isWithinRange: boolean;
  deviationLevel: BJCPDeviationLevel;
  deviationPercent: number;
  suggestion: string;
}

export interface BJCPStyleCheckResult {
  style: string;
  styleFound: boolean;
  styleGuide?: BJCPStyleGuide;
  checks: BJCPParameterCheck[];
  overallScore: number;
  compliantCount: number;
  warningCount: number;
  errorCount: number;
  summary: string;
}

export const BJCP_STYLE_GUIDES: BJCPStyleGuide[] = [
  {
    style: 'IPA',
    category: '14. India Pale Ale',
    srm: { min: 6, max: 14 },
    ibu: { min: 40, max: 70 },
    abv: { min: 5.5, max: 7.5 },
    og: { min: 1.056, max: 1.070 },
    fg: { min: 1.008, max: 1.014 },
    description: '中等酒体，强调啤酒花香气和苦味，麦芽甜感作为支撑',
    aroma: '中等至强烈的啤酒花香气，带有柑橘、花香、松脂或热带水果特征',
    appearance: '金色到琥珀色，清澈，泡沫丰富持久',
    flavor: '中等至强烈的啤酒花苦味，收尾干爽，麦芽甜味平衡',
    mouthfeel: '中等酒体，中等至较高的碳酸化',
    comments: '酒花品种和干投是风味关键，注意平衡苦味和甜味'
  },
  {
    style: 'Double IPA',
    category: '14. India Pale Ale',
    srm: { min: 7, max: 17 },
    ibu: { min: 60, max: 100 },
    abv: { min: 7.5, max: 10.0 },
    og: { min: 1.075, max: 1.095 },
    fg: { min: 1.010, max: 1.020 },
    description: '加强版IPA，更高的酒精度、苦味和酒花香气',
    aroma: '强烈的啤酒花香气，多种复杂的酒花特征',
    appearance: '金色到深琥珀色，清澈或微浊',
    flavor: '强烈的啤酒花苦味和风味，高酒精度但不粗糙',
    mouthfeel: '中等至饱满酒体，高度碳酸化',
    comments: '需要足够的麦芽来支撑高酒精度，注意酵母选择和发酵温度'
  },
  {
    style: 'Pale Ale',
    category: '13. American Pale Ale',
    srm: { min: 5, max: 10 },
    ibu: { min: 30, max: 50 },
    abv: { min: 4.5, max: 6.2 },
    og: { min: 1.045, max: 1.060 },
    fg: { min: 1.010, max: 1.015 },
    description: '清爽、易饮的美式啤酒，突出啤酒花和麦芽的平衡',
    aroma: '中等强度的啤酒花香气，柑橘或花香特征',
    appearance: '金黄色到琥珀色，清澈',
    flavor: '中等啤酒花苦味，麦芽甜感支撑，收尾干爽',
    mouthfeel: '中等偏轻酒体，中等碳酸化',
    comments: '易饮型精酿啤酒的经典，适合日常饮用'
  },
  {
    style: 'Stout',
    category: '16. Stout',
    srm: { min: 30, max: 80 },
    ibu: { min: 25, max: 50 },
    abv: { min: 5.0, max: 7.5 },
    og: { min: 1.045, max: 1.065 },
    fg: { min: 1.010, max: 1.018 },
    description: '深色啤酒，带有烘烤、咖啡、巧克力特征',
    aroma: '中等烘烤香气，可能有咖啡、巧克力、焦糖',
    appearance: '深棕色到黑色，不透明，棕褐色泡沫',
    flavor: '烘烤麦芽风味，中等苦味，可能有咖啡、巧克力味',
    mouthfeel: '中等至饱满酒体，中等碳酸化',
    comments: '烘烤麦芽是关键，注意控制IBU不要过高'
  },
  {
    style: 'Imperial Stout',
    category: '16. Stout',
    srm: { min: 40, max: 80 },
    ibu: { min: 50, max: 90 },
    abv: { min: 8.0, max: 12.0 },
    og: { min: 1.080, max: 1.110 },
    fg: { min: 1.015, max: 1.030 },
    description: '加强型世涛，厚重酒体，复杂风味，适合陈酿',
    aroma: '强烈的烘烤和麦芽甜香，可能有水果、酒花、酒精香气',
    appearance: '深黑色，不透明，厚而持久的棕褐色泡沫',
    flavor: '丰富的烘烤麦芽、巧克力、咖啡风味，高酒精度温暖感',
    mouthfeel: '非常饱满的酒体，中等至较低的碳酸化',
    comments: '需要大量深色麦芽，注意发酵控制，可陈酿数月'
  },
  {
    style: 'Porter',
    category: '16. Stout',
    srm: { min: 18, max: 40 },
    ibu: { min: 18, max: 35 },
    abv: { min: 4.5, max: 6.5 },
    og: { min: 1.040, max: 1.060 },
    fg: { min: 1.008, max: 1.016 },
    description: '中等酒体的深色啤酒，烘烤麦芽和焦糖风味',
    aroma: '中等烘烤香气，巧克力、焦糖、坚果特征',
    appearance: '深棕色到黑色，可能微透红光',
    flavor: '烘烤麦芽甜感，中等苦味，巧克力、焦糖风味',
    mouthfeel: '中等酒体，中等碳酸化',
    comments: '比世涛更轻盈，烘烤风味更柔和'
  },
  {
    style: 'Lager',
    category: '02. International Lager',
    srm: { min: 2, max: 6 },
    ibu: { min: 8, max: 25 },
    abv: { min: 4.2, max: 5.8 },
    og: { min: 1.042, max: 1.056 },
    fg: { min: 1.006, max: 1.012 },
    description: '清爽、干净的淡色拉格，突出麦芽的纯净',
    aroma: '轻微的谷物和麦芽香气，非常干净',
    appearance: '极浅的稻草色到金黄色，清澈透明',
    flavor: '干净的谷物甜味，低到中等的苦味，收尾干爽',
    mouthfeel: '中等偏轻酒体，高碳酸化',
    comments: '需要低温发酵和长时间熟成，干净是关键'
  },
  {
    style: 'Pilsner',
    category: '03. Czech Pale Lager',
    srm: { min: 3, max: 6 },
    ibu: { min: 35, max: 50 },
    abv: { min: 4.2, max: 5.6 },
    og: { min: 1.042, max: 1.056 },
    fg: { min: 1.013, max: 1.017 },
    description: '经典捷克皮尔森，突出萨兹酒花的花香和苦味',
    aroma: '明显的萨兹酒花花香和香料香气，柔和的麦芽甜香',
    appearance: '稻草色到金黄色，非常清澈，白色泡沫丰富',
    flavor: '明显的酒花苦味，柔和的麦芽甜感，收尾干爽带微甜',
    mouthfeel: '中等酒体，中等至高碳酸化',
    comments: '软水质和萨兹酒花是关键，低温发酵和熟成'
  },
  {
    style: 'Wheat Beer',
    category: '10. Wheat Beer',
    srm: { min: 3, max: 9 },
    ibu: { min: 8, max: 20 },
    abv: { min: 4.0, max: 5.5 },
    og: { min: 1.040, max: 1.052 },
    fg: { min: 1.008, max: 1.013 },
    description: '使用大量小麦麦芽，酵母产生独特的水果和香料香气',
    aroma: '香蕉和丁香等酵母产生的香气，轻微的小麦和谷物香',
    appearance: '稻草色到浅琥珀色，通常浑浊，白色泡沫丰富',
    flavor: '柔和的酵母风味（香蕉、丁香），低苦味，轻微的小麦酸味',
    mouthfeel: '中等酒体，中等至高碳酸化',
    comments: '选择合适的小麦酵母是关键，注意发酵温度控制'
  },
  {
    style: 'Hefeweizen',
    category: '10. Wheat Beer',
    srm: { min: 4, max: 9 },
    ibu: { min: 8, max: 15 },
    abv: { min: 4.8, max: 5.8 },
    og: { min: 1.046, max: 1.056 },
    fg: { min: 1.010, max: 1.014 },
    description: '德式酵母小麦啤酒，突出酵母产生的香蕉和丁香风味',
    aroma: '强烈的酵母特征：香蕉酯和丁香酚，轻微的小麦香',
    appearance: '淡黄色到暗金色，非常浑浊，浓厚的白色泡沫',
    flavor: '香蕉、丁香风味为主，柔和的麦芽甜感，几乎没有苦味',
    mouthfeel: '中等至饱满酒体，高碳酸化',
    comments: '使用传统德式小麦酵母，不过滤，保留酵母悬浮'
  },
  {
    style: 'Saison',
    category: '25. Belgian & French Ale',
    srm: { min: 5, max: 14 },
    ibu: { min: 20, max: 35 },
    abv: { min: 5.5, max: 8.5 },
    og: { min: 1.048, max: 1.080 },
    fg: { min: 1.002, max: 1.012 },
    description: '比利时农场风格，高度发酵，干爽，带有辛辣和果香酵母特征',
    aroma: '复杂的酵母香气：胡椒、香料、柑橘、热带水果',
    appearance: '金色到琥珀色，通常微浊，泡沫丰富',
    flavor: '干爽，酵母产生的辛辣和果味，低到中等苦味，非常干爽的收尾',
    mouthfeel: '中等酒体，高碳酸化，温暖的酒精感',
    comments: '使用赛松酵母，发酵温度可以适当提高，确保充分发酵'
  },
  {
    style: 'Belgian Tripel',
    category: '25. Belgian & French Ale',
    srm: { min: 4, max: 7 },
    ibu: { min: 20, max: 40 },
    abv: { min: 7.5, max: 10.5 },
    og: { min: 1.070, max: 1.095 },
    fg: { min: 1.005, max: 1.014 },
    description: '比利时金色烈性艾尔，高酒精度但易饮，酵母特征复杂',
    aroma: '复杂的酵母香气：果香、香料、轻微的酒精香，淡淡的酒花香气',
    appearance: '淡金色到金色，清澈，白色泡沫丰富持久',
    flavor: '平衡的麦芽甜感和酒精温暖感，酵母产生的果味和香料味，中等苦味，非常干爽的收尾',
    mouthfeel: '中等酒体，高碳酸化，明显的酒精温暖感但不刺激',
    comments: '使用比利时修道院酵母，大量糖料，充分发酵'
  },
  {
    style: 'Sour',
    category: '28. American Wild Ale',
    srm: { min: 3, max: 20 },
    ibu: { min: 0, max: 25 },
    abv: { min: 3.5, max: 8.0 },
    og: { min: 1.040, max: 1.080 },
    fg: { min: 1.002, max: 1.012 },
    description: '使用细菌或野生酵母产生令人愉悦的酸味',
    aroma: '明显的乳酸或醋酸香气，可能有水果香气',
    appearance: '变化很大，从浅黄色到深红棕色',
    flavor: '主要特征是酸味，从清爽的乳酸到复杂的混合酸',
    mouthfeel: '从轻到中等酒体，中等至高碳酸化',
    comments: '酸化技术多样，注意卫生防止不良微生物'
  },
  {
    style: 'Gose',
    category: '28. American Wild Ale',
    srm: { min: 3, max: 5 },
    ibu: { min: 5, max: 15 },
    abv: { min: 4.0, max: 5.5 },
    og: { min: 1.040, max: 1.052 },
    fg: { min: 1.006, max: 1.010 },
    description: '德国传统酸啤酒，带有盐和香菜籽的特征',
    aroma: '清新的乳酸香气，轻微的香料（香菜籽）和咸感',
    appearance: '淡稻草色，浑浊，白色泡沫',
    flavor: '清爽的乳酸酸味，轻微的咸感，香菜籽香料味，非常干爽',
    mouthfeel: '轻酒体，高碳酸化',
    comments: '通常在煮沸后期添加盐和香菜籽，控制酸化程度'
  },
  {
    style: 'Barleywine',
    category: '17. English Strong Ale',
    srm: { min: 10, max: 22 },
    ibu: { min: 35, max: 85 },
    abv: { min: 8.0, max: 12.0 },
    og: { min: 1.080, max: 1.120 },
    fg: { min: 1.016, max: 1.030 },
    description: '非常强烈的麦芽酒，高酒精度，适合陈酿',
    aroma: '丰富的麦芽甜香，可能有水果酯和酒花香气',
    appearance: '深琥珀色到深棕色，清澈',
    flavor: '强烈的麦芽甜味，复杂的水果和酒花风味，高酒精度温暖感',
    mouthfeel: '饱满到非常饱满的酒体，中等碳酸化',
    comments: '需要大量优质麦芽，注意酵母选择和发酵管理，可长期陈酿'
  },
  {
    style: 'Brown Ale',
    category: '11. English Brown Ale',
    srm: { min: 12, max: 22 },
    ibu: { min: 15, max: 30 },
    abv: { min: 4.0, max: 6.5 },
    og: { min: 1.040, max: 1.060 },
    fg: { min: 1.008, max: 1.016 },
    description: '中等酒体，麦芽甜味，坚果和焦糖风味',
    aroma: '中等的麦芽甜香，坚果、焦糖、轻微烘烤香',
    appearance: '浅棕色到深棕色，清澈',
    flavor: '主要是麦芽甜味，坚果、焦糖、轻微烘烤风味，低到中等苦味',
    mouthfeel: '中等酒体，中等碳酸化',
    comments: '平衡易饮，使用水晶麦芽和少量巧克力麦芽'
  },
  {
    style: 'Amber Ale',
    category: '13. American Ale',
    srm: { min: 10, max: 17 },
    ibu: { min: 25, max: 45 },
    abv: { min: 4.5, max: 6.5 },
    og: { min: 1.045, max: 1.060 },
    fg: { min: 1.010, max: 1.016 },
    description: '平衡的美式琥珀艾尔，麦芽和酒花的协调',
    aroma: '中等酒花香气和中等麦芽甜香，焦糖香',
    appearance: '琥珀色到红铜色，清澈',
    flavor: '中等麦芽甜感，焦糖风味，中等酒花苦味，平衡',
    mouthfeel: '中等酒体，中等碳酸化',
    comments: '水晶麦芽提供颜色和甜味，美式酒花提供风味'
  },
  {
    style: 'Blonde Ale',
    category: '13. American Ale',
    srm: { min: 3, max: 6 },
    ibu: { min: 15, max: 28 },
    abv: { min: 4.0, max: 5.5 },
    og: { min: 1.038, max: 1.054 },
    fg: { min: 1.008, max: 1.013 },
    description: '清爽易饮的金色艾尔，麦芽甜感为主',
    aroma: '轻微的谷物和麦芽甜香，可能有轻微的酒花香气',
    appearance: '稻草色到金黄色，清澈',
    flavor: '柔和的麦芽甜感，低酒花苦味，清爽易饮',
    mouthfeel: '中等偏轻酒体，中等碳酸化',
    comments: '适合入门者，平衡易饮，不要过度复杂化'
  },
  {
    style: 'Kölsch',
    category: '08. German Ale',
    srm: { min: 3, max: 5 },
    ibu: { min: 18, max: 30 },
    abv: { min: 4.4, max: 5.2 },
    og: { min: 1.044, max: 1.050 },
    fg: { min: 1.006, max: 1.011 },
    description: '科隆特色，清爽、优雅的艾尔，口感接近拉格',
    aroma: '非常细腻的麦芽甜香和酒花花香，干净',
    appearance: '非常浅的稻草色到淡黄色，非常清澈',
    flavor: '柔和的麦芽甜感，细腻的酒花苦味，非常干爽优雅',
    mouthfeel: '中等偏轻酒体，中等至高碳酸化',
    comments: '使用Kölsch酵母，低温发酵和熟成，突出优雅和纯净'
  },
  {
    style: 'Bock',
    category: '06. Bock',
    srm: { min: 12, max: 30 },
    ibu: { min: 18, max: 30 },
    abv: { min: 6.3, max: 7.6 },
    og: { min: 1.064, max: 1.072 },
    fg: { min: 1.014, max: 1.020 },
    description: '德国烈性拉格，麦芽甜香为主，酒精度较高',
    aroma: '丰富的麦芽甜香，可能有轻微的焦糖和烘烤香',
    appearance: '深琥珀色到深棕色，清澈',
    flavor: '强烈的麦芽甜味，轻微的烘烤和焦糖风味，低酒花苦味，柔和的酒精感',
    mouthfeel: '中等至饱满酒体，中等碳酸化',
    comments: '使用大量慕尼黑和维也纳麦芽，低温发酵和长时间熟成'
  }
];

export interface BrewPostImage {
  url: string;
  caption?: string;
}

export interface BrewPost {
  id: string;
  title: string;
  coverImage: string;
  content: string;
  authorId: string;
  authorName: string;
  batchId?: string;
  batchName?: string;
  recipeId?: string;
  recipeName?: string;
  images: BrewPostImage[];
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  likedBy: string[];
  bookmarkedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrewPostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface UserStylePreference {
  style: string;
  count: number;
  source: 'tasting' | 'brewing';
  avgScore?: number;
}

export interface RecommendedRecipe extends Recipe {
  matchReason: string;
  matchScore: number;
  matchedStyle: string;
  recommendationType: 'same_style' | 'similar_style';
}

export interface RecommendationResult {
  userId: string;
  generatedAt: string;
  expiresAt: string;
  topStyles: UserStylePreference[];
  recommendations: RecommendedRecipe[];
}
