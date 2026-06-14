import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import type { Tasting } from '../../shared/types.js';

const router = express.Router();

function tastingsToCSV(tastings: Tasting[]): string {
  const headers = [
    'ID', '名称', '日期', '批次ID', '批次名称', '配方ID', '配方名称',
    '总分', '外观评分', '外观清澈度', '外观颜色', '外观泡沫',
    '香气评分', '香气强度', '香气描述',
    '风味评分', '甜度', '苦度', '酸度', '风味描述',
    '口感评分', '酒体', '碳酸化', '酒精感',
    '整体评分', '整体印象', '备注'
  ];

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) return `"${(val as string[]).join('; ').replace(/"/g, '""')}"`;
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = tastings.map(t => [
    t.id,
    t.name,
    t.date,
    t.batchId,
    t.batchName || '',
    t.recipeId,
    t.recipeName || '',
    t.totalScore,
    t.appearance.score,
    t.appearance.clarity,
    t.appearance.color,
    t.appearance.headRetention,
    t.aroma.score,
    t.aroma.intensity,
    t.aroma.notes,
    t.flavor.score,
    t.flavor.sweetness,
    t.flavor.bitterness,
    t.flavor.acidity,
    t.flavor.notes,
    t.mouthfeel.score,
    t.mouthfeel.body,
    t.mouthfeel.carbonation,
    t.mouthfeel.warmth,
    t.overall.score,
    t.overall.impressions,
    t.notes
  ].map(escape).join(','));

  return '\ufeff' + headers.join(',') + '\n' + rows.join('\n') + '\n';
}

router.get('/', (req: Request, res: Response) => {
  const { recipeId, batchId } = req.query;
  let tastings;

  if (recipeId) {
    tastings = store.getTastingsByRecipe(recipeId as string);
  } else if (batchId) {
    tastings = store.getTastingsByBatch(batchId as string);
  } else {
    tastings = store.getAllTastings();
  }

  res.json({
    success: true,
    data: tastings,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const tasting = store.getTastingById(req.params.id);
  if (!tasting) {
    return res.status(404).json({
      success: false,
      error: '品鉴记录不存在',
    });
  }
  res.json({
    success: true,
    data: tasting,
  });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const tasting = store.createTasting(req.body);
    res.status(201).json({
      success: true,
      data: tasting,
    });
  } catch (_error) {
    res.status(400).json({
      success: false,
      error: '创建品鉴记录失败',
    });
  }
});

router.post('/by-trace-code', (req: Request, res: Response) => {
  const { traceCode, ...tastingData } = req.body;
  
  if (!traceCode) {
    return res.status(400).json({
      success: false,
      error: '追溯码为必填项',
    });
  }

  const result = store.createTastingWithTraceCode(traceCode, tastingData);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error || '创建品鉴记录失败',
    });
  }

  res.status(201).json({
    success: true,
    data: result.tasting,
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const tasting = store.updateTasting(req.params.id, req.body);
  if (!tasting) {
    return res.status(404).json({
      success: false,
      error: '品鉴记录不存在',
    });
  }
  res.json({
    success: true,
    data: tasting,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteTasting(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '品鉴记录不存在',
    });
  }
  res.json({
    success: true,
    message: '品鉴记录已删除',
  });
});

router.post('/compare', (req: Request, res: Response) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
    return res.status(400).json({
      success: false,
      error: '请选择2-3条品鉴记录进行对比',
    });
  }

  const tastings = store.getTastingsByIds(ids);
  
  if (tastings.length !== ids.length) {
    return res.status(404).json({
      success: false,
      error: '部分品鉴记录不存在',
    });
  }

  const comparisonData = tastings.map(tasting => ({
    id: tasting.id,
    name: tasting.name,
    batchName: tasting.batchName,
    recipeName: tasting.recipeName,
    totalScore: tasting.totalScore,
    appearance: tasting.appearance.score,
    aroma: tasting.aroma.score,
    flavor: tasting.flavor.score,
    mouthfeel: tasting.mouthfeel.score,
    overall: tasting.overall.score,
  }));

  res.json({
    success: true,
    data: comparisonData,
  });
});

router.get('/export', (req: Request, res: Response) => {
  const { recipeId, batchId, ids } = req.query;
  const format = (req.query.format as string) || 'json';
  const timestamp = new Date().toISOString().slice(0, 10);

  let tastings: Tasting[];

  if (ids && typeof ids === 'string') {
    const idList = ids.split(',').filter(Boolean);
    tastings = store.getTastingsByIds(idList);
  } else if (recipeId) {
    tastings = store.getTastingsByRecipe(recipeId as string);
  } else if (batchId) {
    tastings = store.getTastingsByBatch(batchId as string);
  } else {
    tastings = store.getAllTastings();
  }

  if (tastings.length === 0) {
    return res.status(404).json({
      success: false,
      error: '没有可导出的品鉴记录',
    });
  }

  const fileNameBase = ids ? '品鉴记录_选中' : '品鉴记录_全部';

  if (format === 'csv') {
    const csv = tastingsToCSV(tastings);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}_${timestamp}.csv"`);
    return res.send(csv);
  }

  const jsonData = JSON.stringify({
    exportedAt: new Date().toISOString(),
    count: tastings.length,
    data: tastings,
  }, null, 2);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}_${timestamp}.json"`);
  res.send(jsonData);
});

router.get('/:id/export', (req: Request, res: Response) => {
  const tasting = store.getTastingById(req.params.id);
  if (!tasting) {
    return res.status(404).json({
      success: false,
      error: '品鉴记录不存在',
    });
  }

  const format = (req.query.format as string) || 'json';
  const safeName = tasting.name.replace(/[<>:"/\\|?*]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const csv = tastingsToCSV([tasting]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="品鉴_${safeName}_${timestamp}.csv"`);
    return res.send(csv);
  }

  const jsonData = JSON.stringify({
    exportedAt: new Date().toISOString(),
    data: tasting,
  }, null, 2);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="品鉴_${safeName}_${timestamp}.json"`);
  res.send(jsonData);
});

export default router;
