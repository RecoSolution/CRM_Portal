import { useNavigate } from 'react-router-dom';

const APP_VERSION = '2.1.3';

export default function AboutApp() {
  const navigate = useNavigate();

  const infoRows = [
    { icon: '/assets/icons/about-version.svg', label: 'Version', value: APP_VERSION },
    { icon: '/assets/icons/about-company.svg', label: 'Company', value: 'RecoSolution' },
    { icon: '/assets/icons/about-support.svg', label: 'Support', value: 'hetu.recosolution@gmail.com' },
  ];

  const links = [
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Help & Support', path: '/help-support' },
  ];

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate(-1)} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>About App</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-6 pt-10 pb-10'>

        {/* Logo + name */}
        <div className='flex flex-col items-center text-center mb-8'>
          <div className='w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-4 shadow-md'>
            <img src='/assets/icons/logo.svg' alt='RecoSolution' className='w-18 h-18 object-contain' />
          </div>
          <h1 className='text-[19px] font-bold text-gray-900 mb-1'>RecoSolution CRM</h1>
          <p className='text-[13px] text-gray-500'>Internal team &amp; contact management</p>
        </div>

        {/* Info rows */}
        <div className='bg-white rounded-2xl mb-6 divide-y divide-gray-100'>
          {infoRows.map((row) => (
            <div key={row.label} className='flex items-center gap-3 px-4 py-3.5'>
              <img src={row.icon} alt='' className='w-5 h-5 shrink-0 opacity-70' />
              <span className='flex-1 text-[13px] text-gray-500'>{row.label}</span>
              <span className='text-[13px] font-semibold text-gray-900'>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className='bg-white rounded-2xl mb-8 divide-y divide-gray-100'>
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className='w-full flex items-center justify-between px-4 py-3.5 text-left'
            >
              <span className='text-[14px] font-medium text-gray-900'>{link.label}</span>
              <img src='/assets/icons/chevron-right.svg' alt='' className='w-4 h-4 opacity-60' />
            </button>
          ))}
        </div>

        {/* Description */}
        <p className='text-[12px] text-gray-500 leading-relaxed text-center mb-8'>
          RecoSolution CRM helps our team scan business cards, manage contacts, and track follow-up tasks —
          keeping Founders and Employees aligned on every lead from first contact to close.
        </p>

        <p className='text-[11px] text-gray-400 text-center'>
          © {new Date().getFullYear()} RecoSolution. All rights reserved.
        </p>
      </div>
    </div>
  );
}