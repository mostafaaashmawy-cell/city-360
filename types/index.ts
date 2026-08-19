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

// ─── Gemini Live Voices & Tones ───────────────────────────────────────────────
export type GeminiVoice = 'Aoede' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
export type GeminiTone = 'friendly' | 'professional' | 'consultative' | 'energetic';

// ─── Project Model (Multi-Project Support) ────────────────────────────────────
export interface Project {
  id: string;
  slug: string;                     // e.g. "grand-tower", "marina-bay"
  is_active: boolean;               // Turn on/off public preview
  company_name: string;
  company_name_ar: string;
  project_name: string;
  project_name_ar: string;
  virtual_tour_url: string;         // Renamed from coohom_url
  coohom_url?: string;              // Backwards compatibility alias
  company_logo_url: string;         // Base64 Data URI or Image URL
  whatsapp_number: string;
  primary_color: string;

  // Gemini AI Voice & Persona Settings
  ai_voice: GeminiVoice;
  ai_tone: GeminiTone;
  ai_agent_name: string;
  ai_prompt: string;                // Project knowledge base & custom sales instructions

  created_at?: string;
  updated_at?: string;
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  id?: string;
  company_logo_url: string;
  company_name: string;
  company_name_ar: string;
  project_name: string;
  project_name_ar: string;
  coohom_url: string;               // Kept for backwards compatibility
  virtual_tour_url?: string;
  whatsapp_number: string;
  ai_api_key: string;
  ai_connection_method: string;
  ai_agent_name: string;
  ai_voice?: GeminiVoice;
  ai_tone?: GeminiTone;
  ai_prompt?: string;
  primary_color: string;
  projects?: Project[];
  active_project_id?: string;
}

// ─── Session / Lead ──────────────────────────────────────────────────────────
export interface LeadSession {
  id: string;
  project_id?: string;              // Project ID for multi-project attribution
  project_slug?: string;            // Project Slug for easy filtering
  project_name?: string;
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
  project_id?: string;
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
