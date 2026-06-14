import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import type { FermentationReading, ParameterDeviation, BrewStep } from '../../shared/types.js';

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
  const result = store.createBatchFromRecipeWithInventory(req.params.recipeId, req.body);
  if (!result.success) {
    if (result.check) {
      return res.status(400).json({
        success: false,
        error: result.error || '原料库存不足',
        shortages: result.check.shortages,
        warnings: result.check.warnings,
      });
    }
    return res.status(404).json({
      success: false,
      error: result.error || '配方不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: result.batch,
    warnings: result.check?.warnings || [],
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

router.put('/:id/notes', (req: Request, res: Response) => {
  const { notes } = req.body;
  const batch = store.updateBatchNotes(req.params.id, notes || '');
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

router.post('/:id/photos', (req: Request, res: Response) => {
  const { url, stage, caption } = req.body;
  if (!url || !stage) {
    return res.status(400).json({
      success: false,
      error: '图片URL和阶段是必填项',
    });
  }
  const batch = store.addPhoto(req.params.id, {
    url,
    stage,
    caption: caption || '',
  });
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

router.put('/:id/photos/:photoId', (req: Request, res: Response) => {
  const batch = store.updatePhoto(req.params.id, req.params.photoId, req.body);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或照片不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.delete('/:id/photos/:photoId', (req: Request, res: Response) => {
  const batch = store.deletePhoto(req.params.id, req.params.photoId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或照片不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/generate', (req: Request, res: Response) => {
  const batch = store.generateBrewStepsForBatch(req.params.id);
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

router.put('/:id/brew-steps/:stepId', (req: Request, res: Response) => {
  const updates = req.body as Partial<BrewStep>;
  const batch = store.updateBrewStep(req.params.id, req.params.stepId, updates);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/:stepId/start', (req: Request, res: Response) => {
  const batch = store.startBrewStep(req.params.id, req.params.stepId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/:stepId/complete', (req: Request, res: Response) => {
  const batch = store.completeBrewStep(req.params.id, req.params.stepId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/:stepId/skip', (req: Request, res: Response) => {
  const batch = store.skipBrewStep(req.params.id, req.params.stepId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/reset', (req: Request, res: Response) => {
  const batch = store.resetBrewSteps(req.params.id);
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

router.post('/:id/bottling', (req: Request, res: Response) => {
  const { totalBottles, bottleSpec, capColor, storageLocation, notes } = req.body;

  const result = store.createBottlingRecord(req.params.id, {
    totalBottles: Number(totalBottles),
    bottleSpec,
    capColor,
    storageLocation,
    notes,
  });

  if (!result.success) {
    const statusCode = result.error === '批次不存在' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: result.error,
    });
  }

  res.status(201).json({
    success: true,
    data: result.batch,
  });
});

router.get('/trace/:traceCode', (req: Request, res: Response) => {
  const result = store.lookupTraceCode(req.params.traceCode);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: '追溯码无效或不存在',
    });
  }
  res.json({
    success: true,
    data: result,
  });
});

export default router;
