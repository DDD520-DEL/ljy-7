import express, { type Request, type Response } from 'express';
import { store } from '../data/store.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { sort } = req.query;
  const posts = store.getAllBrewPosts(sort as string);
  res.json({
    success: true,
    data: posts,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const post = store.getBrewPostById(req.params.id);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: '帖子不存在',
    });
  }
  res.json({
    success: true,
    data: post,
  });
});

router.post('/', (req: Request, res: Response) => {
  const { title, coverImage, content, authorId, authorName, batchId, recipeId, images } = req.body;

  if (!title || !coverImage || !content || !authorId || !authorName) {
    return res.status(400).json({
      success: false,
      error: '缺少必要字段（标题、封面图、正文、作者信息）',
    });
  }

  try {
    const post = store.createBrewPost({
      title,
      coverImage,
      content,
      authorId,
      authorName,
      batchId,
      recipeId,
      images: images || [],
    });
    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建帖子失败',
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const post = store.updateBrewPost(req.params.id, req.body);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: '帖子不存在',
    });
  }
  res.json({
    success: true,
    data: post,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteBrewPost(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '帖子不存在',
    });
  }
  res.json({
    success: true,
    message: '帖子已删除',
  });
});

router.post('/:id/like', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '缺少用户ID',
    });
  }
  const post = store.toggleLike(req.params.id, userId);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: '帖子不存在',
    });
  }
  res.json({
    success: true,
    data: post,
  });
});

router.post('/:id/bookmark', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '缺少用户ID',
    });
  }
  const post = store.toggleBookmark(req.params.id, userId);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: '帖子不存在',
    });
  }
  res.json({
    success: true,
    data: post,
  });
});

router.get('/:id/comments', (req: Request, res: Response) => {
  const comments = store.getBrewPostComments(req.params.id);
  res.json({
    success: true,
    data: comments,
  });
});

router.post('/:id/comments', (req: Request, res: Response) => {
  const { authorId, authorName, content } = req.body;

  if (!authorId || !authorName || !content) {
    return res.status(400).json({
      success: false,
      error: '缺少必要字段',
    });
  }

  const comment = store.createBrewPostComment({
    postId: req.params.id,
    authorId,
    authorName,
    content,
  });

  if (!comment) {
    return res.status(404).json({
      success: false,
      error: '帖子不存在',
    });
  }

  res.status(201).json({
    success: true,
    data: comment,
  });
});

router.delete('/comments/:commentId', (req: Request, res: Response) => {
  const deleted = store.deleteBrewPostComment(req.params.commentId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '评论不存在',
    });
  }
  res.json({
    success: true,
    message: '评论已删除',
  });
});

export default router;
