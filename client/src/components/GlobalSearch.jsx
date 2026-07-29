import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Search, Users, FolderKanban, FileText, TrendingUp, X } from 'lucide-react';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShow(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/projects'),
          api.get('/invoices'),
        ]);

        const q = query.toLowerCase();
        const items = [];

        clientsRes.data
          .filter((c) => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q))
          .slice(0, 3)
          .forEach((c) => items.push({ id: c.id, type: 'client', label: c.name, sub: c.company, icon: Users, link: '/clients' }));

        projectsRes.data
          .filter((p) => p.name.toLowerCase().includes(q))
          .slice(0, 3)
          .forEach((p) => items.push({ id: p.id, type: 'project', label: p.name, sub: p.client?.name, icon: FolderKanban, link: `/projects/${p.id}` }));

        invoicesRes.data
          .filter((i) => i.invoiceNo.toLowerCase().includes(q) || i.client?.name.toLowerCase().includes(q))
          .slice(0, 3)
          .forEach((i) => items.push({ id: i.id, type: 'invoice', label: i.invoiceNo, sub: i.client?.name, icon: FileText, link: '/invoices' }));

        setResults(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    navigate(item.link);
    setShow(false);
    setQuery('');
  };

  return (
    <>
      <button
        onClick={() => { setShow(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Cari...</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-white rounded border border-gray-300">⌘K</kbd>
      </button>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15vh]" onClick={() => { setShow(false); setQuery(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari klien, proyek, invoice..."
                className="flex-1 outline-none text-sm"
                autoFocus
              />
              <button onClick={() => { setShow(false); setQuery(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {loading && <p className="text-center text-gray-400 text-sm py-4">Mencari...</p>}

              {!loading && query && results.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">Tidak ditemukan</p>
              )}

              {!loading && results.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                      {item.sub && <p className="text-xs text-gray-500 truncate">{item.sub}</p>}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{item.type}</span>
                  </button>
                );
              })}

              {!query && (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Ketik untuk mencari</p>
                  <p className="text-gray-300 text-xs mt-1">Klien, proyek, invoice</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
