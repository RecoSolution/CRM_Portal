import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const RELATIONSHIP_TYPES = ['Lead', 'Vendor', 'Customer', 'Partner', 'Team', 'Investor', 'General'];
const CONTACT_SOURCES = ['GREENS 2026', 'Factory Visit', 'GCPRS 2026', 'Other'];
const CURRENT_STAGES = ['New Contact', 'Follow-up Due', 'Negotiation', 'Quotation Sent', 'Quotation Pending', 'Closed'];

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5">
      {children}
    </p>
  );
}

function Pill({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
        selected ? 'bg-forest text-white' : 'bg-white text-gray-500 ring-1 ring-black/[0.03]'
      }`}
    >
      {selected && <span className="text-[11px]">&#10003;</span>}
      {label}
    </button>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="mb-8">
      <SectionLabel>{title}</SectionLabel>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  );
}

export default function FilterContacts() {
  const navigate = useNavigate();
  const location = useLocation();

  const existingFilters = location.state?.filters || {};

  const [relationshipType, setRelationshipType] = useState(existingFilters.relationshipType || '');
  const [assignedTo, setAssignedTo] = useState(existingFilters.assignedTo || '');
  const [contactSource, setContactSource] = useState(existingFilters.contactSource || '');
  const [currentStage, setCurrentStage] = useState(existingFilters.currentStage || '');
  const [team, setTeam] = useState([]);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      const res = await api.get('/admin/team');
      setTeam(res.data.team);
    } catch (err) {
      // Non-admin users will get a 403 here - that's fine, just show no team options
      setTeam([]);
    }
  }

  function toggle(value, current, setter) {
    setter(current === value ? '' : value);
  }

  function handleClearAll() {
    setRelationshipType('');
    setAssignedTo('');
    setContactSource('');
    setCurrentStage('');
  }

  function handleApply() {
    navigate('/contacts', {
      state: {
        filters: { relationshipType, assignedTo, contactSource, currentStage },
      },
    });
  }

  const activeCount = [relationshipType, assignedTo, contactSource, currentStage].filter(Boolean).length;

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      <div className="bg-sage px-5 pt-5 pb-4 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">Filter Contacts</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 pt-6 pb-6 overflow-y-auto">

        {activeCount > 0 && (
          <div className="flex items-center gap-2 mb-6 px-1">
            <span className="w-2 h-2 rounded-full bg-forest" />
            <p className="text-[12.5px] text-gray-500">
              {activeCount} filter{activeCount > 1 ? 's' : ''} applied
            </p>
          </div>
        )}

        <FilterSection title="Relationship Type">
          {RELATIONSHIP_TYPES.map((type) => (
            <Pill
              key={type}
              label={type}
              selected={relationshipType === type}
              onClick={() => toggle(type, relationshipType, setRelationshipType)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Assigned To">
          {team.length === 0 ? (
            <p className="text-[12.5px] text-gray-400">No team members available</p>
          ) : (
            team.map((member) => (
              <Pill
                key={member._id}
                label={member.firstName}
                selected={assignedTo === member._id}
                onClick={() => toggle(member._id, assignedTo, setAssignedTo)}
              />
            ))
          )}
        </FilterSection>

        <FilterSection title="Contact Source">
          {CONTACT_SOURCES.map((source) => (
            <Pill
              key={source}
              label={source}
              selected={contactSource === source}
              onClick={() => toggle(source, contactSource, setContactSource)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Current Stage">
          {CURRENT_STAGES.map((stage) => (
            <Pill
              key={stage}
              label={stage}
              selected={currentStage === stage}
              onClick={() => toggle(stage, currentStage, setCurrentStage)}
            />
          ))}
        </FilterSection>
      </div>

      <div className={`bg-white px-5 py-4 flex gap-3 shrink-0 border-t border-sage/10 ${CARD_SHADOW}`}>
        <button
          onClick={handleClearAll}
          className="flex-1 h-12 rounded-full bg-sage/10 text-gray-700 font-semibold text-[14px] active:scale-[0.98] transition-transform"
        >
          Clear All
        </button>
        <button
          onClick={handleApply}
          className="flex-1 h-12 rounded-full bg-forest text-white font-semibold text-[14px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_-4px_rgba(64,101,80,0.5)]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}