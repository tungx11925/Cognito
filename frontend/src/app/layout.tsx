import './globals.css';
import { StudyContextProvider } from '../context/StudyContext';
import { TaskNotifications } from '@/components/TaskNotifications';
import GlobalModals from '@/components/layout/GlobalModals';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Cognito - Nền Tảng Học Tập Thông Minh',
  description: 'Trợ lý học tập AI & Thẻ ghi nhớ thông minh',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body className={cn(inter.variable, outfit.variable, "min-h-screen font-sans antialiased bg-background text-foreground")} suppressHydrationWarning>
        <StudyContextProvider>
          <Toaster position="top-center" reverseOrder={false} 
            toastOptions={{
              className: 'font-sans',
              style: {
                borderRadius: '12px',
                background: '#fff',
                color: '#333',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
              },
            }}
          />
          <TaskNotifications />
          <GlobalModals />
          {children}
        </StudyContextProvider>
      </body>
    </html>
  );
}
