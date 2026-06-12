import { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Beer, ListTodo, Star, Users, TrendingUp, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BATCH_STATUS_LABELS } from '../../shared/types.js';
import { formatDate, formatABV, getDaysSince } from '../utils/calculations.js';
import { cn } from '../lib/utils.js';
import BrewCalendar from '../components/BrewCalendar.js';

const statusColors: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  brewing: 'bg-blue-100 text-blue-700',
  fermenting: 'bg-amber-100 text-amber-700',
  conditioning: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  planning: <Clock className="w-4 h-4" />,
  brewing: <AlertCircle className="w-4 h-4" />,
  fermenting: <TrendingUp className="w-4 h-4" />,
  conditioning: <Clock className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
};

export default function Home() {
  const { recipes, batches, calendarBatches, tastings, loading, fetchRecipes, fetchBatches, fetchBatchesByDateRange, fetchTastings } = useBrewStore();

  useEffect(() => {
    fetchRecipes();
    fetchBatches();
    fetchTastings();
  }, [fetchRecipes, fetchBatches, fetchTastings]);

  const loadCalendarBatches = useCallback((year: number, month: number) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    fetchBatchesByDateRange(startDate, endDate);
  }, [fetchBatchesByDateRange]);

  useEffect(() => {
    const now = new Date();
    loadCalendarBatches(now.getFullYear(), now.getMonth());
  }, [loadCalendarBatches]);

  const stats = [
    { label: '配方总数', value: recipes.length, icon: Beer, color: 'from-amber-500 to-orange-600', path: '/recipes' },
    { label: '酿造批次', value: batches.length, icon: ListTodo, color: 'from-blue-500 to-cyan-600', path: '/batches' },
    { label: '品鉴记录', value: tastings.length, icon: Star, color: 'from-yellow-500 to-amber-600', path: '/tastings' },
    { label: '公开配方', value: recipes.filter(r => r.isPublic).length, icon: Users, color: 'from-green-500 to-emerald-600', path: '/community' },
  ];

  const activeBatches = batches.filter(b => b.status !== 'completed').sort((a, b) => b.brewDate.localeCompare(a.brewDate));
  const recentTastings = [...tastings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const popularRecipes = [...recipes].sort((a, b) => b.forkCount - a.forkCount).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-800 to-orange-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">欢迎回来，酿酒师！</h1>
        <p className="text-amber-100 mb-6">管理您的酿造配方，追踪每一批次的发酵过程，记录品鉴心得。</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 bg-white text-amber-800 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建新配方
          </Link>
          <Link
            to="/batches"
            className="inline-flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            <ListTodo className="w-5 h-5" />
            查看批次
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.path}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', stat.color)}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <BrewCalendar batches={calendarBatches} onMonthChange={loadCalendarBatches} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-amber-600" />
              进行中的批次
            </h2>
            <Link to="/batches" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              查看全部 →
            </Link>
          </div>
          {activeBatches.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无进行中的批次</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBatches.slice(0, 4).map((batch) => {
                const recipe = recipes.find(r => r.id === batch.recipeId);
                return (
                  <div key={batch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', statusColors[batch.status])}>
                        {statusIcons[batch.status]}
                      </div>
                      <div>
                        <Link to={`/batches/${batch.id}`} className="font-medium text-gray-800 hover:text-amber-600">
                          {batch.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {recipe?.name || '未知配方'} · {formatDate(batch.brewDate)} · 第 {getDaysSince(batch.brewDate)} 天
                        </p>
                      </div>
                    </div>
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', statusColors[batch.status])}>
                      {BATCH_STATUS_LABELS[batch.status as keyof typeof BATCH_STATUS_LABELS]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              最近品鉴
            </h2>
            <Link to="/tastings" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              查看全部 →
            </Link>
          </div>
          {recentTastings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无品鉴记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTastings.map((tasting) => {
                const _batch = batches.find(b => b.id === tasting.batchId);
                const recipe = recipes.find(r => r.id === tasting.recipeId);
                return (
                  <div key={tasting.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Link to={`/tastings`} className="font-medium text-gray-800 hover:text-amber-600">
                          {tasting.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {recipe?.name || '未知配方'} · {formatDate(tasting.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-gray-800">{tasting.totalScore}</span>
                        <span className="text-gray-400 text-sm">/50</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>外观: {tasting.appearance.score}/10</span>
                      <span>香气: {tasting.aroma.score}/10</span>
                      <span>风味: {tasting.flavor.score}/10</span>
                      <span>口感: {tasting.mouthfeel.score}/10</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            热门配方
          </h2>
          <Link to="/community" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            社区广场 →
          </Link>
        </div>
        {popularRecipes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Beer className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无配方</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {popularRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
                    <p className="text-sm text-gray-500">{recipe.style}</p>
                  </div>
                  {recipe.isPublic && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">公开</span>
                  )}
                </div>
                <div className="flex gap-3 text-sm text-gray-600 mb-3">
                  <span>ABV {formatABV(recipe.abv)}</span>
                  <span>IBU {recipe.ibu}</span>
                  <span>SRM {recipe.srm}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">v{recipe.version}</span>
                  <span className="text-amber-600 font-medium">Fork {recipe.forkCount} 次</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
