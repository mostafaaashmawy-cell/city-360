import type { AppSettings, LeadSession, AnalyticsSummary, SmartCardData, Project } from '@/types';

// ─── Default System Prompt Template for Projects ─────────────────────────────
export const DEFAULT_AI_PROMPT = `You are Layla, an expert real estate sales agent representing City Scale Physical & Visual Modeling Co.
Speak in a warm, professional, and consultative manner. You seamlessly speak Arabic (Egyptian dialect) and English.
Calculate and present financial installments based on a 7-year installment plan with a 10% downpayment.
When discussing prices, unit areas, or payment schedules, you MUST trigger the 'show_dynamic_smart_cards' tool to show the cards visually on screen.`;

// ─── Initial Mock Projects ────────────────────────────────────────────────────
export const mockProjects: Project[] = [
  {
    id: 'proj_grand_tower',
    slug: 'grand-tower',
    is_active: true,
    company_name: 'City Scale',
    company_name_ar: 'سيتي سكيل',
    project_name: 'The Grand Tower',
    project_name_ar: 'البرج الكبير',
    virtual_tour_url:
      'https://www.coohom.com/pub/tool/panorama/aiwalking?obsPlanId=3FO3DBYBNCU7&locale=en_US',
    company_logo_url: '/city-scale-logo.png',
    whatsapp_number: '201000000000',
    primary_color: '#6366f1',
    ai_voice: 'Aoede',
    ai_tone: 'consultative',
    ai_agent_name: 'Layla',
    ai_prompt: `You are Layla, the official sales advisor for "The Grand Tower" by City Scale.
The Grand Tower is a luxury 42-story residential tower located in the heart of New Cairo with full panoramic skyline views.
Key Specs:
- 2-Bedroom Apartments: 142 m², starting at EGP 3.5M (Downpayment 10% = 350,000 EGP, 12,500 EGP/month over 7 years).
- 3-Bedroom Penthouses: 220 m², starting at EGP 6.2M.
- Delivery: Q4 2027, Fully Finished with Smart Home automation.
- Amenities: Infinity pool, 2 private parking spots per unit, fitness wellness club.
Always trigger 'show_dynamic_smart_cards' when quoting prices or payment terms.`,
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'proj_marina_bay',
    slug: 'marina-bay',
    is_active: true,
    company_name: 'City Scale',
    company_name_ar: 'سيتي سكيل',
    project_name: 'Marina Bay Luxury Residences',
    project_name_ar: 'مارينا باي ريزيدنسز',
    virtual_tour_url:
      'https://www.coohom.com/pub/tool/panorama/aiwalking?obsPlanId=3FO3DBYBNCU7&locale=en_US',
    company_logo_url: '/city-scale-logo.png',
    whatsapp_number: '201000000000',
    primary_color: '#06b6d4',
    ai_voice: 'Kore',
    ai_tone: 'friendly',
    ai_agent_name: 'Sarah',
    ai_prompt: `You are Sarah, sales consultant for "Marina Bay Luxury Residences" by City Scale.
Marina Bay is a waterfront residential community with private lagoon views on the North Coast.
Key Specs:
- 1-Bedroom Chalets: 85 m², starting at EGP 2.2M (Downpayment 10% = 220,000 EGP, 8,200 EGP/month over 7 years).
- 3-Bedroom Lagoon Villas: 195 m², starting at EGP 5.4M.
- Delivery: Summer 2026, Ultra Super Lux.
Always trigger 'show_dynamic_smart_cards' when discussing numbers and units.`,
    created_at: '2026-08-05T12:00:00Z',
  },
];

// ─── Demo Smart Cards ─────────────────────────────────────────────────────────
export const DEMO_SMART_CARDS: SmartCardData[] = [
  {
    id: 'dp',
    label: 'Downpayment',
    labelAr: 'مقدم الحجز',
    value: 'EGP 350,000 (10%)',
    icon: '💰',
    color: 'green',
  },
  {
    id: 'inst',
    label: 'Installments',
    labelAr: 'الأقساط الشهرية',
    value: 'EGP 12,500 / month over 7 years',
    icon: '📅',
    color: 'blue',
  },
  {
    id: 'area',
    label: 'Unit Area',
    labelAr: 'مساحة الوحدة',
    value: '142 m² — 2 Bed, 2 Bath',
    icon: '📐',
    color: 'purple',
  },
  {
    id: 'del',
    label: 'Delivery',
    labelAr: 'موعد التسليم',
    value: 'Q4 2027 — Fully Finished',
    icon: '🏗️',
    color: 'orange',
  },
  {
    id: 'kw',
    label: 'Highlights',
    labelAr: 'المميزات',
    value: 'Pool View · Smart Home · 2 Parking',
    icon: '✨',
    color: 'rose',
  },
];

// ─── Default App Settings ─────────────────────────────────────────────────────
export const mockSettings: AppSettings = {
  id: '1',
  company_logo_url: '/city-scale-logo.png',
  company_name: 'City Scale',
  company_name_ar: 'سيتي سكيل',
  project_name: 'The Grand Tower',
  project_name_ar: 'البرج الكبير',
  coohom_url:
    'https://www.coohom.com/pub/tool/panorama/aiwalking?obsPlanId=3FO3DBYBNCU7&locale=en_US',
  virtual_tour_url:
    'https://www.coohom.com/pub/tool/panorama/aiwalking?obsPlanId=3FO3DBYBNCU7&locale=en_US',
  whatsapp_number: '201000000000',
  ai_api_key: '',
  ai_connection_method: 'gemini',
  ai_agent_name: 'Layla',
  ai_voice: 'Aoede',
  ai_tone: 'consultative',
  ai_prompt: DEFAULT_AI_PROMPT,
  primary_color: '#6366f1',
  projects: mockProjects,
  active_project_id: 'proj_grand_tower',
};

// ─── Mock Lead Sessions (Strictly Visitors who clicked WhatsApp) ──────────────
export const mockSessions: LeadSession[] = [
  {
    id: 'sess_001',
    project_id: 'proj_grand_tower',
    project_slug: 'grand-tower',
    project_name: 'The Grand Tower',
    created_at: '2026-08-19T10:14:00Z',
    duration_seconds: 342,
    visitor_name: 'Ahmed Hassan',
    visitor_phone: '+20 100 123 4567',
    conversation_summary:
      'Visitor clicked WhatsApp inquiry for 2-bedroom apartment pricing on floors 15-20 in The Grand Tower with 7-year installment plan. Budget: EGP 3.5M–4.2M.',
    requested_details: [
      { key: 'Unit Type', value: '2-Bedroom Apartment' },
      { key: 'Preferred Floor', value: '15–20' },
      { key: 'Budget', value: 'EGP 3.5M – 4.2M' },
      { key: 'Payment Plan', value: '7-Year Installment' },
    ],
    status: 'new', // Unopened by admin yet
    is_opened: false,
    whatsapp_clicked: true,
    lead_trigger: 'whatsapp_button_click',
    language: 'ar',
  },
  {
    id: 'sess_002',
    project_id: 'proj_marina_bay',
    project_slug: 'marina-bay',
    project_name: 'Marina Bay Luxury Residences',
    created_at: '2026-08-18T16:02:00Z',
    duration_seconds: 218,
    visitor_name: 'Sara Khalil',
    visitor_phone: '+20 111 987 6543',
    conversation_summary:
      'Clicked WhatsApp inquiry for 1-bedroom lagoon chalets in Marina Bay. Asking about rental yields and pool access.',
    requested_details: [
      { key: 'Unit Type', value: 'Lagoon Chalet' },
      { key: 'Purpose', value: 'Investment' },
      { key: 'View Preference', value: 'Lagoon View' },
    ],
    status: 'qualified', // High buying signals (specific unit, budget, timeline)
    is_opened: true,
    whatsapp_clicked: true,
    lead_trigger: 'whatsapp_button_click',
    language: 'en',
  },
  {
    id: 'sess_003',
    project_id: 'proj_grand_tower',
    project_slug: 'grand-tower',
    project_name: 'The Grand Tower',
    created_at: '2026-08-17T14:35:00Z',
    duration_seconds: 487,
    visitor_name: 'Tarek Mansour',
    visitor_phone: '+20 122 555 9876',
    conversation_summary:
      'Visitor requested a custom 10-year flexible payment plan with bullet payments, and inquired about merging two adjacent 2-bedroom units into a large suite.',
    requested_details: [
      { key: 'Special Request', value: '10-Year Custom Payment Plan' },
      { key: 'Customization', value: 'Merge 2 adjacent units on 25th floor' },
      { key: 'Escalation', value: 'Senior Sales Director approval needed' },
    ],
    status: 'need_assistance', // Needs special payment plan / custom inquiry
    is_opened: true,
    whatsapp_clicked: true,
    lead_trigger: 'whatsapp_button_click',
    language: 'ar',
  },
  {
    id: 'sess_004',
    project_id: 'proj_marina_bay',
    project_slug: 'marina-bay',
    project_name: 'Marina Bay Luxury Residences',
    created_at: '2026-08-16T11:20:00Z',
    duration_seconds: 156,
    visitor_name: 'Nour El-Din',
    visitor_phone: '+20 109 876 5432',
    conversation_summary:
      'Contract signed and reservation deposit paid for 3-Bedroom Villa in Marina Bay.',
    requested_details: [
      { key: 'Unit Type', value: '3-Bedroom Villa' },
      { key: 'Delivery', value: 'Summer 2026' },
      { key: 'Status', value: 'Contract Signed' },
    ],
    status: 'closed',
    is_opened: true,
    whatsapp_clicked: true,
    lead_trigger: 'whatsapp_button_click',
    language: 'ar',
  },
];

// ─── Analytics Seed Data (Leads strictly count WhatsApp button clicks) ────────
export const mockAnalytics: AnalyticsSummary = {
  total_visitors: 1284,
  avg_session_duration: 285,
  total_leads: 94, // WhatsApp click leads
  conversion_rate: 7.3, // (94 / 1284) * 100%
  daily: [
    { date: '2026-08-13', visitor_count: 142, avg_session_duration: 260, leads_count: 11 },
    { date: '2026-08-14', visitor_count: 168, avg_session_duration: 290, leads_count: 14 },
    { date: '2026-08-15', visitor_count: 195, avg_session_duration: 310, leads_count: 18 },
    { date: '2026-08-16', visitor_count: 210, avg_session_duration: 275, leads_count: 16 },
    { date: '2026-08-17', visitor_count: 180, avg_session_duration: 295, leads_count: 13 },
    { date: '2026-08-18', visitor_count: 205, avg_session_duration: 320, leads_count: 15 },
    { date: '2026-08-19', visitor_count: 184, avg_session_duration: 285, leads_count: 7 },
  ],
};
