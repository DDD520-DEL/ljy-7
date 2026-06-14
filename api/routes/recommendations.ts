import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';

const router = express.Router();

router.get('/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { refresh, limit } = req.query;

  const forceRefresh = refresh === 'true';
  const limitNum = limit ? parseInt(limit as string, 10) : 6;

  try {
    const result = store.getRecommendations(userId, forceRefresh, limitNum);
    res.json({
      success: true,
      data: result,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '获取推荐失败',
    });
  }
});

router.post('/:userId/refresh', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit } = req.body;
  const limitNum = limit ? parseInt(limit as string, 10) : 6;

  try {
    const result = store.refreshRecommendations(userId, limitNum);
    res.json({
      success: true,
      data: result,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '刷新推荐失败',
    });
  }
});

export default router;
