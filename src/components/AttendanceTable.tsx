import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Check,
  Clock,
  ShieldCheck,
  X,
  FileEdit,
  QrCode,
  Smartphone,
  UserCheck,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { AttendanceRecord, Member, AttendanceStatus, CheckInMethod } from '../types/attendance';

interface AttendanceTableProps {
  members: Member[];
  records: AttendanceRecord[];
  onUpdateStatus: (
    memberId: string,
    status: AttendanceStatus,
    notes?: string,
    method?: CheckInMethod
  ) => void;
  onBulkUpdateStatus: (memberIds: string[], status: AttendanceStatus) => void;
  onOpenNotesModal: (record: AttendanceRecord, member: Member) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  members,
  records,
  onUpdateStatus,
  onBulkUpdateStatus,
  onOpenNotesModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Build records map by member ID
  const recordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((r) => map.set(r.memberId, r));
    return map;
  }, [records]);

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    members.forEach((m) => {
      if (m.department) depts.add(m.department);
    });
    return Array.from(depts).sort();
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query);

      // Dept match
      const matchesDept = selectedDept === 'all' || member.department === selectedDept;

      // Status match
      const record = recordsMap.get(member.id);
      const status = record ? record.status : 'absent';
      const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [members, recordsMap, searchQuery, selectedDept, selectedStatus]);

  // Handle select all
  const allFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedMemberIds.includes(m.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map((m) => m.id));
    }
  };

  const handleToggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter((item) => item !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleExecuteBulk = (status: AttendanceStatus) => {
    if (selectedMemberIds.length === 0) return;
    onBulkUpdateStatus(selectedMemberIds, status);
    setSelectedMemberIds([]);
  };

  const getMethodBadge = (method?: CheckInMethod) => {
    if (!method) return null;
    switch (method) {
      case 'qr_code':
        return (
          <span className="inline-flex items-center text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            <QrCode className="w-2.5 h-2.5 mr-1" /> QR
          </span>
        );
      case 'kiosk':
      case 'pin':
        return (
          <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <Smartphone className="w-2.5 h-2.5 mr-1" /> Kiosk
          </span>
        );
      case 'manual_admin':
        return (
          <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <UserCheck className="w-2.5 h-2.5 mr-1" /> Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
                <option value="absent">Absent</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (shows when items selected) */}
        {selectedMemberIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between bg-indigo-950/40 border border-indigo-500/30 px-3 py-2 rounded-lg text-xs animate-fadeIn">
            <span className="text-indigo-200 font-medium">
              {selectedMemberIds.length} member{selectedMemberIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExecuteBulk('present')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition"
              >
                Mark Present
              </button>
              <button
                onClick={() => handleExecuteBulk('late')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition"
              >
                Mark Late
              </button>
              <button
                onClick={() => handleExecuteBulk('excused')}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition"
              >
                Mark Excused
              </button>
              <button
                onClick={() => handleExecuteBulk('absent')}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition"
              >
                Mark Absent
              </button>
              <button
                onClick={() => setSelectedMemberIds([])}
                className="px-2 py-1 text-slate-400 hover:text-white transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 border-b border-slate-800 font-medium">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Member Info</th>
              <th className="py-3 px-4 hidden md:table-cell">Department & Role</th>
              <th className="py-3 px-4">Attendance Status</th>
              <th className="py-3 px-4 hidden sm:table-cell">Check-In Time</th>
              <th className="py-3 px-4 hidden lg:table-cell">Notes</th>
              <th className="py-3 px-4 text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                  No members found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const record = recordsMap.get(member.id);
                const currentStatus: AttendanceStatus = record ? record.status : 'absent';
                const isSelected = selectedMemberIds.includes(member.id);

                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleMember(member.id)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Member Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                            {member.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate flex items-center space-x-1.5">
                            <span>{member.name}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] truncate flex items-center space-x-1.5">
                            <span className="font-mono text-indigo-300 font-semibold">{member.id}</span>
                            <span>•</span>
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dept & Role */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="text-slate-200 font-medium">{member.department}</div>
                      <div className="text-slate-400 text-[11px] truncate">{member.role}</div>
                    </td>

                    {/* Status Pill Switcher */}
                    <td className="py-3 px-4">
                      <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700/80">
                        <button
                          onClick={() => onUpdateStatus(member.id, 'present', undefined, 'manual_admin')}
                          title="Mark Present"
                          className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => onUpdateStatus(member.id, 'late', undefined, 'manual_admin')}
                          title="Mark Late"
                          className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                            currentStatus === 'late'
                              ? 'bg-amber-600 text-white shadow-xs font-semibold'
                              : 'text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => onUpdateStatus(member.id, 'excused', undefined, 'manual_admin')}
                          title="Mark Excused"
                          className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                            currentStatus === 'excused'
                              ? 'bg-purple-600 text-white shadow-xs font-semibold'
                              : 'text-slate-400 hover:text-purple-400'
                          }`}
                        >
                          Excused
                        </button>
                        <button
                          onClick={() => onUpdateStatus(member.id, 'absent', undefined, 'manual_admin')}
                          title="Mark Absent"
                          className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs font-semibold'
                              : 'text-slate-400 hover:text-rose-400'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>

                    {/* Check In Time */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {record?.checkInTime ? (
                        <div className="space-y-1">
                          <div className="font-mono text-slate-200 font-medium">
                            {record.checkInTime}
                          </div>
                          {getMethodBadge(record.method)}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not checked in</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-400 truncate max-w-[140px]">
                          {record?.notes || '—'}
                        </span>
                        <button
                          onClick={() =>
                            onOpenNotesModal(
                              record || {
                                id: `rec-${member.id}`,
                                memberId: member.id,
                                sessionId: '',
                                date: '',
                                status: 'absent',
                                checkInTime: null,
                                updatedAt: new Date().toISOString(),
                              },
                              member
                            )
                          }
                          title="Edit note"
                          className="p-1 text-slate-500 hover:text-indigo-400 transition"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Quick Action */}
                    <td className="py-3 px-4 text-right">
                      {currentStatus === 'present' ? (
                        <span className="inline-flex items-center text-emerald-400 font-medium text-[11px]">
                          <Check className="w-3.5 h-3.5 mr-1" /> Checked In
                        </span>
                      ) : (
                        <button
                          onClick={() => onUpdateStatus(member.id, 'present', undefined, 'manual_admin')}
                          className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-[11px] font-medium transition active:scale-95"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="p-3 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredMembers.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{members.length}</span> total members
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span>Real-time sync active</span>
        </div>
      </div>
    </div>
  );
};
