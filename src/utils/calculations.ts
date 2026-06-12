import type { Recipe, MaltItem, HopAddition, Yeast, CostSnapshot, Batch, FermentationReading } from '../../shared/types.js';

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
