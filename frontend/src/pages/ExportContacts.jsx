import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const SCOPE_OPTIONS = [
  { label: 'All Contacts', value: 'all' },
  { label: 'My Assigned Contacts', value: 'mine' },
  { label: 'Lead', value: 'lead' },
  { label: 'Customer', value: 'customer' },
  { label: 'Vendors', value: 'vendor' },
  { label: 'General', value: 'general' },
];

const FORMAT_OPTIONS = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel (.xlsx)', value: 'xlsx' },
];

const DATE_RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5">
      {children}
    </p>
  );
}

function RadioRow({ label, active, onClick, last }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-sage/5 transition-colors ${!last ? 'border-b border-sage/10' : ''}`}
    >
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'border-forest' : 'border-gray-300'}`}>
        {active && <span className="w-2.5 h-2.5 rounded-full bg-forest" />}
      </span>
      <span className={`text-[14px] ${active ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
        {label}
      </span>
    </button>
  );
}

export default function ExportContacts() {
  const navigate = useNavigate();
  useAuth();

  const [scope, setScope] = useState('all');
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setError('');
    setExporting(true);
    try {
      const params = { format };
      if (scope === 'all' || scope === 'mine') {
        params.scope = scope;
      } else {
        params.type = scope; // lead / customer / vendor / general
      }
      if (dateRange !== 'all') {
        const from = new Date();
        from.setDate(from.getDate() - DATE_RANGE_DAYS[dateRange]);
        params.dateFrom = from.toISOString();
      }
      const res = await api.get('/contacts/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contacts-export.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Could not export contacts. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-forest flex items-center justify-between px-5 h-16 shrink-0 rounded-b-[28px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
        </button>
        <span className="text-white font-semibold text-[16px]">Export Contacts</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-8">

        {error && (
          <div className="bg-red-50 ring-1 ring-red-100 text-red-600 text-[13px] rounded-2xl px-4 py-3 -mb-3">
            {error}
          </div>
        )}

        <div>
          <SectionLabel>Choose What to Export</SectionLabel>
          <div className={`bg-white rounded-2xl overflow-hidden ${CARD_SHADOW}`}>
            {SCOPE_OPTIONS.map((opt, i) => (
              <RadioRow
                key={opt.value}
                label={opt.label}
                active={scope === opt.value}
                onClick={() => setScope(opt.value)}
                last={i === SCOPE_OPTIONS.length - 1}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>File Format</SectionLabel>
          <div className={`bg-white rounded-2xl overflow-hidden ${CARD_SHADOW}`}>
            {FORMAT_OPTIONS.map((opt, i) => (
              <RadioRow
                key={opt.value}
                label={opt.label}
                active={format === opt.value}
                onClick={() => setFormat(opt.value)}
                last={i === FORMAT_OPTIONS.length - 1}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <SectionLabel>Date Range</SectionLabel>
            <span className="text-[11px] text-gray-400 mb-2.5">Optional</span>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`w-full h-12 rounded-2xl px-4 text-[14px] text-gray-800 bg-white border border-sage/20 outline-none focus:border-forest/40 transition-colors ${CARD_SHADOW}`}
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full h-12 rounded-full font-semibold text-[14.5px] bg-forest text-white disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_4px_14px_-4px_rgba(64,101,80,0.5)]"
        >
          <img src="/assets/icons/export.svg" alt="" className="w-4 h-4 brightness-0 invert" />
          {exporting ? 'Exporting...' : 'Export'}
        </button>
      </div>
    </div>
  );
}