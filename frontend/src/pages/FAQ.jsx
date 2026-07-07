import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQS = [
  {
    q: 'How do I create a new task?',
    a: "Founders can create a task from the Tasks page by tapping the + button, or directly from a contact's profile by adding a reminder. Tasks can be assigned to any employee and linked to a contact.",
  },
  {
    q: "Why can't I see all contacts as an Employee?",
    a: "Employees only see contacts that are assigned to them, or contacts they personally added that haven't been assigned yet. Founders can see and assign all contacts from the Team Dashboard.",
  },
  {
    q: 'How do I mark a task as completed?',
    a: 'Open the task from the Tasks page, then tap "Mark as Completed" under Actions on the Task Details screen.',
  },
  {
    q: 'How do I export my contacts?',
    a: 'Open the side menu and tap "Export Contacts". Choose what to export, pick CSV or Excel format, and tap Export - the file will download to your device.',
  },
  {
    q: 'What happens when a task is rescheduled?',
    a: "The task's due date and time are updated, its status moves to Upcoming, and the change (including your reason, if given) is recorded in the task's Activity History.",
  },
  {
    q: 'Can Employees reassign contacts or tasks?',
    a: 'No - only Founders can assign or reassign contacts and tasks. Employees can update the status, reschedule, and add notes to tasks assigned to them.',
  },
];

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-shadow ${CARD_SHADOW}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left active:bg-sage/5 transition-colors">
        <span className={`text-[13.5px] font-semibold ${isOpen ? 'text-forest' : 'text-gray-900'}`}>
          {item.q}
        </span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-forest/10' : ''}`}>
          <img
            src="/assets/icons/chevron-down.svg"
            alt=""
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 opacity-70' : 'opacity-50'}`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0.5">
          <p className="text-[13px] text-gray-600 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(i) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-forest flex items-center justify-between px-5 h-16 shrink-0 rounded-b-[28px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] sticky top-0 z-10">
        <button onClick={() => navigate('/help-support')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
        </button>
        <span className="text-white font-semibold text-[16px]">FAQ</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 pt-6 pb-10">
        <p className="text-[12.5px] text-gray-500 leading-relaxed mb-6 px-1">
          Answers to common questions about tasks, contacts, and permissions.
        </p>

        <div className="flex flex-col gap-2.5">
          {FAQS.map((item, i) => (
            <FAQItem key={i} item={item} isOpen={openIndex === i} onToggle={() => toggle(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}