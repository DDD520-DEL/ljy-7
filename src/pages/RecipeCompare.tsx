import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCompare, Check, X, Scale } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { cn } from '../lib/utils.js';

const FIELD_LABELS: Record<string, string> = {
  name: '配方名称',
  style: '啤酒风格',
  description: '描述',
  batchSize: '批次容量',
  originalGravity: '原始比重',
  finalGravity: '最终比重',
  abv: '酒精度 (ABV)',
  ibu: '苦度 (IBU)',
  srm: '色度 (SRM)',
  malts: '麦芽配比',
  hops: '酒花投放',
  yeast: '酵母菌株',
  mashSteps: '糖化温度曲线',
  version: '版本号',
};

export default function RecipeCompare() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipeVersions, comparison, currentRecipe, loading, error, fetchRecipeVersions, compareRecipes, fetchRecipeById } = useBrewStore();
  const [compareWithId, setCompareWithId] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchRecipeById(id);
      fetchRecipeVersions(id);
    }
    return () => {
      useBrewStore.getState().clearCurrent();
    };
  }, [id, fetchRecipeById, fetchRecipeVersions]);

  useEffect(() => {
    if (recipeVersions.length >= 2 && !compareWithId) {
      const otherVersions = recipeVersions.filter(r => r.id !== id);
      if (otherVersions.length > 0) {
        setCompareWithId(otherVersions[0].id);
      }
    }
  }, [recipeVersions, compareWithId, id]);

  useEffect(() => {
    if (id && compareWithId && id !== compareWithId) {
      compareRecipes(id, compareWithId);
    }
  }, [id, compareWithId, compareRecipes]);

  const getVersionA = () => recipeVersions.find(r => r.id === id);
  const getVersionB = () => recipeVersions.find(r => r.id === compareWithId);

  const formatValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map((item, idx) => `${idx + 1}. ${JSON.stringify(item)}`).join('\n');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderArrayDiff = (field: string, arrA: unknown[], arrB: unknown[]) => {
    const maxLen = Math.max(arrA.length, arrB.length);
    const items = [];
    for (let i = 0; i < maxLen; i++) {
      const itemA = arrA[i];
      const itemB = arrB[i];
      const isSame = JSON.stringify(itemA) === JSON.stringify(itemB);
      items.push(
        <div key={i} className={cn(
          "grid grid-cols-2 gap-4 p-2 border-b border-gray-100 last:border-0",
          !isSame && "bg-red-50"
        )}>
          <div className={cn("text-sm", !itemA && "text-gray-400")}>
            {itemA ? formatValue(itemA) : '-'}
          </div>
          <div className={cn("text-sm", !itemB && "text-gray-400", !isSame && itemB && "text-red-600 font-medium")}>
            {itemB ? formatValue(itemB) : '-'}
          </div>
        </div>
      );
    }
    return <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">{items}</div>;
  };

  if (loading && !currentRecipe) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Scale size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  const versionA = getVersionA();
  const versionB = getVersionB();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(id ? `/recipes/${id}` : '/recipes')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
              <GitCompare className="text-amber-600" />
              配方版本对比
            </h1>
            <p className="text-gray-600 mt-1">对比两个版本之间的参数差异</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">版本 A</label>
          <select
            value={id || ''}
            onChange={(e) => navigate(`/compare/${e.target.value}`)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {recipeVersions.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} - v{r.version} {r.branchName ? `(${r.branchName})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">版本 B</label>
          <select
            value={compareWithId}
            onChange={(e) => setCompareWithId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {recipeVersions.filter(r => r.id !== id).map(r => (
              <option key={r.id} value={r.id}>
                {r.name} - v{r.version} {r.branchName ? `(${r.branchName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {versionA && versionB && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="font-semibold text-blue-900">{versionA.name}</div>
            <div className="text-sm text-blue-600">v{versionA.version} {versionA.branchName && `(${versionA.branchName})`}</div>
            <div className="text-xs text-blue-500 mt-1">创建于 {new Date(versionA.createdAt).toLocaleDateString('zh-CN')}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="font-semibold text-amber-900">{versionB.name}</div>
            <div className="text-sm text-amber-600">v{versionB.version} {versionB.branchName && `(${versionB.branchName})`}</div>
            <div className="text-xs text-amber-500 mt-1">创建于 {new Date(versionB.createdAt).toLocaleDateString('zh-CN')}</div>
          </div>
        </div>
      )}

      {comparison.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span className="text-gray-600">无差异</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
              <span className="text-gray-600">有差异</span>
            </div>
            <div className="text-sm text-gray-500">
              共 {comparison.filter(c => c.isDifferent).length} 处差异
            </div>
          </div>

          {comparison.map((item) => (
            <div
              key={item.field}
              className={cn(
                "bg-white rounded-xl border overflow-hidden",
                item.isDifferent ? "border-red-200" : "border-gray-100"
              )}
            >
              <div className={cn(
                "px-6 py-3 flex items-center justify-between",
                item.isDifferent ? "bg-red-50" : "bg-gray-50"
              )}>
                <div className="flex items-center gap-3">
                  {item.isDifferent ? (
                    <X size={18} className="text-red-500" />
                  ) : (
                    <Check size={18} className="text-green-500" />
                  )}
                  <span className="font-medium text-gray-900">{FIELD_LABELS[item.field] || item.field}</span>
                </div>
                {item.isDifferent && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">已更改</span>
                )}
              </div>
              <div className="p-6">
                {Array.isArray(item.versionA) || Array.isArray(item.versionB) ? (
                  renderArrayDiff(
                    item.field,
                    Array.isArray(item.versionA) ? item.versionA : [],
                    Array.isArray(item.versionB) ? item.versionB : []
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">版本 A</div>
                      <div className={cn(
                        "text-sm whitespace-pre-wrap",
                        item.isDifferent && "text-gray-500 line-through"
                      )}>
                        {formatValue(item.versionA)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">版本 B</div>
                      <div className={cn(
                        "text-sm whitespace-pre-wrap",
                        item.isDifferent && "text-red-600 font-medium"
                      )}>
                        {formatValue(item.versionB)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
