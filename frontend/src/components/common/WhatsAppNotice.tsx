import React from 'react';
import { MessageSquare, ExternalLink, ShieldAlert } from 'lucide-react';
import { useApiConfig } from '../../context/ApiConfigContext';

interface WhatsAppNoticeProps {
  compact?: boolean;
}

export const WhatsAppNotice: React.FC<WhatsAppNoticeProps> = ({ compact = false }) => {
  const { openApiGuide } = useApiConfig();

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong className="font-semibold text-emerald-950">WhatsApp Cloud API:</strong> Integration layer active. Messages logged internally via Spring Boot REST.
          </span>
        </div>
        <button
          onClick={openApiGuide}
          className="text-emerald-800 hover:text-emerald-950 underline font-medium whitespace-nowrap shrink-0 flex items-center gap-1"
        >
          View Spring Contract
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Official WhatsApp Business Platform Integration</h4>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">Ready for Cloud API</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Fit Connect prepares full webhook handlers and template dispatching for Meta&apos;s WhatsApp Cloud API. 
            All outbound interactions in this environment are logged to the audit database via 
            <code className="mx-1 px-1 py-0.5 bg-slate-200 rounded font-mono text-[11px] text-slate-800">POST /api/communications</code>. 
            To prevent false delivery claims, messages without a live configured WhatsApp access token remain flagged as <strong className="font-semibold text-slate-800">&quot;Logged Internally&quot;</strong> until the Spring Boot webhook service is active.
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>No live SMS charges in demo sandbox</span>
            </div>
            <button
              onClick={openApiGuide}
              className="text-emerald-700 hover:text-emerald-800 font-medium underline inline-flex items-center gap-1"
            >
              See WhatsApp Spring Service DTO
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
