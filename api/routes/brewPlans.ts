import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import type { BrewPlan } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  let plans: BrewPlan[];

  if (startDate && endDate) {
    plans = store.getBrewPlansByDateRange(startDate as string, endDate as string);
  } else {
    plans = store.getAllBrewPlans();
  }

  res.json({
    success: true,
    data: plans,
  });
});

router.get('/reminders', (req: Request, res: Response) => {
  const today = req.query.today as string || new Date().toISOString().split('T')[0];
  const reminders = store.getActiveReminders(today);
  res.json({
    success: true,
    data: reminders,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const plan = store.getBrewPlanById(req.params.id);
  if (!plan) {
    return res.status(404).json({
      success: false,
      error: '酿造计划不存在',
    });
  }
  res.json({
    success: true,
    data: plan,
  });
});

router.post('/', (req: Request, res: Response) => {
  const { date, title, description, reminderDaysBefore, reminderText, createdBy } = req.body;
  if (!date || !title) {
    return res.status(400).json({
      success: false,
      error: '日期和标题为必填项',
    });
  }
  const plan = store.createBrewPlan({
    date,
    title,
    description: description || '',
    reminderDaysBefore: reminderDaysBefore ?? 1,
    reminderText: reminderText || '准备酵母扩培',
    createdBy: createdBy || 'currentUser',
  });
  res.status(201).json({
    success: true,
    data: plan,
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const plan = store.updateBrewPlan(req.params.id, req.body);
  if (!plan) {
    return res.status(404).json({
      success: false,
      error: '酿造计划不存在',
    });
  }
  res.json({
    success: true,
    data: plan,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteBrewPlan(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '酿造计划不存在',
    });
  }
  res.json({
    success: true,
    message: '酿造计划已删除',
  });
});

export default router;
