import { useState, useRef } from 'react';
import api from '../lib/api';
import useSettingsStore from '../stores/settingsStore';
import { Save, RotateCcw, FileText, Palette, Building2, Image, Layout, Mail } from 'lucide-react';

export default function Settings() {
  const { settings, update, reset } = useSettingsStore();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset ke default? Semua perubahan akan hilang.')) {
      reset();
      setForm({ ...useSettingsStore.getState().settings });
    }
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Default
          </button>
          <button
            onClick={handleSave}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Tersimpan!' : 'Simpan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            Informasi Perusahaan
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                value={form.companyAddress}
                onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.companyEmail}
                  onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input
                  type="text"
                  value={form.companyPhone}
                  onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={form.companyWebsite}
                onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-purple-500" />
            Kop Surat
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Tampilkan Kop Surat</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, showLetterhead: !form.showLetterhead })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.showLetterhead ? 'bg-purple-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.showLetterhead ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {form.showLetterhead && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gaya Kop Surat</label>
                  <select
                    value={form.letterheadStyle}
                    onChange={(e) => setForm({ ...form, letterheadStyle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="modern">Modern (Logo kiri, info kanan)</option>
                    <option value="classic">Klasik (Tengah)</option>
                    <option value="minimal">Minimal (Logo saja)</option>
                    <option value="banner">Banner (Full width)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Perusahaan</label>
                  <div className="flex items-center gap-4">
                    {form.logoUrl && (
                      <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                        <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setForm({ ...form, logoUrl: ev.target.result });
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      <p className="text-xs text-gray-400 mt-1">PNG/JPG, max 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Tampilkan Info Perusahaan</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, showCompanyInfo: !form.showCompanyInfo })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.showCompanyInfo ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.showCompanyInfo ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teks Tambahan Baris 1</label>
                  <input
                    type="text"
                    value={form.headerLine1}
                    onChange={(e) => setForm({ ...form, headerLine1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="PT Kreatif Indonesia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teks Tambahan Baris 2</label>
                  <input
                    type="text"
                    value={form.headerLine2}
                    onChange={(e) => setForm({ ...form, headerLine2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="NPWP: 12.345.678.9-012.000"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Preview Kop Surat</p>
                  <div className={`bg-white border border-gray-200 rounded-lg p-4 ${form.letterheadStyle === 'banner' ? 'bg-gradient-to-r from-purple-50 to-blue-50' : ''}`}>
                    {form.letterheadStyle === 'modern' && (
                      <div className="flex items-start justify-between">
                        <div>
                          {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-10 mb-2" />}
                          <p className="font-bold text-lg" style={{ color: form.primaryColor }}>{form.companyName}</p>
                          {form.headerLine1 && <p className="text-xs text-gray-600">{form.headerLine1}</p>}
                          {form.headerLine2 && <p className="text-xs text-gray-600">{form.headerLine2}</p>}
                        </div>
                        {form.showCompanyInfo && (
                          <div className="text-right text-xs text-gray-500">
                            <p>{form.companyAddress}</p>
                            <p>{form.companyEmail}</p>
                            <p>{form.companyPhone}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {form.letterheadStyle === 'classic' && (
                      <div className="text-center">
                        {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-10 mx-auto mb-2" />}
                        <p className="font-bold text-lg" style={{ color: form.primaryColor }}>{form.companyName}</p>
                        {form.headerLine1 && <p className="text-xs text-gray-600">{form.headerLine1}</p>}
                        {form.showCompanyInfo && <p className="text-xs text-gray-500">{form.companyAddress} | {form.companyEmail}</p>}
                        {form.headerLine2 && <p className="text-xs text-gray-600">{form.headerLine2}</p>}
                      </div>
                    )}
                    {form.letterheadStyle === 'minimal' && (
                      <div className="flex items-center gap-3">
                        {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-8" />}
                        <p className="font-bold" style={{ color: form.primaryColor }}>{form.companyName}</p>
                      </div>
                    )}
                    {form.letterheadStyle === 'banner' && (
                      <div className="text-center py-2">
                        {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-12 mx-auto mb-2" />}
                        <p className="font-bold text-xl" style={{ color: form.primaryColor }}>{form.companyName}</p>
                        {form.headerLine1 && <p className="text-sm text-gray-600">{form.headerLine1}</p>}
                        {form.showCompanyInfo && <p className="text-xs text-gray-500 mt-1">{form.companyEmail} | {form.companyPhone}</p>}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: form.primaryColor }}></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            Warna & Tampilan
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna Utama</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teks Footer</label>
              <textarea
                value={form.footerText}
                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Catatan Invoice
          </h2>
          <textarea
            value={form.invoiceNotes}
            onChange={(e) => setForm({ ...form, invoiceNotes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            rows={5}
            placeholder="Catatan yang muncul di bawah invoice..."
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Catatan Quotation
          </h2>
          <textarea
            value={form.quotationNotes}
            onChange={(e) => setForm({ ...form, quotationNotes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            rows={5}
            placeholder="Catatan yang muncul di bawah quotation..."
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-500" />
            Email Reminder
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Konfigurasi SMTP di file <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">server/.env</code>:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono">
              <p>SMTP_HOST=smtp.gmail.com</p>
              <p>SMTP_PORT=587</p>
              <p>SMTP_USER=email@gmail.com</p>
              <p>SMTP_PASS=app-password</p>
            </div>
            <p className="text-xs text-gray-400">
              Untuk Gmail, gunakan App Password (bukan password biasa).
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    const { data } = await api.post('/reminders/send-invoice-reminders');
                    alert(`Terkirim: ${data.sent} dari ${data.total} invoice`);
                  } catch (err) {
                    alert('Gagal mengirim reminder');
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Kirim Reminder Invoice
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data } = await api.post('/reminders/send-task-reminders');
                    alert(`Terkirim: ${data.sent} dari ${data.total} task`);
                  } catch (err) {
                    alert('Gagal mengirim reminder');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Kirim Reminder Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
