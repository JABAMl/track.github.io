import {
  Member,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStats,
  AttendanceStatus,
  CheckInMethod,
} from '../types/attendance';
import { INITIAL_MEMBERS, INITIAL_SESSIONS, getInitialAttendanceRecords } from './mockData';

const STORAGE_KEYS = {
  MEMBERS: 'attendease_members_v1',
  SESSIONS: 'attendease_sessions_v1',
  RECORDS: 'attendease_records_v1',
};

// Dispatch storage event helper for components listening in the same window
export const STORAGE_CHANGE_EVENT = 'attendease_storage_changed';

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
  }
}

export function getStoredMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      saveStoredMembers(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MEMBERS;
  }
}

export function saveStoredMembers(members: Member[]): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  notifyChange();
}

export function getStoredSessions(): AttendanceSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      saveStoredSessions(INITIAL_SESSIONS);
      return INITIAL_SESSIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SESSIONS;
  }
}

export function saveStoredSessions(sessions: AttendanceSession[]): void {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  notifyChange();
}

export function getStoredRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      const initial = getInitialAttendanceRecords(
        INITIAL_SESSIONS[0].id,
        INITIAL_SESSIONS[0].date,
        INITIAL_MEMBERS
      );
      saveStoredRecords(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredRecords(records: AttendanceRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  notifyChange();
}

/**
 * Perform a check-in for a member
 */
export function processCheckIn(
  memberId: string,
  session: AttendanceSession,
  method: CheckInMethod = 'kiosk',
  forcedStatus?: AttendanceStatus,
  notes?: string
): { success: boolean; record: AttendanceRecord; isLate: boolean; alreadyCheckedIn: boolean } {
  const records = getStoredRecords();
  const today = session.date || new Date().toISOString().split('T')[0];

  const existingIdx = records.findIndex(
    (r) => r.memberId === memberId && r.sessionId === session.id && r.date === today
  );

  const existingRecord = existingIdx >= 0 ? records[existingIdx] : null;

  // Determine check-in time formatted
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate late status if not forced
  let calculatedStatus: AttendanceStatus = 'present';
  let isLate = false;

  if (forcedStatus) {
    calculatedStatus = forcedStatus;
  } else {
    // Check session start time (HH:mm)
    const [startH, startM] = session.startTime.split(':').map(Number);
    const sessionStartTime = new Date();
    sessionStartTime.setHours(startH, startM, 0, 0);

    const graceMs = (session.lateGraceMinutes || 15) * 60 * 1000;
    const lateThreshold = new Date(sessionStartTime.getTime() + graceMs);

    if (now > lateThreshold) {
      calculatedStatus = 'late';
      isLate = true;
    }
  }

  const updatedRecord: AttendanceRecord = {
    id: existingRecord ? existingRecord.id : `rec-${memberId}-${Date.now()}`,
    memberId,
    sessionId: session.id,
    date: today,
    status: calculatedStatus,
    checkInTime: timeFormatted,
    method,
    notes: notes !== undefined ? notes : existingRecord?.notes || '',
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    records[existingIdx] = updatedRecord;
  } else {
    records.unshift(updatedRecord);
  }

  saveStoredRecords(records);

  return {
    success: true,
    record: updatedRecord,
    isLate: calculatedStatus === 'late',
    alreadyCheckedIn: existingRecord?.status === 'present' || existingRecord?.status === 'late',
  };
}

/**
 * Calculate dashboard metrics from records
 */
export function calculateAttendanceStats(
  records: AttendanceRecord[],
  totalMembers: number
): AttendanceStats {
  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const attendedCount = presentCount + lateCount;
  const absentCount = Math.max(0, totalMembers - (attendedCount + excusedCount));

  const effectiveTotal = Math.max(1, totalMembers - excusedCount);
  const attendanceRate = totalMembers > 0 ? Math.min(100, Math.round((attendedCount / effectiveTotal) * 100)) : 0;

  // Calculate average check in time if any present/late
  const times = records.filter((r) => r.checkInTime).map((r) => r.checkInTime as string);
  let avgCheckInTime: string | null = null;
  if (times.length > 0) {
    // Return sample average or median
    avgCheckInTime = times[Math.floor(times.length / 2)];
  }

  return {
    totalMembers,
    presentCount,
    lateCount,
    excusedCount,
    absentCount,
    attendanceRate,
    avgCheckInTime,
  };
}

export function resetAllToDefaults(): void {
  saveStoredMembers(INITIAL_MEMBERS);
  saveStoredSessions(INITIAL_SESSIONS);
  const records = getInitialAttendanceRecords(
    INITIAL_SESSIONS[0].id,
    INITIAL_SESSIONS[0].date,
    INITIAL_MEMBERS
  );
  saveStoredRecords(records);
}
