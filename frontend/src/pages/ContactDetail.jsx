import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5 ${className}`}>
      {children}
    </p>
  );
}

function InfoRow({ label, value, last = false }) {
  const borderClass = last ? '' : 'border-b border-sage/10';
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 ${borderClass}`}>
      <span className='text-[12.5px] text-gray-500'>{label}</span>
      <span className='text-[13px] font-semibold text-gray-900 text-right truncate max-w-[220px]'>
        {value || '-'}
      </span>
    </div>
  );
}

function QuickAction({ href, icon, label }) {
  return (
    <a href={href} className={`flex-1 flex flex-col items-center gap-1.5 bg-white rounded-2xl py-3.5 active:scale-[0.97] transition-transform ${CARD_SHADOW}`}>
      <div className='w-9 h-9 rounded-full bg-forest flex items-center justify-center'>
        <img src={icon} alt='' className='w-4 h-4' />
      </div>
      <span className='text-[11.5px] font-semibold text-gray-700'>{label}</span>
    </a>
  );
}

export default function ContactDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTask, setReminderTask] = useState('follow_up');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderPriority, setReminderPriority] = useState('medium');
  const [savingReminder, setSavingReminder] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const [team, setTeam] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [menuBusy, setMenuBusy] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchContact();
    if (isAdmin) fetchTeam();
  }, [id]);

  function buildShareText() {
    const lines = [
      contact.name,
      contact.designation,
      contact.company,
      contact.phone ? `Phone: ${contact.phone}` : '',
      contact.email ? `Email: ${contact.email}` : '',
      contact.website ? `Website: ${contact.website}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  }

  async function handleShare() {
    setMenuOpen(false);
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: contact.name, text });
        return;
      } catch (err) {
        return;
      }
    }

    setShareSheetOpen(true);
  }

  function shareToWhatsApp() {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShareSheetOpen(false);
  }

  function shareViaEmail() {
    const subject = encodeURIComponent(contact.name || 'Contact');
    const body = encodeURIComponent(buildShareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShareSheetOpen(false);
  }

  function shareViaSMS() {
    const body = encodeURIComponent(buildShareText());
    window.location.href = `sms:?body=${body}`;
    setShareSheetOpen(false);
  }

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(buildShareText());
    } catch (err) {
      console.error('Could not copy', err);
    }
    setShareSheetOpen(false);
  }

  async function handleExportSingle() {
    setMenuBusy(true);
    try {
      const res = await api.get('/contacts/export', {
        params: { contactId: id, format: 'xlsx' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contact.name || 'contact'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Could not export contact', err);
    } finally {
      setMenuBusy(false);
      setMenuOpen(false);
    }
  }

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

  async function submitReminder() {
    if (!reminderDate) return;
    setSavingReminder(true);
    try {
      await api.post(`/contacts/${id}/reminders`, {
        task: reminderTask,
        dueDate: reminderDate,
        time: reminderTime,
        priority: reminderPriority,
      });
      setShowReminderForm(false);
      setReminderDate('');
      setReminderTime('');
      fetchContact();
    } catch (err) {
      console.error('Could not add reminder', err);
    } finally {
      setSavingReminder(false);
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
        <div className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce' style={{ animationDelay: '0ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce' style={{ animationDelay: '150ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce' style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col items-center justify-center gap-3 px-8'>
        <div className='w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center'>
          <img src='/assets/icons/about-support.svg' alt='' className='w-6 h-6 opacity-40' />
        </div>
        <p className='text-gray-500 text-[13.5px]'>Contact not found.</p>
      </div>
    );
  }

  const pendingReminder = contact.reminders?.find((r) => r.status === 'pending');
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
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col relative'>

      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0 shadow-sm sticky top-0 z-30'>
        <button onClick={() => navigate(-1)} className='w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='font-semibold text-[16px] text-white capitalize'>
          {contact.relationshipType || 'Contact'}
        </span>
        <button onClick={() => setMenuOpen(!menuOpen)} className='w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors'>
          <img src='/assets/icons/more-vertical.svg' alt='menu' className='w-5 h-5' />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setMenuOpen(false)} />
          <div className={`absolute right-5 top-16 z-50 bg-white rounded-2xl py-1.5 w-48 overflow-hidden ${CARD_SHADOW} shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]`}>
            <button onClick={() => navigate(`/contacts/${id}/edit`)} className='w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-gray-800 active:bg-gray-50'>
              <img src='/assets/icons/edit.svg' alt='' className='w-4 h-4 opacity-70' />
              Edit Contact
            </button>
            <button onClick={handleShare} className='w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-gray-800 active:bg-gray-50'>
              <img src='/assets/icons/share.svg' alt='' className='w-4 h-4 opacity-70' />
              Share
            </button>
            <button onClick={handleExportSingle} disabled={menuBusy} className='w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-gray-800 active:bg-gray-50 disabled:opacity-50'>
              <img src='/assets/icons/export.svg' alt='' className='w-4 h-4 opacity-70' />
              {menuBusy ? 'Exporting...' : 'Export'}
            </button>
            <div className='border-t border-gray-100 my-1' />
            <button onClick={handleDelete} className='w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-red-600 active:bg-red-50'>
              <img src='/assets/icons/trash.svg' alt='' className='w-4 h-4' />
              Delete
            </button>
          </div>
        </>
      )}

      {shareSheetOpen && (
        <>
          <div className='fixed inset-0 bg-black/40 z-40' onClick={() => setShareSheetOpen(false)} />
          <div className='fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white rounded-t-3xl z-50 p-5 pb-8 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.2)]'>
            <div className='w-10 h-1 rounded-full bg-gray-300 mx-auto mb-6' />
            <p className='text-[15px] font-bold text-gray-900 mb-4'>Share Contact</p>

            <div className='flex flex-col gap-1'>
              {[
                { onClick: shareToWhatsApp, icon: '/assets/icons/share-whatsapp.svg', label: 'WhatsApp' },
                { onClick: shareViaEmail, icon: '/assets/icons/share-email.svg', label: 'Email' },
                { onClick: shareViaSMS, icon: '/assets/icons/share-sms.svg', label: 'SMS' },
                { onClick: copyDetails, icon: '/assets/icons/share-copy.svg', label: 'Copy Details' },
              ].map((opt) => (
                <button key={opt.label} onClick={opt.onClick} className='w-full flex items-center gap-3.5 px-2.5 py-3 rounded-xl text-left active:bg-gray-50 transition-colors'>
                  <div className='w-9 h-9 rounded-full bg-sage/10 flex items-center justify-center shrink-0'>
                    <img src={opt.icon} alt='' className='w-4 h-4' />
                  </div>
                  <span className='text-[14px] font-medium text-gray-800'>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className='flex-1 px-5 pt-6 pb-12'>

        <div className='flex items-center gap-4 mb-6'>
          <div className='w-16 h-16 rounded-full bg-forest/10 ring-2 ring-forest/20 flex items-center justify-center text-forest font-bold text-[17px] shrink-0'>
            {getInitials(contact.name)}
          </div>
          <div className='min-w-0'>
            <p className='font-bold text-[17px] text-gray-900 truncate'>{contact.name}</p>
            <p className='text-[13px] text-gray-500 truncate'>{contact.designation}</p>
          </div>
        </div>

        <div className='flex gap-2.5 mb-8'>
          <QuickAction href={`tel:${contact.phone}`} icon='/assets/icons/phone.svg' label='Call' />
          <QuickAction href={`mailto:${contact.email}`} icon='/assets/icons/mail-white.svg' label='Email' />
          <QuickAction href={`https://wa.me/${contact.phone?.replace(/\D/g, '')}`} icon='/assets/icons/whatsapp.svg' label='WhatsApp' />
        </div>

        <SectionLabel>Contact Information</SectionLabel>
        <div className={`bg-white rounded-2xl mb-8 overflow-hidden ${CARD_SHADOW}`}>
          <InfoRow label='Mobile Number' value={contact.phone} />
          <InfoRow label='Website' value={contact.website} />
          <InfoRow label='Email' value={contact.email} last={true} />
        </div>

        <SectionLabel>Lead Details</SectionLabel>
        <div className={`bg-white rounded-2xl mb-8 overflow-hidden ${CARD_SHADOW}`}>
          <InfoRow label='Contact Source' value={contact.event} />
          <InfoRow label='Collected By' value={contact.collectedBy?.firstName} last={!isAdmin} />
          {isAdmin && (
            <div className='flex items-center justify-between px-4 py-3.5'>
              <span className='text-[12.5px] text-gray-500'>Assign To</span>
              <select
                value={contact.assignedTo?._id || ''}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={assigning}
                className='h-8 px-3 rounded-full text-[12.5px] font-semibold text-gray-800 bg-sage/10 border-none outline-none'
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

        {pendingReminder && (
          <>
            <div className='flex items-center justify-between mb-2.5 px-1'>
              <SectionLabel className='mb-0'>Upcoming Reminder</SectionLabel>
              <button onClick={() => markReminderComplete(pendingReminder._id)} className='h-7 px-3.5 rounded-full bg-forest text-white text-[11.5px] font-semibold active:scale-95 transition-transform'>
                Mark Complete
              </button>
            </div>
            <div className={`flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 mb-8 ${CARD_SHADOW}`}>
              <div className='flex items-center gap-2.5'>
                <span className='w-2 h-2 rounded-full bg-amber-500 shrink-0' />
                <span className='text-[13px] text-gray-800 capitalize'>
                  {pendingReminder.note || (pendingReminder.task ? pendingReminder.task.replace(/_/g, ' ') : 'Follow-up reminder')}
                </span>
              </div>
              <span className='text-[12.5px] text-gray-500 shrink-0 ml-2'>
                {formatDate(pendingReminder.dueDate)}
              </span>
            </div>
          </>
        )}

        {!showReminderForm ? (
          <button onClick={() => setShowReminderForm(true)} className='w-full h-12 rounded-2xl border-[1.5px] border-dashed border-forest/40 text-forest text-[13.5px] font-semibold mb-8 active:bg-forest/5 transition-colors'>
            + Add Reminder
          </button>
        ) : (
          <div className={`bg-white rounded-2xl p-4 mb-8 ${CARD_SHADOW}`}>
            <p className='text-[12px] font-semibold text-gray-500 mb-2'>Task</p>
            <select
              value={reminderTask}
              onChange={(e) => setReminderTask(e.target.value)}
              className='w-full h-11 rounded-xl px-3 mb-3 text-[13.5px] bg-sage/5 border border-sage/20 outline-none focus:border-forest/40 transition-colors'
            >
              <option value='call'>Call</option>
              <option value='send_quotation'>Send Quotation</option>
              <option value='schedule_meeting'>Schedule Meeting</option>
              <option value='follow-up'>Follow-up</option>
              <option value='email'>Email</option>
            </select>

            <div className='flex gap-2 mb-3'>
              <input
                type='date'
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className='flex-1 h-11 rounded-xl px-3 text-[13.5px] bg-sage/5 border border-sage/20 outline-none focus:border-forest/40 transition-colors'
              />
              <input
                type='time'
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className='flex-1 h-11 rounded-xl px-3 text-[13.5px] bg-sage/5 border border-sage/20 outline-none focus:border-forest/40 transition-colors'
              />
            </div>

            <div className='flex gap-2 mb-4'>
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  onClick={() => setReminderPriority(p)}
                  className={`flex-1 h-9 rounded-full text-[12.5px] font-semibold capitalize transition-colors ${reminderPriority === p ? 'bg-forest text-white' : 'bg-sage/10 text-gray-600'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className='flex gap-2'>
              <button onClick={() => setShowReminderForm(false)} className='flex-1 h-11 rounded-full border border-gray-200 text-gray-600 text-[13px] font-semibold active:bg-gray-50 transition-colors'>
                Cancel
              </button>
              <button
                onClick={submitReminder}
                disabled={savingReminder || !reminderDate}
                className='flex-1 h-11 rounded-full bg-forest text-white text-[13px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform'
              >
                {savingReminder ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {contact.notes?.length > 0 && (
          <>
            <SectionLabel>Notes</SectionLabel>
            <div className={`bg-white rounded-2xl px-4 py-3.5 mb-8 flex flex-col gap-2 ${CARD_SHADOW}`}>
              {contact.notes.map((n) => (
                <p key={n._id} className='text-[13px] text-gray-800 leading-relaxed'>
                  {n.content}
                </p>
              ))}
            </div>
          </>
        )}

        {contact.notes?.some((n) => n.audioUrl?.trim()) && (
          <>
            <SectionLabel>Voice Note</SectionLabel>
            <div className='flex flex-col gap-3 mb-8'>
              {contact.notes
                .filter((n) => n.audioUrl?.trim())
                .map((n) => (
                  <audio key={n._id} controls preload='metadata' className='w-full rounded-xl'>
                    <source src={n.audioUrl} type='audio/webm' />
                    Your browser does not support the audio element.
                  </audio>
                ))}
            </div>
          </>
        )}

        {contact.cardImageUrl && (
          <>
            <SectionLabel>Business Card</SectionLabel>
            <img src={contact.cardImageUrl} alt='Business card' className={`w-full rounded-2xl mb-8 ${CARD_SHADOW}`} />
          </>
        )}

        <button onClick={() => setHistoryOpen(!historyOpen)} className={`w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 mb-2 ${CARD_SHADOW}`}>
          <span className='text-[13.5px] font-semibold text-gray-700'>Activity History</span>
          <img src='/assets/icons/chevron-down.svg' alt='' className={`w-4 h-4 opacity-50 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
        </button>

        {historyOpen && (
          <div className={`bg-white rounded-2xl overflow-hidden ${CARD_SHADOW}`}>
            {activityEvents.map((event, i) => {
              const borderClass = i > 0 ? 'border-t border-sage/10' : '';
              return (
                <div key={i} className={`flex items-center justify-between px-4 py-3.5 text-[12.5px] ${borderClass}`}>
                  <span className='text-gray-500'>{formatDate(event.date)}</span>
                  <span className='text-gray-900 font-medium text-right'>
                    {event.label} <span className='text-gray-400 font-normal'>(By {event.by})</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}