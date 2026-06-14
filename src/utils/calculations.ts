import type { Recipe, MaltItem, HopAddition, Yeast, CostSnapshot, Batch, FermentationReading, WaterProfile, BeerStyleWaterTarget, WaterAnalysisResult, MineralAddition, MineralCompound, BJCPStyleGuide, BJCPParameterCheck, BJCPStyleCheckResult, BJCPDeviationLevel } from '../../shared/types.js';
import { BJCP_STYLE_GUIDES } from '../../shared/types.js';

export const FERMENTATION_ANOMALY_THRESHOLD = 0.008;
export const EXPECTED_FERMENTATION_DAYS = 14;

export interface AnomalyInfo {
  isAnomalous: boolean;
  consecutiveCount: number;
  lastDeviations: Array<{
    date: string;
    expected: number;
    actual: number;
    deviation: number;
  }>;
  message: string;
}

export const calculateExpectedGravity = (
  brewDate: string,
  readingDate: string,
  originalGravity: number,
  finalGravity: number
): number => {
  const brew = new Date(brewDate).getTime();
  const reading = new Date(readingDate).getTime();
  const daysPassed = Math.max(0, Math.ceil((reading - brew) / (1000 * 60 * 60 * 24)));

  if (daysPassed >= EXPECTED_FERMENTATION_DAYS) {
    return finalGravity;
  }

  const progress = daysPassed / EXPECTED_FERMENTATION_DAYS;
  const gravityDrop = originalGravity - finalGravity;
  return Math.round((originalGravity - progress * gravityDrop) * 1000) / 1000;
};

export const checkBatchAnomaly = (
  batch: Batch,
  recipe: Recipe | undefined,
  threshold: number = FERMENTATION_ANOMALY_THRESHOLD
): AnomalyInfo => {
  if (!recipe || batch.readings.length < 2) {
    return {
      isAnomalous: false,
      consecutiveCount: 0,
      lastDeviations: [],
      message: batch.readings.length < 2 ? '读数不足，无法判断异常' : '缺少配方信息'
    };
  }

  const sortedReadings = [...batch.readings].sort((a, b) => a.date.localeCompare(b.date));

  const deviations = sortedReadings.map((reading): { reading: FermentationReading; expected: number; deviation: number } => {
    const expected = calculateExpectedGravity(
      batch.brewDate,
      reading.date,
      recipe.originalGravity,
      recipe.finalGravity
    );
    const deviation = Math.abs(reading.specificGravity - expected);
    return { reading, expected, deviation };
  });

  let maxConsecutive = 0;
  let currentConsecutive = 0;
  let lastConsecutiveEnd = -1;

  for (let i = 0; i < deviations.length; i++) {
    if (deviations[i].deviation > threshold) {
      currentConsecutive++;
      if (currentConsecutive > maxConsecutive) {
        maxConsecutive = currentConsecutive;
        lastConsecutiveEnd = i;
      }
    } else {
      currentConsecutive = 0;
    }
  }

  const lastDeviations: AnomalyInfo['lastDeviations'] = [];
  if (maxConsecutive >= 2) {
    const startIdx = lastConsecutiveEnd - maxConsecutive + 1;
    for (let i = startIdx; i <= lastConsecutiveEnd; i++) {
      lastDeviations.push({
        date: deviations[i].reading.date,
        expected: deviations[i].expected,
        actual: deviations[i].reading.specificGravity,
        deviation: deviations[i].reading.specificGravity - deviations[i].expected
      });
    }
  }

  const isAnomalous = maxConsecutive >= 2;

  let message = '';
  if (isAnomalous) {
    const avgDeviation = Math.round(
      (lastDeviations.reduce((s, d) => s + Math.abs(d.deviation), 0) / lastDeviations.length) * 10000
    ) / 10000;
    message = `连续 ${maxConsecutive} 次读数偏离目标值，平均偏差 ${avgDeviation.toFixed(4)}（阈值 ${threshold}）`;
  } else if (deviations.length > 0) {
    const maxDev = Math.max(...deviations.map(d => d.deviation));
    message = `当前最大偏差 ${maxDev.toFixed(4)}，阈值 ${threshold}`;
  }

  return {
    isAnomalous,
    consecutiveCount: maxConsecutive,
    lastDeviations,
    message
  };
};

export const getAnomalousBatches = (
  batches: Batch[],
  recipes: Recipe[],
  threshold: number = FERMENTATION_ANOMALY_THRESHOLD
): Array<{ batch: Batch; recipe: Recipe | undefined; anomaly: AnomalyInfo }> => {
  return batches
    .map(batch => {
      const recipe = recipes.find(r => r.id === batch.recipeId);
      const anomaly = checkBatchAnomaly(batch, recipe, threshold);
      return { batch, recipe, anomaly };
    })
    .filter(item => item.anomaly.isAnomalous)
    .sort((a, b) => a.batch.brewDate.localeCompare(b.batch.brewDate));
};

export const calculateABV = (og: number, fg: number): number => {
  return Math.round((og - fg) * 131.25 * 100) / 100;
};

export const calculateApparentAttenuation = (og: number, fg: number): number => {
  if (og <= 1) return 0;
  return Math.round(((og - fg) / (og - 1)) * 100);
};

export const calculateIBU = (hops: Array<{weight: number; alphaAcid: number; time: number; batchSize: number}>): number => {
  let totalIBU = 0;
  hops.forEach(hop => {
    const utilization = 1.65 * Math.pow(0.000125, 1.04 - 1) * (1 - Math.pow(Math.E, -0.04 * hop.time)) / 4.15;
    const ibu = (hop.weight * hop.alphaAcid * utilization * 1000) / (hop.batchSize * 1.05);
    totalIBU += ibu;
  });
  return Math.round(totalIBU);
};

export const calculateSRM = (malts: Array<{weight: number; color: number; batchSize: number}>): number => {
  let totalMCU = 0;
  malts.forEach(malt => {
    totalMCU += (malt.weight * 2.20462 * malt.color) / (malt.batchSize * 0.264172);
  });
  return Math.round(1.4922 * Math.pow(totalMCU, 0.6859) * 10) / 10;
};

export const calculateMaltCost = (malt: MaltItem): number => {
  if (!malt.pricePerKg || malt.pricePerKg <= 0) return 0;
  return Math.round(malt.weight * malt.pricePerKg * 100) / 100;
};

export const calculateHopCost = (hop: HopAddition): number => {
  if (!hop.pricePerKg || hop.pricePerKg <= 0) return 0;
  return Math.round((hop.weight / 1000) * hop.pricePerKg * 100) / 100;
};

export const calculateYeastCost = (yeast: Yeast): number => {
  if (!yeast.price || yeast.price <= 0) return 0;
  return yeast.price;
};

export const calculateTotalMaltCost = (malts: MaltItem[]): number => {
  return Math.round(malts.reduce((sum, malt) => sum + calculateMaltCost(malt), 0) * 100) / 100;
};

export const calculateTotalHopCost = (hops: HopAddition[]): number => {
  return Math.round(hops.reduce((sum, hop) => sum + calculateHopCost(hop), 0) * 100) / 100;
};

export const calculateTotalCost = (recipe: Recipe): number => {
  const maltCost = calculateTotalMaltCost(recipe.malts);
  const hopCost = calculateTotalHopCost(recipe.hops);
  const yeastCost = calculateYeastCost(recipe.yeast);
  return Math.round((maltCost + hopCost + yeastCost) * 100) / 100;
};

export const createCostSnapshot = (recipe: Recipe): CostSnapshot | null => {
  const maltCost = calculateTotalMaltCost(recipe.malts);
  const hopCost = calculateTotalHopCost(recipe.hops);
  const yeastCost = calculateYeastCost(recipe.yeast);
  const totalCost = maltCost + hopCost + yeastCost;

  if (totalCost <= 0) return null;

  return {
    maltCost: Math.round(maltCost * 100) / 100,
    hopCost: Math.round(hopCost * 100) / 100,
    yeastCost: Math.round(yeastCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    malts: recipe.malts.map(m => ({
      name: m.name,
      weight: m.weight,
      pricePerKg: m.pricePerKg || 0,
      cost: calculateMaltCost(m)
    })),
    hops: recipe.hops.map(h => ({
      name: h.name,
      weight: h.weight,
      pricePerKg: h.pricePerKg || 0,
      cost: calculateHopCost(h)
    })),
    yeast: {
      strain: recipe.yeast.strain,
      brand: recipe.yeast.brand,
      price: recipe.yeast.price || 0
    }
  };
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatGravity = (gravity: number): string => {
  return gravity.toFixed(3);
};

export const formatABV = (abv: number): string => {
  return `${abv.toFixed(1)}%`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const calculateVersion = (currentVersion: string, isBranch: boolean = false): string => {
  const parts = currentVersion.split('.').map(Number);
  if (isBranch) {
    return `${parts[0]}.${parts[1] + 1}.0`;
  }
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
};

export const getSRMColor = (srm: number): string => {
  if (srm <= 2) return '#FFF0A8';
  if (srm <= 4) return '#FFDE5C';
  if (srm <= 6) return '#FFCB00';
  if (srm <= 8) return '#FFA500';
  if (srm <= 10) return '#FF8C00';
  if (srm <= 13) return '#CC5500';
  if (srm <= 16) return '#993300';
  if (srm <= 20) return '#702000';
  if (srm <= 25) return '#551500';
  return '#2D0A00';
};

export const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getFermentationProgress = (readings: Array<{date: string}>): number => {
  if (readings.length === 0) return 0;
  const firstDate = new Date(readings[0].date);
  const lastDate = new Date(readings[readings.length - 1].date);
  const days = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.round((days / 14) * 100), 100);
};

export const getBeerStyleWaterTarget = (style: string, mineralCompounds: MineralCompound[], styleTargets: BeerStyleWaterTarget[]): BeerStyleWaterTarget | undefined => {
  return styleTargets.find(t => t.style.toLowerCase() === style.toLowerCase());
};

export const calculateWaterDeficit = (
  sourceWater: Pick<WaterProfile, 'calcium' | 'magnesium' | 'sodium' | 'sulfate' | 'chloride' | 'bicarbonate'>,
  target: BeerStyleWaterTarget
): {
  calcium: number;
  magnesium: number;
  sodium: number;
  sulfate: number;
  chloride: number;
  bicarbonate: number;
} => {
  const targetValues = {
    calcium: target.calcium.ideal ?? (target.calcium.min + target.calcium.max) / 2,
    magnesium: target.magnesium.ideal ?? (target.magnesium.min + target.magnesium.max) / 2,
    sodium: target.sodium.ideal ?? (target.sodium.min + target.sodium.max) / 2,
    sulfate: target.sulfate.ideal ?? (target.sulfate.min + target.sulfate.max) / 2,
    chloride: target.chloride.ideal ?? (target.chloride.min + target.chloride.max) / 2,
    bicarbonate: target.bicarbonate.ideal ?? (target.bicarbonate.min + target.bicarbonate.max) / 2,
  };

  return {
    calcium: Math.max(0, targetValues.calcium - sourceWater.calcium),
    magnesium: Math.max(0, targetValues.magnesium - sourceWater.magnesium),
    sodium: Math.max(0, targetValues.sodium - sourceWater.sodium),
    sulfate: Math.max(0, targetValues.sulfate - sourceWater.sulfate),
    chloride: Math.max(0, targetValues.chloride - sourceWater.chloride),
    bicarbonate: Math.max(0, targetValues.bicarbonate - sourceWater.bicarbonate),
  };
};

export const calculateMineralAdditions = (
  sourceWater: Pick<WaterProfile, 'calcium' | 'magnesium' | 'sodium' | 'sulfate' | 'chloride' | 'bicarbonate'>,
  target: BeerStyleWaterTarget,
  batchSizeLiters: number,
  mineralCompounds: MineralCompound[]
): MineralAddition[] => {
  const additions: MineralAddition[] = [];
  const deficit = calculateWaterDeficit(sourceWater, target);
  
  const remainingDeficit = { ...deficit };
  const currentValues = { ...sourceWater };

  const addMineral = (
    mineral: MineralCompound,
    deficitIon: keyof typeof remainingDeficit,
    secondaryIon?: keyof typeof remainingDeficit
  ) => {
    if (remainingDeficit[deficitIon] <= 0) return;
    
    const ionPerGram = mineral[`${deficitIon}PerGram` as keyof MineralCompound] as number;
    if (ionPerGram <= 0) return;

    let gramsNeeded = (remainingDeficit[deficitIon] * batchSizeLiters) / ionPerGram;
    let maxGrams = Infinity;
    
    if (secondaryIon) {
      const secondaryIonPerGram = mineral[`${secondaryIon}PerGram` as keyof MineralCompound] as number;
      if (secondaryIonPerGram > 0) {
        if (remainingDeficit[secondaryIon] > 0) {
          const gramsBasedOnSecondary = (remainingDeficit[secondaryIon] * batchSizeLiters) / secondaryIonPerGram;
          maxGrams = Math.min(maxGrams, gramsBasedOnSecondary);
        } else {
          const targetMax = (target[secondaryIon] as { min: number; max: number; ideal?: number }).max;
          const maxAllowed = Math.max(0, targetMax - currentValues[secondaryIon]);
          if (maxAllowed > 0) {
            const maxGramsForSecondary = (maxAllowed * batchSizeLiters) / secondaryIonPerGram;
            maxGrams = Math.min(maxGrams, maxGramsForSecondary);
          } else {
            return;
          }
        }
      }
    }

    const allIons: Array<keyof typeof currentValues> = ['calcium', 'magnesium', 'sodium', 'sulfate', 'chloride', 'bicarbonate'];
    for (const ion of allIons) {
      const ionPerGramForCheck = mineral[`${ion}PerGram` as keyof MineralCompound] as number;
      if (ionPerGramForCheck > 0 && ion !== deficitIon && ion !== secondaryIon) {
        const targetMax = (target[ion] as { min: number; max: number; ideal?: number }).max;
        const maxAllowed = Math.max(0, targetMax - currentValues[ion]);
        if (maxAllowed > 0) {
          const maxGramsForIon = (maxAllowed * batchSizeLiters) / ionPerGramForCheck;
          maxGrams = Math.min(maxGrams, maxGramsForIon);
        } else {
          return;
        }
      }
    }

    gramsNeeded = Math.min(gramsNeeded, maxGrams);
    gramsNeeded = Math.max(0, Math.round(gramsNeeded * 100) / 100);

    if (gramsNeeded <= 0) return;

    const maxSolubility = mineral.solubility * batchSizeLiters;
    if (gramsNeeded > maxSolubility) {
      gramsNeeded = Math.round(maxSolubility * 100) / 100;
    }

    const contributions = {
      calcium: (gramsNeeded * mineral.calciumPerGram) / batchSizeLiters,
      magnesium: (gramsNeeded * mineral.magnesiumPerGram) / batchSizeLiters,
      sodium: (gramsNeeded * mineral.sodiumPerGram) / batchSizeLiters,
      sulfate: (gramsNeeded * mineral.sulfatePerGram) / batchSizeLiters,
      chloride: (gramsNeeded * mineral.chloridePerGram) / batchSizeLiters,
      bicarbonate: (gramsNeeded * mineral.bicarbonatePerGram) / batchSizeLiters,
    };

    currentValues.calcium += contributions.calcium;
    currentValues.magnesium += contributions.magnesium;
    currentValues.sodium += contributions.sodium;
    currentValues.sulfate += contributions.sulfate;
    currentValues.chloride += contributions.chloride;
    currentValues.bicarbonate += contributions.bicarbonate;

    remainingDeficit.calcium = Math.max(0, remainingDeficit.calcium - contributions.calcium);
    remainingDeficit.magnesium = Math.max(0, remainingDeficit.magnesium - contributions.magnesium);
    remainingDeficit.sodium = Math.max(0, remainingDeficit.sodium - contributions.sodium);
    remainingDeficit.sulfate = Math.max(0, remainingDeficit.sulfate - contributions.sulfate);
    remainingDeficit.chloride = Math.max(0, remainingDeficit.chloride - contributions.chloride);
    remainingDeficit.bicarbonate = Math.max(0, remainingDeficit.bicarbonate - contributions.bicarbonate);

    additions.push({
      mineral,
      amount: gramsNeeded,
      unit: mineral.unit,
      contributions,
    });
  };

  const gypsum = mineralCompounds.find(m => m.formula === 'CaSO₄·2H₂O');
  if (gypsum) {
    addMineral(gypsum, 'sulfate', 'calcium');
  }

  const cacl2 = mineralCompounds.find(m => m.formula === 'CaCl₂·2H₂O');
  if (cacl2) {
    addMineral(cacl2, 'chloride', 'calcium');
  }

  const mgso4 = mineralCompounds.find(m => m.formula === 'MgSO₄·7H₂O');
  if (mgso4) {
    addMineral(mgso4, 'magnesium', 'sulfate');
  }

  const nahco3 = mineralCompounds.find(m => m.formula === 'NaHCO₃');
  if (nahco3) {
    addMineral(nahco3, 'bicarbonate', 'sodium');
  }

  const nacl = mineralCompounds.find(m => m.formula === 'NaCl');
  if (nacl && remainingDeficit.chloride > 0) {
    addMineral(nacl, 'chloride', 'sodium');
  }

  if (remainingDeficit.sulfate > 0 && gypsum) {
    addMineral(gypsum, 'sulfate');
  }
  if (remainingDeficit.chloride > 0 && cacl2) {
    addMineral(cacl2, 'chloride');
  }

  return additions;
};

export const calculateFinalEstimate = (
  sourceWater: Pick<WaterProfile, 'calcium' | 'magnesium' | 'sodium' | 'sulfate' | 'chloride' | 'bicarbonate'>,
  additions: MineralAddition[]
): {
  calcium: number;
  magnesium: number;
  sodium: number;
  sulfate: number;
  chloride: number;
  bicarbonate: number;
} => {
  const final = {
    calcium: sourceWater.calcium,
    magnesium: sourceWater.magnesium,
    sodium: sourceWater.sodium,
    sulfate: sourceWater.sulfate,
    chloride: sourceWater.chloride,
    bicarbonate: sourceWater.bicarbonate,
  };

  additions.forEach(addition => {
    final.calcium += addition.contributions.calcium;
    final.magnesium += addition.contributions.magnesium;
    final.sodium += addition.contributions.sodium;
    final.sulfate += addition.contributions.sulfate;
    final.chloride += addition.contributions.chloride;
    final.bicarbonate += addition.contributions.bicarbonate;
  });

  return {
    calcium: Math.round(final.calcium),
    magnesium: Math.round(final.magnesium),
    sodium: Math.round(final.sodium),
    sulfate: Math.round(final.sulfate),
    chloride: Math.round(final.chloride),
    bicarbonate: Math.round(final.bicarbonate),
  };
};

export const generateWaterWarnings = (
  sourceWater: Pick<WaterProfile, 'calcium' | 'magnesium' | 'sodium' | 'sulfate' | 'chloride' | 'bicarbonate' | 'ph'>,
  target: BeerStyleWaterTarget,
  additions: MineralAddition[],
  finalEstimate: ReturnType<typeof calculateFinalEstimate>
): string[] => {
  const warnings: string[] = [];

  if (sourceWater.calcium > target.calcium.max) {
    warnings.push(`水源钙含量(${sourceWater.calcium}ppm)超过目标上限(${target.calcium.max}ppm)，考虑使用RO反渗透水稀释`);
  }
  if (sourceWater.bicarbonate > target.bicarbonate.max * 1.5) {
    warnings.push(`水源碳酸氢盐过高(${sourceWater.bicarbonate}ppm)，考虑使用酸处理或稀释降低`);
  }
  if (sourceWater.sodium > 100 && target.sodium.max < 50) {
    warnings.push(`水源钠含量过高(${sourceWater.sodium}ppm)，不适合${target.style}风格，建议使用纯净水`);
  }

  const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);
  if (totalAdditions > 30) {
    warnings.push(`矿物质添加总量较高(${totalAdditions.toFixed(1)}g)，请确保充分溶解`);
  }

  const sourceIons = sourceWater.calcium + sourceWater.magnesium + sourceWater.sodium + sourceWater.sulfate + sourceWater.chloride + sourceWater.bicarbonate;
  if (sourceIons < 20 && sourceIons > 0) {
    warnings.push('水源离子含量很低，接近纯净水，矿物质添加效果会更可预测');
  }

  if (finalEstimate.sulfate > 0 && finalEstimate.chloride > 0) {
    const ratio = finalEstimate.sulfate / finalEstimate.chloride;
    if (target.style.includes('IPA') || target.style.includes('Pale Ale')) {
      if (ratio < 1.5) {
        warnings.push(`硫酸盐/氯化物比例(${ratio.toFixed(2)})偏低，${target.style}风格建议1.5-3:1以突出酒花苦味`);
      }
    }
    if (target.style.includes('Stout') || target.style.includes('Porter')) {
      if (ratio > 1) {
        warnings.push(`硫酸盐/氯化物比例(${ratio.toFixed(2)})偏高，${target.style}风格建议0.5-1:1以突出麦芽甜感`);
      }
    }
  }

  return warnings;
};

export const generateWaterSuggestions = (
  sourceWater: Pick<WaterProfile, 'calcium' | 'magnesium' | 'sodium' | 'sulfate' | 'chloride' | 'bicarbonate' | 'ph'>,
  target: BeerStyleWaterTarget
): string[] => {
  const suggestions: string[] = [...target.tips];

  if (sourceWater.bicarbonate > target.bicarbonate.max && target.bicarbonate.max < 50) {
    suggestions.push('建议在糖化前添加乳酸或磷酸降低醪液pH值');
    suggestions.push('可以考虑添加1-2ml 88%乳酸/10L水来中和碳酸氢根');
  }

  if (sourceWater.calcium < target.calcium.min) {
    suggestions.push('钙离子对酶活性和酵母絮凝很重要，确保添加足够的钙源');
  }

  if (target.style === 'Gose') {
    suggestions.push('Gose的咸感来自高钠含量，可在煮沸后期添加食盐');
  }

  suggestions.push('矿物质建议在糖化前添加到糖化水中，确保充分溶解');
  suggestions.push('建议使用精确的电子秤称量矿物质，用量±0.1g精度');

  return suggestions;
};

export const analyzeWater = (
  sourceWater: Pick<WaterProfile, 'calcium' | 'magnesium' | 'sodium' | 'sulfate' | 'chloride' | 'bicarbonate' | 'ph'>,
  style: string,
  batchSizeLiters: number,
  mineralCompounds: MineralCompound[],
  styleTargets: BeerStyleWaterTarget[]
): WaterAnalysisResult | null => {
  const target = getBeerStyleWaterTarget(style, mineralCompounds, styleTargets);
  if (!target) return null;

  const targetValues = {
    calcium: target.calcium.ideal ?? (target.calcium.min + target.calcium.max) / 2,
    magnesium: target.magnesium.ideal ?? (target.magnesium.min + target.magnesium.max) / 2,
    sodium: target.sodium.ideal ?? (target.sodium.min + target.sodium.max) / 2,
    sulfate: target.sulfate.ideal ?? (target.sulfate.min + target.sulfate.max) / 2,
    chloride: target.chloride.ideal ?? (target.chloride.min + target.chloride.max) / 2,
    bicarbonate: target.bicarbonate.ideal ?? (target.bicarbonate.min + target.bicarbonate.max) / 2,
  };

  const currentValues = {
    calcium: sourceWater.calcium,
    magnesium: sourceWater.magnesium,
    sodium: sourceWater.sodium,
    sulfate: sourceWater.sulfate,
    chloride: sourceWater.chloride,
    bicarbonate: sourceWater.bicarbonate,
  };

  const deficits = calculateWaterDeficit(sourceWater, target);
  const additions = calculateMineralAdditions(sourceWater, target, batchSizeLiters, mineralCompounds);
  const finalEstimate = calculateFinalEstimate(sourceWater, additions);
  const warnings = generateWaterWarnings(sourceWater, target, additions, finalEstimate);
  const suggestions = generateWaterSuggestions(sourceWater, target);

  return {
    sourceWater: {
      calcium: sourceWater.calcium,
      magnesium: sourceWater.magnesium,
      sodium: sourceWater.sodium,
      sulfate: sourceWater.sulfate,
      chloride: sourceWater.chloride,
      bicarbonate: sourceWater.bicarbonate,
      ph: sourceWater.ph,
    },
    targetStyle: target,
    batchSize: batchSizeLiters,
    currentValues,
    targetValues,
    deficits,
    additions,
    finalEstimate,
    warnings,
    suggestions,
  };
};

export const getBJCPStyleGuide = (style: string): BJCPStyleGuide | undefined => {
  const normalizedStyle = style.toLowerCase().trim();
  return BJCP_STYLE_GUIDES.find(s => 
    s.style.toLowerCase() === normalizedStyle ||
    s.style.toLowerCase().includes(normalizedStyle) ||
    normalizedStyle.includes(s.style.toLowerCase())
  );
};

const calculateDeviationPercent = (actual: number, min: number, max: number): number => {
  if (actual >= min && actual <= max) return 0;
  
  const range = max - min;
  if (range === 0) return 0;
  
  if (actual < min) {
    return ((min - actual) / range) * 100;
  } else {
    return ((actual - max) / range) * 100;
  }
};

const getDeviationLevel = (deviationPercent: number): BJCPDeviationLevel => {
  if (deviationPercent === 0) return 'compliant';
  if (deviationPercent <= 20) return 'warning';
  return 'error';
};

const generateSuggestion = (
  parameter: string,
  actual: number,
  min: number,
  max: number,
  unit: string
): string => {
  if (actual >= min && actual <= max) {
    return `${parameter}符合风格要求，保持当前配方即可。`;
  }
  
  if (actual < min) {
    const diff = min - actual;
    const formattedDiff = parameter === 'OG' || parameter === 'FG' 
      ? diff.toFixed(3) 
      : diff.toFixed(1);
    return `${parameter}偏低${formattedDiff}${unit}，建议增加至 ${min}-${max}${unit} 范围内。`;
  } else {
    const diff = actual - max;
    const formattedDiff = parameter === 'OG' || parameter === 'FG' 
      ? diff.toFixed(3) 
      : diff.toFixed(1);
    return `${parameter}偏高${formattedDiff}${unit}，建议降低至 ${min}-${max}${unit} 范围内。`;
  }
};

const checkParameter = (
  parameter: 'srm' | 'ibu' | 'abv' | 'og' | 'fg',
  actual: number,
  styleGuide: BJCPStyleGuide
): BJCPParameterCheck => {
  const parameterNames: Record<string, string> = {
    srm: '色度 (SRM)',
    ibu: '苦度 (IBU)',
    abv: '酒精度 (ABV)',
    og: '原始比重 (OG)',
    fg: '最终比重 (FG)'
  };
  
  const units: Record<string, string> = {
    srm: '',
    ibu: '',
    abv: '%',
    og: '',
    fg: ''
  };
  
  const range = styleGuide[parameter];
  const deviationPercent = calculateDeviationPercent(actual, range.min, range.max);
  const deviationLevel = getDeviationLevel(deviationPercent);
  const suggestion = generateSuggestion(
    parameterNames[parameter],
    actual,
    range.min,
    range.max,
    units[parameter]
  );
  
  return {
    parameter,
    parameterName: parameterNames[parameter],
    actual,
    min: range.min,
    max: range.max,
    isWithinRange: deviationLevel === 'compliant',
    deviationLevel,
    deviationPercent: Math.round(deviationPercent * 10) / 10,
    suggestion
  };
};

const generateOverallSuggestions = (checks: BJCPParameterCheck[]): string[] => {
  const suggestions: string[] = [];
  
  const ogCheck = checks.find(c => c.parameter === 'og');
  const ibuCheck = checks.find(c => c.parameter === 'ibu');
  const abvCheck = checks.find(c => c.parameter === 'abv');
  const srmCheck = checks.find(c => c.parameter === 'srm');
  
  if (ogCheck && !ogCheck.isWithinRange) {
    if (ogCheck.actual < ogCheck.min) {
      suggestions.push('OG偏低：考虑增加基础麦芽用量或减少用水量来提高原始比重。');
    } else {
      suggestions.push('OG偏高：考虑减少基础麦芽用量或增加用水量来降低原始比重。');
    }
  }
  
  if (ibuCheck && !ibuCheck.isWithinRange) {
    if (ibuCheck.actual < ibuCheck.min) {
      suggestions.push('IBU偏低：增加酒花用量、提前投酒花或使用高α酸酒花品种。');
    } else {
      suggestions.push('IBU偏高：减少酒花用量、延后投酒花或使用低α酸酒花品种。');
    }
  }
  
  if (abvCheck && !abvCheck.isWithinRange) {
    if (abvCheck.actual < abvCheck.min) {
      suggestions.push('ABV偏低：增加可发酵糖含量，使用高发酵度酵母，或延长发酵时间。');
    } else {
      suggestions.push('ABV偏高：减少可发酵糖含量，使用低发酵度酵母，或添加不发酵糖。');
    }
  }
  
  if (srmCheck && !srmCheck.isWithinRange) {
    if (srmCheck.actual < srmCheck.min) {
      suggestions.push('SRM偏低：增加深色麦芽（如巧克力麦芽、焦香麦芽）的比例。');
    } else {
      suggestions.push('SRM偏高：减少深色麦芽比例，增加浅色基础麦芽用量。');
    }
  }
  
  return suggestions;
};

export const checkBJCPStyleCompliance = (
  recipe: Recipe,
  targetStyle?: string
): BJCPStyleCheckResult => {
  const styleToCheck = targetStyle || recipe.style;
  const styleGuide = getBJCPStyleGuide(styleToCheck);
  
  if (!styleGuide) {
    return {
      style: styleToCheck,
      styleFound: false,
      checks: [],
      overallScore: 0,
      compliantCount: 0,
      warningCount: 0,
      errorCount: 0,
      summary: `未找到风格 "${styleToCheck}" 的BJCP标准数据，请检查风格名称是否正确。`
    };
  }
  
  const fg = recipe.finalGravity || 1.010;
  
  const checks: BJCPParameterCheck[] = [
    checkParameter('srm', recipe.srm, styleGuide),
    checkParameter('ibu', recipe.ibu, styleGuide),
    checkParameter('abv', recipe.abv, styleGuide),
    checkParameter('og', recipe.originalGravity, styleGuide),
    checkParameter('fg', fg, styleGuide)
  ];
  
  const compliantCount = checks.filter(c => c.deviationLevel === 'compliant').length;
  const warningCount = checks.filter(c => c.deviationLevel === 'warning').length;
  const errorCount = checks.filter(c => c.deviationLevel === 'error').length;
  
  const overallScore = Math.round((compliantCount / checks.length) * 100);
  
  let summary = '';
  if (errorCount > 0) {
    summary = `检测到 ${errorCount} 项参数严重偏离 ${styleGuide.style} 风格标准，建议优先调整。`;
  } else if (warningCount > 0) {
    summary = `检测到 ${warningCount} 项参数轻微偏离 ${styleGuide.style} 风格标准，可根据需要微调。`;
  } else {
    summary = `恭喜！所有参数均符合 ${styleGuide.style} 风格标准，配方设计优秀。`;
  }
  
  const additionalSuggestions = generateOverallSuggestions(checks);
  if (additionalSuggestions.length > 0) {
    summary += ' ' + additionalSuggestions.join(' ');
  }
  
  return {
    style: styleToCheck,
    styleFound: true,
    styleGuide,
    checks,
    overallScore,
    compliantCount,
    warningCount,
    errorCount,
    summary
  };
};
