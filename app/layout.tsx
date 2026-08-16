import type { Metadata } from 'next';
import './globals.css';
import { SettingsProvider } from '@/context/SettingsContext';
import { AgentProvider } from '@/context/AgentContext';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <SettingsProvider>
          <AgentProvider>{children}</AgentProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
