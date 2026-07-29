import { useState, useEffect } from 'react';
import api from '../lib/api';
import { exportToCSV, parseCSV } from '../lib/csv';
import TagInput from '../components/TagInput';
import { Plus, Search, Edit2, Trash2, X, Tag, Download, Upload, ExternalLink } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', industry: '', notes: '', tags: '' });
  const [selected, setSelected] = useState([]);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTag, setBulkTag] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    api.get('/clients').then(({ data }) => {
      setClients(data);
      setLoading(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editClient) {
        await api.put(`/clients/${editClient.id}`, form);
      } else {
        await api.post('/clients', form);
      }
      setShowModal(false);
      setEditClient(null);
      setForm({ name: '', company: '', email: '', phone: '', industry: '', notes: '' });
      fetchClients();
    } catch (err) {
      alert('Gagal menyimpan klien');
    }
  };

  const handleEdit = (client) => {
    setEditClient(client);
    setForm({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      industry: client.industry || '',
      notes: client.notes || '',
      tags: client.tags || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus klien ini?')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err) {
      alert('Gagal hapus klien');
    }
  };

  const handleGeneratePortal = async (client) => {
    try {
      const { data } = await api.post(`/portal/generate/${client.id}`);
      const link = `${window.location.origin}/portal/${data.token}`;
      await navigator.clipboard.writeText(link);
      alert(`Portal link berhasil di-generate dan disalin!\n\n${link}`);
      fetchClients();
    } catch (err) {
      alert('Gagal generate portal link');
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((c) => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selected.length} klien yang dipilih?`)) return;
    try {
      for (const id of selected) {
        await api.delete(`/clients/${id}`);
      }
      setSelected([]);
      fetchClients();
    } catch (err) {
      alert('Gagal hapus beberapa klien');
    }
  };

  const handleBulkTag = async () => {
    try {
      for (const id of selected) {
        const client = clients.find((c) => c.id === id);
        if (client) {
          const existingTags = client.tags ? client.tags.split(',').map((t) => t.trim()) : [];
          const newTags = bulkTag.split(',').map((t) => t.trim());
          const allTags = [...new Set([...existingTags, ...newTags])].filter(Boolean);
          await api.put(`/clients/${id}`, { ...client, tags: allTags.join(', ') });
        }
      }
      setSelected([]);
      setShowBulkTagModal(false);
      setBulkTag('');
      fetchClients();
    } catch (err) {
      alert('Gagal update tags');
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.tags?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const handleExport = () => {
    const columns = [
      { key: 'name', label: 'Nama' },
      { key: 'company', label: 'Perusahaan' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telepon' },
      { key: 'industry', label: 'Industri' },
      { key: 'tags', label: 'Tags' },
    ];
    exportToCSV(clients, 'klien-sekkyaku', columns);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCSV(text);

    try {
      for (const row of rows) {
        await api.post('/clients', {
          name: row.Nama || row.name || '',
          company: row.Perusahaan || row.company || '',
          email: row.Email || row.email || '',
          phone: row.Telepon || row.phone || '',
          industry: row.Industri || row.industry || '',
          tags: row.Tags || row.tags || '',
        });
      }
      fetchClients();
      alert(`Berhasil import ${rows.length} klien`);
    } catch (err) {
      alert('Gagal import data');
    }
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Klien</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <label className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => {
              setEditClient(null);
              setForm({ name: '', company: '', email: '', phone: '', industry: '', notes: '', tags: '' });
              setShowModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {selected.length > 0 && (
          <div className="px-6 py-3 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
            <span className="text-sm text-purple-700 font-medium">{selected.length} dipilih</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkTagModal(true)}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1"
              >
                <Tag className="w-3.5 h-3.5" />
                Tambah Tag
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <button
                onClick={() => setSelected([])}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari klien..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perusahaan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deals</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    Belum ada klien
                  </td>
                </tr>
              )}
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(client.id)}
                      onChange={() => toggleSelect(client.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 text-gray-600">{client.company || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{client.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{client.industry || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {client.tags ? client.tags.split(',').map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {tag.trim()}
                        </span>
                      )) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{client._count?.deals || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleGeneratePortal(client)} className="text-gray-400 hover:text-purple-600 mr-2" title="Portal Link">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(client)} className="text-gray-400 hover:text-blue-600 mr-2">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editClient ? 'Edit Klien' : 'Tambah Klien'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industri</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="F&B, Tech, Fashion, dll"
                />
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
                  placeholder="Branding, F&B, Tech..."
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
                  {editClient ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Tambah Tag ke {selected.length} Klien</h2>
              <button onClick={() => setShowBulkTagModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <TagInput
                  value={bulkTag}
                  onChange={setBulkTag}
                  placeholder="Branding, F&B, Tech..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBulkTagModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  onClick={handleBulkTag}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Tambah Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
