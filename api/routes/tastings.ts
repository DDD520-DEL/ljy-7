import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';

const router = express.Router();

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

export default router;
