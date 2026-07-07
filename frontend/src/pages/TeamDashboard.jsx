import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_CONFIG = [
  { key: 'Overdue', label: 'Overdue', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  { key: 'Today', label: 'Today', bg: 'bg-forest/8', text: 'text-forest', dot: 'bg-forest' },
  { key: 'Upcoming', label: 'Upcoming', bg: 'bg-sage/12', text: 'text-sage', dot: 'bg-sage' },
  { key: 'Pending', label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  { key: 'Completed', label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
];

const AVATAR_SHADES = ['bg-forest', 'bg-sage', 'bg-forest/80', 'bg-sage/80'];

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

function hashToIndex(str, mod) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % mod;
  return hash;
}

function StatCard({ status, count, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl ${status.bg} active:scale-[0.96] transition-transform min-w-[104px]`}
    >
      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
      <span className={`font-bold text-[22px] leading-none ${status.text}`}>{count}</span>
      <span className="text-[11.5px] font-medium text-gray-600">{status.label}</span>
    </button>
  );
}

function EmployeeCard({ emp }) {
  const avatarShade = AVATAR_SHADES[hashToIndex(emp._id || emp.email || '', AVATAR_SHADES.length)];
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full ${avatarShade} flex items-center justify-center text-white font-bold text-[14px] shrink-0 ring-2 ring-white shadow-sm`}>
          {getInitials(`${emp.firstName} ${emp.lastName}`)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14.5px] font-semibold text-gray-900 truncate">
              {emp.firstName} {emp.lastName}
            </p>
            <span className="text-[10px] font-semibold text-forest bg-forest/8 px-2 py-0.5 rounded-full capitalize shrink-0">
              {emp.role}
            </span>
          </div>
          <p className="text-[12px] text-gray-400 truncate">{emp.email}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <div className="flex-1 text-center">
          <p className="text-[15px] font-bold text-gray-900">{emp.contactCount ?? 0}</p>
          <p className="text-[10.5px] text-gray-400">Contacts</p>
        </div>
        <div className="flex-1 text-center border-x border-gray-100">
          <p className="text-[15px] font-bold text-forest">{emp.activeTaskCount ?? 0}</p>
          <p className="text-[10.5px] text-gray-400">Active</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[15px] font-bold text-gray-400">{emp.completedTaskCount ?? 0}</p>
          <p className="text-[10.5px] text-gray-400">Done</p>
        </div>
      </div>
    </div>
  );
}

export default function TeamDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const [dashRes, teamRes] = await Promise.all([
          api.get('/admin/team-dashboard'),
          api.get('/admin/team'),
        ]);
        if (cancelled) return;
        setSummary(dashRes.data);
        setTeam(teamRes.data.team || []);
      } catch (err) {
        console.error('Could not load team dashboard', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header — curved bottom edge, matches app shell */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Team Dashboard</span>
          <div className="w-9 h-9" />
        </div>
        <p className="text-center text-white/70 text-[12.5px] mt-1">
          Overview of your team's performance
        </p>
      </div>

      <div className="flex-1 px-5 -mt-3 pb-10 overflow-y-auto">

        {loading ? (
          <div className="flex flex-col gap-3 pt-1">
            <div className="h-[120px] rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] animate-pulse" />
            <div className="h-[68px] rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-[92px] rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-[92px] rounded-2xl bg-white/70 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 mb-5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3 px-0.5">
                Task Status — All Employees
              </p>
              <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
                {STATUS_CONFIG.map((status) => (
                  <StatCard
                    key={status.key}
                    status={status}
                    count={summary?.taskStatusBreakdown?.[status.key] ?? 0}
                    onOpen={() => navigate(`/tasks?filter=${status.key.toLowerCase()}`)}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/unassigned-contacts')}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <img src="/assets/icons/unassigned-user.svg" alt="" className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[14px] font-semibold text-gray-900">Unassigned Contacts</p>
                <p className="text-[12px] text-gray-500">
                  {summary?.unassignedContactsCount ?? 0} awaiting assignment
                </p>
              </div>
              <img src="/assets/icons/chevron-right.svg" alt="" className="w-4 h-4 opacity-40" />
            </button>

            <div className="flex items-center justify-between mb-2.5 px-1">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
                Employees
              </p>
              <span className="text-[11.5px] font-medium text-gray-400">{team.length} total</span>
            </div>
            <div className="flex flex-col gap-3">
              {team.map((emp) => (
                <EmployeeCard key={emp._id} emp={emp} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}