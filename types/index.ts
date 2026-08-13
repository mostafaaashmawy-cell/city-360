// ─── Agent States ────────────────────────────────────────────────────────────
export type AgentState = 'idle' | 'listening' | 'processing' | 'speaking';

// ─── Smart Card Data ─────────────────────────────────────────────────────────
export interface SmartCardData {
  id: string;
  label: string;
  labelAr: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'rose';
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  id?: string;
  company_logo_url: string;
  company_name: string;
  company_name_ar: string;
  project_name: string;
  project_name_ar: string;
  coohom_url: string;
  whatsapp_number: string;
  ai_api_key: string;
  ai_connection_method: string;
  ai_agent_name: string;
  primary_color: string;
}

// ─── Session / Lead ──────────────────────────────────────────────────────────
export interface LeadSession {
  id: string;
  created_at: string;
  duration_seconds: number;
  visitor_name?: string;
  visitor_phone?: string;
  conversation_summary: string;
  requested_details: RequestedDetail[];
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  language: 'en' | 'ar';
}

export interface RequestedDetail {
  key: string;
  value: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface DailyAnalytics {
  date: string;
  visitor_count: number;
  avg_session_duration: number;
  leads_count: number;
}

export interface AnalyticsSummary {
  total_visitors: number;
  avg_session_duration: number;
  total_leads: number;
  conversion_rate: number;
  daily: DailyAnalytics[];
}

// ─── Language ─────────────────────────────────────────────────────────────────
export type Language = 'en' | 'ar';
