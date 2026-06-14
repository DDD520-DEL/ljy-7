import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import type { ProcurementRecord, IngredientType } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { type } = req.query;
  let procurements;

  if (type) {
    procurements = store.getProcurementsByType(type as IngredientType);
  } else {
    procurements = store.getAllProcurements();
  }

  res.json({
    success: true,
    data: procurements,
  });
});

router.get('/trends/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const trends = store.getPriceTrends(type as IngredientType);

  res.json({
    success: true,
    data: trends,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const record = store.getProcurementById(req.params.id);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '采购记录不存在',
    });
  }
  res.json({
    success: true,
    data: record,
  });
});

router.post('/', (req: Request, res: Response) => {
  const data = req.body as Omit<ProcurementRecord, 'id' | 'createdAt' | 'totalPrice'>;
  if (!data.supplierName || !data.ingredientType || !data.ingredientName || !data.unitPrice || !data.quantity || !data.purchaseDate) {
    return res.status(400).json({
      success: false,
      error: '供应商名称、原料类型、原料名称、单价、数量、采购日期为必填项',
    });
  }
  const record = store.createProcurement(data);
  res.status(201).json({
    success: true,
    data: record,
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const record = store.updateProcurement(req.params.id, req.body);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '采购记录不存在',
    });
  }
  res.json({
    success: true,
    data: record,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteProcurement(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '采购记录不存在',
    });
  }
  res.json({
    success: true,
    message: '采购记录已删除',
  });
});

export default router;
