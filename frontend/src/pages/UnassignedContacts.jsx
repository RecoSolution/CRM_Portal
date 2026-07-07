import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

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

function ContactCard({ contact, employees, assigning, onOpen, onAssign }) {
  const avatarShade = useMemo(
    () => AVATAR_SHADES[hashToIndex(contact._id || contact.name || '', AVATAR_SHADES.length)],
    [contact._id, contact.name]
  );

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <button onClick={onOpen} className="w-full flex items-center gap-3 mb-3.5 text-left">
        <div className={`w-12 h-12 rounded-full ${avatarShade} flex items-center justify-center text-white font-bold text-[14px] shrink-0`}>
          {getInitials(contact.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14.5px] text-gray-900 truncate">{contact.name}</p>
          {contact.company && <p className="text-[12px] text-gray-500 truncate">{contact.company}</p>}
        </div>
        <span className="text-[10.5px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
          Unassigned
        </span>
      </button>

      <select
        defaultValue=""
        disabled={assigning}
        onChange={(e) => onAssign(e.target.value)}
        className="w-full h-11 rounded-xl px-3.5 text-[13.5px] text-gray-900 bg-bg border-none outline-none disabled:opacity-60"
      >
        <option value="" disabled>
          {assigning ? 'Assigning...' : 'Assign to employee'}
        </option>
        {employees.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.firstName} {emp.lastName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function UnassignedContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const [contactsRes, teamRes] = await Promise.all([
          api.get('/admin/unassigned-contacts'),
          api.get('/admin/team'),
        ]);
        if (cancelled) return;
        setContacts(contactsRes.data.contacts || []);
        setEmployees((teamRes.data.team || []).filter((u) => u.role === 'employee'));
      } catch (err) {
        console.error('Could not load unassigned contacts', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  async function assignTo(contactId, employeeId) {
    if (!employeeId) return;
    setAssigningId(contactId);
    try {
      await api.post('/admin/assign-lead', { contactId, assignToUserId: employeeId });
      setContacts((prev) => prev.filter((c) => c._id !== contactId));
    } catch (err) {
      console.error('Could not assign contact', err);
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate('/team-dashboard')} className="w-9 h-9 flex items-center justify-center -ml-1">
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Unassigned Contacts</span>
          <div className="w-9 h-9" />
        </div>
        <p className="text-center text-white/70 text-[12.5px] mt-1">
          {loading ? 'Checking for unassigned contacts' : `${contacts.length} awaiting assignment`}
        </p>
      </div>

      <div className="flex-1 px-5 -mt-3 pb-10 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[132px] rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] animate-pulse" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center">
              <img src="/assets/icons/unassigned-user.svg" alt="" className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-[14px] font-semibold text-gray-700">All contacts are assigned</p>
            <p className="text-[12.5px] text-gray-400 max-w-[220px]">New unassigned contacts will show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {contacts.map((contact) => (
              <ContactCard
                key={contact._id}
                contact={contact}
                employees={employees}
                assigning={assigningId === contact._id}
                onOpen={() => navigate(`/contacts/${contact._id}`)}
                onAssign={(employeeId) => assignTo(contact._id, employeeId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}