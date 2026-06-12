import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Plus, Calendar, AlertCircle, TrendingUp, Thermometer, Beaker, Edit2, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useBrewStore } from '../store/brewStore.js';
import { BATCH_STATUS_LABELS } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

export default function Batches() {
  const navigate = useNavigate();
  const { batches, loading, error, fetchBatches, deleteBatch } = useBrewStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个批次吗？')) {
      await deleteBatch(id);
    }
  };

  const filteredBatches = batches
    .filter(batch => {
      if (statusFilter !== 'all') return batch.status === statusFilter;
      return true;
    })
    .sort((a, b) => b.brewDate.localeCompare(a.brewDate));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Droplets size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/recipes')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回配方列表
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
              <Droplets className="text-amber-600" />
              酿造批次
            </h1>
            <p className="text-gray-600 mt-1">追踪所有酿造批次，记录发酵过程和参数偏差</p>
          </div>
          <button
            onClick={() => navigate('/batches/new')}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            新批次
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(['all', 'planning', 'brewing', 'fermenting', 'conditioning', 'completed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {status === 'all' ? '全部' : BATCH_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {filteredBatches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Droplets className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无批次</h3>
          <p className="text-gray-400 mb-6">点击上方按钮创建您的第一个酿造批次</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBatches.map(batch => {
            const chartData = batch.readings
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(r => ({
                date: r.date.slice(5),
                比重: r.specificGravity,
                温度: r.temperature,
                pH: r.ph,
              }));

            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/batches/${batch.id}`)}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                              {batch.name}
                            </h3>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium",
                              batch.status === 'completed' ? 'bg-green-100 text-green-700' :
                              batch.status === 'fermenting' ? 'bg-amber-100 text-amber-700' :
                              batch.status === 'conditioning' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            )}>
                              {BATCH_STATUS_LABELS[batch.status]}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {batch.brewDate}
                            </span>
                            <span>配方: {batch.recipeName}</span>
                            <span>v{batch.recipeVersion}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/batches/${batch.id}/edit`); }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(batch.id, e)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">计划 OG</div>
                          <div className="text-lg font-semibold text-amber-700">
                            {batch.originalGravityActual || '-'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">计划 FG</div>
                          <div className="text-lg font-semibold text-amber-700">
                            {batch.finalGravityActual || '-'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">实际容量</div>
                          <div className="text-lg font-semibold text-amber-700">
                            {batch.volumeActual ? `${batch.volumeActual}L` : '-'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">发酵记录</div>
                          <div className="text-lg font-semibold text-amber-700">
                            {batch.readings.length} 条
                          </div>
                        </div>
                      </div>

                      {batch.deviations.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 mb-2">
                            <AlertCircle size={16} />
                            参数偏差 ({batch.deviations.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {batch.deviations.map((dev, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-amber-50 text-amber-700 text-sm rounded-full"
                              >
                                {dev.parameter}: {dev.expected} → {dev.actual}{dev.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {batch.notes && (
                        <p className="text-sm text-gray-600 line-clamp-2">{batch.notes}</p>
                      )}
                    </div>

                    {batch.readings.length > 0 && (
                      <div className="lg:w-96 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Line
                              type="monotone"
                              dataKey="比重"
                              stroke="#d97706"
                              strokeWidth={2}
                              dot={{ fill: '#d97706', r: 3 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="温度"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Thermometer size={14} />
                      温度读数: {batch.readings.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Beaker size={14} />
                      比重读数: {batch.readings.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      pH 记录: {batch.readings.filter(r => r.ph).length}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    创建于 {new Date(batch.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
