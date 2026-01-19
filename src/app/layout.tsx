import type { Metadata } from 'next';
import { Inter, Libre_Baskerville } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { AppProvider } from '@/context/app-context';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Tacit',
  description: 'Capture expert knowledge before it walks out the door.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${libreBaskerville.variable} antialiased min-h-screen bg-background font-sans`}>
        <AppProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
