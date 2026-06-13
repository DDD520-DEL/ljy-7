import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';

const router = express.Router();

router.get('/recipes', (req: Request, res: Response) => {
  const { sort, style, search } = req.query;
  let recipes = store.getPublicRecipes();

  if (style && style !== 'all') {
    recipes = recipes.filter(r => r.style === style);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    recipes = recipes.filter(r =>
      r.name.toLowerCase().includes(searchLower) ||
      r.description.toLowerCase().includes(searchLower) ||
      r.style.toLowerCase().includes(searchLower)
    );
  }

  if (sort === 'popular') {
    recipes = recipes.sort((a, b) => (b.forkCount || 0) - (a.forkCount || 0));
  } else if (sort === 'rating') {
    recipes = recipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'newest') {
    recipes = recipes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  res.json({
    success: true,
    data: recipes,
  });
});

router.get('/recipes/trending', (_req: Request, res: Response) => {
  const recipes = store.getPublicRecipes()
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * 2 + (a.forkCount || 0) + (a.commentCount || 0) * 0.5;
      const scoreB = (b.rating || 0) * 2 + (b.forkCount || 0) + (b.commentCount || 0) * 0.5;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  res.json({
    success: true,
    data: recipes,
  });
});

router.get('/styles', (_req: Request, res: Response) => {
  const recipes = store.getPublicRecipes();
  const styleCounts = recipes.reduce((acc, recipe) => {
    acc[recipe.style] = (acc[recipe.style] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const styles = Object.entries(styleCounts).map(([name, count]) => ({
    name,
    count,
  }));

  res.json({
    success: true,
    data: styles,
  });
});

router.get('/recipes/:recipeId/comments', (req: Request, res: Response) => {
  const { recipeId } = req.params;
  const comments = store.getRecipeComments(recipeId);
  res.json({
    success: true,
    data: comments,
  });
});

router.post('/recipes/:recipeId/comments', (req: Request, res: Response) => {
  const { recipeId } = req.params;
  const { userId, userName, rating, content, hasBrewed } = req.body;

  if (!userId || !userName || !rating || !content) {
    return res.status(400).json({
      success: false,
      error: '缺少必要字段',
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: '评分必须在 1-5 之间',
    });
  }

  try {
    const comment = store.addRecipeComment({
      recipeId,
      userId,
      userName,
      rating,
      content,
      hasBrewed: hasBrewed || false,
    });
    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发表评论失败',
    });
  }
});

router.delete('/comments/:commentId', (req: Request, res: Response) => {
  const { commentId } = req.params;
  const success = store.deleteRecipeComment(commentId);
  if (success) {
    res.json({
      success: true,
      message: '评论已删除',
    });
  } else {
    res.status(404).json({
      success: false,
      error: '评论不存在',
    });
  }
});

router.get('/recipes/:recipeId/check-brewed', (req: Request, res: Response) => {
  const { recipeId } = req.params;
  const { userId } = req.query;
  const hasBrewed = store.hasUserBrewedRecipe(recipeId, userId as string);
  res.json({
    success: true,
    data: { hasBrewed },
  });
});

export default router;
