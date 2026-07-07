import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';

const FILTERS = ['All', 'Lead', 'Vendor', 'Customer', 'Partner'];

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

const LEAD_BADGE_STYLES = {
  hot: 'bg-red-50 text-red-600',
  warm: 'bg-amber-50 text-amber-700',
};

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

function ContactRow({ contact, onClick }) {
  const badgeClass = LEAD_BADGE_STYLES[contact.leadCategory] || 'bg-gray-100 text-gray-500';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 bg-white rounded-2xl px-4 py-4 text-left active:scale-[0.99] transition-transform ${CARD_SHADOW}`}
    >
      <div className="w-11 h-11 rounded-full bg-forest/10 ring-1 ring-forest/20 flex items-center justify-center text-forest font-bold text-[13px] shrink-0">
        {getInitials(contact.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-gray-900 truncate">{contact.name}</p>
        <p className="text-[12px] text-gray-500 truncate mt-0.5">{contact.company || 'No company'}</p>
      </div>
      {contact.leadCategory && (
        <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full shrink-0 capitalize ${badgeClass}`}>
          {contact.leadCategory}
        </span>
      )}
    </button>
  );
}

function ContactsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 mt-1">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-[68px] rounded-2xl bg-white/70 animate-pulse" />
      ))}
    </div>
  );
}

export default function Contacts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [advancedFilters, setAdvancedFilters] = useState(() => location.state?.filters || {});

  const hasActiveFilters = activeFilter !== 'All' || Object.keys(advancedFilters).length > 0;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400); // waits 400ms after the last keystroke before updating
    return () => clearTimeout(timer); // cancels the pending update if user types again before 400ms
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchContacts() {
      setLoading(true);
      try {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (activeFilter !== 'All') params.type = activeFilter.toLowerCase();

        if (advancedFilters.relationshipType) params.type = advancedFilters.relationshipType.toLowerCase();
        if (advancedFilters.assignedTo) params.assignedTo = advancedFilters.assignedTo;
        if (advancedFilters.contactSource) params.source = advancedFilters.contactSource;
        if (advancedFilters.currentStage) {
          params.stage = advancedFilters.currentStage.toLowerCase().replace(/[\s-]+/g, '_');
        }

        const res = await api.get('/contacts', { params });
        if (!cancelled) setContacts(res.data.contacts);
      } catch (err) {
        console.error('Could not load contacts', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchContacts();
    return () => { cancelled = true; };
  }, [debouncedSearch, activeFilter, advancedFilters]);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-6 shrink-0 rounded-b-[28px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate('/home')}
            className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors"
          >
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Contacts</span>
          <button
            onClick={() => navigate('/contacts/filters', { state: { filters: advancedFilters } })}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors relative"
          >
            <img src="/assets/icons/filter.svg" alt="filter" className="w-5 h-5 brightness-0 invert" />
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-forest" />
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <img
            src="/assets/icons/search.svg"
            alt=""
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className={`w-full h-11 rounded-full pl-11 pr-10 text-[13.5px] text-gray-900 bg-white border-none outline-none placeholder:text-gray-400 ${CARD_SHADOW}`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[11px] leading-none"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-3 shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`h-9 px-4 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
              activeFilter === f ? 'bg-forest text-white' : `bg-white text-gray-500 ${CARD_SHADOW}`
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 px-5 pb-10 overflow-y-auto">
        {loading ? (
          <ContactsSkeleton />
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center mb-5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.03]">
              <img src="/assets/illustrations/no-contacts.png" alt="" className="w-20 h-20 object-contain" />
            </div>
            <p className="text-[14px] font-semibold text-gray-700 mb-1">No contacts found</p>
            <p className="text-[12.5px] text-gray-400 max-w-[220px]">
              {search || hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Contacts you save will show up here'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mt-1">
            {contacts.map((contact) => (
              <ContactRow key={contact._id} contact={contact} onClick={() => navigate(`/contacts/${contact._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}