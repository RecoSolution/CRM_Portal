import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function TeamDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dashRes, teamRes] = await Promise.all([
        api.get('/admin/team-dashboard'),
        api.get('/admin/team'),
      ]);
      setSummary(dashRes.data);
      setTeam(teamRes.data.team || []);
    } catch (err) {
      console.error('Could not load team dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  const statusOrder = ['Overdue', 'Today', 'Upcoming', 'Pending', 'Completed'];

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

  if (loading) {
    return (
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center'>
        <div className='flex items-center gap-1.5'>
          <span
            className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce'
            style={{ animationDelay: '0ms' }}
          />
          <span
            className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce'
            style={{ animationDelay: '150ms' }}
          />
          <span
            className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce'
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>
      {/* Header */}
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
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
        <span className='text-white font-semibold text-[16px]'>
          Team Dashboard
        </span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 py-5 overflow-y-auto'>
        {/* Org-wide task status — same bordered-card style as Home's task overview */}
        <div className='border-2 border-forest/40 rounded-2xl p-4 mb-4'>
          <p className='text-center text-forest font-bold text-[15px] mb-3'>
            Task Status — All Employees
          </p>
          <div className='grid grid-cols-3 gap-3'>
            {statusOrder.map((status) => (
              <button
                key={status}
                onClick={() =>
                  navigate(`/tasks?filter=${status.toLowerCase()}`)
                }
                className='flex flex-col items-center gap-1 py-2'
              >
                <span className='font-bold text-[18px] text-gray-900'>
                  {summary?.taskStatusBreakdown?.[status] ?? 0}
                </span>
                <span className='text-[11px] text-gray-500'>{status}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Unassigned contacts */}
        <button
          onClick={() => navigate('/admin/unassigned-contacts')}
          className='w-full bg-white rounded-2xl p-4 flex items-center gap-3 mb-4'
        >
          <img
            src='/assets/icons/unassigned-user.svg'
            alt=''
            className='w-11 h-11 shrink-0'
          />
          <div className='flex-1 text-left'>
            <p className='text-[14px] font-semibold text-gray-900'>
              Unassigned Contacts
            </p>
            <p className='text-[12px] text-gray-500'>
              {summary?.unassignedContactsCount ?? 0} awaiting assignment
            </p>
          </div>
          <img
            src='/assets/icons/chevron-right.svg'
            alt=''
            className='w-4 h-4'
          />
        </button>

        {/* Employee list */}
        <p className='text-[14px] font-bold text-gray-900 mb-3'>Employees</p>
        <div className='flex flex-col gap-2'>
          {team.map((emp) => (
            <div
              key={emp._id}
              className='bg-white rounded-2xl px-4 py-3 flex items-center gap-3'
            >
              <div className='w-11 h-11 rounded-full bg-sage/60 flex items-center justify-center text-white font-bold text-[13px] shrink-0'>
                {getInitials(`${emp.firstName} ${emp.lastName}`)}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between'>
                  <p className='text-[14px] font-semibold text-gray-900 truncate'>
                    {emp.firstName} {emp.lastName}
                  </p>
                  <span className='text-[11px] font-semibold text-forest bg-forest/10 px-2 py-0.5 rounded-full capitalize shrink-0 ml-2'>
                    {emp.role}
                  </span>
                </div>
                <p className='text-[12px] text-gray-500 truncate'>
                  {emp.email}
                </p>
                <div className='flex gap-3 text-[12px] text-gray-600 mt-1'>
                  <span>{emp.contactCount ?? 0} contacts</span>
                  <span>{emp.activeTaskCount ?? 0} active</span>
                  <span>{emp.completedTaskCount ?? 0} done</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
