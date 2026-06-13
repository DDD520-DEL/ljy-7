import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';

const router = express.Router();

router.get('/:userId', (req: Request, res: Response) => {
  const stats = store.getUserStats(req.params.userId);
  res.json({
    success: true,
    data: stats,
  });
});

export default router;
