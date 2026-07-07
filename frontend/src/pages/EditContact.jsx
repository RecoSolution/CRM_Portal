import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const RELATION_TYPES = ['Lead', 'Vendor', 'Customer', 'Partner'];
const CONTACT_SOURCES = ['GREENS 2026', 'Factory Visit', 'GCPRS 2026', 'Other'];
const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

const FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Mobile No.' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
  { key: 'address', label: 'Address' },
];

function FormField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-gray-500 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full h-12 rounded-xl px-4 text-[14.5px] text-gray-900 bg-white border border-sage/20 outline-none focus:border-forest/40 transition-colors"
      />
    </div>
  );
}

function ChipGroup({ title, options, selected, onSelect }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5">{title}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((option) => {
          const cls = `h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
            selected === option ? 'bg-forest text-white' : `bg-white text-gray-500 ${CARD_SHADOW}`
          }`;
          return (
            <button key={option} onClick={() => onSelect(option)} className={cls}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditContactSkeleton() {
  return (
    <div className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-3.5">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-white/70 animate-pulse" />
      ))}
    </div>
  );
}

export default function EditContact() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: '', jobTitle: '', company: '', phone: '', email: '', website: '', address: '',
  });
  const [relationType, setRelationType] = useState('');
  const [contactSource, setContactSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContact();
  }, [id]);

  async function fetchContact() {
    setLoading(true);
    try {
      const res = await api.get(`/contacts/${id}`);
      const c = res.data.contact;
      setForm({
        name: c.name || '',
        jobTitle: c.designation || '',
        company: c.company || '',
        phone: c.phone || '',
        email: c.email || '',
        website: c.website || '',
        address: c.address || '',
      });
      setRelationType(c.relationshipType ? c.relationshipType[0].toUpperCase() + c.relationshipType.slice(1) : '');
      setContactSource(c.event || '');
    } catch (err) {
      setError('Could not load contact details.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      await api.put(`/contacts/${id}`, {
        name: form.name,
        designation: form.jobTitle,
        company: form.company,
        phone: form.phone,
        email: form.email,
        website: form.website,
        address: form.address,
        relationshipType: relationType ? relationType.toLowerCase() : undefined,
        event: contactSource || undefined,
      });

      // replace: true swaps this history entry instead of stacking a new
      // one, so the back button on the detail page returns to the list,
      // not back into this edit form.
      navigate(`/contacts/${id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="bg-gradient-to-br from-sage to-forest flex items-center justify-between px-5 h-16 shrink-0 rounded-b-[28px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
        </button>
        <span className="font-semibold text-[16px] text-white">Edit Contact</span>
        <div className="w-9 h-9" />
      </div>

      {loading ? (
        <EditContactSkeleton />
      ) : (
        <div className="flex-1 px-5 pt-6 pb-10 flex flex-col gap-8">

          {error && (
            <div className="bg-red-50 ring-1 ring-red-100 text-red-600 text-[13px] rounded-2xl px-4 py-3 -mb-3">
              {error}
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5">
              Contact Details
            </p>
            <div className="flex flex-col gap-3.5">
              {FIELDS.map((field) => (
                <FormField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              ))}
            </div>
          </div>

          <ChipGroup title="Relation Type" options={RELATION_TYPES} selected={relationType} onSelect={setRelationType} />

          <ChipGroup title="Contact Source" options={CONTACT_SOURCES} selected={contactSource} onSelect={setContactSource} />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-full font-semibold text-[14.5px] bg-forest text-white disabled:opacity-60 active:scale-[0.98] transition-transform shadow-[0_4px_14px_-4px_rgba(64,101,80,0.4)]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}