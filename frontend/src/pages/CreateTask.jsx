import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PRIORITIES = ['High', 'Medium', 'Low'];

const PRIORITY_DOT = {
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Low: 'bg-sage',
};

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full h-12 rounded-xl px-4 text-[14.5px] text-gray-900 bg-white border border-sage/20 outline-none focus:border-forest/40 transition-colors';

export default function CreateTask() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignedEmployee: '',
    contact: '',
    dueDate: '',
    dueTime: '',
    notes: '',
  });
  const [employees, setEmployees] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    setLoading(true);
    try {
      const [teamRes, contactsRes] = await Promise.all([
        api.get('/admin/team'),
        api.get('/contacts', { params: { limit: 100 } }),
      ]);
      setEmployees((teamRes.data.team || []).filter((u) => u.role === 'employee'));
      setContacts(contactsRes.data.contacts || []);
    } catch (err) {
      setError('Could not load employees/contacts.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    setError('');

    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!form.assignedEmployee) {
      setError('Please select an employee to assign this task to.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description,
        priority: form.priority,
        assignedEmployee: form.assignedEmployee,
        contact: form.contact || undefined,
        dueDate: form.dueDate || undefined,
        dueTime: form.dueTime || undefined,
        notes: form.notes,
      });
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-forest animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-sage animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/tasks')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">New Task</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-5 pt-6 pb-10">
        {error && (
          <div className="bg-red-50 ring-1 ring-red-100 text-red-600 text-[13px] rounded-2xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5">
          Task Details
        </p>
        <div className="flex flex-col gap-3.5 mb-8">
          <FormField label="Title">
            <input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-[14.5px] text-gray-900 bg-white border border-sage/20 outline-none focus:border-forest/40 transition-colors resize-none"
            />
          </FormField>

          <FormField label="Assign To">
            <select
              value={form.assignedEmployee}
              onChange={(e) => handleChange('assignedEmployee', e.target.value)}
              className={inputClass}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Related Contact (optional)">
            <select
              value={form.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.company ? ` - ${c.company}` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex gap-3">
            <FormField label="Due Date">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Due Time">
              <input
                type="time"
                value={form.dueTime}
                onChange={(e) => handleChange('dueTime', e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-[14.5px] text-gray-900 bg-white border border-sage/20 outline-none focus:border-forest/40 transition-colors resize-none"
            />
          </FormField>
        </div>

        <div className="mb-8">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2.5">
            Priority
          </p>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => handleChange('priority', p)}
                className={`flex-1 h-10 rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${
                  form.priority === p ? 'bg-forest text-white' : 'bg-white text-gray-500 ring-1 ring-black/[0.03]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${form.priority === p ? 'bg-white' : PRIORITY_DOT[p]}`} />
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full h-12 rounded-full font-semibold text-[14.5px] bg-forest text-white disabled:opacity-60 active:scale-[0.98] transition-transform shadow-[0_4px_14px_-4px_rgba(64,101,80,0.5)]"
        >
          {saving ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </div>
  );
}