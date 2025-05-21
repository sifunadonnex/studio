
import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Using Inter for clean sans-serif
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import { getUserSession, UserProfile } from '@/actions/auth'; // Import session utilities
import { SessionProvider } from '@/contexts/session-context'; // Import SessionProvider

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Changed from Geist to Inter
});


export const metadata: Metadata = {
  title: 'Top Autocorrect Garage - Ngong, Kajiado County',
  description: 'Premier vehicle maintenance and repair services in Ngong. Book appointments, manage subscriptions, and get predictive maintenance alerts.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session: UserProfile | null = await getUserSession();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <SessionProvider value={session}>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
