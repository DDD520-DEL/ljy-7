import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import type { FermentationReading, ParameterDeviation } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { recipeId, startDate, endDate } = req.query;
  let batches;

  if (startDate && endDate) {
    batches = store.getBatchesByDateRange(startDate as string, endDate as string);
  } else if (recipeId) {
    batches = store.getBatchesByRecipe(recipeId as string);
  } else {
    batches = store.getAllBatches();
  }

  res.json({
    success: true,
    data: batches,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const batch = store.getBatchById(req.params.id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/from-recipe/:recipeId', (req: Request, res: Response) => {
  const batch = store.createBatchFromRecipe(req.params.recipeId, req.body);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: batch,
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const batch = store.updateBatch(req.params.id, req.body);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteBatch(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    message: '批次已删除',
  });
});

router.post('/:id/readings', (req: Request, res: Response) => {
  const reading = req.body as Omit<FermentationReading, 'id'>;
  const batch = store.addReading(req.params.id, reading);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: batch,
  });
});

router.put('/:id/readings/:readingId', (req: Request, res: Response) => {
  const batch = store.updateReading(req.params.id, req.params.readingId, req.body);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或读数不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.delete('/:id/readings/:readingId', (req: Request, res: Response) => {
  const batch = store.deleteReading(req.params.id, req.params.readingId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或读数不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/deviations', (req: Request, res: Response) => {
  const deviation = req.body as ParameterDeviation;
  const batch = store.addDeviation(req.params.id, deviation);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: batch,
  });
});

export default router;
