import React, { useState } from 'react';
import { Calendar, Plus, Clock, Check, X, Trash2 } from 'lucide-react';
import { AttendanceSession } from '../types/attendance';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AttendanceSession[];
  activeSession: AttendanceSession | null;
  onSelectSession: (session: AttendanceSession) => void;
  onAddSession: (session: AttendanceSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSession,
  onSelectSession,
  onAddSession,
  onDeleteSession,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [lateGraceMinutes, setLateGraceMinutes] = useState(15);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSession: AttendanceSession = {
      id: `sess-${Date.now()}`,
      name: name.trim(),
      date,
      startTime,
      lateGraceMinutes: Number(lateGraceMinutes) || 15,
      description: description.trim(),
      isActive: true,
    };

    onAddSession(newSession);
    setIsAdding(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Attendance Sessions</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions list */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {sessions.map((s) => {
            const isActive = activeSession?.id === s.id;
            return (
              <div
                key={s.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{s.name}</span>
                    {isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
                    <span>Date: {s.date}</span>
                    <span>•</span>
                    <span>Starts: {s.startTime}</span>
                    <span>•</span>
                    <span>Grace: +{s.lateGraceMinutes}m</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isActive && (
                    <button
                      onClick={() => onSelectSession(s)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-[11px]"
                    >
                      Make Active
                    </button>
                  )}
                  {sessions.length > 1 && (
                    <button
                      onClick={() => onDeleteSession(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Session Form */}
        {isAdding ? (
          <form
            onSubmit={handleCreate}
            className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3 text-xs"
          >
            <h4 className="font-semibold text-white">Create New Attendance Session</h4>
            <div>
              <label className="block text-slate-400 mb-1">Session / Event Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Afternoon Lecture or Design Sprint"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Grace Mins</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={lateGraceMinutes}
                  onChange={(e) => setLateGraceMinutes(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes or location"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow"
              >
                Save & Set Active
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Create New Session</span>
          </button>
        )}
      </div>
    </div>
  );
};
