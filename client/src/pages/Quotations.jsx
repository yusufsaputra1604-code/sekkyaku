import { useState, useEffect } from 'react';
import api from '../lib/api';
import { generateQuotationPDF } from '../lib/pdf';
import { Plus, Search, FileText, X, Eye, Trash2, ArrowRight, Download } from 'lucide-react';

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [form, setForm] = useState({
    clientId: '', projectId: '', validUntil: '', tax: '', discount: '', notes: '',
    items: [{ description: '', quantity: '', unitPrice: '' }]
  });

  useEffect(() => {
    Promise.all([api.get('/quotations'), api.get('/clients'), api.get('/projects')]).then(([qtRes, cliRes, projRes]) => {
      setQuotations(qtRes.data);
      setClients(cliRes.data);
      setProjects(projRes.data);
      setLoading(false);
    });
  }, []);

  const fetchQuotations = () => {
    api.get('/quotations').then(({ data }) => setQuotations(data));
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: '', unitPrice: '' }] });
  };

  const removeItem = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    if (field === 'quantity' || field === 'unitPrice') {
      items[index] = { ...items[index], [field]: value === '' ? '' : parseFloat(value) || 0 };
    } else {
      items[index] = { ...items[index], [field]: value };
    }
    setForm({ ...form, items });
  };

  const calcSubtotal = () => form.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const calcTotal = () => {
    const sub = calcSubtotal();
    const taxAmt = (sub * (form.tax || 0)) / 100;
    return sub + taxAmt - (form.discount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quotations', form);
      fetchQuotations();
      setShowModal(false);
      setForm({ clientId: '', projectId: '', validUntil: '', tax: '', discount: '', notes: '', items: [{ description: '', quantity: '', unitPrice: '' }] });
    } catch (err) {
      alert('Gagal membuat quotation');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      fetchQuotations();
    } catch (err) {
      alert('Gagal update status');
    }
  };

  const handleConvert = async (id) => {
    if (!confirm('Convert quotation ini ke invoice?')) return;
    try {
      const { data } = await api.post(`/quotations/${id}/convert`);
      alert(`Invoice ${data.invoiceNo} berhasil dibuat!`);
      fetchQuotations();
    } catch (err) {
      alert('Gagal convert ke invoice');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus quotation ini?')) return;
    try {
      await api.delete(`/quotations/${id}`);
      fetchQuotations();
    } catch (err) {
      alert('Gagal hapus quotation');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      converted: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filtered = quotations.filter(
    (q) =>
      q.quoteNo.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Quotation</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Quotation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari quotation..."
              className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Quotation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klien</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Berlaku Sampai</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Belum ada quotation
                  </td>
                </tr>
              )}
              {filtered.map((qt) => (
                <tr key={qt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{qt.quoteNo}</td>
                  <td className="px-6 py-4 text-gray-600">{qt.client?.name}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(qt.total)}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(qt.validUntil).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(qt.status)}`}>
                      {qt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setShowDetailModal(qt)} className="text-gray-400 hover:text-blue-600 mr-2" title="Lihat">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => generateQuotationPDF(qt)} className="text-gray-400 hover:text-purple-600 mr-2" title="Export PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    {qt.status === 'draft' && (
                      <button onClick={() => handleStatusUpdate(qt.id, 'sent')} className="text-gray-400 hover:text-blue-600 mr-2" title="Kirim">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    {qt.status === 'accepted' && (
                      <button onClick={() => handleConvert(qt.id)} className="text-gray-400 hover:text-purple-600 mr-2" title="Convert ke Invoice">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(qt.id)} className="text-gray-400 hover:text-red-600" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{showDetailModal.quoteNo}</h2>
              <button onClick={() => setShowDetailModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Klien</p>
                  <p className="font-medium">{showDetailModal.client?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(showDetailModal.status)}`}>
                    {showDetailModal.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Berlaku Sampai</p>
                  <p className="font-medium">{new Date(showDetailModal.validUntil).toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Item</h3>
                <div className="space-y-2">
                  {showDetailModal.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-900">{item.description}</p>
                        <p className="text-gray-400">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(showDetailModal.subtotal)}</span>
                </div>
                {showDetailModal.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PPN ({showDetailModal.tax}%)</span>
                    <span>{formatCurrency((showDetailModal.subtotal * showDetailModal.tax) / 100)}</span>
                  </div>
                )}
                {showDetailModal.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Diskon</span>
                    <span className="text-red-500">-{formatCurrency(showDetailModal.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(showDetailModal.total)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {showDetailModal.status === 'draft' && (
                  <button onClick={() => { handleStatusUpdate(showDetailModal.id, 'sent'); setShowDetailModal(null); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    Kirim
                  </button>
                )}
                {showDetailModal.status === 'sent' && (
                  <>
                    <button onClick={() => { handleStatusUpdate(showDetailModal.id, 'accepted'); setShowDetailModal(null); }} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                      Accept
                    </button>
                    <button onClick={() => { handleStatusUpdate(showDetailModal.id, 'rejected'); setShowDetailModal(null); }} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                      Reject
                    </button>
                  </>
                )}
                {showDetailModal.status === 'accepted' && (
                  <button onClick={() => { handleConvert(showDetailModal.id); setShowDetailModal(null); }} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                    Convert ke Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Buat Quotation</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Sampai *</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Item</h3>
                  <button type="button" onClick={addItem} className="text-purple-600 text-sm hover:underline">+ Tambah Item</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                          placeholder="Deskripsi item"
                          required
                        />
                      </div>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                        placeholder="Qty"
                        min="1"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                        placeholder="Harga"
                      />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PPN (%)</label>
                  <input
                    type="number"
                    value={form.tax}
                    onChange={(e) => setForm({ ...form, tax: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diskon (Rp)</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(calcSubtotal())}</span></div>
                {form.tax > 0 && <div className="flex justify-between"><span className="text-gray-500">PPN ({form.tax}%)</span><span>{formatCurrency((calcSubtotal() * form.tax) / 100)}</span></div>}
                {form.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Diskon</span><span className="text-red-500">-{formatCurrency(form.discount)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2"><span>Total</span><span>{formatCurrency(calcTotal())}</span></div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
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
