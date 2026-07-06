import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

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
    loadTask();
  }, [id]);

  async function loadTask() {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
    } catch (err) {
      setError('Could not load task.');
    } finally {
      setLoading(false);
    }
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
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center'>
        <div className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce' style={{ animationDelay: '0ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce' style={{ animationDelay: '150ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce' style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const current = formatDate(task.dueDate);

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      {/* Header */}
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate(`/tasks/${id}`)} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>Reschedule Task</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-6 pb-10 overflow-y-auto'>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4'>
            {error}
          </div>
        )}

        {/* Contact card */}
        {task.contact && (
          <div className='bg-white rounded-2xl p-4 flex items-center gap-3 mb-6'>
            <div className='w-11 h-11 rounded-full bg-sage/60 flex items-center justify-center text-white font-bold text-[13px] shrink-0'>
              {task.contact.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-[14px] font-bold text-gray-900 truncate'>{task.contact.name}</p>
              {task.contact.designation && (
                <p className='text-[12px] text-gray-500 truncate'>{task.contact.designation}</p>
              )}
              {task.contact.company && (
                <p className='text-[12px] font-semibold text-gray-700 truncate'>{task.contact.company}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/contacts/${task.contact._id}`)}
              className='h-9 px-4 rounded-full border-[1.5px] border-forest text-forest text-[12px] font-semibold shrink-0'
            >
              View Contact
            </button>
          </div>
        )}

        {/* Current schedule */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>Current Schedule</p>
        <div className='bg-white rounded-2xl mb-6 flex divide-x divide-gray-200'>
          <div className='flex-1 p-4'>
            <p className='text-[12px] text-gray-500 mb-1'>Date</p>
            <p className='text-[15px] font-bold text-gray-900'>{current.date}</p>
            <p className='text-[12px] text-gray-500'>{current.day}</p>
          </div>
          <div className='flex-1 p-4'>
            <p className='text-[12px] text-gray-500 mb-1'>Time</p>
            <p className='text-[15px] font-bold text-gray-900'>{task.dueTime || '—'}</p>
          </div>
        </div>

        {/* New schedule */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>New Schedule</p>
        <div className='flex gap-3 mb-6'>
          <div className='flex-1'>
            <label className='block text-[12px] text-gray-500 mb-1.5'>New Date</label>
            <input
              type='date'
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className='w-full h-12 rounded-xl px-3 text-[14px] text-gray-900 bg-white border border-forest/30 outline-none'
            />
          </div>
          <div className='flex-1'>
            <label className='block text-[12px] text-gray-500 mb-1.5'>New Time</label>
            <input
              type='time'
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className='w-full h-12 rounded-xl px-3 text-[14px] text-gray-900 bg-white border border-forest/30 outline-none'
            />
          </div>
        </div>

        {/* Reason */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>
          Reason for Rescheduling <span className='font-normal text-gray-400'>(Optional)</span>
        </p>
        <div className='bg-white rounded-2xl mb-2 relative'>
          <textarea
            value={reason}
            onChange={(e) => e.target.value.length <= 200 && setReason(e.target.value)}
            rows={3}
            className='w-full rounded-2xl px-4 py-3 text-[14px] text-gray-800 bg-transparent outline-none resize-none'
          />
          <span className='absolute bottom-2 right-3 text-[11px] text-gray-400'>{reason.length}/200</span>
        </div>

        <div className='h-6' />

        {/* Info banner */}
        <div className='bg-sage/20 rounded-2xl px-4 py-3 flex items-start gap-2.5 mb-6'>
          <img src='/assets/icons/info.svg' alt='' className='w-4 h-4 mt-0.5 shrink-0' />
          <p className='text-[12px] text-gray-700 leading-snug'>
            This task would be rescheduled and a new reminder will be set for the updated time.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60'
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}