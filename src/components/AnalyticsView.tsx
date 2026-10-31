import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertCircle,
  Award,
  Users,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Member, AttendanceRecord, AttendanceSession, AttendanceStats } from '../types/attendance';

interface AnalyticsViewProps {
  members: Member[];
  records: AttendanceRecord[];
  session: AttendanceSession;
  stats: AttendanceStats;
  onOpenExportModal: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  members,
  records,
  session,
  stats,
  onOpenExportModal,
}) => {
  // Department metrics breakdown
  const departmentBreakdown = useMemo(() => {
    const deptMap = new Map<
      string,
      { total: number; present: number; late: number; excused: number; absent: number }
    >();

    members.forEach((m) => {
      const dept = m.department || 'General';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, present: 0, late: 0, excused: 0, absent: 0 });
      }
      const data = deptMap.get(dept)!;
      data.total += 1;

      const record = records.find((r) => r.memberId === m.id);
      if (record?.status === 'present') data.present += 1;
      else if (record?.status === 'late') data.late += 1;
      else if (record?.status === 'excused') data.excused += 1;
      else data.absent += 1;
    });

    return Array.from(deptMap.entries()).map(([dept, data]) => {
      const attended = data.present + data.late;
      const rate = data.total > 0 ? Math.round((attended / data.total) * 100) : 0;
      return { dept, ...data, rate };
    });
  }, [members, records]);

  // Punctuality split
  const onTimePercent =
    stats.presentCount + stats.lateCount > 0
      ? Math.round((stats.presentCount / (stats.presentCount + stats.lateCount)) * 100)
      : 0;

  // Unaccounted absent members
  const absentMembers = useMemo(() => {
    return members
      .filter((m) => {
        const record = records.find((r) => r.memberId === m.id);
        return !record || record.status === 'absent';
      })
      .slice(0, 5);
  }, [members, records]);

  // Top early check-ins
  const earlyCheckIns = useMemo(() => {
    return records
      .filter((r) => r.status === 'present' && r.checkInTime)
      .slice(0, 5)
      .map((r) => ({
        member: members.find((m) => m.id === r.memberId),
        record: r,
      }));
  }, [records, members]);

  return (
    <div className="space-y-6">
      {/* Top summary banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Attendance Intelligence & Insights</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Session Analytics: {session.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Date: {session.date} • Start Time: {session.startTime} (Late grace: {session.lateGraceMinutes}m)
          </p>
        </div>

        <button
          onClick={onOpenExportModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
        >
          Export Insights to Google Sheets ↗
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Turnout Gauge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Turnout Rate</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.attendanceRate}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.presentCount + stats.lateCount} of {stats.totalMembers} active participants attended
          </p>
          <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Punctuality Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Punctuality Score</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{onTimePercent}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.presentCount} on-time vs {stats.lateCount} late arrivals
          </p>
          <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-slate-800">
            <div className="bg-emerald-500" style={{ width: `${onTimePercent}%` }} />
            <div className="bg-amber-500" style={{ width: `${100 - onTimePercent}%` }} />
          </div>
        </div>

        {/* Unexcused Absences */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Unaccounted Absences</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{stats.absentCount}</div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.excusedCount} excused / approved absences on record
          </p>
          <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{
                width: `${stats.totalMembers > 0 ? (stats.absentCount / stats.totalMembers) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Attendance Turnout by Department</span>
        </h3>

        <div className="space-y-3.5">
          {departmentBreakdown.map((item) => (
            <div key={item.dept} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-medium">{item.dept}</span>
                <span className="font-semibold text-slate-100">
                  {item.rate}% ({item.present + item.late}/{item.total})
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(item.present / item.total) * 100}%` }}
                  title={`Present: ${item.present}`}
                />
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${(item.late / item.total) * 100}%` }}
                  title={`Late: ${item.late}`}
                />
                <div
                  className="bg-purple-500 transition-all duration-500"
                  style={{ width: `${(item.excused / item.total) * 100}%` }}
                  title={`Excused: ${item.excused}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: Punctual Leaders vs Absent Follow-up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Punctual Check-Ins */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Earliest Check-Ins</span>
          </h3>

          <div className="space-y-2.5">
            {earlyCheckIns.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No early check-ins logged.</p>
            ) : (
              earlyCheckIns.map(({ member, record }) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-slate-100 font-medium">{member?.name || record.memberId}</div>
                      <div className="text-[11px] text-slate-400">{member?.department}</div>
                    </div>
                  </div>
                  <span className="font-mono text-emerald-400 font-semibold">{record.checkInTime}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Absent members needing follow-up */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Unaccounted Absent Members</span>
          </h3>

          <div className="space-y-2.5">
            {absentMembers.length === 0 ? (
              <p className="text-xs text-emerald-400 py-4 text-center font-medium">
                100% Turnout! All members accounted for.
              </p>
            ) : (
              absentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-xs"
                >
                  <div>
                    <div className="text-slate-100 font-medium">{member.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {member.id} • {member.department}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                    No Check-In
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
