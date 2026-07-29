import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, TrendingUp, FolderKanban, DollarSign, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ActivityTimeline from '../components/ActivityTimeline';
import ReminderWidget from '../components/ReminderWidget';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const stageLabels = {
    lead: 'Lead',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  };

  const chartData = stats.dealsByStage.map((s) => ({
    name: stageLabels[s.stage] || s.stage,
    count: s._count.id,
    value: s._sum.value || 0,
  }));

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Klien"
          value={stats.totalClients}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Deals"
          value={stats.activeDeals}
          sub={`dari ${stats.totalDeals} total`}
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          label="Pipeline Value"
          value={formatCurrency(stats.pipelineValue)}
          color="green"
        />
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={stats.activeProjects}
          sub={`dari ${stats.totalProjects} total`}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={FileText}
          label="Total Invoice"
          value={stats.totalInvoices}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Belum Dibayar"
          value={formatCurrency(stats.unpaidTotal)}
          color="red"
        />
        <StatCard
          icon={DollarSign}
          label="Sudah Dibayar"
          value={formatCurrency(stats.paidTotal)}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline per Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [value, name === 'count' ? 'Jumlah' : 'Value']}
              />
              <Bar dataKey="count" fill="#9333ea" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Terbaru</h2>
          <div className="space-y-3">
            {stats.recentDeals.length === 0 && (
              <p className="text-gray-400 text-sm">Belum ada deal</p>
            )}
            {stats.recentDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{deal.title}</p>
                  <p className="text-sm text-gray-500">
                    {deal.client?.name} {deal.client?.company && `- ${deal.client.company}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(deal.value)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStageColor(deal.stage)}`}>
                    {stageLabels[deal.stage]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h2>
          <ActivityTimeline limit={15} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ReminderWidget />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function getStageColor(stage) {
  const colors = {
    lead: 'bg-gray-100 text-gray-700',
    qualified: 'bg-blue-100 text-blue-700',
    proposal: 'bg-yellow-100 text-yellow-700',
    negotiation: 'bg-orange-100 text-orange-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };
  return colors[stage] || 'bg-gray-100 text-gray-700';
}
