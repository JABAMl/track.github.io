import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  UploadCloud,
  Download,
  Users,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Member } from '../types/attendance';

interface RosterManagerProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onBulkAddMembers: (newMembers: Member[]) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onBulkAddMembers,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('Engineering');
  const [formRole, setFormRole] = useState('Member');
  const [formPin, setFormPin] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formError, setFormError] = useState('');

  // Extract departments
  const departments = Array.from(new Set(members.map((m) => m.department))).filter(Boolean);

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q);
    const matchesDept = selectedDept === 'all' || m.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const openAddModal = () => {
    setEditingMember(null);
    setFormId(`EMP-${100 + members.length + 1}`);
    setFormName('');
    setFormEmail('');
    setFormDept('Engineering');
    setFormRole('Team Member');
    setFormPin(Math.floor(1000 + Math.random() * 9000).toString());
    setFormAvatar('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormId(member.id);
    setFormName(member.name);
    setFormEmail(member.email);
    setFormDept(member.department);
    setFormRole(member.role);
    setFormPin(member.pin || '');
    setFormAvatar(member.avatarUrl || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formId.trim()) {
      setFormError('Member Name and ID are required.');
      return;
    }

    if (!editingMember && members.some((m) => m.id.toLowerCase() === formId.trim().toLowerCase())) {
      setFormError('A member with this ID already exists.');
      return;
    }

    const payload: Member = {
      id: formId.trim(),
      name: formName.trim(),
      email: formEmail.trim() || `${formId.toLowerCase()}@example.com`,
      department: formDept.trim() || 'General',
      role: formRole.trim() || 'Member',
      pin: formPin.trim() || '1234',
      avatarUrl: formAvatar.trim() || undefined,
      createdAt: editingMember ? editingMember.createdAt : new Date().toISOString(),
    };

    if (editingMember) {
      onUpdateMember(payload);
    } else {
      onAddMember(payload);
    }

    setIsAddModalOpen(false);
  };

  const handleBulkImport = () => {
    if (!csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    const newItems: Member[] = [];

    // Parse lines (Name, Email, Dept, Role, ID)
    lines.forEach((line, index) => {
      // skip header if detected
      if (index === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) {
        return;
      }
      const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2) {
        const name = parts[0];
        const email = parts[1] || '';
        const dept = parts[2] || 'Operations';
        const role = parts[3] || 'Staff';
        const id = parts[4] || `EMP-${100 + members.length + newItems.length + 1}`;
        const pin = parts[5] || '1010';

        if (name) {
          newItems.push({
            id,
            name,
            email,
            department: dept,
            role,
            pin,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    if (newItems.length > 0) {
      onBulkAddMembers(newItems);
      setIsImportModalOpen(false);
      setCsvText('');
    }
  };

  const loadSampleCSV = () => {
    setCsvText(
      `Name,Email,Department,Role,ID,PIN
Jonathan Taylor,j.taylor@company.com,Finance,Senior Analyst,EMP-201,2011
Aisha Khan,aisha.khan@company.com,Marketing,Content Strategist,EMP-202,2022
Liam O'Connor,liam.oc@company.com,Engineering,Security Engineer,EMP-203,2033
Mia Rodriguez,mia.r@company.com,Product,Associate PM,EMP-204,2044`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Member & Student Roster</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage all enrolled participants, credentials, and departments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member roster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-lg flex-shrink-0">
                      {member.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white text-sm">{member.name}</h3>
                    <div className="text-xs text-indigo-400 font-mono font-medium">{member.id}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(member)}
                    title="Edit Member"
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(member.id)}
                    title="Delete Member"
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Department:</span>
                  <span className="text-slate-200 font-medium">{member.department}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Role:</span>
                  <span className="text-slate-200 truncate max-w-[170px]">{member.role}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Email:</span>
                  <span className="text-slate-200 truncate max-w-[170px]">{member.email}</span>
                </div>
                {member.pin && (
                  <div className="flex justify-between text-slate-400">
                    <span>PIN / Key:</span>
                    <span className="font-mono text-emerald-400">**** ({member.pin})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-white text-base">Delete Member?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove member{' '}
              <span className="font-semibold text-white">{deleteConfirmId}</span> from the roster?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteMember(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingMember ? 'Edit Member Details' : 'Add New Member to Roster'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Member / Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="e.g. EMP-115"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. jordan@example.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="Engineering, Design..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Role / Title</label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Kiosk PIN (4-digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Avatar Image URL</label>
                  <input
                    type="text"
                    value={formAvatar}
                    onChange={(e) => setFormAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition"
                >
                  {editingMember ? 'Save Changes' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
                <span>Bulk CSV Member Import</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Paste comma-separated rows below. Format:{' '}
              <span className="font-mono text-indigo-300">Name, Email, Department, Role, ID, PIN</span>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Full Name, email@domain.com, Engineering, Developer, EMP-101, 1234"
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={loadSampleCSV}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                Load 4 Sample Rows
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={!csvText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                >
                  Import Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
