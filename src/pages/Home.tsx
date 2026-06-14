import { useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Beer, ListTodo, Star, Users, TrendingUp, Clock, AlertCircle, CheckCircle, Plus, AlertTriangle, X, Package, Scale, Leaf, Beaker, Bell, CalendarClock } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BATCH_STATUS_LABELS, INGREDIENT_TYPE_LABELS, IngredientType, InventoryItem } from '../../shared/types.js';
import { formatDate, formatABV, getDaysSince, getAnomalousBatches, formatGravity } from '../utils/calculations.js';
import { cn } from '../lib/utils.js';
import BrewCalendar from '../components/BrewCalendar.js';
import BrewStatsPanel from '../components/BrewStatsPanel.js';
import RecipeRecommendations from '../components/RecipeRecommendations.js';

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
  const { recipes, batches, calendarBatches, tastings, userBrewStats, inventory, brewPlans, activeReminders, loading, fetchRecipes, fetchBatches, fetchBatchesByDateRange, fetchTastings, fetchUserStats, fetchInventory, fetchBrewPlans, fetchActiveReminders, fetchRecommendedRecipes } = useBrewStore();

  useEffect(() => {
    fetchRecipes();
    fetchBatches();
    fetchTastings();
    fetchUserStats('brewer1');
    fetchInventory({ lowStock: true });
    fetchBrewPlans();
    fetchActiveReminders();
    fetchRecommendedRecipes('brewer1', false, 6);
  }, [fetchRecipes, fetchBatches, fetchTastings, fetchUserStats, fetchInventory, fetchBrewPlans, fetchActiveReminders, fetchRecommendedRecipes]);

  const loadCalendarBatches = useCallback((year: number, month: number) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    fetchBatchesByDateRange(startDate, endDate);
    fetchBrewPlans({ startDate, endDate });
  }, [fetchBatchesByDateRange, fetchBrewPlans]);

  useEffect(() => {
    const now = new Date();
    loadCalendarBatches(now.getFullYear(), now.getMonth());
  }, [loadCalendarBatches]);

  const anomalousBatches = useMemo(() => {
    return getAnomalousBatches(batches, recipes);
  }, [batches, recipes]);

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

      {activeReminders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bell size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">酿造计划提醒</h2>
                <p className="text-amber-100 text-sm">
                  今日有 <span className="font-bold text-white">{activeReminders.length}</span> 条提醒
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {activeReminders.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20"
                >
                  <div className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{plan.title}</span>
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {plan.date}
                        </span>
                      </div>
                      <p className="text-sm text-amber-100 flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5" />
                        {plan.reminderText}
                      </p>
                      {plan.description && (
                        <p className="text-xs text-amber-200/80 mt-1">{plan.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {userBrewStats && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            个人酿造统计
          </h2>
          <BrewStatsPanel stats={userBrewStats} />
        </div>
      )}

      {inventory.length > 0 && (
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Package size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">原料补货提醒</h2>
                  <p className="text-orange-100 mt-1">
                    有 <span className="font-bold text-white">{inventory.length}</span> 项原料库存低于警戒值，建议及时补货！
                  </p>
                </div>
              </div>
              <Link
                to="/inventory"
                className="bg-white text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors text-sm flex items-center gap-1"
              >
                管理库存 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inventory.slice(0, 6).map((item: InventoryItem) => {
                const typeIcon = item.type === 'malt' ? <Scale size={14} /> : item.type === 'hop' ? <Leaf size={14} /> : <Beaker size={14} />;
                const isOut = item.currentStock === 0;
                return (
                  <Link
                    key={item.id}
                    to="/inventory"
                    className={cn(
                      "block rounded-xl p-3 transition-colors border",
                      isOut
                        ? "bg-red-500/30 border-white/30 hover:bg-red-500/40"
                        : "bg-white/10 border-white/20 hover:bg-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white/80 shrink-0">{typeIcon}</span>
                        <span className="font-medium text-white truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-white/60 shrink-0 ml-2">
                        {INGREDIENT_TYPE_LABELS[item.type as IngredientType]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "text-lg font-bold",
                          isOut ? "text-red-200" : "text-white"
                        )}>
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-white/60">{item.unit}</span>
                      </div>
                      <div className="text-xs text-white/70">
                        警戒: {item.minStock}{item.unit}
                      </div>
                    </div>
                    {isOut && (
                      <div className="mt-1 text-xs text-red-200 font-medium flex items-center gap-1">
                        <AlertTriangle size={12} /> 缺货
                      </div>
                    )}
                  </Link>
                );
              })}
              {inventory.length > 6 && (
                <Link
                  to="/inventory"
                  className="flex items-center justify-center rounded-xl p-3 bg-white/5 border border-white/20 hover:bg-white/10 transition-colors text-white/80 text-sm"
                >
                  还有 {inventory.length - 6} 项 →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {anomalousBatches.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-lg overflow-hidden animate-pulse">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">发酵异常预警</h2>
                  <p className="text-red-100 mt-1">
                    检测到 <span className="font-bold text-white">{anomalousBatches.length}</span> 个批次出现连续异常，需要立即关注！
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {anomalousBatches.map(({ batch, recipe, anomaly }) => (
                <Link
                  key={batch.id}
                  to={`/batches/${batch.id}`}
                  className="block bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-colors border border-white/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <AlertCircle size={18} className="text-red-200" />
                          {batch.name}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          'bg-white/20 text-white'
                        )}>
                          {BATCH_STATUS_LABELS[batch.status as keyof typeof BATCH_STATUS_LABELS]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-red-100">
                        <span>配方: {recipe?.name || '未知配方'}</span>
                        <span>酿造日: {formatDate(batch.brewDate)}</span>
                        <span>第 {getDaysSince(batch.brewDate)} 天</span>
                      </div>
                      <div className="mt-3 bg-black/20 rounded-lg p-3">
                        <div className="text-sm text-white font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle size={14} />
                          {anomaly.message}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {anomaly.lastDeviations.slice(-3).map((d, i) => (
                            <div key={i} className="bg-white/10 rounded px-2 py-1">
                              <span className="text-red-200">{d.date.slice(5)}</span>
                              <span className="text-white mx-2">实际 {formatGravity(d.actual)}</span>
                              <span className="text-red-200">vs 预期 {formatGravity(d.expected)}</span>
                              <span className={cn(
                                "ml-2 font-bold",
                                d.deviation > 0 ? "text-yellow-300" : "text-blue-300"
                              )}>
                                ({d.deviation > 0 ? '+' : ''}{formatGravity(d.deviation)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-white/80 flex items-center gap-1 group-hover:text-white transition-colors">
                      查看详情 →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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

      <BrewCalendar batches={calendarBatches} brewPlans={brewPlans} onMonthChange={loadCalendarBatches} />

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

      <RecipeRecommendations userId="brewer1" />

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
