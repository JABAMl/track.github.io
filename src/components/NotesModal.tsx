import React, { useState, useEffect } from 'react';
import { FileEdit, X, Check } from 'lucide-react';
import { AttendanceRecord, Member } from '../types/attendance';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  member: Member | null;
  onSaveNotes: (memberId: string, notes: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  record,
  member,
  onSaveNotes,
}) => {
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (record) {
      setNoteText(record.notes || '');
    }
  }, [record]);

  if (!isOpen || !member) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotes(member.id, noteText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileEdit className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Attendance Note</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs">
          <span className="text-slate-400">Member: </span>
          <span className="font-semibold text-white">{member.name}</span>
          <span className="text-slate-500 font-mono ml-1">({member.id})</span>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <textarea
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add administrative notes (e.g. Doctor note submitted, WFH approved)..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
