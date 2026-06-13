import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Edit2, Trash2, AlertTriangle, Scale, Leaf, Beaker, X, Check, RefreshCw, Search } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { INGREDIENT_TYPE_LABELS, IngredientType, InventoryItem } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

const typeIcons: Record<IngredientType, React.ReactNode> = {
  malt: <Scale className="w-5 h-5" />,
  hop: <Leaf className="w-5 h-5" />,
  yeast: <Beaker className="w-5 h-5" />,
};

const typeColors: Record<IngredientType, string> = {
  malt: 'from-amber-500 to-orange-600',
  hop: 'from-green-500 to-emerald-600',
  yeast: 'from-purple-500 to-violet-600',
};

const typeBgColors: Record<IngredientType, string> = {
  malt: 'bg-amber-50 border-amber-200',
  hop: 'bg-green-50 border-green-200',
  yeast: 'bg-purple-50 border-purple-200',
};

export default function Inventory() {
  const navigate = useNavigate();
  const { inventory, loading, error, fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, restockInventory } = useBrewStore();
  const [typeFilter, setTypeFilter] = useState<IngredientType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<InventoryItem | null>(null);
  const [showRestockModal, setShowRestockModal] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(0);
  const [formData, setFormData] = useState({
    type: 'malt' as IngredientType,
    name: '',
    currentStock: 0,
    minStock: 0,
    unit: 'kg',
    note: '',
  });

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (formData.type === 'malt') {
      setFormData(prev => ({ ...prev, unit: 'kg' }));
    } else if (formData.type === 'hop') {
      setFormData(prev => ({ ...prev, unit: 'g' }));
    } else {
      setFormData(prev => ({ ...prev, unit: '份' }));
    }
  }, [formData.type]);

  const filteredInventory = inventory
    .filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aLow = a.currentStock <= a.minStock ? 1 : 0;
      const bLow = b.currentStock <= b.minStock ? 1 : 0;
      if (aLow !== bLow) return bLow - aLow;
      return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
    });

  const groupedInventory = filteredInventory.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<IngredientType, InventoryItem[]>);

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    const result = await createInventoryItem(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!showEditModal) return;
    const result = await updateInventoryItem(showEditModal.id, {
      type: formData.type,
      name: formData.name,
      currentStock: formData.currentStock,
      minStock: formData.minStock,
      unit: formData.unit,
      note: formData.note,
    });
    if (result) {
      setShowEditModal(null);
      resetForm();
    }
  };

  const handleRestock = async () => {
    if (!showRestockModal || restockAmount <= 0) return;
    const result = await restockInventory(showRestockModal.id, restockAmount);
    if (result) {
      setShowRestockModal(null);
      setRestockAmount(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个库存项吗？')) {
      await deleteInventoryItem(id);
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setShowEditModal(item);
    setFormData({
      type: item.type,
      name: item.name,
      currentStock: item.currentStock,
      minStock: item.minStock,
      unit: item.unit,
      note: item.note || '',
    });
  };

  const openRestockModal = (item: InventoryItem) => {
    setShowRestockModal(item);
    setRestockAmount(0);
  };

  const resetForm = () => {
    setFormData({
      type: 'malt',
      name: '',
      currentStock: 0,
      minStock: 0,
      unit: 'kg',
      note: '',
    });
  };

  const getStockPercentage = (item: InventoryItem) => {
    if (item.minStock === 0) return 100;
    return Math.min(100, Math.round((item.currentStock / (item.minStock * 2)) * 100));
  };

  const lowStockCount = inventory.filter(i => i.currentStock <= i.minStock).length;

  if (loading && inventory.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Package size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回首页
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
              <Package className="text-amber-600" />
              原料库存管理
            </h1>
            <p className="text-gray-600 mt-1">
              维护麦芽、酒花、酵母的库存和警戒值
              {lowStockCount > 0 && (
                <span className="ml-2 text-red-600 font-medium flex items-center gap-1 inline-flex">
                  <AlertTriangle size={14} />
                  {lowStockCount} 项原料需要补货
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            添加原料
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索原料名称..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                typeFilter === 'all' ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              全部 ({inventory.length})
            </button>
            {(['malt', 'hop', 'yeast'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  typeFilter === type ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {typeIcons[type]}
                {INGREDIENT_TYPE_LABELS[type]} ({inventory.filter(i => i.type === type).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无库存数据</h3>
          <p className="text-gray-400 mb-6">点击上方按钮添加您的第一种原料</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(groupedInventory) as IngredientType[]).map(type => (
            <div key={type}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', typeColors[type])}>
                  {typeIcons[type]}
                </div>
                {INGREDIENT_TYPE_LABELS[type]}
                <span className="text-sm font-normal text-gray-500">({groupedInventory[type].length} 项)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedInventory[type].map(item => {
                  const isLow = item.currentStock <= item.minStock;
                  const isOut = item.currentStock === 0;
                  const percentage = getStockPercentage(item);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl p-5 border-2 transition-all hover:shadow-md",
                        isOut ? "border-red-300 bg-red-50" :
                        isLow ? "border-amber-300 bg-amber-50" :
                        typeBgColors[type]
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          {item.note && <p className="text-xs text-gray-500 mt-1">{item.note}</p>}
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <button
                            onClick={() => openRestockModal(item)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="补货"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">当前库存</div>
                          <div className={cn(
                            "text-2xl font-bold",
                            isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-900"
                          )}>
                            {item.currentStock}
                            <span className="text-sm font-normal ml-1">{item.unit}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">最低警戒值</div>
                          <div className="text-2xl font-bold text-gray-700">
                            {item.minStock}
                            <span className="text-sm font-normal ml-1">{item.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className={cn(
                          "font-medium flex items-center gap-1",
                          isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-green-600"
                        )}>
                          {isOut ? (
                            <><AlertTriangle size={12} /> 缺货</>
                          ) : isLow ? (
                            <><AlertTriangle size={12} /> 库存偏低</>
                          ) : (
                            <><Check size={12} /> 库存充足</>
                          )}
                        </span>
                        <span className="text-gray-400">更新于 {new Date(item.updatedAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {showEditModal ? '编辑库存项' : '添加新原料'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(null); resetForm(); }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原料类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['malt', 'hop', 'yeast'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-1",
                        formData.type === t
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      )}
                    >
                      {typeIcons[t]}
                      <span className="text-sm font-medium">{INGREDIENT_TYPE_LABELS[t]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如: Pale Malt (2 Row)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">当前库存</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <span className="flex items-center text-gray-500 text-sm w-12">{formData.unit}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低警戒值</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <span className="flex items-center text-gray-500 text-sm w-12">{formData.unit}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注 (可选)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="供应商、到货日期等..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(null); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={showEditModal ? handleEdit : handleAdd}
                  disabled={!formData.name.trim()}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showEditModal ? '保存修改' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">补货</h3>
              <button
                onClick={() => { setShowRestockModal(null); setRestockAmount(0); }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{showRestockModal.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                当前: {showRestockModal.currentStock} {showRestockModal.unit} / 警戒值: {showRestockModal.minStock} {showRestockModal.unit}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  补货数量 ({showRestockModal.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  placeholder="输入数量..."
                />
                {restockAmount > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    补货后库存: {(showRestockModal.currentStock + restockAmount).toFixed(2)} {showRestockModal.unit}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRestockModal(null); setRestockAmount(0); }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRestock}
                  disabled={restockAmount <= 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认补货
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
