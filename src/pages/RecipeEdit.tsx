import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Scale, Leaf, TrendingUp, DollarSign } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { calculateTotalMaltCost, calculateTotalHopCost, calculateYeastCost, calculateTotalCost, calculateMaltCost, calculateHopCost, formatCurrency } from '../utils/calculations.js';
import type { MaltItem, HopAddition, Yeast, MashStep } from '../../shared/types.js';
import { cn, generateId } from '../lib/utils.js';

export default function RecipeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRecipe, loading, error, fetchRecipeById, updateRecipe, createRecipe } = useBrewStore();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [style, setStyle] = useState('IPA');
  const [description, setDescription] = useState('');
  const [batchSize, setBatchSize] = useState(20);
  const [malts, setMalts] = useState<MaltItem[]>([]);
  const [hops, setHops] = useState<HopAddition[]>([]);
  const [yeast, setYeast] = useState<Yeast>({
    id: '',
    strain: '',
    brand: '',
    attenuation: 75,
    temperature: [18, 22],
    price: 0,
  });
  const [mashSteps, setMashSteps] = useState<MashStep[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      fetchRecipeById(id);
    }
  }, [id, isNew, fetchRecipeById]);

  useEffect(() => {
    if (currentRecipe && !isNew) {
      setName(currentRecipe.name);
      setStyle(currentRecipe.style);
      setDescription(currentRecipe.description);
      setBatchSize(currentRecipe.batchSize);
      setMalts(currentRecipe.malts.map(m => ({ ...m })));
      setHops(currentRecipe.hops.map(h => ({ ...h })));
      setYeast({ ...currentRecipe.yeast });
      setMashSteps(currentRecipe.mashSteps.map(s => ({ ...s })));
    }
  }, [currentRecipe, isNew]);

  const totalMaltCost = calculateTotalMaltCost(malts);
  const totalHopCost = calculateTotalHopCost(hops);
  const totalYeastCost = calculateYeastCost(yeast);
  const totalCost = totalMaltCost + totalHopCost + totalYeastCost;

  const handleAddMalt = () => {
    setMalts([...malts, {
      id: generateId(),
      name: '',
      weight: 0,
      color: '',
      percentage: 0,
      pricePerKg: 0,
    }]);
  };

  const handleUpdateMalt = (index: number, field: keyof MaltItem, value: string | number) => {
    const newMalts = [...malts];
    (newMalts[index] as any)[field] = value;
    const totalWeight = newMalts.reduce((sum, m) => sum + m.weight, 0);
    newMalts.forEach(m => {
      m.percentage = totalWeight > 0 ? Math.round((m.weight / totalWeight) * 1000) / 10 : 0;
    });
    setMalts(newMalts);
  };

  const handleRemoveMalt = (index: number) => {
    if (malts.length > 1) {
      setMalts(malts.filter((_, i) => i !== index));
    }
  };

  const handleAddHop = () => {
    setHops([...hops, {
      id: generateId(),
      name: '',
      weight: 0,
      alphaAcid: 0,
      time: 60,
      stage: 'boil',
      pricePerKg: 0,
    }]);
  };

  const handleUpdateHop = (index: number, field: keyof HopAddition, value: string | number) => {
    const newHops = [...hops];
    (newHops[index] as any)[field] = value;
    setHops(newHops);
  };

  const handleRemoveHop = (index: number) => {
    if (hops.length > 1) {
      setHops(hops.filter((_, i) => i !== index));
    }
  };

  const handleAddMashStep = () => {
    setMashSteps([...mashSteps, {
      id: generateId(),
      temperature: 67,
      duration: 60,
      description: '',
    }]);
  };

  const handleUpdateMashStep = (index: number, field: keyof MashStep, value: string | number) => {
    const newSteps = [...mashSteps];
    (newSteps[index] as any)[field] = value;
    setMashSteps(newSteps);
  };

  const handleRemoveMashStep = (index: number) => {
    if (mashSteps.length > 1) {
      setMashSteps(mashSteps.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    const recipeData = {
      name,
      style,
      description,
      batchSize,
      originalGravity: 1.050,
      finalGravity: 1.012,
      abv: 5.0,
      ibu: 30,
      srm: 10,
      malts,
      hops,
      yeast,
      mashSteps,
      version: '1.0.0',
      isPublic: false,
      createdBy: 'currentUser',
    };

    if (isNew) {
      const result = await createRecipe(recipeData);
      if (result) {
        navigate(`/recipes/${result.id}`);
      }
    } else if (id) {
      const result = await updateRecipe(id, recipeData);
      if (result) {
        navigate(`/recipes/${result.id}`);
      }
    }
  };

  if (loading && !isNew) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Scale size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(isNew ? '/recipes' : `/recipes/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">
              {isNew ? '创建新配方' : '编辑配方'}
            </h1>
            <p className="text-gray-600 mt-1">填写配方信息和原料成本</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
          >
            <Save size={18} />
            保存配方
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-6 mb-6 border border-amber-200">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="text-amber-700" size={24} />
          <h2 className="text-xl font-bold text-amber-900">配方物料成本</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/70 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">麦芽成本</div>
            <div className="text-2xl font-bold text-amber-700">{formatCurrency(totalMaltCost)}</div>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">酒花成本</div>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(totalHopCost)}</div>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">酵母成本</div>
            <div className="text-2xl font-bold text-purple-700">{formatCurrency(totalYeastCost)}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">总成本</div>
            <div className="text-3xl font-bold text-amber-900">{formatCurrency(totalCost)}</div>
            <div className="text-xs text-gray-500 mt-1">每升约 {totalCost > 0 ? formatCurrency(totalCost / batchSize) : '-'} 元</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">配方名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="输入配方名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">啤酒风格</label>
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="如: IPA, Stout"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">批次容量 (L)</label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="描述这款啤酒的特点..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Scale className="text-amber-600" size={20} />
              麦芽配比
            </h3>
            <button
              onClick={handleAddMalt}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              <Plus size={16} />
              添加麦芽
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">名称</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">重量 (kg)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">色度</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">占比</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">单价 (元/kg)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">成本</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {malts.map((malt, index) => (
                  <tr key={malt.id}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={malt.name}
                        onChange={(e) => handleUpdateMalt(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                        placeholder="麦芽名称"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={malt.weight || ''}
                        onChange={(e) => handleUpdateMalt(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={malt.color}
                        onChange={(e) => handleUpdateMalt(index, 'color', e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                        placeholder="0L"
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-sm text-gray-600">
                      {malt.percentage}%
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={malt.pricePerKg || ''}
                        onChange={(e) => handleUpdateMalt(index, 'pricePerKg', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-sm font-medium text-amber-700">
                      {formatCurrency(calculateMaltCost(malt))}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleRemoveMalt(index)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        disabled={malts.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Leaf className="text-green-600" size={20} />
              酒花投放
            </h3>
            <button
              onClick={handleAddHop}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              <Plus size={16} />
              添加酒花
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">名称</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">用量 (g)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">α酸 %</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">阶段</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">时间 (分钟)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">单价 (元/kg)</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">成本</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hops.map((hop, index) => (
                  <tr key={hop.id}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={hop.name}
                        onChange={(e) => handleUpdateHop(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                        placeholder="酒花名称"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={hop.weight || ''}
                        onChange={(e) => handleUpdateHop(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={hop.alphaAcid || ''}
                        onChange={(e) => handleUpdateHop(index, 'alphaAcid', parseFloat(e.target.value) || 0)}
                        className="w-14 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={hop.stage}
                        onChange={(e) => handleUpdateHop(index, 'stage', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="boil">煮沸</option>
                        <option value="whirlpool">旋沉</option>
                        <option value="dryhop">干投</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={hop.time || ''}
                        onChange={(e) => handleUpdateHop(index, 'time', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={hop.pricePerKg || ''}
                        onChange={(e) => handleUpdateHop(index, 'pricePerKg', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-sm font-medium text-green-700">
                      {formatCurrency(calculateHopCost(hop))}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleRemoveHop(index)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        disabled={hops.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-purple-600" size={20} />
            酵母菌株
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">菌株</label>
              <input
                type="text"
                value={yeast.strain}
                onChange={(e) => setYeast({ ...yeast, strain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="如: US-05"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
              <input
                type="text"
                value={yeast.brand}
                onChange={(e) => setYeast({ ...yeast, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="如: Fermentis"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">发酵度 %</label>
              <input
                type="number"
                value={yeast.attenuation}
                onChange={(e) => setYeast({ ...yeast, attenuation: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低温度 °C</label>
              <input
                type="number"
                value={yeast.temperature[0]}
                onChange={(e) => setYeast({ ...yeast, temperature: [parseFloat(e.target.value) || 0, yeast.temperature[1]] })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高温度 °C</label>
              <input
                type="number"
                value={yeast.temperature[1]}
                onChange={(e) => setYeast({ ...yeast, temperature: [yeast.temperature[0], parseFloat(e.target.value) || 0] })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">价格 (元/包)</label>
              <input
                type="number"
                step="0.01"
                value={yeast.price || ''}
                onChange={(e) => setYeast({ ...yeast, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">糖化步骤</h3>
            <button
              onClick={handleAddMashStep}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              <Plus size={16} />
              添加步骤
            </button>
          </div>
          <div className="space-y-3">
            {mashSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={step.description}
                    onChange={(e) => handleUpdateMashStep(index, 'description', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="步骤描述"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">温度:</span>
                    <input
                      type="number"
                      value={step.temperature}
                      onChange={(e) => handleUpdateMashStep(index, 'temperature', parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">时长:</span>
                    <input
                      type="number"
                      value={step.duration}
                      onChange={(e) => handleUpdateMashStep(index, 'duration', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">分钟</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMashStep(index)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  disabled={mashSteps.length <= 1}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
