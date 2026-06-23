import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDraft } from '../utils/scanDraftStore';

const TASKS = [
  'Call',
  'Send Quotation',
  'Schedule Meeting',
  'Follow-up',
  'Email',
];

export default function SetReminder() {
  const navigate = useNavigate();

  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState(''); // native date input value: "YYYY-MM-DD"
  const [time, setTime] = useState(''); // native time input value: "HH:MM"
  const [priority, setPriority] = useState('');

  function handleSet() {
    setDraft({
      reminder: {
        task: task.toLowerCase().replace(/\s+/g, '_'),
        dueDate,
        time,
        priority: priority.toLowerCase(),
      },
    });
    navigate('/scanned-card');
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg'>
      {/* Header */}
      <div className='bg-sage flex items-center justify-between px-4 h-14'>
        <button
          onClick={() => navigate(-1)}
          className='w-8 h-8 rounded-full bg-white/30 flex items-center justify-center'
        >
          <img src='/assets/icons/close.svg' alt='close' className='w-4 h-4' />
        </button>
        <span className='text-white font-bold text-[16px]'>Reminder</span>
        <button
          onClick={handleSet}
          className='h-9 px-4 rounded-full bg-forest text-white text-[13px] font-semibold'
        >
          Save
        </button>
      </div>

      <div className='px-5 pt-6'>
        {/* Task */}
        <p className='text-[14px] font-bold text-gray-900 mb-2.5'>Task</p>
        <div className='flex gap-2 flex-wrap mb-6'>
          {TASKS.map((t) => (
            <button
              key={t}
              onClick={() => setTask(t)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                task === t ? 'bg-sage text-white' : 'bg-white/70 text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Due Date - native date input, browser provides the calendar UI */}
        <p className='text-[14px] font-bold text-gray-900 mb-2.5'>Due Date</p>
        <input
          type='date'
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className='w-full h-11 rounded-full px-4 text-[14px] text-gray-700 bg-white/70 border-none outline-none mb-6'
        />

        {/* Time - native time input, browser provides the time picker UI */}
        <p className='text-[14px] font-bold text-gray-900 mb-1'>
          Time{' '}
          <span className='text-gray-400 font-normal text-[12px]'>
            (Optional)
          </span>
        </p>
        <input
          type='time'
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className='h-11 px-4 rounded-full text-[14px] text-gray-700 bg-white/70 border-none outline-none mb-6'
        />

        {/* Priority */}
        <p className='text-[14px] font-bold text-gray-900 mb-3'>Priority</p>
        <div className='flex gap-6 mb-10'>
          {['Low', 'Medium', 'High'].map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className='flex items-center gap-2'
            >
              <span
                className={`w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center ${priority === p ? 'border-forest' : ''}`}
              >
                {priority === p && (
                  <span className='w-2 h-2 rounded-full bg-forest' />
                )}
              </span>
              <span className='text-[14px] text-gray-800'>{p}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleSet}
          className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white'
        >
          Set
        </button>
      </div>
    </div>
  );
}
