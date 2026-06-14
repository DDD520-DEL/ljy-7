import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowLeft, Wine, MapPin, Calendar, Beer, AlertCircle, Package, PlusCircle } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import { BATCH_STATUS_LABELS } from '../../shared/types.js';
import type { Batch, Recipe } from '../../shared/types.js';

export default function TraceCodeLookup() {
  const navigate = useNavigate();
  const { lookupTraceCode, loading, error } = useBrewStore();
  const [traceCodeInput, setTraceCodeInput] = useState('');
  const [lookupResult, setLookupResult] = useState<{ batch: Batch; recipe?: Recipe } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async () => {
    if (!traceCodeInput.trim()) return;
    setHasSearched(true);
    const result = await lookupTraceCode(traceCodeInput.trim());
    setLookupResult(result);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/batches')}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          返回批次列表
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">追溯码查询</h1>
            <p className="text-gray-600">输入或扫描追溯码，查询批次来源信息</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">输入追溯码</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={traceCodeInput}
              onChange={(e) => setTraceCodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入追溯码，如 BREW-XXXX-..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-lg"
              autoFocus
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={loading || !traceCodeInput.trim()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Search size={20} />
            )}
            查询
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          💡 提示：追溯码是装瓶时自动生成的唯一标识码，格式如 BREW-XXXX-XXXX-XXXX
        </p>
      </div>

      {error && hasSearched && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">查询失败</h3>
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-red-500 mt-2">
                请检查追溯码是否正确，或联系酿造者确认该批次是否已装瓶。
              </p>
            </div>
          </div>
        </div>
      )}

      {lookupResult && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Wine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900">追溯码有效</h3>
                  <p className="text-sm text-emerald-600">已找到对应批次信息</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white text-sm font-medium rounded-full">
                验证通过
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="text-xs text-gray-500 mb-1">追溯码</div>
              <div className="font-mono text-xl font-bold text-emerald-700">
                {lookupResult.batch.traceCode}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Beer className="w-5 h-5 text-amber-600" />
              批次信息
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">批次名称</div>
                <div className="font-semibold text-gray-900">{lookupResult.batch.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">酿造日期</div>
                <div className="font-medium text-gray-700 flex items-center gap-1">
                  <Calendar size={14} />
                  {lookupResult.batch.brewDate}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">批次状态</div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  {BATCH_STATUS_LABELS[lookupResult.batch.status]}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">配方</div>
                {lookupResult.recipe ? (
                  <Link
                    to={`/recipes/${lookupResult.recipe.id}`}
                    className="text-amber-600 hover:text-amber-700 hover:underline font-medium"
                  >
                    {lookupResult.recipe.name}
                  </Link>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>

            {lookupResult.recipe && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">酒精度</div>
                  <div className="text-lg font-bold text-amber-700">{lookupResult.recipe.abv}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">苦度</div>
                  <div className="text-lg font-bold text-amber-700">{lookupResult.recipe.ibu} IBU</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">批次容量</div>
                  <div className="text-lg font-bold text-amber-700">{lookupResult.recipe.batchSize}L</div>
                </div>
              </div>
            )}
          </div>

          {lookupResult.batch.bottlingRecord && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                装瓶信息
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">装瓶总数</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {lookupResult.batch.bottlingRecord.totalBottles} <span className="text-sm font-normal">瓶</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">瓶型规格</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {lookupResult.batch.bottlingRecord.bottleSpec}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">瓶盖颜色</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: lookupResult.batch.bottlingRecord.capColor }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {lookupResult.batch.bottlingRecord.capColor}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin size={12} />
                    储存位置
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {lookupResult.batch.bottlingRecord.storageLocation}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                装瓶时间: {new Date(lookupResult.batch.bottlingRecord.bottledAt).toLocaleString('zh-CN')}
              </div>

              {lookupResult.batch.bottlingRecord.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-700 mb-2">装瓶备注</div>
                  <p className="text-sm text-gray-600">{lookupResult.batch.bottlingRecord.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-end">
            <button
              onClick={() => navigate(`/batches/${lookupResult.batch.id}`)}
              className="px-6 py-3 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium"
            >
              查看批次详情
            </button>
            <button
              onClick={() => navigate(`/tastings/new?traceCode=${encodeURIComponent(lookupResult.batch.traceCode || '')}`)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium flex items-center gap-2 shadow-sm"
            >
              <PlusCircle size={18} />
              为此批次创建品鉴记录
            </button>
          </div>
        </div>
      )}

      {!hasSearched && !error && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Search className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-medium text-gray-600 mb-2">输入追溯码开始查询</h3>
          <p className="text-gray-400">每一批装瓶的啤酒都会有唯一的追溯码</p>
        </div>
      )}
    </div>
  );
}
