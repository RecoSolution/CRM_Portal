import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Could not load analytics', err);
    } finally {
      setLoading(false);
    }
  }

  function StatCard({ label, value, colorClass = 'text-gray-900' }) {
    return (
      <div className='bg-white rounded-2xl p-4 flex-1 min-w-[100px]'>
        <p className={`text-[20px] font-extrabold ${colorClass}`}>{value}</p>
        <p className='text-[11px] text-gray-500 mt-0.5'>{label}</p>
      </div>
    );
  }

  function SectionTitle({ children }) {
    return <p className='text-[14px] font-bold text-gray-900 mb-3 mt-6'>{children}</p>;
  }

  if (loading || !data) {
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

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate('/home')} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>Analytics</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-5 pb-10 overflow-y-auto'>

        {/* Quick Insights */}
        <div className='flex flex-col gap-2 mb-2'>
          {data.insights.map((insight, i) => (
            <div key={i} className='bg-forest/10 rounded-2xl px-4 py-3 flex items-center gap-2.5'>
              <img src='/assets/icons/insight-bulb.svg' alt='' className='w-4 h-4 shrink-0' />
              <p className='text-[12px] text-gray-800 leading-snug'>{insight}</p>
            </div>
          ))}
        </div>

        {/* Contact Analytics */}
        <SectionTitle>Contact Analytics</SectionTitle>
        <div className='grid grid-cols-2 gap-3'>
          <StatCard label='Total Contacts' value={data.contactStats.total} />
          <StatCard label='Added Today' value={data.contactStats.today} />
          <StatCard label='This Week' value={data.contactStats.week} />
          <StatCard label='This Month' value={data.contactStats.month} />
          <StatCard label='This Year' value={data.contactStats.year} />
        </div>

        {/* Lead Quality */}
        <SectionTitle>Lead Quality</SectionTitle>
        <div className='flex gap-3'>
          <StatCard label='Hot Leads' value={data.leadQuality.hot} colorClass='text-red-600' />
          <StatCard label='Warm Leads' value={data.leadQuality.warm} colorClass='text-amber-600' />
          <StatCard label='Cold Leads' value={data.leadQuality.cold} colorClass='text-sage' />
        </div>

        {/* Task Analytics */}
        <SectionTitle>Task Analytics</SectionTitle>
        <div className='grid grid-cols-3 gap-3'>
          <StatCard label='Total' value={data.taskStats.total} />
          <StatCard label='Pending' value={data.taskStats.pending} colorClass='text-amber-600' />
          <StatCard label='Completed' value={data.taskStats.completed} colorClass='text-forest' />
          <StatCard label='Overdue' value={data.taskStats.overdue} colorClass='text-red-600' />
          <StatCard label='Due Today' value={data.taskStats.dueToday} />
          <StatCard label='Upcoming' value={data.taskStats.upcoming} colorClass='text-sage' />
        </div>

        {/* Business Performance */}
        <SectionTitle>Business Performance</SectionTitle>
        <div className='grid grid-cols-2 gap-3'>
          <StatCard label='Conversion Rate' value={`${data.businessPerformance.conversionRate}%`} colorClass='text-forest' />
          <StatCard label='Active Leads' value={data.businessPerformance.activeLeads} />
          <StatCard label='Won Leads' value={data.businessPerformance.wonLeads} colorClass='text-forest' />
          <StatCard label='Lost Leads' value={data.businessPerformance.lostLeads} colorClass='text-red-600' />
        </div>

        {/* Contact Sources */}
        <SectionTitle>Contact Sources</SectionTitle>
        <div className='bg-white rounded-2xl p-4 flex flex-col gap-3'>
          {[
            { label: 'Business Card Scan', value: data.contactSources.scan },
            { label: 'Manual Entry', value: data.contactSources.manual },
            { label: 'Imported Contacts', value: data.contactSources.import },
          ].map((s) => (
            <div key={s.label} className='flex items-center justify-between'>
              <span className='text-[13px] text-gray-700'>{s.label}</span>
              <span className='text-[13px] font-bold text-gray-900'>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Monthly Growth */}
        <SectionTitle>Monthly Growth</SectionTitle>
        <div className='bg-white rounded-2xl p-4' style={{ height: 180 }}>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data.monthlyGrowth}>
              <XAxis dataKey='label' tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type='monotone' dataKey='count' stroke='#406550' strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Performance — Founder only */}
        {data.employeePerformance && (
          <>
            <SectionTitle>Employee Performance</SectionTitle>
            <div className='flex flex-col gap-2'>
              {data.employeePerformance.map((emp, i) => (
                <div key={emp.id} className='bg-white rounded-2xl p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-[14px] font-bold text-gray-900'>
                      {i === 0 && '🏆 '}{emp.name}
                    </p>
                  </div>
                  <div className='grid grid-cols-3 gap-2 text-center'>
                    <div>
                      <p className='text-[15px] font-bold text-gray-900'>{emp.contactsAdded}</p>
                      <p className='text-[10px] text-gray-500'>Contacts</p>
                    </div>
                    <div>
                      <p className='text-[15px] font-bold text-forest'>{emp.tasksCompleted}</p>
                      <p className='text-[10px] text-gray-500'>Completed</p>
                    </div>
                    <div>
                      <p className='text-[15px] font-bold text-red-600'>{emp.overdueTasks}</p>
                      <p className='text-[10px] text-gray-500'>Overdue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Personal Performance — Employee only */}
        {data.personalPerformance && (
          <>
            <SectionTitle>My Performance</SectionTitle>
            <div className='grid grid-cols-2 gap-3 mb-4'>
              <StatCard label='My Contacts' value={data.personalPerformance.myContacts} />
              <StatCard label='Completed Tasks' value={data.personalPerformance.myCompletedTasks} colorClass='text-forest' />
              <StatCard label='Pending Tasks' value={data.personalPerformance.myPendingTasks} colorClass='text-amber-600' />
              <StatCard label='Overdue Tasks' value={data.personalPerformance.myOverdueTasks} colorClass='text-red-600' />
            </div>
            <p className='text-[13px] font-semibold text-gray-600 mb-2'>My Weekly Activity</p>
            <div className='bg-white rounded-2xl p-4' style={{ height: 150 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={data.personalPerformance.weeklyActivity}>
                  <XAxis dataKey='label' tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type='monotone' dataKey='count' stroke='#799A85' strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Recent Activity */}
        <SectionTitle>Recent Activity</SectionTitle>
        <div className='bg-white rounded-2xl divide-y divide-gray-100'>
          {data.recentActivity.length === 0 ? (
            <p className='text-[13px] text-gray-400 text-center py-6'>No recent activity yet</p>
          ) : (
            data.recentActivity.map((a, i) => (
              <div key={i} className='px-4 py-3'>
                <p className='text-[13px] text-gray-800'>{a.detail}</p>
                <p className='text-[11px] text-gray-400 mt-0.5'>
                  {new Date(a.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}