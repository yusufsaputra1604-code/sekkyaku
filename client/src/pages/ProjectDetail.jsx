import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import AssetManager from '../components/AssetManager';
import { ArrowLeft, Plus, GripVertical, X, Calendar, User, Flag, Trash2, FolderKanban, FileText, Clock } from 'lucide-react';

const TASK_STATUSES = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', label: 'Review', color: 'bg-yellow-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
];

const PRIORITIES = [
  { id: 'low', label: 'Rendah', color: 'text-gray-500' },
  { id: 'medium', label: 'Sedang', color: 'text-yellow-500' },
  { id: 'high', label: 'Tinggi', color: 'text-orange-500' },
  { id: 'urgent', label: 'Urgent', color: 'text-red-500' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' });
  const [draggedTask, setDraggedTask] = useState(null);
  const [showTimeLogModal, setShowTimeLogModal] = useState(null);
  const [timeLogForm, setTimeLogForm] = useState({ hours: '', note: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    Promise.all([api.get(`/projects/${id}`), api.get('/users')]).then(([projRes, usersRes]) => {
      setProject(projRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    });
  }, [id]);

  const fetchProject = () => {
    api.get(`/projects/${id}`).then(({ data }) => setProject(data));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...taskForm, projectId: id });
      fetchProject();
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' });
    } catch (err) {
      alert('Gagal membuat task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${editTask.id}`, taskForm);
      fetchProject();
      setShowTaskModal(false);
      setEditTask(null);
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' });
    } catch (err) {
      alert('Gagal update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Yakin hapus task ini?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProject();
    } catch (err) {
      alert('Gagal hapus task');
    }
  };

  const handleDragStart = (task) => setDraggedTask(task);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (statusId) => {
    if (!draggedTask || draggedTask.status === statusId) return;
    try {
      await api.patch(`/tasks/${draggedTask.id}/status`, { status: statusId });
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === draggedTask.id ? { ...t, status: statusId } : t)),
      }));
    } catch (err) {
      alert('Gagal update status');
    }
    setDraggedTask(null);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setShowTaskModal(true);
  };

  const getPriorityIcon = (priority) => {
    const p = PRIORITIES.find((pr) => pr.id === priority);
    return <Flag className={`w-3 h-3 ${p?.color || 'text-gray-400'}`} />;
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    try {
      await api.post('/time-logs', {
        hours: parseFloat(timeLogForm.hours),
        note: timeLogForm.note,
        date: timeLogForm.date,
        taskId: showTimeLogModal.id,
      });
      fetchProject();
      setShowTimeLogModal(null);
      setTimeLogForm({ hours: '', note: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      alert('Gagal mencatat waktu');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (!project) return <div className="text-center py-12 text-gray-500">Proyek tidak ditemukan</div>;

  return (
    <div>
      <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Proyek
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-1">
              {project.client?.name} {project.client?.company && `- ${project.client.company}`}
            </p>
            {project.description && <p className="text-gray-600 mt-2">{project.description}</p>}
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {project.status}
          </span>
        </div>
        <div className="flex gap-6 mt-4 text-sm text-gray-500">
          {project.budget && <span>Budget: Rp {project.budget.toLocaleString('id-ID')}</span>}
          {project.startDate && <span>Mulai: {new Date(project.startDate).toLocaleDateString('id-ID')}</span>}
          {project.endDate && <span>Deadline: {new Date(project.endDate).toLocaleDateString('id-ID')}</span>}
          <span>{project.tasks?.length || 0} task</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'tasks' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Task Board
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'assets' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Creative Assets
        </button>
      </div>

      {activeTab === 'tasks' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Task Board</h2>
            <button
              onClick={() => { setEditTask(null); setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' }); setShowTaskModal(true); }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Task
            </button>
          </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => {
          const statusTasks = project.tasks?.filter((t) => t.status === status.id) || [];

          return (
            <div
              key={status.id}
              className="flex-1 min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(status.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <h3 className="font-semibold text-gray-900 text-sm">{status.label}</h3>
                <span className="text-xs text-gray-400">({statusTasks.length})</span>
              </div>

              <div className="space-y-3 min-h-[150px] bg-gray-100 rounded-xl p-3">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(task.priority)}
                        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditTask(task)} className="text-gray-400 hover:text-blue-500 p-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {task.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('id-ID')}
                          </span>
                        )}
                        <button
                          onClick={() => setShowTimeLogModal(task)}
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                          title="Log waktu"
                        >
                          <Clock className="w-3 h-3" />
                          {task.loggedHours > 0 ? `${task.loggedHours}j` : 'Log'}
                        </button>
                      </div>
                      {task.assignee && (
                        <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          <User className="w-3 h-3" />
                          {task.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {statusTasks.length === 0 && (
                  <p className="text-center text-gray-400 text-xs py-6">Drop task di sini</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {activeTab === 'assets' && (
        <AssetManager projectId={id} />
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editTask ? 'Edit Task' : 'Tambah Task'}</h2>
              <button onClick={() => { setShowTaskModal(false); setEditTask(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editTask ? handleUpdateTask : handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Task *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Desain logo klien"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign ke</label>
                <select
                  value={taskForm.assigneeId}
                  onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">Belum di-assign</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowTaskModal(false); setEditTask(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editTask ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTimeLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Log Waktu</h2>
              <button onClick={() => setShowTimeLogModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="px-6 pt-4 text-sm text-gray-500">Task: {showTimeLogModal.title}</p>
            <form onSubmit={handleLogTime} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam *</label>
                <input
                  type="number"
                  step="0.5"
                  value={timeLogForm.hours}
                  onChange={(e) => setTimeLogForm({ ...timeLogForm, hours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={timeLogForm.date}
                  onChange={(e) => setTimeLogForm({ ...timeLogForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={timeLogForm.note}
                  onChange={(e) => setTimeLogForm({ ...timeLogForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Opsional"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTimeLogModal(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
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
