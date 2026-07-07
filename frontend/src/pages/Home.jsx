import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

const TASK_STATS = [
  { key: 'overdue', label: 'Overdue', icon: '/assets/icons/overdue.svg', bg: 'bg-red-50' },
  { key: 'today', label: 'Due today', icon: '/assets/icons/due-today.svg', bg: 'bg-forest/10' },
  { key: 'upcoming', label: 'Upcoming', icon: '/assets/icons/upcoming.svg', bg: 'bg-sage/15' },
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
      {action}
    </div>
  );
}

function StatBlock({ stat, value }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
        <img src={stat.icon} alt="" className="w-4.5 h-4.5" />
      </div>
      <span className="font-bold text-[19px] text-gray-900 leading-none">{value}</span>
      <span className="text-[11.5px] text-gray-500">{stat.label}</span>
    </div>
  );
}

function ContactCard({ contact, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform ${CARD_SHADOW}`}
    >
      <div className="w-11 h-11 rounded-full bg-forest/10 ring-1 ring-forest/20 flex items-center justify-center text-forest font-bold text-[13px] shrink-0">
        {getInitials(contact.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-gray-900 truncate">
          {contact.name}{' '}
          <span className="font-normal text-gray-500">{contact.company}</span>
        </p>
        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-forest/10 text-forest text-[10.5px] font-semibold">
          Lead
        </span>
      </div>
      <img src="/assets/icons/chevron-right.svg" alt="" className="w-4 h-4 opacity-40 shrink-0" />
    </button>
  );
}

function DrawerItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-left active:bg-sage/5 transition-colors">
      <div className="w-9 h-9 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
        <img src={icon} alt="" className="w-4.5 h-4.5 opacity-70" />
      </div>
      <span className="text-[14px] font-medium text-gray-800">{label}</span>
    </button>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[168px] rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] animate-pulse" />
      <div className="h-[68px] rounded-2xl bg-white/70 animate-pulse" />
      <div className="h-[76px] rounded-2xl bg-white/70 animate-pulse" />
      <div className="h-[76px] rounded-2xl bg-white/70 animate-pulse" />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabState, setFabState] = useState('idle'); // idle | pressed | loading
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeScope, setHomeScope] = useState('team');
  const [teamAssignments, setTeamAssignments] = useState([]);

  const isFounder = user?.role === 'founder';
  const hasContacts = dashboard?.recentContacts?.length > 0 || dashboard?.assignedCount > 0;

  function handleScanTap() {
    setFabState('pressed');
    setTimeout(() => setFabState('loading'), 150);
    setTimeout(() => navigate('/scan'), 900);
  }

  // Dashboard data depends on the active scope toggle (founder only).
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      try {
        const params = isFounder && homeScope === 'mine' ? { scope: 'mine' } : {};
        const { data } = await api.get('/dashboard/home', { params });
        if (!cancelled) setDashboard(data);
      } catch (err) {
        console.error('Could not load dashboard', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [homeScope, isFounder]);

  // Team assignments only need to load once per session for founders, not on every scope toggle.
  useEffect(() => {
    if (!isFounder) return;
    let cancelled = false;

    async function loadTeamAssignments() {
      try {
        const { data } = await api.get('/admin/team');
        if (!cancelled) setTeamAssignments((data.team || []).filter((u) => u.role === 'employee'));
      } catch (err) {
        console.error('Could not load team assignments', err);
      }
    }

    loadTeamAssignments();
    return () => { cancelled = true; };
  }, [isFounder]);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-8 shrink-0 rounded-b-[28px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setMenuOpen(true)} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
            <img src="/assets/icons/menu.svg" alt="menu" className="w-6 h-6 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[15px] tracking-wide">RecoSolution</span>
          <button onClick={() => navigate('/notifications')} className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors">
            <img src="/assets/icons/bell.svg" alt="notifications" className="w-6 h-6 brightness-0 invert" />
          </button>
        </div>
        <p className="text-white text-[20px] font-bold leading-tight">
          {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ''}
        </p>
        <p className="text-white/70 text-[12.5px] mt-1">
          Here's what's happening with your contacts today
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-5 pb-28 -mt-4">
        {loading ? (
          <HomeSkeleton />
        ) : !hasContacts ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-16">
            <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center mb-6 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.03]">
              <img src="/assets/illustrations/no-contacts.png" alt="No contacts" className="w-24 h-24 object-contain" />
            </div>
            <h1 className="text-[18px] font-bold text-gray-900 mb-2">No contacts yet</h1>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6 px-6">
              Scan your first business card to start building your contact list
            </p>
            <button
              onClick={handleScanTap}
              className="h-12 px-6 rounded-full font-semibold text-[14px] bg-forest text-white flex items-center gap-2 active:scale-[0.98] transition-transform shadow-[0_4px_14px_-4px_rgba(64,101,80,0.5)]"
            >
              <img src="/assets/icons/camera.svg" alt="" className="w-4 h-4 brightness-0 invert" />
              Scan a card
            </button>
          </div>
        ) : (
          <div className="w-full text-left flex flex-col gap-5 pt-1">

            {/* My Tasks / Team View toggle — Founder only */}
            {isFounder && (
              <div className="flex gap-2 bg-white rounded-full p-1 ring-1 ring-black/[0.03]">
                {[
                  { key: 'mine', label: 'My Tasks' },
                  { key: 'team', label: 'Team View' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setHomeScope(opt.key)}
                    className={`flex-1 h-9 rounded-full text-[13px] font-semibold transition-colors ${
                      homeScope === opt.key ? 'bg-forest text-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Task summary card */}
            <div className={`bg-white rounded-2xl p-5 ${CARD_SHADOW}`}>
              <p className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {isFounder && homeScope === 'team' ? 'Team summary' : 'My tasks overview'}
              </p>
              <div className="flex items-start mb-5">
                {TASK_STATS.map((stat, i) => (
                  <div key={stat.key} className={i === 1 ? 'flex-1 border-x border-gray-100 px-2' : 'flex-1 px-2'}>
                    <StatBlock stat={stat} value={dashboard?.tasks?.[stat.key] ?? 0} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="w-full h-11 rounded-full bg-forest/10 text-forest text-[13px] font-semibold flex items-center justify-center gap-1.5 active:bg-forest/15 transition-colors"
              >
                View all tasks
                <img src="/assets/icons/chevron-right.svg" alt="" className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Unassigned Contacts — Founder + Team View only */}
            {isFounder && homeScope === 'team' && (
              <button
                onClick={() => navigate('/admin/unassigned-contacts')}
                className={`w-full bg-white rounded-2xl p-4 flex items-center gap-3 ${CARD_SHADOW}`}
              >
                <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <img src="/assets/icons/unassigned-user.svg" alt="" className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-semibold text-gray-900">Unassigned contacts</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {dashboard?.unassignedContactsCount ?? 0} awaiting assignment
                  </p>
                </div>
                <img src="/assets/icons/chevron-right.svg" alt="" className="w-4 h-4 opacity-40" />
              </button>
            )}

            {/* Recently added contacts */}
            {dashboard?.recentContacts?.length > 0 && (
              <div>
                <SectionLabel
                  action={
                    <button
                      onClick={() => navigate('/contacts/recent')}
                      className="text-[12.5px] text-gray-500 font-medium flex items-center gap-1"
                    >
                      View all
                      <img src="/assets/icons/chevron-right.svg" alt="" className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  }
                >
                  Recently added
                </SectionLabel>
                <div className="flex flex-col gap-2.5">
                  {dashboard.recentContacts.map((c) => (
                    <ContactCard key={c._id} contact={c} onClick={() => navigate(`/contacts/${c._id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Team Assignments — Founder + Team View only */}
            {isFounder && homeScope === 'team' && teamAssignments.length > 0 && (
              <button
                onClick={() => navigate('/team-dashboard')}
                className={`w-full bg-white rounded-2xl p-4 text-left ${CARD_SHADOW}`}
              >
                <SectionLabel>Team assignments</SectionLabel>
                <div className="flex flex-col divide-y divide-gray-100">
                  {teamAssignments.map((emp) => (
                    <div key={emp._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-8 h-8 rounded-full bg-forest/10 ring-1 ring-forest/20 flex items-center justify-center text-forest font-bold text-[11px] shrink-0">
                        {getInitials(`${emp.firstName || ''} ${emp.lastName || ''}`)}
                      </div>
                      <span className="flex-1 text-[13px] font-medium text-gray-800 truncate">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-[13px] font-bold text-gray-900 shrink-0">
                        {emp.contactCount ?? 0}
                        <span className="font-normal text-gray-500 text-[12px]"> contacts</span>
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            )}

            {/* My Assigned Contacts — Employee only */}
            {user?.role === 'employee' && (
              <button
                onClick={() => navigate('/contacts/my-assigned')}
                className="w-full bg-forest rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-transform shadow-[0_4px_14px_-4px_rgba(64,101,80,0.4)]"
              >
                <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <img src="/assets/icons/team-members.svg" alt="" className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-semibold text-white">My assigned contacts</p>
                  <p className="text-[12.5px] text-white/70 mt-0.5">
                    <span className="font-bold text-white">{dashboard?.assignedContactsCount ?? 0}</span> active contacts
                  </p>
                </div>
                <img src="/assets/icons/chevron-right.svg" alt="" className="w-4 h-4 brightness-0 invert opacity-80" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-forest relative px-2 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between px-2">
          <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 flex-1 py-1">
            <img src="/assets/icons/tab-home.svg" alt="" className="w-6 h-6" />
            <span className="text-white text-[11px] font-medium">Home</span>
          </button>

          <button onClick={() => navigate('/contacts')} className="flex flex-col items-center gap-1 flex-1 py-1">
            <img src="/assets/icons/tab-contacts.svg" alt="" className="w-6 h-6 opacity-80" />
            <span className="text-white/80 text-[11px] font-medium">Contacts</span>
          </button>

          {/* Spacer for the floating scan button */}
          <div className="flex-1" />

          <button onClick={() => navigate('/tasks')} className="flex flex-col items-center gap-1 flex-1 py-1">
            <img src="/assets/icons/tab-followup.svg" alt="" className="w-6 h-6 opacity-80" />
            <span className="text-white/80 text-[11px] font-medium">Tasks</span>
          </button>

          <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 flex-1 py-1">
            <img src="/assets/icons/tab-profile.svg" alt="" className="w-6 h-6 opacity-80" />
            <span className="text-white/80 text-[11px] font-medium">Profile</span>
          </button>
        </div>

        {/* Floating Scan button */}
        <button
          onClick={handleScanTap}
          className="absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 rounded-full bg-sage flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)]"
        >
          <div
            className={`w-14 h-14 rounded-full bg-forest flex items-center justify-center transition-transform ${
              fabState !== 'idle' ? 'scale-95' : ''
            }`}
          >
            {fabState === 'loading' ? (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <img src="/assets/icons/camera.svg" alt="Scan" className="w-6 h-6 brightness-0 invert" />
            )}
          </div>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 top-9 text-white text-[11px] font-semibold whitespace-nowrap">
          {fabState === 'loading' ? 'Just a sec...' : 'Scan'}
        </span>
      </div>

      {/* Side menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />

          <div className="absolute left-0 top-0 h-full w-[78%] max-w-[300px] bg-white shadow-[0_0_32px_-4px_rgba(0,0,0,0.25)] flex flex-col overflow-y-auto animate-[slide-in-left_0.2s_ease-out]">
            {/* Profile header */}
            <div className="pt-9 pb-6 px-5 flex flex-col items-center text-center border-b border-sage/10">
              <div className="w-20 h-20 rounded-full bg-forest/10 ring-2 ring-forest/20 flex items-center justify-center overflow-hidden shrink-0 mb-3">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-forest font-bold text-[22px]">
                    {getInitials(`${user?.firstName || ''} ${user?.lastName || ''}`)}
                  </span>
                )}
              </div>
              <p className="font-bold text-gray-900 text-[16px]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[12.5px] text-gray-500 mt-0.5">
                {user?.jobTitle || (isFounder ? 'Founder' : 'Employee')}
              </p>
            </div>

            <div className="px-3 py-3 flex-1">
              {isFounder && (
                <DrawerItem
                  icon="/assets/icons/team-dashboard.svg"
                  label="Team Dashboard"
                  onClick={() => { setMenuOpen(false); navigate('/team-dashboard'); }}
                />
              )}
              <DrawerItem
                icon="/assets/icons/export.svg"
                label="Export Contacts"
                onClick={() => { setMenuOpen(false); navigate('/contacts/export'); }}
              />
              <DrawerItem
                icon="/assets/icons/analytics.svg"
                label="Analytics"
                onClick={() => { setMenuOpen(false); navigate('/analytics'); }}
              />
              <DrawerItem
                icon="/assets/icons/help.svg"
                label="Help and Support"
                onClick={() => { setMenuOpen(false); navigate('/help-support'); }}
              />
              <DrawerItem
                icon="/assets/icons/privacy.svg"
                label="Privacy Policy"
                onClick={() => { setMenuOpen(false); navigate('/privacy-policy'); }}
              />
              <DrawerItem
                icon="/assets/icons/info.svg"
                label="About App"
                onClick={() => { setMenuOpen(false); navigate('/about-app'); }}
              />
            </div>

            <div className="px-3 py-3 border-t border-sage/10">
              <button
                onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-left active:bg-red-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <img src="/assets/icons/logout.svg" alt="" className="w-4.5 h-4.5 opacity-70" />
                </div>
                <span className="text-[14px] font-medium text-red-600">Logout</span>
              </button>
            </div>
          </div>

          <style>{`
            @keyframes slide-in-left {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}