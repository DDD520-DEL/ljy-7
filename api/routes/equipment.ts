import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import type { Equipment, EquipmentType } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { type, user } = req.query;
  let equipment;

  if (type) {
    equipment = store.getEquipmentByType(type as EquipmentType);
  } else if (user) {
    equipment = store.getEquipmentByUser(user as string);
  } else {
    equipment = store.getAllEquipment();
  }

  res.json({
    success: true,
    data: equipment,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const item = store.getEquipmentById(req.params.id);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: '设备不存在',
    });
  }
  res.json({
    success: true,
    data: item,
  });
});

router.post('/', (req: Request, res: Response) => {
  const data = req.body as Omit<Equipment, 'id' | 'createdAt'>;
  if (!data.name || !data.type) {
    return res.status(400).json({
      success: false,
      error: '名称和类型必填',
    });
  }
  const item = store.createEquipment(data);
  res.status(201).json({
    success: true,
    data: item,
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const item = store.updateEquipment(req.params.id, req.body);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: '设备不存在',
    });
  }
  res.json({
    success: true,
    data: item,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteEquipment(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '设备不存在',
    });
  }
  res.json({
    success: true,
    message: '设备已删除',
  });
});

export default router;
