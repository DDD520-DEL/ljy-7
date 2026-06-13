import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, GitFork, Star, Beer, Eye, Filter, Flame, MessageSquare } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BEER_STYLES } from '../../shared/types.js';
import type { Recipe } from '../../shared/types.js';
import { cn } from '../lib/utils.js';
import StarRating from '../components/StarRating.js';

export default function Community() {
  const navigate = useNavigate();
  const { recipes, loading, error, fetchPublicRecipes } = useBrewStore();
  const [sortBy, setSortBy] = useState('popular');
  const [styleFilter, setStyleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchPublicRecipes({ sort: sortBy, style: styleFilter, search: searchQuery });
  }, [fetchPublicRecipes, sortBy, styleFilter, searchQuery]);

  useEffect(() => {
    const loadTrending = async () => {
      const response = await fetch('/api/community/recipes/trending');
      const data = await response.json();
      if (data.success) {
        setTrendingRecipes(data.data);
      }
    };
    loadTrending();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Beer size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3 mb-2">
          <Flame className="text-amber-600" />
          社区配方库
        </h1>
        <p className="text-gray-600">探索来自全球酿酒师的精选配方，找到灵感开始您的酿造之旅</p>
      </div>

      {trendingRecipes.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <TrendingUp className="text-amber-500" />
            热门配方
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {trendingRecipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <div className="text-3xl font-bold mb-2">#{index + 1}</div>
                <h3 className="font-semibold mb-1 truncate">{recipe.name}</h3>
                <div className="text-sm opacity-90 mb-3">{recipe.style}</div>
                <div className="grid grid-cols-3 gap-1 text-center text-xs">
                  <div>
                    <div className="font-bold">{recipe.abv}%</div>
                    <div className="opacity-75">ABV</div>
                  </div>
                  <div>
                    <div className="font-bold">{recipe.ibu}</div>
                    <div className="opacity-75">IBU</div>
                  </div>
                  <div>
                    <div className="font-bold">{recipe.forkCount || 0}</div>
                    <div className="opacity-75">Forks</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Filter size={16} />
              排序:
            </span>
            {(['popular', 'rating', 'newest'] as const).map(sort => (
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
                {sort === 'popular' ? '最受欢迎' : sort === 'rating' ? '评分最高' : '最新发布'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索配方名称、风格或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">所有风格</option>
            {BEER_STYLES.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Beer className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无配方</h3>
          <p className="text-gray-400">尝试调整筛选条件或稍后再来查看</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                        {recipe.name}
                      </h3>
                      <Eye size={16} className="text-green-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        {recipe.style}
                      </span>
                      <span className="text-xs text-gray-500">v{recipe.version}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-amber-700">{recipe.abv}%</div>
                    <div className="text-xs text-gray-500">酒精度</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-amber-700">{recipe.ibu}</div>
                    <div className="text-xs text-gray-500">IBU</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-amber-700">{recipe.srm}</div>
                    <div className="text-xs text-gray-500">SRM</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {recipe.rating !== undefined && recipe.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={recipe.rating} readOnly size="sm" showValue />
                      </div>
                    )}
                    {recipe.forkCount !== undefined && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <GitFork size={14} />
                        <span>{recipe.forkCount}</span>
                      </div>
                    )}
                    {(recipe.commentCount ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <MessageSquare size={14} />
                        <span>{recipe.commentCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(recipe.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
                <div className="text-xs text-gray-500 text-center">
                  点击查看配方详情并 Fork 到您的配方库
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
