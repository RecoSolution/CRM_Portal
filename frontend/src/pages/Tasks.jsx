import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const QUICK_FILTERS = ['All', 'Overdue', 'Today']
const VALID_FILTERS = ['overdue', 'today', 'upcoming', 'completed', 'pending']

export default function Tasks() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const isFounder = user?.role === 'founder'

  const [scope, setScope] = useState('team') // 'team' | 'my' — founder only

  // Accept ANY valid deep-linked filter (not just the 3 visible pills) —
  // Team Dashboard / Home link to upcoming/completed/pending too, even
  // though those aren't shown as pills on this page.
  const initialFilterParam = searchParams.get('filter')?.toLowerCase()
  const [quickFilter, setQuickFilter] = useState(() => {
    if (!initialFilterParam || !VALID_FILTERS.includes(initialFilterParam)) return 'All'
    return initialFilterParam.charAt(0).toUpperCase() + initialFilterParam.slice(1)
  })
  const [sortFilters, setSortFilters] = useState(location.state?.filters || {});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fabState, setFabState] = useState('idle');

  useEffect(() => {
    fetchTasks();
  }, [scope, quickFilter, sortFilters]);

  function handleScanTap() {
    setFabState('pressed');
    setTimeout(() => setFabState('loading'), 150);
    setTimeout(() => navigate('/scan'), 900);
  }

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = {};

      if (quickFilter !== 'All') params.filter = quickFilter.toLowerCase();
      if (isFounder && scope === 'my') params.createdBy = user._id
      if (isFounder && scope === 'team') params.teamView = 'true'

      if (sortFilters.taskType) params.taskType = sortFilters.taskType;
      if (sortFilters.dueType) params.filter = sortFilters.dueType; // overrides quick filter if set from Sort screen
      if (sortFilters.priority) params.priority = sortFilters.priority;
      if (sortFilters.relationshipType)
        params.relationshipType = sortFilters.relationshipType;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Could not load tasks', err);
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    // Strip anything that isn't a letter or whitespace (bullets, dashes,
    // dots, etc.) so symbols never end up rendered as an "initial".
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

  function formatDueDisplay(task) {
    if (!task.dueDate) return 'No due date'

    const due = new Date(task.dueDate)
    const now = new Date()
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.round((dueDay - today) / 86400000)

    const timeLabel = task.dueTime
      ? (() => {
          const [h, m] = task.dueTime.split(':').map(Number)
          const d = new Date()
          d.setHours(h, m)
          return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: m ? '2-digit' : undefined }).toLowerCase().replace(' ', '')
        })()
      : null

    let dayLabel
    if (diffDays === 0) dayLabel = 'Today'
    else if (diffDays === -1) dayLabel = 'Yesterday'
    else if (diffDays === 1) dayLabel = 'Tomorrow'
    else dayLabel = due.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

    return timeLabel ? `${dayLabel} | ${timeLabel}` : dayLabel
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className='bg-sage px-5 pt-5 pb-4 flex items-center justify-between'>
        <button
          onClick={() => navigate('/home')}
          className='w-9 h-9 flex items-center justify-center -ml-1'
        >
          <img
            src='/assets/icons/arrow-left.svg'
            alt='back'
            className='w-5 h-5'
          />
        </button>
        <span className='text-white font-bold text-[17px]'>Tasks</span>
        <div className='w-9 h-9' />
      </div>

      {/* Team Tasks / My Tasks toggle — Founder only */}
      {isFounder && (
        <div className='flex mx-5 mt-4 rounded-xl overflow-hidden bg-white/70'>
          <button
            onClick={() => setScope('team')}
            className={`flex-1 h-10 text-[13px] font-semibold ${scope === 'team' ? 'bg-forest text-white' : 'text-gray-600'}`}
          >
            Team Tasks
          </button>
          <button
            onClick={() => setScope('my')}
            className={`flex-1 h-10 text-[13px] font-semibold ${scope === 'my' ? 'bg-forest text-white' : 'text-gray-600'}`}
          >
            My Tasks
          </button>
        </div>
      )}

      {/* Sort button + quick filter pills */}
      <div className='flex items-center gap-2 overflow-x-auto px-5 py-4 shrink-0'>
        <button
          onClick={() =>
            navigate('/tasks/sort', { state: { filters: sortFilters } })
          }
          className='w-9 h-9 rounded-full bg-white/70 flex items-center justify-center shrink-0'
        >
          <img src='/assets/icons/filter.svg' alt='sort' className='w-4 h-4' />
        </button>
        {QUICK_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setQuickFilter(f)}
            className={`h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 ${
              quickFilter === f
                ? 'bg-forest text-white'
                : 'bg-white/70 text-gray-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className='flex-1 px-5 overflow-y-auto'>
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce' style={{ animationDelay: '0ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce' style={{ animationDelay: '150ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce' style={{ animationDelay: '300ms' }} />
        </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <img
              src='/assets/icons/bell.svg'
              alt=''
              className='w-10 h-10 opacity-40 mb-3'
            />
            <p className='text-[14px] text-gray-500'>No tasks found</p>
          </div>
        ) : (
          <div className='flex flex-col gap-3 mt-1'>
            {tasks.map((t) => (
              <button
                key={t._id}
                onClick={() => navigate(`/tasks/${t._id}`)}
                className='w-full bg-white rounded-2xl px-4 py-3 text-left'
              >
                <div className='flex items-start gap-3'>
                  <div className='w-11 h-11 rounded-full bg-sage/60 flex items-center justify-center text-white font-bold text-[13px] shrink-0'>
                    {getInitials(t.contact?.name)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between'>
                      <p className='font-semibold text-[14px] text-gray-900 truncate'>
                        {t.contact?.name || 'No contact'}{' '}
                        <span className='font-normal text-gray-500'>
                          {t.contact?.company || ''}
                        </span>
                      </p>
                      {t.priority === 'High' && (
                        <span className='flex items-center gap-1 text-[11px] font-semibold text-red-500 shrink-0 ml-2'>
                          <span className='w-1.5 h-1.5 rounded-full bg-red-500' />{' '}
                          High Priority
                        </span>
                      )}
                    </div>
                    <span className='inline-block mt-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-[12px] font-medium'>
                      {t.title}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1.5">{formatDueDisplay(t)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom tab bar — same structure as Home.jsx */}
      <div className='bg-forest relative px-2 pt-3 pb-2 shrink-0'>
        <div className='flex items-center justify-between px-2'>
          <button
            onClick={() => navigate('/home')}
            className='flex flex-col items-center gap-1 flex-1'
          >
            <img src='/assets/icons/tab-home.svg' alt='' className='w-6 h-6' />
            <span className='text-white/80 text-[11px] font-medium'>Home</span>
          </button>

          <button
            onClick={() => navigate('/contacts')}
            className='flex flex-col items-center gap-1 flex-1'
          >
            <img
              src='/assets/icons/tab-contacts.svg'
              alt=''
              className='w-6 h-6'
            />
            <span className='text-white/80 text-[11px] font-medium'>
              Contacts
            </span>
          </button>

          {/* Spacer for the floating scan button */}
          <div className='flex-1' />

          <button className='flex flex-col items-center gap-1 flex-1'>
            <img
              src='/assets/icons/tab-followup.svg'
              alt=''
              className='w-6 h-6'
            />
            <span className='text-white text-[11px] font-medium'>Tasks</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className='flex flex-col items-center gap-1 flex-1'
          >
            <img
              src='/assets/icons/tab-profile.svg'
              alt=''
              className='w-6 h-6'
            />
            <span className='text-white/80 text-[11px] font-medium'>
              Profile
            </span>
          </button>
        </div>

        {/* Floating Scan button */}
        <button
          onClick={handleScanTap}
          className='absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 rounded-full bg-sage flex items-center justify-center shadow-lg'
        >
          <div
            className={`w-14 h-14 rounded-full bg-forest flex items-center justify-center ${fabState !== 'idle' ? 'scale-95' : ''} transition-transform`}
          >
            {fabState === 'loading' ? (
              <div className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce' style={{ animationDelay: '0ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce' style={{ animationDelay: '150ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce' style={{ animationDelay: '300ms' }} />
        </div>

            ) : (
              <img
                src='/assets/icons/camera.svg'
                alt='Scan'
                className='w-6 h-6 brightness-0 invert'
              />
            )}
          </div>
        </button>
        <span className='absolute left-1/2 -translate-x-1/2 top-9 text-white text-[11px] font-semibold'>
          {fabState === 'loading' ? 'Just a sec...' : 'Scan'}
        </span>
      </div>

      {/* Founder-only create button */}
      {isFounder && (
        <button
          onClick={() => navigate('/tasks/create')}
          className='fixed bottom-20 right-5 w-12 h-12 rounded-full bg-forest text-white flex items-center justify-center shadow-lg text-2xl font-bold z-10'
        >
          +
        </button>
      )}
    </div>
  );
}
