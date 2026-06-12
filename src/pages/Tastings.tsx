import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Edit2, Trash2, Calendar, Beer, GitCompare, CheckSquare, Square } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { cn } from '../lib/utils.js';
import TastingCompareModal from '../components/TastingCompareModal.js';

export default function Tastings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tastings, currentTasting, loading, error, fetchTastings, fetchTastingById, deleteTasting } = useBrewStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTastingById(id);
    } else {
      fetchTastings();
    }
    return () => {
      useBrewStore.getState().clearCurrent();
    };
  }, [id, fetchTastings, fetchTastingById]);

  const handleDelete = async (tastingId: string) => {
    if (confirm('确定要删除这条品鉴记录吗？')) {
      await deleteTasting(tastingId);
      if (id === tastingId) {
        navigate('/tastings');
      }
    }
  };

  const toggleSelect = (tastingId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(tastingId)) {
        return prev.filter(id => id !== tastingId);
      } else {
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, tastingId];
      }
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2) {
      setShowCompareModal(true);
    }
  };

  if (loading && !currentTasting && tastings.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-amber-600"><Star size={48} /></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  if (id && currentTasting) {
    const categoryScores = [
      { label: '外观', score: currentTasting.appearance.score, maxScore: 5 },
      { label: '香气', score: currentTasting.aroma.score, maxScore: 5 },
      { label: '风味', score: currentTasting.flavor.score, maxScore: 5 },
      { label: '口感', score: currentTasting.mouthfeel.score, maxScore: 5 },
      { label: '整体', score: currentTasting.overall.score, maxScore: 5 },
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/tastings')}
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            返回品鉴记录
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{currentTasting.name}</h1>
                <div className="flex items-center gap-4 mt-2 opacity-90">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {currentTasting.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Beer size={16} />
                    {currentTasting.batchName}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{currentTasting.totalScore}</div>
                <div className="text-sm opacity-75">总分 / 100</div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-5 gap-4 mb-8">
              {categoryScores.map((cat, idx) => (
                <div key={idx} className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#d97706"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(cat.score / cat.maxScore) * 176} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-amber-700">{cat.score}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">{cat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">外观</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">清澈度</span>
                    <span className="font-medium">{currentTasting.appearance.clarity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">颜色</span>
                    <span className="font-medium">{currentTasting.appearance.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">泡沫持久性</span>
                    <span className="font-medium">{currentTasting.appearance.headRetention}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">香气</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">强度</span>
                    <span className="font-medium">{currentTasting.aroma.intensity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">香气描述</span>
                    <div className="flex flex-wrap gap-2">
                      {currentTasting.aroma.notes.map((note, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">风味</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">甜度</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <div
                            key={n}
                            className={cn(
                              "w-3 h-3 rounded-full",
                              n <= currentTasting.flavor.sweetness ? "bg-amber-500" : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">苦度</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <div
                            key={n}
                            className={cn(
                              "w-3 h-3 rounded-full",
                              n <= currentTasting.flavor.bitterness ? "bg-amber-500" : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">酸度</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <div
                            key={n}
                            className={cn(
                              "w-3 h-3 rounded-full",
                              n <= currentTasting.flavor.acidity ? "bg-amber-500" : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">风味描述</span>
                    <div className="flex flex-wrap gap-2">
                      {currentTasting.flavor.notes.map((note, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">口感</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">酒体</span>
                    <span className="font-medium">{currentTasting.mouthfeel.body}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">碳酸化</span>
                    <span className="font-medium">{currentTasting.mouthfeel.carbonation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">酒精温热感</span>
                    <span className="font-medium">{currentTasting.mouthfeel.warmth}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">整体评价</h3>
              <p className="text-gray-600 leading-relaxed">{currentTasting.overall.impressions}</p>
            </div>

            {currentTasting.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">备注</h3>
                <p className="text-gray-600">{currentTasting.notes}</p>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => navigate(`/tastings/${currentTasting.id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={18} />
                编辑
              </button>
              <button
                onClick={() => handleDelete(currentTasting.id)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回首页
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
              <Star className="text-amber-600" />
              品鉴记录
            </h1>
            <p className="text-gray-600 mt-1">所有品鉴评分卡记录</p>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                已选择 <span className="font-semibold text-amber-600">{selectedIds.length}</span> / 3 条
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                取消选择
              </button>
              <button
                onClick={handleCompare}
                disabled={selectedIds.length < 2}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  selectedIds.length >= 2
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <GitCompare size={18} />
                雷达图对比
              </button>
            </div>
          )}
        </div>
        {tastings.length >= 2 && selectedIds.length === 0 && (
          <p className="text-sm text-gray-500 mt-3">
            💡 提示：点击卡片左上角的复选框选择 2-3 条记录进行雷达图对比
          </p>
        )}
      </div>

      {tastings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Star className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">暂无品鉴记录</h3>
          <p className="text-gray-400">完成酿造后可以添加品鉴评分</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tastings.map(tasting => {
            const isSelected = selectedIds.includes(tasting.id);
            return (
              <div
                key={tasting.id}
                className={cn(
                  "bg-white rounded-xl shadow-sm border overflow-hidden transition-all group relative",
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-200"
                    : "border-gray-100 hover:shadow-md hover:border-gray-200"
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(tasting.id);
                  }}
                  className="absolute top-3 left-3 z-10 p-1 rounded-lg bg-white/90 shadow-sm hover:bg-white transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare size={20} className="text-amber-500" />
                  ) : (
                    <Square size={20} className="text-gray-400 group-hover:text-gray-600" />
                  )}
                </button>

                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/tastings/${tasting.id}`)}
                >
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white pl-12">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold group-hover:underline">{tasting.name}</h3>
                        <div className="text-sm opacity-90">{tasting.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{tasting.totalScore}</div>
                        <div className="text-xs opacity-75">总分</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <Beer size={14} />
                      <span>{tasting.batchName}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-amber-700">{tasting.appearance.score}</div>
                        <div className="text-xs text-gray-500">外观</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-amber-700">{tasting.aroma.score}</div>
                        <div className="text-xs text-gray-500">香气</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-amber-700">{tasting.flavor.score}</div>
                        <div className="text-xs text-gray-500">风味</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-amber-700">{tasting.mouthfeel.score}</div>
                        <div className="text-xs text-gray-500">口感</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-amber-700">{tasting.overall.score}</div>
                        <div className="text-xs text-gray-500">整体</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{tasting.overall.impressions}</p>
                    <div className="flex flex-wrap gap-1 mt-4">
                      {tasting.aroma.notes.slice(0, 3).map((note, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TastingCompareModal
        isOpen={showCompareModal}
        selectedIds={selectedIds}
        onClose={() => {
          setShowCompareModal(false);
        }}
      />
    </div>
  );
}
