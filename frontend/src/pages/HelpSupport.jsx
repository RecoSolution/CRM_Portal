import { useNavigate } from 'react-router-dom';

export default function HelpSupport() {
  const navigate = useNavigate();

  const items = [
    { icon: '/assets/icons/help-faq.svg', label: 'Frequently Asked Questions', path: '/help-support/faq' },
    { icon: '/assets/icons/help-contact.svg', label: 'Contact Support', path: '/help-support/contact' },
    { icon: '/assets/icons/help-report.svg', label: 'Report an Issue', path: '/help-support/report' },
  ];

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate('/home')} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>Help &amp; Support</span>
        <div className='w-9 h-9' />
      </div>

      <div className='bg-white'>
        {items.map((item, i) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-5 py-4 text-left ${
              i !== items.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <img src={item.icon} alt='' className='w-7 h-7 shrink-0' />
            <span className='flex-1 text-[15px] font-bold text-gray-900'>{item.label}</span>
            <img src='/assets/icons/chevron-right.svg' alt='' className='w-4 h-4 opacity-60' />
          </button>
        ))}
      </div>
    </div>
  );
}