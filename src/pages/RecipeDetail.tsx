import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, GitBranch, GitFork, Plus, Thermometer, Droplets, Scale, Leaf, Calendar, TrendingUp, Clock, Star, Eye, EyeOff, Edit2, Trash2, GitCompare, DollarSign, GitCompareArrows, MessageSquare } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BATCH_STATUS_LABELS, HOP_STAGE_LABELS } from '../../shared/types.js';
import { cn } from '../lib/utils.js';
import { calculateTotalMaltCost, calculateTotalHopCost, calculateYeastCost, calculateMaltCost, calculateHopCost, formatCurrency } from '../utils/calculations.js';
import RecipeLineageTree from '../components/RecipeLineageTree.js';
import BatchCompareChart from '../components/BatchCompareChart.js';
import CommentSection from '../components/CommentSection.js';
import StarRating from '../components/StarRating.js';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRecipe, batches, tastings, recipeVersions, recipeLineage, loading, error, fetchRecipeById, fetchBatches, fetchTastings, fetchRecipeVersions, fetchRecipeLineage, createNewVersion, forkRecipe, deleteRecipe, updateRecipe } = useBrewStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'lineage' | 'batches' | 'tastings' | 'comments'>('overview');
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [branchName, setBranchName] = useState('main');
  const [versionDescription, setVersionDescription] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());

  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatchIds(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const selectedBatches = useMemo(() => {
    return batches.filter(b => selectedBatchIds.has(b.id) && b.readings.length > 0);
  }, [batches, selectedBatchIds]);

  useEffect(() => {
    if (id) {
      fetchRecipeById(id);
      fetchBatches(id);
      fetchTastings({ recipeId: id });
      fetchRecipeVersions(id);
      fetchRecipeLineage(id);
    }
    return () => {
      useBrewStore.getState().clearCurrent();
    };
  }, [id, fetchRecipeById, fetchBatches, fetchTastings, fetchRecipeVersions, fetchRecipeLineage]);

  const handleCreateVersion = async () => {
    if (!currentRecipe || !branchName.trim()) return;
    const updates = versionDescription ? { description: `${currentRecipe.description}\n\n${versionDescription}` } : {};
    const result = await createNewVersion(currentRecipe.id, branchName.trim(), updates);
    if (result) {
      setShowNewVersionModal(false);
      setBranchName('main');
      setVersionDescription('');
      navigate(`/recipes/${result.id}`);
    }
  };

  const handleFork = async () => {
    if (!currentRecipe) return;
    const result = await forkRecipe(currentRecipe.id, 'currentUser');
    if (result) {
      alert('配方已 Fork 到您的配方库！');
      navigate(`/recipes/${result.id}`);
    }
  };

  const handleDelete = async () => {
    if (!currentRecipe) return;
    if (confirm('确定要删除这个配方吗？所有相关的批次记录将保留。')) {
      await deleteRecipe(currentRecipe.id);
      navigate('/recipes');
    }
  };

  const togglePublic = async () => {
    if (!currentRecipe) return;
    await updateRecipe(currentRecipe.id, { isPublic: !currentRecipe.isPublic });
  };

  if (loading && !currentRecipe) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Scale size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!currentRecipe) return <div className="text-center py-16">配方不存在</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/recipes')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回配方列表
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-amber-900">{currentRecipe.name}</h1>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                {currentRecipe.style}
              </span>
              <span className="text-sm text-gray-500 border border-gray-200 px-2 py-1 rounded">
                v{currentRecipe.version}
              </span>
              {currentRecipe.branchName && (
                <span className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 px-2 py-1 rounded">
                  <GitBranch size={14} />
                  {currentRecipe.branchName}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-2">
              {currentRecipe.rating !== undefined && currentRecipe.rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={currentRecipe.rating} readOnly size="sm" showValue />
                  <span className="text-sm text-gray-500">
                    ({currentRecipe.commentCount || 0} 条评价)
                  </span>
                </div>
              )}
            </div>
            <p className="text-gray-600">{currentRecipe.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={togglePublic}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                currentRecipe.isPublic
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {currentRecipe.isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
              {currentRecipe.isPublic ? '公开' : '私有'}
            </button>
            <button
              onClick={() => setShowNewVersionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors"
            >
              <GitBranch size={18} />
              新版本
            </button>
            <button
              onClick={handleFork}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-medium transition-colors"
            >
              <GitFork size={18} />
              Fork
            </button>
            {recipeVersions.length >= 2 && (
              <Link
                to={`/recipes/compare/${currentRecipe.id}/${recipeVersions.find(r => r.id !== currentRecipe.id)?.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                <GitCompare size={18} />
                对比
              </Link>
            )}
            <Link
              to={`/recipes/${currentRecipe.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium transition-colors"
            >
              <Edit2 size={18} />
              编辑
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
            >
              <Trash2 size={18} />
              删除
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-amber-700">{currentRecipe.abv}%</div>
          <div className="text-sm text-gray-500">酒精度</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-amber-700">{currentRecipe.ibu}</div>
          <div className="text-sm text-gray-500">苦度 (IBU)</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-amber-700">{currentRecipe.srm}</div>
          <div className="text-sm text-gray-500">色度 (SRM)</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-amber-700">{currentRecipe.originalGravity}</div>
          <div className="text-sm text-gray-500">原始比重</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-amber-700">{currentRecipe.batchSize}L</div>
          <div className="text-sm text-gray-500">批次容量</div>
        </div>
      </div>

      {(calculateTotalMaltCost(currentRecipe.malts) > 0 || calculateTotalHopCost(currentRecipe.hops) > 0 || calculateYeastCost(currentRecipe.yeast) > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="text-amber-700" size={18} />
            <span className="font-semibold text-amber-900">预计物料成本</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-amber-700">{formatCurrency(calculateTotalMaltCost(currentRecipe.malts))}</div>
              <div className="text-xs text-gray-500">麦芽</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">{formatCurrency(calculateTotalHopCost(currentRecipe.hops))}</div>
              <div className="text-xs text-gray-500">酒花</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-700">{formatCurrency(calculateYeastCost(currentRecipe.yeast))}</div>
              <div className="text-xs text-gray-500">酵母</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-900">
                {formatCurrency(calculateTotalMaltCost(currentRecipe.malts) + calculateTotalHopCost(currentRecipe.hops) + calculateYeastCost(currentRecipe.yeast))}
              </div>
              <div className="text-xs text-gray-500">
                每升 {formatCurrency((calculateTotalMaltCost(currentRecipe.malts) + calculateTotalHopCost(currentRecipe.hops) + calculateYeastCost(currentRecipe.yeast)) / currentRecipe.batchSize)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap gap-8">
          {(['overview', 'versions', 'lineage', 'batches', 'tastings', 'comments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab === 'overview' ? '配方详情' :
               tab === 'versions' ? `版本历史 (${recipeVersions.length})` :
               tab === 'lineage' ? `演变谱系 (${recipeLineage.length})` :
               tab === 'batches' ? `酿造批次 (${batches.length})` :
               tab === 'tastings' ? `品鉴记录 (${tastings.length})` :
               `评论与评分`}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="text-amber-600" size={20} />
              麦芽配比
            </h3>
            <div className="space-y-3">
              {currentRecipe.malts.map(malt => (
                <div key={malt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{malt.name}</div>
                    <div className="text-sm text-gray-500">色度: {malt.color}</div>
                    {malt.pricePerKg && <div className="text-xs text-gray-400">单价: ¥{malt.pricePerKg}/kg</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-amber-700">{malt.weight} kg</div>
                    <div className="text-sm text-gray-500">{malt.percentage}%</div>
                    {malt.pricePerKg && <div className="text-sm font-medium text-amber-600">{formatCurrency(calculateMaltCost(malt))}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Leaf className="text-green-600" size={20} />
              酒花投放
            </h3>
            <div className="space-y-3">
              {currentRecipe.hops.map(hop => (
                <div key={hop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{hop.name}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        {HOP_STAGE_LABELS[hop.stage]}
                      </span>
                      <span>α酸: {hop.alphaAcid}%</span>
                    </div>
                    {hop.pricePerKg && <div className="text-xs text-gray-400 mt-1">单价: ¥{hop.pricePerKg}/kg</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-amber-700">{hop.weight} g</div>
                    <div className="text-sm text-gray-500">
                      {hop.time > 0 ? `${hop.time} 分钟` : hop.stage === 'dryhop' ? '干投' : '旋沉'}
                    </div>
                    {hop.pricePerKg && <div className="text-sm font-medium text-green-600 mt-1">{formatCurrency(calculateHopCost(hop))}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={20} />
              酵母菌株
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600">菌株</span>
                <span className="font-semibold text-gray-900">{currentRecipe.yeast.strain}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-gray-600">品牌</span>
                <span className="font-semibold text-gray-900">{currentRecipe.yeast.brand}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-gray-600">发酵度</span>
                <span className="font-semibold text-gray-900">{currentRecipe.yeast.attenuation}%</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-gray-600">发酵温度</span>
                <span className="font-semibold text-gray-900">
                  {currentRecipe.yeast.temperature[0]} - {currentRecipe.yeast.temperature[1]}°C
                </span>
              </div>
              {currentRecipe.yeast.price && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">价格</span>
                  <span className="font-semibold text-purple-700">{formatCurrency(currentRecipe.yeast.price)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Thermometer className="text-red-500" size={20} />
              糖化温度曲线
            </h3>
            <div className="space-y-3">
              {currentRecipe.mashSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{step.description}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Thermometer size={14} />
                        {step.temperature}°C
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {step.duration} 分钟
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">版本历史</h3>
            <p className="text-sm text-gray-500 mt-1">该配方的所有版本和分支</p>
          </div>
          <div className="divide-y divide-gray-100">
            {recipeVersions.map((version, index) => (
              <div
                key={version.id}
                className={cn(
                  "p-6 hover:bg-gray-50 cursor-pointer transition-colors",
                  version.id === currentRecipe.id ? "bg-amber-50" : ""
                )}
                onClick={() => navigate(`/recipes/${version.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow"></div>
                      {index < recipeVersions.length - 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-200"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">v{version.version}</span>
                        {version.branchName && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded">
                            <GitBranch size={12} />
                            {version.branchName}
                          </span>
                        )}
                        {version.id === currentRecipe.id && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">当前</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <Calendar size={14} className="inline mr-1" />
                        {new Date(version.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {version.parentVersion && (
                      <div className="text-sm text-gray-500">
                        基于 v{version.parentVersion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'lineage' && (
        <RecipeLineageTree
          recipes={recipeLineage}
          currentRecipeId={currentRecipe?.id || ''}
        />
      )}

      {activeTab === 'batches' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">酿造批次</h3>
            <button
              onClick={() => navigate(`/batches/new?recipeId=${currentRecipe.id}`)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              开始酿造
            </button>
          </div>
          {batches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Droplets className="mx-auto text-gray-300 mb-4" size={64} />
              <h4 className="text-lg font-medium text-gray-600 mb-2">暂无酿造批次</h4>
              <p className="text-gray-400 mb-6">点击上方按钮开始您的第一次酿造</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {batches.map(batch => (
                  <div
                    key={batch.id}
                    className={cn(
                      "bg-white rounded-xl p-6 border transition-shadow",
                      selectedBatchIds.has(batch.id)
                        ? "border-amber-400 shadow-md ring-1 ring-amber-200"
                        : "border-gray-100 hover:shadow-md cursor-pointer"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.has(batch.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleBatchSelection(batch.id);
                          }}
                          disabled={batch.readings.length === 0}
                          title={batch.readings.length === 0 ? '该批次暂无发酵读数' : '选择此批次进行对比'}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 shrink-0"
                        />
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => navigate(`/batches/${batch.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-semibold text-gray-900">{batch.name}</h4>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium",
                              batch.status === 'completed' ? 'bg-green-100 text-green-700' :
                              batch.status === 'fermenting' ? 'bg-amber-100 text-amber-700' :
                              batch.status === 'conditioning' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            )}>
                              {BATCH_STATUS_LABELS[batch.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {batch.brewDate}
                            </span>
                            <span>配方版本: v{batch.recipeVersion}</span>
                            {batch.originalGravityActual && (
                              <span>OG: {batch.originalGravityActual}</span>
                            )}
                            {batch.finalGravityActual && (
                              <span>FG: {batch.finalGravityActual}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-sm text-gray-500">
                          {batch.readings.length} 条发酵记录
                        </div>
                        <div className="text-sm text-gray-500">
                          {batch.deviations.length} 个参数偏差
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedBatchIds.size > 0 && (
                <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800">
                      <GitCompareArrows size={18} />
                      <span className="text-sm font-medium">
                        已选择 {selectedBatchIds.size} 个批次{selectedBatches.length < selectedBatchIds.size && ` (${selectedBatchIds.size - selectedBatches.length} 个无读数)`}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedBatchIds(new Set())}
                      className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors"
                    >
                      清除选择
                    </button>
                  </div>
                </div>
              )}

              {selectedBatches.length >= 2 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GitCompareArrows className="text-amber-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">批次发酵曲线对比</h3>
                    <span className="text-sm text-gray-500">({selectedBatches.length} 个批次)</span>
                  </div>
                  <BatchCompareChart batches={selectedBatches} />
                </div>
              )}

              {selectedBatches.length === 1 && (
                <div className="mt-6 flex items-center justify-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400">
                  <GitCompareArrows size={24} className="mr-2 opacity-50" />
                  <span>请选择至少 2 个有发酵读数的批次进行对比</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'tastings' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">品鉴记录</h3>
            {batches.length > 0 && (
              <button
                onClick={() => navigate(`/tastings/new?recipeId=${currentRecipe.id}&batchId=${batches[0].id}`)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                添加品鉴
              </button>
            )}
          </div>
          {tastings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Star className="mx-auto text-gray-300 mb-4" size={64} />
              <h4 className="text-lg font-medium text-gray-600 mb-2">暂无品鉴记录</h4>
              <p className="text-gray-400">完成酿造后可以添加品鉴评分</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tastings.map(tasting => (
                <div
                  key={tasting.id}
                  className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/tastings/${tasting.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{tasting.name}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        {tasting.batchName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-700">{tasting.totalScore}</div>
                      <div className="text-xs text-gray-500">总分</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700">{tasting.appearance.score}</div>
                      <div className="text-xs text-gray-500">外观</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700">{tasting.aroma.score}</div>
                      <div className="text-xs text-gray-500">香气</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700">{tasting.flavor.score}</div>
                      <div className="text-xs text-gray-500">风味</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700">{tasting.mouthfeel.score}</div>
                      <div className="text-xs text-gray-500">口感</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-700">{tasting.overall.score}</div>
                      <div className="text-xs text-gray-500">整体</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{tasting.overall.impressions}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && currentRecipe && (
        <CommentSection
          recipeId={currentRecipe.id}
          currentUserId="currentUser"
          currentUserName="我"
        />
      )}

      {showNewVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">创建新版本</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分支名称</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="如: main, experimental, hop-test"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版本说明 (可选)</label>
                <textarea
                  value={versionDescription}
                  onChange={(e) => setVersionDescription(e.target.value)}
                  placeholder="描述这个版本的改动..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewVersionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={!branchName.trim()}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建版本
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
