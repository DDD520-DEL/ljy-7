import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, Beer, Star, GitFork, MessageCircle, Clock } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import type { RecommendedRecipe, RecommendationResult } from '../../shared/types.js';
import { formatABV } from '../utils/calculations.js';
import { cn } from '../lib/utils.js';

interface RecipeRecommendationsProps {
  userId: string;
}

function RecipeCard({ recipe }: { recipe: RecommendedRecipe }) {
  const isSameStyle = recipe.recommendationType === 'same_style';

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={cn(
        'group relative block p-4 rounded-xl border transition-all duration-200 hover:shadow-md',
        isSameStyle
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400'
          : 'bg-white border-gray-200 hover:border-amber-300'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate group-hover:text-amber-700 transition-colors">
            {recipe.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{recipe.style}</p>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          {recipe.isPublic && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              公开
            </span>
          )}
          {isSameStyle ? (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-medium">
              同款
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              相近
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-amber-700 bg-amber-100/60 rounded-lg px-2.5 py-1.5 mb-3 line-clamp-2">
        {recipe.matchReason}
      </p>

      <div className="flex gap-3 text-sm text-gray-600 mb-3">
        <span className="flex items-center gap-1">
          <Beer className="w-3.5 h-3.5 text-amber-600" />
          ABV {formatABV(recipe.abv)}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-amber-600 font-medium text-xs">IBU</span>
          {recipe.ibu}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-amber-600 font-medium text-xs">SRM</span>
          {recipe.srm}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {recipe.rating !== undefined && recipe.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              {recipe.rating.toFixed(1)}
            </span>
          )}
          {recipe.forkCount !== undefined && recipe.forkCount > 0 && (
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-gray-400" />
              {recipe.forkCount}
            </span>
          )}
          {recipe.commentCount !== undefined && recipe.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
              {recipe.commentCount}
            </span>
          )}
        </div>
        <span className="text-gray-400">v{recipe.version}</span>
      </div>
    </Link>
  );
}

export default function RecipeRecommendations({ userId }: RecipeRecommendationsProps) {
  const {
    recommendations,
    recommendedRecipes,
    loading,
    fetchRecommendedRecipes,
    refreshRecommendations,
  } = useBrewStore();

  const handleRefresh = () => {
    refreshRecommendations(userId, 6);
  };

  const formatRefreshTime = (result: RecommendationResult | null) => {
    if (!result) return '';
    const date = new Date(result.generatedAt);
    const expire = new Date(result.expiresAt);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60)));
    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · ${hoursLeft}小时后刷新`;
  };

  const isEmpty = recommendedRecipes.length === 0 && !loading;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            为你推荐
          </h2>
          {recommendations && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRefreshTime(recommendations)}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors',
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'text-amber-700 hover:bg-amber-50 active:bg-amber-100'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          换一批
        </button>
      </div>

      {recommendations && recommendations.topStyles.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 py-1">您的偏好：</span>
          {recommendations.topStyles.slice(0, 3).map((pref, index) => (
            <span
              key={pref.style}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full font-medium',
                index === 0
                  ? 'bg-amber-500 text-white'
                  : index === 1
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {pref.style}
              {pref.avgScore && (
                <span className="ml-1 opacity-80">
                  {pref.source === 'tasting' ? `★${pref.avgScore.toFixed(0)}` : `${pref.count}次`}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-16">
          <Sparkles className="w-14 h-14 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium mb-1">还没有为您生成推荐</p>
          <p className="text-sm text-gray-400 mb-4">
            您酿造更多批次并添加品鉴记录后，我们将为您推荐个性化配方
          </p>
          <Link
            to="/community"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            <Beer className="w-4 h-4" />
            浏览社区配方
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
