export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

export type CheckInMethod = 'kiosk' | 'qr_code' | 'manual_admin' | 'pin';

export interface Member {
  id: string; // e.g. "EMP-101"
  name: string;
  email: string;
  department: string;
  role: string;
  avatarUrl?: string;
  pin?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  sessionId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime: string | null; // ISO string or HH:MM AM/PM
  method?: CheckInMethod;
  notes?: string;
  updatedAt: string;
}

export interface AttendanceSession {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00"
  lateGraceMinutes: number; // e.g. 15 minutes after start time
  description?: string;
  isActive: boolean;
}

export interface AttendanceStats {
  totalMembers: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  attendanceRate: number; // percentage 0 - 100
  avgCheckInTime: string | null;
}

export interface GoogleSheetsExportConfig {
  sheetTitle: string;
  includeNotes: boolean;
  dateFilter: string; // "all" | specific date
  sessionId: string; // "all" | specific session ID
}
