import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { AttendanceRecord, Member, AttendanceSession, AttendanceStats } from '../types/attendance';
import { exportToGoogleSheets, downloadAttendanceCSV, ExportResult } from '../lib/googleSheets';
import { User } from 'firebase/auth';

interface ExportSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  records: AttendanceRecord[];
  members: Member[];
  sessions: AttendanceSession[];
  activeSession: AttendanceSession | null;
  stats: AttendanceStats;
}

export const ExportSheetsModal: React.FC<ExportSheetsModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onSignIn,
  records,
  members,
  sessions,
  activeSession,
  stats,
}) => {
  const [title, setTitle] = useState(
    `AttendEase - ${activeSession?.name || 'Attendance'} (${new Date().toISOString().split('T')[0]})`
  );
  const [filterSession, setFilterSession] = useState<string>(activeSession?.id || 'all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter records based on selection
  const filteredRecords = records.filter((r) => {
    if (filterSession !== 'all' && r.sessionId !== filterSession) return false;
    return true;
  });

  const membersMap = new Map<string, Member>();
  members.forEach((m) => membersMap.set(m.id, m));

  const sessionsMap = new Map<string, AttendanceSession>();
  sessions.forEach((s) => sessionsMap.set(s.id, s));

  const handleExport = async () => {
    if (!accessToken) {
      setErrorMessage('Please sign in with your Google account first to enable Sheets export.');
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setExportResult(null);

    try {
      const result = await exportToGoogleSheets(
        accessToken,
        title.trim(),
        filteredRecords,
        membersMap,
        sessionsMap,
        stats
      );
      setExportResult(result);
    } catch (err: any) {
      console.error('Google Sheets export failed:', err);
      setErrorMessage(
        err.message || 'Failed to export data to Google Sheets. Please check your connection and permissions.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVDownload = () => {
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
    downloadAttendanceCSV(filteredRecords, membersMap, sessionsMap, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Export to Google Sheets</h3>
              <p className="text-[11px] text-slate-400">
                Generate formatted spreadsheet logs & summary sheets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Authentication Banner */}
        {!user || !accessToken ? (
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Google Account Sign-In Required</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  To create and populate a new Google Sheet in your Google Drive, sign in with your
                  authorized account below.
                </p>
              </div>
            </div>

            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-semibold shadow transition active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-white font-medium">Ready to Export</span>
                <span className="text-slate-400 block text-[10px]">{user.email}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
              Connected
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Success View */}
        {exportResult ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Exported Successfully!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Exported {exportResult.rowsExported} attendance records to your Google Drive.
              </p>
            </div>

            <a
              href={exportResult.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Sheets ↗</span>
            </a>

            <div className="pt-2 text-[10px] text-slate-400 font-mono truncate">
              ID: {exportResult.spreadsheetId}
            </div>
          </div>
        ) : (
          /* Export Configuration Form */
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Spreadsheet Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Session Scope</label>
                <select
                  value={filterSession}
                  onChange={(e) => setFilterSession(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
                >
                  <option value="all">All Sessions</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Records Included</label>
                <div className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium">
                  {filteredRecords.length} records
                </div>
              </div>
            </div>

            {/* Disclosure Notice */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Google Sheets Permission Notice:</span>{' '}
              With permission from your Google account, AttendEase will create a brand new Google
              Spreadsheet file and populate it with timestamped check-in records and summary metrics.
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCSVDownload}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Backup</span>
              </button>

              <div className="w-full sm:w-auto flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!user || !accessToken || isExporting}
                  onClick={handleExport}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition active:scale-95"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export to Sheets</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
