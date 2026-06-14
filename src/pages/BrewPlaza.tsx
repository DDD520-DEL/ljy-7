import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Bookmark, MessageSquare, Plus, Clock, Flame, Beer, Filter, ExternalLink, Trash2, Send, User } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import type { BrewPost, BrewPostComment } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

const CURRENT_USER_ID = 'currentUser';
const CURRENT_USER_NAME = '我';

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-amber-700 font-mono">$1</code>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono"><code>$1</code></pre>');
  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-700">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>)(?=\s*<li|$)/gs, '<ul class="my-3 space-y-1">$1</ul>');
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-gray-700">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>)(?=\s*\d+\.|$)/gs, '<ol class="my-3 space-y-1">$1</ol>');
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-amber-400 pl-4 my-4 text-gray-600 italic">$1</blockquote>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^---$/gim, '<hr class="my-6 border-gray-200" />');
  html = html.replace(/\n\n/g, '</p><p class="my-3 text-gray-700">');
  html = '<p class="my-3 text-gray-700">' + html + '</p>';
  html = html.replace(/<p class="my-3 text-gray-700"><h/g, '<h');
  html = html.replace(/<\/h\d><\/p>/g, (match) => match.replace('</p>', ''));
  html = html.replace(/<p class="my-3 text-gray-700"><ul/g, '<ul');
  html = html.replace(/<\/ul><\/p>/g, '</ul>');
  html = html.replace(/<p class="my-3 text-gray-700"><ol/g, '<ol');
  html = html.replace(/<\/ol><\/p>/g, '</ol>');
  html = html.replace(/<p class="my-3 text-gray-700"><blockquote/g, '<blockquote');
  html = html.replace(/<\/blockquote><\/p>/g, '</blockquote>');
  html = html.replace(/<p class="my-3 text-gray-700"><pre/g, '<pre');
  html = html.replace(/<\/pre><\/p>/g, '</pre>');
  html = html.replace(/<p class="my-3 text-gray-700"><hr/g, '<hr');
  html = html.replace(/<hr class="my-6 border-gray-200" \/><\/p>/g, '<hr class="my-6 border-gray-200" />');
  html = html.replace(/\n/g, '<br />');
  return html;
}

export default function BrewPlaza() {
  const navigate = useNavigate();
  const { brewPosts, brewPostComments, loading, error, fetchBrewPosts, fetchBrewPostById, toggleBrewPostLike, toggleBrewPostBookmark, fetchBrewPostComments, createBrewPostComment, deleteBrewPostComment, currentBrewPost, deleteBrewPost } = useBrewStore();
  const [sortBy, setSortBy] = useState<'newest' | 'hot'>('newest');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchBrewPosts(sortBy);
  }, [fetchBrewPosts, sortBy]);

  useEffect(() => {
    if (selectedPostId) {
      fetchBrewPostById(selectedPostId);
      fetchBrewPostComments(selectedPostId);
    }
  }, [selectedPostId, fetchBrewPostById, fetchBrewPostComments]);

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBrewPostLike(postId, CURRENT_USER_ID);
  };

  const handleBookmark = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBrewPostBookmark(postId, CURRENT_USER_ID);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || !newComment.trim()) return;
    const result = await createBrewPostComment({
      postId: selectedPostId,
      authorId: CURRENT_USER_ID,
      authorName: CURRENT_USER_NAME,
      content: newComment.trim(),
    });
    if (result) {
      setNewComment('');
      fetchBrewPostComments(selectedPostId);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    await deleteBrewPostComment(commentId);
    if (selectedPostId) fetchBrewPostComments(selectedPostId);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('确定要删除这篇帖子吗？')) return;
    await deleteBrewPost(postId);
    setSelectedPostId(null);
    fetchBrewPosts(sortBy);
  };

  const openPost = (postId: string) => {
    setSelectedPostId(postId);
  };

  const closePost = () => {
    setSelectedPostId(null);
    setNewComment('');
  };

  if (loading && brewPosts.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Beer size={48} /></div></div>;
  }
  if (error && brewPosts.length === 0) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3 mb-2">
            <Flame className="text-amber-600" />
            酿造心得广场
          </h1>
          <p className="text-gray-600">分享你的酿造经历，与其他酿酒师交流心得</p>
        </div>
        <button
          onClick={() => navigate('/plaza/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} />
          发布心得
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Filter size={16} />
            排序:
          </span>
          {(['newest', 'hot'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                sortBy === sort
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {sort === 'newest' ? '最新发布' : '最热'}
            </button>
          ))}
        </div>
      </div>

      {brewPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Beer className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无心得</h3>
          <p className="text-gray-400 mb-6">成为第一个分享酿造心得的人吧！</p>
          <button
            onClick={() => navigate('/plaza/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            <Plus size={18} />
            发布心得
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brewPosts.map(post => (
            <BrewPostCard
              key={post.id}
              post={post}
              onOpen={openPost}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onDelete={handleDeletePost}
              currentUserId={CURRENT_USER_ID}
            />
          ))}
        </div>
      )}

      {selectedPostId && currentBrewPost && (
        <PostDetailModal
          post={currentBrewPost}
          comments={brewPostComments}
          newComment={newComment}
          onNewCommentChange={setNewComment}
          onSubmitComment={handleSubmitComment}
          onDeleteComment={handleDeleteComment}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onClose={closePost}
          onNavigate={navigate}
          currentUserId={CURRENT_USER_ID}
        />
      )}
    </div>
  );
}

interface BrewPostCardProps {
  post: BrewPost;
  onOpen: (id: string) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  onBookmark: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
}

function BrewPostCard({ post, onOpen, onLike, onBookmark, onDelete, currentUserId }: BrewPostCardProps) {
  const isOwner = post.authorId === currentUserId;
  const isLiked = post.likedBy.includes(currentUserId);
  const isBookmarked = post.bookmarkedBy.includes(currentUserId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
      <div className="relative h-48 overflow-hidden" onClick={() => onOpen(post.id)}>
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craft%20beer%20brewing%20warm%20amber%20color%20grain%20hops&image_size=landscape_16_9';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2">{post.title}</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <User className="text-amber-600" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{post.authorName}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={10} />
              {new Date(post.createdAt).toLocaleDateString('zh-CN')}
            </div>
          </div>
          {isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {(post.recipeName || post.batchName) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.recipeName && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                配方: {post.recipeName}
              </span>
            )}
            {post.batchName && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                批次: {post.batchName}
              </span>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content.replace(/[#*`>\-\[\]]/g, '').slice(0, 100)}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => onLike(post.id, e)}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              )}
            >
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
              {post.likeCount > 0 && <span>{post.likeCount}</span>}
            </button>
            <button
              onClick={(e) => onBookmark(post.id, e)}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                isBookmarked ? "text-amber-500" : "text-gray-400 hover:text-amber-500"
              )}
            >
              <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
              {post.bookmarkCount > 0 && <span>{post.bookmarkCount}</span>}
            </button>
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <MessageSquare size={16} />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PostDetailModalProps {
  post: BrewPost;
  comments: BrewPostComment[];
  newComment: string;
  onNewCommentChange: (val: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onDeleteComment: (id: string) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  onBookmark: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
  currentUserId: string;
}

function PostDetailModal({ post, comments, newComment, onNewCommentChange, onSubmitComment, onDeleteComment, onLike, onBookmark, onClose, onNavigate, currentUserId }: PostDetailModalProps) {
  const isLiked = post.likedBy.includes(currentUserId);
  const isBookmarked = post.bookmarkedBy.includes(currentUserId);
  const isOwner = post.authorId === currentUserId;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto" onClick={e => e.stopPropagation()}>
        <div className="relative h-64 overflow-hidden rounded-t-2xl">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craft%20beer%20brewing%20warm%20amber%20color%20grain%20hops&image_size=landscape_16_9';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-bold text-white mb-2">{post.title}</h2>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="text-white" size={16} />
              </div>
              <span className="text-white/90 text-sm">{post.authorName}</span>
              <span className="text-white/60 text-xs">{new Date(post.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {(post.recipeName || post.batchName) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.recipeId && post.recipeName && (
                <button
                  onClick={() => onNavigate(`/recipes/${post.recipeId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <ExternalLink size={14} />
                  源配方: {post.recipeName}
                </button>
              )}
              {post.batchId && post.batchName && (
                <button
                  onClick={() => onNavigate(`/batches/${post.batchId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink size={14} />
                  关联批次: {post.batchName}
                </button>
              )}
            </div>
          )}

          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {post.images.map((img, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={img.url}
                    alt={img.caption || `图片 ${idx + 1}`}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beer%20brewing%20process%20step&image_size=landscape_4_3';
                    }}
                  />
                  {img.caption && (
                    <div className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50">{img.caption}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className="prose prose-sm max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />

          <div className="flex items-center gap-4 py-4 border-t border-b border-gray-100">
            <button
              onClick={(e) => onLike(post.id, e)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                isLiked ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500"
              )}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span>{post.likeCount} 赞</span>
            </button>
            <button
              onClick={(e) => onBookmark(post.id, e)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                isBookmarked ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
              )}
            >
              <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
              <span>{post.bookmarkCount} 收藏</span>
            </button>
            <span className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-lg">
              <MessageSquare size={18} />
              <span>{post.commentCount} 评论</span>
            </span>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="text-amber-600" size={20} />
              评论 ({comments.length})
            </h4>

            <form onSubmit={onSubmitComment} className="mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <User className="text-amber-600" size={16} />
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => onNewCommentChange(e.target.value)}
                    placeholder="写下你的评论..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
                    maxLength={500}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        newComment.trim()
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <Send size={14} />
                      发送
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="mx-auto mb-2" size={32} />
                <p>暂无评论，来写下第一条吧</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <User className="text-amber-600" size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        {comment.authorId === currentUserId && (
                          <button
                            onClick={() => onDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-auto"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
