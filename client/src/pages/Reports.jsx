import { useState, useEffect } from 'react';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, FolderKanban, Users, DollarSign } from 'lucide-react';

const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

export default function Reports() {
  const [revenue, setRevenue] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [projects, setProjects] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');

  useEffect(() => {
    Promise.all([
      api.get('/reports/revenue'),
      api.get('/reports/pipeline'),
      api.get('/reports/projects'),
      api.get('/reports/clients'),
    ]).then(([revRes, pipeRes, projRes, cliRes]) => {
      setRevenue(revRes.data);
      setPipeline(pipeRes.data);
      setProjects(projRes.data);
      setClients(cliRes.data);
      setLoading(false);
    });
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const stageLabels = {
    lead: 'Lead',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  };

  const pipelineData = Object.entries(pipeline.stageData).map(([stage, data]) => ({
    name: stageLabels[stage] || stage,
    count: data.count,
    value: data.value,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Laporan</h1>

      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-0 scrollbar-hide">
        {[
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
          { id: 'projects', label: 'Proyek', icon: FolderKanban },
          { id: 'clients', label: 'Klien', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Revenue" value={formatCurrency(revenue.monthlyData.reduce((s, m) => s + m.total, 0))} color="green" />
            <StatCard label="Bulan Terbaik" value={revenue.monthlyData.length > 0 ? revenue.monthlyData.reduce((max, m) => m.total > max.total ? m : max).month : '-'} color="purple" />
            <StatCard label="Top Client" value={revenue.clientData.length > 0 ? revenue.clientData[0].name : '-'} color="blue" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue per Bulan</h3>
            {revenue.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenue.monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#9333ea" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">Belum ada data revenue</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Klien by Revenue</h3>
            {revenue.clientData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenue.clientData} layout="vertical">
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">Belum ada data klien</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Deals" value={pipeline.totalDeals} color="purple" />
            <StatCard label="Win Rate" value={`${pipeline.winRate}%`} color="green" />
            <StatCard label="Avg Deal Value" value={formatCurrency(pipeline.avgDealValue)} color="blue" />
            <StatCard label="Active Deals" value={pipeline.activeDeals} color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deals per Stage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#9333ea" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Value per Stage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineData.filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pipelineData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Won</span><span className="font-semibold text-green-600">{pipeline.wonDeals} deals</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Lost</span><span className="font-semibold text-red-600">{pipeline.lostDeals} deals</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Active</span><span className="font-semibold text-blue-600">{pipeline.activeDeals} deals</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Proyek" value={projects.totalProjects} color="purple" />
            <StatCard label="Active" value={projects.activeProjects} color="blue" />
            <StatCard label="Completed" value={projects.completedProjects} color="green" />
            <StatCard label="On-Time Rate" value={`${projects.onTimeRate}%`} color="orange" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Completed Tasks</span>
                    <span className="font-semibold">{projects.completedTasks} / {projects.totalTasks}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${projects.taskCompletionRate}%` }} />
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-1">{projects.taskCompletionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: projects.activeProjects },
                      { name: 'Completed', value: projects.completedProjects },
                    ].filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Semua Klien</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klien</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deals</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Won</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoiced</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada data</td></tr>
                  )}
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.company && <p className="text-xs text-gray-400">{c.company}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.totalDeals}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{c.wonDeals}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(c.totalDealValue)}</td>
                      <td className="px-4 py-3 text-gray-600">{c.totalProjects}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(c.totalInvoiced)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(c.totalPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color] || 'bg-gray-50 border-gray-200'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
