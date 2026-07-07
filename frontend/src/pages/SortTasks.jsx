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

function FilterSection({ label, options, value, onToggle }) {
  return (
    <div className="mb-6">
      <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const optValue = typeof opt === 'string' ? opt : opt.value
          const optLabel = typeof opt === 'string' ? opt : opt.label
          const active = value === optValue
          return (
            <button
              key={optValue}
              onClick={() => onToggle(optValue)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
                active ? 'bg-forest text-white' : 'bg-white text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
              }`}
            >
              {optLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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

  function clearAll() {
    setTaskType('')
    setDueType('')
    setPriority('')
    setRelationshipType('')
  }

  const activeCount = [taskType, dueType, priority, relationshipType].filter(Boolean).length

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      <div className="bg-sage px-5 pt-5 pb-4 flex items-center justify-between shrink-0">
        <button onClick={() => navigate('/tasks')} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-[17px]">Sort the Tasks</span>
        {activeCount > 0 ? (
          <button onClick={clearAll} className="text-white/85 text-[13px] font-medium w-9 text-right">
            Clear
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">

        <FilterSection label="Task Type" options={TASK_TYPES} value={taskType} onToggle={(v) => toggle(taskType, v, setTaskType)} />
        <FilterSection label="Due Type" options={DUE_TYPES} value={dueType} onToggle={(v) => toggle(dueType, v, setDueType)} />
        <FilterSection label="Priority" options={PRIORITIES} value={priority} onToggle={(v) => toggle(priority, v, setPriority)} />
        <FilterSection
          label="Relationship Type"
          options={RELATIONSHIP_TYPES}
          value={relationshipType}
          onToggle={(v) => toggle(relationshipType, v, setRelationshipType)}
        />

        <button
          onClick={apply}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white mt-2 active:scale-[0.99] transition-transform"
        >
          Apply Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>
    </div>
  )
}