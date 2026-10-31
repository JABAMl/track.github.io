import React from 'react';
import { Users, CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { AttendanceStats } from '../types/attendance';

interface StatCardsProps {
  stats: AttendanceStats;
  sessionName: string;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, sessionName }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {/* Total Roster */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Total Roster</span>
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{stats.totalMembers}</div>
        <div className="mt-1 text-[11px] text-slate-400 truncate">Registered Members</div>
      </div>

      {/* Present */}
      <div className="bg-slate-900/90 border border-emerald-950/40 rounded-xl p-4 shadow-sm hover:border-emerald-800/60 transition bg-gradient-to-b from-emerald-950/10 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-emerald-400">Present</span>
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.presentCount}</div>
        <div className="mt-1 text-[11px] text-emerald-500/80">
          {stats.totalMembers > 0
            ? `${Math.round((stats.presentCount / stats.totalMembers) * 100)}% on-time`
            : '0%'}
        </div>
      </div>

      {/* Late */}
      <div className="bg-slate-900/90 border border-amber-950/40 rounded-xl p-4 shadow-sm hover:border-amber-800/60 transition bg-gradient-to-b from-amber-950/10 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-amber-400">Late</span>
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-400 tracking-tight">{stats.lateCount}</div>
        <div className="mt-1 text-[11px] text-amber-500/80">Grace period passed</div>
      </div>

      {/* Excused */}
      <div className="bg-slate-900/90 border border-purple-950/40 rounded-xl p-4 shadow-sm hover:border-purple-800/60 transition bg-gradient-to-b from-purple-950/10 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-purple-400">Excused</span>
          <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-purple-400 tracking-tight">{stats.excusedCount}</div>
        <div className="mt-1 text-[11px] text-purple-400/80">Approved leaves</div>
      </div>

      {/* Absent */}
      <div className="bg-slate-900/90 border border-rose-950/40 rounded-xl p-4 shadow-sm hover:border-rose-800/60 transition bg-gradient-to-b from-rose-950/10 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-rose-400">Absent</span>
          <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-400 tracking-tight">{stats.absentCount}</div>
        <div className="mt-1 text-[11px] text-rose-500/80">Not checked in</div>
      </div>

      {/* Attendance Rate */}
      <div className="bg-slate-900/90 border border-indigo-950/40 rounded-xl p-4 shadow-sm hover:border-indigo-800/60 transition bg-gradient-to-b from-indigo-950/20 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-300">Turnout</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
            {stats.attendanceRate >= 80 ? 'Optimal' : stats.attendanceRate >= 60 ? 'Moderate' : 'Low'}
          </span>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{stats.attendanceRate}%</div>
        <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.attendanceRate >= 80
                ? 'bg-emerald-500'
                : stats.attendanceRate >= 60
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${stats.attendanceRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};
