import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQS = [
  {
    q: 'How do I create a new task?',
    a: 'Founders can create a task from the Tasks page by tapping the + button, or directly from a contact\'s profile by adding a reminder. Tasks can be assigned to any employee and linked to a contact.',
  },
  {
    q: 'Why can\'t I see all contacts as an Employee?',
    a: 'Employees only see contacts that are assigned to them, or contacts they personally added that haven\'t been assigned yet. Founders can see and assign all contacts from the Team Dashboard.',
  },
  {
    q: 'How do I mark a task as completed?',
    a: 'Open the task from the Tasks page, then tap "Mark as Completed" under Actions on the Task Details screen.',
  },
  {
    q: 'How do I export my contacts?',
    a: 'Open the side menu and tap "Export Contacts". Choose what to export, pick CSV or Excel format, and tap Export — the file will download to your device.',
  },
  {
    q: 'What happens when a task is rescheduled?',
    a: 'The task\'s due date and time are updated, its status moves to Upcoming, and the change (including your reason, if given) is recorded in the task\'s Activity History.',
  },
  {
    q: 'Can Employees reassign contacts or tasks?',
    a: 'No — only Founders can assign or reassign contacts and tasks. Employees can update the status, reschedule, and add notes to tasks assigned to them.',
  },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(i) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate('/help-support')} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>Frequently Asked Questions</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-5 pb-10'>
        <div className='flex flex-col gap-3'>
          {FAQS.map((item, i) => (
            <div key={i} className='bg-white rounded-2xl overflow-hidden'>
              <button
                onClick={() => toggle(i)}
                className='w-full flex items-center justify-between gap-3 px-4 py-4 text-left'
              >
                <span className='text-[14px] font-bold text-gray-900'>{item.q}</span>
                <img
                  src='/assets/icons/chevron-down.svg'
                  alt=''
                  className={`w-4 h-4 shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <div className='px-4 pb-4 border-t border-gray-100 pt-3'>
                  <p className='text-[13px] text-gray-600 leading-relaxed'>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}