import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const TASK_TYPES = ['Follow-Up Call', 'Send Quotation', 'Meeting', 'Email', 'Reminder', 'Other']
const DUE_TYPES = [
  { label: 'Over Due', value: 'overdue' },
  { label: 'Due Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
]
const PRIORITIES = ['High', 'Medium', 'Low']
const RELATIONSHIP_TYPES = ['Lead', 'Customer', 'Vendor', 'Partner', 'Team', 'Investor', 'General']

export default function SortTasks() {
  const navigate = useNavigate()
  const location = useLocation()
  const existing = location.state?.filters || {}

  const [taskType, setTaskType] = useState(existing.taskType || '')
  const [dueType, setDueType] = useState(existing.dueType || '')
  const [priority, setPriority] = useState(existing.priority || '')
  const [relationshipType, setRelationshipType] = useState(existing.relationshipType || '')

  function toggle(current, value, setter) {
    setter(current === value ? '' : value)
  }

  function apply() {
    navigate('/tasks', { state: { filters: { taskType, dueType, priority, relationshipType } } })
  }

  const pillClass = (active) =>
    `h-9 px-4 rounded-full text-[13px] font-medium border ${
      active ? 'bg-forest text-white border-forest' : 'bg-white text-gray-600 border-gray-200'
    }`

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="bg-sage px-5 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/tasks')} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-[17px]">Sort the Tasks</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto">

        <p className="text-[14px] font-bold text-gray-900 mb-2.5">Task Type</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {TASK_TYPES.map((t) => (
            <button key={t} onClick={() => toggle(taskType, t, setTaskType)} className={pillClass(taskType === t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-200 mb-5" />

        <p className="text-[14px] font-bold text-gray-900 mb-2.5">Due Type</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {DUE_TYPES.map((d) => (
            <button key={d.value} onClick={() => toggle(dueType, d.value, setDueType)} className={pillClass(dueType === d.value)}>
              {d.label}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-200 mb-5" />

        <p className="text-[14px] font-bold text-gray-900 mb-2.5">Priority</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => toggle(priority, p, setPriority)} className={pillClass(priority === p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-200 mb-5" />

        <p className="text-[14px] font-bold text-gray-900 mb-2.5">Relationship Type</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {RELATIONSHIP_TYPES.map((r) => (
            <button key={r} onClick={() => toggle(relationshipType, r, setRelationshipType)} className={pillClass(relationshipType === r)}>
              {r}
            </button>
          ))}
        </div>

        <button
          onClick={apply}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}