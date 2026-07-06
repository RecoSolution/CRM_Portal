import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'Today', 'Upcoming', 'Overdue', 'Completed'];

export default function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  const [task, setTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadTask();
    if (isFounder) loadEmployees();
  }, [id]);

  async function loadTask() {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
    } catch (err) {
      setError('Could not load task.');
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    try {
      const res = await api.get('/admin/team');
      setEmployees((res.data.team || []).filter((u) => u.role === 'employee'));
    } catch (err) {
      console.error('Could not load employees', err);
    }
  }

  async function loadHistory() {
    try {
      const res = await api.get(`/tasks/${id}/history`);
      setHistory(res.data.history || []);
      setShowHistory(true);
    } catch (err) {
      console.error('Could not load history', err);
    }
  }

  async function updateStatus(status) {
    setBusy(true);
    try {
      const res = await api.put(`/tasks/${id}/status`, { status });
      setTask(res.data.task);
    } catch (err) {
      setError('Could not update status.');
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/tasks/${id}/notes`, { note: noteText });
      setTask(res.data.task);
      setNoteText('');
    } catch (err) {
      setError('Could not add note.');
    } finally {
      setBusy(false);
    }
  }

  async function reassign(employeeId) {
    if (!employeeId) return;
    setBusy(true);
    try {
      const res = await api.put(`/tasks/${id}/assign`, {
        assignedEmployee: employeeId,
      });
      setTask(res.data.task);
    } catch (err) {
      setError('Could not reassign task.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask() {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/tasks');
    } catch (err) {
      setError('Could not delete task.');
      setBusy(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function statusColor(status) {
    if (status === 'Overdue') return 'bg-red-100 text-red-600';
    if (status === 'Today') return 'bg-forest/10 text-forest';
    if (status === 'Upcoming') return 'bg-sage/10 text-sage';
    if (status === 'Completed') return 'bg-gray-100 text-gray-500';
    return 'bg-amber-100 text-amber-700';
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
      <div className='bg-sage flex items-center justify-between px-5 h-14 shrink-0'>
        <button
          onClick={() => navigate('/tasks')}
          className='w-9 h-9 flex items-center justify-center -ml-1'
        >
          <img
            src='/assets/icons/arrow-left.svg'
            alt='back'
            className='w-5 h-5'
          />
        </button>
        <span className='text-white font-semibold text-[16px]'>
          Task Details
        </span>
        <div className='w-9 h-9' />
      </div>

      <div className='flex-1 px-5 pt-6 pb-10 overflow-y-auto'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4'>
            {error}
          </div>
        )}

        {/* Title + priority card */}
        <div className='bg-white rounded-2xl p-4 flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3 min-w-0'>
            <img
              src='/assets/icons/task-clipboard.svg'
              alt=''
              className='w-5 h-5 shrink-0'
            />
            <h1 className='text-[15px] font-bold text-gray-900 truncate'>
              {task.title}
            </h1>
          </div>
          <span className='text-[12px] font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600 shrink-0 ml-2'>
            {task.priority} Priority
          </span>
        </div>

        {/* Contact card */}
        {task.contact && (
          <div className='bg-white rounded-2xl p-4 flex items-center gap-3 mb-4'>
            <div className='w-11 h-11 rounded-full bg-sage/60 flex items-center justify-center text-white font-bold text-[13px] shrink-0'>
              {task.contact.name
                ?.split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-[14px] font-bold text-gray-900 truncate'>
                {task.contact.name}
              </p>
              {task.contact.company && (
                <p className='text-[12px] font-semibold text-gray-700 truncate'>
                  {task.contact.company}
                </p>
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

        {/* Task schedule */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>
          Task Schedule
        </p>
        <div className='bg-white rounded-2xl mb-4 flex divide-x divide-gray-200'>
          <div className='flex-1 p-4'>
            <p className='text-[12px] text-gray-500 mb-1'>Date</p>
            <p className='text-[14px] font-bold text-gray-900'>
              {formatDate(task.dueDate)}
            </p>
          </div>
          <div className='flex-1 p-4'>
            <p className='text-[12px] text-gray-500 mb-1'>Time</p>
            <p className='text-[14px] font-bold text-gray-900'>
              {task.dueTime || '—'}
            </p>
          </div>
        </div>

        {/* Assigned/created-by meta */}
        <div className='flex flex-col gap-1 mb-5 text-[12px] text-gray-500'>
          {task.assignedEmployee && (
            <span>
              Assigned to: {task.assignedEmployee.firstName}{' '}
              {task.assignedEmployee.lastName}
            </span>
          )}
          {task.createdBy && (
            <span>
              Created by: {task.createdBy.firstName} {task.createdBy.lastName}
            </span>
          )}
        </div>

        {/* Note */}
        <p className='text-[14px] font-bold text-gray-900 mb-2'>Note</p>
        {task.notes && (
          <p className='text-[13px] text-gray-700 bg-white rounded-2xl px-4 py-3 mb-2 whitespace-pre-line'>
            {task.notes}
          </p>
        )}
        <div className='flex gap-2 mb-6'>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder='Add a note...'
            className='flex-1 h-11 rounded-xl px-3 text-[14px] text-gray-900 bg-white border border-forest/30 outline-none'
          />
          <button
            onClick={addNote}
            disabled={busy || !noteText.trim()}
            className='h-11 px-4 rounded-xl bg-forest text-white text-[13px] font-semibold disabled:opacity-60'
          >
            Add
          </button>
        </div>

        {/* Actions */}
        <p className='text-[14px] font-bold text-gray-900 text-center mb-3'>
          Actions
        </p>
        <div className='flex gap-2 mb-6'>
          {task.status !== 'Completed' && (
            <button
              onClick={() => updateStatus('Completed')}
              disabled={busy}
              className='flex-1 h-10 rounded-full bg-forest text-white text-[12px] font-semibold disabled:opacity-60'
            >
              Mark as Completed
            </button>
          )}
          {isFounder && (
            <button
              onClick={() => navigate(`/tasks/${id}/edit`)}
              className='flex-1 h-10 rounded-full bg-sage/70 text-white text-[12px] font-semibold'
            >
              Edit Task
            </button>
          )}
          {task.status !== 'Completed' && (
            <button
              onClick={() => navigate(`/tasks/${id}/reschedule`)}
              className='flex-1 h-10 rounded-full bg-sage/70 text-white text-[12px] font-semibold'
            >
              Reschedule
            </button>
          )}
        </div>

        {/* Activity history accordion */}
        <div className='bg-white rounded-2xl mb-5 overflow-hidden'>
          <button
            onClick={() =>
              showHistory ? setShowHistory(false) : loadHistory()
            }
            className='w-full flex items-center justify-between px-4 py-3.5'
          >
            <span className='text-[14px] font-semibold text-gray-500'>
              Activity History
            </span>
            <img
              src='/assets/icons/chevron-down.svg'
              alt=''
              className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}
            />
          </button>
          {showHistory && (
            <div className='divide-y divide-gray-100 border-t border-gray-100'>
              {history.map((h, i) => (
                <div
                  key={i}
                  className='px-4 py-3 flex items-center justify-between gap-3'
                >
                  <span className='text-[12px] text-gray-500 shrink-0'>
                    {formatDate(h.timestamp)}
                  </span>
                  <span className='text-[13px] text-gray-800 text-right'>
                    {h.detail}{' '}
                    <span className='text-gray-400'>
                      (By {h.performedBy?.firstName})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Founder: delete */}
        {isFounder && (
          <button
            onClick={deleteTask}
            disabled={busy}
            className='w-full h-12 rounded-full font-semibold text-[15px] border-[1.5px] border-red-500 text-red-500 disabled:opacity-60'
          >
            Delete Task
          </button>
        )}
      </div>
    </div>
  );
}
