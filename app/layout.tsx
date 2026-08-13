import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/context/SettingsContext';
import { AgentProvider } from '@/context/AgentContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'City Scale — Virtual Property Tour',
  description:
    'Experience immersive 360° virtual property tours with AI-powered guidance by City Scale — Physical & Visual Modeling Co.',
  keywords: 'virtual tour, real estate, property, 360, AI, sales agent, City Scale',
  openGraph: {
    title: 'City Scale — Virtual Property Tour',
    description: 'AI-powered virtual real estate tours by City Scale',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased`}>
        <SettingsProvider>
          <AgentProvider>{children}</AgentProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
