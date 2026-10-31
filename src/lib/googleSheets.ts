import { AttendanceRecord, Member, AttendanceSession, AttendanceStats } from '../types/attendance';

export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsExported: number;
}

/**
 * Creates a formatted Google Sheet and exports attendance records
 */
export async function exportToGoogleSheets(
  accessToken: string,
  title: string,
  records: AttendanceRecord[],
  membersMap: Map<string, Member>,
  sessionsMap: Map<string, AttendanceSession>,
  stats?: AttendanceStats
): Promise<ExportResult> {
  // Step 1: Create the spreadsheet
  const createPayload = {
    properties: {
      title: title || `AttendEase - Attendance Report ${new Date().toLocaleDateString()}`,
    },
    sheets: [
      {
        properties: {
          sheetId: 0,
          title: 'Attendance Records',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          sheetId: 1,
          title: 'Summary & Metrics',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errorText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // Step 2: Prepare Attendance rows
  const headers = [
    'Date',
    'Session Name',
    'Member ID',
    'Full Name',
    'Email',
    'Department',
    'Role',
    'Attendance Status',
    'Check-In Time',
    'Method',
    'Admin Notes',
  ];

  const rows: any[][] = [headers];

  records.forEach((record) => {
    const member = membersMap.get(record.memberId);
    const session = sessionsMap.get(record.sessionId);
    const memberName = member ? member.name : 'Unknown';
    const memberEmail = member ? member.email : '';
    const memberDept = member ? member.department : '';
    const memberRole = member ? member.role : '';
    const sessionName = session ? session.name : record.sessionId;
    const formattedStatus = record.status.toUpperCase();
    const checkIn = record.checkInTime || (record.status === 'absent' ? 'Not Checked In' : '-');
    const methodStr = record.method ? record.method.replace('_', ' ').toUpperCase() : '-';

    rows.push([
      record.date,
      sessionName,
      record.memberId,
      memberName,
      memberEmail,
      memberDept,
      memberRole,
      formattedStatus,
      checkIn,
      methodStr,
      record.notes || '',
    ]);
  });

  // Step 3: Append attendance records
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Attendance Records'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!appendRes.ok) {
    const errText = await appendRes.text();
    throw new Error(`Failed to append data to Google Sheet: ${errText}`);
  }

  // Step 4: Add Summary Sheet rows
  const summaryHeaders = ['Metric', 'Value', 'Generated At'];
  const nowStr = new Date().toLocaleString();
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  const excused = records.filter((r) => r.status === 'excused').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const rate = total > 0 ? `${(((present + late) / total) * 100).toFixed(1)}%` : '0%';

  const summaryRows = [
    summaryHeaders,
    ['Total Members Tracked', total, nowStr],
    ['Present Count', present, ''],
    ['Late Count', late, ''],
    ['Excused Count', excused, ''],
    ['Absent Count', absent, ''],
    ['Effective Attendance Rate', rate, ''],
    ['Average Check-In Time', stats?.avgCheckInTime || 'N/A', ''],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Summary & Metrics'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: summaryRows,
      }),
    }
  );

  // Step 5: Format headers with batchUpdate
  try {
    const formatPayload = {
      requests: [
        // Style header on Sheet 0
        {
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.08, green: 0.18, blue: 0.36 }, // dark navy
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true,
                  fontSize: 11,
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        // Style header on Sheet 1
        {
          repeatCell: {
            range: {
              sheetId: 1,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.1, green: 0.3, blue: 0.2 }, // forest green
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true,
                  fontSize: 11,
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
      ],
    };

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formatPayload),
    });
  } catch (fmtErr) {
    // If formatting fails, data is still exported successfully
    console.warn('Formatting request non-critical warning:', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowsExported: records.length,
  };
}

/**
 * Downloads attendance data as CSV for offline backup
 */
export function downloadAttendanceCSV(
  records: AttendanceRecord[],
  membersMap: Map<string, Member>,
  sessionsMap: Map<string, AttendanceSession>,
  filename = 'attendance-records.csv'
) {
  const headers = [
    'Date',
    'Session',
    'Member ID',
    'Full Name',
    'Email',
    'Department',
    'Role',
    'Status',
    'Check-In Time',
    'Method',
    'Notes',
  ];

  const lines = [headers.join(',')];

  records.forEach((record) => {
    const member = membersMap.get(record.memberId);
    const session = sessionsMap.get(record.sessionId);
    const row = [
      `"${record.date}"`,
      `"${session?.name || record.sessionId}"`,
      `"${record.memberId}"`,
      `"${member?.name || 'Unknown'}"`,
      `"${member?.email || ''}"`,
      `"${member?.department || ''}"`,
      `"${member?.role || ''}"`,
      `"${record.status.toUpperCase()}"`,
      `"${record.checkInTime || ''}"`,
      `"${record.method || ''}"`,
      `"${(record.notes || '').replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
