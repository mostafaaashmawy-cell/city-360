import type { Metadata } from 'next';
import Sidebar from '@/components/admin/Sidebar';

export const metadata: Metadata = {
  title: 'City 360 Admin — Dashboard',
  description: 'Admin dashboard for City 360 virtual tour management',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: '#0a0a14', overflowY: 'auto', overflowX: 'hidden' }}
    >
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
