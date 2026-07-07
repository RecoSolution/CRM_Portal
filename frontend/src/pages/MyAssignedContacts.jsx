import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CATEGORIES = ['All', 'Lead', 'Customer', 'Vendor', 'Partner', 'Team', 'Investor', 'General'];
const AVATAR_SHADES = ['bg-forest', 'bg-sage', 'bg-forest/80', 'bg-sage/80'];

function getInitials(name) {
  if (!name) return '?';
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

function hashToIndex(str, mod) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % mod;
  return hash;
}

function ContactCard({ contact, onOpen, onOpenTask }) {
  const avatarShade = useMemo(
    () => AVATAR_SHADES[hashToIndex(contact._id || contact.name || '', AVATAR_SHADES.length)],
    [contact._id, contact.name]
  );

  return (
    <div
      onClick={() => onOpen(contact._id)}
      role="button"
      tabIndex={0}
      className="w-full bg-white rounded-2xl p-4 flex items-center gap-3.5 text-left cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform"
    >
      <div className={`w-12 h-12 rounded-full ${avatarShade} flex items-center justify-center text-white font-semibold text-[14px] shrink-0`}>
        {getInitials(contact.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[15px] font-semibold text-gray-900 truncate">{contact.name}</p>
          {contact.taskStatusLabel && contact.openTaskId && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenTask(contact.openTaskId); }}
              className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-sage/15 text-forest shrink-0"
            >
              {contact.taskStatusLabel}
            </button>
          )}
        </div>
        {contact.company && (
          <p className="text-[12.5px] text-gray-500 truncate">{contact.company}</p>
        )}
        {contact.relationshipType && (
          <p className="text-[11px] text-gray-400 capitalize mt-1 tracking-wide">{contact.relationshipType}</p>
        )}
      </div>

      <img src="/assets/icons/arrow-left.svg" alt="" className="w-3.5 h-3.5 opacity-25 rotate-180 shrink-0" />
    </div>
  );
}

export default function MyAssignedContacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchContacts() {
      setLoading(true);
      try {
        const params = { includeTaskStatus: 'true', limit: 100 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category !== 'All') params.type = category.toLowerCase();
        const res = await api.get('/contacts', { params });
        if (!cancelled) setContacts(res.data.contacts || []);
      } catch (err) {
        console.error('Could not load assigned contacts', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchContacts();
    return () => { cancelled = true; };
  }, [debouncedSearch, category]);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0">
        <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">My Assigned Contacts</span>
        <div className="w-9 h-9" />
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-11 rounded-full bg-white flex items-center px-4 gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <img src="/assets/icons/search.svg" alt="" className="w-4 h-4 opacity-40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => navigate('/contacts/filter')}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <img src="/assets/icons/filter.svg" alt="filter" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                category === c ? 'bg-forest text-white' : 'bg-white text-gray-500'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-10 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 pt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-[76px] rounded-2xl bg-white/70 animate-pulse" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center">
              <img src="/assets/icons/search.svg" alt="" className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-[14px] font-medium text-gray-600">No assigned contacts found</p>
            <p className="text-[12.5px] text-gray-400 max-w-[220px]">Try adjusting your search or filter to see more results.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {contacts.map((c) => (
              <ContactCard
                key={c._id}
                contact={c}
                onOpen={(id) => navigate(`/contacts/${id}`)}
                onOpenTask={(id) => navigate(`/tasks/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}