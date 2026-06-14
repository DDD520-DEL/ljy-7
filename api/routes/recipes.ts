import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';
import { BJCP_STYLE_GUIDES, type Recipe } from '../../shared/types.js';

const router = express.Router();

function recipeToCSV(recipe: Recipe): string {
  const headers = [
    'ID', '名称', '风格', '描述', '批次容量(L)', '原始比重', '最终比重',
    '酒精度(%)', '苦度(IBU)', '色度(SRM)', '版本', '分支', '是否公开',
    '创建时间', '更新时间', '创建者', '麦芽配比', '酒花投放',
    '酵母菌株', '酵母品牌', '发酵度(%)', '发酵温度范围',
    '糖化步骤'
  ];

  const maltsStr = recipe.malts
    .map(m => `${m.name}(${m.weight}kg, ${m.percentage}%, 色度${m.color})`)
    .join('; ');

  const hopsStr = recipe.hops
    .map(h => `${h.name}(${h.weight}g, α酸${h.alphaAcid}%, ${h.time}min, ${h.stage})`)
    .join('; ');

  const mashStepsStr = recipe.mashSteps
    .map(s => `${s.description}(${s.temperature}°C, ${s.duration}min)`)
    .join('; ');

  const yeastTempRange = `${recipe.yeast.temperature[0]}-${recipe.yeast.temperature[1]}°C`;

  const values = [
    recipe.id,
    `"${recipe.name.replace(/"/g, '""')}"`,
    recipe.style,
    `"${(recipe.description || '').replace(/"/g, '""')}"`,
    recipe.batchSize,
    recipe.originalGravity,
    recipe.finalGravity,
    recipe.abv,
    recipe.ibu,
    recipe.srm,
    recipe.version,
    recipe.branchName || '',
    recipe.isPublic ? '是' : '否',
    recipe.createdAt,
    recipe.updatedAt,
    recipe.createdBy,
    `"${maltsStr.replace(/"/g, '""')}"`,
    `"${hopsStr.replace(/"/g, '""')}"`,
    recipe.yeast.strain,
    recipe.yeast.brand,
    recipe.yeast.attenuation,
    yeastTempRange,
    `"${mashStepsStr.replace(/"/g, '""')}"`
  ];

  return '\ufeff' + headers.join(',') + '\n' + values.join(',') + '\n';
}

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

router.get('/:id/bjcp-check', (req: Request, res: Response) => {
  const { targetStyle } = req.query;
  const result = store.checkBJCPStyleCompliance(
    req.params.id,
    targetStyle ? String(targetStyle) : undefined
  );
  
  if (!result) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }
  
  res.json({
    success: true,
    data: result,
  });
});

router.get('/bjcp/styles', (_req: Request, res: Response) => {
  const styles = BJCP_STYLE_GUIDES.map(s => ({
    style: s.style,
    category: s.category,
    description: s.description,
    srm: s.srm,
    ibu: s.ibu,
    abv: s.abv,
    og: s.og,
    fg: s.fg,
  }));
  
  res.json({
    success: true,
    data: styles,
  });
});

router.get('/:id/export', (req: Request, res: Response) => {
  const recipe = store.getRecipeById(req.params.id);
  if (!recipe) {
    return res.status(404).json({
      success: false,
      error: '配方不存在',
    });
  }

  const format = (req.query.format as string) || 'json';
  const safeName = recipe.name.replace(/[<>:"/\\|?*]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const csv = recipeToCSV(recipe);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="配方_${safeName}_${timestamp}.csv"`);
    return res.send(csv);
  }

  const jsonData = JSON.stringify({
    exportedAt: new Date().toISOString(),
    data: recipe,
  }, null, 2);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="配方_${safeName}_${timestamp}.json"`);
  res.send(jsonData);
});

export default router;
