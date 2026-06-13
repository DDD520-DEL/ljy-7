import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { public: isPublic, user } = req.query;
  let recipes;

  if (isPublic === 'true') {
    recipes = store.getPublicRecipes();
  } else if (user) {
    recipes = store.getRecipesByUser(user as string);
  } else {
    recipes = store.getAllRecipes();
  }

  res.json({
    success: true,
    data: recipes,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const recipe = store.getRecipeById(req.params.id);
  if (!recipe) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  res.json({
    success: true,
    data: recipe,
  });
});

router.get('/:id/versions', (req: Request, res: Response) => {
  const versions = store.getRecipeVersions(req.params.id);
  res.json({
    success: true,
    data: versions,
  });
});

router.get('/:id/lineage', (req: Request, res: Response) => {
  const lineage = store.getRecipeLineage(req.params.id);
  res.json({
    success: true,
    data: lineage,
  });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const recipe = store.createRecipe(req.body);
    res.status(201).json({
      success: true,
      data: recipe,
    });
  } catch (_error) {
    res.status(400).json({
      success: false,
      error: '创建配方失败',
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const recipe = store.updateRecipe(req.params.id, req.body);
  if (!recipe) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  res.json({
    success: true,
    data: recipe,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteRecipe(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  res.json({
    success: true,
    message: '配方已删除',
  });
});

router.post('/:id/version', (req: Request, res: Response) => {
  const { branchName, updates } = req.body;
  if (!branchName) {
    return res.status(400).json({
      success: false,
      error: '分支名称不能为空',
    });
  }
  const newVersion = store.createNewVersion(req.params.id, branchName, updates || {});
  if (!newVersion) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: newVersion,
  });
});

router.get('/compare/:idA/:idB', (req: Request, res: Response) => {
  const comparison = store.compareRecipes(req.params.idA, req.params.idB);
  if (!comparison) {
    return res.status(404).json({
      success: false,
      error: '一个或多个配方不存在',
    });
  }
  res.json({
    success: true,
    data: comparison,
  });
});

router.post('/:id/fork', (req: Request, res: Response) => {
  const { createdBy } = req.body;
  if (!createdBy) {
    return res.status(400).json({
      success: false,
      error: '创建者ID不能为空',
    });
  }
  const forked = store.forkRecipe(req.params.id, createdBy);
  if (!forked) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: forked,
  });
});

export default router;
