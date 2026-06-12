import { useEffect } from 'react';
import { X, Star } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useBrewStore } from '../store/brewStore.js';
import type { TastingComparison } from '../../shared/types.js';

const COLORS = ['#d97706', '#7c3aed', '#059669'];

interface TastingCompareModalProps {
  isOpen: boolean;
  selectedIds: string[];
  onClose: () => void;
}

export default function TastingCompareModal({ isOpen, selectedIds, onClose }: TastingCompareModalProps) {
  const { tastingComparison, loading, error, compareTastings } = useBrewStore();

  useEffect(() => {
    if (isOpen && selectedIds.length >= 2) {
      compareTastings(selectedIds);
    }
  }, [isOpen, selectedIds, compareTastings]);

  if (!isOpen) return null;

  const radarData = [
    { dimension: '外观', ...getScoresByDimension('appearance', tastingComparison) },
    { dimension: '香气', ...getScoresByDimension('aroma', tastingComparison) },
    { dimension: '风味', ...getScoresByDimension('flavor', tastingComparison) },
    { dimension: '口感', ...getScoresByDimension('mouthfeel', tastingComparison) },
    { dimension: '整体', ...getScoresByDimension('overall', tastingComparison) },
  ];

  function getScoresByDimension(
    dim: keyof Omit<TastingComparison, 'id' | 'name' | 'batchName' | 'recipeName' | 'totalScore'>,
    comparisons: TastingComparison[]
  ): Record<string, number> {
    const scores: Record<string, number> = {};
    comparisons.forEach((tasting, idx) => {
      scores[`tasting${idx}`] = tasting[dim] as number;
    });
    return scores;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6" />
            <h2 className="text-xl font-bold">品鉴雷达图对比</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin text-amber-600">
                <Star size={48} />
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center py-8">{error}</div>
          )}

          {!loading && !error && tastingComparison.length > 0 && (
            <>
              <div className="flex flex-wrap gap-4 mb-6 justify-center">
                {tastingComparison.map((tasting, idx) => (
                  <div
                    key={tasting.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                    style={{ borderColor: COLORS[idx], backgroundColor: `${COLORS[idx]}10` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx] }}
                    />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{tasting.name}</div>
                      <div className="text-xs text-gray-500">
                        总分: <span className="font-semibold" style={{ color: COLORS[idx] }}>{tasting.totalScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 10]}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    {tastingComparison.map((tasting, idx) => (
                      <Radar
                        key={tasting.id}
                        name={tasting.name}
                        dataKey={`tasting${idx}`}
                        stroke={COLORS[idx]}
                        fill={COLORS[idx]}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend
                      wrapperStyle={{ paddingTop: 20 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">详细得分对比</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">维度</th>
                        {tastingComparison.map((tasting, idx) => (
                          <th
                            key={tasting.id}
                            className="text-center py-3 px-4 font-medium"
                            style={{ color: COLORS[idx] }}
                          >
                            {tasting.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'appearance', label: '外观' },
                        { key: 'aroma', label: '香气' },
                        { key: 'flavor', label: '风味' },
                        { key: 'mouthfeel', label: '口感' },
                        { key: 'overall', label: '整体' },
                        { key: 'totalScore', label: '总分', isTotal: true },
                      ].map((row) => (
                        <tr key={row.key} className="border-b border-gray-100">
                          <td className={`py-3 px-4 ${row.isTotal ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {row.label}
                          </td>
                          {tastingComparison.map((tasting, idx) => {
                            const value = tasting[row.key as keyof TastingComparison] as number;
                            const maxVal = row.key === 'totalScore' ? 100 : 10;
                            return (
                              <td
                                key={tasting.id}
                                className="text-center py-3 px-4"
                              >
                                <span
                                  className={`font-semibold ${row.isTotal ? 'text-lg' : ''}`}
                                  style={{ color: COLORS[idx] }}
                                >
                                  {value}
                                </span>
                                <span className="text-gray-400 text-xs ml-1">/ {maxVal}</span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
