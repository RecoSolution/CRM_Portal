import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getDraft, setDraft, clearDraft } from '../utils/scanDraftStore';

const RELATION_TYPES = ['Lead', 'Vendor', 'Customer', 'Partner'];
const CONTACT_SOURCES = ['GREENS 2026', 'Factory Visit', 'GCPRS 2026', 'Other'];

const FORM_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'company', label: 'Company', required: true },
  { key: 'phone', label: 'Mobile No.' },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone2', label: 'Mobile No. 2', optional: true },
  { key: 'website', label: 'Website' },
  { key: 'address', label: 'Address' },
];

const AUTHORIZED_FOUNDER_EMAILS = [
  'pranav.desai@recosolution.com',
  'deep.bhuva@recosolution.com',
];

function Header({ onBack }) {
  return (
    <div className='bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10'>
      <div className='flex items-center justify-between'>
        <button
          onClick={onBack}
          className='w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors'
        >
          <img
            src='/assets/icons/arrow-left.svg'
            alt='back'
            className='w-5 h-5 brightness-0 invert'
          />
        </button>
        <span className='text-white font-semibold text-[16px]'>
          New Contact
        </span>
        <div className='w-9 h-9' />
      </div>
    </div>
  );
}

// Manual entry uses the same draft store as the scan flow — needed so
// the "Voice Note" and "Set Reminder" sub-pages (which write into
// scanDraftStore) can round-trip back into this form the same way they
// do for the scanned flow. Cleared on mount so a leftover scan draft
// never bleeds into a fresh manual entry, and cleared again on save.
export default function ManualContactForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    jobTitle: '',
    company: '',
    phone: '',
    phone2: '',
    email: '',
    website: '',
    address: '',
  });
  const [relationType, setRelationType] = useState('');
  const [contactSource, setContactSource] = useState('');

  const [collectedBy, setCollectedBy] = useState('');
  const [founders, setFounders] = useState([]);

  const [notes, setNotes] = useState('');
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [reminder, setReminder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef(null);

  // Fresh draft on entering this page — this is a brand-new manual
  // contact, not a continuation of any prior scan session.
  useEffect(() => {
    clearDraft();
  }, []);

  // ── Consume voice transcript / voiceBlob / reminder coming back from
  //    their respective sub-pages, same pattern as the scanned form. ──
  const draftNow = getDraft();
  if (draftNow.voiceTranscript) {
    const incoming = draftNow.voiceTranscript;
    setDraft({ voiceTranscript: '' });

    setNotes((prev) => {
      const merged = prev && prev.trim() ? `${prev}\n${incoming}` : incoming;
      setDraft({ notes: merged });
      return merged;
    });
  }
  if (draftNow.voiceBlob && !voiceBlob) {
    setVoiceBlob(draftNow.voiceBlob);
  }
  if (draftNow.reminder && !reminder) {
    setReminder(draftNow.reminder);
  }

  // ── Founders list for the Collected By dropdown ──
  useEffect(() => {
    async function loadFounders() {
      try {
        const res = await api.get('/admin/team');
        const team = res.data.team || [];
        const list = team.filter((u) =>
          AUTHORIZED_FOUNDER_EMAILS.includes(u.email?.toLowerCase()),
        );
        setFounders(list);

        setCollectedBy((prev) => {
          if (list.some((f) => f._id === prev)) return prev;
          const matchingSelf = list.find((f) => f._id === user?._id);
          return matchingSelf?._id || list[0]?._id || prev;
        });
      } catch (err) {
        console.error('Could not load founders', err);
      }
    }
    loadFounders();
  }, []);

  useEffect(() => {
    if (voiceBlob) {
      const url = URL.createObjectURL(voiceBlob);
      setVoiceAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVoiceAudioUrl(null);
    }
  }, [voiceBlob]);

  // ── Keep draft in sync so Voice Note / Set Reminder sub-pages can
  //    round-trip back into this same form state. ──
  useEffect(() => {
    setDraft({ relationType, contactSource, collectedBy });
  }, [relationType, contactSource, collectedBy]);

  useEffect(() => {
    setDraft({ notes });
  }, [notes]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleVoicePlayback() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function handleAudioTimeUpdate() {
    if (!audioRef.current?.duration) return;
    const progress =
      (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setPlaybackProgress(progress);
  }

  function removeVoiceNote() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    setVoiceBlob(null);
    setDraft({ voiceBlob: null });
  }

  // Basic email format check — kept simple on purpose, just enough to
  // catch obvious typos before hitting the API.
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.company.trim()) {
      setError('Company is required.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!contactSource) {
      setError('Contact Source is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let audioUrl = '';
      if (voiceBlob) {
        const audioFormData = new FormData();
        audioFormData.append('audio', voiceBlob, 'voice-note.webm');
        const audioRes = await api.post('/scan/upload-voice', audioFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        audioUrl = audioRes.data.audioUrl;
      }

      const res = await api.post('/contacts', {
        name: form.name,
        designation: form.jobTitle,
        company: form.company,
        phone: form.phone,
        email: form.email,
        website: form.website,
        address: form.address,
        relationshipType: relationType ? relationType.toLowerCase() : undefined,
        event: contactSource || undefined,
        collectedBy: collectedBy || undefined,
        notes: notes
          ? [{ content: notes, type: voiceBlob ? 'voice' : 'text', audioUrl }]
          : [],
      });

      const contactId = res.data.contact._id;

      if (reminder) {
        await api.post(`/contacts/${contactId}/reminders`, reminder);
      }

      clearDraft();
      navigate(`/contacts/${contactId}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not save contact. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>
      <Header onBack={() => navigate('/home')} />

      <div className='flex-1 px-5 pt-5 pb-10'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3 mb-5'>
            {error}
          </div>
        )}

        <p className='text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1'>
          Contact Details
        </p>
        <div className='bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-4 mb-6'>
          {FORM_FIELDS.map((field) => (
            <div key={field.key}>
              <label className='block text-[12px] font-medium text-gray-500 mb-1.5'>
                {field.label}
                {field.required && <span className='text-red-500'> *</span>}
                {field.optional && (
                  <span className='text-gray-400'> (optional)</span>
                )}
              </label>
              <input
                value={form[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                type={field.key === 'email' ? 'email' : 'text'}
                className='w-full h-11 rounded-xl px-3.5 text-[14.5px] text-gray-900 bg-bg outline-none'
              />
            </div>
          ))}
        </div>

        <div className='mb-6'>
          <p className='text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1'>
            Relation Type
          </p>
          <div className='flex gap-2 flex-wrap'>
            {RELATION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setRelationType(type)}
                className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
                  relationType === type
                    ? 'bg-forest text-white'
                    : 'bg-white text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className='mb-6'>
          <p className='text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1'>
            Contact Source<span className='text-red-500'> *</span>
          </p>
          <div className='flex gap-2 flex-wrap'>
            {CONTACT_SOURCES.map((source) => (
              <button
                key={source}
                onClick={() => setContactSource(source)}
                className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
                  contactSource === source
                    ? 'bg-forest text-white'
                    : 'bg-white text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        {founders.length > 0 && (
          <div className='mb-6'>
            <p className='text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1'>
              Collected By
            </p>
            <select
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              className='w-full h-11 rounded-2xl px-4 text-[14px] text-gray-900 bg-white border-none outline-none shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
            >
              {founders.map((founder) => (
                <option key={founder._id} value={founder._id}>
                  {founder.firstName} {founder.lastName}
                  {founder._id === user?._id ? ' (You)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className='mb-6'>
          <div className='flex items-center justify-between mb-2.5 px-1'>
            <p className='text-[12px] font-semibold text-gray-400 uppercase tracking-wide'>
              Notes
            </p>
            {!voiceBlob && (
              <button
                onClick={() => navigate('/voice-note')}
                className='h-8 px-3.5 rounded-full bg-forest text-white text-[12.5px] font-semibold flex items-center gap-1.5 active:scale-[0.97] transition-transform'
              >
                <img
                  src='/assets/icons/mic.svg'
                  alt=''
                  className='w-3.5 h-3.5'
                />
                Voice Note
              </button>
            )}
          </div>

          {voiceBlob && (
            <div className='flex items-center gap-3 bg-sage rounded-2xl px-4 py-3.5 mb-3'>
              <button
                onClick={toggleVoicePlayback}
                className='w-9 h-9 rounded-full bg-white/25 flex items-center justify-center shrink-0'
              >
                <img
                  src={
                    isPlaying
                      ? '/assets/icons/pause.svg'
                      : '/assets/icons/play.svg'
                  }
                  alt={isPlaying ? 'pause' : 'play'}
                  className='w-4 h-4'
                />
              </button>

              <div className='flex-1 h-1.5 bg-white/35 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-white rounded-full transition-all'
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>

              <button
                type='button'
                onClick={removeVoiceNote}
                className='w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shrink-0'
              >
                <img
                  src='/assets/icons/close.svg'
                  alt='remove'
                  className='w-4 h-4'
                />
              </button>

              <audio
                ref={audioRef}
                src={voiceAudioUrl}
                onEnded={() => {
                  setIsPlaying(false);
                  setPlaybackProgress(0);
                }}
                onTimeUpdate={handleAudioTimeUpdate}
                className='hidden'
              />
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder='Add any additional notes...'
            className='w-full rounded-2xl px-4 py-3.5 text-[14px] text-gray-900 bg-white border-none outline-none resize-none shadow-[0_1px_3px_rgba(0,0,0,0.06)] placeholder:text-gray-400'
          />
        </div>

        <div className='flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'>
          <p className='text-[14px] font-semibold text-gray-900'>
            Set Reminder
          </p>
          <button
            onClick={() => navigate('/set-reminder')}
            className={`h-9 px-4 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 active:scale-[0.97] transition-transform ${
              reminder
                ? 'border-[1.5px] border-forest text-forest bg-transparent'
                : 'bg-forest text-white'
            }`}
          >
            <img
              src={
                reminder
                  ? '/assets/icons/check-circle.svg'
                  : '/assets/icons/bell.svg'
              }
              alt=''
              className='w-4 h-4'
            />
            {reminder ? 'Reminder Set' : 'Remind'}
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60 active:scale-[0.99] transition-transform'
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}