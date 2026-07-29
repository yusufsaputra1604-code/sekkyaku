import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, Edit2, Trash2, ArrowRight, Clock } from 'lucide-react';

const ACTION_CONFIG = {
  create: { icon: Plus, color: 'bg-green-100 text-green-600' },
  update: { icon: Edit2, color: 'bg-blue-100 text-blue-600' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-600' },
  stage_change: { icon: ArrowRight, color: 'bg-purple-100 text-purple-600' },
};

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(date).toLocaleDateString('id-ID');
}

export default function ActivityTimeline({ limit = 15, entity, entityId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { limit };
    if (entity) params.entity = entity;
    if (entityId) params.entityId = entityId;

    api.get('/activities', { params }).then(({ data }) => {
      setActivities(data);
      setLoading(false);
    });
  }, [limit, entity, entityId]);

  if (loading) return <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-1">
      {activities.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">Belum ada aktivitas</p>
      )}
      {activities.map((activity) => {
        const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.update;
        const Icon = config.icon;

        return (
          <div key={activity.id} className="flex items-start gap-3 py-2">
            <div className={`p-1.5 rounded-lg ${config.color} flex-shrink-0`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user?.name}</span>
                {' '}{activity.details}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {timeAgo(activity.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
