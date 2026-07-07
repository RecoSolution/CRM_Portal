import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SUPPORT_EMAIL = 'hetu.recosolution@gmail.com';
const ISSUE_TYPES = ['Bug / Something is broken', 'Task issue', 'Contact issue', 'Login / Account', 'Other'];

export default function ReportIssue() {
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState('');

  function handleSubmit() {
    const subject = encodeURIComponent(`Issue Report: ${issueType}`);
    const body = encodeURIComponent(description || '(No description provided)');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0">
        <button onClick={() => navigate('/help-support')} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">Report an Issue</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 pt-7 pb-10">
        <div className="bg-white rounded-2xl px-4 py-3.5 mb-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] text-gray-500 leading-relaxed">
            Let us know what went wrong. This will open your email app with the details pre-filled, sent to{' '}
            <span className="text-gray-700 font-medium">{SUPPORT_EMAIL}</span>.
          </p>
        </div>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Issue Type
        </p>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          className="w-full h-12 rounded-2xl px-4 mb-6 text-[14px] text-gray-900 bg-white border-none outline-none shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          {ISSUE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Description
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Describe what happened, what you expected, and steps to reproduce if possible..."
          className="w-full rounded-2xl px-4 py-3.5 mb-9 text-[14px] text-gray-800 bg-white border-none outline-none resize-none shadow-[0_1px_3px_rgba(0,0,0,0.06)] placeholder:text-gray-400"
        />

        <button
          onClick={handleSubmit}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white active:scale-[0.99] transition-transform"
        >
          Submit Report
        </button>
      </div>
    </div>
  );
}