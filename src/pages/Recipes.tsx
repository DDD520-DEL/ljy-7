import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Beer, Plus, GitFork, Eye, Edit2, Trash2, GitBranch, Star, EyeOff } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BEER_STYLES, BATCH_STATUS_LABELS } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

export default function Recipes() {
  const navigate = useNavigate();
  const { recipes, batches, loading, error, fetchRecipes, deleteRecipe, fetchBatches, forkRecipe } = useBrewStore();
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecipes();
    fetchBatches();
  }, [fetchRecipes, fetchBatches]);

  const getBatchCount = (recipeId: string) => {
    return batches.filter(b => b.recipeId === recipeId).length;
  };

  const getLatestBatchStatus = (recipeId: string) => {
    const recipeBatches = batches.filter(b => b.recipeId === recipeId);
    if (recipeBatches.length === 0) return null;
    return recipeBatches.sort((a, b) => b.brewDate.localeCompare(a.brewDate))[0].status;
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个配方吗？')) {
      await deleteRecipe(id);
    }
  };

  const handleFork = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await forkRecipe(id, 'currentUser');
    if (result) {
      alert('配方已 Fork 到您的配方库！');
    }
  };

  const filteredRecipes = recipes
    .filter(recipe => {
      if (filter === 'public') return recipe.isPublic;
      if (filter === 'private') return !recipe.isPublic;
      return true;
    })
    .filter(recipe => {
      if (styleFilter !== 'all') return recipe.style === styleFilter;
      return true;
    })
    .filter(recipe => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return recipe.name.toLowerCase().includes(query) ||
        recipe.style.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query);
    });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Beer size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <Beer className="text-amber-600" />
            配方管理
          </h1>
          <p className="text-gray-600 mt-1">管理您的酿造配方，创建新版本，追踪酿造历史</p>
        </div>
        <button
          onClick={() => navigate('/recipes/new')}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          创建新配方
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {(['all', 'public', 'private'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  filter === f
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {f === 'all' ? '全部' : f === 'public' ? '公开' : '私有'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索配方..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
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

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Beer className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无配方</h3>
          <p className="text-gray-400 mb-6">点击上方按钮创建您的第一个配方</p>
          <button
            onClick={() => navigate('/recipes/new')}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            创建新配方
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => {
            const batchCount = getBatchCount(recipe.id);
            const latestStatus = getLatestBatchStatus(recipe.id);
            return (
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
                        {recipe.isPublic ? (
                          <Eye size={16} className="text-green-500" />
                        ) : (
                          <EyeOff size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          {recipe.style}
                        </span>
                        <span className="text-xs text-gray-500">v{recipe.version}</span>
                        {recipe.branchName && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <GitBranch size={12} />
                            {recipe.branchName}
                          </span>
                        )}
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
                      <div className="flex items-center gap-1 text-gray-500">
                        <Beer size={14} />
                        {batchCount} 批次
                      </div>
                      {latestStatus && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          latestStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          latestStatus === 'fermenting' ? 'bg-amber-100 text-amber-700' :
                          latestStatus === 'conditioning' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {BATCH_STATUS_LABELS[latestStatus]}
                        </span>
                      )}
                    </div>
                    {recipe.forkCount !== undefined && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <GitFork size={14} />
                        {recipe.forkCount}
                      </div>
                    )}
                  </div>
                  {recipe.rating !== undefined && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-600">{recipe.rating}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleFork(recipe.id, e)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-amber-600 rounded-lg transition-colors"
                  >
                    <GitFork size={16} />
                    Fork
                  </button>
                  <Link
                    to={`/recipes/${recipe.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                    编辑
                  </Link>
                  <button
                    onClick={(e) => handleDelete(recipe.id, e)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
