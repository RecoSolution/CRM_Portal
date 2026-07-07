import { useNavigate } from 'react-router-dom';

const APP_VERSION = '2.1.3';

const INFO_ROWS = [
  { icon: '/assets/icons/about-version.svg', label: 'Version', value: APP_VERSION },
  { icon: '/assets/icons/about-company.svg', label: 'Company', value: 'RecoSolution' },
  { icon: '/assets/icons/about-support.svg', label: 'Support', value: 'hetu.recosolution@gmail.com' },
];

const LINKS = [
  { label: 'Privacy Policy', path: '/privacy-policy' },
  { label: 'Help & Support', path: '/help-support' },
];

function SectionLabel({ children }) {
  return (
    <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2'>
      {children}
    </p>
  );
}

export default function AboutApp() {
  const navigate = useNavigate();

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0 shadow-sm sticky top-0 z-10'>
        <button
          onClick={() => navigate(-1)}
          className='w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors'
        >
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>About App</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-10 pb-10'>

        {/* Logo + name */}
        <div className='flex flex-col items-center text-center mb-10'>
          <div className='w-20 h-20 rounded-[22px] bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] flex items-center justify-center mb-4 ring-1 ring-black/[0.03]'>
            <img src='/assets/icons/logo.svg' alt='RecoSolution' className='w-11 h-11 object-contain' />
          </div>
          <h1 className='text-[18px] font-bold text-gray-900 tracking-tight'>RecoSolution CRM</h1>
          <p className='text-[13px] text-gray-500 mt-1'>Internal team &amp; contact management</p>
        </div>

        {/* Info card */}
        <SectionLabel>App Information</SectionLabel>
        <div className='bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] mb-8 overflow-hidden ring-1 ring-black/[0.03]'>
          {INFO_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-sage/10' : ''}`}
            >
              <div className='w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center shrink-0'>
                <img src={row.icon} alt='' className='w-4 h-4 opacity-70' />
              </div>
              <span className='flex-1 text-[13px] text-gray-500'>{row.label}</span>
              <span className='text-[13px] font-semibold text-gray-900 truncate max-w-[180px] text-right'>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Links card */}
        <SectionLabel>More</SectionLabel>
        <div className='bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] mb-8 overflow-hidden ring-1 ring-black/[0.03]'>
          {LINKS.map((link, i) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center justify-between px-4 py-4 text-left active:bg-sage/5 transition-colors ${
                i > 0 ? 'border-t border-sage/10' : ''
              }`}
            >
              <span className='text-[13px] font-semibold text-gray-900'>{link.label}</span>
              <img src='/assets/icons/chevron-right.svg' alt='' className='w-4 h-4 opacity-40' />
            </button>
          ))}
        </div>

        {/* Description */}
        <p className='text-[12.5px] text-gray-500 leading-relaxed text-center mb-8 px-2'>
          Helping our team scan business cards, manage contacts, and track follow-up tasks —
          keeping Founders and Employees aligned on every lead from first contact to close.
        </p>

        <p className='text-[11px] text-gray-400 text-center'>
          © {new Date().getFullYear()} RecoSolution. All rights reserved.
        </p>
      </div>
    </div>
  );
}