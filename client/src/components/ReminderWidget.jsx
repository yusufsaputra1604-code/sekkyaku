import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Bell, Check, Trash2, Plus, X, Calendar } from 'lucide-react';

export default function ReminderWidget() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', dueDate: '' });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = () => {
    api.get('/reminders/upcoming').then(({ data }) => {
      setReminders(data);
      setLoading(false);
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reminders', form);
      fetchReminders();
      setShowModal(false);
      setForm({ title: '', dueDate: '' });
    } catch (err) {
      alert('Gagal membuat reminder');
    }
  };

  const handleDone = async (id) => {
    try {
      await api.patch(`/reminders/${id}/status`, { status: 'done' });
      fetchReminders();
    } catch (err) {
      alert('Gagal update reminder');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      fetchReminders();
    } catch (err) {
      alert('Gagal hapus reminder');
    }
  };

  if (loading) return <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          Reminder (7 hari ke depan)
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-purple-600 hover:text-purple-700 text-sm"
        >
          + Tambah
        </button>
      </div>

      {reminders.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">Tidak ada reminder</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg group">
              <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(r.dueDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDone(r.id)} className="text-green-500 hover:text-green-600 p-1" title="Selesai">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-500 p-1" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Tambah Reminder</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Follow up klien ABC"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                />
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
