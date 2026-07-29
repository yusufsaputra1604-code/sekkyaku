import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { setApiUrl, getApiUrl } from '../lib/api';
import { Zap, Settings } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiUrl());
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal login');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServer = () => {
    setApiUrl(serverUrl);
    setShowSettings(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Sekkyaku</h1>
          </div>
          <p className="text-gray-400">Masuk ke akun kamu</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl p-8 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
              placeholder="email@agency.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum punya akun?{' '}
              <Link to="/register" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                Daftar
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Server Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {showSettings && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Server URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white text-sm"
                  placeholder="https://sekkyaku-xxx.up.railway.app"
                />
                <button
                  type="button"
                  onClick={handleSaveServer}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Simpan
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Kosongkan untuk mode lokal
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
