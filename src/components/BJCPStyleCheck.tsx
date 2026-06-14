import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, Beaker, Eye, RefreshCw } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { cn } from '../lib/utils.js';
import type { BJCPParameterCheck, BJCPStyleCheckResult, BJCPDeviationLevel } from '../../shared/types.js';
import { getSRMColor } from '../utils/calculations.js';

interface BJCPStyleCheckProps {
  recipeId: string;
  recipeStyle: string;
}

const getDeviationIcon = (level: BJCPDeviationLevel) => {
  switch (level) {
    case 'compliant':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'warning':
      return <AlertTriangle className="text-yellow-500" size={20} />;
    case 'error':
      return <XCircle className="text-red-500" size={20} />;
  }
};

const getDeviationBgColor = (level: BJCPDeviationLevel) => {
  switch (level) {
    case 'compliant':
      return 'bg-green-50 border-green-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'error':
      return 'bg-red-50 border-red-200';
  }
};

const getDeviationTextColor = (level: BJCPDeviationLevel) => {
  switch (level) {
    case 'compliant':
      return 'text-green-700';
    case 'warning':
      return 'text-yellow-700';
    case 'error':
      return 'text-red-700';
  }
};

const formatValue = (parameter: string, value: number): string => {
  if (parameter === 'og' || parameter === 'fg') {
    return value.toFixed(3);
  }
  if (parameter === 'abv') {
    return `${value.toFixed(1)}%`;
  }
  return value.toFixed(1);
};

const ParameterCheckItem = ({ check }: { check: BJCPParameterCheck }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        getDeviationBgColor(check.deviationLevel)
      )}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          {getDeviationIcon(check.deviationLevel)}
          <div>
            <div className={cn('font-semibold', getDeviationTextColor(check.deviationLevel))}>
              {check.parameterName}
            </div>
            <div className="text-sm text-gray-600">
              当前值: <span className="font-medium">{formatValue(check.parameter, check.actual)}</span>
              {' · '}
              标准范围: {formatValue(check.parameter, check.min)} - {formatValue(check.parameter, check.max)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {check.deviationLevel !== 'compliant' && (
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              check.deviationLevel === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            )}>
              偏离 {check.deviationPercent}%
            </span>
          )}
          {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-gray-500 mt-0.5 shrink-0" />
            <p className={cn('text-sm', getDeviationTextColor(check.deviationLevel))}>
              {check.suggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SRMColorBar = ({ srm, min, max }: { srm: number; min: number; max: number }) => {
  const displaySrm = Math.min(Math.max(srm, 1), 40);
  const minDisplay = Math.min(Math.max(min, 1), 40);
  const maxDisplay = Math.min(Math.max(max, 1), 40);
  
  const levels = [];
  for (let i = 1; i <= 40; i++) {
    levels.push(i);
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-1">色度参考 (SRM {srm})</div>
      <div className="h-8 rounded-full overflow-hidden flex">
        {levels.map((level) => {
          const isCurrent = level === Math.round(displaySrm);
          const isMin = level === Math.round(minDisplay);
          const isMax = level === Math.round(maxDisplay);
          
          return (
            <div
              key={level}
              className="flex-1 relative"
              style={{ backgroundColor: getSRMColor(level) }}
              title={`SRM ${level}`}
            >
              {isCurrent && (
                <div className="absolute inset-0 border-2 border-white ring-2 ring-amber-500 rounded" />
              )}
              {isMin && (
                <div className="absolute top-0 left-0 bottom-0 w-px bg-gray-800" />
              )}
              {isMax && (
                <div className="absolute top-0 right-0 bottom-0 w-px bg-gray-800" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>浅</span>
        <span className="text-amber-600 font-medium">当前值: {srm}</span>
        <span>标准范围: {min}-{max}</span>
        <span>深</span>
      </div>
    </div>
  );
};

export default function BJCPStyleCheck({ recipeId, recipeStyle }: BJCPStyleCheckProps) {
  const { bjcpCheckResult, loading, checkBJCPStyleCompliance, clearBJCPCheck } = useBrewStore();
  const [showStyleGuide, setShowStyleGuide] = useState(false);

  const handleCheck = async () => {
    await checkBJCPStyleCompliance(recipeId);
  };

  const handleReset = () => {
    clearBJCPCheck();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (!bjcpCheckResult) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Beaker className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">BJCP 风格合规性检查</h3>
            <p className="text-sm text-gray-500">一键检测配方参数是否符合目标风格标准</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="text-amber-600" size={16} />
            <span className="text-sm font-medium text-amber-800">当前风格</span>
          </div>
          <p className="text-amber-700 font-semibold">{recipeStyle}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            <span>色度 (SRM) 范围检查</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            <span>苦度 (IBU) 范围检查</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            <span>酒精度 (ABV) 范围检查</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            <span>原始比重 (OG) 范围检查</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            <span>最终比重 (FG) 范围检查</span>
          </div>
        </div>

        <button
          onClick={handleCheck}
          disabled={loading}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              检测中...
            </>
          ) : (
            <>
              <Eye size={18} />
              开始检测
            </>
          )}
        </button>
      </div>
    );
  }

  const result = bjcpCheckResult as BJCPStyleCheckResult;

  if (!result.styleFound) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertTriangle className="text-gray-500" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">BJCP 风格合规性检查</h3>
              <p className="text-sm text-gray-500">未找到风格数据</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            重新检测
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">{result.summary}</p>
        </div>
      </div>
    );
  }

  const styleGuide = result.styleGuide!;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center',
              getScoreBgColor(result.overallScore)
            )}>
              <span className={cn('text-2xl font-bold', getScoreColor(result.overallScore))}>
                {result.overallScore}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">BJCP 风格合规性检查</h3>
              <p className="text-sm text-gray-500">
                {styleGuide.category} · {result.style}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle size={14} />
                  {result.compliantCount} 项合规
                </span>
                {result.warningCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    <AlertTriangle size={14} />
                    {result.warningCount} 项警告
                  </span>
                )}
                {result.errorCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle size={14} />
                    {result.errorCount} 项偏离
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            重新检测
          </button>
        </div>
      </div>

      <div className={cn(
        'p-4 border-b',
        result.errorCount > 0
          ? 'bg-red-50 border-red-100'
          : result.warningCount > 0
          ? 'bg-yellow-50 border-yellow-100'
          : 'bg-green-50 border-green-100'
      )}>
        <p className={cn(
          'text-sm',
          result.errorCount > 0
            ? 'text-red-700'
            : result.warningCount > 0
            ? 'text-yellow-700'
            : 'text-green-700'
        )}>
          {result.summary}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {result.checks.map((check, index) => (
          <div key={index}>
            <ParameterCheckItem check={check} />
            {check.parameter === 'srm' && (
              <div className="mt-3 ml-6">
                <SRMColorBar srm={check.actual} min={check.min} max={check.max} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowStyleGuide(!showStyleGuide)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">查看 {result.style} 风格详细描述</span>
          {showStyleGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showStyleGuide && (
          <div className="px-6 pb-6 space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">风格描述</h4>
              <p className="text-gray-600">{styleGuide.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">香气</h4>
                <p className="text-gray-600">{styleGuide.aroma}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">外观</h4>
                <p className="text-gray-600">{styleGuide.appearance}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">风味</h4>
                <p className="text-gray-600">{styleGuide.flavor}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">口感</h4>
                <p className="text-gray-600">{styleGuide.mouthfeel}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">酿造建议</h4>
              <p className="text-gray-600">{styleGuide.comments}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">标准参数范围</h4>
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-amber-600">{styleGuide.srm.min}-{styleGuide.srm.max}</div>
                  <div className="text-xs text-gray-500">SRM</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-amber-600">{styleGuide.ibu.min}-{styleGuide.ibu.max}</div>
                  <div className="text-xs text-gray-500">IBU</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-amber-600">{styleGuide.abv.min}-{styleGuide.abv.max}%</div>
                  <div className="text-xs text-gray-500">ABV</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-amber-600">{styleGuide.og.min.toFixed(3)}-{styleGuide.og.max.toFixed(3)}</div>
                  <div className="text-xs text-gray-500">OG</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-amber-600">{styleGuide.fg.min.toFixed(3)}-{styleGuide.fg.max.toFixed(3)}</div>
                  <div className="text-xs text-gray-500">FG</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
