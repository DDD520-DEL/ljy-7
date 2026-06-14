import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Search, Settings, Droplets, Flame, Refrigerator, Cog, Wrench } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { EQUIPMENT_TYPE_LABELS } from '../../shared/types.js';
import type { EquipmentType, Equipment } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

const typeIcons: Record<EquipmentType, React.ReactNode> = {
  mash_tun: <Droplets className="w-5 h-5" />,
  boil_kettle: <Flame className="w-5 h-5" />,
  fermenter: <Refrigerator className="w-5 h-5" />,
  cooler: <Cog className="w-5 h-5" />,
  pump: <Settings className="w-5 h-5" />,
  other: <Wrench className="w-5 h-5" />,
};

const typeColors: Record<EquipmentType, string> = {
  mash_tun: 'from-amber-500 to-orange-600',
  boil_kettle: 'from-red-500 to-orange-600',
  fermenter: 'from-blue-500 to-indigo-600',
  cooler: 'from-cyan-500 to-blue-600',
  pump: 'from-gray-500 to-slate-600',
  other: 'from-purple-500 to-violet-600',
};

const typeBgColors: Record<EquipmentType, string> = {
  mash_tun: 'bg-amber-50 border-amber-200',
  boil_kettle: 'bg-red-50 border-red-200',
  fermenter: 'bg-blue-50 border-blue-200',
  cooler: 'bg-cyan-50 border-cyan-200',
  pump: 'bg-gray-50 border-gray-200',
  other: 'bg-purple-50 border-purple-200',
};

export default function Equipment() {
  const navigate = useNavigate();
  const { equipment, loading, error, fetchEquipment, createEquipment, updateEquipment, deleteEquipment } = useBrewStore();
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'mash_tun' as EquipmentType,
    capacityLiters: 0,
    material: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    createdBy: 'currentUser',
    note: '',
  });

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const filteredEquipment = equipment
    .filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

  const groupedEquipment = filteredEquipment.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<EquipmentType, Equipment[]>);

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    const result = await createEquipment(formData);
    if (result) {
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!showEditModal) return;
    const result = await updateEquipment(showEditModal.id, formData);
    if (result) {
      setShowEditModal(null);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个设备吗？')) {
      await deleteEquipment(id);
    }
  };

  const openEditModal = (item: Equipment) => {
    setShowEditModal(item);
    setFormData({
      name: item.name,
      type: item.type,
      capacityLiters: item.capacityLiters,
      material: item.material,
      purchaseDate: item.purchaseDate,
      createdBy: item.createdBy,
      note: item.note || '',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'mash_tun' as EquipmentType,
      capacityLiters: 0,
      material: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      createdBy: 'currentUser',
      note: '',
    });
  };

  if (loading && equipment.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Settings size={48} /></div></div>;
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
              <Settings className="text-amber-600" />
              酿造设备管理
            </h1>
            <p className="text-gray-600 mt-1">
              管理您的糖化锅、煮沸锅、发酵罐等酿造设备
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            添加设备
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
              placeholder="搜索设备名称..."
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
              全部 ({equipment.length})
            </button>
            {(Object.keys(EQUIPMENT_TYPE_LABELS) as EquipmentType[]).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  typeFilter === type ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {typeIcons[type]}
                {EQUIPMENT_TYPE_LABELS[type]} ({equipment.filter(i => i.type === type).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredEquipment.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Settings className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无设备数据</h3>
          <p className="text-gray-400 mb-6">点击上方按钮添加您的第一件设备</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(groupedEquipment) as EquipmentType[]).map(type => (
            <div key={type}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', typeColors[type])}>
                  {typeIcons[type]}
                </div>
                {EQUIPMENT_TYPE_LABELS[type]}
                <span className="text-sm font-normal text-gray-500">({groupedEquipment[type].length} 件)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedEquipment[type].map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl p-5 border-2 transition-all hover:shadow-md",
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
                        <div className="text-xs text-gray-500 mb-1">容量</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {item.capacityLiters > 0 ? `${item.capacityLiters}` : '-'}
                          {item.capacityLiters > 0 && <span className="text-sm font-normal ml-1">L</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">材质</div>
                        <div className="text-lg font-semibold text-gray-700">
                          {item.material || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        购入日期: {item.purchaseDate}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Check size={12} className="text-green-500" />
                        可用
                      </span>
                    </div>
                  </div>
                ))}
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
                {showEditModal ? '编辑设备' : '添加新设备'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(EQUIPMENT_TYPE_LABELS) as EquipmentType[]).map(t => (
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
                      <span className="text-sm font-medium">{EQUIPMENT_TYPE_LABELS[t]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如: 30L不锈钢糖化锅"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">容量 (升)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.capacityLiters || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacityLiters: parseFloat(e.target.value) || 0 }))}
                    placeholder="如: 30"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                    placeholder="如: 304不锈钢"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">购入日期</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注 (可选)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="设备特性、配件、使用注意事项等..."
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
    </div>
  );
}
