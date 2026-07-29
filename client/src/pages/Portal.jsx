import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { Zap, FolderKanban, CheckCircle, Clock, AlertCircle, FileText, Image, X } from 'lucide-react';

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  done: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

const ASSET_STATUS = {
  pending: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
  revision: { label: 'Perlu Revisi', color: 'bg-red-100 text-red-700' },
};

const INVOICE_STATUS = {
  unpaid: { label: 'Belum Dibayar', color: 'bg-red-100 text-red-700' },
  partial: { label: 'Sebagian', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Lunas', color: 'bg-green-100 text-green-700' },
};

export default function Portal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  const [previewAsset, setPreviewAsset] = useState(null);

  useEffect(() => {
    api.get(`/portal/${token}`)
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Portal tidak ditemukan');
        setLoading(false);
      });
  }, [token]);

  const handleApprove = async (assetId) => {
    try {
      await api.post(`/portal/${token}/assets/${assetId}/approve`);
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => ({
          ...p,
          assets: p.assets.map((a) => (a.id === assetId ? { ...a, status: 'approved' } : a)),
        })),
      }));
    } catch (err) {
      alert('Gagal approve');
    }
  };

  const handleRevision = async (assetId) => {
    const notes = prompt('Catatan revisi (opsional):');
    try {
      await api.post(`/portal/${token}/assets/${assetId}/revision`, { notes });
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => ({
          ...p,
          assets: p.assets.map((a) => (a.id === assetId ? { ...a, status: 'revision', notes } : a)),
        })),
      }));
    } catch (err) {
      alert('Gagal request revisi');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Memuat...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Portal Tidak Ditemukan</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  const totalTasks = data.projects?.reduce((sum, p) => sum + p.tasks.length, 0) || 0;
  const completedTasks = data.projects?.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === 'done').length, 0) || 0;
  const pendingAssets = data.projects?.reduce((sum, p) => sum + p.assets.filter((a) => a.status === 'pending').length, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sekkyaku</h1>
              <p className="text-xs text-gray-400">Client Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">{data.client?.name}</p>
            {data.client?.company && <p className="text-sm text-gray-500">{data.client.company}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Proyek</p>
            <p className="text-2xl font-bold text-gray-900">{data.projects?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Task Selesai</p>
            <p className="text-2xl font-bold text-green-600">{completedTasks}/{totalTasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Menunggu Review</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingAssets}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Invoice</p>
            <p className="text-2xl font-bold text-gray-900">{data.invoices?.length || 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
          {[
            { id: 'projects', label: 'Proyek', icon: FolderKanban },
            { id: 'invoices', label: 'Invoice', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {data.projects?.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada proyek</p>
              </div>
            )}

            {data.projects?.map((project) => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {project.status}
                    </span>
                  </div>
                  {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
                </div>

                <div className="p-6">
                  <h3 className="font-medium text-gray-900 mb-3">Progress Task</h3>
                  {project.tasks?.length > 0 ? (
                    <div className="space-y-2">
                      {project.tasks.map((task) => {
                        const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                        const Icon = config.icon;
                        return (
                          <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Icon className={`w-4 h-4 ${task.status === 'done' ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.title}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Belum ada task</p>
                  )}
                </div>

                {project.assets?.length > 0 && (
                  <div className="p-6 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Creative Assets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {project.assets.map((asset) => {
                        const statusConf = ASSET_STATUS[asset.status] || ASSET_STATUS.pending;
                        return (
                          <div key={asset.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {asset.fileType?.startsWith('image/') ? (
                              <div
                                className="h-32 bg-gray-100 flex items-center justify-center cursor-pointer"
                                onClick={() => setPreviewAsset(asset)}
                              >
                                <img
                                  src={`/api/portal/${token}/assets/${asset.id}/download`}
                                  alt={asset.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-32 bg-gray-100 flex items-center justify-center">
                                <FileText className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                            <div className="p-3">
                              <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConf.color}`}>
                                  {statusConf.label}
                                </span>
                                {asset.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleApprove(asset.id)}
                                      className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                    >
                                      Setuju
                                    </button>
                                    <button
                                      onClick={() => handleRevision(asset.id)}
                                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                    >
                                      Revisi
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibayar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.invoices?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Belum ada invoice</td>
                    </tr>
                  )}
                  {data.invoices?.map((inv) => {
                    const statusConf = INVOICE_STATUS[inv.status] || INVOICE_STATUS.unpaid;
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNo}</td>
                        <td className="px-6 py-4 text-gray-600">{new Date(inv.issueDate).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4 text-gray-600">{new Date(inv.dueDate).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatCurrency(inv.paidAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusConf.color}`}>{statusConf.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {previewAsset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewAsset(null)}>
          <div className="max-w-4xl max-h-[90vh] relative">
            <button onClick={() => setPreviewAsset(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
            <img
              src={`/api/portal/${token}/assets/${previewAsset.id}/download`}
              alt={previewAsset.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-2 text-sm">{previewAsset.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
