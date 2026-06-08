import './globals.css';
import { StudyContextProvider } from '../context/StudyContext';
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body>
        <StudyContextProvider>
          {children}
        </StudyContextProvider>
      </body>
    </html>
  );
}
