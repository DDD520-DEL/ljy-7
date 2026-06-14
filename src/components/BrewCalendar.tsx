import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Plus, Edit3, Trash2, Bell, X } from 'lucide-react';
import type { Batch, BrewPlan } from '../../shared/types.js';
import { BATCH_STATUS_LABELS } from '../../shared/types.js';
import { useBrewStore } from '../store/brewStore.js';
import { cn } from '../lib/utils.js';

interface BrewCalendarProps {
  batches: Batch[];
  brewPlans: BrewPlan[];
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

const statusDotColors: Record<string, string> = {
  planning: 'bg-gray-400',
  brewing: 'bg-blue-500',
  fermenting: 'bg-amber-500',
  conditioning: 'bg-purple-500',
  completed: 'bg-green-500',
};

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startWeekday = firstDay.getDay();
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
  const daysInMonth = lastDay.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  return cells;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function BrewPlanForm({
  initialPlan,
  date,
  onSave,
  onCancel,
}: {
  initialPlan?: BrewPlan | null;
  date: string;
  onSave: (data: { date: string; title: string; description: string; reminderDaysBefore: number; reminderText: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialPlan?.title || '');
  const [description, setDescription] = useState(initialPlan?.description || '');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(initialPlan?.reminderDaysBefore ?? 1);
  const [reminderText, setReminderText] = useState(initialPlan?.reminderText || '准备酵母扩培');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      date,
      title: title.trim(),
      description: description.trim(),
      reminderDaysBefore,
      reminderText: reminderText.trim() || '准备酵母扩培',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">计划标题 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：西海岸IPA酿造日"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">计划说明</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="简要说明酿造计划内容..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">提前提醒天数</label>
          <select
            value={reminderDaysBefore}
            onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value={1}>提前 1 天</option>
            <option value={2}>提前 2 天</option>
            <option value={3}>提前 3 天</option>
            <option value={5}>提前 5 天</option>
            <option value={7}>提前 7 天</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">提醒文案</label>
          <input
            type="text"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            placeholder="准备酵母扩培"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
        >
          {initialPlan ? '保存修改' : '添加计划'}
        </button>
      </div>
    </form>
  );
}

export default function BrewCalendar({ batches, brewPlans, onMonthChange }: BrewCalendarProps) {
  const navigate = useNavigate();
  const { createBrewPlan, updateBrewPlan, deleteBrewPlan } = useBrewStore();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BrewPlan | null>(null);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const batchesByDate = useMemo(() => {
    const map = new Map<string, Batch[]>();
    batches.forEach((batch) => {
      const key = batch.brewDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(batch);
    });
    return map;
  }, [batches]);

  const plansByDate = useMemo(() => {
    const map = new Map<string, BrewPlan[]>();
    brewPlans.forEach((plan) => {
      if (!map.has(plan.date)) map.set(plan.date, []);
      map.get(plan.date)!.push(plan);
    });
    return map;
  }, [brewPlans]);

  const selectedDateKey = selectedDay !== null
    ? toDateKey(currentYear, currentMonth, selectedDay)
    : null;
  const selectedBatches = selectedDateKey
    ? batchesByDate.get(selectedDateKey) ?? []
    : [];
  const selectedPlans = selectedDateKey
    ? plansByDate.get(selectedDateKey) ?? []
    : [];

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const goToPrevMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth;
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else {
      newMonth = currentMonth - 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDay(null);
    setShowPlanForm(false);
    onMonthChange?.(newYear, newMonth);
  };

  const goToNextMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth;
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    } else {
      newMonth = currentMonth + 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDay(null);
    setShowPlanForm(false);
    onMonthChange?.(newYear, newMonth);
  };

  const goToToday = () => {
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    setCurrentYear(todayYear);
    setCurrentMonth(todayMonth);
    setSelectedDay(today.getDate());
    setShowPlanForm(false);
    onMonthChange?.(todayYear, todayMonth);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    setShowPlanForm(true);
  };

  const handleEditPlan = (plan: BrewPlan) => {
    setEditingPlan(plan);
    setShowPlanForm(true);
  };

  const handleSavePlan = async (data: { date: string; title: string; description: string; reminderDaysBefore: number; reminderText: string }) => {
    if (editingPlan) {
      await updateBrewPlan(editingPlan.id, data);
    } else {
      await createBrewPlan({
        ...data,
        createdBy: 'currentUser',
      });
    }
    setShowPlanForm(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = async (planId: string) => {
    await deleteBrewPlan(planId);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          酿造日历
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-1 rounded-lg hover:bg-amber-50 transition-colors"
          >
            今天
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg hover:bg-amber-50 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {currentYear}年 {MONTH_NAMES[currentMonth]}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-amber-50 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="bg-gray-50 text-center py-2 text-xs font-medium text-gray-500"
          >
            {wd}
          </div>
        ))}
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-white min-h-[72px]" />;
          }
          const dateKey = toDateKey(currentYear, currentMonth, day);
          const dayBatches = batchesByDate.get(dateKey) ?? [];
          const dayPlans = plansByDate.get(dateKey) ?? [];
          const hasContent = dayBatches.length > 0 || dayPlans.length > 0;
          const isToday = dateKey === todayKey;
          const isSelected = selectedDay === day;

          return (
            <button
              key={dateKey}
              onClick={() => { setSelectedDay(day); setShowPlanForm(false); }}
              className={cn(
                'bg-white min-h-[72px] p-1.5 text-left transition-colors relative',
                isSelected && 'bg-amber-50',
                !isSelected && 'hover:bg-gray-50',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
                  isToday && 'bg-amber-600 text-white font-bold',
                  !isToday && isSelected && 'bg-amber-200 text-amber-800 font-medium',
                  !isToday && !isSelected && 'text-gray-700',
                )}
              >
                {day}
              </span>
              {hasContent && (
                <div className="mt-0.5 space-y-0.5">
                  {dayBatches.slice(0, 1).map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center gap-1"
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          statusDotColors[batch.status],
                        )}
                      />
                      <span className="text-[10px] text-gray-600 truncate leading-tight">
                        {batch.name}
                      </span>
                    </div>
                  ))}
                  {dayPlans.slice(0, 1).map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500" />
                      <span className="text-[10px] text-emerald-700 truncate leading-tight">
                        {plan.title}
                      </span>
                    </div>
                  ))}
                  {(dayBatches.length + dayPlans.length > 2) && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      +{dayBatches.length + dayPlans.length - 2}更多
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              {currentYear}年{currentMonth + 1}月{selectedDay}日
            </h4>
            <button
              onClick={handleAddPlan}
              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加酿造计划
            </button>
          </div>

          {showPlanForm && selectedDateKey && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-amber-800">
                  {editingPlan ? '编辑酿造计划' : '新建酿造计划'}
                </h5>
                <button
                  onClick={() => { setShowPlanForm(false); setEditingPlan(null); }}
                  className="text-amber-600 hover:text-amber-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <BrewPlanForm
                initialPlan={editingPlan}
                date={selectedDateKey}
                onSave={handleSavePlan}
                onCancel={() => { setShowPlanForm(false); setEditingPlan(null); }}
              />
            </div>
          )}

          {selectedBatches.length === 0 && selectedPlans.length === 0 && !showPlanForm && (
            <p className="text-sm text-gray-400 py-2">当日无酿造批次或计划</p>
          )}

          {selectedPlans.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-emerald-800 truncate">{plan.title}</span>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-emerald-600 ml-4 mb-1">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-2 ml-4">
                        <Bell className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-amber-700">
                          提前{plan.reminderDaysBefore}天提醒：{plan.reminderText}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedBatches.length > 0 && (
            <div className="space-y-2">
              {selectedBatches.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => navigate(`/batches/${batch.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-3 h-3 rounded-full flex-shrink-0',
                        statusDotColors[batch.status],
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-amber-700">
                        {batch.name}
                      </p>
                      {batch.recipeName && (
                        <p className="text-xs text-gray-500">{batch.recipeName}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      batch.status === 'completed' && 'bg-green-100 text-green-700',
                      batch.status === 'fermenting' && 'bg-amber-100 text-amber-700',
                      batch.status === 'conditioning' && 'bg-purple-100 text-purple-700',
                      batch.status === 'brewing' && 'bg-blue-100 text-blue-700',
                      batch.status === 'planning' && 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {BATCH_STATUS_LABELS[batch.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        {Object.entries(statusDotColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', color)} />
            <span>{BATCH_STATUS_LABELS[status as keyof typeof BATCH_STATUS_LABELS]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>酿造计划</span>
        </div>
      </div>
    </div>
  );
}
