import type { AppSettings, LeadSession, AnalyticsSummary, SmartCardData } from '@/types';

// ─── Demo Smart Cards (shown when AI agent speaks) ────────────────────────────
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
  company_logo_url: '/logo-placeholder.svg',
  company_name: 'City 360',
  company_name_ar: 'سيتي 360',
  project_name: 'The Grand Tower',
  project_name_ar: 'البرج الكبير',
  coohom_url: 'https://www.coohom.com/pub/tool/panorama/index',
  whatsapp_number: '201000000000',
  ai_api_key: '',
  ai_connection_method: 'vapi',
  ai_agent_name: 'Layla',
  primary_color: '#6366f1',
};

// ─── Mock Lead Sessions ───────────────────────────────────────────────────────
export const mockSessions: LeadSession[] = [
  {
    id: 'sess_001',
    created_at: '2026-08-11T09:14:00Z',
    duration_seconds: 342,
    visitor_name: 'Ahmed Hassan',
    visitor_phone: '+20 100 123 4567',
    conversation_summary:
      'Visitor asked about 2-bedroom apartment pricing and availability on floors 15-20. Interested in installment plans over 7 years. Requested a callback from the sales team. Mentioned budget range of EGP 3.5M–4.2M.',
    requested_details: [
      { key: 'Unit Type', value: '2-Bedroom Apartment' },
      { key: 'Preferred Floor', value: '15–20' },
      { key: 'Budget', value: 'EGP 3.5M – 4.2M' },
      { key: 'Payment Plan', value: '7-Year Installment' },
    ],
    status: 'new',
    language: 'ar',
  },
  {
    id: 'sess_002',
    created_at: '2026-08-11T10:02:00Z',
    duration_seconds: 218,
    visitor_name: 'Sara Khalil',
    visitor_phone: '+20 111 987 6543',
    conversation_summary:
      'Interested in studio and 1-bedroom units for investment purposes. Asked about ROI and rental yields. Showed interest in pool-view units. Ready to book a site visit.',
    requested_details: [
      { key: 'Unit Type', value: 'Studio / 1-Bedroom' },
      { key: 'Purpose', value: 'Investment' },
      { key: 'View Preference', value: 'Pool View' },
      { key: 'Next Step', value: 'Site Visit' },
    ],
    status: 'contacted',
    language: 'en',
  },
  {
    id: 'sess_003',
    created_at: '2026-08-10T16:45:00Z',
    duration_seconds: 487,
    visitor_name: 'Omar Farouk',
    visitor_phone: '+20 122 555 1234',
    conversation_summary:
      'Asked detailed questions about finishing specs, smart home features, and parking allocation. Compared with another project. Needs to discuss with family before deciding.',
    requested_details: [
      { key: 'Unit Type', value: '3-Bedroom Penthouse' },
      { key: 'Special Features', value: 'Smart Home, 2 Parking Spots' },
      { key: 'Decision Timeline', value: '2–3 Weeks' },
    ],
    status: 'qualified',
    language: 'en',
  },
  {
    id: 'sess_004',
    created_at: '2026-08-10T11:20:00Z',
    duration_seconds: 95,
    visitor_name: 'Nour Elbaz',
    visitor_phone: undefined,
    conversation_summary:
      'Short session. Visitor browsed the tour and asked about the project location. No specific unit inquired. Directed to WhatsApp for further details.',
    requested_details: [{ key: 'Interest', value: 'Project Location & General Info' }],
    status: 'new',
    language: 'ar',
  },
  {
    id: 'sess_005',
    created_at: '2026-08-09T14:10:00Z',
    duration_seconds: 610,
    visitor_name: 'Karim Mansour',
    visitor_phone: '+20 100 777 8888',
    conversation_summary:
      'Very engaged session. Discussed downpayment options (10% vs 15%), delivery date, and contract terms. Requested a detailed brochure and price list. High-priority lead.',
    requested_details: [
      { key: 'Unit Type', value: '2-Bedroom' },
      { key: 'Downpayment', value: '10% preferred' },
      { key: 'Delivery', value: 'Q4 2027' },
      { key: 'Documents', value: 'Brochure + Price List' },
    ],
    status: 'qualified',
    language: 'ar',
  },
  {
    id: 'sess_006',
    created_at: '2026-08-09T09:05:00Z',
    duration_seconds: 290,
    visitor_name: 'Fatma Youssef',
    visitor_phone: '+20 111 222 3344',
    conversation_summary:
      'Asked about amenities — gym, swimming pool, kids area. Very interested in family-friendly aspect. Requested a brochure.',
    requested_details: [
      { key: 'Unit Type', value: '3-Bedroom' },
      { key: 'Amenities Focus', value: 'Family-Friendly' },
    ],
    status: 'closed',
    language: 'ar',
  },
];

// ─── Mock Analytics ───────────────────────────────────────────────────────────
export const mockAnalytics: AnalyticsSummary = {
  total_visitors: 1284,
  avg_session_duration: 324,
  total_leads: 87,
  conversion_rate: 6.77,
  daily: [
    { date: '2026-08-05', visitor_count: 152, avg_session_duration: 280, leads_count: 9 },
    { date: '2026-08-06', visitor_count: 178, avg_session_duration: 310, leads_count: 12 },
    { date: '2026-08-07', visitor_count: 134, avg_session_duration: 295, leads_count: 8 },
    { date: '2026-08-08', visitor_count: 201, avg_session_duration: 340, leads_count: 15 },
    { date: '2026-08-09', visitor_count: 167, avg_session_duration: 318, leads_count: 11 },
    { date: '2026-08-10', visitor_count: 145, avg_session_duration: 302, leads_count: 10 },
    { date: '2026-08-11', visitor_count: 307, avg_session_duration: 412, leads_count: 22 },
  ],
};
