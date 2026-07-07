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

      {/* Header — curved bottom edge, matches app shell */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate('/tasks')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Sort the Tasks</span>
          {activeCount > 0 ? (
            <button onClick={clearAll} className="text-white/85 text-[13px] font-medium w-9 text-right">
              Clear
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>
        <p className="text-center text-white/70 text-[12.5px] mt-1">
          {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} applied` : 'Refine your task list'}
        </p>
      </div>

      <div className="flex-1 px-5 -mt-3 pt-4 pb-10 overflow-y-auto">

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