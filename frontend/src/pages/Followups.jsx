import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const TABS = ['Today', 'Upcoming', 'Overdue', 'Completed']

export default function Followups() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Today')
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReminders()
  }, [activeTab])

  async function fetchReminders() {
    setLoading(true)
    try {
      const res = await api.get('/contacts/reminders/all', {
        params: { filter: activeTab.toLowerCase() },
      })
      setReminders(res.data.reminders || [])
    } catch (err) {
      console.error('Could not load reminders', err)
    } finally {
      setLoading(false)
    }
  }

  async function markDone(contactId, reminderId) {
    try {
      await api.put(`/contacts/${contactId}/reminders/${reminderId}`, { status: 'done' })
      fetchReminders()
    } catch (err) {
      console.error('Could not update reminder', err)
    }
  }

  function priorityColor(priority) {
    if (priority === 'high') return 'bg-red-500'
    if (priority === 'medium') return 'bg-amber-500'
    return 'bg-gray-400'
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="bg-sage px-5 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-[17px]">Follow-Ups</span>
        <div className="w-9 h-9" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-5 py-4 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap ${
              activeTab === tab ? 'bg-forest text-white' : 'bg-white/70 text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 px-5 pb-10 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <img src="/assets/icons/bell.svg" alt="" className="w-10 h-10 opacity-40 mb-3" />
            <p className="text-[14px] text-gray-500">No {activeTab.toLowerCase()} follow-ups</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-1">
            {reminders.map((r) => (
              <div key={r._id} className="bg-white/70 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${priorityColor(r.priority)}`} />
                    <button
                      onClick={() => navigate(`/contacts/${r.contactId}`)}
                      className="font-semibold text-[14px] text-gray-900"
                    >
                      {r.contactName}
                    </button>
                  </div>
                  <span className="text-[12px] text-gray-500">{formatDate(r.dueDate)}</span>
                </div>
                <p className="text-[13px] text-gray-600 mb-2.5 capitalize">{r.task?.replace(/_/g, ' ') || r.note}</p>
                {activeTab !== 'Completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => markDone(r.contactId, r._id)}
                      className="h-8 px-4 rounded-full bg-forest text-white text-[12px] font-semibold"
                    >
                      Mark Done
                    </button>
                    <button className="h-8 px-4 rounded-full border-[1.5px] border-forest text-forest text-[12px] font-semibold">
                      Snooze
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}