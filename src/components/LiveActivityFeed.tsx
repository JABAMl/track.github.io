import React from 'react';
import { QrCode, Smartphone, UserCheck, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { AttendanceRecord, Member } from '../types/attendance';

interface LiveActivityFeedProps {
  records: AttendanceRecord[];
  membersMap: Map<string, Member>;
  onQuickCheckInClick?: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  records,
  membersMap,
  onQuickCheckInClick,
}) => {
  // Filter for records with checkInTime or active status, sorted newest first
  const activeRecords = records
    .filter((r) => r.status === 'present' || r.status === 'late' || r.checkInTime)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case 'qr_code':
        return <QrCode className="w-3 h-3 text-indigo-400" />;
      case 'pin':
      case 'kiosk':
        return <Smartphone className="w-3 h-3 text-emerald-400" />;
      case 'manual_admin':
        return <UserCheck className="w-3 h-3 text-amber-400" />;
      default:
        return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h3 className="text-sm font-semibold text-white tracking-tight">Live Activity Stream</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {activeRecords.length} recent
        </span>
      </div>

      <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 max-h-[380px] pr-1">
        {activeRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            No check-ins recorded yet for this session.
            {onQuickCheckInClick && (
              <button
                onClick={onQuickCheckInClick}
                className="mt-3 block mx-auto text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Open Check-In Kiosk &rarr;
              </button>
            )}
          </div>
        ) : (
          activeRecords.map((record) => {
            const member = membersMap.get(record.memberId);
            return (
              <div
                key={record.id}
                className="flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-800/80 transition-all text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  {member?.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {member?.name ? member.name[0] : 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-slate-100 font-medium truncate flex items-center space-x-1.5">
                      <span className="truncate">{member?.name || record.memberId}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({record.memberId})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                      <span>{member?.department || 'Member'}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        {getMethodIcon(record.method)}
                        <span className="capitalize">{record.method?.replace('_', ' ') || 'check-in'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-mono text-slate-200 font-medium">
                    {record.checkInTime || 'Checked in'}
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      record.status === 'present'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : record.status === 'late'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    {record.status.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
