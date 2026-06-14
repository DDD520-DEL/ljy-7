import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, X, Search, Wine, Beer, Calendar, AlertCircle, Check } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import type { Tasting } from '../../shared/types.js';

interface TastingFormData {
  name: string;
  date: string;
  appearance: {
    score: number;
    clarity: string;
    color: string;
    headRetention: string;
  };
  aroma: {
    score: number;
    intensity: string;
    notes: string;
  };
  flavor: {
    score: number;
    sweetness: number;
    bitterness: number;
    acidity: number;
    notes: string;
  };
  mouthfeel: {
    score: number;
    body: string;
    carbonation: string;
    warmth: string;
  };
  overall: {
    score: number;
    impressions: string;
  };
  notes: string;
}

const emptyFormData: TastingFormData = {
  name: '',
  date: new Date().toISOString().slice(0, 10),
  appearance: {
    score: 5,
    clarity: '',
    color: '',
    headRetention: '',
  },
  aroma: {
    score: 5,
    intensity: '',
    notes: '',
  },
  flavor: {
    score: 5,
    sweetness: 5,
    bitterness: 5,
    acidity: 3,
    notes: '',
  },
  mouthfeel: {
    score: 5,
    body: '',
    carbonation: '',
    warmth: '',
  },
  overall: {
    score: 5,
    impressions: '',
  },
  notes: '',
};

export default function TastingEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createTasting, createTastingWithTraceCode, updateTasting, fetchTastingById, currentTasting, lookupTraceCode, loading, error } = useBrewStore();
  
  const [formData, setFormData] = useState<TastingFormData>(emptyFormData);
  const [traceCodeInput, setTraceCodeInput] = useState('');
  const [traceCodeBatch, setTraceCodeBatch] = useState<{ batch: any; recipe?: any } | null>(null);
  const [traceCodeVerified, setTraceCodeVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit && id) {
      fetchTastingById(id);
    }
  }, [isEdit, id, fetchTastingById]);

  useEffect(() => {
    if (currentTasting && isEdit) {
      setFormData({
        name: currentTasting.name,
        date: currentTasting.date,
        appearance: { ...currentTasting.appearance },
        aroma: {
          ...currentTasting.aroma,
          notes: currentTasting.aroma.notes.join(', '),
        },
        flavor: {
          ...currentTasting.flavor,
          notes: currentTasting.flavor.notes.join(', '),
        },
        mouthfeel: { ...currentTasting.mouthfeel },
        overall: { ...currentTasting.overall },
        notes: currentTasting.notes,
      });
      if (currentTasting.traceCode) {
        setTraceCodeInput(currentTasting.traceCode);
        setTraceCodeVerified(true);
      }
    }
  }, [currentTasting, isEdit]);

  useEffect(() => {
    const traceCodeParam = searchParams.get('traceCode');
    if (traceCodeParam && !isEdit) {
      setTraceCodeInput(traceCodeParam);
      handleVerifyTraceCode(traceCodeParam);
    }
  }, [searchParams, isEdit]);

  const calculateTotalScore = (data: TastingFormData): number => {
    const total = 
      data.appearance.score +
      data.aroma.score +
      data.flavor.score +
      data.mouthfeel.score +
      data.overall.score;
    return Math.round(total * 4);
  };

  const handleVerifyTraceCode = async (code?: string) => {
    const traceCode = code || traceCodeInput;
    if (!traceCode.trim()) return;
    
    setIsVerifying(true);
    setSaveError(null);
    try {
      const result = await lookupTraceCode(traceCode.trim());
      if (result) {
        setTraceCodeBatch(result);
        setTraceCodeVerified(true);
        if (!formData.name) {
          setFormData(prev => ({
            ...prev,
            name: `${result.batch.name} 品鉴`,
          }));
        }
      } else {
        setTraceCodeBatch(null);
        setTraceCodeVerified(false);
      }
    } catch (_err) {
      setTraceCodeBatch(null);
      setTraceCodeVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (traceCodeInput.trim() && !traceCodeVerified) {
      setSaveError('请先验证追溯码');
      return;
    }

    const tastingData: Omit<Tasting, 'id'> = {
      name: formData.name,
      date: formData.date,
      batchId: traceCodeBatch?.batch?.id || searchParams.get('batchId') || '',
      recipeId: traceCodeBatch?.recipe?.id || searchParams.get('recipeId') || '',
      appearance: { ...formData.appearance },
      aroma: {
        ...formData.aroma,
        notes: formData.aroma.notes.split(',').map(s => s.trim()).filter(Boolean),
      },
      flavor: {
        ...formData.flavor,
        notes: formData.flavor.notes.split(',').map(s => s.trim()).filter(Boolean),
      },
      mouthfeel: { ...formData.mouthfeel },
      overall: { ...formData.overall },
      totalScore: calculateTotalScore(formData),
      notes: formData.notes,
      traceCode: traceCodeVerified ? traceCodeInput.trim() : undefined,
      batchName: traceCodeBatch?.batch?.name,
      recipeName: traceCodeBatch?.recipe?.name,
    };

    let result;
    if (isEdit && id) {
      result = await updateTasting(id, tastingData);
    } else if (traceCodeVerified && traceCodeInput.trim()) {
      const { name, date, appearance, aroma, flavor, mouthfeel, overall, notes, totalScore } = tastingData;
      const tastingWithoutIds = {
        name,
        date,
        appearance,
        aroma,
        flavor,
        mouthfeel,
        overall,
        totalScore,
        notes,
      };
      result = await createTastingWithTraceCode(traceCodeInput.trim(), tastingWithoutIds as any);
    } else {
      result = await createTasting(tastingData);
    }

    if (result) {
      navigate(`/tastings/${result.id}`);
    } else {
      setSaveError(error || '保存失败，请重试');
    }
  };

  const totalScore = calculateTotalScore(formData);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <h1 className="text-3xl font-bold text-amber-900">
          {isEdit ? '编辑品鉴记录' : '新建品鉴记录'}
        </h1>
        <p className="text-gray-600 mt-1">
          {traceCodeVerified ? '通过追溯码关联批次' : '填写品鉴评分信息'}
        </p>
      </div>

      {!isEdit && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wine className="w-5 h-5 text-emerald-600" />
            追溯码关联
          </h3>
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={traceCodeInput}
                onChange={(e) => {
                  setTraceCodeInput(e.target.value);
                  setTraceCodeVerified(false);
                  setTraceCodeBatch(null);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyTraceCode()}
                placeholder="输入或扫描追溯码，如 BREW-XXXX-..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => handleVerifyTraceCode()}
              disabled={isVerifying || !traceCodeInput.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Search size={18} />
              )}
              验证
            </button>
          </div>

          {traceCodeVerified && traceCodeBatch && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-emerald-900 mb-1">追溯码验证成功</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">批次: </span>
                      <Link
                        to={`/batches/${traceCodeBatch.batch.id}`}
                        className="text-amber-600 hover:underline font-medium"
                      >
                        {traceCodeBatch.batch.name}
                      </Link>
                    </div>
                    {traceCodeBatch.recipe && (
                      <div>
                        <span className="text-gray-500">配方: </span>
                        <span className="font-medium text-gray-700">{traceCodeBatch.recipe.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">酿造日期: </span>
                      <span className="font-medium text-gray-700">{traceCodeBatch.batch.brewDate}</span>
                    </div>
                    {traceCodeBatch.batch.bottlingRecord && (
                      <div>
                        <span className="text-gray-500">装瓶数: </span>
                        <span className="font-medium text-gray-700">
                          {traceCodeBatch.batch.bottlingRecord.totalBottles} 瓶
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && !traceCodeVerified && traceCodeInput && (
            <div className="text-red-600 text-sm flex items-center gap-1 mt-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品鉴名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="给这次品鉴起个名字"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品鉴日期 *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">外观评分</h3>
            <span className="text-2xl font-bold text-amber-600">{formData.appearance.score}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评分 (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={formData.appearance.score}
                onChange={(e) => setFormData({
                  ...formData,
                  appearance: { ...formData.appearance, score: parseFloat(e.target.value) }
                })}
                className="w-full accent-amber-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">清澈度</label>
              <input
                type="text"
                value={formData.appearance.clarity}
                onChange={(e) => setFormData({
                  ...formData,
                  appearance: { ...formData.appearance, clarity: e.target.value }
                })}
                placeholder="如: 清澈、浑浊、不透明"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <input
                type="text"
                value={formData.appearance.color}
                onChange={(e) => setFormData({
                  ...formData,
                  appearance: { ...formData.appearance, color: e.target.value }
                })}
                placeholder="如: 深金色、琥珀色、深黑色"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">泡沫持久性</label>
              <input
                type="text"
                value={formData.appearance.headRetention}
                onChange={(e) => setFormData({
                  ...formData,
                  appearance: { ...formData.appearance, headRetention: e.target.value }
                })}
                placeholder="如: 丰富持久、一般、差"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">香气评分</h3>
            <span className="text-2xl font-bold text-purple-600">{formData.aroma.score}</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评分 (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={formData.aroma.score}
                onChange={(e) => setFormData({
                  ...formData,
                  aroma: { ...formData.aroma, score: parseFloat(e.target.value) }
                })}
                className="w-full accent-purple-600"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">强度</label>
                <input
                  type="text"
                  value={formData.aroma.intensity}
                  onChange={(e) => setFormData({
                    ...formData,
                    aroma: { ...formData.aroma, intensity: e.target.value }
                  })}
                  placeholder="如: 清淡、中等、强烈"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">香气描述 (逗号分隔)</label>
                <input
                  type="text"
                  value={formData.aroma.notes}
                  onChange={(e) => setFormData({
                    ...formData,
                    aroma: { ...formData.aroma, notes: e.target.value }
                  })}
                  placeholder="如: 柑橘, 松针, 热带水果"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">风味评分</h3>
            <span className="text-2xl font-bold text-green-600">{formData.flavor.score}</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">综合评分 (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={formData.flavor.score}
                onChange={(e) => setFormData({
                  ...formData,
                  flavor: { ...formData.flavor, score: parseFloat(e.target.value) }
                })}
                className="w-full accent-green-600"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">甜度</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        flavor: { ...formData.flavor, sweetness: n }
                      })}
                      className={`w-6 h-6 rounded-full ${formData.flavor.sweetness >= n ? 'bg-amber-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">苦度</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        flavor: { ...formData.flavor, bitterness: n }
                      })}
                      className={`w-6 h-6 rounded-full ${formData.flavor.bitterness >= n ? 'bg-amber-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">酸度</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        flavor: { ...formData.flavor, acidity: n }
                      })}
                      className={`w-6 h-6 rounded-full ${formData.flavor.acidity >= n ? 'bg-amber-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">风味描述 (逗号分隔)</label>
              <input
                type="text"
                value={formData.flavor.notes}
                onChange={(e) => setFormData({
                  ...formData,
                  flavor: { ...formData.flavor, notes: e.target.value }
                })}
                placeholder="如: 橙子, 松木, 麦芽甜"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">口感评分</h3>
            <span className="text-2xl font-bold text-blue-600">{formData.mouthfeel.score}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评分 (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={formData.mouthfeel.score}
                onChange={(e) => setFormData({
                  ...formData,
                  mouthfeel: { ...formData.mouthfeel, score: parseFloat(e.target.value) }
                })}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">酒体</label>
              <input
                type="text"
                value={formData.mouthfeel.body}
                onChange={(e) => setFormData({
                  ...formData,
                  mouthfeel: { ...formData.mouthfeel, body: e.target.value }
                })}
                placeholder="如: 轻盈、中等、厚重"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">碳酸化</label>
              <input
                type="text"
                value={formData.mouthfeel.carbonation}
                onChange={(e) => setFormData({
                  ...formData,
                  mouthfeel: { ...formData.mouthfeel, carbonation: e.target.value }
                })}
                placeholder="如: 低、中等、高"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">酒精温热感</label>
              <input
                type="text"
                value={formData.mouthfeel.warmth}
                onChange={(e) => setFormData({
                  ...formData,
                  mouthfeel: { ...formData.mouthfeel, warmth: e.target.value }
                })}
                placeholder="如: 无、轻微、明显"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">整体评价</h3>
            <span className="text-2xl font-bold text-rose-600">{formData.overall.score}</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">综合评分 (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={formData.overall.score}
                onChange={(e) => setFormData({
                  ...formData,
                  overall: { ...formData.overall, score: parseFloat(e.target.value) }
                })}
                className="w-full accent-rose-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">整体印象</label>
              <textarea
                value={formData.overall.impressions}
                onChange={(e) => setFormData({
                  ...formData,
                  overall: { ...formData.overall, impressions: e.target.value }
                })}
                placeholder="描述你对这款啤酒的整体感受..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">总分</h3>
            <span className="text-4xl font-bold text-amber-600">{totalScore} <span className="text-lg text-gray-400">/ 100</span></span>
          </div>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-amber-600">{formData.appearance.score}</div>
              <div className="text-xs text-gray-500">外观</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{formData.aroma.score}</div>
              <div className="text-xs text-gray-500">香气</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formData.flavor.score}</div>
              <div className="text-xs text-gray-500">风味</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{formData.mouthfeel.score}</div>
              <div className="text-xs text-gray-500">口感</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-600">{formData.overall.score}</div>
              <div className="text-xs text-gray-500">整体</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">备注</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="其他想记录的内容..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-700">{saveError}</div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
          >
            <X size={18} />
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save size={18} />
            )}
            {isEdit ? '保存修改' : '创建品鉴'}
          </button>
        </div>
      </form>
    </div>
  );
}
