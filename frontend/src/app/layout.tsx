import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Away Intelligence',
  description: 'Marketing Intelligence and Workspace Intent Platform for away.center',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
