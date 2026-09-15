import './globals.css';
import { StudyContextProvider } from '../context/StudyContext';
import { TaskNotifications } from '@/components/TaskNotifications';
import GlobalModals from '@/components/layout/GlobalModals';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';

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
      <body suppressHydrationWarning>
        <StudyContextProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <TaskNotifications />
          <GlobalModals />
          {children}
        </StudyContextProvider>
      </body>
    </html>
  );
}
