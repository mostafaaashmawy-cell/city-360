'use client';

import type { LeadSession, LeadStatus } from '@/types';
import {
  X,
  Clock,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { statusStyles, statusLabels } from './LeadsTable';

interface SessionDetailProps {
  session: LeadSession;
  onClose: () => void;
  onStatusChange?: (sessionId: string, newStatus: LeadStatus) => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function SessionDetail({
  session,
  onClose,
  onStatusChange,
}: SessionDetailProps) {
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(session.status);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleStatusChange = (newStatus: LeadStatus) => {
    setCurrentStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(session.id, newStatus);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg flex flex-col overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(12,12,24,0.98)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold text-base">
                {session.visitor_name ?? 'Anonymous Visitor'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <MessageCircle className="w-3 h-3" /> WhatsApp Lead
              </span>
            </div>
            <p className="text-white/40 text-xs mt-0.5">
              Project: {session.project_name || 'Virtual Tour'} · Session #{session.id.split('_')[1]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status Changer Section */}
          <div className="space-y-2 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/70">Lead Status Pipeline:</label>
              <span className="text-[11px] text-white/40">Select to update status</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {(['new', 'qualified', 'need_assistance', 'contacted', 'closed'] as const).map(
                (st) => {
                  const isSelected = currentStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-1.5 border ${
                        isSelected
                          ? `${statusStyles[st]} shadow-md`
                          : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {st === 'new' && <Eye className="w-3 h-3 flex-shrink-0" />}
                      {st === 'qualified' && <Sparkles className="w-3 h-3 flex-shrink-0" />}
                      {st === 'need_assistance' && (
                        <AlertCircle className="w-3 h-3 flex-shrink-0 text-amber-400" />
                      )}
                      {st === 'closed' && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{statusLabels[st].en}</span>
                    </button>
                  );
                }
              )}
            </div>
            <p className="text-[11px] text-white/40 pt-1">
              💡 {statusLabels[currentStatus].desc}
            </p>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Clock className="w-3 h-3" />
              {formatDuration(session.duration_seconds)} tour duration
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Calendar className="w-3 h-3" />
              {new Date(session.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {session.visitor_phone && (
              <a
                href={`tel:${session.visitor_phone}`}
                className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-lg border border-cyan-400/20 hover:bg-cyan-400/15 transition-colors"
              >
                <Phone className="w-3 h-3" />
                {session.visitor_phone}
              </a>
            )}
          </div>

          {/* WhatsApp Direct Action Button */}
          {session.visitor_phone && (
            <a
              href={`https://wa.me/${session.visitor_phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold text-white transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
            >
              <MessageCircle className="w-4 h-4" />
              Reply on WhatsApp
            </a>
          )}

          {/* Conversation Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              INQUIRY & CONVERSATION SUMMARY
            </div>
            <div
              className="p-4 rounded-xl text-xs text-white/80 leading-relaxed"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {session.conversation_summary}
            </div>
          </div>

          {/* Requested Details */}
          {session.requested_details.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                CAPTURED REQUIREMENTS & PREFERENCES
              </div>
              <div className="space-y-1.5">
                {session.requested_details.map((detail, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl text-xs"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span className="text-white/40">{detail.key}</span>
                    <span className="text-white font-medium">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
