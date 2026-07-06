import { useNavigate } from 'react-router-dom';

const SUPPORT_EMAIL = 'hetu.recosolution@gmail.com';

export default function ContactSupport() {
  const navigate = useNavigate();

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>
      {/* Header */}
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button
          onClick={() => navigate('/help-support')}
          className='w-9 h-9 flex items-center justify-center -ml-1'
        >
          <img
            src='/assets/icons/arrow-left.svg'
            alt='back'
            className='w-5 h-5'
          />
        </button>

        <span className='text-white font-semibold text-[16px]'>
          Contact Support
        </span>

        <div className='w-9 h-9' />
      </div>

      {/* Content */}
      <div className='flex-1 px-6 pt-10 pb-10 flex flex-col items-center text-center'>
        <div className='w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-5'>
          <img
            src='/assets/icons/help-contact.svg'
            alt='Support'
            className='w-8 h-8'
          />
        </div>

        <h1 className='text-[17px] font-bold text-gray-900 mb-2'>
          We're here to help
        </h1>

        <p className='text-[13px] text-gray-500 mb-8 px-2'>
          Reach out to our support team and we'll get back to you as soon as
          possible.
        </p>

        <div className='w-full bg-white rounded-2xl p-4 flex items-center justify-between mb-6 shadow-sm'>
          <div className='text-left'>
            <p className='text-[12px] text-gray-500 mb-0.5'>Email us at</p>
            <p className='text-[14px] font-bold text-gray-900'>
              {SUPPORT_EMAIL}
            </p>
          </div>
        </div>

        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Support Request`}
          className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white flex items-center justify-center gap-2'
        >
          <img
            src='/assets/icons/help-contact.svg'
            alt=''
            className='w-4 h-4 brightness-0 invert'
          />
          Send Email
        </a>
      </div>
    </div>
  );
}
