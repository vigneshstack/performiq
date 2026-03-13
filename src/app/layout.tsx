import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['300', '400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PerformIQ — Employee Assessment Platform',
    template: '%s | PerformIQ',
  },
  description:
    'PerformIQ is a modern employee assessment and performance management platform. Track goals, run assessments, and drive team performance.',
  openGraph: {
    type: 'website',
    title: 'PerformIQ — Employee Assessment Platform',
    description: 'Modern employee assessment and performance management.',
    siteName: 'PerformIQ',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-sans antialiased bg-zinc-50 text-zinc-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
