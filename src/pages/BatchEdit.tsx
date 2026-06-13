import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Droplets, Plus, Calendar, AlertCircle, Check, X, Package, Scale, Leaf, Beaker, AlertTriangle } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BATCH_STATUS_LABELS, INGREDIENT_TYPE_LABELS, Batch, Recipe, IngredientShortage, IngredientType } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

export default function BatchEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const recipeIdFromQuery = searchParams.get('recipeId');
  const isEdit = !!id;

  const {
    recipes,
    batches,
    inventoryShortages,
    inventoryWarnings,
    loading,
    error,
    fetchRecipes,
    fetchBatches,
    fetchBatchById,
    createBatchFromRecipe,
    updateBatch,
    clearInventoryErrors,
    currentBatch,
    fetchInventoryCheck,
  } = useBrewStore();

  const [formData, setFormData] = useState({
    name: '',
    recipeId: recipeIdFromQuery || '',
    brewDate: new Date().toISOString().split('T')[0],
    status: 'planning' as Batch['status'],
    notes: '',
    recipeName: '',
    createdBy: 'currentUser',
  });

  const [showShortageModal, setShowShortageModal] = useState(false);
  const [showWarningsAfterCreate, setShowWarningsAfterCreate] = useState(false);
  const [localShortages, setLocalShortages] = useState<IngredientShortage[]>([]);
  const [localWarnings, setLocalWarnings] = useState<Array<{ type: IngredientType; name: string; current: number; minStock: number; unit: string }>>([]);

  useEffect(() => {
    fetchRecipes();
    fetchBatches();
  }, [fetchRecipes, fetchBatches]);

  useEffect(() => {
    if (isEdit && id) {
      fetchBatchById(id);
    }
  }, [isEdit, id, fetchBatchById]);

  useEffect(() => {
    if (isEdit && currentBatch && currentBatch.id === id) {
      setFormData({
        name: currentBatch.name,
        recipeId: currentBatch.recipeId,
        brewDate: currentBatch.brewDate,
        status: currentBatch.status,
        notes: currentBatch.notes,
        recipeName: currentBatch.recipeName || '',
        createdBy: currentBatch.createdBy,
      });
    }
  }, [isEdit, id, currentBatch]);

  useEffect(() => {
    if (formData.recipeId && !isEdit) {
      const recipe = recipes.find(r => r.id === formData.recipeId);
      if (recipe) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || `${recipe.name} #${batches.filter(b => b.recipeId === recipe.id).length + 1}`,
          recipeName: recipe.name,
        }));
      }
    }
  }, [formData.recipeId, recipes, batches, isEdit]);

  useEffect(() => {
    if (inventoryShortages.length > 0) {
      setLocalShortages(inventoryShortages);
      setLocalWarnings(inventoryWarnings);
      setShowShortageModal(true);
    } else if (inventoryWarnings.length > 0) {
      setLocalWarnings(inventoryWarnings);
    }
  }, [inventoryShortages, inventoryWarnings]);

  const selectedRecipe = recipes.find(r => r.id === formData.recipeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipeId || !formData.name.trim()) return;

    if (isEdit && id) {
      const result = await updateBatch(id, formData);
      if (result) {
        navigate(`/batches/${id}`);
      }
    } else {
      clearInventoryErrors();
      const result = await createBatchFromRecipe(formData.recipeId, formData);
      if (result) {
        if (result.warnings.length > 0) {
          setLocalWarnings(result.warnings);
          setShowWarningsAfterCreate(true);
        } else {
          navigate(`/batches/${result.batch.id}`);
        }
      }
    }
  };

  const shortageTypeIcons: Record<IngredientType, React.ReactNode> = {
    malt: <Scale size={16} />,
    hop: <Leaf size={16} />,
    yeast: <Beaker size={16} />,
  };

  const shortageTypeColors: Record<IngredientType, string> = {
    malt: 'bg-amber-100 text-amber-700 border-amber-200',
    hop: 'bg-green-100 text-green-700 border-green-200',
    yeast: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(isEdit ? `/batches/${id}` : '/batches')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          {isEdit ? '返回批次详情' : '返回批次列表'}
        </button>
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <Droplets className="text-amber-600" />
            {isEdit ? '编辑酿造批次' : '创建酿造批次'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? '修改酿造批次的基本信息' : '选择配方并填写批次信息，系统将自动检查和扣减原料库存'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择配方 <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-medium text-gray-900">{selectedRecipe?.name || formData.recipeName || '未知配方'}</div>
                <div className="text-sm text-gray-500 mt-1">配方不可更改</div>
              </div>
            ) : (
              <select
                value={formData.recipeId}
                onChange={(e) => setFormData(prev => ({ ...prev, recipeId: e.target.value, name: '' }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
                required
              >
                <option value="">-- 请选择配方 --</option>
                {recipes.map(recipe => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.style}) - v{recipe.version}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedRecipe && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="font-semibold text-amber-900 mb-3">配方概览</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <div className="text-gray-500 text-xs">批次容量</div>
                  <div className="font-semibold text-amber-700">{selectedRecipe.batchSize}L</div>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <div className="text-gray-500 text-xs">ABV</div>
                  <div className="font-semibold text-amber-700">{selectedRecipe.abv}%</div>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <div className="text-gray-500 text-xs">IBU</div>
                  <div className="font-semibold text-amber-700">{selectedRecipe.ibu}</div>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <div className="text-gray-500 text-xs">SRM</div>
                  <div className="font-semibold text-amber-700">{selectedRecipe.srm}</div>
                </div>
              </div>
              {!isEdit && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                    <Scale size={12} /> 麦芽 {selectedRecipe.malts.length} 种
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    <Leaf size={12} /> 酒花 {selectedRecipe.hops.length} 次
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    <Beaker size={12} /> {selectedRecipe.yeast.strain}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              批次名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="如: 经典西海岸IPA #1"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                酿造日期 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.brewDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, brewDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Batch['status'] }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {(Object.keys(BATCH_STATUS_LABELS) as Array<keyof typeof BATCH_STATUS_LABELS>).map(status => (
                  <option key={status} value={status}>
                    {BATCH_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="记录本次酿造的特殊情况、调整等..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {!isEdit && selectedRecipe && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              原料需求清单
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-600" /> 麦芽
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRecipe.malts.map(malt => (
                    <div key={malt.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <span className="text-sm text-gray-700">{malt.name}</span>
                      <span className="font-semibold text-amber-700">{malt.weight} kg</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-green-600" /> 酒花
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(() => {
                    const hopAggregate = new Map<string, number>();
                    selectedRecipe.hops.forEach(hop => {
                      hopAggregate.set(hop.name, (hopAggregate.get(hop.name) || 0) + hop.weight);
                    });
                    return Array.from(hopAggregate.entries()).map(([name, weight]) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <span className="text-sm text-gray-700">{name}</span>
                        <span className="font-semibold text-green-700">{weight} g</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <Beaker className="w-4 h-4 text-purple-600" /> 酵母
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-700 font-medium">{selectedRecipe.yeast.strain}</span>
                      <span className="text-xs text-gray-500 ml-2">({selectedRecipe.yeast.brand})</span>
                    </div>
                    <span className="font-semibold text-purple-700">1 份</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/batches/${id}` : '/batches')}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !formData.recipeId || !formData.name.trim()}
            className={cn(
              "flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> 处理中...</>
            ) : (
              <><Plus size={20} /> {isEdit ? '保存修改' : '开始酿造'}</>
            )}
          </button>
        </div>

        {error && inventoryShortages.length === 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-red-700">{error}</div>
          </div>
        )}
      </form>

      {showShortageModal && localShortages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">原料库存不足</h3>
                    <p className="text-red-100 mt-1">
                      以下 {localShortages.length} 项原料库存不足，无法创建批次，请先补货。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3">
                {localShortages.map((shortage, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-xl border-2",
                      shortageTypeColors[shortage.type]
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        shortage.type === 'malt' ? "bg-amber-200 text-amber-800" :
                        shortage.type === 'hop' ? "bg-green-200 text-green-800" :
                        "bg-purple-200 text-purple-800"
                      )}>
                        {shortageTypeIcons[shortage.type]}
                        {INGREDIENT_TYPE_LABELS[shortage.type]}
                      </span>
                    </div>
                    <div className="font-semibold text-gray-900 mb-2">{shortage.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <div className="text-gray-500 text-xs">需要</div>
                        <div className="font-bold text-gray-800">{shortage.required} <span className="text-xs font-normal">{shortage.unit}</span></div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <div className="text-gray-500 text-xs">可用</div>
                        <div className="font-bold text-red-600">{shortage.available} <span className="text-xs font-normal">{shortage.unit}</span></div>
                      </div>
                      <div className="bg-red-100 rounded-lg p-2 text-center">
                        <div className="text-red-600 text-xs">缺少</div>
                        <div className="font-bold text-red-700">{shortage.missing} <span className="text-xs font-normal">{shortage.unit}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {localWarnings.length > 0 && (
                <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                    <AlertTriangle size={18} />
                    还有 {localWarnings.length} 项原料库存偏低
                  </div>
                  <div className="space-y-1 text-sm text-amber-700">
                    {localWarnings.map((w, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span>{w.name}</span>
                        <span>{w.current}/{w.minStock} {w.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowShortageModal(false);
                  clearInventoryErrors();
                }}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowShortageModal(false);
                  clearInventoryErrors();
                  navigate('/inventory');
                }}
                className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Package size={18} />
                前往补货
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarningsAfterCreate && localWarnings.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Check size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">批次创建成功！</h3>
                  <p className="text-amber-100 mt-1">
                    但有 {localWarnings.length} 项原料库存偏低，请注意及时补货。
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {localWarnings.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">
                        {w.type === 'malt' ? <Scale size={16} /> : w.type === 'hop' ? <Leaf size={16} /> : <Beaker size={16} />}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{w.name}</span>
                    </div>
                    <span className="text-sm text-amber-700 font-medium">
                      {w.current}/{w.minStock} {w.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowWarningsAfterCreate(false);
                  clearInventoryErrors();
                  navigate('/inventory');
                }}
                className="flex-1 px-6 py-3 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Package size={18} />
                查看库存
              </button>
              <button
                onClick={() => {
                  setShowWarningsAfterCreate(false);
                  clearInventoryErrors();
                  const lastBatch = batches[batches.length - 1];
                  if (lastBatch) navigate(`/batches/${lastBatch.id}`);
                  else navigate('/batches');
                }}
                className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
              >
                查看批次
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
