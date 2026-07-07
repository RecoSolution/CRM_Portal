import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDraft } from '../utils/scanDraftStore';

const TASKS = ['Call', 'Send Quotation', 'Schedule Meeting', 'Follow-up', 'Email'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const PRIORITY_DOT = {
  Low: 'bg-gray-400',
  Medium: 'bg-amber-500',
  High: 'bg-red-500',
};

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
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header — curved bottom edge, matches app shell; keeps modal-style close/save actions */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25 transition-colors"
          >
            <img src="/assets/icons/close.svg" alt="close" className="w-4 h-4 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Reminder</span>
          <button
            onClick={handleSet}
            className="h-9 px-4 rounded-full bg-white text-forest text-[13px] font-semibold active:scale-[0.97] transition-transform"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 pt-7 pb-10">

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
          Task
        </p>
        <div className="flex gap-2 flex-wrap mb-7">
          {TASKS.map((t) => (
            <button
              key={t}
              onClick={() => setTask(t)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
                task === t ? 'bg-forest text-white' : 'bg-white text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
          Due Date
        </p>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full h-12 rounded-2xl px-4 text-[14px] text-gray-800 bg-white border-none outline-none mb-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        />

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
          Time <span className="normal-case font-normal text-gray-400">(optional)</span>
        </p>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-12 px-4 rounded-2xl text-[14px] text-gray-800 bg-white border-none outline-none mb-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        />

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Priority
        </p>
        <div className="flex gap-3 mb-10">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl transition-colors ${
                priority === p ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]' : 'bg-transparent'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} />
              <span className={`text-[13.5px] font-medium ${priority === p ? 'text-gray-900' : 'text-gray-500'}`}>
                {p}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleSet}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white active:scale-[0.99] transition-transform"
        >
          Set
        </button>
      </div>
    </div>
  );
}