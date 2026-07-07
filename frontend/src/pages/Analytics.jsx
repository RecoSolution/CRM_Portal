import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2 mt-8 first:mt-0">
      {children}
    </p>
  );
}

function StatCard({ label, value, colorClass = 'text-gray-900' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 flex-1 min-w-[100px] ${CARD_SHADOW}`}>
      <p className={`text-[21px] font-extrabold leading-none ${colorClass}`}>{value}</p>
      <p className="text-[11.5px] text-gray-500 mt-1.5">{label}</p>
    </div>
  );
}

function ChartCard({ data, dataKey, stroke, height = 180 }) {
  return (
    <div className={`bg-white rounded-2xl p-4 pt-5 ${CARD_SHADOW}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 0, right: 8, left: -12, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)',
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Header({ onBack }) {
  return (
    <div className="bg-gradient-to-br from-sage to-forest flex items-center justify-between px-5 h-16 shrink-0 rounded-b-[28px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] sticky top-0 z-10">
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
        <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
      </button>
      <span className="text-white font-semibold text-[16px]">Analytics</span>
      <div className="w-9 h-9" />
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex-1 px-5 pt-6 pb-12">
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[76px] rounded-2xl bg-white/70 animate-pulse" />
        ))}
      </div>
      <div className="h-[180px] rounded-2xl bg-white/70 animate-pulse mb-8" />
      <div className="flex flex-col gap-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[90px] rounded-2xl bg-white/70 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const res = await api.get('/analytics');
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error('Could not load analytics', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalytics();
    return () => { cancelled = true; };
  }, []);

  const contactStats = data && [
    { label: 'Total Contacts', value: data.contactStats.total },
    { label: 'Added Today', value: data.contactStats.today },
    { label: 'This Week', value: data.contactStats.week },
    { label: 'This Month', value: data.contactStats.month },
    { label: 'This Year', value: data.contactStats.year },
  ];

  const leadQuality = data && [
    { label: 'Hot Leads', value: data.leadQuality.hot, colorClass: 'text-red-600' },
    { label: 'Warm Leads', value: data.leadQuality.warm, colorClass: 'text-amber-600' },
    { label: 'Cold Leads', value: data.leadQuality.cold, colorClass: 'text-sage' },
  ];

  const taskStats = data && [
    { label: 'Total', value: data.taskStats.total },
    { label: 'Pending', value: data.taskStats.pending, colorClass: 'text-amber-600' },
    { label: 'Completed', value: data.taskStats.completed, colorClass: 'text-forest' },
    { label: 'Overdue', value: data.taskStats.overdue, colorClass: 'text-red-600' },
    { label: 'Due Today', value: data.taskStats.dueToday },
    { label: 'Upcoming', value: data.taskStats.upcoming, colorClass: 'text-sage' },
  ];

  const businessPerformance = data && [
    { label: 'Conversion Rate', value: `${data.businessPerformance.conversionRate}%`, colorClass: 'text-forest' },
    { label: 'Active Leads', value: data.businessPerformance.activeLeads },
    { label: 'Won Leads', value: data.businessPerformance.wonLeads, colorClass: 'text-forest' },
    { label: 'Lost Leads', value: data.businessPerformance.lostLeads, colorClass: 'text-red-600' },
  ];

  const contactSources = data && [
    { label: 'Business Card Scan', value: data.contactSources.scan },
    { label: 'Manual Entry', value: data.contactSources.manual },
    { label: 'Imported Contacts', value: data.contactSources.import },
  ];

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
      <Header onBack={() => navigate('/home')} />

      {loading || !data ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="flex-1 px-5 pt-6 pb-12 overflow-y-auto">

          {/* Quick Insights */}
          {data.insights.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {data.insights.map((insight, i) => (
                <div key={i} className="bg-forest/10 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center shrink-0">
                    <img src="/assets/icons/insight-bulb.svg" alt="" className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[12.5px] text-gray-800 leading-snug">{insight}</p>
                </div>
              ))}
            </div>
          )}

          {/* Contact Analytics */}
          <SectionLabel>Contact Analytics</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {contactStats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Lead Quality */}
          <SectionLabel>Lead Quality</SectionLabel>
          <div className="flex gap-3">
            {leadQuality.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Task Analytics */}
          <SectionLabel>Task Analytics</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {taskStats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Business Performance */}
          <SectionLabel>Business Performance</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {businessPerformance.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Contact Sources */}
          <SectionLabel>Contact Sources</SectionLabel>
          <div className={`bg-white rounded-2xl p-4 flex flex-col gap-3.5 ${CARD_SHADOW}`}>
            {contactSources.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-[13px] text-gray-600">{s.label}</span>
                <span className="text-[13px] font-bold text-gray-900">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Monthly Growth */}
          <SectionLabel>Monthly Growth</SectionLabel>
          <ChartCard data={data.monthlyGrowth} dataKey="count" stroke="#406550" height={180} />

          {/* Employee Performance — Founder only */}
          {data.employeePerformance && (
            <>
              <SectionLabel>Employee Performance</SectionLabel>
              <div className="flex flex-col gap-2.5">
                {data.employeePerformance.map((emp, i) => (
                  <div key={emp.id} className={`bg-white rounded-2xl p-4 ${CARD_SHADOW}`}>
                    <p className="text-[13.5px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                      {i === 0 && <span>🏆</span>}
                      {emp.name}
                    </p>
                    <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
                      <div>
                        <p className="text-[16px] font-bold text-gray-900 leading-none">{emp.contactsAdded}</p>
                        <p className="text-[10.5px] text-gray-500 mt-1.5">Contacts</p>
                      </div>
                      <div>
                        <p className="text-[16px] font-bold text-forest leading-none">{emp.tasksCompleted}</p>
                        <p className="text-[10.5px] text-gray-500 mt-1.5">Completed</p>
                      </div>
                      <div>
                        <p className="text-[16px] font-bold text-red-600 leading-none">{emp.overdueTasks}</p>
                        <p className="text-[10.5px] text-gray-500 mt-1.5">Overdue</p>
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
              <SectionLabel>My Performance</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mb-8">
                <StatCard label="My Contacts" value={data.personalPerformance.myContacts} />
                <StatCard label="Completed Tasks" value={data.personalPerformance.myCompletedTasks} colorClass="text-forest" />
                <StatCard label="Pending Tasks" value={data.personalPerformance.myPendingTasks} colorClass="text-amber-600" />
                <StatCard label="Overdue Tasks" value={data.personalPerformance.myOverdueTasks} colorClass="text-red-600" />
              </div>
              <SectionLabel>My Weekly Activity</SectionLabel>
              <ChartCard data={data.personalPerformance.weeklyActivity} dataKey="count" stroke="#799A85" height={150} />
            </>
          )}

          {/* Recent Activity */}
          <SectionLabel>Recent Activity</SectionLabel>
          <div className={`bg-white rounded-2xl overflow-hidden ${CARD_SHADOW}`}>
            {data.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-4">
                <div className="w-11 h-11 rounded-full bg-sage/10 flex items-center justify-center mb-3">
                  <img src="/assets/icons/insight-bulb.svg" alt="" className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-[12.5px] text-gray-400">No recent activity yet</p>
              </div>
            ) : (
              data.recentActivity.map((a, i) => (
                <div key={i} className={`px-4 py-3.5 ${i > 0 ? 'border-t border-sage/10' : ''}`}>
                  <p className="text-[13px] text-gray-800 leading-snug">{a.detail}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(a.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}