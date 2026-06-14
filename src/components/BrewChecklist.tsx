import { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Pause, Check, SkipForward, RotateCcw, Clock, Timer, CheckCircle2, Circle, Loader2, Info, Leaf, ThermometerSun, Flame, Droplets, Wind, Beaker } from 'lucide-react';
import type { Batch, BrewStep, BrewStepType } from '../../shared/types.js';
import { BREW_STEP_TYPE_LABELS, BREW_STEP_STATUS_LABELS } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

interface BrewChecklistProps {
  batch: Batch;
  onStartStep: (stepId: string) => void;
  onCompleteStep: (stepId: string) => void;
  onSkipStep: (stepId: string) => void;
  onResetSteps: () => void;
  onUpdateStep: (stepId: string, updates: Partial<BrewStep>) => void;
}

const stepTypeIcons: Record<BrewStepType, React.ReactNode> = {
  milling: <Beaker className="w-5 h-5" />,
  mashing: <ThermometerSun className="w-5 h-5" />,
  lautering: <Droplets className="w-5 h-5" />,
  boiling: <Flame className="w-5 h-5" />,
  hop_addition: <Leaf className="w-5 h-5" />,
  cooling: <Droplets className="w-5 h-5" />,
  oxygenation: <Wind className="w-5 h-5" />,
  pitching: <Beaker className="w-5 h-5" />,
};

const stepTypeColors: Record<BrewStepType, string> = {
  milling: 'from-slate-500 to-slate-600',
  mashing: 'from-amber-500 to-orange-600',
  lautering: 'from-cyan-500 to-teal-600',
  boiling: 'from-red-500 to-orange-600',
  hop_addition: 'from-green-500 to-emerald-600',
  cooling: 'from-blue-500 to-cyan-600',
  oxygenation: 'from-sky-500 to-blue-600',
  pitching: 'from-violet-500 to-purple-600',
};

const stepTypeBgColors: Record<BrewStepType, string> = {
  milling: 'bg-slate-50 border-slate-200',
  mashing: 'bg-amber-50 border-amber-200',
  lautering: 'bg-cyan-50 border-cyan-200',
  boiling: 'bg-red-50 border-red-200',
  hop_addition: 'bg-green-50 border-green-200',
  cooling: 'bg-blue-50 border-blue-200',
  oxygenation: 'bg-sky-50 border-sky-200',
  pitching: 'bg-violet-50 border-violet-200',
};

function formatDuration(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;
  const sign = totalSeconds < 0 ? '-' : '';
  if (hours > 0) {
    return `${sign}${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function BrewStepItem({
  step,
  index,
  isRunning,
  remainingSeconds,
  elapsedSeconds,
  onStart,
  onPause,
  onComplete,
  onSkip,
  onToggleComplete,
  onUpdateStep,
}: {
  step: BrewStep;
  index: number;
  isRunning: boolean;
  remainingSeconds: number;
  elapsedSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onToggleComplete: () => void;
  onUpdateStep: (updates: Partial<BrewStep>) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const totalSeconds = step.plannedDurationMinutes * 60;
  const progress = step.status === 'completed'
    ? 100
    : step.status === 'in_progress'
    ? Math.min(100, (elapsedSeconds / totalSeconds) * 100)
    : 0;
  const isOverdue = step.status === 'in_progress' && remainingSeconds < 0;

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 transition-all duration-300',
        stepTypeBgColors[step.type],
        step.status === 'in_progress' && 'ring-2 ring-amber-400 ring-offset-2 shadow-lg scale-[1.01]',
        step.status === 'completed' && 'opacity-80',
        step.status === 'skipped' && 'opacity-50 grayscale'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <button
              onClick={onToggleComplete}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                step.status === 'completed'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : step.status === 'skipped'
                  ? 'bg-gray-400 text-white hover:bg-gray-500'
                  : step.status === 'in_progress'
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'border-2 border-gray-300 bg-white hover:border-amber-400'
              )}
              disabled={step.status === 'skipped'}
            >
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : step.status === 'skipped' ? (
                <SkipForward className="w-4 h-4" />
              ) : step.status === 'in_progress' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                步骤 {index + 1}
              </span>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-xs font-medium bg-gradient-to-r',
                stepTypeColors[step.type]
              )}>
                {stepTypeIcons[step.type]}
                {BREW_STEP_TYPE_LABELS[step.type]}
              </div>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                step.status === 'pending' && 'bg-gray-100 text-gray-600',
                step.status === 'in_progress' && 'bg-amber-100 text-amber-700',
                step.status === 'completed' && 'bg-green-100 text-green-700',
                step.status === 'skipped' && 'bg-gray-100 text-gray-500 line-through'
              )}>
                {BREW_STEP_STATUS_LABELS[step.status]}
              </span>
            </div>

            <h4 className={cn(
              'font-semibold text-gray-900 mb-1',
              step.status === 'skipped' && 'line-through'
            )}>
              {step.name}
            </h4>

            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {step.description}
            </p>

            {step.hopDetail && (
              <div className="mb-3 bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-green-700 mb-2">
                  <Leaf className="w-3.5 h-3.5" />
                  酒花详情
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">名称: </span>
                    <span className="font-medium text-gray-800">{step.hopDetail.hopName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">用量: </span>
                    <span className="font-medium text-gray-800">{step.hopDetail.hopWeight}g</span>
                  </div>
                  <div>
                    <span className="text-gray-500">α酸: </span>
                    <span className="font-medium text-gray-800">{step.hopDetail.alphaAcid}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">煮沸: </span>
                    <span className="font-medium text-gray-800">{step.hopDetail.boilTimeMinutes}分钟</span>
                  </div>
                </div>
              </div>
            )}

            {step.mashDetail && (
              <div className="mb-3 bg-white rounded-lg p-3 border border-amber-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
                  <ThermometerSun className="w-3.5 h-3.5" />
                  糖化参数
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">目标温度: </span>
                  <span className="font-medium text-gray-800">{step.mashDetail.temperature}°C</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">预设:</span>
                <span className="font-semibold text-gray-700">{step.plannedDurationMinutes} 分钟</span>
              </div>
              {step.actualDurationMinutes !== undefined && step.status !== 'in_progress' && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Timer className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">实际:</span>
                  <span className={cn(
                    'font-semibold',
                    step.status === 'skipped' ? 'text-gray-400' :
                    step.actualDurationMinutes > step.plannedDurationMinutes ? 'text-red-600' :
                    step.actualDurationMinutes < step.plannedDurationMinutes ? 'text-blue-600' :
                    'text-green-600'
                  )}>
                    {step.status === 'skipped' ? '跳过' : `${step.actualDurationMinutes} 分钟`}
                    {step.status !== 'skipped' && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({step.actualDurationMinutes >= step.plannedDurationMinutes ? '+' : ''}
                        {step.actualDurationMinutes - step.plannedDurationMinutes}分)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {step.status === 'in_progress' && (
                <div className={cn(
                  'flex items-center gap-1.5 text-lg font-bold font-mono px-3 py-1 rounded-lg',
                  isOverdue
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-amber-100 text-amber-700'
                )}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isOverdue ? `超时 ${formatDuration(Math.abs(remainingSeconds))}` : formatDuration(remainingSeconds)}
                </div>
              )}
            </div>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'in_progress' ? (isOverdue ? 'bg-red-500' : 'bg-amber-500') :
                  step.status === 'skipped' ? 'bg-gray-400' : 'bg-gray-300'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {step.status === 'pending' && (
                <>
                  <button
                    onClick={onStart}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    开始计时
                  </button>
                  <button
                    onClick={onToggleComplete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    标记完成
                  </button>
                  <button
                    onClick={onSkip}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    跳过
                  </button>
                </>
              )}
              {step.status === 'in_progress' && (
                <>
                  <button
                    onClick={isRunning ? onPause : onStart}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                      isRunning
                        ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    )}
                  >
                    {isRunning ? (
                      <><Pause className="w-4 h-4" />暂停</>
                    ) : (
                      <><Play className="w-4 h-4" />继续</>
                    )}
                  </button>
                  <button
                    onClick={onComplete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    完成
                  </button>
                  <button
                    onClick={onSkip}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    跳过
                  </button>
                </>
              )}
              {(step.status === 'completed' || step.status === 'skipped') && (
                <button
                  onClick={onStart}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新开始
                </button>
              )}
              <button
                onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors"
              >
                <Info className="w-4 h-4" />
                备注
              </button>
            </div>
          </div>
        </div>

        {showNote && (
          <div className="mt-4 pt-4 border-t border-gray-200/60">
            <label className="block text-sm font-medium text-gray-700 mb-1">步骤备注</label>
            <textarea
              value={step.notes || ''}
              onChange={(e) => onUpdateStep({ notes: e.target.value })}
              placeholder="记录本步骤的实际情况、发现的问题..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrewChecklist({
  batch,
  onStartStep,
  onCompleteStep,
  onSkipStep,
  onResetSteps,
  onUpdateStep,
}: BrewChecklistProps) {
  const [runningStepId, setRunningStepId] = useState<string | null>(null);
  const [pausedStepId, setPausedStepId] = useState<string | null>(null);
  const [pausedElapsed, setPausedElapsed] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);

  const steps = useMemo(() => {
    return [...(batch.brewSteps || [])].sort((a, b) => a.order - b.order);
  }, [batch.brewSteps]);

  const stats = useMemo(() => {
    const total = steps.length;
    const completed = steps.filter(s => s.status === 'completed').length;
    const skipped = steps.filter(s => s.status === 'skipped').length;
    const inProgress = steps.filter(s => s.status === 'in_progress').length;
    const pending = steps.filter(s => s.status === 'pending').length;
    const plannedTotal = steps.reduce((sum, s) => sum + s.plannedDurationMinutes, 0);
    const actualTotal = steps.reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0);
    return { total, completed, skipped, inProgress, pending, plannedTotal, actualTotal };
  }, [steps]);

  useEffect(() => {
    if (!runningStepId) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [runningStepId]);

  const getElapsedSeconds = useCallback((step: BrewStep): number => {
    if (step.status !== 'in_progress') return 0;
    if (pausedStepId === step.id) {
      return pausedElapsed[step.id] || 0;
    }
    const fromPaused = pausedElapsed[step.id] || 0;
    if (!step.startedAt) return fromPaused;
    const fromStart = Math.floor((Date.now() - new Date(step.startedAt).getTime()) / 1000);
    return fromPaused + fromStart;
  }, [pausedStepId, pausedElapsed, tick]);

  const getRemainingSeconds = useCallback((step: BrewStep): number => {
    const total = step.plannedDurationMinutes * 60;
    return total - getElapsedSeconds(step);
  }, [getElapsedSeconds]);

  const handleStart = (step: BrewStep) => {
    if (pausedStepId === step.id) {
      setPausedStepId(null);
    } else {
      onStartStep(step.id);
    }
    setRunningStepId(step.id);
  };

  const handlePause = (step: BrewStep) => {
    setPausedStepId(step.id);
    setPausedElapsed(prev => ({
      ...prev,
      [step.id]: getElapsedSeconds(step),
    }));
    setRunningStepId(null);
  };

  const handleComplete = (step: BrewStep) => {
    setRunningStepId(null);
    setPausedStepId(null);
    setPausedElapsed(prev => {
      const next = { ...prev };
      delete next[step.id];
      return next;
    });
    onCompleteStep(step.id);
  };

  const handleSkip = (step: BrewStep) => {
    if (runningStepId === step.id) setRunningStepId(null);
    if (pausedStepId === step.id) setPausedStepId(null);
    onSkipStep(step.id);
  };

  const handleToggleComplete = (step: BrewStep) => {
    if (step.status === 'completed' || step.status === 'skipped') {
      handleStart(step);
    } else {
      handleComplete(step);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
        <Timer className="mx-auto text-gray-300 mb-4" size={64} />
        <h4 className="text-lg font-medium text-gray-600 mb-2">暂无酿造步骤</h4>
        <p className="text-gray-400 mb-4">点击下方按钮为该批次生成标准酿造步骤</p>
        <button
          onClick={onResetSteps}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          生成酿造步骤
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">酿造日操作清单</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              共 {stats.total} 个步骤 · 总预设时长 {stats.plannedTotal} 分钟
              {stats.actualTotal > 0 && ` · 已耗时 ${stats.actualTotal} 分钟`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetSteps}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
              重置步骤
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
            <div className="text-xs text-gray-500 mt-0.5">待开始</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">{stats.inProgress}</div>
            <div className="text-xs text-amber-600 mt-0.5">进行中</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            <div className="text-xs text-green-600 mt-0.5">已完成</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.skipped}</div>
            <div className="text-xs text-gray-500 mt-0.5">已跳过</div>
          </div>
        </div>

        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-green-500 transition-all duration-500"
            style={{ width: `${stats.total > 0 ? ((stats.completed + stats.skipped) / stats.total) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>进度</span>
          <span className="font-medium text-gray-700">
            {stats.total > 0
              ? `${Math.round(((stats.completed + stats.skipped) / stats.total) * 100)}% (${stats.completed + stats.skipped}/${stats.total})`
              : '0%'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <BrewStepItem
            key={step.id}
            step={step}
            index={index}
            isRunning={runningStepId === step.id}
            remainingSeconds={getRemainingSeconds(step)}
            elapsedSeconds={getElapsedSeconds(step)}
            onStart={() => handleStart(step)}
            onPause={() => handlePause(step)}
            onComplete={() => handleComplete(step)}
            onSkip={() => handleSkip(step)}
            onToggleComplete={() => handleToggleComplete(step)}
            onUpdateStep={(updates) => onUpdateStep(step.id, updates)}
          />
        ))}
      </div>
    </div>
  );
}
