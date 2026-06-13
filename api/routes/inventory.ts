import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import type { InventoryItem, IngredientType } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { type, lowStock } = req.query;
  let inventory;

  if (lowStock === 'true') {
    inventory = store.getLowStockItems();
  } else if (type) {
    inventory = store.getInventoryByType(type as IngredientType);
  } else {
    inventory = store.getAllInventory();
  }

  res.json({
    success: true,
    data: inventory,
  });
});

router.get('/check/:recipeId', (req: Request, res: Response) => {
  const check = store.checkInventoryForRecipe(req.params.recipeId);
  if (!check) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  res.json({
    success: true,
    data: check,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const item = store.getInventoryById(req.params.id);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: '库存项不存在',
    });
  }
  res.json({
    success: true,
    data: item,
  });
});

router.post('/', (req: Request, res: Response) => {
  const data = req.body as Omit<InventoryItem, 'id' | 'updatedAt'>;
  if (!data.type || !data.name) {
    return res.status(400).json({
      success: false,
      error: '类型和名称必填',
    });
  }
  const item = store.createInventoryItem(data);
  res.status(201).json({
    success: true,
    data: item,
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const item = store.updateInventoryItem(req.params.id, req.body);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: '库存项不存在',
    });
  }
  res.json({
    success: true,
    data: item,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteInventoryItem(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '库存项不存在',
    });
  }
  res.json({
    success: true,
    message: '库存项已删除',
  });
});

router.post('/:id/restock', (req: Request, res: Response) => {
  const { amount } = req.body as { amount: number };
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: '补货数量必须为正数',
    });
  }
  const item = store.restockInventory(req.params.id, amount);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: '库存项不存在',
    });
  }
  res.json({
    success: true,
    data: item,
  });
});

export default router;
