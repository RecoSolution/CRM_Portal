import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const RELATION_TYPES = ['Lead', 'Vendor', 'Customer', 'Partner'];
const CONTACT_SOURCES = ['GREENS 2026', 'Factory Visit', 'GCPRS 2026', 'Other'];

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

      navigate(`/contacts/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg px-5 pt-5 pb-10'>

      <div className='flex items-center justify-between mb-5'>
        <button onClick={() => navigate(`/contacts/${id}`)} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='font-bold text-[17px] text-gray-900'>Edit Contact</span>
        <div className='w-9 h-9' />
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4'>
          {error}
        </div>
      )}

      <div className='flex flex-col gap-4 mb-5'>
        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>Name</label>
          <input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>Job Title</label>
          <input
            value={form.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>Company</label>
          <input
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>Mobile No.</label>
          <input
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>Email</label>
          <input
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>Website</label>
          <input
            value={form.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>

        <div>
          <label className='block text-[13px] font-semibold text-gray-600 mb-1.5'>Address</label>
          <input
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className='w-full h-12 rounded-xl px-4 text-[15px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
        </div>
      </div>

      <div className='mb-5'>
        <p className='text-[14px] font-bold text-gray-900 mb-2.5'>Relation Type</p>
        <div className='flex gap-2 flex-wrap'>
          {RELATION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setRelationType(type)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                relationType === type ? 'bg-sage text-white' : 'bg-white/70 text-gray-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className='mb-8'>
        <p className='text-[14px] font-bold text-gray-900 mb-2.5'>Contact Source</p>
        <div className='flex gap-2 flex-wrap'>
          {CONTACT_SOURCES.map((source) => (
            <button
              key={source}
              onClick={() => setContactSource(source)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                contactSource === source ? 'bg-sage text-white' : 'bg-white/70 text-gray-500'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60'
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}