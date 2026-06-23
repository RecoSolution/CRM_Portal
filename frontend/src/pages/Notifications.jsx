import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Notifications() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const [todayRes, upcomingRes] = await Promise.all([
        api.get('/contacts/reminders/all', { params: { filter: 'today' } }),
        api.get('/contacts/reminders/all', { params: { filter: 'upcoming' } }),
      ]);
      const combined = [
        ...(todayRes.data.reminders || []).map((r) => ({ ...r, bucket: 'Today' })),
        ...(upcomingRes.data.reminders || []).slice(0, 5).map((r) => ({ ...r, bucket: 'Upcoming' })),
      ];
      setReminders(combined);
    } catch (err) {
      console.error('Could not load notifications', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  function priorityColor(priority) {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-amber-500';
    return 'bg-gray-400';
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage px-5 pt-5 pb-4 flex items-center justify-between'>
        <button onClick={() => navigate(-1)} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-bold text-[17px]'>Notifications</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-5 pb-10 overflow-y-auto'>
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin' />
          </div>
        ) : reminders.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <img src='/assets/icons/bell.svg' alt='' className='w-10 h-10 opacity-40 mb-3' />
            <p className='text-[14px] text-gray-500'>You're all caught up — no pending reminders.</p>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {reminders.map((r) => (
              <button
                key={r._id}
                onClick={() => navigate(`/contacts/${r.contactId}`)}
                className='flex items-start gap-3 bg-white/70 rounded-2xl px-4 py-3.5 text-left'
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityColor(r.priority)}`} />
                <div className='flex-1'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='font-semibold text-[14px] text-gray-900'>{r.contactName}</span>
                    <span className='text-[11px] text-gray-400'>{r.bucket}</span>
                  </div>
                  <p className='text-[13px] text-gray-600 capitalize mb-1'>
                    {r.task ? r.task.replace(/_/g, ' ') : r.note}
                  </p>
                  <span className='text-[12px] text-gray-400'>{formatDate(r.dueDate)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}