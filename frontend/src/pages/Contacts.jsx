import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';

const FILTERS = ['All', 'Lead', 'Vendor', 'Customer', 'Partner'];

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const location = useLocation();
  const [advancedFilters, setAdvancedFilters] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // waits 400ms after the last keystroke before updating

    return () => clearTimeout(timer); // cancels the pending update if user types again before 400ms
  }, [search]);

  useEffect(() => {
    if (location.state?.filters) {
      setAdvancedFilters(location.state.filters);
    }
  }, [location.state]);

  useEffect(() => {
    fetchContacts();
  }, [debouncedSearch, activeFilter, advancedFilters]);

  async function fetchContacts() {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (activeFilter !== 'All') params.type = activeFilter.toLowerCase();

      if (advancedFilters.relationshipType)
        params.type = advancedFilters.relationshipType.toLowerCase();
      if (advancedFilters.assignedTo)
        params.assignedTo = advancedFilters.assignedTo;
      if (advancedFilters.contactSource)
        params.source = advancedFilters.contactSource;
      if (advancedFilters.currentStage) {
        params.stage = advancedFilters.currentStage
          .toLowerCase()
          .replace(/[\s-]+/g, '_');
      }

      const res = await api.get('/contacts', { params });
      setContacts(res.data.contacts);
    } catch (err) {
      console.error('Could not load contacts', err);
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    // Strip anything that isn't a letter or whitespace (bullets, dashes,
    // dots, etc.) so symbols never end up rendered as an "initial".
    const cleaned = name.replace(/[^a-zA-Z\s]/g, '').trim();
    if (!cleaned) return '?';
    return cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function leadBadgeColor(category) {
    if (category === 'hot') return 'bg-red-100 text-red-600';
    if (category === 'warm') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-500';
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>
      {/* Header */}
      <div className='bg-sage px-5 pt-5 pb-4'>
        <div className='flex items-center justify-between mb-4'>
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
          <span className='text-white font-bold text-[17px]'>Contacts</span>
          <button
            onClick={() =>
              navigate('/contacts/filters', {
                state: { filters: advancedFilters },
              })
            }
            className='w-9 h-9 flex items-center justify-center'
          >
            <img
              src='/assets/icons/filter.svg'
              alt='filter'
              className='w-5 h-5'
            />
          </button>
        </div>

        {/* Search bar */}
        <div className='relative'>
          <img
            src='/assets/icons/search.svg'
            alt=''
            className='absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 opacity-60'
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search contacts...'
            className='w-full h-11 rounded-full pl-11 pr-4 text-[14px] text-gray-900 bg-white/90 border-none outline-none'
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className='flex gap-2 overflow-x-auto px-5 py-4 shrink-0'>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap ${
              activeFilter === f
                ? 'bg-forest text-white'
                : 'bg-white/70 text-gray-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className='flex-1 px-5 pb-10 overflow-y-auto'>
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce' style={{ animationDelay: '0ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce' style={{ animationDelay: '150ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce' style={{ animationDelay: '300ms' }} />
        </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <img
              src='/assets/illustrations/no-contacts.png'
              alt=''
              className='w-32 h-32 object-contain mb-4 opacity-70'
            />
            <p className='text-[14px] text-gray-500'>No contacts found</p>
          </div>
        ) : (
          <div className='flex flex-col gap-3 mt-1'>
            {contacts.map((contact) => (
              <button
                key={contact._id}
                onClick={() => navigate(`/contacts/${contact._id}`)}
                className='flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-3 text-left'
              >
                <div className='w-11 h-11 rounded-full border-2 border-forest flex items-center justify-center text-forest font-bold text-[13px] shrink-0'>
                  {getInitials(contact.name)}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold text-[14px] text-gray-900 truncate'>
                    {contact.name}
                  </p>
                  <p className='text-[12px] text-gray-500 truncate'>
                    {contact.company}
                  </p>
                </div>
                {contact.leadCategory && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${leadBadgeColor(contact.leadCategory)}`}
                  >
                    {contact.leadCategory}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
