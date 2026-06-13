import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart3, Droplets, Award, TrendingUp } from 'lucide-react';
import type { UserBrewStats } from '../../shared/types.js';

const PIE_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7', '#0ea5e9', '#d946ef',
  '#eab308', '#22c55e', '#f43f5e', '#7c3aed', '#0891b2',
];

interface BrewStatsPanelProps {
  stats: UserBrewStats;
}

export default function BrewStatsPanel({ stats }: BrewStatsPanelProps) {
  const statCards = [
    {
      label: '累计批次',
      value: stats.totalBatches,
      sub: `已完成 ${stats.completedBatches} 批`,
      icon: BarChart3,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      label: '总产量',
      value: `${stats.totalVolume}`,
      sub: '升',
      icon: Droplets,
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      label: '平均品鉴得分',
      value: stats.averageScore > 0 ? stats.averageScore : '-',
      sub: stats.tastingCount > 0 ? `共 ${stats.tastingCount} 次品鉴` : '暂无品鉴',
      icon: Award,
      gradient: 'from-yellow-500 to-amber-600',
    },
    {
      label: '最常酿造风格',
      value: stats.topStyle,
      sub: stats.styleDistribution.length > 0 ? `共 ${stats.styleDistribution.length} 种风格` : '',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
    },
  ];

  const pieData = stats.styleDistribution.map(item => ({
    name: item.style,
    value: item.count,
  }));

  const scoreTrendData = stats.scoreTrend.map(item => ({
    date: item.date.slice(0, 10),
    score: item.score,
    recipeName: item.recipeName || '',
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1 truncate">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">酿造风格分布</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无酿造数据</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="w-full lg:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} 批`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-2">
                {stats.styleDistribution.map((item, index) => (
                  <div key={item.style} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">{item.style}</span>
                    <span className="text-sm font-medium text-gray-800">{item.count} 批</span>
                    <span className="text-xs text-gray-400">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">品鉴得分趋势</h3>
          {scoreTrendData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无品鉴数据</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: string) => value.slice(5)}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: number) => `${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} 分`, '品鉴得分']}
                    labelFormatter={(label, payload) => {
                      const entry = payload?.[0];
                      const recipeName = (entry?.payload as { recipeName?: string })?.recipeName;
                      return recipeName ? `${label} - ${recipeName}` : `${label}`;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f59e0b' }}
                    activeDot={{ r: 6 }}
                    name="品鉴得分"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
