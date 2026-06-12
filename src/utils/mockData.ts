import { Recipe, Batch, Tasting } from '../../shared/types';


const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const mockRecipes: Recipe[] = [
  {
    id: 'recipe-001',
    name: '经典西海岸IPA',
    style: 'IPA',
    description: '清爽苦烈的西海岸风格IPA，带有浓郁的柑橘和松针香气。使用Cascade和Centennial酒花打造经典美式IPA风味。',
    batchSize: 20,
    originalGravity: 1.065,
    finalGravity: 1.012,
    abv: 6.96,
    ibu: 65,
    srm: 8,
    malts: [
      { id: 'malt-1', name: 'Pale Malt (2 Row)', weight: 4.5, color: '3', percentage: 85, pricePerKg: 30 },
      { id: 'malt-2', name: 'Caramel Malt 20L', weight: 0.4, color: '20', percentage: 7.5, pricePerKg: 45 },
      { id: 'malt-3', name: 'Carapils Malt', weight: 0.4, color: '1.5', percentage: 7.5, pricePerKg: 40 }
    ],
    hops: [
      { id: 'hop-1', name: 'Cascade', weight: 28, alphaAcid: 7.5, time: 60, stage: 'boil', pricePerKg: 200 },
      { id: 'hop-2', name: 'Centennial', weight: 28, alphaAcid: 10.0, time: 30, stage: 'boil', pricePerKg: 220 },
      { id: 'hop-3', name: 'Cascade', weight: 42, alphaAcid: 7.5, time: 5, stage: 'boil', pricePerKg: 200 },
      { id: 'hop-4', name: 'Centennial', weight: 56, alphaAcid: 10.0, time: 0, stage: 'whirlpool', pricePerKg: 220 },
      { id: 'hop-5', name: 'Cascade', weight: 84, alphaAcid: 7.5, time: 7, stage: 'dryhop', pricePerKg: 200 }
    ],
    yeast: {
      id: 'yeast-1',
      strain: 'US-05 American Ale',
      brand: 'Fermentis',
      attenuation: 78,
      temperature: [18, 22],
      price: 35
    },
    mashSteps: [
      { id: 'mash-1', temperature: 67, duration: 60, description: '蛋白休止' },
      { id: 'mash-2', temperature: 72, duration: 30, description: '糖化休止' },
      { id: 'mash-3', temperature: 78, duration: 10, description: '灭酶' }
    ],
    version: '1.0.0',
    isPublic: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(30),
    createdBy: '酿酒师小王',
    forkCount: 12,
    rating: 4.5
  },
  {
    id: 'recipe-002',
    name: '经典西海岸IPA - 更干版本',
    style: 'IPA',
    description: '在经典配方基础上降低了最终比重，使酒体更加干爽，酒花香气更加突出。',
    batchSize: 20,
    originalGravity: 1.068,
    finalGravity: 1.008,
    abv: 7.88,
    ibu: 72,
    srm: 7,
    malts: [
      { id: 'malt-1', name: 'Pale Malt (2 Row)', weight: 4.2, color: '3', percentage: 88 },
      { id: 'malt-2', name: 'Caramel Malt 10L', weight: 0.3, color: '10', percentage: 6 },
      { id: 'malt-3', name: 'Carapils Malt', weight: 0.3, color: '1.5', percentage: 6 }
    ],
    hops: [
      { id: 'hop-1', name: 'Cascade', weight: 28, alphaAcid: 7.5, time: 60, stage: 'boil' },
      { id: 'hop-2', name: 'Centennial', weight: 35, alphaAcid: 10.0, time: 30, stage: 'boil' },
      { id: 'hop-3', name: 'Cascade', weight: 42, alphaAcid: 7.5, time: 5, stage: 'boil' },
      { id: 'hop-4', name: 'Centennial', weight: 70, alphaAcid: 10.0, time: 0, stage: 'whirlpool' },
      { id: 'hop-5', name: 'Cascade', weight: 100, alphaAcid: 7.5, time: 7, stage: 'dryhop' },
      { id: 'hop-6', name: 'Mosaic', weight: 50, alphaAcid: 12.5, time: 7, stage: 'dryhop' }
    ],
    yeast: {
      id: 'yeast-1',
      strain: 'US-05 American Ale',
      brand: 'Fermentis',
      attenuation: 82,
      temperature: [19, 21]
    },
    mashSteps: [
      { id: 'mash-1', temperature: 65, duration: 75, description: '单一糖化' },
      { id: 'mash-2', temperature: 78, duration: 10, description: '灭酶' }
    ],
    version: '1.1.0',
    parentVersion: '1.0.0',
    parentId: 'recipe-001',
    branchName: 'drier-body',
    isPublic: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(15),
    createdBy: '酿酒师小王',
    forkCount: 5,
    rating: 4.8
  },
  {
    id: 'recipe-003',
    name: '帝国世涛',
    style: 'Imperial Stout',
    description: '浓郁厚重的帝国世涛，带有巧克力、咖啡和烘焙麦芽的复杂风味。适合长时间熟成。',
    batchSize: 20,
    originalGravity: 1.090,
    finalGravity: 1.020,
    abv: 9.19,
    ibu: 75,
    srm: 40,
    malts: [
      { id: 'malt-1', name: 'Pale Malt (2 Row)', weight: 5.0, color: '3', percentage: 62 },
      { id: 'malt-2', name: 'Roasted Barley', weight: 0.5, color: '500', percentage: 6 },
      { id: 'malt-3', name: 'Chocolate Malt', weight: 0.4, color: '350', percentage: 5 },
      { id: 'malt-4', name: 'Black Patent Malt', weight: 0.3, color: '500', percentage: 4 },
      { id: 'malt-5', name: 'Crystal Malt 120L', weight: 0.5, color: '120', percentage: 6 },
      { id: 'malt-6', name: 'Munich Malt', weight: 0.6, color: '10', percentage: 7 },
      { id: 'malt-7', name: 'Flaked Oats', weight: 0.4, color: '2', percentage: 5 },
      { id: 'malt-8', name: 'Lactose', weight: 0.4, color: '0', percentage: 5 }
    ],
    hops: [
      { id: 'hop-1', name: 'Magnum', weight: 42, alphaAcid: 12.0, time: 90, stage: 'boil' },
      { id: 'hop-2', name: 'East Kent Golding', weight: 28, alphaAcid: 5.0, time: 60, stage: 'boil' },
      { id: 'hop-3', name: 'Fuggle', weight: 28, alphaAcid: 4.5, time: 30, stage: 'boil' },
      { id: 'hop-4', name: 'Cascade', weight: 42, alphaAcid: 7.5, time: 14, stage: 'dryhop' }
    ],
    yeast: {
      id: 'yeast-2',
      strain: 'WLP001 California Ale',
      brand: 'White Labs',
      attenuation: 75,
      temperature: [18, 20]
    },
    mashSteps: [
      { id: 'mash-1', temperature: 68, duration: 90, description: '糖化休止' },
      { id: 'mash-2', temperature: 78, duration: 15, description: '灭酶' }
    ],
    version: '1.0.0',
    isPublic: false,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
    createdBy: '酿酒师小李',
    forkCount: 0,
    rating: 0
  },
  {
    id: 'recipe-004',
    name: '德式小麦啤酒',
    style: 'Hefeweizen',
    description: '传统德式小麦啤酒，带有香蕉和丁香的酵母香气，清爽易饮。',
    batchSize: 20,
    originalGravity: 1.052,
    finalGravity: 1.012,
    abv: 5.25,
    ibu: 15,
    srm: 4,
    malts: [
      { id: 'malt-1', name: 'Wheat Malt', weight: 2.8, color: '2', percentage: 55 },
      { id: 'malt-2', name: 'Pilsner Malt', weight: 2.1, color: '2', percentage: 40 },
      { id: 'malt-3', name: 'Munich Malt Type 1', weight: 0.25, color: '10', percentage: 5 }
    ],
    hops: [
      { id: 'hop-1', name: 'Hallertau Mittelfrueh', weight: 14, alphaAcid: 4.0, time: 60, stage: 'boil' },
      { id: 'hop-2', name: 'Hallertau Mittelfrueh', weight: 14, alphaAcid: 4.0, time: 15, stage: 'boil' }
    ],
    yeast: {
      id: 'yeast-3',
      strain: 'WLP300 Hefeweizen',
      brand: 'White Labs',
      attenuation: 73,
      temperature: [18, 22]
    },
    mashSteps: [
      { id: 'mash-1', temperature: 66, duration: 60, description: '糖化休止' },
      { id: 'mash-2', temperature: 76, duration: 10, description: '灭酶' }
    ],
    version: '1.0.0',
    isPublic: true,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
    createdBy: '酿酒师小张',
    forkCount: 8,
    rating: 4.3
  },
  {
    id: 'recipe-005',
    name: '夏日皮尔森',
    style: 'Pilsner',
    description: '清爽干净的波西米亚风格皮尔森，带有淡雅的麦芽甜香和萨兹酒花的草本气息。',
    batchSize: 20,
    originalGravity: 1.048,
    finalGravity: 1.010,
    abv: 4.99,
    ibu: 40,
    srm: 3,
    malts: [
      { id: 'malt-1', name: 'Pilsner Malt', weight: 5.0, color: '2', percentage: 100 }
    ],
    hops: [
      { id: 'hop-1', name: 'Saaz', weight: 35, alphaAcid: 3.5, time: 60, stage: 'boil' },
      { id: 'hop-2', name: 'Saaz', weight: 25, alphaAcid: 3.5, time: 15, stage: 'boil' },
      { id: 'hop-3', name: 'Saaz', weight: 30, alphaAcid: 3.5, time: 0, stage: 'whirlpool' }
    ],
    yeast: {
      id: 'yeast-4',
      strain: 'WLP800 Pilsner Lager',
      brand: 'White Labs',
      attenuation: 72,
      temperature: [10, 13]
    },
    mashSteps: [
      { id: 'mash-1', temperature: 65, duration: 75, description: '糖化休止' },
      { id: 'mash-2', temperature: 77, duration: 10, description: '灭酶' }
    ],
    version: '1.0.0',
    isPublic: true,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
    createdBy: '精酿大师',
    forkCount: 15,
    rating: 4.7
  }
];

export const mockBatches: Batch[] = [
  {
    id: 'batch-001',
    recipeId: 'recipe-001',
    recipeVersion: '1.0.0',
    recipeName: '经典西海岸IPA',
    name: '经典西海岸IPA #1',
    brewDate: daysAgo(25),
    status: 'completed',
    originalGravityActual: 1.066,
    finalGravityActual: 1.013,
    volumeActual: 19.5,
    deviations: [
      { parameter: '初始比重', expected: 1.065, actual: 1.066, unit: '' },
      { parameter: '最终比重', expected: 1.012, actual: 1.013, unit: '' },
      { parameter: '产量', expected: 20, actual: 19.5, unit: 'L' }
    ],
    readings: [
      { id: 'read-1', date: daysAgo(25), specificGravity: 1.066, temperature: 20, ph: 5.2, notes: '接种酵母，发酵启动正常' },
      { id: 'read-2', date: daysAgo(24), specificGravity: 1.045, temperature: 21, ph: 4.8, notes: '发酵旺盛， krausen形成' },
      { id: 'read-3', date: daysAgo(22), specificGravity: 1.025, temperature: 20, ph: 4.5, notes: '发酵进行中' },
      { id: 'read-4', date: daysAgo(20), specificGravity: 1.018, temperature: 19, ph: 4.4, notes: '发酵减缓' },
      { id: 'read-5', date: daysAgo(18), specificGravity: 1.014, temperature: 19, ph: 4.3, notes: '接近终点' },
      { id: 'read-6', date: daysAgo(15), specificGravity: 1.013, temperature: 18, ph: 4.3, notes: '终点到达，开始干投酒花' },
      { id: 'read-7', date: daysAgo(8), specificGravity: 1.013, temperature: 4, ph: 4.3, notes: '冷沉3天' }
    ],
    notes: '这次发酵温度控制得很好，酒花香气突出。下次可以考虑增加一点干投量。',
    createdAt: daysAgo(25)
  },
  {
    id: 'batch-002',
    recipeId: 'recipe-001',
    recipeVersion: '1.0.0',
    recipeName: '经典西海岸IPA',
    name: '经典西海岸IPA #2',
    brewDate: daysAgo(10),
    status: 'fermenting',
    originalGravityActual: 1.064,
    volumeActual: 20.2,
    deviations: [
      { parameter: '初始比重', expected: 1.065, actual: 1.064, unit: '' }
    ],
    readings: [
      { id: 'read-1', date: daysAgo(10), specificGravity: 1.064, temperature: 20, ph: 5.3, notes: '酵母接种完成' },
      { id: 'read-2', date: daysAgo(9), specificGravity: 1.050, temperature: 21, ph: 4.9, notes: '发酵启动' },
      { id: 'read-3', date: daysAgo(7), specificGravity: 1.032, temperature: 20, ph: 4.6, notes: '高速发酵中' },
      { id: 'read-4', date: daysAgo(5), specificGravity: 1.022, temperature: 20, ph: 4.4, notes: '' },
      { id: 'read-5', date: daysAgo(3), specificGravity: 1.017, temperature: 19, ph: 4.4, notes: '' },
      { id: 'read-6', date: daysAgo(1), specificGravity: 1.015, temperature: 19, ph: 4.3, notes: '接近终点' }
    ],
    notes: '使用了新批次的US-05酵母，发酵启动很快。',
    createdAt: daysAgo(10)
  },
  {
    id: 'batch-003',
    recipeId: 'recipe-003',
    recipeVersion: '1.0.0',
    recipeName: '帝国世涛',
    name: '帝国世涛 #1 - 初酿',
    brewDate: daysAgo(40),
    status: 'conditioning',
    originalGravityActual: 1.092,
    finalGravityActual: 1.022,
    volumeActual: 18.8,
    deviations: [
      { parameter: '初始比重', expected: 1.090, actual: 1.092, unit: '' },
      { parameter: '最终比重', expected: 1.020, actual: 1.022, unit: '' },
      { parameter: '产量', expected: 20, actual: 18.8, unit: 'L' }
    ],
    readings: [
      { id: 'read-1', date: daysAgo(40), specificGravity: 1.092, temperature: 19, ph: 5.4, notes: '高比重麦汁，酵母加倍接种' },
      { id: 'read-2', date: daysAgo(38), specificGravity: 1.070, temperature: 20, ph: 5.0, notes: '发酵启动较慢，正常' },
      { id: 'read-3', date: daysAgo(35), specificGravity: 1.050, temperature: 20, ph: 4.8, notes: '' },
      { id: 'read-4', date: daysAgo(30), specificGravity: 1.035, temperature: 19, ph: 4.7, notes: '' },
      { id: 'read-5', date: daysAgo(25), specificGravity: 1.028, temperature: 19, ph: 4.6, notes: '' },
      { id: 'read-6', date: daysAgo(20), specificGravity: 1.024, temperature: 18, ph: 4.6, notes: '' },
      { id: 'read-7', date: daysAgo(15), specificGravity: 1.022, temperature: 18, ph: 4.6, notes: '终点到达，进入熟成阶段' }
    ],
    notes: '高比重酿造成功！现在进入熟成阶段，计划瓶中熟成3个月。实际ABV约为9.1%。',
    createdAt: daysAgo(40)
  },
  {
    id: 'batch-004',
    recipeId: 'recipe-004',
    recipeVersion: '1.0.0',
    recipeName: '德式小麦啤酒',
    name: '德式小麦啤酒 #1',
    brewDate: daysAgo(5),
    status: 'brewing',
    originalGravityActual: 1.053,
    volumeActual: 20.5,
    deviations: [],
    readings: [
      { id: 'read-1', date: daysAgo(5), specificGravity: 1.053, temperature: 20, ph: 5.2, notes: '酵母刚接种' },
      { id: 'read-2', date: daysAgo(4), specificGravity: 1.051, temperature: 20, ph: 5.1, notes: '发酵似乎启动较慢' },
      { id: 'read-3', date: daysAgo(3), specificGravity: 1.050, temperature: 19, ph: 5.1, notes: '比重几乎未下降' },
      { id: 'read-4', date: daysAgo(2), specificGravity: 1.050, temperature: 19, ph: 5.0, notes: '发酵停滞？酵母可能活性不足' },
      { id: 'read-5', date: daysAgo(1), specificGravity: 1.050, temperature: 20, ph: 5.0, notes: '连续未下降，需要检查' },
      { id: 'read-6', date: daysAgo(0).slice(0, 10), specificGravity: 1.051, temperature: 20, ph: 5.0, notes: '比重反而上升，疑似感染' }
    ],
    notes: '糖化效率不错，比重略高于预期。但发酵似乎有问题，酵母可能活性不足，连续几天比重未下降。',
    createdAt: daysAgo(5)
  },
  {
    id: 'batch-005',
    recipeId: 'recipe-005',
    recipeVersion: '1.0.0',
    recipeName: '夏日皮尔森',
    name: '夏日皮尔森 #1',
    brewDate: daysAgo(3),
    status: 'planning',
    deviations: [],
    readings: [],
    notes: '计划本周末酿造，已备好原料。',
    createdAt: daysAgo(3)
  }
];

export const mockTastings: Tasting[] = [
  {
    id: 'tasting-001',
    batchId: 'batch-001',
    recipeId: 'recipe-001',
    recipeName: '经典西海岸IPA',
    batchName: '经典西海岸IPA #1',
    name: '经典西海岸IPA #1 品鉴',
    date: daysAgo(3),
    appearance: {
      score: 8,
      clarity: '清澈',
      color: '深金色',
      headRetention: '丰富持久，泡沫细腻'
    },
    aroma: {
      score: 9,
      intensity: '强烈',
      notes: ['柑橘', '松针', '葡萄柚', '热带水果', '焦糖']
    },
    flavor: {
      score: 8,
      sweetness: 3,
      bitterness: 7,
      acidity: 2,
      notes: ['橙子', '松木', '麦芽甜', '轻微树脂']
    },
    mouthfeel: {
      score: 7,
      body: '中等',
      carbonation: '中等偏高',
      warmth: '轻微'
    },
    overall: {
      score: 8.5,
      impressions: '一款非常平衡的西海岸IPA，酒花香气突出但不突兀，麦芽支撑良好。苦味干净利落，回味悠长。干投的Cascade带来了漂亮的柑橘和松针香气，与酒体完美融合。'
    },
    totalScore: 81,
    notes: '发酵控制良好，没有异味。下次可以尝试更高的干投量或增加一些Mosaic酒花来增加复杂度。瓶中条件2周后风味更佳。'
  },
  {
    id: 'tasting-002',
    batchId: 'batch-003',
    recipeId: 'recipe-003',
    recipeName: '帝国世涛',
    batchName: '帝国世涛 #1 - 初酿',
    name: '帝国世涛 #1 初评',
    date: daysAgo(1),
    appearance: {
      score: 9,
      clarity: '不透明',
      color: '深黑色',
      headRetention: '棕褐色泡沫，持久'
    },
    aroma: {
      score: 8.5,
      intensity: '浓郁',
      notes: ['烘焙咖啡', '黑巧克力', '烤麦芽', '轻微酒精感', '焦糖']
    },
    flavor: {
      score: 8,
      sweetness: 6,
      bitterness: 5,
      acidity: 1,
      notes: ['黑巧克力', '浓缩咖啡', '烘烤麦芽', '乳糖甜味', '轻微甘草']
    },
    mouthfeel: {
      score: 8.5,
      body: '厚重',
      carbonation: '低',
      warmth: '中度'
    },
    overall: {
      score: 8.5,
      impressions: '非常出色的帝国世涛！酒体厚重饱满，乳糖带来的甜味平衡了烘焙麦芽的苦味。咖啡和巧克力风味明显，酒精感控制得很好，虽然9%但不刺激。现在已经很美味，但再熟成2-3个月会更加顺滑。'
    },
    totalScore: 85,
    notes: '初评就很惊艳！剩下的要耐心等待熟成。装瓶时加了一点香草豆，期待香草风味融合进去。'
  },
  {
    id: 'tasting-003',
    batchId: 'batch-004',
    recipeId: 'recipe-004',
    recipeName: '德式小麦啤酒',
    batchName: '德式小麦啤酒 #1',
    name: '德式小麦啤酒 #1 尝鲜',
    date: daysAgo(1),
    appearance: {
      score: 7,
      clarity: '朦胧',
      color: '淡稻草色',
      headRetention: '白色泡沫，丰富'
    },
    aroma: {
      score: 8,
      intensity: '中等',
      notes: ['香蕉', '丁香', '小麦', '轻微酵母味']
    },
    flavor: {
      score: 7.5,
      sweetness: 4,
      bitterness: 2,
      acidity: 2,
      notes: ['香蕉', '丁香', '面包', '小麦']
    },
    mouthfeel: {
      score: 7,
      body: '中等偏轻',
      carbonation: '高',
      warmth: '无'
    },
    overall: {
      score: 7.5,
      impressions: '经典的德式小麦风味，酵母表现完美，香蕉和丁香的平衡很好。酒体清爽，适合夏天饮用。可能温度再低一点（4-6°C）会更好喝。'
    },
    totalScore: 74,
    notes: '二发5天，碳酸化还可以再等几天。整体很不错，是夏天的标配！'
  }
];

export function initializeMockData(): { recipes: Recipe[]; batches: Batch[]; tastings: Tasting[] } {
  return {
    recipes: [...mockRecipes],
    batches: [...mockBatches],
    tastings: [...mockTastings]
  };
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading from storage:', e);
  }
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
}
