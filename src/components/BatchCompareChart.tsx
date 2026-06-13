import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Batch } from '../../shared/types.js';

const BATCH_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
];

interface BatchCompareChartProps {
  batches: Batch[];
}

interface MergedDataPoint {
  day: number;
  [key: string]: number | undefined;
}

function getFermentationDay(brewDate: string, readingDate: string): number {
  const brew = new Date(brewDate.slice(0, 10)).getTime();
  const reading = new Date(readingDate.slice(0, 10)).getTime();
  return Math.max(0, Math.round((reading - brew) / (1000 * 60 * 60 * 24)));
}

function CustomTooltip({ active, payload, label, batches }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: number;
  batches: Batch[];
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[180px]">
      <p className="text-sm font-semibold text-gray-700 mb-2">第 {label} 天</p>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const batchId = entry.dataKey.replace(/-sg$/, '').replace(/-temp$/, '');
          const isTemp = entry.dataKey.endsWith('-temp');
          const batch = batches.find(b => b.id === batchId);
          if (!batch) return null;
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 truncate flex-1">{batch.name}</span>
              <span className="font-medium text-gray-800">
                {isTemp ? `${entry.value}°C` : entry.value.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BatchCompareChart({ batches }: BatchCompareChartProps) {
  const { gravityData, temperatureData } = useMemo(() => {
    const dayMap = new Map<number, MergedDataPoint>();

    batches.forEach((batch) => {
      const sorted = [...batch.readings].sort((a, b) => a.date.localeCompare(b.date));
      sorted.forEach((reading) => {
        const day = getFermentationDay(batch.brewDate, reading.date);
        if (!dayMap.has(day)) {
          dayMap.set(day, { day });
        }
        const point = dayMap.get(day)!;
        point[`${batch.id}-sg`] = reading.specificGravity;
        point[`${batch.id}-temp`] = reading.temperature;
      });
    });

    const sorted = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);

    return {
      gravityData: sorted,
      temperatureData: sorted,
    };
  }, [batches]);

  const allSgValues = useMemo(() => {
    const vals: number[] = [];
    batches.forEach(b => b.readings.forEach(r => vals.push(r.specificGravity)));
    return vals;
  }, [batches]);

  const allTempValues = useMemo(() => {
    const vals: number[] = [];
    batches.forEach(b => b.readings.forEach(r => vals.push(r.temperature)));
    return vals;
  }, [batches]);

  const sgDomain = useMemo(() => {
    if (allSgValues.length === 0) return [1.0, 1.1] as [number, number];
    const min = Math.min(...allSgValues);
    const max = Math.max(...allSgValues);
    const padding = (max - min) * 0.1 || 0.005;
    return [Math.floor((min - padding) * 1000) / 1000, Math.ceil((max + padding) * 1000) / 1000] as [number, number];
  }, [allSgValues]);

  const tempDomain = useMemo(() => {
    if (allTempValues.length === 0) return [0, 30] as [number, number];
    const min = Math.min(...allTempValues);
    const max = Math.max(...allTempValues);
    const padding = Math.max((max - min) * 0.1, 2);
    return [Math.floor(min - padding), Math.ceil(max + padding)] as [number, number];
  }, [allTempValues]);

  if (batches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <p>请选择至少一个批次进行对比</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h4 className="text-base font-semibold text-gray-800 mb-4">比重对比</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gravityData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                label={{ value: '发酵天数', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#9ca3af' }}
              />
              <YAxis
                domain={sgDomain}
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => v.toFixed(3)}
              />
              <Tooltip content={<CustomTooltip batches={batches} />} />
              <Legend
                formatter={(value: string) => {
                  const batchId = value.replace(/-sg$/, '');
                  const batch = batches.find(b => b.id === batchId);
                  return batch ? batch.name : value;
                }}
              />
              {batches.map((batch, idx) => (
                <Line
                  key={`${batch.id}-sg`}
                  dataKey={`${batch.id}-sg`}
                  stroke={BATCH_COLORS[idx % BATCH_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: BATCH_COLORS[idx % BATCH_COLORS.length] }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h4 className="text-base font-semibold text-gray-800 mb-4">温度对比</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={temperatureData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                label={{ value: '发酵天数', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#9ca3af' }}
              />
              <YAxis
                domain={tempDomain}
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `${v}°C`}
              />
              <Tooltip content={<CustomTooltip batches={batches} />} />
              <Legend
                formatter={(value: string) => {
                  const batchId = value.replace(/-temp$/, '');
                  const batch = batches.find(b => b.id === batchId);
                  return batch ? batch.name : value;
                }}
              />
              {batches.map((batch, idx) => (
                <Line
                  key={`${batch.id}-temp`}
                  dataKey={`${batch.id}-temp`}
                  stroke={BATCH_COLORS[idx % BATCH_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: BATCH_COLORS[idx % BATCH_COLORS.length] }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  type="monotone"
                  strokeDasharray="6 3"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
