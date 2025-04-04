import './globals.css';

import MiniKitProvider from '@/lib/minikit-provider';
import { Toaster } from '@/components/ui/toast/toaster';

export const metadata = {
  title: 'IntentPay',
  description: 'IntentPay – Driven by Purpose, Powered by Simplicity.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <MiniKitProvider>
        <body className="flex min-h-screen w-full flex-col">
          {children}
          <Toaster />
        </body>
      </MiniKitProvider>
    </html>
  );
}
