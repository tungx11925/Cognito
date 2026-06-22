import './globals.css';
import { StudyContextProvider } from '../context/StudyContext';
import { TaskNotifications } from '@/components/TaskNotifications';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body>
        <StudyContextProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <TaskNotifications />
          {children}
        </StudyContextProvider>
      </body>
    </html>
  );
}
