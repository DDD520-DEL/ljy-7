import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, AlertCircle, Thermometer, Droplets, Beaker, Trash2, Save, X, DollarSign, Edit2, AlertTriangle, Image as ImageIcon, Settings, Droplets as DropletsIcon, Flame, Refrigerator, Cog, Wrench, ListTodo, Wine, MapPin, Copy, Check } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { useBrewStore } from '../store/brewStore.js';
import { BATCH_STATUS_LABELS, EQUIPMENT_TYPE_LABELS } from '../../shared/types.js';
import type { ParameterDeviation, BatchStatus, BrewStage, Equipment, EquipmentType, BrewStep } from '../../shared/types.js';
import { cn } from '../lib/utils.js';
import { formatCurrency, checkBatchAnomaly, FERMENTATION_ANOMALY_THRESHOLD, calculateExpectedGravity, formatGravity } from '../utils/calculations.js';
import MarkdownEditor from '../components/MarkdownEditor.js';
import BrewPhotoGallery from '../components/BrewPhotoGallery.js';
import BrewChecklist from '../components/BrewChecklist.js';

const equipmentTypeIcons: Record<EquipmentType, React.ReactNode> = {
  mash_tun: <DropletsIcon className="w-5 h-5" />,
  boil_kettle: <Flame className="w-5 h-5" />,
  fermenter: <Refrigerator className="w-5 h-5" />,
  cooler: <Cog className="w-5 h-5" />,
  pump: <Settings className="w-5 h-5" />,
  other: <Wrench className="w-5 h-5" />,
};

const equipmentTypeColors: Record<EquipmentType, string> = {
  mash_tun: 'from-amber-500 to-orange-600',
  boil_kettle: 'from-red-500 to-orange-600',
  fermenter: 'from-blue-500 to-indigo-600',
  cooler: 'from-cyan-500 to-blue-600',
  pump: 'from-gray-500 to-slate-600',
  other: 'from-purple-500 to-violet-600',
};

const equipmentTypeBgColors: Record<EquipmentType, string> = {
  mash_tun: 'bg-amber-50 border-amber-200',
  boil_kettle: 'bg-red-50 border-red-200',
  fermenter: 'bg-blue-50 border-blue-200',
  cooler: 'bg-cyan-50 border-cyan-200',
  pump: 'bg-gray-50 border-gray-200',
  other: 'bg-purple-50 border-purple-200',
};

function renderMarkdownToHtml(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');

  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-amber-700 font-mono">$1</code>');

  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono"><code>$1</code></pre>');

  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-700">$1</li>');
  html = html.replace(/((?:<li class="ml-4 list-disc[^"]*">.*<\/li>\s*)+)/g, '<ul class="my-3 space-y-1">$1</ul>');

  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-gray-700">$1</li>');
  html = html.replace(/((?:<li class="ml-4 list-decimal[^"]*">.*<\/li>\s*)+)/g, '<ol class="my-3 space-y-1">$1</ol>');

  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-amber-400 pl-4 my-4 text-gray-600 italic">$1</blockquote>');

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  html = html.replace(/^---$/gim, '<hr class="my-6 border-gray-200" />');

  html = html.replace(/\n\n/g, '</p><p class="my-3 text-gray-700">');
  html = '<p class="my-3 text-gray-700">' + html + '</p>';

  html = html.replace(/<p class="my-3 text-gray-700"><h/g, '<h');
  html = html.replace(/<\/h\d><\/p>/g, (match) => match.replace('</p>', ''));
  html = html.replace(/<p class="my-3 text-gray-700"><ul/g, '<ul');
  html = html.replace(/<\/ul><\/p>/g, '</ul>');
  html = html.replace(/<p class="my-3 text-gray-700"><ol/g, '<ol');
  html = html.replace(/<\/ol><\/p>/g, '</ol>');
  html = html.replace(/<p class="my-3 text-gray-700"><blockquote/g, '<blockquote');
  html = html.replace(/<\/blockquote><\/p>/g, '</blockquote>');
  html = html.replace(/<p class="my-3 text-gray-700"><pre/g, '<pre');
  html = html.replace(/<\/pre><\/p>/g, '</pre>');
  html = html.replace(/<p class="my-3 text-gray-700"><hr/g, '<hr');
  html = html.replace(/<hr class="my-6 border-gray-200" \/><\/p>/g, '<hr class="my-6 border-gray-200" />');

  html = html.replace(/\n/g, '<br />');

  return html;
}

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBatch, currentRecipe, tastings, equipment, loading, error, fetchBatchById, fetchRecipeById, fetchTastings, fetchEquipment, updateBatch, addReading, addDeviation, deleteBatch, deleteReading, updateBatchNotes, addPhoto, updatePhoto, deletePhoto, generateBrewSteps, updateBrewStep, startBrewStep, completeBrewStep, skipBrewStep, resetBrewSteps, createBottlingRecord } = useBrewStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'readings' | 'deviations' | 'tastings' | 'photos'>('overview');
  const [showAddReading, setShowAddReading] = useState(false);
  const [showAddDeviation, setShowAddDeviation] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isEditingActualCost, setIsEditingActualCost] = useState(false);
  const [actualCostInput, setActualCostInput] = useState('');
  const [newReading, setNewReading] = useState({
    date: new Date().toISOString().slice(0, 10),
    specificGravity: 1.050,
    temperature: 20,
    ph: 5.0,
    notes: '',
  });
  const [newDeviation, setNewDeviation] = useState<ParameterDeviation>({
    parameter: '',
    expected: 0,
    actual: 0,
    unit: '',
  });
  const [showBottlingForm, setShowBottlingForm] = useState(false);
  const [copiedTraceCode, setCopiedTraceCode] = useState(false);
  const [bottlingError, setBottlingError] = useState<string | null>(null);
  const [bottlingForm, setBottlingForm] = useState({
    totalBottles: '',
    bottleSpec: '',
    capColor: '',
    storageLocation: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchBatchById(id);
      fetchTastings({ batchId: id });
      fetchEquipment();
    }
    return () => {
      useBrewStore.getState().clearCurrent();
    };
  }, [id, fetchBatchById, fetchTastings, fetchEquipment]);

  useEffect(() => {
    if (currentBatch && !currentRecipe) {
      fetchRecipeById(currentBatch.recipeId);
    }
  }, [currentBatch, currentRecipe, fetchRecipeById]);

  const anomaly = useMemo(() => {
    if (!currentBatch) {
      return {
        isAnomalous: false,
        consecutiveCount: 0,
        lastDeviations: [],
        message: ''
      };
    }
    return checkBatchAnomaly(currentBatch, currentRecipe || undefined);
  }, [currentBatch, currentRecipe]);

  const anomalyDates = useMemo(() => {
    return new Set(anomaly.lastDeviations.map(d => d.date.slice(0, 10)));
  }, [anomaly.lastDeviations]);

  const batchEquipment = useMemo(() => {
    if (!currentBatch?.equipmentIds || equipment.length === 0) return [];
    return currentBatch.equipmentIds
      .map(id => equipment.find(e => e.id === id))
      .filter(Boolean) as Equipment[];
  }, [currentBatch, equipment]);

  const handleAddReading = async () => {
    if (!currentBatch || !newReading.date || !newReading.specificGravity) return;
    await addReading(currentBatch.id, newReading);
    setShowAddReading(false);
    setNewReading({
      date: new Date().toISOString().slice(0, 10),
      specificGravity: 1.050,
      temperature: 20,
      ph: 5.0,
      notes: '',
    });
  };

  const handleAddDeviation = async () => {
    if (!currentBatch || !newDeviation.parameter) return;
    await addDeviation(currentBatch.id, newDeviation);
    setShowAddDeviation(false);
    setNewDeviation({
      parameter: '',
      expected: 0,
      actual: 0,
      unit: '',
    });
  };

  const handleCreateBottling = async () => {
    if (!currentBatch) return;

    if (currentBatch.bottlingRecord) {
      setBottlingError('该批次已完成装瓶，不能重复操作');
      return;
    }

    setBottlingError(null);
    const errors: string[] = [];

    if (!bottlingForm.totalBottles || parseInt(bottlingForm.totalBottles) <= 0) {
      errors.push('装瓶总数必须大于0');
    }
    if (!bottlingForm.bottleSpec.trim()) {
      errors.push('请填写瓶型规格');
    }
    if (!bottlingForm.capColor.trim()) {
      errors.push('请选择或填写瓶盖颜色');
    }
    if (!bottlingForm.storageLocation.trim()) {
      errors.push('请填写储存位置');
    }

    if (errors.length > 0) {
      setBottlingError(errors.join('；'));
      return;
    }

    const result = await createBottlingRecord(currentBatch.id, {
      totalBottles: parseInt(bottlingForm.totalBottles),
      bottleSpec: bottlingForm.bottleSpec.trim(),
      capColor: bottlingForm.capColor.trim(),
      storageLocation: bottlingForm.storageLocation.trim(),
      notes: bottlingForm.notes,
    });
    if (result) {
      setShowBottlingForm(false);
      setBottlingError(null);
      setBottlingForm({
        totalBottles: '',
        bottleSpec: '',
        capColor: '',
        storageLocation: '',
        notes: '',
      });
    }
  };

  const handleCopyTraceCode = async () => {
    if (!currentBatch?.traceCode) return;
    try {
      await navigator.clipboard.writeText(currentBatch.traceCode);
      setCopiedTraceCode(true);
      setTimeout(() => setCopiedTraceCode(false), 2000);
    } catch (_err) {
      console.error('复制失败');
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!currentBatch) return;
    await updateBatch(currentBatch.id, { status: status as BatchStatus });
  };

  const handleEditActualCost = () => {
    if (currentBatch?.actualCost !== undefined) {
      setActualCostInput(currentBatch.actualCost.toString());
    }
    setIsEditingActualCost(true);
  };

  const handleSaveActualCost = async () => {
    if (!currentBatch) return;
    const actualCost = parseFloat(actualCostInput);
    if (!isNaN(actualCost) && actualCost >= 0) {
      await updateBatch(currentBatch.id, { actualCost });
    }
    setIsEditingActualCost(false);
  };

  const handleCancelActualCost = () => {
    setIsEditingActualCost(false);
    setActualCostInput('');
  };

  const handleDeleteReading = async (readingId: string) => {
    if (!currentBatch) return;
    if (confirm('确定要删除这条读数吗？')) {
      await deleteReading(currentBatch.id, readingId);
    }
  };

  const handleDelete = async () => {
    if (!currentBatch) return;
    if (confirm('确定要删除这个批次吗？')) {
      await deleteBatch(currentBatch.id);
      navigate('/batches');
    }
  };

  const handleEditNotes = () => {
    if (currentBatch) {
      setNotesDraft(currentBatch.notes);
      setIsEditingNotes(true);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentBatch) return;
    setIsSavingNotes(true);
    try {
      await updateBatchNotes(currentBatch.id, notesDraft);
      setIsEditingNotes(false);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setIsEditingNotes(false);
    setNotesDraft('');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAddPhoto = async (stage: BrewStage, file: File, caption: string) => {
    if (!currentBatch) return;
    try {
      const base64Url = await fileToBase64(file);
      await addPhoto(currentBatch.id, {
        url: base64Url,
        stage,
        caption,
      });
    } catch (err) {
      console.error('上传照片失败:', err);
    }
  };

  const handleUpdatePhotoCaption = async (photoId: string, caption: string) => {
    if (!currentBatch) return;
    await updatePhoto(currentBatch.id, photoId, { caption });
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!currentBatch) return;
    if (confirm('确定要删除这张照片吗？')) {
      await deletePhoto(currentBatch.id, photoId);
    }
  };

  if (loading && !currentBatch) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Droplets size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!currentBatch) return <div className="text-center py-16">批次不存在</div>;

  const chartData = currentBatch.readings
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => {
      const expected = currentRecipe
        ? calculateExpectedGravity(
            currentBatch.brewDate,
            r.date,
            currentRecipe.originalGravity,
            currentRecipe.finalGravity
          )
        : null;
      return {
        date: r.date.slice(5),
        比重: r.specificGravity,
        预期比重: expected,
        温度: r.temperature,
        pH: r.ph,
        isAnomalous: anomalyDates.has(r.date.slice(0, 10))
      };
    });

  const abvActual = currentBatch.originalGravityActual && currentBatch.finalGravityActual
    ? ((currentBatch.originalGravityActual - currentBatch.finalGravityActual) * 131.25).toFixed(1)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/batches')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回批次列表
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-amber-900">{currentBatch.name}</h1>
              {anomaly.isAnomalous && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                  <AlertTriangle size={14} />
                  发酵异常
                </span>
              )}
              <select
                value={currentBatch.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer",
                  currentBatch.status === 'completed' ? 'bg-green-100 text-green-700' :
                  currentBatch.status === 'fermenting' ? 'bg-amber-100 text-amber-700' :
                  currentBatch.status === 'conditioning' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                )}
              >
                {Object.entries(BATCH_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {currentBatch.brewDate}
              </span>
              {currentRecipe && (
                <Link
                  to={`/recipes/${currentRecipe.id}`}
                  className="text-amber-600 hover:text-amber-700 hover:underline"
                >
                  {currentRecipe.name} (v{currentBatch.recipeVersion})
                </Link>
              )}
              {abvActual && (
                <span>实际酒精度: {abvActual}%</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/tastings/new?batchId=${currentBatch.id}&recipeId=${currentBatch.recipeId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              品鉴评分
            </button>
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

      {anomaly.isAnomalous && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-800 mb-2 flex items-center gap-2">
                发酵异常预警！
              </h3>
              <p className="text-red-700 mb-4 font-medium">
                {anomaly.message}
              </p>
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  异常读数详情
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">日期</th>
                        <th className="text-right py-2 px-3 text-gray-600 font-medium">预期比重</th>
                        <th className="text-right py-2 px-3 text-gray-600 font-medium">实际比重</th>
                        <th className="text-right py-2 px-3 text-gray-600 font-medium">偏差</th>
                        <th className="text-center py-2 px-3 text-gray-600 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomaly.lastDeviations.map((d, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 px-3 text-gray-800">{d.date.slice(0, 10)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{formatGravity(d.expected)}</td>
                          <td className="py-2 px-3 text-right font-semibold text-amber-700">{formatGravity(d.actual)}</td>
                          <td className={cn(
                            "py-2 px-3 text-right font-semibold",
                            d.deviation > 0 ? "text-red-600" : "text-blue-600"
                          )}>
                            {d.deviation > 0 ? '+' : ''}{formatGravity(d.deviation)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <AlertCircle size={12} />
                              超阈值
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-3 text-sm text-red-600">
                ⚠️ 建议：请检查酵母活性、发酵温度、是否有感染等情况，必要时考虑补种酵母。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xs text-gray-500 mb-1">原始比重</div>
          <div className="text-2xl font-bold text-amber-700">
            {currentBatch.originalGravityActual || '-'}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xs text-gray-500 mb-1">最终比重</div>
          <div className="text-2xl font-bold text-amber-700">
            {currentBatch.finalGravityActual || '-'}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xs text-gray-500 mb-1">实际容量</div>
          <div className="text-2xl font-bold text-amber-700">
            {currentBatch.volumeActual ? `${currentBatch.volumeActual}L` : '-'}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xs text-gray-500 mb-1">发酵天数</div>
          <div className="text-2xl font-bold text-amber-700">
            {currentBatch.readings.length > 0
              ? Math.ceil((new Date().getTime() - new Date(currentBatch.readings[0].date).getTime()) / (1000 * 60 * 60 * 24))
              : 0}
          </div>
        </div>
      </div>

      {currentBatch.costSnapshot && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="text-amber-700" size={24} />
            <h3 className="text-lg font-semibold text-amber-900">成本对比</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">预计成本</div>
              <div className="text-2xl font-bold text-amber-700">
                {formatCurrency(currentBatch.costSnapshot.totalCost)}
              </div>
              <div className="text-xs text-gray-400 mt-1">配方物料成本</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1 flex items-center justify-between">
                <span>实际花费</span>
                {!isEditingActualCost && (
                  <button
                    onClick={handleEditActualCost}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
              {isEditingActualCost ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    value={actualCostInput}
                    onChange={(e) => setActualCostInput(e.target.value)}
                    className="flex-1 px-2 py-1 border border-amber-300 rounded text-lg font-bold focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveActualCost}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={handleCancelActualCost}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-2xl font-bold text-green-700">
                  {currentBatch.actualCost !== undefined
                    ? formatCurrency(currentBatch.actualCost)
                    : '-'
                  }
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">酿造完成后填写</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">差异</div>
              {currentBatch.actualCost !== undefined ? (
                <>
                  <div className={cn(
                    "text-2xl font-bold",
                    currentBatch.actualCost > currentBatch.costSnapshot.totalCost
                      ? "text-red-600"
                      : currentBatch.actualCost < currentBatch.costSnapshot.totalCost
                        ? "text-green-600"
                        : "text-gray-600"
                  )}>
                    {currentBatch.actualCost > currentBatch.costSnapshot.totalCost ? '+' : ''}
                    {formatCurrency(currentBatch.actualCost - currentBatch.costSnapshot.totalCost)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {currentBatch.actualCost > currentBatch.costSnapshot.totalCost
                      ? '超支'
                      : currentBatch.actualCost < currentBatch.costSnapshot.totalCost
                        ? '节省'
                        : '持平'}
                    {' '}
                    ({currentBatch.costSnapshot.totalCost > 0
                      ? ((Math.abs(currentBatch.actualCost - currentBatch.costSnapshot.totalCost) / currentBatch.costSnapshot.totalCost) * 100).toFixed(1)
                      : '0'}%)
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold text-gray-300">-</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">麦芽成本: </span>
              <span className="font-medium text-amber-700">{formatCurrency(currentBatch.costSnapshot.maltCost)}</span>
            </div>
            <div>
              <span className="text-gray-500">酒花成本: </span>
              <span className="font-medium text-green-700">{formatCurrency(currentBatch.costSnapshot.hopCost)}</span>
            </div>
            <div>
              <span className="text-gray-500">酵母成本: </span>
              <span className="font-medium text-purple-700">{formatCurrency(currentBatch.costSnapshot.yeastCost)}</span>
            </div>
          </div>
        </div>
      )}

      {batchEquipment.length > 0 && (
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-amber-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">酿造设备</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {batchEquipment.length} 件
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchEquipment.map((equip) => (
              <div
                key={equip.id}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all hover:shadow-md",
                  equipmentTypeBgColors[equip.type]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br text-white",
                    equipmentTypeColors[equip.type]
                  )}>
                    {equipmentTypeIcons[equip.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{equip.name}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {EQUIPMENT_TYPE_LABELS[equip.type]}
                    </div>
                    <div className="space-y-1">
                      {equip.capacityLiters > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Droplets size={12} className="text-blue-500" />
                          <span>{equip.capacityLiters}L 容量</span>
                        </div>
                      )}
                      {equip.material && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Beaker size={12} className="text-purple-500" />
                          <span>{equip.material}</span>
                        </div>
                      )}
                      {equip.purchaseDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{equip.purchaseDate} 购入</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className={cn(
          "bg-white rounded-xl p-6 border mb-6",
          anomaly.isAnomalous ? "border-red-300 ring-2 ring-red-100" : "border-gray-100"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">发酵趋势图</h3>
            {anomaly.message && (
              <span className={cn(
                "text-sm font-medium px-3 py-1 rounded-full",
                anomaly.isAnomalous
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              )}>
                {anomaly.message}
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGravity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#d97706" domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === '预期比重' || name === '比重') {
                      return [formatGravity(value), name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="比重"
                  stroke="#d97706"
                  strokeWidth={2}
                  fill="url(#colorGravity)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload?.isAnomalous) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#dc2626"
                          stroke="#991b1b"
                          strokeWidth={2}
                        />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={4} fill="#d97706" />;
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="预期比重"
                  stroke="#6b7280"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="温度"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pH"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-600" /> 实际比重
            </span>
            <span className="flex items-center gap-1">
              <span className="w-6 h-0.5 border-t-2 border-dashed border-gray-500" /> 预期比重
            </span>
            {anomaly.isAnomalous && (
              <span className="flex items-center gap-1 text-red-600">
                <span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-300" /> 异常点
              </span>
            )}
            <span className="ml-auto">阈值: {FERMENTATION_ANOMALY_THRESHOLD}</span>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8 overflow-x-auto">
          {(['overview', 'checklist', 'readings', 'deviations', 'tastings', 'photos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5",
                activeTab === tab
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab === 'overview' ? '概览' :
               tab === 'checklist' ? (<><ListTodo size={14} />酿造步骤 ({currentBatch.brewSteps?.filter(s => s.status === 'completed').length || 0}/{currentBatch.brewSteps?.length || 0}</>) :
               tab === 'readings' ? `发酵读数 (${currentBatch.readings.length})` :
               tab === 'deviations' ? `参数偏差 (${currentBatch.deviations.length})` :
               tab === 'tastings' ? `品鉴记录 (${tastings.length})` :
               `酿造照片 (${currentBatch.photos?.length || 0})`}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {currentBatch.bottlingRecord ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Wine className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900">装瓶记录</h3>
                    <p className="text-sm text-emerald-600">已完成装瓶</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white text-sm font-medium rounded-full">
                  已装瓶
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">装瓶总数</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {currentBatch.bottlingRecord.totalBottles} <span className="text-sm font-normal">瓶</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">瓶型规格</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {currentBatch.bottlingRecord.bottleSpec}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">瓶盖颜色</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: currentBatch.bottlingRecord.capColor }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {currentBatch.bottlingRecord.capColor}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin size={12} />
                    储存位置
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {currentBatch.bottlingRecord.storageLocation}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">批次追溯码</span>
                  <button
                    onClick={handleCopyTraceCode}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {copiedTraceCode ? (
                      <>
                        <Check size={14} />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        复制
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-lg font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  {currentBatch.traceCode}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  装瓶时间: {new Date(currentBatch.bottlingRecord.bottledAt).toLocaleString('zh-CN')}
                </p>
              </div>

              {currentBatch.bottlingRecord.notes && (
                <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-2">装瓶备注</div>
                  <p className="text-sm text-gray-600">{currentBatch.bottlingRecord.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Wine className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">装瓶记录</h3>
                    <p className="text-sm text-gray-500">记录装瓶信息并生成追溯码</p>
                  </div>
                </div>
                {!showBottlingForm && (
                  <button
                    onClick={() => setShowBottlingForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    <Plus size={18} />
                    记录装瓶
                  </button>
                )}
              </div>

              {showBottlingForm && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">填写装瓶信息</h4>
                  {(bottlingError || error) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-red-700 text-sm">{bottlingError || error}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">装瓶总数 *</label>
                      <input
                        type="number"
                        min="1"
                        value={bottlingForm.totalBottles}
                        onChange={(e) => { setBottlingForm({ ...bottlingForm, totalBottles: e.target.value }); if (bottlingError) setBottlingError(null); }}
                        placeholder="如: 24"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          bottlingError && (!bottlingForm.totalBottles || parseInt(bottlingForm.totalBottles) <= 0)
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">瓶型规格 *</label>
                      <input
                        type="text"
                        value={bottlingForm.bottleSpec}
                        onChange={(e) => { setBottlingForm({ ...bottlingForm, bottleSpec: e.target.value }); if (bottlingError) setBottlingError(null); }}
                        placeholder="如: 330ml 长脖瓶"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          bottlingError && !bottlingForm.bottleSpec.trim()
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">瓶盖颜色 *</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bottlingForm.capColor || '#000000'}
                          onChange={(e) => { setBottlingForm({ ...bottlingForm, capColor: e.target.value }); if (bottlingError) setBottlingError(null); }}
                          className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bottlingForm.capColor}
                          onChange={(e) => { setBottlingForm({ ...bottlingForm, capColor: e.target.value }); if (bottlingError) setBottlingError(null); }}
                          placeholder="如: #c0392b"
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                            bottlingError && !bottlingForm.capColor.trim()
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">储存位置 *</label>
                      <input
                        type="text"
                        value={bottlingForm.storageLocation}
                        onChange={(e) => { setBottlingForm({ ...bottlingForm, storageLocation: e.target.value }); if (bottlingError) setBottlingError(null); }}
                        placeholder="如: 酒窖A区第2层"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          bottlingError && !bottlingForm.storageLocation.trim()
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                    <textarea
                      value={bottlingForm.notes}
                      onChange={(e) => setBottlingForm({ ...bottlingForm, notes: e.target.value })}
                      placeholder="装瓶过程中的注意事项..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowBottlingForm(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreateBottling}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <Save size={16} />
                      确认装瓶
                    </button>
                  </div>
                </div>
              )}

              {!showBottlingForm && (
                <p className="text-sm text-gray-400 italic">
                  尚未记录装瓶信息，点击右上角"记录装瓶"开始
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">酿造笔记</h3>
              {!isEditingNotes && (
                <button
                  onClick={handleEditNotes}
                  className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Edit2 size={16} />
                  编辑笔记
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-4">
                <MarkdownEditor
                  value={notesDraft}
                  onChange={setNotesDraft}
                  placeholder="记录你的酿造过程、心得、发现..."
                  minHeight="300px"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelNotes}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingNotes ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        保存笔记
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {currentBatch.notes ? (
                  <div
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownToHtml(currentBatch.notes)
                    }}
                  />
                ) : (
                  <p className="text-gray-400 italic">暂无酿造笔记，点击右上角"编辑笔记"开始记录</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'readings' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">发酵读数</h3>
            <button
              onClick={() => setShowAddReading(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              添加读数
            </button>
          </div>

          {showAddReading && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">添加新读数</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                  <input
                    type="date"
                    value={newReading.date}
                    onChange={(e) => setNewReading({ ...newReading, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">比重</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newReading.specificGravity}
                    onChange={(e) => setNewReading({ ...newReading, specificGravity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">温度 (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReading.temperature}
                    onChange={(e) => setNewReading({ ...newReading, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReading.ph}
                    onChange={(e) => setNewReading({ ...newReading, ph: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={newReading.notes}
                  onChange={(e) => setNewReading({ ...newReading, notes: e.target.value })}
                  placeholder="如: 干投酒花、装瓶等"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddReading(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={18} />
                  取消
                </button>
                <button
                  onClick={handleAddReading}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Save size={18} />
                  保存
                </button>
              </div>
            </div>
          )}

          {currentBatch.readings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Thermometer className="mx-auto text-gray-300 mb-4" size={64} />
              <h4 className="text-lg font-medium text-gray-600 mb-2">暂无发酵读数</h4>
              <p className="text-gray-400">点击上方按钮添加第一条发酵读数</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">实际比重</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">预期比重</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">偏差</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">温度</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentBatch.readings
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(reading => {
                      const isAnomalous = anomalyDates.has(reading.date.slice(0, 10));
                      const expectedGravity = currentRecipe
                        ? calculateExpectedGravity(
                            currentBatch.brewDate,
                            reading.date,
                            currentRecipe.originalGravity,
                            currentRecipe.finalGravity
                          )
                        : null;
                      const deviation = expectedGravity !== null
                        ? reading.specificGravity - expectedGravity
                        : null;
                      return (
                        <tr
                          key={reading.id}
                          className={cn(
                            "transition-colors",
                            isAnomalous
                              ? "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500"
                              : "hover:bg-gray-50"
                          )}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              {isAnomalous && <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />}
                              <span className={isAnomalous ? "text-red-800 font-semibold" : "text-gray-900"}>
                                {reading.date}
                              </span>
                            </div>
                          </td>
                          <td className={cn(
                            "px-6 py-4 whitespace-nowrap text-sm font-medium text-right",
                            isAnomalous ? "text-red-700 font-bold" : "text-amber-700"
                          )}>
                            {reading.specificGravity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {expectedGravity !== null ? expectedGravity.toFixed(3) : '-'}
                          </td>
                          <td className={cn(
                            "px-6 py-4 whitespace-nowrap text-sm font-medium text-right",
                            deviation !== null
                              ? Math.abs(deviation) > FERMENTATION_ANOMALY_THRESHOLD
                                ? "text-red-600 font-bold"
                                : deviation > 0 ? "text-amber-600" : "text-blue-600"
                              : "text-gray-400"
                          )}>
                            {deviation !== null
                              ? `${deviation > 0 ? '+' : ''}${deviation.toFixed(4)}`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{reading.temperature}°C</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{reading.ph}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{reading.notes || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDeleteReading(reading.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <BrewChecklist
          batch={currentBatch}
          onStartStep={(stepId) => id && startBrewStep(id, stepId)}
          onCompleteStep={(stepId) => id && completeBrewStep(id, stepId)}
          onSkipStep={(stepId) => id && skipBrewStep(id, stepId)}
          onResetSteps={() => id && generateBrewSteps(id)}
          onUpdateStep={(stepId, updates) => id && updateBrewStep(id, stepId, updates)}
        />
      )}

      {activeTab === 'deviations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">参数偏差</h3>
            <button
              onClick={() => setShowAddDeviation(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              记录偏差
            </button>
          </div>

          {showAddDeviation && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">记录参数偏差</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">参数名称</label>
                  <input
                    type="text"
                    value={newDeviation.parameter}
                    onChange={(e) => setNewDeviation({ ...newDeviation, parameter: e.target.value })}
                    placeholder="如: 糖化温度、酒花添加量等"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">预期值</label>
                  <input
                    type="number"
                    step="any"
                    value={newDeviation.expected || ''}
                    onChange={(e) => setNewDeviation({ ...newDeviation, expected: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">实际值</label>
                  <input
                    type="number"
                    step="any"
                    value={newDeviation.actual || ''}
                    onChange={(e) => setNewDeviation({ ...newDeviation, actual: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                <input
                  type="text"
                  value={newDeviation.unit}
                  onChange={(e) => setNewDeviation({ ...newDeviation, unit: e.target.value })}
                  placeholder="如: °C, g, L等"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddDeviation(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={18} />
                  取消
                </button>
                <button
                  onClick={handleAddDeviation}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Save size={18} />
                  保存
                </button>
              </div>
            </div>
          )}

          {currentBatch.deviations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <AlertCircle className="mx-auto text-gray-300 mb-4" size={64} />
              <h4 className="text-lg font-medium text-gray-600 mb-2">暂无参数偏差</h4>
              <p className="text-gray-400">所有参数均按配方执行，或点击上方按钮记录偏差</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentBatch.deviations.map((deviation, idx) => {
                const diff = deviation.actual - deviation.expected;
                const diffPercent = deviation.expected > 0
                  ? ((diff / deviation.expected) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{deviation.parameter}</h4>
                      <AlertCircle size={20} className="text-amber-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">预期</div>
                        <div className="text-lg font-semibold text-gray-700">
                          {deviation.expected}{deviation.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">实际</div>
                        <div className="text-lg font-semibold text-amber-700">
                          {deviation.actual}{deviation.unit}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "text-sm font-medium",
                      diff > 0 ? "text-red-600" : "text-blue-600"
                    )}>
                      偏差: {diff > 0 ? '+' : ''}{diff}{deviation.unit} ({diff > 0 ? '+' : ''}{diffPercent}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tastings' && (
        <div>
          {tastings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Beaker className="mx-auto text-gray-300 mb-4" size={64} />
              <h4 className="text-lg font-medium text-gray-600 mb-2">暂无品鉴记录</h4>
              <p className="text-gray-400 mb-6">完成酿造后可以添加品鉴评分</p>
              <button
                onClick={() => navigate(`/tastings/new?batchId=${currentBatch.id}&recipeId=${currentBatch.recipeId}`)}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                添加品鉴
              </button>
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
                      <div className="text-sm text-gray-500 mt-1">{tasting.date}</div>
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

      {activeTab === 'photos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon className="text-amber-600" size={22} />
              酿造过程照片
            </h3>
            <span className="text-sm text-gray-500">
              共 {currentBatch.photos?.length || 0} 张照片
            </span>
          </div>
          <BrewPhotoGallery
            photos={currentBatch.photos || []}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
            onUpdateCaption={handleUpdatePhotoCaption}
          />
        </div>
      )}
    </div>
  );
}
