import { X } from 'lucide-react';
import { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface ProjectDetailModalProps {
  projectName: string;
  onClose: () => void;
}

export function ProjectDetailModal({ projectName, onClose }: ProjectDetailModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Mock data for single project flow rate
  const flowRateData = [
    { id: 'f1', date: '1.3', value: 45 },
    { id: 'f2', date: '1.9', value: 42 },
    { id: 'f3', date: '1.15', value: 48 },
    { id: 'f4', date: '1.21', value: 52 },
    { id: 'f5', date: '1.27', value: 55 },
    { id: 'f6', date: '2.3', value: 50 },
  ];

  // Mock data for achievement comparison
  const achievementData = [
    { id: 'a1', name: '协议', target: 200, actual: 152 },
    { id: 'a2', name: '合同', target: 180, actual: 148 },
    { id: 'a3', name: '回款', target: 25000, actual: 27800 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-[#1a1a1a] text-[18px] font-semibold">{projectName} - 流速详情</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Basic Info */}
          <div className="grid grid-cols-3 gap-4">
            <InfoCard label="城市" value="南京" />
            <InfoCard label="拿地年份" value="2025年" />
            <InfoCard label="项目类型" value="当年首开" />
          </div>

          {/* Flow Rate Trend */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-[#1a1a1a] text-[14px] font-medium mb-4">项目流速趋势</h3>
            <div className="h-[200px]" style={{ minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height={200} minHeight={200}>
                <AreaChart data={flowRateData}>
                  <defs>
                    <linearGradient id="modalFlowRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop key="modal-stop1" offset="5%" stopColor="#007440" stopOpacity={0.2} />
                      <stop key="modal-stop2" offset="95%" stopColor="#007440" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#007440"
                    strokeWidth={2}
                    fill="url(#modalFlowRateGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Achievement Comparison */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-[#1a1a1a] text-[14px] font-medium mb-4">指标达成情况</h3>
            <div className="h-[250px]" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height={250} minHeight={250}>
                <BarChart data={achievementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="target" fill="#D1D5DB" name="目标值" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="actual" fill="#007440" name="实际值" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricDetailCard
              title="协议指标"
              items={[
                { label: '套数', value: '152', unit: '套' },
                { label: '金额', value: '28,500', unit: '万' },
              ]}
            />
            <MetricDetailCard
              title="合同指标"
              items={[
                { label: '套数', value: '148', unit: '套' },
                { label: '金额', value: '27,800', unit: '万' },
              ]}
            />
            <MetricDetailCard
              title="回款指标"
              items={[
                { label: '现金回款', value: '15,600', unit: '万' },
                { label: '贷款回款', value: '12,200', unit: '万' },
                { label: '回款合计', value: '27,800', unit: '万' },
              ]}
            />
            <MetricDetailCard
              title="达成率"
              items={[
                { label: '协议达成率', value: '76.0', unit: '%' },
                { label: '合同达成率', value: '82.2', unit: '%' },
                { label: '回款达成率', value: '111.2', unit: '%', highlight: true },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
}

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-[#6B7280] text-[12px] mb-1">{label}</div>
      <div className="text-[#1a1a1a] text-[16px] font-semibold">{value}</div>
    </div>
  );
}

interface MetricDetailCardProps {
  title: string;
  items: Array<{ label: string; value: string; unit: string; highlight?: boolean }>;
}

function MetricDetailCard({ title, items }: MetricDetailCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-[#1a1a1a] text-[14px] font-medium mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[#6B7280] text-[12px]">{item.label}</span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-[14px] font-semibold ${
                  item.highlight ? 'text-[#00a63e]' : 'text-[#1a1a1a]'
                }`}
              >
                {item.value}
              </span>
              <span className="text-[#6B7280] text-[12px]">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}