import { useState, useEffect } from 'react';
import { MessageSquare, Send, Beer, Trash2, User } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import type { RecipeComment } from '../../shared/types.js';
import StarRating from './StarRating.js';
import { cn } from '../lib/utils.js';

interface CommentSectionProps {
  recipeId: string;
  currentUserId?: string;
  currentUserName?: string;
}

export default function CommentSection({
  recipeId,
  currentUserId = 'currentUser',
  currentUserName = '我',
}: CommentSectionProps) {
  const { comments, loading, error, fetchComments, createComment, deleteComment, checkUserHasBrewed, batches } = useBrewStore();
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [userHasBrewed, setUserHasBrewed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(recipeId);
  }, [recipeId, fetchComments]);

  useEffect(() => {
    const checkBrewed = async () => {
      const hasBrewed = await checkUserHasBrewed(recipeId, currentUserId);
      setUserHasBrewed(hasBrewed);
    };
    checkBrewed();
  }, [recipeId, currentUserId, checkUserHasBrewed, batches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0 || !newComment.trim()) return;

    setIsSubmitting(true);
    const result = await createComment({
      recipeId,
      userId: currentUserId,
      userName: currentUserName,
      rating: newRating,
      content: newComment.trim(),
      hasBrewed: userHasBrewed,
    });

    if (result) {
      setNewRating(0);
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('确定要删除这条评论吗？')) {
      await deleteComment(commentId);
    }
  };

  const averageRating = comments.length > 0
    ? comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
    : 0;

  const ratingDistribution = [0, 0, 0, 0, 0];
  comments.forEach(c => {
    if (c.rating >= 1 && c.rating <= 5) {
      ratingDistribution[c.rating - 1]++;
    }
  });

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-amber-600">
          <MessageSquare size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 text-center md:border-r md:border-gray-100 md:pr-8">
            <div className="text-5xl font-bold text-amber-700 mb-2">
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </div>
            <StarRating rating={averageRating} readOnly size="lg" />
            <div className="text-sm text-gray-500 mt-2">
              {comments.length} 条评价
            </div>
          </div>
          <div className="md:w-2/3 space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingDistribution[star - 1];
              const percentage = comments.length > 0 ? (count / comments.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-8 text-sm text-gray-600 text-right">{star}星</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-gray-500">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="text-amber-600" size={20} />
          发表评论
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-600">您的评分：</span>
            <StarRating
              rating={newRating}
              onRatingChange={setNewRating}
              size="lg"
              showValue
            />
            {userHasBrewed && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <Beer size={12} />
                已酿造
              </span>
            )}
          </div>
          <div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="分享您对这个配方的看法和酿造经验..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">
                {newComment.length}/500
              </span>
              {!userHasBrewed && (
                <span className="text-xs text-amber-600">
                  提示：酿造过该配方后评论将显示"已酿造"标识
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={newRating === 0 || !newComment.trim() || isSubmitting}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                newRating > 0 && newComment.trim() && !isSubmitting
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send size={16} />
              {isSubmitting ? '发送中...' : '发表评论'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="text-red-500 text-center py-4 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          全部评论 ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
            <h4 className="text-lg font-medium text-gray-600 mb-2">暂无评论</h4>
            <p className="text-gray-400">成为第一个评论这个配方的人吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: RecipeComment;
  currentUserId: string;
  onDelete: (commentId: string) => void;
}

function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const isOwner = comment.userId === currentUserId;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <User className="text-amber-600" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{comment.userName}</span>
              {comment.hasBrewed && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <Beer size={10} />
                  已酿造
                </span>
              )}
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <StarRating rating={comment.rating} readOnly size="sm" />
            <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(comment.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="删除评论"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
