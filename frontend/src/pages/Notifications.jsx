import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PRIORITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function ReminderCard({ reminder, onOpen }) {
  return (
    <button
      onClick={() => onOpen(reminder.contactId)}
      className="w-full flex items-start gap-3 bg-white rounded-2xl px-4 py-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform"
    >
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[reminder.priority] || 'bg-gray-300'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-[14.5px] text-gray-900 truncate">{reminder.contactName}</span>
          <span className="text-[11.5px] text-gray-400 shrink-0">{formatDate(reminder.dueDate)}</span>
        </div>
        <p className="text-[13px] text-gray-500 capitalize truncate">
          {reminder.task ? reminder.task.replace(/_/g, ' ') : reminder.note}
        </p>
      </div>
    </button>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotifications() {
      setLoading(true);
      try {
        const [todayRes, upcomingRes] = await Promise.all([
          api.get('/contacts/reminders/all', { params: { filter: 'today' } }),
          api.get('/contacts/reminders/all', { params: { filter: 'upcoming' } }),
        ]);
        if (cancelled) return;
        const combined = [
          ...(todayRes.data.reminders || []).map((r) => ({ ...r, bucket: 'Today' })),
          ...(upcomingRes.data.reminders || []).slice(0, 5).map((r) => ({ ...r, bucket: 'Upcoming' })),
        ];
        setReminders(combined);
      } catch (err) {
        console.error('Could not load notifications', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNotifications();
    return () => { cancelled = true; };
  }, []);

  const sections = useMemo(() => {
    const today = reminders.filter((r) => r.bucket === 'Today');
    const upcoming = reminders.filter((r) => r.bucket === 'Upcoming');
    return [
      { label: 'Today', items: today },
      { label: 'Upcoming', items: upcoming },
    ].filter((s) => s.items.length > 0);
  }, [reminders]);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header — curved bottom edge, matches Contacts / Filter Contacts / Help & Support */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Notifications</span>
          <div className="w-9 h-9" />
        </div>
      </div>

      <div className="flex-1 px-5 pt-5 pb-10 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 mt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[68px] rounded-2xl bg-white/70 animate-pulse" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center">
              <img src="/assets/icons/bell.svg" alt="" className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-[14px] font-medium text-gray-600">You're all caught up</p>
            <p className="text-[12.5px] text-gray-400 max-w-[220px]">No pending reminders right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-1">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
                  {section.label}
                </p>
                <div className="flex flex-col gap-3">
                  {section.items.map((r) => (
                    <ReminderCard key={r._id} reminder={r} onOpen={(id) => navigate(`/contacts/${id}`)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}