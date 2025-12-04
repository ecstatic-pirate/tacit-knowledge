import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { AppProvider } from '@/context/app-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Tacit Knowledge Platform',
  description: 'Preserve expertise. Capture insight. Enable intelligence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased min-h-screen bg-background`}>
        <AppProvider>
          <ToastProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-secondary/20">
                {children}
              </main>
            </div>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
