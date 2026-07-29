import { useState, useEffect } from 'react';
import api from '../lib/api';
import TagInput from '../components/TagInput';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'won', label: 'Won', color: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' },
];

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', value: '', clientId: '', stage: 'lead', notes: '', tags: '' });
  const [draggedDeal, setDraggedDeal] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/deals'), api.get('/clients')]).then(([dealsRes, clientsRes]) => {
      setDeals(dealsRes.data);
      setClients(clientsRes.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deals', { ...form, value: parseFloat(form.value) || 0 });
      const { data } = await api.get('/deals');
      setDeals(data);
      setShowModal(false);
      setForm({ title: '', value: '', clientId: '', stage: 'lead', notes: '' });
    } catch (err) {
      alert('Gagal membuat deal');
    }
  };

  const handleDragStart = (deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId) => {
    if (!draggedDeal || draggedDeal.stage === stageId) return;
    try {
      await api.patch(`/deals/${draggedDeal.id}/stage`, { stage: stageId });
      setDeals((prev) =>
        prev.map((d) => (d.id === draggedDeal.id ? { ...d, stage: stageId } : d))
      );
    } catch (err) {
      alert('Gagal update stage');
    }
    setDraggedDeal(null);
  };

  const handleDelete = async (dealId) => {
    if (!confirm('Yakin hapus deal ini?')) return;
    try {
      await api.delete(`/deals/${dealId}`);
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
    } catch (err) {
      alert('Gagal hapus deal');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Deal
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.slice(0, 4).map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.id}
              className="flex-1 min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                <span className="text-sm text-gray-400">({stageDeals.length})</span>
                <span className="ml-auto text-sm font-medium text-gray-500">
                  {formatCurrency(stageValue)}
                </span>
              </div>

              <div className="space-y-3 min-h-[200px] bg-gray-100 rounded-xl p-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{deal.title}</h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                    <p className="text-purple-600 font-semibold text-sm mb-1">
                      {formatCurrency(deal.value)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {deal.client?.name} {deal.client?.company && `- ${deal.client.company}`}
                    </p>
                    {deal.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {deal.tags.split(',').slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Drop deal di sini</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 mt-2">
        {STAGES.slice(4).map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.id}
              className="flex-1 min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                <span className="text-sm text-gray-400">({stageDeals.length})</span>
                <span className="ml-auto text-sm font-medium text-gray-500">
                  {formatCurrency(stageValue)}
                </span>
              </div>

              <div className="space-y-3 min-h-[120px] bg-gray-100 rounded-xl p-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{deal.title}</h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                    <p className="text-purple-600 font-semibold text-sm mb-1">
                      {formatCurrency(deal.value)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {deal.client?.name} {deal.client?.company && `- ${deal.client.company}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Tambah Deal</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Deal *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Branding Package untuk PT XYZ"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Klien *</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Pilih klien</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company && `(${c.company})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value (Rp)</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="50000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <TagInput
                  value={form.tags}
                  onChange={(tags) => setForm({ ...form, tags })}
                  placeholder="Branding, Design, Web..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
