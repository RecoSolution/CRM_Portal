import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

function getInitials(name) {
  if (!name) return '?';
  const cleaned = name.replace(/[^a-zA-Z\s]/g, '').trim();
  if (!cleaned) return '?';
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return { date: '—', day: '' };
  const d = new Date(dateStr);
  const day = d.getDate();
  const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
  return {
    date: `${day}${suffix} ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    day: d.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

export default function RescheduleTask() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTask() {
      setLoading(true);
      try {
        const res = await api.get(`/tasks/${id}`);
        if (!cancelled) setTask(res.data.task);
      } catch (err) {
        if (!cancelled) setError('Could not load task.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTask();
    return () => { cancelled = true; };
  }, [id]);

  async function handleSave() {
    if (!newDate) {
      setError('Please select a new date.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.put(`/tasks/${id}/reschedule`, {
        dueDate: newDate,
        dueTime: newTime,
        reason,
      });
      navigate(`/tasks/${id}`);
    } catch (err) {
      setError('Could not reschedule task. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !task) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
        <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0">
          <button onClick={() => navigate(`/tasks/${id}`)} className="w-9 h-9 flex items-center justify-center -ml-1">
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-[16px]">Reschedule Task</span>
          <div className="w-9 h-9" />
        </div>
        <div className="flex-1 px-5 pt-7">
          <div className="flex flex-col gap-3">
            <div className="h-[76px] rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-[80px] rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-12 rounded-2xl bg-white/70 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const current = formatDate(task.dueDate);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0">
        <button onClick={() => navigate(`/tasks/${id}`)} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">Reschedule Task</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {task.contact && (
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 mb-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="w-11 h-11 rounded-full bg-sage flex items-center justify-center text-white font-bold text-[13px] shrink-0">
              {getInitials(task.contact.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900 truncate">{task.contact.name}</p>
              {task.contact.designation && (
                <p className="text-[12px] text-gray-500 truncate">{task.contact.designation}</p>
              )}
              {task.contact.company && (
                <p className="text-[12px] font-semibold text-gray-700 truncate">{task.contact.company}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/contacts/${task.contact._id}`)}
              className="h-9 px-4 rounded-full border-[1.5px] border-forest text-forest text-[12px] font-semibold shrink-0 active:scale-[0.97] transition-transform"
            >
              View Contact
            </button>
          </div>
        )}

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Current Schedule
        </p>
        <div className="bg-white rounded-2xl mb-7 flex divide-x divide-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex-1 p-4">
            <p className="text-[12px] text-gray-500 mb-1">Date</p>
            <p className="text-[15px] font-bold text-gray-900">{current.date}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">{current.day}</p>
          </div>
          <div className="flex-1 p-4">
            <p className="text-[12px] text-gray-500 mb-1">Time</p>
            <p className="text-[15px] font-bold text-gray-900">{task.dueTime || '—'}</p>
          </div>
        </div>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          New Schedule
        </p>
        <div className="flex gap-3 mb-7">
          <div className="flex-1">
            <label className="block text-[12px] text-gray-500 mb-1.5 px-1">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full h-12 rounded-2xl px-3.5 text-[14px] text-gray-900 bg-white border-none outline-none shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[12px] text-gray-500 mb-1.5 px-1">New Time</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full h-12 rounded-2xl px-3.5 text-[14px] text-gray-900 bg-white border-none outline-none shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            />
          </div>
        </div>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Reason for Rescheduling <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <div className="bg-white rounded-2xl mb-7 relative shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <textarea
            value={reason}
            onChange={(e) => e.target.value.length <= 200 && setReason(e.target.value)}
            rows={3}
            placeholder="Add a note (optional)..."
            className="w-full rounded-2xl px-4 py-3.5 pb-6 text-[14px] text-gray-800 bg-transparent outline-none resize-none placeholder:text-gray-400"
          />
          <span className="absolute bottom-2.5 right-4 text-[11px] text-gray-400">{reason.length}/200</span>
        </div>

        <div className="bg-sage/10 rounded-2xl px-4 py-3.5 flex items-start gap-2.5 mb-7">
          <img src="/assets/icons/info.svg" alt="" className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
          <p className="text-[12.5px] text-gray-700 leading-snug">
            This task will be rescheduled and a new reminder will be set for the updated time.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60 active:scale-[0.99] transition-transform"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}