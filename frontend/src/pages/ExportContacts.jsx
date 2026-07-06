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
        const days = { '7d': 7, '30d': 30, '90d': 90 }[dateRange];
        const from = new Date();
        from.setDate(from.getDate() - days);
        params.dateFrom = from.toISOString();
      }
      const res = await api.get('/contacts/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `contacts-export.${format === 'xlsx' ? 'xlsx' : 'csv'}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Could not export contacts. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const radioClass = (active) =>
    `w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
      active ? 'border-forest' : 'border-gray-300'
    }`;

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button
          onClick={() => navigate('/home')}
          className='w-9 h-9 flex items-center justify-center -ml-1'
        >
          <img
            src='/assets/icons/arrow-left.svg'
            alt='back'
            className='w-5 h-5'
          />
        </button>
        <span className='text-white font-semibold text-[16px]'>
          Export Contacts
        </span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-6 pb-10'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4'>
            {error}
          </div>
        )}

        <p className='text-[14px] font-bold text-gray-900 mb-3'>
          Choose what to export
        </p>
        <div className='flex flex-col gap-3 mb-5'>
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScope(opt.value)}
              className='flex items-center gap-3 text-left'
            >
              <span className={radioClass(scope === opt.value)}>
                {scope === opt.value && (
                  <span className='w-2.5 h-2.5 rounded-full bg-forest' />
                )}
              </span>
              <span className='text-[14px] text-gray-800'>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className='border-t border-gray-200 mb-5' />

        <p className='text-[14px] font-bold text-gray-900 mb-3'>File Format</p>
        <div className='flex flex-col gap-3 mb-5'>
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFormat(opt.value)}
              className='flex items-center gap-3 text-left'
            >
              <span className={radioClass(format === opt.value)}>
                {format === opt.value && (
                  <span className='w-2.5 h-2.5 rounded-full bg-forest' />
                )}
              </span>
              <span className='text-[14px] text-gray-800'>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className='border-t border-gray-200 mb-5' />

        <p className='text-[14px] font-bold text-gray-900 mb-2'>
          Date Range{' '}
          <span className='font-normal text-gray-400'>(Optional)</span>
        </p>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className='w-full h-11 rounded-full px-4 text-[14px] text-gray-700 bg-white border-none outline-none mb-8'
        >
          <option value='all'>All Time</option>
          <option value='7d'>Last 7 Days</option>
          <option value='30d'>Last 30 Days</option>
          <option value='90d'>Last 90 Days</option>
        </select>

        <button
          onClick={handleExport}
          disabled={exporting}
          className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60 flex items-center justify-center gap-2'
        >
          <img
            src='/assets/icons/export.svg'
            alt=''
            className='w-4 h-4 brightness-0 invert'
          />
          {exporting ? 'Exporting...' : 'Export'}
        </button>
      </div>
    </div>
  );
}
