import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const points = [
    {
      icon: '/assets/icons/privacy-lock.svg',
      text: 'Contact information is encrypted and secure.',
    },
    {
      icon: '/assets/icons/privacy-team.svg',
      text: 'Team members can only access shared company data.',
    },
    {
      icon: '/assets/icons/privacy-shield-check.svg',
      text: 'Your personal information is never shared with third parties.',
    },
  ];

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      {/* Header */}
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate('/home')} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>Privacy Policy</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-6 pt-8 pb-10'>

        {/* Illustration — replace with your own asset */}
        <div className='flex justify-center mb-6'>
          <img
            src='/assets/illustrations/privacy-shield.png'
            alt=''
            className='w-[150px] h-[150px] object-contain'
          />
        </div>

        <h1 className='text-[17px] font-bold text-gray-900 text-center mb-2'>
          Your Privacy Matters
        </h1>
        <p className='text-[13px] text-gray-500 text-center mb-8 px-2'>
          We are committed to protecting your data and being transparent about how it is used.
        </p>

        <div className='flex flex-col gap-6'>
          {points.map((p, i) => (
            <div key={i} className='flex items-start gap-4'>
              <div className='w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0'>
                <img src={p.icon} alt='' className='w-5 h-5' />
              </div>
              <p className='text-[13px] text-gray-700 leading-snug pt-2'>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}