import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  KeyRound,
  User,
  ArrowRight,
  RefreshCw,
  Camera,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member, AttendanceSession, AttendanceRecord } from '../types/attendance';
import { playSuccessChime, playWarningBuzzer } from '../lib/audio';

interface KioskCheckInProps {
  members: Member[];
  session: AttendanceSession;
  records: AttendanceRecord[];
  onCheckIn: (
    memberId: string,
    method: 'kiosk' | 'qr_code' | 'pin',
    notes?: string
  ) => { success: boolean; record: AttendanceRecord; isLate: boolean; alreadyCheckedIn: boolean };
}

export const KioskCheckIn: React.FC<KioskCheckInProps> = ({
  members,
  session,
  records,
  onCheckIn,
}) => {
  const [activeMode, setActiveMode] = useState<'search' | 'pin' | 'qr'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [recentSuccess, setRecentSuccess] = useState<{
    member: Member;
    record: AttendanceRecord;
    isLate: boolean;
    alreadyCheckedIn: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto clear success card after 4 seconds
  useEffect(() => {
    if (!recentSuccess) return;
    const timer = setTimeout(() => {
      setRecentSuccess(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [recentSuccess]);

  // Execute check in
  const triggerCheckIn = (member: Member, method: 'kiosk' | 'qr_code' | 'pin') => {
    setErrorMessage(null);
    const result = onCheckIn(member.id, method);

    if (result.success) {
      playSuccessChime();
      // Fire confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: result.isLate ? ['#f59e0b', '#fbbf24', '#ffffff'] : ['#10b981', '#34d399', '#6366f1'],
      });

      setRecentSuccess({
        member,
        record: result.record,
        isLate: result.isLate,
        alreadyCheckedIn: result.alreadyCheckedIn,
      });

      // Clear inputs
      setSearchQuery('');
      setPinInput('');
      setQrInput('');
    } else {
      playWarningBuzzer();
      setErrorMessage('Check-in could not be completed.');
    }
  };

  // Pin form submit
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    // Match by PIN or by Member ID
    const clean = pinInput.trim().toUpperCase();
    const matched = members.find(
      (m) =>
        m.pin === clean ||
        m.id.toUpperCase() === clean ||
        m.id.replace(/[^0-9]/g, '') === clean
    );

    if (matched) {
      triggerCheckIn(matched, 'pin');
    } else {
      playWarningBuzzer();
      setErrorMessage(`No member found matching ID / PIN "${pinInput}".`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // QR string submit
  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    const query = qrInput.trim();
    // Parse ID from raw ID or JSON
    let memberId = query;
    try {
      const parsed = JSON.parse(query);
      if (parsed.id) memberId = parsed.id;
    } catch {
      // not json, use direct string
    }

    const matched = members.find(
      (m) => m.id.toUpperCase() === memberId.toUpperCase()
    );

    if (matched) {
      triggerCheckIn(matched, 'qr_code');
    } else {
      playWarningBuzzer();
      setErrorMessage(`Invalid QR Code. Member "${memberId}" not found.`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Filter members for fast search
  const searchResults = searchQuery.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members.slice(0, 6);

  const checkedInIds = new Set(
    records.filter((r) => r.status === 'present' || r.status === 'late').map((r) => r.memberId)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Kiosk Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-radial-at-t from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Self Check-In Station</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to {session.name}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Please check in to record your attendance. Select your preferred method below:
          </p>

          {/* Mode Switcher Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveMode('search')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeMode === 'search'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search Name or ID</span>
            </button>

            <button
              onClick={() => setActiveMode('pin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeMode === 'pin'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>PIN / ID Keypad</span>
            </button>

            <button
              onClick={() => setActiveMode('qr')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeMode === 'qr'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Badge Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Celebration Toast */}
      {recentSuccess && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 shadow-2xl flex items-center justify-between animate-bounce-short">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white">
                  Welcome, {recentSuccess.member.name}!
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    recentSuccess.isLate
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {recentSuccess.isLate ? 'Checked In (Late)' : 'Checked In (On-Time)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center space-x-2">
                <span>ID: {recentSuccess.member.id}</span>
                <span>•</span>
                <span>Time: {recentSuccess.record.checkInTime}</span>
                <span>•</span>
                <span>{recentSuccess.member.department}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setRecentSuccess(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode 1: Search and 1-Tap Check-In */}
      {activeMode === 'search' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="relative mb-4">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Start typing your name, email, or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {searchResults.map((member) => {
              const isCheckedIn = checkedInIds.has(member.id);
              return (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                    isCheckedIn
                      ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {member.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm truncate">{member.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {member.id} • {member.department}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerCheckIn(member, 'kiosk')}
                    className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition active:scale-95 flex-shrink-0 ${
                      isCheckedIn
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {isCheckedIn ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Re-Check</span>
                      </>
                    ) : (
                      <>
                        <span>Check In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: PIN / Member ID Keypad */}
      {activeMode === 'pin' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-md mx-auto">
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="text-center">
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Enter your 4-digit PIN or Employee ID (e.g. 1011 or EMP-101)
              </label>
              <input
                type="text"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN or ID..."
                className="w-full text-center font-mono tracking-widest text-2xl font-bold bg-slate-800 border border-slate-700 text-white rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Numpad Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => setPinInput((prev) => prev + digit)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg border border-slate-700 transition active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3 bg-slate-800/60 hover:bg-slate-700 text-rose-400 font-semibold rounded-xl text-sm border border-slate-700 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setPinInput((prev) => prev + '0')}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-lg border border-slate-700 transition active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput((prev) => prev.slice(0, -1))}
                className="py-3 bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm border border-slate-700 transition"
              >
                Backspace
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Submit & Check In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mode 3: QR Scanner mode */}
      {activeMode === 'qr' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm max-w-lg mx-auto text-center space-y-4">
          <div className="w-48 h-48 mx-auto bg-slate-950 rounded-2xl border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />
            <Camera className="w-12 h-12 text-indigo-400 mb-2 opacity-80" />
            <span className="text-xs text-slate-400">Hold badge to camera</span>
            <span className="text-[10px] text-slate-500 mt-1">or use scanner below</span>
          </div>

          <form onSubmit={handleQrSubmit} className="space-y-3">
            <p className="text-xs text-slate-400">
              Manual barcode scanner input or simulated badge scan:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Scan or enter Member ID (e.g. EMP-101)..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Scan
              </button>
            </div>
          </form>

          {/* Quick Test Barcode Buttons */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 mb-2">
              Click any sample badge to simulate scanning:
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {members.slice(0, 5).map((m) => (
                <button
                  key={m.id}
                  onClick={() => triggerCheckIn(m, 'qr_code')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] border border-slate-700 transition"
                >
                  {m.name.split(' ')[0]} ({m.id})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
