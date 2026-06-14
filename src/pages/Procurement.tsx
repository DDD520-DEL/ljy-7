import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Edit2, Trash2, Scale, Leaf, Beaker, X, Check, Search, TrendingUp, Building2, Calendar, DollarSign, Hash } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useBrewStore } from '../store/brewStore.js';
import { INGREDIENT_TYPE_LABELS, INGREDIENT_UNIT_LABELS, IngredientType, ProcurementRecord, ProcurementPriceTrend } from '../../shared/types.js';
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

const chartColors: Record<IngredientType, string> = {
  malt: '#f59e0b',
  hop: '#10b981',
  yeast: '#8b5cf6',
};

function PriceChart({ trends, type }: { trends: ProcurementPriceTrend[]; type: IngredientType }) {
  const chartData = useMemo(() => {
    return trends.map(t => ({
      ...t,
      dateLabel: new Date(t.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    }));
  }, [trends]);

  const priceRange = useMemo(() => {
    if (trends.length === 0) return [0, 100];
    const prices = trends.map(t => t.unitPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 10;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [trends]);

  if (trends.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <TrendingUp size={48} className="mx-auto mb-2 opacity-30" />
          <p>至少需要2条采购记录才能显示价格趋势</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12 }}
            label={{ value: '采购日期', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#9ca3af' }}
          />
          <YAxis
            domain={priceRange}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `¥${v}`}
            label={{ value: '单价 (元)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload as ProcurementPriceTrend;
              return (
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">原料:</span>
                      <span className="font-medium">{data.ingredientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">供应商:</span>
                      <span className="font-medium">{data.supplierName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">单价:</span>
                      <span className="font-bold text-amber-600">¥{data.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend formatter={() => `${INGREDIENT_TYPE_LABELS[type]}采购单价`} />
          <Line
            type="monotone"
            dataKey="unitPrice"
            stroke={chartColors[type]}
            strokeWidth={2}
            dot={{ r: 4, fill: chartColors[type] }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Procurement() {
  const navigate = useNavigate();
  const { procurements, priceTrends, inventory, loading, error, fetchProcurements, fetchPriceTrends, createProcurement, updateProcurement, deleteProcurement, fetchInventory } = useBrewStore();
  const [typeFilter, setTypeFilter] = useState<IngredientType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChart, setShowChart] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<ProcurementRecord | null>(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    ingredientType: 'malt' as IngredientType,
    ingredientName: '',
    unitPrice: 0,
    quantity: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    inventoryItemId: '',
    note: '',
  });

  useEffect(() => {
    fetchProcurements();
    fetchInventory();
  }, [fetchProcurements, fetchInventory]);

  useEffect(() => {
    if (typeFilter !== 'all') {
      fetchPriceTrends(typeFilter);
    }
  }, [typeFilter, fetchPriceTrends]);

  useEffect(() => {
    const matchingInventory = inventory.find(
      i => i.type === formData.ingredientType && i.name === formData.ingredientName
    );
    if (matchingInventory) {
      setFormData(prev => ({ ...prev, inventoryItemId: matchingInventory.id }));
    } else {
      setFormData(prev => ({ ...prev, inventoryItemId: '' }));
    }
  }, [formData.ingredientType, formData.ingredientName, inventory]);

  const filteredProcurements = procurements
    .filter(item => {
      if (typeFilter !== 'all' && item.ingredientType !== typeFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.supplierName.toLowerCase().includes(query) ||
          item.ingredientName.toLowerCase().includes(query);
      }
      return true;
    });

  const totalSpent = filteredProcurements.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalQuantity = filteredProcurements.reduce((sum, p) => sum + p.quantity, 0);

  const handleAdd = async () => {
    if (!formData.supplierName.trim() || !formData.ingredientName.trim() || formData.unitPrice <= 0 || formData.quantity <= 0) return;
    const result = await createProcurement(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
      fetchInventory();
      if (typeFilter !== 'all') {
        fetchPriceTrends(typeFilter);
      }
    }
  };

  const handleEdit = async () => {
    if (!showEditModal) return;
    const result = await updateProcurement(showEditModal.id, formData);
    if (result) {
      setShowEditModal(null);
      resetForm();
      if (typeFilter !== 'all') {
        fetchPriceTrends(typeFilter);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条采购记录吗？删除后库存不会回滚。')) {
      await deleteProcurement(id);
      if (typeFilter !== 'all') {
        fetchPriceTrends(typeFilter);
      }
    }
  };

  const openEditModal = (item: ProcurementRecord) => {
    setShowEditModal(item);
    setFormData({
      supplierName: item.supplierName,
      ingredientType: item.ingredientType,
      ingredientName: item.ingredientName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      purchaseDate: item.purchaseDate,
      inventoryItemId: item.inventoryItemId || '',
      note: item.note || '',
    });
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      ingredientType: 'malt',
      ingredientName: '',
      unitPrice: 0,
      quantity: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      inventoryItemId: '',
      note: '',
    });
  };

  const matchingInventoryItems = inventory.filter(i => i.type === formData.ingredientType);

  if (loading && procurements.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Package size={48} /></div></div>;
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
              原料采购记录
            </h1>
            <p className="text-gray-600 mt-1">
              管理麦芽、酒花、酵母的采购记录，入库自动更新库存
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            新增采购
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">采购总金额</div>
              <div className="text-2xl font-bold text-gray-900">¥{totalSpent.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Hash className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">采购记录数</div>
              <div className="text-2xl font-bold text-gray-900">{filteredProcurements.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">采购总量</div>
              <div className="text-2xl font-bold text-gray-900">{totalQuantity.toFixed(2)}</div>
            </div>
          </div>
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
              placeholder="搜索供应商或原料名称..."
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
              全部 ({procurements.length})
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
                {INGREDIENT_TYPE_LABELS[type]} ({procurements.filter(i => i.ingredientType === type).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {showChart && typeFilter !== 'all' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              {INGREDIENT_TYPE_LABELS[typeFilter]}采购价格趋势
            </h3>
            <button
              onClick={() => setShowChart(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <PriceChart trends={priceTrends} type={typeFilter} />
        </div>
      )}

      {showChart && typeFilter === 'all' && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
          <p className="text-amber-800 text-sm flex items-center gap-2">
            <TrendingUp size={16} />
            请选择具体的原料品类（麦芽/酒花/酵母）查看价格趋势图
          </p>
        </div>
      )}

      {filteredProcurements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无采购记录</h3>
          <p className="text-gray-400 mb-6">点击上方按钮添加您的第一条采购记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">采购日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原料</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">供应商</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">总价</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProcurements.map((item) => {
                  const invItem = inventory.find(i => i.id === item.inventoryItemId);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{new Date(item.purchaseDate).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white', typeColors[item.ingredientType])}>
                            {typeIcons[item.ingredientType]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.ingredientName}</div>
                            <div className="text-xs text-gray-500">{INGREDIENT_TYPE_LABELS[item.ingredientType]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{item.supplierName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">¥{item.unitPrice.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">/{INGREDIENT_UNIT_LABELS[item.ingredientType]}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{item.quantity}</div>
                        <div className="text-xs text-gray-500">{INGREDIENT_UNIT_LABELS[item.ingredientType]}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-amber-600">¥{item.totalPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          {invItem && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                              <Check size={12} className="mr-1" />
                              已入库
                            </span>
                          )}
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
                        {item.note && (
                          <div className="text-xs text-gray-400 mt-1">{item.note}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {showEditModal ? '编辑采购记录' : '新增采购记录'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">采购日期</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商名称</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  placeholder="如: 麦芽贸易有限公司"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原料类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['malt', 'hop', 'yeast'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, ingredientType: t, ingredientName: '', inventoryItemId: '' }))}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-1",
                        formData.ingredientType === t
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
                <label className="block text-sm font-medium text-gray-700 mb-1">原料名称</label>
                {matchingInventoryItems.length > 0 ? (
                  <select
                    value={formData.ingredientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, ingredientName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">-- 选择库存原料 --</option>
                    {matchingInventoryItems.map(item => (
                      <option key={item.id} value={item.name}>
                        {item.name} (库存: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.ingredientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, ingredientName: e.target.value }))}
                    placeholder="如: Pale Malt (2 Row)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                )}
                {matchingInventoryItems.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    提示：先在库存管理中添加原料，此处可选择并自动入库
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    单价 (元/{INGREDIENT_UNIT_LABELS[formData.ingredientType]})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    数量 ({INGREDIENT_UNIT_LABELS[formData.ingredientType]})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              {formData.unitPrice > 0 && formData.quantity > 0 && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">预估总价</span>
                    <span className="text-xl font-bold text-amber-600">
                      ¥{(formData.unitPrice * formData.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注 (可选)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="采购备注、批号、保质期等..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {formData.inventoryItemId
                      ? `采购入库后将自动增加「${formData.ingredientName}」的库存量`
                      : '若选择库存中已有的原料，采购后将自动增加对应库存'}
                  </span>
                </p>
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
                  disabled={!formData.supplierName.trim() || !formData.ingredientName.trim() || formData.unitPrice <= 0 || formData.quantity <= 0}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showEditModal ? '保存修改' : '确认采购'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
