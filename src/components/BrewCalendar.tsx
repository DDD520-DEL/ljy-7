import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Batch } from '../../shared/types.js';
import { BATCH_STATUS_LABELS } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

interface BrewCalendarProps {
  batches: Batch[];
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

export default function BrewCalendar({ batches }: BrewCalendarProps) {
  const navigate = useNavigate();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  const selectedDateKey = selectedDay !== null
    ? toDateKey(currentYear, currentMonth, selectedDay)
    : null;
  const selectedBatches = selectedDateKey
    ? batchesByDate.get(selectedDateKey) ?? []
    : [];

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          酿造日历
        </h2>
        <button
          onClick={goToToday}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-1 rounded-lg hover:bg-amber-50 transition-colors"
        >
          今天
        </button>
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
          const isToday = dateKey === todayKey;
          const isSelected = selectedDay === day;

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDay(day)}
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
              {dayBatches.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {dayBatches.slice(0, 2).map((batch) => (
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
                  {dayBatches.length > 2 && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      +{dayBatches.length - 2}更多
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
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {currentYear}年{currentMonth + 1}月{selectedDay}日 酿造批次
          </h4>
          {selectedBatches.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">当日无酿造批次</p>
          ) : (
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

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        {Object.entries(statusDotColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', color)} />
            <span>{BATCH_STATUS_LABELS[status as keyof typeof BATCH_STATUS_LABELS]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
