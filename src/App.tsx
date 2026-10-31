/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './lib/firebase';
import {
  getStoredMembers,
  saveStoredMembers,
  getStoredSessions,
  saveStoredSessions,
  getStoredRecords,
  saveStoredRecords,
  processCheckIn,
  calculateAttendanceStats,
  resetAllToDefaults,
  STORAGE_CHANGE_EVENT,
} from './lib/storage';
import { Member, AttendanceRecord, AttendanceSession, AttendanceStatus, CheckInMethod } from './types/attendance';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { AttendanceTable } from './components/AttendanceTable';
import { LiveActivityFeed } from './components/LiveActivityFeed';
import { KioskCheckIn } from './components/KioskCheckIn';
import { RosterManager } from './components/RosterManager';
import { AnalyticsView } from './components/AnalyticsView';
import { QRBadgeModal } from './components/QRBadgeModal';
import { ExportSheetsModal } from './components/ExportSheetsModal';
import { SessionManagerModal } from './components/SessionManagerModal';
import { NotesModal } from './components/NotesModal';
import {
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kiosk' | 'roster' | 'analytics' | 'badges'>('dashboard');

  // Core Data
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [notesModal, setNotesModal] = useState<{
    isOpen: boolean;
    record: AttendanceRecord | null;
    member: Member | null;
  }>({
    isOpen: false,
    record: null,
    member: null,
  });

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  // Load data from persistent storage
  const loadData = useCallback(() => {
    const loadedMembers = getStoredMembers();
    const loadedSessions = getStoredSessions();
    const loadedRecords = getStoredRecords();

    setMembers(loadedMembers);
    setSessions(loadedSessions);

    // Pick active session or first one
    const active = loadedSessions.find((s) => s.isActive) || loadedSessions[0] || null;
    setActiveSession(active);
    setRecords(loadedRecords);
  }, []);

  // Initial mount & clock
  useEffect(() => {
    loadData();

    // Clock ticker
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    // Storage change listener for real-time reactivity
    const handleStorageChange = () => {
      loadData();
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);

    // Initialize Firebase Auth
    initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      clearInterval(clockInterval);
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
    };
  }, [loadData]);

  // Auth handlers
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err) {
      console.error('Sign-in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  // Filter records for the active session
  const currentSessionRecords = useMemo(() => {
    if (!activeSession) return records;
    return records.filter((r) => r.sessionId === activeSession.id);
  }, [records, activeSession]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateAttendanceStats(currentSessionRecords, members.length);
  }, [currentSessionRecords, members]);

  // Members Map
  const membersMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // Status update handler
  const handleUpdateStatus = (
    memberId: string,
    status: AttendanceStatus,
    notes?: string,
    method?: CheckInMethod
  ) => {
    if (!activeSession) return;
    processCheckIn(memberId, activeSession, method || 'manual_admin', status, notes);
    setRecords(getStoredRecords());
  };

  // Bulk status update handler
  const handleBulkUpdateStatus = (memberIds: string[], status: AttendanceStatus) => {
    if (!activeSession) return;
    memberIds.forEach((id) => {
      processCheckIn(id, activeSession, 'manual_admin', status);
    });
    setRecords(getStoredRecords());
  };

  // Kiosk check-in execution
  const handleKioskCheckIn = (
    memberId: string,
    method: 'kiosk' | 'qr_code' | 'pin',
    notes?: string
  ) => {
    if (!activeSession) {
      return {
        success: false,
        record: {} as AttendanceRecord,
        isLate: false,
        alreadyCheckedIn: false,
      };
    }
    const result = processCheckIn(memberId, activeSession, method, undefined, notes);
    setRecords(getStoredRecords());
    return result;
  };

  // Notes save handler
  const handleSaveNotes = (memberId: string, notes: string) => {
    if (!activeSession) return;
    const allRecords = getStoredRecords();
    const existing = allRecords.find(
      (r) => r.memberId === memberId && r.sessionId === activeSession.id
    );

    if (existing) {
      existing.notes = notes;
      existing.updatedAt = new Date().toISOString();
      saveStoredRecords(allRecords);
    } else {
      processCheckIn(memberId, activeSession, 'manual_admin', 'absent', notes);
    }
    setRecords(getStoredRecords());
  };

  // Roster handlers
  const handleAddMember = (newMember: Member) => {
    const updated = [newMember, ...members];
    setMembers(updated);
    saveStoredMembers(updated);
  };

  const handleUpdateMember = (updatedMember: Member) => {
    const updated = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setMembers(updated);
    saveStoredMembers(updated);
  };

  const handleDeleteMember = (memberId: string) => {
    const updated = members.filter((m) => m.id !== memberId);
    setMembers(updated);
    saveStoredMembers(updated);
  };

  const handleBulkAddMembers = (newMembers: Member[]) => {
    const updated = [...newMembers, ...members];
    setMembers(updated);
    saveStoredMembers(updated);
  };

  // Session handlers
  const handleSelectSession = (s: AttendanceSession) => {
    const updatedSessions = sessions.map((item) => ({
      ...item,
      isActive: item.id === s.id,
    }));
    setSessions(updatedSessions);
    saveStoredSessions(updatedSessions);
    setActiveSession(s);
  };

  const handleAddSession = (newSession: AttendanceSession) => {
    const updated = [newSession, ...sessions.map((s) => ({ ...s, isActive: false }))];
    setSessions(updated);
    saveStoredSessions(updated);
    setActiveSession(newSession);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    saveStoredSessions(updated);
    if (activeSession?.id === sessionId) {
      setActiveSession(updated[0] || null);
    }
  };

  // Reset sample data
  const handleResetSampleData = () => {
    if (window.confirm('Reset all members, sessions, and attendance logs to initial sample data?')) {
      resetAllToDefaults();
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onOpenSessionModal={() => setIsSessionModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        user={user}
        isLoggingIn={isLoggingIn}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        currentTime={currentTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Session Headline Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                    <span>{activeSession?.name || 'Attendance Overview'}</span>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {activeSession?.date || 'Today'}
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Starts at {activeSession?.startTime || '09:00'} (Grace period: +{activeSession?.lateGraceMinutes || 15} mins)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('kiosk')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Kiosk Mode</span>
                </button>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Google Sheets</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <StatCards stats={stats} sessionName={activeSession?.name || 'Session'} />

            {/* Split View: Attendance Table & Live Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <AttendanceTable
                  members={members}
                  records={currentSessionRecords}
                  onUpdateStatus={handleUpdateStatus}
                  onBulkUpdateStatus={handleBulkUpdateStatus}
                  onOpenNotesModal={(record, member) =>
                    setNotesModal({ isOpen: true, record, member })
                  }
                />
              </div>

              <div className="lg:col-span-1">
                <LiveActivityFeed
                  records={currentSessionRecords}
                  membersMap={membersMap}
                  onQuickCheckInClick={() => setActiveTab('kiosk')}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kiosk' && activeSession && (
          <KioskCheckIn
            members={members}
            session={activeSession}
            records={currentSessionRecords}
            onCheckIn={handleKioskCheckIn}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onBulkAddMembers={handleBulkAddMembers}
          />
        )}

        {activeTab === 'analytics' && activeSession && (
          <AnalyticsView
            members={members}
            records={currentSessionRecords}
            session={activeSession}
            stats={stats}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}

        {activeTab === 'badges' && <QRBadgeModal members={members} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">AttendEase</span>
            <span>•</span>
            <span>Real-time Attendance Management & Google Sheets Sync</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleResetSampleData}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-300 transition"
              title="Reset all rosters and attendance to demo data"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sample Data</span>
            </button>
            <span>•</span>
            <span className="text-slate-400">
              {members.length} Members Enrolled
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExportSheetsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleGoogleSignIn}
        records={records}
        members={members}
        sessions={sessions}
        activeSession={activeSession}
        stats={stats}
      />

      <SessionManagerModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onAddSession={handleAddSession}
        onDeleteSession={handleDeleteSession}
      />

      <NotesModal
        isOpen={notesModal.isOpen}
        onClose={() => setNotesModal({ isOpen: false, record: null, member: null })}
        record={notesModal.record}
        member={notesModal.member}
        onSaveNotes={handleSaveNotes}
      />
    </div>
  );
}
