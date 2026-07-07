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

function ContactCard({ contact, onOpen }) {
  const avatarShade = useMemo(
    () => AVATAR_SHADES[hashToIndex(contact._id || contact.name || '', AVATAR_SHADES.length)],
    [contact._id, contact.name]
  );

  return (
    <button
      onClick={() => onOpen(contact._id)}
      className="w-full bg-white rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform"
    >
      <div className={`w-12 h-12 rounded-full ${avatarShade} flex items-center justify-center text-white font-semibold text-[14px] shrink-0`}>
        {getInitials(contact.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-semibold text-gray-900 truncate">
          {contact.name}
          {contact.company && <span className="font-normal text-gray-500"> · {contact.company}</span>}
        </p>
        {contact.relationshipType && (
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-forest/8 text-forest text-[11px] font-medium capitalize">
            {contact.relationshipType}
          </span>
        )}
      </div>
    </button>
  );
}

export default function RecentContacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAnyContacts, setHasAnyContacts] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchContacts() {
      setLoading(true);
      try {
        const params = { limit: 100 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category !== 'All') params.type = category.toLowerCase();
        const res = await api.get('/contacts', { params });
        if (cancelled) return;
        const results = res.data.contacts || [];
        setContacts(results);
        if (!debouncedSearch && category === 'All') {
          setHasAnyContacts(results.length > 0);
        }
      } catch (err) {
        console.error('Could not load contacts', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchContacts();
    return () => { cancelled = true; };
  }, [debouncedSearch, category]);

  const isFiltering = Boolean(debouncedSearch) || category !== 'All';
  const showBrowseUI = hasAnyContacts || isFiltering;

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header — curved bottom edge, matches Contacts / Filter Contacts / Help & Support / Notifications / Privacy Policy / Profile */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Recently Added Contacts</span>
          <div className="w-9 h-9" />
        </div>
      </div>

      {showBrowseUI ? (
        <>
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
                  <div key={i} className="h-[68px] rounded-2xl bg-white/70 animate-pulse" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center">
                  <img src="/assets/icons/search.svg" alt="" className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-[14px] font-medium text-gray-600">No contacts found</p>
                <p className="text-[12.5px] text-gray-400 max-w-[220px]">Try adjusting your search or filter to see more results.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {contacts.map((c) => (
                  <ContactCard key={c._id} contact={c} onOpen={(id) => navigate(`/contacts/${id}`)} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <img src="/assets/illustrations/no-recent-contacts.png" alt="" className="w-[130px] h-[130px] object-contain mb-6" />
          <h2 className="text-[17px] font-bold text-gray-900 mb-2">No Recent Contacts</h2>
          <p className="text-[13.5px] text-gray-500 leading-relaxed max-w-[260px]">
            New contacts added by you or your team will appear here
          </p>
        </div>
      )}
    </div>
  );
}