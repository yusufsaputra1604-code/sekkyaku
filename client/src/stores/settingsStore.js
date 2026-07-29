import { create } from 'zustand';

const defaultSettings = {
  companyName: 'Sekkyaku',
  companyAddress: 'Jl. Kreatif No. 123, Jakarta',
  companyEmail: 'hello@kreatifagency.com',
  companyPhone: '+62 812-3456-7890',
  companyWebsite: 'www.kreatifagency.com',
  invoiceNotes: 'Pembayaran dapat dilakukan via transfer ke:\nBank BCA: 1234567890 a/n Kreatif Agency\n\nTerima kasih atas kepercayaan Anda.',
  quotationNotes: 'Quotation ini berlaku selama 30 hari dari tanggal diterbitkan.\nHarga belum termasuk biaya revisi di luar scope yang disepakati.',
  primaryColor: '#9333ea',
  accentColor: '#7c3aed',
  showLogo: true,
  logoUrl: '',
  showLetterhead: true,
  letterheadStyle: 'modern',
  headerLine1: '',
  headerLine2: '',
  showCompanyInfo: true,
  footerText: 'Dokumen ini dibuat secara otomatis oleh sistem Sekkyaku.',
};

const useSettingsStore = create((set, get) => ({
  settings: JSON.parse(localStorage.getItem('pdfSettings') || JSON.stringify(defaultSettings)),

  update: (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    localStorage.setItem('pdfSettings', JSON.stringify(settings));
    set({ settings });
  },

  reset: () => {
    localStorage.setItem('pdfSettings', JSON.stringify(defaultSettings));
    set({ settings: defaultSettings });
  },
}));

export default useSettingsStore;
