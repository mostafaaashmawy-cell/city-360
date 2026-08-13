'use client';

import type { LeadSession } from '@/types';
import { X, Clock, Calendar, Phone, MessageSquare, Tag } from 'lucide-react';
import { useEffect } from 'react';

interface SessionDetailProps {
  session: LeadSession;
  onClose: () => void;
}

const statusStyles = {
  new: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  contacted: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  qualified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-white/5 text-white/40 border-white/10',
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function SessionDetail({ session, onClose }: SessionDetailProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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
            <h2 className="text-white font-semibold text-base">
              {session.visitor_name ?? 'Anonymous Visitor'}
            </h2>
            <p className="text-white/40 text-xs mt-0.5">Session #{session.id.split('_')[1]}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusStyles[session.status]}`}
            >
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Clock className="w-3 h-3" />
              {formatDuration(session.duration_seconds)}
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

          {/* Conversation Summary */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Conversation Summary</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {session.conversation_summary}
            </p>
          </div>

          {/* Requested Details */}
          {session.requested_details.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Requested Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {session.requested_details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-3"
                    style={{
                      background: 'rgba(6,182,212,0.07)',
                      border: '1px solid rgba(6,182,212,0.15)',
                    }}
                  >
                    <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-0.5">
                      {detail.key}
                    </p>
                    <p className="text-white text-sm font-semibold">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-4 border-t border-white/5 flex gap-3 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {session.visitor_phone && (
            <a
              href={`https://wa.me/${session.visitor_phone.replace(/\D/g, '')}?text=Hello ${session.visitor_name ?? ''}, following up from City 360 regarding your virtual tour session.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp Follow-up
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
