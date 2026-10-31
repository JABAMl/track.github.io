import React, { useState, useEffect } from 'react';
import { QrCode, Printer, Download, Search, X, Check } from 'lucide-react';
import { Member } from '../types/attendance';
import { generateQRCodeDataUrl } from '../lib/qrHelper';

interface QRBadgeModalProps {
  members: Member[];
  onClose?: () => void;
}

export const QRBadgeModal: React.FC<QRBadgeModalProps> = ({ members }) => {
  const [selectedMember, setSelectedMember] = useState<Member>(members[0] || null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedMember) {
      // Encode member ID and minimal info into QR
      const qrPayload = JSON.stringify({
        id: selectedMember.id,
        name: selectedMember.name,
      });
      generateQRCodeDataUrl(qrPayload).then((dataUrl) => {
        setQrCodeDataUrl(dataUrl);
      });
    }
  }, [selectedMember]);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    if (selectedMember) {
      navigator.clipboard.writeText(selectedMember.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <span>Digital ID & QR Badges</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate and print scannable attendance badges for quick kiosk check-in.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print Badge Card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Member Selector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-center justify-between ${
                  selectedMember?.id === m.id
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="truncate">
                  <div className="truncate font-semibold">{m.name}</div>
                  <div
                    className={`text-[10px] truncate ${
                      selectedMember?.id === m.id ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {m.id} • {m.department}
                  </div>
                </div>
                <QrCode className="w-3.5 h-3.5 flex-shrink-0 opacity-70 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Badge Preview Card */}
        {selectedMember && (
          <div className="lg:col-span-2 flex flex-col items-center justify-center">
            {/* Visual Badge Frame */}
            <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center text-white">
              {/* Lanyard Slot Cutout */}
              <div className="w-14 h-2.5 bg-slate-800 rounded-full mx-auto mb-4 border border-slate-700/60" />

              {/* Organization Header */}
              <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold mb-4">
                Official Access & Attendance Pass
              </div>

              {/* Member Photo */}
              <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-400/60 shadow-lg mb-3">
                {selectedMember.avatarUrl ? (
                  <img
                    src={selectedMember.avatarUrl}
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-700 flex items-center justify-center text-3xl font-bold text-white">
                    {selectedMember.name[0]}
                  </div>
                )}
              </div>

              {/* Member Info */}
              <h3 className="text-xl font-bold text-white">{selectedMember.name}</h3>
              <p className="text-xs text-indigo-300 font-medium">{selectedMember.role}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedMember.department}</p>

              {/* Scannable QR Code */}
              <div className="my-5 p-3 bg-white rounded-2xl inline-block shadow-inner">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR code for ${selectedMember.id}`}
                    className="w-40 h-40 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-500 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* ID and PIN display */}
              <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">ID: {selectedMember.id}</span>
                {selectedMember.pin && (
                  <span className="text-emerald-400">PIN: {selectedMember.pin}</span>
                )}
              </div>
            </div>

            {/* Quick action buttons under preview */}
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handleCopyId}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{copied ? 'Copied ID!' : 'Copy Member ID'}</span>
              </button>

              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`badge-${selectedMember.id}.png`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download QR PNG</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
