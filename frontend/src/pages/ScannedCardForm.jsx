import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getDraft, setDraft, clearDraft } from '../utils/scanDraftStore';

const RELATION_TYPES = ['Lead', 'Vendor', 'Customer', 'Partner'];
const CONTACT_SOURCES = ['GREENS 2026', 'Factory Visit', 'GCPRS 2026', 'Other'];

export default function ScannedCardForm() {
  const navigate = useNavigate();

  const [capturedImage] = useState(() => getDraft().imageData);
  const [cardImageUrl, setCardImageUrl] = useState('');

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
  const [relationType, setRelationType] = useState(
    () => getDraft().relationType || '',
  );
  const [contactSource, setContactSource] = useState(
    () => getDraft().contactSource || '',
  );
  const [collectedBy, setCollectedBy] = useState(
    () => getDraft().collectedBy || '',
  );

  // notes is initialized ONCE from whatever is in the draft at first mount.
  // After that, it is the single source of truth - we never re-read
  // getDraft().notes again, and we consume voiceTranscript directly
  // into this state below, every render, with no dependency-array gating.
  const [notes, setNotes] = useState(() => getDraft().notes || '');

  const [voiceBlob, setVoiceBlob] = useState(
    () => getDraft().voiceBlob || null,
  );
  const [reminder, setReminder] = useState(() => getDraft().reminder || null);
  const [extracting, setExtracting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef(null);

  // ── Consume voice transcript - runs on EVERY render, no deps array.
  //    This guarantees it can never be missed due to remount/effect-timing
  //    issues. It's safe to run every render because it checks for a
  //    non-empty value and immediately clears it from the draft after
  //    consuming, so it only ever fires its body once per actual recording. ──
  const draftNow = getDraft();
  if (draftNow.voiceTranscript) {
    const incoming = draftNow.voiceTranscript;
    setDraft({ voiceTranscript: '' }); // consume immediately, before any async gap

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

  // ── Run OCR + extraction ONCE per scan ──
  useEffect(() => {
    const d = getDraft();

    if (d.extractedContact) {
      setForm(d.extractedContact);
      setCardImageUrl(d.cardImageUrl || '');
      setExtracting(false);
      return;
    }

    if (!capturedImage) {
      setExtracting(false);
      return;
    }

    async function extract() {
      try {
        const blob = await (await fetch(capturedImage)).blob();
        const formData = new FormData();
        formData.append('card', blob, 'card.jpg');

        const res = await api.post('/scan/ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setRawText(res.data.rawText || '');
        setCardImageUrl(res.data.cardImageUrl || '');
        setDraft({ cardImageUrl: res.data.cardImageUrl || '' });

        const c = res.data.extractedContact;
        const extracted = {
          name: c.name || '',
          jobTitle: c.designation || '',
          company: c.company || '',
          phone: c.phone || '',
          phone2: c.phone2 || '',
          email: c.email || '',
          website: c.website || '',
          address: c.address || '',
        };

        setForm(extracted);
        setDraft({ extractedContact: extracted });
      } catch (err) {
        setError('Could not read card automatically. Please fill in manually.');
      } finally {
        setExtracting(false);
      }
    }
    extract();
  }, []);

  // ── Handle back-side scan: OCR it separately, merge into existing form ──
  useEffect(() => {
    const d = getDraft();
    if (!d.isBackSideScan || !d.backImageData) return;

    async function extractBackSide() {
      setExtracting(true);
      try {
        const blob = await (await fetch(d.backImageData)).blob();
        const formData = new FormData();
        formData.append('card', blob, 'card-back.jpg');

        const res = await api.post('/scan/ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const c = res.data.extractedContact;

        setForm((prev) => {
          const merged = {
            name: prev.name || c.name || '',
            jobTitle: prev.jobTitle || c.designation || '',
            company: prev.company || c.company || '',
            phone: prev.phone || c.phone || '',
            phone2: prev.phone2 || c.phone2 || '',
            email: prev.email || c.email || '',
            website: prev.website || c.website || '',
            address: prev.address || c.address || '',
          };
          setDraft({ extractedContact: merged });
          return merged;
        });

        setRawText((prev) =>
          prev
            ? `${prev}\n\n--- BACK SIDE ---\n${res.data.rawText || ''}`
            : res.data.rawText || '',
        );
      } catch (err) {
        setError(
          'Could not read the back side automatically. You can fill in any missing fields manually.',
        );
      } finally {
        setExtracting(false);
        setDraft({ isBackSideScan: false, backImageData: null });
      }
    }

    extractBackSide();
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

  // ── Keep draft in sync with live edits ──
  useEffect(() => {
    if (!extracting) {
      setDraft({ extractedContact: form });
    }
  }, [form]);

  useEffect(() => {
    setDraft({ relationType, contactSource, collectedBy });
  }, [relationType, contactSource, collectedBy]);

  // Sync notes to draft on every manual edit too (typing in the textarea)
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

  async function handleSave() {
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
        cardImageUrl: cardImageUrl || undefined,
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
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg px-5 pt-5 pb-10'>
      <button
        onClick={() => navigate('/home')}
        className='w-10 h-10 flex items-center justify-center -ml-2 mb-3'
      >
        <img
          src='/assets/icons/arrow-left.svg'
          alt='back'
          className='w-5 h-5'
        />
      </button>

      <div className='relative rounded-2xl border-2 border-forest/30 overflow-hidden mb-4 bg-white'>
        {capturedImage ? (
          <img
            src={capturedImage}
            alt='Scanned card'
            className='w-full h-auto object-contain'
          />
        ) : (
          <div className='aspect-[16/9] flex items-center justify-center text-gray-400 text-sm'>
            No image captured
          </div>
        )}
        {extracting && (
          <div className='absolute inset-0 bg-white/80 flex items-center justify-center gap-2'>
            <div className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce' style={{ animationDelay: '0ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce' style={{ animationDelay: '150ms' }} />
          <span className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce' style={{ animationDelay: '300ms' }} />
        </div>
            <span className='text-[13px] font-medium text-gray-700'>
              Reading card...
            </span>
          </div>
        )}
      </div>

      {rawText && (
        <button
          onClick={() => setShowRawText(!showRawText)}
          className='text-[12px] text-gray-500 underline mb-3'
        >
          {showRawText ? 'Hide' : 'Show'} raw scanned text (for verification)
        </button>
      )}
      {showRawText && (
        <pre className='text-[11px] text-gray-600 bg-white/60 rounded-xl p-3 mb-4 whitespace-pre-wrap'>
          {rawText}
        </pre>
      )}

      <div className='flex gap-3 mb-6'>
        <button
          onClick={() => navigate('/scan')}
          className='flex-1 h-11 rounded-full bg-sage/40 text-gray-800 font-semibold text-[13px] flex items-center justify-center gap-2'
        >
          <img src='/assets/icons/rescan.svg' alt='' className='w-4 h-4' />
          Rescan
        </button>
        <button
          onClick={() => navigate('/scan', { state: { backSide: true } })}
          className='flex-1 h-11 rounded-full bg-forest text-white font-semibold text-[13px] flex items-center justify-center gap-2'
        >
          <img src='/assets/icons/plus-circle.svg' alt='' className='w-4 h-4' />
          Capture Back Side
        </button>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4'>
          {error}
        </div>
      )}

      <div className='flex flex-col gap-4 mb-2'>
        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Job Title
          </label>
          <input
            value={form.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Company
          </label>
          <input
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Mobile No.
          </label>
          <input
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Email
          </label>
          <input
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Mobile No. 2 (optional)
          </label>
          <input
            value={form.phone2}
            onChange={(e) => handleChange('phone2', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Website
          </label>
          <input
            value={form.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>
            Address
          </label>
          <input
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>
      </div>

      <div className='mb-5'>
        <p className='text-[14px] font-bold text-gray-900 mb-2.5'>
          Relation Type
        </p>
        <div className='flex gap-2 flex-wrap'>
          {RELATION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setRelationType(type)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                relationType === type
                  ? 'bg-sage text-white'
                  : 'bg-white/70 text-gray-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className='mb-5'>
        <p className='text-[14px] font-bold text-gray-900 mb-2.5'>
          Contact Source
        </p>
        <div className='flex gap-2 flex-wrap'>
          {CONTACT_SOURCES.map((source) => (
            <button
              key={source}
              onClick={() => setContactSource(source)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                contactSource === source
                  ? 'bg-sage text-white'
                  : 'bg-white/70 text-gray-500'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <div className='mb-5'>
        <p className='text-[14px] font-bold text-gray-900 mb-2.5'>
          Collected By
        </p>
        <input
          value={collectedBy}
          onChange={(e) => setCollectedBy(e.target.value)}
          placeholder='Collected by'
          className='w-full h-11 rounded-xl px-4 text-[14px] text-gray-900 bg-white/70 border-none outline-none'
        />
      </div>

      <div className='mb-5'>
        <div className='flex items-center justify-between mb-2.5'>
          <p className='text-[14px] font-bold text-gray-900'>Notes</p>
          {!voiceBlob && (
            <button
              onClick={() => navigate('/voice-note')}
              className='h-9 px-4 rounded-full bg-forest text-white text-[13px] font-semibold flex items-center gap-1.5'
            >
              <img src='/assets/icons/mic.svg' alt='' className='w-4 h-4' />
              Voice Note
            </button>
          )}
        </div>

        {voiceBlob && (
          <div className='flex items-center gap-3 bg-sage rounded-2xl px-4 py-3.5 mb-3'>
            <button
              onClick={toggleVoicePlayback}
              className='w-9 h-9 rounded-full bg-white/30 flex items-center justify-center shrink-0'
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

            <div className='flex-1 h-1.5 bg-white/40 rounded-full overflow-hidden'>
              <div
                className='h-full bg-white rounded-full transition-all'
                style={{ width: `${playbackProgress}%` }}
              />
            </div>

            <button
              type='button'
              onClick={removeVoiceNote}
              className='w-8 h-8 rounded-full bg-white/30 flex items-center justify-center shrink-0'
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
          className='w-full rounded-xl px-4 py-3 text-[14px] text-gray-900 bg-white/70 border-none outline-none resize-none'
        />
      </div>

      <div className='flex items-center justify-between mb-8'>
        <p className='text-[14px] font-bold text-gray-900'>Set Reminder</p>
        <button
          onClick={() => navigate('/set-reminder')}
          className={`h-9 px-4 rounded-full text-[13px] font-semibold flex items-center gap-1.5 ${
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
          {reminder ? 'Remind Set' : 'Remind'}
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || extracting}
        className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60'
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
