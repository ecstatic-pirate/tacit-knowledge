import type { Metadata } from 'next';
import { Libre_Baskerville, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { AppProvider } from '@/context/app-context';

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
});

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
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
      <body className={`${sourceSans3.variable} ${libreBaskerville.variable} antialiased min-h-screen bg-background font-sans`}>
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
