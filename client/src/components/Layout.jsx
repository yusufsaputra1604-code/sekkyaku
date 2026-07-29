import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 dark:bg-[#0f172a] p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="flex justify-end mb-4">
          <GlobalSearch />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
