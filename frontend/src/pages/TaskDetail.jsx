import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'Today', 'Upcoming', 'Overdue', 'Completed'];

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

function Header({ onBack }) {
  return (
    <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
        </button>
        <span className="text-white font-semibold text-[16px]">Task Details</span>
        <div className="w-9 h-9" />
      </div>
    </div>
  );
}

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
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
        <Header onBack={() => navigate('/tasks')} />
        <div className="flex-1 px-5 pt-7">
          <div className="flex flex-col gap-3">
            <div className="h-[60px] rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-[76px] rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-[80px] rounded-2xl bg-white/70 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
      <Header onBack={() => navigate('/tasks')} />

      <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-sage/15 flex items-center justify-center shrink-0">
              <img src="/assets/icons/task-clipboard.svg" alt="" className="w-4 h-4" />
            </div>
            <h1 className="text-[15.5px] font-bold text-gray-900 leading-snug pt-1.5">{task.title}</h1>
          </div>
          <div className="flex items-center gap-2 pl-[46px]">
            <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {task.priority} Priority
            </span>
            {task.status && (
              <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${statusColor(task.status)}`}>
                {task.status}
              </span>
            )}
          </div>
        </div>

        {task.contact && (
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="w-11 h-11 rounded-full bg-sage flex items-center justify-center text-white font-bold text-[13px] shrink-0">
              {getInitials(task.contact.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900 truncate">{task.contact.name}</p>
              {task.contact.company && (
                <p className="text-[12px] font-semibold text-gray-500 truncate">{task.contact.company}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/contacts/${task.contact._id}`)}
              className="h-9 px-4 rounded-full border-[1.5px] border-forest text-forest text-[12px] font-semibold shrink-0 active:scale-[0.97] transition-transform"
            >
              View Contact
            </button>
          </div>
        )}

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Task Schedule
        </p>
        <div className="bg-white rounded-2xl mb-4 flex divide-x divide-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex-1 p-4">
            <p className="text-[12px] text-gray-500 mb-1">Date</p>
            <p className="text-[14px] font-bold text-gray-900">{formatDate(task.dueDate)}</p>
          </div>
          <div className="flex-1 p-4">
            <p className="text-[12px] text-gray-500 mb-1">Time</p>
            <p className="text-[14px] font-bold text-gray-900">{task.dueTime || '—'}</p>
          </div>
        </div>

        {(task.assignedEmployee || task.createdBy) && (
          <div className="flex flex-col gap-1 mb-6 px-1 text-[12px] text-gray-500">
            {task.assignedEmployee && (
              <span>
                Assigned to: <span className="text-gray-700 font-medium">{task.assignedEmployee.firstName} {task.assignedEmployee.lastName}</span>
              </span>
            )}
            {task.createdBy && (
              <span>
                Created by: <span className="text-gray-700 font-medium">{task.createdBy.firstName} {task.createdBy.lastName}</span>
              </span>
            )}
          </div>
        )}

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Note
        </p>
        {task.notes && (
          <p className="text-[13.5px] text-gray-700 bg-white rounded-2xl px-4 py-3.5 mb-3 whitespace-pre-line shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {task.notes}
          </p>
        )}
        <div className="flex gap-2 mb-7">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 h-11 rounded-2xl px-3.5 text-[14px] text-gray-900 bg-white border-none outline-none shadow-[0_1px_3px_rgba(0,0,0,0.06)] placeholder:text-gray-400"
          />
          <button
            onClick={addNote}
            disabled={busy || !noteText.trim()}
            className="h-11 px-4 rounded-2xl bg-forest text-white text-[13px] font-semibold disabled:opacity-60 active:scale-[0.97] transition-transform shrink-0"
          >
            Add
          </button>
        </div>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
          Actions
        </p>
        <div className="flex gap-2 mb-6">
          {task.status !== 'Completed' && (
            <button
              onClick={() => updateStatus('Completed')}
              disabled={busy}
              className="flex-1 h-10 rounded-full bg-forest text-white text-[12px] font-semibold disabled:opacity-60 active:scale-[0.97] transition-transform"
            >
              Mark as Completed
            </button>
          )}
          {isFounder && (
            <button
              onClick={() => navigate(`/tasks/${id}/edit`)}
              className="flex-1 h-10 rounded-full bg-sage text-white text-[12px] font-semibold active:scale-[0.97] transition-transform"
            >
              Edit Task
            </button>
          )}
          {task.status !== 'Completed' && (
            <button
              onClick={() => navigate(`/tasks/${id}/reschedule`)}
              className="flex-1 h-10 rounded-full bg-sage text-white text-[12px] font-semibold active:scale-[0.97] transition-transform"
            >
              Reschedule
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl mb-6 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <button
            onClick={() => (showHistory ? setShowHistory(false) : loadHistory())}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-[13.5px] font-semibold text-gray-700">Activity History</span>
            <img
              src="/assets/icons/chevron-down.svg"
              alt=""
              className={`w-4 h-4 transition-transform opacity-60 ${showHistory ? 'rotate-180' : ''}`}
            />
          </button>
          {showHistory && (
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {history.length === 0 ? (
                <p className="px-4 py-3.5 text-[12.5px] text-gray-400">No activity yet</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-[12px] text-gray-500 shrink-0">{formatDate(h.timestamp)}</span>
                    <span className="text-[13px] text-gray-800 text-right">
                      {h.detail} <span className="text-gray-400">(By {h.performedBy?.firstName})</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {isFounder && (
          <button
            onClick={deleteTask}
            disabled={busy}
            className="w-full h-12 rounded-full font-semibold text-[15px] border-[1.5px] border-red-500 text-red-500 disabled:opacity-60 active:scale-[0.99] transition-transform"
          >
            Delete Task
          </button>
        )}
      </div>
    </div>
  );
}