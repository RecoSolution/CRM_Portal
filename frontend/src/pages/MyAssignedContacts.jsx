import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CATEGORIES = ['All', 'Lead', 'Customer', 'Vendor', 'Partner', 'Team', 'Investor', 'General'];

export default function MyAssignedContacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, [search, category]);

  async function fetchContacts() {
    setLoading(true);
    try {
      const params = { includeTaskStatus: 'true', limit: 100 };
      if (search) params.search = search;
      if (category !== 'All') params.type = category.toLowerCase();
      const res = await api.get('/contacts', { params });
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error('Could not load assigned contacts', err);
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

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate('/home')} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>My Assigned Contacts</span>
        <div className='w-9 h-9' />
      </div>

      <div className='px-5 pt-4'>
        <div className='flex items-center gap-2 mb-3'>
          <div className='flex-1 h-11 rounded-full bg-white flex items-center px-4 gap-2'>
            <img src='/assets/icons/search.svg' alt='' className='w-4 h-4 opacity-50' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search Contacts'
              className='flex-1 text-[14px] bg-transparent outline-none'
            />
          </div>
          <button onClick={() => navigate('/contacts/filter')} className='w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0'>
            <img src='/assets/icons/filter.svg' alt='filter' className='w-4 h-4' />
          </button>
        </div>

        <div className='flex gap-2 overflow-x-auto pb-3'>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 ${
                category === c ? 'bg-forest text-white' : 'bg-white text-gray-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

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
            <p className='text-[14px] text-gray-500'>No assigned contacts found</p>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {contacts.map((c) => (
              <div
                key={c._id}
                onClick={() => navigate(`/contacts/${c._id}`)}
                className='w-full bg-white rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer'
              >
                <div className='w-11 h-11 rounded-full bg-sage/60 flex items-center justify-center text-white font-bold text-[13px] shrink-0'>
                  {getInitials(c.name)}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-[14px] font-bold text-gray-900 truncate'>{c.name}</p>
                    {c.taskStatusLabel && c.openTaskId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${c.openTaskId}`); }}
                        className='text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sage/70 text-white shrink-0 ml-2'
                      >
                        {c.taskStatusLabel}
                      </button>
                    )}
                  </div>
                  <p className='text-[12px] text-gray-500 truncate'>{c.company}</p>
                  {c.relationshipType && (
                    <p className='text-[11px] text-gray-400 capitalize mt-0.5'>{c.relationshipType}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}