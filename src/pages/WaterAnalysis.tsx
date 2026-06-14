import { useState, useEffect } from 'react';
import { Droplets, Calculator, Save, Trash2, AlertTriangle, Lightbulb, CheckCircle, XCircle, ArrowRight, FlaskConical } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BEER_STYLES, BEER_STYLE_WATER_TARGETS } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

interface WaterFormData {
  name: string;
  calcium: string;
  magnesium: string;
  sodium: string;
  sulfate: string;
  chloride: string;
  bicarbonate: string;
  ph: string;
  style: string;
  batchSize: string;
}

const ionLabels: Record<string, { label: string; unit: string }> = {
  calcium: { label: '钙 (Ca²⁺)', unit: 'ppm' },
  magnesium: { label: '镁 (Mg²⁺)', unit: 'ppm' },
  sodium: { label: '钠 (Na⁺)', unit: 'ppm' },
  sulfate: { label: '硫酸根 (SO₄²⁻)', unit: 'ppm' },
  chloride: { label: '氯离子 (Cl⁻)', unit: 'ppm' },
  bicarbonate: { label: '碳酸氢根 (HCO₃⁻)', unit: 'ppm' },
};

export default function WaterAnalysis() {
  const {
    waterProfiles,
    waterAnalysisResult,
    loading,
    error,
    analyzeWater,
    fetchWaterProfiles,
    saveWaterProfile,
    deleteWaterProfile,
    clearWaterAnalysis,
  } = useBrewStore();

  const [formData, setFormData] = useState<WaterFormData>({
    name: '',
    calcium: '',
    magnesium: '',
    sodium: '',
    sulfate: '',
    chloride: '',
    bicarbonate: '',
    ph: '',
    style: 'IPA',
    batchSize: '20',
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    fetchWaterProfiles();
  }, [fetchWaterProfiles]);

  const handleInputChange = (field: keyof WaterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (waterAnalysisResult) {
      clearWaterAnalysis();
    }
  };

  const handleProfileSelect = (profile: typeof waterProfiles[0]) => {
    setFormData({
      ...formData,
      name: profile.name,
      calcium: profile.calcium.toString(),
      magnesium: profile.magnesium.toString(),
      sodium: profile.sodium.toString(),
      sulfate: profile.sulfate.toString(),
      chloride: profile.chloride.toString(),
      bicarbonate: profile.bicarbonate.toString(),
      ph: profile.ph?.toString() || '',
    });
    clearWaterAnalysis();
  };

  const handleAnalyze = async () => {
    const requiredFields = ['calcium', 'magnesium', 'sodium', 'sulfate', 'chloride', 'bicarbonate', 'style', 'batchSize'];
    for (const field of requiredFields) {
      if (!formData[field as keyof WaterFormData]) {
        alert(`请填写${ionLabels[field]?.label || field}`);
        return;
      }
    }

    const result = await analyzeWater({
      calcium: parseFloat(formData.calcium),
      magnesium: parseFloat(formData.magnesium),
      sodium: parseFloat(formData.sodium),
      sulfate: parseFloat(formData.sulfate),
      chloride: parseFloat(formData.chloride),
      bicarbonate: parseFloat(formData.bicarbonate),
      ph: formData.ph ? parseFloat(formData.ph) : undefined,
      style: formData.style,
      batchSize: parseFloat(formData.batchSize),
    });

    if (!result) {
      alert('水质分析失败，请检查输入数据');
    }
  };

  const handleSaveProfile = async () => {
    if (!saveName.trim()) {
      alert('请输入水源名称');
      return;
    }

    const profile = await saveWaterProfile({
      name: saveName,
      calcium: parseFloat(formData.calcium) || 0,
      magnesium: parseFloat(formData.magnesium) || 0,
      sodium: parseFloat(formData.sodium) || 0,
      sulfate: parseFloat(formData.sulfate) || 0,
      chloride: parseFloat(formData.chloride) || 0,
      bicarbonate: parseFloat(formData.bicarbonate) || 0,
      ph: formData.ph ? parseFloat(formData.ph) : undefined,
      note: '',
    });

    if (profile) {
      setShowSaveDialog(false);
      setSaveName('');
      setFormData(prev => ({ ...prev, name: saveName }));
      alert('水源配置已保存');
    }
  };

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个水源配置吗？')) {
      await deleteWaterProfile(id);
    }
  };

  const getStatusColor = (current: number, min: number, max: number) => {
    if (current >= min && current <= max) return 'text-green-600 bg-green-50 border-green-200';
    if (current < min) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (current: number, min: number, max: number) => {
    if (current >= min && current <= max) return <CheckCircle size={16} className="text-green-500" />;
    if (current < min) return <AlertTriangle size={16} className="text-amber-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
          <Droplets className="text-blue-500" />
          水质分析与矿物质计算
        </h1>
        <p className="text-gray-600 mt-1">
          录入水源水质数据，选择目标啤酒风格，自动计算需要添加的矿物质用量
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {waterProfiles.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Save size={18} />
                已保存的水源
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {waterProfiles.map(profile => (
                  <div
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      formData.name === profile.name
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{profile.name}</div>
                      <div className="text-xs text-gray-500">
                        Ca {profile.calcium} | Mg {profile.magnesium} | SO₄ {profile.sulfate} | Cl {profile.chloride}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProfile(profile.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FlaskConical size={18} className="text-blue-500" />
              水源水质数据 (ppm)
            </h3>
            <div className="space-y-4">
              {Object.entries(ionLabels).map(([key, { label, unit }]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} ({unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData[key as keyof WaterFormData]}
                    onChange={(e) => handleInputChange(key as keyof WaterFormData, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  pH值 (可选)
                </label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  step="0.1"
                  value={formData.ph}
                  onChange={(e) => handleInputChange('ph', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="7.0"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目标啤酒风格
                </label>
                <select
                  value={formData.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {BEER_STYLES.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  批次大小 (L)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.batchSize}
                  onChange={(e) => handleInputChange('batchSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Calculator size={18} />
                {loading ? '计算中...' : '计算矿物质'}
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                title="保存水源配置"
              >
                <Save size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {waterAnalysisResult ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {waterAnalysisResult.targetStyle.style} 水化学区间
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {waterAnalysisResult.targetStyle.description}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">离子</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">当前值</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">目标区间</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">目标值</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">预测值</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(ionLabels).map(([key, { label, unit }]) => {
                        const current = waterAnalysisResult.currentValues[key as keyof typeof waterAnalysisResult.currentValues];
                        const target = waterAnalysisResult.targetValues[key as keyof typeof waterAnalysisResult.targetValues];
                        const targetRange = waterAnalysisResult.targetStyle[key as keyof typeof waterAnalysisResult.targetStyle] as { min: number; max: number };
                        const final = waterAnalysisResult.finalEstimate[key as keyof typeof waterAnalysisResult.finalEstimate];
                        const deficit = waterAnalysisResult.deficits[key as keyof typeof waterAnalysisResult.deficits];

                        return (
                          <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-3 text-sm font-medium text-gray-800">
                              {label}
                            </td>
                            <td className="py-3 px-3 text-center text-sm text-gray-600">
                              {current} {unit}
                            </td>
                            <td className="py-3 px-3 text-center text-sm text-gray-600">
                              {targetRange.min} - {targetRange.max} {unit}
                            </td>
                            <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                              {target} {unit}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium border",
                                getStatusColor(final, targetRange.min, targetRange.max)
                              )}>
                                {final} {unit}
                                {getStatusIcon(final, targetRange.min, targetRange.max)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-sm">
                              {deficit > 0 ? (
                                <span className="text-amber-600">+{deficit.toFixed(0)} {unit}</span>
                              ) : current > targetRange.max ? (
                                <span className="text-red-600">过高</span>
                              ) : (
                                <span className="text-green-600">✓</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FlaskConical size={18} className="text-amber-500" />
                  矿物质添加建议
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (批次 {waterAnalysisResult.batchSize}L)
                  </span>
                </h3>

                {waterAnalysisResult.additions.length > 0 ? (
                  <div className="space-y-3">
                    {waterAnalysisResult.additions.map((addition, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-amber-700 font-bold">{idx + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {addition.mineral.name}
                              <span className="text-xs text-gray-500 ml-2">
                                {addition.mineral.formula}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              贡献:
                              {addition.contributions.calcium > 0 && ` Ca +${addition.contributions.calcium.toFixed(0)}ppm`}
                              {addition.contributions.magnesium > 0 && ` Mg +${addition.contributions.magnesium.toFixed(0)}ppm`}
                              {addition.contributions.sodium > 0 && ` Na +${addition.contributions.sodium.toFixed(0)}ppm`}
                              {addition.contributions.sulfate > 0 && ` SO₄ +${addition.contributions.sulfate.toFixed(0)}ppm`}
                              {addition.contributions.chloride > 0 && ` Cl +${addition.contributions.chloride.toFixed(0)}ppm`}
                              {addition.contributions.bicarbonate > 0 && ` HCO₃ +${addition.contributions.bicarbonate.toFixed(0)}ppm`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-700">
                            {addition.amount.toFixed(1)}
                            <span className="text-base ml-1">{addition.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
                    <p>水源水质已符合目标风格要求，无需添加矿物质</p>
                  </div>
                )}
              </div>

              {waterAnalysisResult.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    注意事项
                  </h3>
                  <ul className="space-y-2">
                    {waterAnalysisResult.warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-amber-700">
                        <span className="mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Lightbulb size={20} />
                  酿造建议
                </h3>
                <ul className="space-y-2">
                  {waterAnalysisResult.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-blue-700">
                      <span className="mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {waterAnalysisResult.targetStyle.tips.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={20} />
                    {waterAnalysisResult.targetStyle.style} 风格要点
                  </h3>
                  <ul className="space-y-2">
                    {waterAnalysisResult.targetStyle.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-700">
                        <span className="mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Droplets size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">输入水源数据开始分析</h3>
              <p className="text-gray-400">
                填写左侧的水源离子浓度，选择目标啤酒风格，点击"计算矿物质"按钮
              </p>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                {['IPA', 'Stout', 'Lager', 'Pilsner', 'Wheat Beer', 'Saison'].map(style => {
                  const target = BEER_STYLE_WATER_TARGETS.find(t => t.style === style);
                  return (
                    <div
                      key={style}
                      onClick={() => handleInputChange('style', style)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all text-left",
                        formData.style === style
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="font-medium text-gray-800">{style}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {target ? `SO₄: ${target.sulfate.ideal} Cl: ${target.chloride.ideal}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">保存水源配置</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="输入水源名称，如：北京自来水、RO纯净水"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
