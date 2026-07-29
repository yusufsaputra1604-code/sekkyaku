import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, FileText, Bell, FolderKanban } from 'lucide-react';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const TYPE_CONFIG = {
  task: { icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Task' },
  reminder: { icon: Bell, color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Reminder' },
  deadline: { icon: FolderKanban, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Deadline' },
  invoice: { icon: FileText, color: 'bg-red-100 text-red-700 border-red-200', label: 'Invoice' },
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    api.get('/calendar/events', {
      params: { start: start.toISOString(), end: end.toISOString() },
    }).then(({ data }) => {
      setEvents(data);
      setLoading(false);
    });
  }, [currentDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return events.filter((e) => {
      const eventDate = new Date(e.date).toISOString().slice(0, 10);
      return eventDate === dateStr;
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().getDate());
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);
  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const handleEventClick = (event) => {
    if (event.type === 'task' && event.meta.projectId) {
      navigate(`/projects/${event.meta.projectId}`);
    } else if (event.type === 'deadline' && event.meta.projectId) {
      navigate(`/projects/${event.meta.projectId}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Hari Ini
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = day === selectedDate;

              return (
                <div
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  className={`min-h-[100px] border border-gray-100 rounded-lg p-1.5 cursor-pointer transition-colors ${
                    day ? 'hover:bg-gray-50' : ''
                  } ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''} ${
                    isToday(day) ? 'bg-blue-50' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => {
                          const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.task;
                          return (
                            <div
                              key={event.id}
                              className={`text-[10px] px-1 py-0.5 rounded truncate ${config.color} border`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">
                            +{dayEvents.length - 3} lagi
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-purple-500" />
            {selectedDate
              ? `${selectedDate} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : 'Pilih tanggal'}
          </h3>

          {selectedDate && selectedDayEvents.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Tidak ada event</p>
          )}

          {!selectedDate && (
            <p className="text-gray-400 text-sm text-center py-4">Klik tanggal di kalender untuk lihat event</p>
          )}

          <div className="space-y-3">
            {selectedDayEvents.map((event) => {
              const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.task;
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={`p-3 rounded-lg border ${config.color} cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs opacity-75 mt-0.5">{config.label}</p>
                      {event.meta.projectName && (
                        <p className="text-xs opacity-75">{event.meta.projectName}</p>
                      )}
                      {event.meta.clientName && (
                        <p className="text-xs opacity-75">{event.meta.clientName}</p>
                      )}
                      {event.meta.total && (
                        <p className="text-xs opacity-75">
                          Rp {event.meta.total.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Keterangan</h4>
            <div className="space-y-1">
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${config.color}`} />
                  <span className="text-xs text-gray-500">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
