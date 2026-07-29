import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Workload() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/tasks')]).then(([usersRes, tasksRes]) => {
      const allTasks = tasksRes.data || [];
      const userData = usersRes.data.map((user) => {
        const userTasks = allTasks.filter((t) => t.assigneeId === user.id);
        const activeTasks = userTasks.filter((t) => t.status !== 'done').length;
        const completedTasks = userTasks.filter((t) => t.status === 'done').length;
        const totalHours = userTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
        const highPriority = userTasks.filter((t) => t.priority === 'high' || t.priority === 'urgent').length;

        return {
          ...user,
          totalTasks: userTasks.length,
          activeTasks,
          completedTasks,
          totalHours,
          highPriority,
        };
      });

      setUsers(userData.filter((u) => u.totalTasks > 0));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const chartData = users.map((u) => ({
    name: u.name.split(' ')[0],
    active: u.activeTasks,
    completed: u.completedTasks,
  }));

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Workload Tim</h1>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada data</h3>
          <p className="text-gray-500">Assign task ke tim untuk melihat workload</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Anggota</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Task Aktif</p>
              <p className="text-2xl font-bold text-blue-600">{users.reduce((s, u) => s + u.activeTasks, 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Jam Kerja</p>
              <p className="text-2xl font-bold text-purple-600">{users.reduce((s, u) => s + u.totalHours, 0).toFixed(1)}j</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{users.reduce((s, u) => s + u.highPriority, 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task per Anggota</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="active" stackId="a" fill="#3b82f6" name="Aktif" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="completed" stackId="a" fill="#10b981" name="Selesai" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Workload</h3>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{user.name}</span>
                      <span className="text-gray-500">{user.activeTasks} aktif / {user.totalTasks} total</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${user.totalTasks > 0 ? (user.activeTasks / user.totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail per Anggota</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Aktif</p>
                        <p className="font-semibold text-gray-900">{user.activeTasks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Selesai</p>
                        <p className="font-semibold text-gray-900">{user.completedTasks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Jam</p>
                        <p className="font-semibold text-gray-900">{user.totalHours.toFixed(1)}j</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-gray-400 text-xs">Priority</p>
                        <p className="font-semibold text-gray-900">{user.highPriority}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
