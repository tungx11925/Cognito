import './globals.css';
import { StudyContextProvider } from '../context/StudyContext';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StudyContextProvider>
          {children}
          <ProfileSettingsModal />
        </StudyContextProvider>
      </body>
    </html>
  );
}
