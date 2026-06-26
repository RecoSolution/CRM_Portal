import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ContactDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);

  const [team, setTeam] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchContact();
    if (isAdmin) fetchTeam();
  }, [id]);

  async function fetchContact() {
    setLoading(true);
    try {
      const res = await api.get(`/contacts/${id}`);
      setContact(res.data.contact);
    } catch (err) {
      console.error('Could not load contact', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeam() {
    try {
      const res = await api.get('/admin/team');
      setTeam(res.data.team);
    } catch (err) {
      console.error('Could not load team', err);
    }
  }

  async function handleAssign(assignToUserId) {
    if (!assignToUserId) return;
    setAssigning(true);
    try {
      await api.post('/admin/assign-lead', { contactId: id, assignToUserId });
      fetchContact();
    } catch (err) {
      console.error('Could not assign contact', err);
    } finally {
      setAssigning(false);
    }
  }

  async function markReminderComplete(reminderId) {
    try {
      await api.put(`/contacts/${id}/reminders/${reminderId}`, {
        status: 'done',
      });
      fetchContact();
    } catch (err) {
      console.error('Could not update reminder', err);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/contacts/${id}`);
      navigate('/contacts');
    } catch (err) {
      console.error('Could not delete contact', err);
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
          ? 'nd'
          : day % 10 === 3 && day !== 13
            ? 'rd'
            : 'th';
    return `${day}${suffix} ${month} ${year}`;
  }

  if (loading) {
    return (
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center'>
        <p className='text-gray-500 text-[14px]'>Contact not found.</p>
      </div>
    );
  }

  const pendingReminder = contact.reminders?.find(
    (r) => r.status === 'pending',
  );
  const activityEvents = [
    {
      date: contact.createdAt,
      label: 'Saved Contact',
      by: contact.collectedBy?.firstName || 'You',
    },
    ...(contact.notes || []).map((n) => ({
      date: n.createdAt,
      label: 'Added Note',
      by: 'You',
    })),
    ...(contact.reminders || []).map((r) => ({
      date: r.createdAt,
      label: `Set Reminder for ${r.task || 'Follow-up'}`,
      by: 'You',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg px-5 pt-5 pb-10 relative'>
      {/* Header */}
      <div className='flex items-center justify-between mb-5'>
        <button
          onClick={() => navigate('/contacts')}
          className='w-9 h-9 flex items-center justify-center -ml-1'
        >
          <img
            src='/assets/icons/arrow-left.svg'
            alt='back'
            className='w-5 h-5'
          />
        </button>
        <span className='font-bold text-[17px] text-gray-900 capitalize'>
          {contact.relationshipType || 'Contact'}
        </span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className='w-9 h-9 flex items-center justify-center'
        >
          <img
            src='/assets/icons/more-vertical.svg'
            alt='menu'
            className='w-5 h-5'
          />
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setMenuOpen(false)}
          />
          <div className='absolute right-5 top-14 z-50 bg-white rounded-2xl shadow-lg py-2 w-44'>
            <button
              onClick={() => navigate(`/contacts/${id}/edit`)}
              className='w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800'
            >
              <img src='/assets/icons/edit.svg' alt='' className='w-4 h-4' />{' '}
              Edit Contact
            </button>
            <button className='w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800'>
              <img src='/assets/icons/share.svg' alt='' className='w-4 h-4' />{' '}
              Share
            </button>
            <button className='w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-800'>
              <img src='/assets/icons/export.svg' alt='' className='w-4 h-4' />{' '}
              Export
            </button>
            <button
              onClick={handleDelete}
              className='w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-red-600'
            >
              <img src='/assets/icons/trash.svg' alt='' className='w-4 h-4' />{' '}
              Delete
            </button>
          </div>
        </>
      )}

      {/* Avatar + name + actions */}
      <div className='flex items-center gap-4 mb-4'>
        <div className='w-14 h-14 rounded-full border-2 border-forest flex items-center justify-center text-forest font-bold text-[16px] shrink-0'>
          {getInitials(contact.name)}
        </div>
        <div>
          <p className='font-bold text-[16px] text-gray-900'>{contact.name}</p>
          <p className='text-[13px] text-gray-500'>{contact.designation}</p>
        </div>
      </div>

      <div className='flex gap-2 mb-6'>
        <a
          href={`tel:${contact.phone}`}
          className='flex-1 h-10 rounded-full bg-forest text-white text-[13px] font-semibold flex items-center justify-center gap-1.5'
        >
          <img src='/assets/icons/phone.svg' alt='' className='w-4 h-4' /> Call
        </a>
        <a
          href={`mailto:${contact.email}`}
          className='flex-1 h-10 rounded-full bg-forest text-white text-[13px] font-semibold flex items-center justify-center gap-1.5'
        >
          <img src='/assets/icons/mail-white.svg' alt='' className='w-4 h-4' />{' '}
          Email
        </a>
        <a
          href={`https://wa.me/${contact.phone?.replace(/\D/g, '')}`}
          className='flex-1 h-10 rounded-full bg-forest text-white text-[13px] font-semibold flex items-center justify-center gap-1.5'
        >
          <img src='/assets/icons/whatsapp.svg' alt='' className='w-4 h-4' />{' '}
          Whatsapp
        </a>
      </div>

      <div className='border-t border-forest/20 mb-4' />

      {/* Contact Information */}
      <p className='text-[13px] font-semibold text-gray-500 mb-2.5'>
        Contact Information
      </p>
      <div className='grid grid-cols-2 gap-y-2 mb-4 text-[13px] text-gray-800'>
        <p>
          <span className='text-gray-500'>Mobile Number: </span>
          {contact.phone}
        </p>
        <p>
          <span className='text-gray-500'>Website: </span>
          {contact.website}
        </p>
        <p className='col-span-2'>
          <span className='text-gray-500'>Email: </span>
          {contact.email}
        </p>
      </div>

      <div className='border-t border-forest/20 mb-4' />

      {/* Contact Source / Collected By / Assign To */}
      <div className='flex items-center justify-between mb-4 text-[13px]'>
        <div>
          <p className='mb-1.5'>
            <span className='text-gray-500'>Contact Source: </span>
            <span className='font-semibold text-gray-900'>{contact.event}</span>
          </p>
          <p>
            <span className='text-gray-500'>Collected By: </span>
            <span className='font-semibold text-gray-900'>
              {contact.collectedBy?.firstName || '—'}
            </span>
          </p>
        </div>

        {isAdmin && (
          <div className='flex flex-col items-end gap-1.5'>
            <span className='text-gray-500 text-[13px]'>Assign To</span>
            <select
              value={contact.assignedTo?._id || ''}
              onChange={(e) => handleAssign(e.target.value)}
              disabled={assigning}
              className='h-9 px-3 rounded-full text-[13px] text-gray-800 bg-white/70 border-none outline-none'
            >
              <option value=''>Select</option>
              {team.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className='border-t border-forest/20 mb-4' />

      {/* Upcoming Reminder */}
      {pendingReminder && (
        <>
          <div className='flex items-center justify-between mb-2.5'>
            <p className='text-[13px] font-semibold text-gray-500'>
              Upcoming Reminder
            </p>
            <button
              onClick={() => markReminderComplete(pendingReminder._id)}
              className='h-8 px-4 rounded-full bg-forest text-white text-[12px] font-semibold'
            >
              Mark Complete
            </button>
          </div>
          <div className='flex items-center justify-between bg-white/70 rounded-2xl px-4 py-3 mb-4'>
            <span className='text-[13px] text-gray-800 capitalize'>
              {pendingReminder.note ||
                (pendingReminder.task
                  ? pendingReminder.task.replace(/_/g, ' ')
                  : 'Follow-up reminder')}
            </span>
            <span className='text-[13px] text-gray-600'>
              {formatDate(pendingReminder.dueDate)}
            </span>
          </div>
          <div className='border-t border-forest/20 mb-4' />
        </>
      )}

      {/* Notes */}
      {contact.notes?.length > 0 && (
        <>
          <p className='text-[13px] font-semibold text-gray-500 mb-2.5'>
            Notes
          </p>
          <div className='border-[1.5px] border-forest/30 rounded-2xl px-4 py-3 mb-4 text-[13px] text-gray-800'>
            {contact.notes.map((n) => (
              <p key={n._id}>{n.content}</p>
            ))}
          </div>
        </>
      )}

      {/* Voice Note */}
{contact.notes?.some((n) => n.audioUrl?.trim()) && (
  <>
    <p className='text-[13px] font-semibold text-gray-500 mb-2.5'>
      Voice Note
    </p>

    {contact.notes
      .filter((n) => n.audioUrl?.trim())
      .map((n) => (
        <audio
          key={n._id}
          controls
          preload='metadata'
          className='w-full mb-4 rounded-xl'
        >
          <source src={n.audioUrl} type='audio/webm' />
          Your browser does not support the audio element.
        </audio>
      ))}
  </>
)}

      {/* Card image */}
      {contact.cardImageUrl && (
        <img
          src={contact.cardImageUrl}
          alt='Business card'
          className='w-full rounded-2xl border-2 border-forest/30 mb-4'
        />
      )}

      {/* Activity History */}
      <button
        onClick={() => setHistoryOpen(!historyOpen)}
        className='w-full flex items-center justify-between bg-white/60 rounded-2xl px-4 py-3 mb-2'
      >
        <span className='text-[14px] font-semibold text-gray-500'>
          Activity History
        </span>
        <img
          src='/assets/icons/chevron-down.svg'
          alt=''
          className={`w-4 h-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {historyOpen && (
        <div className='flex flex-col'>
          {activityEvents.map((event, i) => (
            <div
              key={i}
              className='flex items-center justify-between py-3 border-t border-gray-200 text-[13px]'
            >
              <span className='text-gray-600'>{formatDate(event.date)}</span>
              <span className='text-gray-900 font-medium'>
                {event.label}{' '}
                <span className='text-gray-400 font-normal'>
                  (By {event.by})
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
