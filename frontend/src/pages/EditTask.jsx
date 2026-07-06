import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const PRIORITIES = ['High', 'Medium', 'Low'];

export default function EditTask() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedEmployee, setAssignedEmployee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [taskRes, teamRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get('/admin/team'),
      ]);
      const t = taskRes.data.task;
      setTask(t);
      setTitle(t.title || '');
      setPriority(t.priority || 'Medium');
      setAssignedEmployee(t.assignedEmployee?._id || '');
      setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : '');
      setDueTime(t.dueTime || '');
      setEmployees((teamRes.data.team || []).filter((u) => u.role === 'employee'));
    } catch (err) {
      setError('Could not load task.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Task name is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.put(`/tasks/${id}`, {
        title,
        priority,
        assignedEmployee,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        reason,
      });
      navigate(`/tasks/${id}`);
    } catch (err) {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !task) {
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

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>

      {/* Header */}
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button onClick={() => navigate(`/tasks/${id}`)} className='w-9 h-9 flex items-center justify-center -ml-1'>
          <img src='/assets/icons/arrow-left.svg' alt='back' className='w-5 h-5' />
        </button>
        <span className='text-white font-semibold text-[16px]'>Edit Task</span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-6 pb-10 overflow-y-auto'>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4'>
            {error}
          </div>
        )}

        {/* Task Name + Priority */}
        <div className='bg-white rounded-2xl p-4 flex items-start gap-3 mb-4'>
          <div className='w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center shrink-0 mt-0.5'>
            <img src='/assets/icons/task-clipboard.svg' alt='' className='w-5 h-5' />
          </div>
          <div className='flex-1'>
            <label className='block text-[12px] text-gray-500 mb-1'>Task Name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='w-full text-[15px] font-bold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-forest/30 pb-1'
            />
          </div>
          <div className='shrink-0'>
            <label className='block text-[12px] text-gray-500 mb-1'>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className='h-9 rounded-full px-3 text-[13px] font-medium bg-gray-100 border-none outline-none'
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact card */}
        {task.contact && (
          <div className='bg-white rounded-2xl p-4 flex items-center gap-3 mb-4'>
            <div className='w-11 h-11 rounded-full bg-sage/60 flex items-center justify-center text-white font-bold text-[13px] shrink-0'>
              {task.contact.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-[14px] font-bold text-gray-900 truncate'>{task.contact.name}</p>
              {task.contact.company && (
                <p className='text-[12px] font-semibold text-gray-700 truncate'>{task.contact.company}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/contacts/${task.contact._id}`)}
              className='h-9 px-4 rounded-full border-[1.5px] border-forest text-forest text-[12px] font-semibold shrink-0'
            >
              View Contact
            </button>
          </div>
        )}

        {/* Assign To */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>Assign To</p>
        <select
          value={assignedEmployee}
          onChange={(e) => setAssignedEmployee(e.target.value)}
          className='w-full h-12 rounded-2xl px-4 mb-6 text-[14px] text-gray-900 bg-white border-none outline-none'
        >
          <option value=''>Select employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>

        {/* New Schedule */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>New Schedule</p>
        <div className='flex gap-3 mb-6'>
          <div className='flex-1'>
            <label className='block text-[12px] text-gray-500 mb-1.5'>New Date</label>
            <input
              type='date'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className='w-full h-12 rounded-xl px-3 text-[14px] text-gray-900 bg-white border border-forest/30 outline-none'
            />
          </div>
          <div className='flex-1'>
            <label className='block text-[12px] text-gray-500 mb-1.5'>New Time</label>
            <input
              type='time'
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className='w-full h-12 rounded-xl px-3 text-[14px] text-gray-900 bg-white border border-forest/30 outline-none'
            />
          </div>
        </div>

        {/* Reason */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>
          Reason for Rescheduling <span className='font-normal text-gray-400'>(Optional)</span>
        </p>
        <div className='bg-white rounded-2xl mb-8 relative'>
          <textarea
            value={reason}
            onChange={(e) => e.target.value.length <= 200 && setReason(e.target.value)}
            rows={3}
            className='w-full rounded-2xl px-4 py-3 text-[14px] text-gray-800 bg-transparent outline-none resize-none'
          />
          <span className='absolute bottom-2 right-3 text-[11px] text-gray-400'>{reason.length}/200</span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className='w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60'
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}