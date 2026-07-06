import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import api from '../utils/api';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabState, setFabState] = useState('idle'); // idle | pressed | loading
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeScope, setHomeScope] = useState('team');
  const [teamAssignments, setTeamAssignments] = useState([]);

  const hasContacts =
    dashboard?.recentContacts?.length > 0 || dashboard?.assignedCount > 0;

  function handleScanTap() {
    setFabState('pressed');
    setTimeout(() => setFabState('loading'), 150);
    setTimeout(() => navigate('/scan'), 900);
  }

  useEffect(() => {
    loadDashboard();
    if (user?.role === 'founder') loadTeamAssignments();
  }, [homeScope]);

  async function loadDashboard() {
    try {
      const params =
        user?.role === 'founder' && homeScope === 'mine'
          ? { scope: 'mine' }
          : {};
      const { data } = await api.get('/dashboard/home', { params });

      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamAssignments() {
    try {
      const { data } = await api.get('/admin/team');
      setTeamAssignments(
        (data.team || []).filter((u) => u.role === 'employee'),
      );
    } catch (err) {
      console.error('Could not load team assignments', err);
    }
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>
      {/* Top header */}
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => setMenuOpen(true)}>
          <img src='/assets/icons/menu.svg' alt='menu' className='w-6 h-6' />
        </button>
        <span className='text-white font-semibold text-[16px]'>
          RecoSolution
        </span>
        <button onClick={() => navigate('/notifications')}>
          <img
            src='/assets/icons/bell.svg'
            alt='notifications'
            className='w-6 h-6'
          />
        </button>
      </div>

      {/* Main content */}
      <div className='flex-1 flex flex-col items-center justify-center px-6 pb-24'>
        {loading ? (
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
        ) : !hasContacts ? (
          <>
            <h1 className='text-[19px] font-bold text-forest mb-8 text-center'>
              No Contacts Yet
            </h1>
            <img
              src='/assets/illustrations/no-contacts.png'
              alt='No contacts'
              className='w-[210px] h-[210px] object-contain mb-10'
            />
            <p className='text-center text-[14px] font-medium text-gray-800 mb-2'>
              Scan your first
              <br />
              business card
            </p>
            <img
              src='/assets/icons/arrow-down.svg'
              alt=''
              className='w-5 h-5'
            />
          </>
        ) : (
          <div className='w-full text-left'>
            {/* My Tasks / Team View toggle — Founder only */}
            {user?.role === 'founder' && (
              <div className='flex gap-2 mb-5 pt-4'>
                <button
                  onClick={() => setHomeScope('mine')}
                  className={`h-10 px-5 rounded-full text-[14px] font-bold ${
                    homeScope === 'mine'
                      ? 'bg-forest text-white'
                      : 'bg-white text-gray-900 border-[1.5px] border-forest'
                  }`}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => setHomeScope('team')}
                  className={`h-10 px-5 rounded-full text-[14px] font-bold ${
                    homeScope === 'team'
                      ? 'bg-forest text-white'
                      : 'bg-white text-gray-900 border-[1.5px] border-forest'
                  }`}
                >
                  Team View
                </button>
              </div>
            )}

            {/* Task summary card */}
            <div className='border-2 border-forest/40 rounded-2xl p-4 mb-4'>
              <p className='text-center text-forest font-bold text-[15px] mb-3'>
                {user?.role === 'founder' && homeScope === 'team'
                  ? 'Team Summary'
                  : 'My Tasks Overview'}
              </p>
              <div className='flex items-center justify-around mb-3'>
                <div className='flex flex-col items-center gap-1'>
                  {/* icon reference — replace with your own asset */}
                  <img
                    src='/assets/icons/overdue.svg'
                    alt=''
                    className='w-6 h-6'
                  />
                  <span className='font-bold text-[18px] text-gray-900'>
                    {dashboard?.tasks?.overdue ?? 0}
                  </span>
                  <span className='text-[12px] text-gray-500'>Overdue</span>
                </div>
                <div className='flex flex-col items-center gap-1'>
                  <img
                    src='/assets/icons/due-today.svg'
                    alt=''
                    className='w-6 h-6'
                  />
                  <span className='font-bold text-[18px] text-gray-900'>
                    {dashboard?.tasks?.today ?? 0}
                  </span>
                  <span className='text-[12px] text-gray-500'>Due Today</span>
                </div>
                <div className='flex flex-col items-center gap-1'>
                  <img
                    src='/assets/icons/upcoming.svg'
                    alt=''
                    className='w-6 h-6'
                  />
                  <span className='font-bold text-[18px] text-gray-900'>
                    {dashboard?.tasks?.upcoming ?? 0}
                  </span>
                  <span className='text-[12px] text-gray-500'>Upcoming</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className='w-full h-9 rounded-full bg-sage/70 text-white text-[13px] font-semibold flex items-center justify-center gap-1'
              >
                View All Tasks
                <img
                  src='/assets/icons/chevron-right.svg'
                  alt=''
                  className='w-3.5 h-3.5'
                />
              </button>
            </div>

            {/* Unassigned Contacts — Founder + Team View only */}
            {user?.role === 'founder' && homeScope === 'team' && (
              <button
                onClick={() => navigate('/admin/unassigned-contacts')}
                className='w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm mb-4'
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
                    {dashboard?.unassignedContactsCount ?? 0} Contacts Awaiting
                    Assignment
                  </p>
                </div>
                <img
                  src='/assets/icons/chevron-right.svg'
                  alt=''
                  className='w-4 h-4'
                />
              </button>
            )}

            {/* Recently added contacts */}
            {dashboard?.recentContacts?.length > 0 && (
              <>
                <div className='flex items-center justify-between mb-3'>
                  <p className='text-[14px] font-bold text-gray-900'>
                    Recently Added Contacts
                  </p>
                  <button
                    onClick={() => navigate('/contacts/recent')}
                    className='text-[13px] text-gray-500 font-medium flex items-center gap-1'
                  >
                    View All
                    <img
                      src='/assets/icons/chevron-right.svg'
                      alt=''
                      className='w-3.5 h-3.5'
                    />
                  </button>
                </div>
                <div className='flex flex-col gap-2 mb-4'>
                  {dashboard.recentContacts.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => navigate(`/contacts/${c._id}`)}
                      className='bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm text-left'
                    >
                      <div className='w-11 h-11 rounded-full bg-sage/40 flex items-center justify-center font-bold text-gray-700 text-[13px] shrink-0'>
                        {c.name
                          ?.split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-[14px] font-semibold text-gray-900 truncate'>
                          {c.name}{' '}
                          <span className='font-normal text-gray-500'>
                            {c.company}
                          </span>
                        </p>
                        <span className='inline-block mt-1 px-2.5 py-0.5 rounded-full border border-forest/30 text-forest text-[11px] font-medium'>
                          Lead
                        </span>
                      </div>
                      <img
                        src='/assets/icons/chevron-right.svg'
                        alt=''
                        className='w-4 h-4 shrink-0'
                      />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Team Assignments — Founder + Team View only */}
            {user?.role === 'founder' &&
              homeScope === 'team' &&
              teamAssignments.length > 0 && (
                <button
                  onClick={() => navigate('/team-dashboard')}
                  className='w-full bg-white rounded-2xl p-4 mb-4 text-left'
                >
                  <p className='text-[14px] font-bold text-gray-900 mb-3'>
                    Team Assignments
                  </p>
                  <div className='flex flex-col gap-2.5'>
                    {teamAssignments.map((emp) => (
                      <div key={emp._id} className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-sage/60 flex items-center justify-center text-white font-bold text-[11px] shrink-0'>
                          {(emp.firstName?.[0] || '').toUpperCase()}
                          {(emp.lastName?.[0] || '').toUpperCase()}
                        </div>
                        <span className='flex-1 text-[13px] font-medium text-gray-800'>
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className='text-[13px] font-bold text-gray-900'>
                          {emp.contactCount ?? 0}{' '}
                          <span className='font-normal text-gray-500'>
                            Contacts
                          </span>
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
                className='w-full bg-forest rounded-2xl p-4 flex items-center gap-3 mb-4'
              >
                <div className='w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0'>
                  <img
                    src='/assets/icons/team-members.svg'
                    alt=''
                    className='w-5 h-5'
                  />
                </div>
                <div className='flex-1 text-left'>
                  <p className='text-[14px] font-semibold text-white'>
                    My Assigned Contacts
                  </p>
                  <p className='text-[13px] text-white/80'>
                    <span className='font-bold'>
                      {dashboard?.assignedContactsCount ?? 0}
                    </span>{' '}
                    Active Contacts
                  </p>
                </div>
                <img
                  src='/assets/icons/chevron-right.svg'
                  alt=''
                  className='w-4 h-4 brightness-0 invert'
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className='bg-forest relative px-2 pt-3 pb-2 shrink-0'>
        <div className='flex items-center justify-between px-2'>
          <button
            onClick={() => navigate('/home')}
            className='flex flex-col items-center gap-1 flex-1'
          >
            <img src='/assets/icons/tab-home.svg' alt='' className='w-6 h-6' />
            <span className='text-white text-[11px] font-medium'>Home</span>
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

          <button
            onClick={() => navigate('/tasks')}
            className='flex flex-col items-center gap-1 flex-1'
          >
            <img
              src='/assets/icons/tab-followup.svg'
              alt=''
              className='w-6 h-6'
            />
            <span className='text-white/80 text-[11px] font-medium'>Tasks</span>
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

      {/* Side menu drawer */}
      {menuOpen && (
        <div className='fixed inset-0 z-50'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setMenuOpen(false)}
          />

          <div className='absolute left-0 top-0 h-full w-[78%] max-w-[300px] bg-white shadow-xl flex flex-col overflow-y-auto'>
            {/* Centered profile header — new layout */}
            <div className='pt-8 pb-5 px-5 flex flex-col items-center text-center border-b border-gray-100'>
              <div className='w-20 h-20 rounded-full bg-sage/60 flex items-center justify-center overflow-hidden shrink-0 mb-3'>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt='Profile'
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <span className='text-white font-bold text-[24px]'>
                    {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                  </span>
                )}
              </div>
              <p className='font-bold text-gray-900 text-[16px]'>
                {user?.firstName} {user?.lastName}
              </p>
              <p className='text-[13px] text-gray-500'>
                {user?.jobTitle ||
                  (user?.role === 'founder' ? 'Founder' : 'Employee')}
              </p>
            </div>

            {/* Sidebar features — Home/Profile/Contacts/Tasks/Notifications removed */}
            {/* since they're already reachable from the bottom nav / Home page.  */}
            <div className='px-3 py-3 flex-1'>
              {user?.role === 'founder' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/team-dashboard');
                  }}
                  className='w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left'
                >
                  <img
                    src='/assets/icons/team-dashboard.svg'
                    alt=''
                    className='w-5 h-5 opacity-70'
                  />
                  <span className='text-[14px] font-medium text-gray-800'>
                    Team Dashboard
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/contacts/export');
                }}
                className='w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left'
              >
                {/* icon reference — replace with your own asset */}
                <img
                  src='/assets/icons/export.svg'
                  alt=''
                  className='w-5 h-5 opacity-70'
                />
                <span className='text-[14px] font-medium text-gray-800'>
                  Export Contacts
                </span>
              </button>

              {/* Placeholder items — not wired yet, per your instruction */}
              <button className='w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left opacity-40 cursor-default'>
                <img
                  src='/assets/icons/settings.svg'
                  alt=''
                  className='w-5 h-5'
                />
                <span className='text-[14px] font-medium text-gray-800'>
                  Settings
                </span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/help-support');
                }}
                className='w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left'
              >
                <img
                  src='/assets/icons/help.svg'
                  alt=''
                  className='w-5 h-5 opacity-70'
                />
                <span className='text-[14px] font-medium text-gray-800'>
                  Help & Support
                </span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/privacy-policy');
                }}
                className='w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left'
              >
                <img
                  src='/assets/icons/privacy.svg'
                  alt=''
                  className='w-5 h-5 opacity-70'
                />
                <span className='text-[14px] font-medium text-gray-800'>
                  Privacy Policy
                </span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); navigate('/about-app'); }}
                className='w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left'
              >
                <img src='/assets/icons/info.svg' alt='' className='w-5 h-5 opacity-70' />
                <span className='text-[14px] font-medium text-gray-800'>About App</span>
              </button>
            </div>

            {/* Logout — reuses existing logout() from AuthContext */}
            <div className='px-3 py-3 border-t border-gray-100'>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className='w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left'
              >
                <img
                  src='/assets/icons/logout.svg'
                  alt=''
                  className='w-5 h-5 opacity-70'
                />
                <span className='text-[14px] font-medium text-gray-800'>
                  Logout
                </span>
              </button>
            </div>
          </div>

          {/* Slide-in animation */}
          <style>{`
      @keyframes slide-in-left {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      .absolute.left-0.top-0.h-full {
        animation: slide-in-left 0.2s ease-out;
      }
    `}</style>
        </div>
      )}
    </div>
  );
}
