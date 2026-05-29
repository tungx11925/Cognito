import './globals.css';
import { StudyContextProvider } from '../context/StudyContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StudyContextProvider>
          {children}
        </StudyContextProvider>
      </body>
    </html>
  );
}
