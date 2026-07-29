import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useThemeStore from './stores/themeStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Pipeline from './pages/Pipeline';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import CalendarPage from './pages/Calendar';
import Workload from './pages/Workload';
import Quotations from './pages/Quotations';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Portal from './pages/Portal';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuthStore();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" />;

  return children;
}

function App() {
  const { fetchUser, token, loading } = useAuthStore();
  const { init } = useThemeStore();

  useEffect(() => {
    init();
    if (token) {
      fetchUser();
    } else {
      useAuthStore.setState({ loading: false });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/portal/:token" element={<Portal />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="workload" element={<Workload />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
