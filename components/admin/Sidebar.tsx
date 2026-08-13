'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  BarChart2,
  Users,
  Eye,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';

const navItems = [
  {
    href: '/admin/analytics',
    icon: BarChart2,
    label: 'Analytics',
    labelAr: 'الإحصائيات',
  },
  {
    href: '/admin/leads',
    icon: Users,
    label: 'Leads & Conversations',
    labelAr: 'العملاء والمحادثات',
  },
  {
    href: '/admin/settings',
    icon: Settings,
    label: 'Settings',
    labelAr: 'الإعدادات',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { settings, language } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const companyName = language === 'ar' ? settings.company_name_ar : settings.company_name;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            {companyName.charAt(0)}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{companyName}</p>
            <p className="text-white/40 text-xs">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const label = language === 'ar' ? item.labelAr : item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.1))',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }
                  : {}
              }
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70'}`}
              />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <Eye className="w-4 h-4 text-white/40" />
          {language === 'ar' ? 'عرض الموقع' : 'View Customer Site'}
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut className="w-4 h-4" />
          {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
        style={{
          background: 'rgba(10,10,20,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors"
        style={{
          background: 'rgba(10,10,20,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col"
            style={{
              background: 'rgba(10,10,20,0.98)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
