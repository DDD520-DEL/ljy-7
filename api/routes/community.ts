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
      const scoreA = (a.rating || 0) * 2 + (a.forkCount || 0);
      const scoreB = (b.rating || 0) * 2 + (b.forkCount || 0);
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

export default router;
