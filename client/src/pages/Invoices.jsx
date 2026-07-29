import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { generateInvoicePDF } from '../lib/pdf';
import { Plus, Search, FileText, X, Calendar, DollarSign, Trash2, Eye, Download } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [form, setForm] = useState({
    clientId: '', projectId: '', dueDate: '', tax: '', discount: '', notes: '',
    items: [{ description: '', quantity: '', unitPrice: '' }]
  });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/invoices'), api.get('/clients'), api.get('/projects')]).then(([invRes, cliRes, projRes]) => {
      setInvoices(invRes.data);
      setClients(cliRes.data);
      setProjects(projRes.data);
      setLoading(false);
    });
  }, []);

  const fetchInvoices = () => {
    api.get('/invoices').then(({ data }) => setInvoices(data));
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
      await api.post('/invoices', form);
      fetchInvoices();
      setShowModal(false);
      setForm({ clientId: '', projectId: '', dueDate: '', tax: '', discount: '', notes: '', items: [{ description: '', quantity: '', unitPrice: '' }] });
    } catch (err) {
      alert('Gagal membuat invoice');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/invoices/${showPaymentModal.id}/payment`, { amount: parseFloat(paymentAmount) });
      fetchInvoices();
      setShowPaymentModal(null);
      setPaymentAmount('');
    } catch (err) {
      alert('Gagal mencatat pembayaran');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus invoice ini?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      alert('Gagal hapus invoice');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getStatusColor = (status) => {
    const colors = {
      unpaid: 'bg-red-100 text-red-700',
      partial: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalUnpaid = invoices.filter((i) => i.status === 'unpaid' || i.status === 'partial').reduce((sum, i) => sum + i.total - i.paidAmount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Invoice</p>
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Belum Dibayar</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Sudah Dibayar</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari invoice..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klien</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibayar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Belum ada invoice
                  </td>
                </tr>
              )}
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNo}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.client?.name}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                  <td className="px-6 py-4 text-gray-600">{formatCurrency(inv.paidAmount)}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(inv.dueDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setShowDetailModal(inv)} className="text-gray-400 hover:text-blue-600 mr-2" title="Lihat">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => generateInvoicePDF(inv)} className="text-gray-400 hover:text-purple-600 mr-2" title="Export PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    {(inv.status === 'unpaid' || inv.status === 'partial') && (
                      <button onClick={() => setShowPaymentModal(inv)} className="text-gray-400 hover:text-green-600 mr-2" title="Bayar">
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(inv.id)} className="text-gray-400 hover:text-red-600" title="Hapus">
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
              <h2 className="text-lg font-semibold">{showDetailModal.invoiceNo}</h2>
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
                  <p className="text-gray-500">Tanggal</p>
                  <p className="font-medium">{new Date(showDetailModal.issueDate).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Jatuh Tempo</p>
                  <p className="font-medium">{new Date(showDetailModal.dueDate).toLocaleDateString('id-ID')}</p>
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
                <div className="flex justify-between text-green-600">
                  <span>Dibayar</span>
                  <span>{formatCurrency(showDetailModal.paidAmount)}</span>
                </div>
                {(showDetailModal.total - showDetailModal.paidAmount) > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Sisa</span>
                    <span>{formatCurrency(showDetailModal.total - showDetailModal.paidAmount)}</span>
                  </div>
                )}
              </div>

              {showDetailModal.notes && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Catatan:</p>
                  <p className="text-sm text-gray-700">{showDetailModal.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Catat Pembayaran</h2>
              <button onClick={() => setShowPaymentModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Sisa tagihan: <span className="font-bold text-red-600">{formatCurrency(showPaymentModal.total - showPaymentModal.paidAmount)}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar (Rp)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="5000000"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Buat Invoice</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proyek</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">Pilih proyek (opsional)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Item Invoice</h3>
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
                    placeholder="11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diskon (Rp)</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  rows={2}
                />
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
