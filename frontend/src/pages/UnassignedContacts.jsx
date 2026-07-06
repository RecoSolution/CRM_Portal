import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function UnassignedContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [contactsRes, teamRes] = await Promise.all([
        api.get('/admin/unassigned-contacts'),
        api.get('/admin/team'),
      ]);
      setContacts(contactsRes.data.contacts || []);
      setEmployees((teamRes.data.team || []).filter((u) => u.role === 'employee'));
    } catch (err) {
      console.error('Could not load unassigned contacts', err);
    } finally {
      setLoading(false);
    }
  }

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

      {/* Header */}
      <div className='bg-sage px-5 pt-5 pb-4 flex items-center justify-between'>
        <button onClick={() => navigate('/team-dashboard')} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-bold text-[17px]'>Unassigned Contacts</span>
        <div className='w-9 h-9' />
      </div>

      {/* List */}
      <div className='flex-1 px-5 py-5 overflow-y-auto'>
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
            <img src='/assets/illustrations/no-contacts.png' alt='' className='w-28 h-28 object-contain mb-4 opacity-70' />
            <p className='text-[14px] text-gray-500'>All contacts are assigned</p>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {contacts.map((contact) => (
              <div key={contact._id} className='bg-white/70 rounded-2xl px-4 py-3'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-11 h-11 rounded-full border-2 border-forest flex items-center justify-center text-forest font-bold text-[13px] shrink-0'>
                    {getInitials(contact.name)}
                  </div>
                  <div
                    className='flex-1 min-w-0 cursor-pointer'
                    onClick={() => navigate(`/contacts/${contact._id}`)}
                  >
                    <p className='font-semibold text-[14px] text-gray-900 truncate'>{contact.name}</p>
                    <p className='text-[12px] text-gray-500 truncate'>{contact.company}</p>
                  </div>
                </div>

                <select
                  defaultValue=''
                  disabled={assigningId === contact._id}
                  onChange={(e) => assignTo(contact._id, e.target.value)}
                  className='w-full h-10 rounded-xl px-3 text-[13px] text-gray-900 bg-white border border-forest/30 outline-none disabled:opacity-60'
                >
                  <option value='' disabled>
                    {assigningId === contact._id ? 'Assigning...' : 'Assign to employee'}
                  </option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}