import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import useThemeStore from '../stores/themeStore';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FolderKanban,
  FileText,
  BarChart3,
  ClipboardList,
  Calendar,
  UserCheck,
  LogOut,
  Zap,
  Moon,
  Sun,
  Settings,
  Menu,
  X,
} from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Klien' },
  { to: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
  { to: '/projects', icon: FolderKanban, label: 'Proyek' },
  { to: '/calendar', icon: Calendar, label: 'Kalender' },
  { to: '/workload', icon: UserCheck, label: 'Workload' },
  { to: '/quotations', icon: ClipboardList, label: 'Quotation' },
  { to: '/invoices', icon: FileText, label: 'Invoice' },
  { to: '/reports', icon: BarChart3, label: 'Laporan' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <Zap className="w-8 h-8 text-purple-400" />
        <div>
          <h1 className="text-xl font-bold">Sekkyaku</h1>
          <p className="text-xs text-gray-400">Agency Kreatif</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto lg:hidden text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors mb-2"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm">{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-gray-900 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white min-h-screen flex flex-col transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
