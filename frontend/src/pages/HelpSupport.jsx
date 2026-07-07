import { useNavigate } from 'react-router-dom';

const ITEMS = [
  {
    icon: '/assets/icons/help-faq.svg',
    label: 'Frequently Asked Questions',
    description: 'Quick answers to common questions',
    path: '/help-support/faq',
  },
  {
    icon: '/assets/icons/help-contact.svg',
    label: 'Contact Support',
    description: 'Reach our team directly by email',
    path: '/help-support/contact',
  },
  {
    icon: '/assets/icons/help-report.svg',
    label: 'Report an Issue',
    description: 'Let us know if something is broken',
    path: '/help-support/report',
  },
];

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

export default function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">Help &amp; Support</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 pt-8 pb-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03] flex items-center justify-center mb-4">
            <div className="w-9 h-9 rounded-full bg-forest/10 flex items-center justify-center">
              <img src="/assets/icons/help.svg" alt="" className="w-4.5 h-4.5" />
            </div>
          </div>
          <h1 className="text-[17px] font-bold text-gray-900">How can we help?</h1>
          <p className="text-[12.5px] text-gray-500 mt-1 px-6">
            Find answers, get support, or let us know about a problem.
          </p>
        </div>

        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5">
          Resources
        </p>
        <div className={`bg-white rounded-2xl overflow-hidden ${CARD_SHADOW}`}>
          {ITEMS.map((item, i) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-4 text-left active:bg-sage/5 transition-colors ${
                i !== ITEMS.length - 1 ? 'border-b border-sage/10' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
                <img src={item.icon} alt="" className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900">{item.label}</p>
                <p className="text-[12px] text-gray-500 mt-0.5 truncate">{item.description}</p>
              </div>
              <img src="/assets/icons/chevron-right.svg" alt="" className="w-4 h-4 opacity-40 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}