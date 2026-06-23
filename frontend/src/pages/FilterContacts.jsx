import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const RELATIONSHIP_TYPES = ['Lead', 'Vendor', 'Customer', 'Partner', 'Team', 'Investor', 'General'];
const CONTACT_SOURCES = ['Exhibition', 'Factory Visit', 'Conference', 'Panel Discussion', 'General', 'Referral'];
const CURRENT_STAGES = ['New Contact', 'Follow-up Due', 'Negotiation', 'Quotation Sent', 'Quotation Pending', 'Closed'];

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

  function Pill({ label, selected, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`h-10 px-4 rounded-full text-[13px] font-medium border-[1.5px] flex items-center justify-center gap-1.5 ${
          selected
            ? 'bg-forest border-forest text-white'
            : 'bg-transparent border-gray-300 text-gray-600'
        }`}
      >
        {selected && <span className='text-[11px]'>✓</span>}
        {label}
      </button>
    );
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      <div className='bg-sage px-5 pt-5 pb-4 flex items-center justify-between shrink-0'>
        <button onClick={() => navigate(-1)} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-bold text-[17px]'>Filter Contacts</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-6 pb-6 overflow-y-auto'>

        <p className='text-[14px] font-bold text-gray-900 mb-3'>Relationship Type</p>
        <div className='flex gap-2 flex-wrap mb-6'>
          {RELATIONSHIP_TYPES.map((type) => (
            <Pill
              key={type}
              label={type}
              selected={relationshipType === type}
              onClick={() => toggle(type, relationshipType, setRelationshipType)}
            />
          ))}
        </div>
        <div className='border-t border-gray-300 mb-6' />

        <p className='text-[14px] font-bold text-gray-900 mb-3'>Assigned To</p>
        <div className='flex gap-2 flex-wrap mb-6'>
          {team.length === 0 ? (
            <p className='text-[13px] text-gray-400'>No team members available</p>
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
        </div>
        <div className='border-t border-gray-300 mb-6' />

        <p className='text-[14px] font-bold text-gray-900 mb-3'>Contact Source</p>
        <div className='flex gap-2 flex-wrap mb-6'>
          {CONTACT_SOURCES.map((source) => (
            <Pill
              key={source}
              label={source}
              selected={contactSource === source}
              onClick={() => toggle(source, contactSource, setContactSource)}
            />
          ))}
        </div>
        <div className='border-t border-gray-300 mb-6' />

        <p className='text-[14px] font-bold text-gray-900 mb-3'>Current Stage</p>
        <div className='flex gap-2 flex-wrap mb-6'>
          {CURRENT_STAGES.map((stage) => (
            <Pill
              key={stage}
              label={stage}
              selected={currentStage === stage}
              onClick={() => toggle(stage, currentStage, setCurrentStage)}
            />
          ))}
        </div>
      </div>

      <div className='bg-sage/30 px-5 py-4 flex gap-3 shrink-0'>
        <button
          onClick={handleClearAll}
          className='flex-1 h-12 rounded-full bg-white/80 text-gray-700 font-semibold text-[14px]'
        >
          Clear All
        </button>
        <button
          onClick={handleApply}
          className='flex-1 h-12 rounded-full bg-forest text-white font-semibold text-[14px]'
        >
          Apply
        </button>
      </div>
    </div>
  );
}