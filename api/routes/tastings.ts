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

export default router;
